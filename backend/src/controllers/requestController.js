import { v4 as uuidv4 } from 'uuid';
import { query, getClient } from '../config/postgres.js';
import { publishStockUpdate, publishNotificationEvent } from '../services/kafkaProducer.js';
import { sseService } from '../services/sseService.js';
import { mockOpenSearchIndex } from '../config/opensearch.js';

/**
 * Create a new customer request (Return, Cancellation, or Restock Alert)
 */
export async function createRequest(req, res) {
  try {
    const userId = req.user?.id || null;
    const userEmail = req.user?.email || req.body.email || 'customer@urbanstore.in';
    const {
      request_type, // 'RETURN', 'CANCELLATION', 'RESTOCK_ALERT'
      order_id,
      product_id,
      item_id,
      reason,
      quantity = 1,
    } = req.body;

    if (!request_type) {
      return res.status(400).json({ error: 'request_type is required' });
    }

    let refundAmount = 0.00;
    let orderNumber = null;
    let productName = null;

    if (product_id) {
      const prodRes = await query('SELECT * FROM products WHERE id = $1', [product_id]);
      if (prodRes.rows.length > 0) {
        productName = prodRes.rows[0].name_en;
      }
    }

    if (request_type === 'RETURN') {
      if (!order_id) {
        return res.status(400).json({
          error: 'order_id is required for returns',
          errorKn: 'ರಿಟರ್ನ್‌ಗಾಗಿ ಆರ್ಡರ್ ಐಡಿ ಅಗತ್ಯವಿದೆ'
        });
      }

      // Check order validity
      const orderRes = await query('SELECT * FROM orders WHERE id = $1 OR order_number = $1', [order_id]);
      if (orderRes.rows.length === 0) {
        return res.status(404).json({
          error: 'Order not found',
          errorKn: 'ಆರ್ಡರ್ ಕಂಡುಬಂದಿಲ್ಲ'
        });
      }

      const order = orderRes.rows[0];
      orderNumber = order.order_number;

      // Ensure order is DELIVERED
      if (order.status !== 'DELIVERED') {
        return res.status(400).json({
          error: 'Returns can only be requested for delivered orders',
          errorKn: 'ವಿತರಿಸಲಾದ ಆರ್ಡರ್‌ಗಳಿಗೆ ಮಾತ್ರ ರಿಟರ್ನ್ ವಿನಂತಿಸಬಹುದು'
        });
      }

      // 7-day return window rule
      const orderTime = new Date(order.created_at).getTime();
      const diffDays = (Date.now() - orderTime) / (1000 * 60 * 60 * 24);
      if (diffDays > 7) {
        return res.status(400).json({
          error: 'Returns are only permitted within 7 days of delivery',
          errorKn: 'ವಿತರಣೆಯ 7 ದಿನಗಳೊಳಗೆ ಮಾತ್ರ ರಿಟರ್ನ್ ಮಾಡಲು ಸಾಧ್ಯವಿದೆ'
        });
      }

      // Calculate refund
      if (item_id) {
        const itemRes = await query('SELECT * FROM order_items WHERE id = $1', [item_id]);
        if (itemRes.rows.length > 0) {
          refundAmount = parseFloat(itemRes.rows[0].unit_price) * (quantity || itemRes.rows[0].quantity);
        }
      } else {
        refundAmount = parseFloat(order.total_amount);
      }
    }

    const requestId = uuidv4();
    const insertSql = `
      INSERT INTO customer_requests (
        id, request_type, user_id, order_id, product_id, item_id,
        status, reason, refund_amount, refund_method, admin_notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const result = await query(insertSql, [
      requestId,
      request_type.toUpperCase(),
      userId,
      order_id || null,
      product_id || null,
      item_id || null,
      'PENDING',
      reason || 'Customer request raised',
      refundAmount,
      'ORIGINAL_PAYMENT_METHOD',
      'Awaiting admin review',
    ]);

    // Broadcast in-app notification
    sseService.broadcastNotification(
      userId,
      `Your request (${request_type}) has been submitted. Status: PENDING.`,
      `ನಿಮ್ಮ ವಿನಂತಿಯನ್ನು (${request_type}) ಸಲ್ಲಿಸಲಾಗಿದೆ. ಸ್ಥಿತಿ: ಬಾಕಿ (PENDING).`
    );

    res.status(201).json({
      message: 'Request submitted successfully',
      messageKn: 'ವಿನಂತಿಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ',
      request: result.rows[0],
    });
  } catch (err) {
    console.error('[RequestController] createRequest error:', err);
    res.status(500).json({ error: 'Failed to create customer request', details: err.message });
  }
}

/**
 * Get requests submitted by the logged in customer
 */
export async function getUserRequests(req, res) {
  try {
    const userId = req.user.id;
    const result = await query(
      `SELECT cr.*, p.name_en as product_name, p.image_url as product_image, o.order_number
       FROM customer_requests cr
       LEFT JOIN products p ON cr.product_id = p.id
       LEFT JOIN orders o ON cr.order_id = o.id
       WHERE cr.user_id = $1
       ORDER BY cr.created_at DESC`,
      [userId]
    );

    res.json({ requests: result.rows });
  } catch (err) {
    console.error('[RequestController] getUserRequests error:', err);
    res.status(500).json({ error: 'Failed to fetch customer requests' });
  }
}

/**
 * Get all requests (Admin) with optional status or type filter
 */
export async function getAllRequests(req, res) {
  try {
    const { status, type } = req.query;
    let sql = `
      SELECT cr.*, u.email as user_email, u.name as user_name,
             p.name_en as product_name, p.category as product_category,
             p.image_url as product_image, o.order_number, o.store_id
      FROM customer_requests cr
      LEFT JOIN users u ON cr.user_id = u.id
      LEFT JOIN products p ON cr.product_id = p.id
      LEFT JOIN orders o ON cr.order_id = o.id
    `;
    const params = [];
    const conditions = [];

    if (status) {
      params.push(status.toUpperCase());
      conditions.push(`cr.status = $${params.length}`);
    }
    if (type) {
      params.push(type.toUpperCase());
      conditions.push(`cr.request_type = $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY cr.created_at DESC';

    const result = await query(sql, params);
    res.json({ requests: result.rows });
  } catch (err) {
    console.error('[RequestController] getAllRequests error:', err);
    res.status(500).json({ error: 'Failed to fetch admin requests' });
  }
}

/**
 * Update request status (Admin)
 * Approved returns restore stock into the store inventory and notify customer
 */
export async function updateRequestStatus(req, res) {
  const { id } = req.params;
  const { status, admin_notes } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'status is required (PENDING, APPROVED, REJECTED, COMPLETED)' });
  }

  const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'];
  if (!validStatuses.includes(status.toUpperCase())) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Get current request details
    const reqRes = await client.query('SELECT * FROM customer_requests WHERE id = $1', [id]);
    if (reqRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Request not found' });
    }

    const currentReq = reqRes.rows[0];
    const previousStatus = currentReq.status;
    const newStatus = status.toUpperCase();

    // Update status in DB
    const updateRes = await client.query(
      `UPDATE customer_requests
       SET status = $1, admin_notes = COALESCE($2, admin_notes), updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [newStatus, admin_notes || null, id]
    );

    const updated = updateRes.rows[0];

    // If an approved return transition occurs:
    // Put item back into stock!
    if (currentReq.request_type === 'RETURN' && newStatus === 'APPROVED' && previousStatus !== 'APPROVED') {
      const productId = currentReq.product_id;
      let storeId = null;

      if (currentReq.order_id) {
        const oRes = await client.query('SELECT store_id FROM orders WHERE id = $1', [currentReq.order_id]);
        if (oRes.rows.length > 0 && oRes.rows[0].store_id) {
          storeId = oRes.rows[0].store_id;
        }
      }

      // Quantity to restore (default 1)
      const qtyToRestore = 1;

      if (productId) {
        // Increment central stock
        await client.query('UPDATE products SET central_stock = central_stock + $1 WHERE id = $2', [qtyToRestore, productId]);

        // Increment store stock if applicable
        if (storeId) {
          await client.query(
            `UPDATE store_inventory SET stock = stock + $1 WHERE store_id = $2 AND product_id = $3`,
            [qtyToRestore, storeId, productId]
          );
        }

        // Fetch updated stock for Kafka event
        const pCheck = await client.query('SELECT central_stock FROM products WHERE id = $1', [productId]);
        const newCentralStock = pCheck.rows.length > 0 ? pCheck.rows[0].central_stock : 10;

        // Publish Kafka stock update
        publishStockUpdate(productId, storeId, newCentralStock, 'RETURN_RESTOCKED')
          .catch(err => console.error('[RequestController] Kafka stock publish error:', err));

        // SSE broadcast
        sseService.broadcastInventoryChange(productId, storeId, newCentralStock);
      }
    }

    await client.query('COMMIT');

    // Notify customer
    if (updated.user_id) {
      const msgEn = `Your ${updated.request_type} request (#${id.slice(0, 8)}) is now ${newStatus}. ${newStatus === 'APPROVED' ? `Refund of ₹${updated.refund_amount} processed to original payment method.` : ''}`;
      const msgKn = `ನಿಮ್ಮ ${updated.request_type} ವಿನಂತಿಯು (${newStatus}) ಆಗಿದೆ. ${newStatus === 'APPROVED' ? `₹${updated.refund_amount} ಮರುಪಾವತಿಯನ್ನು ಮೂಲ ಪಾವತಿ ವಿಧಾನಕ್ಕೆ ಜಮೆ ಮಾಡಲಾಗಿದೆ.` : ''}`;

      sseService.broadcastNotification(updated.user_id, msgEn, msgKn);
      publishNotificationEvent(updated.user_id, 'REQUEST_STATUS_UPDATED', msgEn, { requestId: id, status: newStatus })
        .catch(err => console.error('[RequestController] Kafka notification error:', err));
    }

    res.json({
      message: `Request status updated to ${newStatus}`,
      messageKn: `ವಿನಂತಿಯ ಸ್ಥಿತಿಯನ್ನು ${newStatus} ಗೆ ನವೀಕರಿಸಲಾಗಿದೆ`,
      request: updated,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[RequestController] updateRequestStatus error:', err);
    res.status(500).json({ error: 'Failed to update request status', details: err.message });
  } finally {
    client.release();
  }
}
