import { query } from '../config/postgres.js';
import { v4 as uuidv4 } from 'uuid';
import { mockOpenSearchIndex } from '../config/opensearch.js';
import { publishCartReservationEvent, publishNotificationEvent, publishStockUpdate } from '../services/kafkaProducer.js';
import { broadcastNotification } from '../services/sseService.js';

const RESERVATION_DURATION_MS = 10 * 60 * 1000; // 10 minutes
const REMINDER_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes left (8 minutes elapsed)

async function getOrCreateCart(userId) {
  const existing = await query('SELECT * FROM carts WHERE user_id = $1', [userId]);
  if (existing.rows.length > 0) {
    return existing.rows[0];
  }
  const cartId = uuidv4();
  const created = await query('INSERT INTO carts (id, user_id) VALUES ($1, $2) RETURNING *', [cartId, userId]);
  return created.rows[0] || { id: cartId, user_id: userId };
}

/**
 * Helper to check and maintain cart reservations
 * RULE: Reservation applies ONLY when the product has exactly 1 unit left in stock.
 * No visible timer or countdown banner is shown to customers.
 * At 8 minutes (2 min left), an in-app reminder + email is sent once per cart.
 * At 10 minutes, the reservation auto-expires and stock is released.
 */
async function getCartReservationInfo(userId, cartId, items = []) {
  if (items.length === 0) {
    return {
      active: false,
      hasReservedItem: false,
      secondsRemaining: 0,
      totalSeconds: 600,
      status: 'EMPTY',
      shouldRemind: false,
    };
  }

  const resRes = await query(
    `SELECT * FROM cart_reservations WHERE user_id = $1 AND cart_id = $2`,
    [userId, cartId]
  );

  const activeReservations = resRes.rows.filter(r => r.status === 'ACTIVE');

  // If no items have an active 1-unit reservation, return quiet state (no reservation)
  if (activeReservations.length === 0) {
    return {
      active: false,
      hasReservedItem: false,
      secondsRemaining: 0,
      totalSeconds: 600,
      status: 'NONE',
      shouldRemind: false,
    };
  }

  // Find earliest expiration among active reservations
  const earliestExpTime = Math.min(...activeReservations.map(r => new Date(r.expires_at).getTime()));
  const now = Date.now();
  const diffMs = earliestExpTime - now;
  const secondsRemaining = Math.max(0, Math.floor(diffMs / 1000));

  if (secondsRemaining <= 0) {
    // Reservation Expired at 10 minutes! Release last unit automatically
    await query(`UPDATE cart_reservations SET status = 'EXPIRED' WHERE user_id = $1 AND cart_id = $2 AND status = 'ACTIVE'`, [userId, cartId]);
    console.log(`⌛ [Cart Reservation] 10-minute hold on last-unit expired for user ${userId}. Stock released.`);

    // Publish Kafka cart-reservations event
    for (const res of activeReservations) {
      await publishCartReservationEvent(res, 'cart.reservation.expired');
    }

    return {
      active: false,
      hasReservedItem: true,
      isExpired: true,
      secondsRemaining: 0,
      totalSeconds: 600,
      status: 'EXPIRED',
      shouldRemind: false,
      message: 'Your 10-minute hold on the last available item has expired. Stock has been returned to the store.',
      messageKn: 'ಕೊನೆಯ ಲಭ್ಯವಿರುವ ವಸ್ತುವಿನ 10 ನಿಮಿಷಗಳ ಕಾಯ್ದಿರಿಸುವಿಕೆ ಅವಧಿ ಮುಗಿದಿದೆ. ದಾಸ್ತಾನು ಮಳಿಗೆಗೆ ಹಿಂತಿರುಗಿಸಲಾಗಿದೆ.'
    };
  }

  // Check 8-minute reminder (2 minutes / 120 seconds remaining)
  let shouldRemind = false;
  if (diffMs <= REMINDER_THRESHOLD_MS) {
    const unnotified = activeReservations.filter(r => !r.reminder_sent);
    if (unnotified.length > 0) {
      shouldRemind = true;
      for (const r of unnotified) {
        await query(`UPDATE cart_reservations SET reminder_sent = true WHERE id = $1`, [r.id]);
      }

      // Send in-app notification and simulated email
      console.log(`\n📧 [EMAIL PAYMENT REMINDER SENT TO USER ${userId}]:
      "Subject: Complete your payment - Urban Store
      The last available unit of your selected fashion item is held exclusively in your shopping bag.
      Please complete your payment within the next 2 minutes before the reservation expires and stock is released to other shoppers."\n`);

      const notificationData = {
        userId,
        type: 'PAYMENT_REMINDER',
        titleEn: '⚡ Complete your payment',
        titleKn: '⚡ ಪಾವತಿ ಪೂರ್ಣಗೊಳಿಸಿ',
        messageEn: 'The last available item in your shopping bag will be released in 2 minutes. Complete payment to secure it.',
        messageKn: 'ನಿಮ್ಮ ಶಾಪಿಂಗ್ ಬ್ಯಾಗ್‌ನಲ್ಲಿರುವ ಕೊನೆಯ ವಸ್ತು 2 ನಿಮಿಷಗಳಲ್ಲಿ ಬಿಡುಗಡೆಯಾಗುತ್ತದೆ. ಪಡೆಯಲು ಪಾವತಿ ಪೂರ್ಣಗೊಳಿಸಿ.',
        meta: { secondsRemaining }
      };

      await publishNotificationEvent(notificationData);
      broadcastNotification(notificationData);
    }
  }

  return {
    active: true,
    hasReservedItem: true,
    isExpired: false,
    expiresAt: new Date(earliestExpTime).toISOString(),
    secondsRemaining,
    totalSeconds: 600,
    status: 'ACTIVE',
    shouldRemind: diffMs <= REMINDER_THRESHOLD_MS,
  };
}

export async function getCart(req, res) {
  try {
    const userId = req.user.id;
    const cart = await getOrCreateCart(userId);

    const itemsRes = await query('SELECT * FROM cart_items WHERE cart_id = $1', [cart.id]);
    const items = [];

    for (const item of itemsRes.rows) {
      let product = mockOpenSearchIndex.get(item.product_id);
      if (!product) {
        const pRes = await query('SELECT * FROM products WHERE id = $1', [item.product_id]);
        if (pRes.rows.length > 0) product = pRes.rows[0];
      }

      if (product) {
        items.push({
          id: item.id,
          product_id: item.product_id,
          quantity: parseInt(item.quantity, 10),
          size: item.size || 'M',
          product: {
            id: product.id,
            name_en: product.name_en,
            name_kn: product.name_kn,
            price: parseFloat(product.price),
            image_url: product.image_url,
            category_id: product.category_id,
            central_stock: product.central_stock,
          }
        });
      }
    }

    const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    // Compute 10-minute cart reservation countdown and 8-min reminder state
    const reservationInfo = await getCartReservationInfo(userId, cart.id, items);

    res.json({
      cartId: cart.id,
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      reservation: reservationInfo
    });
  } catch (err) {
    console.error('[CartController] getCart error:', err);
    res.status(500).json({ error: 'Failed to retrieve cart' });
  }
}

export async function addToCart(req, res) {
  try {
    const userId = req.user.id;
    const { product_id, quantity = 1, size = 'M', store_id = 'store-blr-indiranagar' } = req.body;

    if (!product_id || quantity <= 0) {
      return res.status(400).json({ error: 'Invalid product or quantity' });
    }

    // Check store inventory & active reservations to prevent overselling
    const invRes = await query('SELECT * FROM store_inventory WHERE store_id = $1 AND product_id = $2', [store_id, product_id]);
    const currentStock = invRes.rows.length > 0 ? parseInt(invRes.rows[0].stock, 10) : 0;

    const resRes = await query('SELECT * FROM cart_reservations WHERE product_id = $1 AND store_id = $2', [product_id, store_id]);
    const now = Date.now();
    // sum other users' active reservations that haven't expired
    const otherReserved = resRes.rows
      .filter(r => r.user_id !== userId && r.status === 'ACTIVE' && new Date(r.expires_at).getTime() > now)
      .reduce((sum, r) => sum + parseInt(r.quantity, 10), 0);

    const available = currentStock - otherReserved;
    if (quantity > available) {
      return res.status(409).json({
        error: `Only ${Math.max(0, available)} units currently available.`,
        errorKn: `ಕೇವಲ ${Math.max(0, available)} ಯೂನಿಟ್‌ಗಳು ಮಾತ್ರ ಲಭ್ಯವಿವೆ.`
      });
    }

    const cart = await getOrCreateCart(userId);

    // Check if item already exists in cart
    const existing = await query('SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2', [cart.id, product_id]);

    if (existing.rows.length > 0) {
      const currentQty = parseInt(existing.rows[0].quantity, 10);
      const newQty = currentQty + parseInt(quantity, 10);
      await query('UPDATE cart_items SET quantity = $1, size = $2 WHERE cart_id = $3 AND product_id = $4', [newQty, size, cart.id, product_id]);
    } else {
      const itemId = uuidv4();
      await query(
        'INSERT INTO cart_items (id, cart_id, product_id, quantity, size) VALUES ($1, $2, $3, $4, $5)',
        [itemId, cart.id, product_id, parseInt(quantity, 10), size]
      );
    }

    // RULE: Stock reservation applies ONLY when the product has exactly 1 unit left in stock!
    // For products with more than 1 unit in stock, do NOT reserve any stock and do NOT start any timer.
    if (available === 1) {
      const expiresAt = new Date(Date.now() + RESERVATION_DURATION_MS).toISOString();
      const resId = uuidv4();
      await query(
        `INSERT INTO cart_reservations (id, cart_id, user_id, product_id, store_id, quantity, size, expires_at, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [resId, cart.id, userId, product_id, store_id, 1, size, expiresAt, 'ACTIVE']
      );

      // Publish Kafka cart-reservations event
      await publishCartReservationEvent({
        cart_id: cart.id,
        user_id: userId,
        product_id,
        store_id,
        quantity: 1,
        expires_at: expiresAt
      }, 'cart.reserved');
    }

    return getCart(req, res);
  } catch (err) {
    console.error('[CartController] addToCart error:', err);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
}

export async function updateCartItem(req, res) {
  try {
    const userId = req.user.id;
    const { product_id, quantity, size = 'M' } = req.body;
    const qty = parseInt(quantity, 10);

    const cart = await getOrCreateCart(userId);

    if (qty <= 0) {
      await query('DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2', [cart.id, product_id]);
      await query(`UPDATE cart_reservations SET status = 'RELEASED' WHERE user_id = $1 AND product_id = $2 AND status = 'ACTIVE'`, [userId, product_id]);
    } else {
      await query('UPDATE cart_items SET quantity = $1, size = $2 WHERE cart_id = $3 AND product_id = $4', [qty, size, cart.id, product_id]);
    }

    return getCart(req, res);
  } catch (err) {
    console.error('[CartController] updateCartItem error:', err);
    res.status(500).json({ error: 'Failed to update item quantity' });
  }
}

export async function removeFromCart(req, res) {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    const cart = await getOrCreateCart(userId);

    await query('DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2', [cart.id, productId]);
    await query(`UPDATE cart_reservations SET status = 'RELEASED' WHERE user_id = $1 AND product_id = $2`, [userId, productId]);

    return getCart(req, res);
  } catch (err) {
    console.error('[CartController] removeFromCart error:', err);
    res.status(500).json({ error: 'Failed to remove item' });
  }
}

export async function clearCart(req, res) {
  try {
    const userId = req.user.id;
    const cart = await getOrCreateCart(userId);
    await query('DELETE FROM cart_items WHERE cart_id = $1', [cart.id]);
    await query(`UPDATE cart_reservations SET status = 'RELEASED' WHERE user_id = $1`, [userId]);
    res.json({ message: 'Cart cleared and reservations released' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear cart' });
  }
}

export async function renewReservation(req, res) {
  try {
    const userId = req.user.id;
    const cart = await getOrCreateCart(userId);
    const expiresAt = new Date(Date.now() + RESERVATION_DURATION_MS).toISOString();

    await query(
      `UPDATE cart_reservations SET expires_at = $1, reminder_sent = false WHERE user_id = $2 AND status = 'ACTIVE'`,
      [expiresAt, userId]
    );

    return getCart(req, res);
  } catch (err) {
    res.status(500).json({ error: 'Failed to renew reservation' });
  }
}
