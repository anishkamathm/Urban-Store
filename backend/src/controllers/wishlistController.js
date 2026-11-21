import { query } from '../config/postgres.js';
import { v4 as uuidv4 } from 'uuid';
import { mockOpenSearchIndex } from '../config/opensearch.js';

export async function getWishlist(req, res) {
  try {
    const userId = req.user.id;
    const result = await query(
      'SELECT * FROM wishlists WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    const items = [];
    for (const row of result.rows) {
      let product = mockOpenSearchIndex.get(row.product_id);
      if (!product) {
        const prodRes = await query('SELECT * FROM products WHERE id = $1', [row.product_id]);
        if (prodRes.rows.length > 0) {
          product = prodRes.rows[0];
        }
      }

      if (product) {
        items.push({
          id: row.id,
          user_id: row.user_id,
          product_id: row.product_id,
          created_at: row.created_at,
          product: {
            id: product.id,
            name_en: product.name_en,
            name_kn: product.name_kn,
            description_en: product.description_en,
            description_kn: product.description_kn,
            price: parseFloat(product.price),
            image_url: product.image_url,
            category_id: product.category_id,
            central_stock: product.central_stock,
            totalStock: product.totalStock,
            deliveryBadge: product.deliveryBadge,
            sizes: product.sizes,
          }
        });
      }
    }

    res.json({ wishlist: items, count: items.length });
  } catch (err) {
    console.error('[WishlistController] getWishlist error:', err);
    res.status(500).json({ error: 'Failed to retrieve wishlist' });
  }
}

export async function toggleWishlist(req, res) {
  try {
    const userId = req.user.id;
    const productId = req.body.product_id || req.body.productId;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Check if item is already in user's wishlist
    const existing = await query(
      'SELECT * FROM wishlists WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );

    if (existing.rows.length > 0) {
      // Remove from wishlist
      await query(
        'DELETE FROM wishlists WHERE user_id = $1 AND product_id = $2',
        [userId, productId]
      );
      return res.json({
        action: 'removed',
        inWishlist: false,
        productId,
        message: 'Item removed from wishlist',
        messageKn: 'ವಸ್ತು ಬಯಕೆಪಟ್ಟಿಯಿಂದ ತೆಗೆದುಹಾಕಲಾಗಿದೆ',
      });
    } else {
      // Add to wishlist
      const id = uuidv4();
      await query(
        'INSERT INTO wishlists (id, user_id, product_id) VALUES ($1, $2, $3)',
        [id, userId, productId]
      );
      return res.json({
        action: 'added',
        inWishlist: true,
        productId,
        message: 'Item saved to wishlist',
        messageKn: 'ವಸ್ತು ಬಯಕೆಪಟ್ಟಿಗೆ ಸೇರಿಸಲಾಗಿದೆ',
      });
    }
  } catch (err) {
    console.error('[WishlistController] toggleWishlist error:', err);
    res.status(500).json({ error: 'Failed to toggle wishlist item' });
  }
}

export async function removeFromWishlist(req, res) {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    await query(
      'DELETE FROM wishlists WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );

    res.json({
      success: true,
      action: 'removed',
      inWishlist: false,
      productId,
      message: 'Item removed from wishlist',
      messageKn: 'ವಸ್ತು ಬಯಕೆಪಟ್ಟಿಯಿಂದ ತೆಗೆದುಹಾಕಲಾಗಿದೆ',
    });
  } catch (err) {
    console.error('[WishlistController] removeFromWishlist error:', err);
    res.status(500).json({ error: 'Failed to remove item from wishlist' });
  }
}
