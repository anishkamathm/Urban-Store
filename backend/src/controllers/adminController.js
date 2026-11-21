import { query } from '../config/postgres.js';
import { v4 as uuidv4 } from 'uuid';
import { publishProductUpdated, publishInventoryChanged } from '../services/kafkaProducer.js';
import { activityLogger } from '../services/activityLogger.js';
import { indexProduct } from '../config/opensearch.js';

export async function createProduct(req, res) {
  try {
    const {
      name_en,
      name_kn,
      description_en,
      description_kn,
      price,
      category_id,
      image_url,
      central_stock = 50,
      keywords = '',
      store_stocks = {}, // { [store_id]: stock }
    } = req.body;

    if (!name_en || !price || !category_id) {
      return res.status(400).json({ error: 'name_en, price, and category_id are required' });
    }

    const productId = uuidv4();
    const cleanPrice = parseFloat(price);
    const cleanCentralStock = parseInt(central_stock, 10);

    // 1. Insert product into PostgreSQL
    await query(
      `INSERT INTO products (
        id, category_id, name_en, name_kn, description_en, description_kn,
        price, image_url, central_stock, is_featured
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        productId,
        category_id,
        name_en,
        name_kn || name_en,
        description_en || '',
        description_kn || '',
        cleanPrice,
        image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
        cleanCentralStock,
        true,
      ]
    );

    // 2. Insert store inventory
    const storesRes = await query('SELECT * FROM stores');
    const storeDocuments = [];

    for (const store of storesRes.rows) {
      const stock = parseInt(store_stocks[store.id] || 10, 10);
      await query(
        `INSERT INTO store_inventory (id, store_id, product_id, stock)
         VALUES ($1, $2, $3, $4)`,
        [uuidv4(), store.id, productId, stock]
      );

      storeDocuments.push({
        store_id: store.id,
        store_name: store.name,
        city: store.city,
        location: { lat: parseFloat(store.latitude), lon: parseFloat(store.longitude) },
        stock,
        delivery_radius_km: parseFloat(store.delivery_radius_km || 5),
      });
    }

    // 3. Prepare OpenSearch document
    const productDoc = {
      id: productId,
      name_en,
      name_kn: name_kn || name_en,
      description_en: description_en || '',
      description_kn: description_kn || '',
      category_id,
      price: cleanPrice,
      central_stock: cleanCentralStock,
      image_url: image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
      keywords: keywords || `${name_en} ${name_kn || ''}`,
      stores: storeDocuments,
      is_featured: true,
    };

    // Index into OpenSearch
    await indexProduct(productDoc);

    // Publish Kafka product.updated event
    publishProductUpdated(productDoc).catch(() => {});

    res.status(201).json({
      message: 'Product created and indexed successfully',
      messageKn: 'ಉತ್ಪನ್ನವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ರಚಿಸಲಾಗಿದೆ ಮತ್ತು ಸೂಚ್ಯಂಕ ಮಾಡಲಾಗಿದೆ',
      product: productDoc,
    });
  } catch (err) {
    console.error('[AdminController] createProduct error:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
}

export async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const {
      name_en,
      name_kn,
      description_en,
      description_kn,
      price,
      central_stock,
      store_stocks, // { [store_id]: stock }
    } = req.body;

    // 1. Update product in PostgreSQL
    await query(
      `UPDATE products SET
        name_en = COALESCE($1, name_en),
        name_kn = COALESCE($2, name_kn),
        description_en = COALESCE($3, description_en),
        description_kn = COALESCE($4, description_kn),
        price = COALESCE($5, price),
        central_stock = COALESCE($6, central_stock),
        updated_at = NOW()
       WHERE id = $7`,
      [name_en, name_kn, description_en, description_kn, price, central_stock, id]
    );

    // 2. Update store stocks if provided
    if (store_stocks && typeof store_stocks === 'object') {
      for (const [storeId, stock] of Object.entries(store_stocks)) {
        await query(
          `UPDATE store_inventory SET stock = $1 WHERE store_id = $2 AND product_id = $3`,
          [stock, storeId, id]
        );
      }
    }

    // 3. Re-read and re-sync in OpenSearch
    const updatedProd = (await query('SELECT * FROM products WHERE id = $1', [id])).rows[0];
    const storesRes = await query(
      `SELECT si.store_id, si.stock, s.name as store_name, s.city, s.latitude, s.longitude, s.delivery_radius_km
       FROM store_inventory si
       JOIN stores s ON si.store_id = s.id
       WHERE si.product_id = $1`,
      [id]
    );

    const storeDocs = storesRes.rows.map(r => ({
      store_id: r.store_id,
      store_name: r.store_name,
      city: r.city,
      location: { lat: parseFloat(r.latitude), lon: parseFloat(r.longitude) },
      stock: r.stock,
      delivery_radius_km: parseFloat(r.delivery_radius_km || 5),
    }));

    const doc = {
      ...updatedProd,
      price: parseFloat(updatedProd.price),
      stores: storeDocs,
    };

    await indexProduct(doc);
    publishProductUpdated(doc).catch(() => {});

    res.json({
      message: 'Product updated and re-indexed',
      messageKn: 'ಉತ್ಪನ್ನ ನವೀಕರಿಸಲಾಗಿದೆ',
      product: doc,
    });
  } catch (err) {
    console.error('[AdminController] updateProduct error:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
}

export async function getAllOrders(req, res) {
  try {
    const ordersRes = await query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 50');
    res.json({ orders: ordersRes.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
}

export async function updateOrderStatus(req, res) {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    await query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2', [status, orderId]);
    await query('UPDATE deliveries SET status = $1, updated_at = NOW() WHERE order_id = $2', [status, orderId]);

    res.json({ message: 'Order status updated', status });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
}

export async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    await query('DELETE FROM store_inventory WHERE product_id = $1', [id]);
    await query('DELETE FROM products WHERE id = $1', [id]);
    mockOpenSearchIndex.delete(id);

    res.json({ message: 'Product deleted successfully', messageKn: 'ಉತ್ಪನ್ನವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಅಳಿಸಲಾಗಿದೆ' });
  } catch (err) {
    console.error('[AdminController] deleteProduct error:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
}

export async function getDashboardKPIs(req, res) {
  try {
    const [ordersRes, billsRes, prodsRes, requestsRes, lostRes] = await Promise.all([
      query('SELECT total_amount, status, created_at FROM orders'),
      query('SELECT total_amount, created_at FROM offline_bills'),
      query('SELECT id, central_stock FROM products'),
      query('SELECT id, status FROM customer_requests WHERE status = $1', ['PENDING']),
      query('SELECT search_count, estimated_lost_revenue FROM lost_opportunities'),
    ]);

    const onlineRevenue = ordersRes.rows.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
    const offlineRevenue = billsRes.rows.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);
    const totalRevenue = onlineRevenue + offlineRevenue;

    const lowStockCount = prodsRes.rows.filter(p => (parseInt(p.central_stock, 10) || 0) <= 5).length;
    const pendingRequestsCount = requestsRes.rows.length;
    const totalLostSearches = lostRes.rows.reduce((sum, l) => sum + (parseInt(l.search_count, 10) || 0), 0);
    const totalLostRevenue = lostRes.rows.reduce((sum, l) => sum + (parseFloat(l.estimated_lost_revenue) || 0), 0);

    res.json({
      revenue: {
        total: Math.round(totalRevenue * 100) / 100,
        online: Math.round(onlineRevenue * 100) / 100,
        offline: Math.round(offlineRevenue * 100) / 100,
      },
      counts: {
        onlineOrders: ordersRes.rows.length,
        offlineBills: billsRes.rows.length,
        totalProducts: prodsRes.rows.length,
        lowStockItems: lowStockCount,
        pendingRequests: pendingRequestsCount,
        lostSearches: totalLostSearches,
        lostRevenue: Math.round(totalLostRevenue * 100) / 100,
      }
    });
  } catch (err) {
    console.error('[AdminController] getDashboardKPIs error:', err);
    res.status(500).json({ error: 'Failed to load dashboard KPIs' });
  }
}

export async function getSystemActivity(req, res) {
  try {
    const snapshot = activityLogger.getSnapshot();
    res.json(snapshot);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch system activity' });
  }
}
