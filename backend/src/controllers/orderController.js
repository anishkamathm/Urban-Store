import { getClient, query } from '../config/postgres.js';
import { v4 as uuidv4 } from 'uuid';
import { findNearestEligibleStore, calculateEtaMinutes, calculateCo2Emissions, calculateHaversineDistance } from '../services/locationService.js';
import { publishOrderPlaced } from '../services/kafkaProducer.js';
import { activityLogger } from '../services/activityLogger.js';
import { mockOpenSearchIndex } from '../config/opensearch.js';

function generateOrderNumber() {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `#US${num}`;
}

export async function placeOrder(req, res) {
  const startTime = Date.now();
  const userId = req.user.id;
  const userEmail = req.user.email;
  const userLang = req.lang || req.user.preferred_language || 'en';

  const {
    items = [], // Array of { product_id, quantity }
    customer_name,
    delivery_address,
    delivery_lat,
    delivery_lng,
  } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({
      error: 'Cannot place order with empty cart',
      errorKn: 'ಖಾಲಿ ಕಾರ್ಟ್‌ನೊಂದಿಗೆ ಆರ್ಡರ್ ಮಾಡಲು ಸಾಧ್ಯವಿಲ್ಲ',
    });
  }

  const client = await getClient();
  const txQueries = [];

  try {
    // 1. Begin PostgreSQL Transaction
    await client.query('BEGIN');
    txQueries.push('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;');

    // 2. Fetch all stores and inventory to determine nearest eligible store
    const storesRes = await query('SELECT * FROM stores');
    const allStores = storesRes.rows;

    const inventoryRes = await query('SELECT * FROM store_inventory');
    const allInventory = inventoryRes.rows;

    const formattedItems = items.map(i => ({
      productId: i.product_id,
      quantity: parseInt(i.quantity, 10),
    }));

    const lat = delivery_lat ? parseFloat(delivery_lat) : null;
    const lng = delivery_lng ? parseFloat(delivery_lng) : null;

    // Check nearest store within delivery radius that has stock for all items
    const nearest = findNearestEligibleStore(allStores, formattedItems, allInventory, lat, lng);

    let storeId = null;
    let deliveryType = 'standard_warehouse';
    let distanceKm = 0;
    let etaMinutes = 3 * 24 * 60; // 3-5 days
    let co2Stats = calculateCo2Emissions(Infinity);

    if (nearest) {
      storeId = nearest.store.id;
      deliveryType = 'instant_30min';
      distanceKm = nearest.distanceKm;
      etaMinutes = nearest.etaMinutes;
      co2Stats = nearest.co2;
    }

    // 3. ATOMIC CONDITIONAL STOCK DECREMENT
    // For each item: UPDATE ... SET stock = stock - qty WHERE ... stock >= qty
    let subtotal = 0;
    const enrichedOrderItems = [];

    for (const item of formattedItems) {
      let product = mockOpenSearchIndex.get(item.productId);
      if (!product) {
        const prodRes = await query('SELECT * FROM products WHERE id = $1', [item.productId]);
        if (prodRes.rows.length === 0) {
          throw {
            status: 404,
            message: `Product ${item.productId} not found`,
            messageKn: `ಉತ್ಪನ್ನ ಕಂಡುಬಂದಿಲ್ಲ`,
          };
        }
        product = prodRes.rows[0];
      }

      const unitPrice = parseFloat(product.price);
      const itemTotal = unitPrice * item.quantity;
      subtotal += itemTotal;

      if (deliveryType === 'instant_30min' && storeId) {
        // Atomic decrement in store_inventory
        const updateSql = `UPDATE store_inventory SET stock = stock - $1 WHERE store_id = $2 AND product_id = $3 AND stock >= $1`;
        txQueries.push(`UPDATE store_inventory SET stock = stock - ${item.quantity} WHERE store_id = '${storeId}' AND product_id = '${item.productId}' AND stock >= ${item.quantity};`);

        const updateResult = await client.query(updateSql, [item.quantity, storeId, item.productId]);

        if (updateResult.rowCount === 0) {
          // Out of stock atomic condition failed!
          const prodName = userLang === 'kn' ? (product.name_kn || product.name_en) : product.name_en;
          throw {
            status: 409,
            code: 'OUT_OF_STOCK',
            message: `Sorry, "${product.name_en}" is out of stock or insufficient quantity at the nearest store.`,
            messageKn: `ಕ್ಷಮಿಸಿ, ಹತ್ತಿರದ ಮಳಿಗೆಯಲ್ಲಿ "${prodName}" ಸ್ಟಾಕ್ ಲಭ್ಯವಿಲ್ಲ ಅಥವಾ ಕಡಿಮೆ ಇದೆ.`,
          };
        }
      } else {
        // Fallback: Atomic decrement in central warehouse products table
        const updateCentralSql = `UPDATE products SET central_stock = central_stock - $1 WHERE id = $2 AND central_stock >= $1`;
        txQueries.push(`UPDATE products SET central_stock = central_stock - ${item.quantity} WHERE id = '${item.productId}' AND central_stock >= ${item.quantity};`);

        const updateCentralResult = await client.query(updateCentralSql, [item.quantity, item.productId]);

        if (updateCentralResult.rowCount === 0) {
          const prodName = userLang === 'kn' ? (product.name_kn || product.name_en) : product.name_en;
          throw {
            status: 409,
            code: 'OUT_OF_STOCK',
            message: `Sorry, "${product.name_en}" is out of stock in our central warehouse.`,
            messageKn: `ಕ್ಷಮಿಸಿ, ಕೇಂದ್ರೀಯ ಗೋದಾಮಿನಲ್ಲಿ "${prodName}" ಸ್ಟಾಕ್ ಲಭ್ಯವಿಲ್ಲ.`,
          };
        }
      }

      enrichedOrderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        itemTotal,
        nameEn: product.name_en,
        nameKn: product.name_kn,
        imageUrl: product.image_url,
      });
    }

    // 4. Calculate Delivery Fee and Total (Faraway gets flat Rs. 30)
    const deliveryFee = deliveryType === 'instant_30min' ? (subtotal > 500 ? 0 : 25) : 30.00;
    const totalAmount = Math.round((subtotal + deliveryFee) * 100) / 100;
    const orderId = uuidv4();
    const orderNumber = generateOrderNumber();

    // 5. Insert Order Record
    const insertOrderSql = `
      INSERT INTO orders (
        id, order_number, user_id, store_id, delivery_type, status,
        subtotal, delivery_fee, total_amount, eta_minutes, customer_name,
        customer_email, delivery_address, delivery_lat, delivery_lng,
        distance_km, co2_kg, language
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `;

    txQueries.push(`INSERT INTO orders (id, order_number, ...) VALUES ('${orderId}', '${orderNumber}', ...);`);

    const orderRes = await client.query(insertOrderSql, [
      orderId,
      orderNumber,
      userId,
      storeId,
      deliveryType,
      'PLACED',
      subtotal,
      deliveryFee,
      totalAmount,
      etaMinutes,
      customer_name || 'Valued Customer',
      userEmail,
      delivery_address || 'Delivery Address',
      lat || 12.9716,
      lng || 77.5946,
      distanceKm,
      co2Stats.deliveryCo2Kg,
      userLang,
    ]);

    // 6. Insert Order Items
    for (const item of enrichedOrderItems) {
      await client.query(
        `INSERT INTO order_items (id, order_id, product_id, store_id, quantity, unit_price, total_price)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [uuidv4(), orderId, item.productId, storeId, item.quantity, item.unitPrice, item.itemTotal]
      );
    }

    // 7. Insert Initial Delivery Record
    const deliveryId = uuidv4();
    const storeObj = allStores.find(s => s.id === storeId);
    const storeLat = storeObj ? parseFloat(storeObj.latitude) : 12.9716;
    const storeLng = storeObj ? parseFloat(storeObj.longitude) : 77.5946;

    await client.query(
      `INSERT INTO deliveries (
        id, order_id, store_id, rider_name, rider_phone, status,
        current_lat, current_lng, target_lat, target_lng, eta_minutes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        deliveryId,
        orderId,
        storeId,
        'Assigning Rider...',
        '+91 98765 43210',
        'ASSIGNED',
        storeLat,
        storeLng,
        lat || storeLat + 0.01,
        lng || storeLng + 0.01,
        etaMinutes,
      ]
    );

    // 8. Clear user's cart in DB & mark active reservations as completed
    const cartRes = await client.query('SELECT id FROM carts WHERE user_id = $1', [userId]);
    if (cartRes.rows.length > 0) {
      await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cartRes.rows[0].id]);
    }
    await client.query("UPDATE cart_reservations SET status = 'COMPLETED' WHERE user_id = $1 AND status = 'ACTIVE'", [userId]);

    // 9. COMMIT TRANSACTION
    await client.query('COMMIT');
    txQueries.push('COMMIT;');

    const durationMs = Date.now() - startTime;

    // Log transaction proof for System Activity page
    activityLogger.logPostgresTransaction(
      'ORDER_PLACEMENT_ATOMIC_DECREMENT',
      'COMMITTED',
      txQueries,
      enrichedOrderItems.length + 3,
      durationMs,
      {
        orderId,
        orderNumber,
        storeId,
        deliveryType,
        itemsCount: enrichedOrderItems.length,
        totalAmount,
      }
    );

    // 10. Publish "order.placed" event to Aiven Apache Kafka
    const orderPayload = {
      id: orderId,
      order_number: orderNumber,
      user_id: userId,
      store_id: storeId,
      delivery_type: deliveryType,
      customer_name,
      customer_email: userEmail,
      language: userLang,
      total_amount: totalAmount,
      eta_minutes: etaMinutes,
      distance_km: distanceKm,
      delivery_lat: lat,
      delivery_lng: lng,
      items: enrichedOrderItems,
    };

    publishOrderPlaced(orderPayload).catch(err => console.error('[OrderController] Kafka publish error:', err));

    return res.status(201).json({
      message: 'Order placed successfully',
      messageKn: 'ಆರ್ಡರ್ ಯಶಸ್ವಿಯಾಗಿ ನೀಡಲಾಗಿದೆ',
      order: {
        id: orderId,
        orderNumber,
        deliveryType,
        storeName: storeObj ? storeObj.name : 'Central Warehouse',
        totalAmount,
        subtotal,
        deliveryFee,
        etaMinutes,
        distanceKm,
        co2: co2Stats,
        items: enrichedOrderItems,
        status: 'PLACED',
      }
    });

  } catch (err) {
    // ROLLBACK ON ERROR (e.g. Out of stock or db failure)
    try {
      await client.query('ROLLBACK');
      txQueries.push('ROLLBACK;');
    } catch (rbErr) {}

    const durationMs = Date.now() - startTime;
    activityLogger.logPostgresTransaction(
      'ORDER_PLACEMENT_ATOMIC_DECREMENT',
      'ROLLED_BACK',
      txQueries,
      0,
      durationMs,
      { error: err.message || err.messageKn || 'Transaction rolled back' }
    );

    if (err.status) {
      return res.status(err.status).json({
        error: err.message,
        errorKn: err.messageKn,
        code: err.code || 'TRANSACTION_FAILED',
      });
    }

    console.error('[OrderController] placeOrder error:', err);
    res.status(500).json({
      error: 'Failed to process order',
      errorKn: 'ಆರ್ಡರ್ ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲು ವಿಫಲವಾಗಿದೆ',
      details: err.message,
    });
  } finally {
    client.release();
  }
}

export async function getOrder(req, res) {
  try {
    const { id } = req.params;
    const orderRes = await query('SELECT * FROM orders WHERE id = $1 OR order_number = $1', [id]);

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found', errorKn: 'ಆರ್ಡರ್ ಕಂಡುಬಂದಿಲ್ಲ' });
    }

    const order = orderRes.rows[0];

    // Fetch order items
    const itemsRes = await query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
    const items = [];

    for (const row of itemsRes.rows) {
      let prod = mockOpenSearchIndex.get(row.product_id);
      if (!prod) {
        const pRes = await query('SELECT * FROM products WHERE id = $1', [row.product_id]);
        if (pRes.rows.length > 0) prod = pRes.rows[0];
      }
      items.push({
        id: row.id,
        productId: row.product_id,
        quantity: row.quantity,
        unitPrice: parseFloat(row.unit_price),
        totalPrice: parseFloat(row.total_price),
        nameEn: prod ? prod.name_en : 'Product',
        nameKn: prod ? prod.name_kn : 'ಉತ್ಪನ್ನ',
        imageUrl: prod ? prod.image_url : '',
      });
    }

    // Fetch delivery & rider info
    const delRes = await query('SELECT * FROM deliveries WHERE order_id = $1', [order.id]);
    const delivery = delRes.rows.length > 0 ? delRes.rows[0] : null;

    // Fetch store name if any
    let storeName = 'Central Warehouse';
    if (order.store_id) {
      const sRes = await query('SELECT name FROM stores WHERE id = $1', [order.store_id]);
      if (sRes.rows.length > 0) storeName = sRes.rows[0].name;
    }

    const co2Stats = calculateCo2Emissions(order.distance_km);

    res.json({
      order: {
        ...order,
        storeName,
        items,
        delivery,
        co2: co2Stats,
      }
    });
  } catch (err) {
    console.error('[OrderController] getOrder error:', err);
    res.status(500).json({ error: 'Failed to retrieve order' });
  }
}

export async function getUserOrders(req, res) {
  try {
    const userId = req.user.id;
    const ordersRes = await query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [userId]);

    let totalCo2Saved = 0;
    const orders = [];

    for (const o of ordersRes.rows) {
      const co2 = calculateCo2Emissions(o.distance_km);
      totalCo2Saved += (co2.savedCo2Kg || 0);

      // Fetch items for each order
      const itemsRes = await query('SELECT * FROM order_items WHERE order_id = $1', [o.id]);
      const items = [];

      // Check 7-day return eligibility: status === 'DELIVERED' && order within 7 days
      const orderDate = new Date(o.created_at).getTime();
      const within7Days = (Date.now() - orderDate) <= 7 * 24 * 60 * 60 * 1000;
      const isDelivered = o.status === 'DELIVERED';

      for (const itemRow of itemsRes.rows) {
        let prod = mockOpenSearchIndex.get(itemRow.product_id);
        if (!prod) {
          const pRes = await query('SELECT * FROM products WHERE id = $1', [itemRow.product_id]);
          if (pRes.rows.length > 0) prod = pRes.rows[0];
        }

        const category = prod ? prod.category : '';
        const isClothes = category === 'clothes' || category === 'fashion';
        const isReturnEligible = isDelivered && within7Days && isClothes;

        items.push({
          id: itemRow.id,
          productId: itemRow.product_id,
          quantity: itemRow.quantity,
          unitPrice: parseFloat(itemRow.unit_price),
          totalPrice: parseFloat(itemRow.total_price),
          nameEn: prod ? prod.name_en : 'Product',
          nameKn: prod ? prod.name_kn : 'ಉತ್ಪನ್ನ',
          category,
          imageUrl: prod ? prod.image_url : '',
          isReturnEligible,
        });
      }

      orders.push({
        ...o,
        items,
        isReturnEligible: isDelivered && within7Days && items.some(i => i.isReturnEligible),
        co2,
      });
    }

    res.json({
      orders,
      ecoImpact: {
        totalOrders: orders.length,
        totalCo2SavedKg: Math.round(totalCo2Saved * 100) / 100,
        treesEquivalent: Math.round((totalCo2Saved / 21) * 10) / 10,
      }
    });
  } catch (err) {
    console.error('[OrderController] getUserOrders error:', err);
    res.status(500).json({ error: 'Failed to retrieve orders' });
  }
}
