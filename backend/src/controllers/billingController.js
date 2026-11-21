import { getClient, query, mockDb } from '../config/postgres.js';
import { v4 as uuidv4 } from 'uuid';
import { publishStockUpdate, publishOfflineBillCreated } from '../services/kafkaProducer.js';
import { syncProductStockAndOpenSearch } from '../consumer.js';

function generateBillNumber() {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `#UB-${num}`;
}

/**
 * Create an in-store offline POS bill
 * Atomically verifies and deducts the same shared stock used by the online website,
 * strictly respecting active cart reservations and preventing overselling.
 */
export async function createBill(req, res) {

  const {
    store_id = 'store-blr-indiranagar',
    customer_name = 'Walk-in Customer',
    customer_phone = '',
    customer_email = '',
    payment_method = 'CASH', // 'CASH', 'CARD', 'UPI'
    discount_amount = 0,
    notes = '',
    items = [] // [{ product_id, quantity, size, unit_price }]
  } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({
      error: 'Cannot generate bill with no items',
      errorKn: 'ಯಾವುದೇ ವಸ್ತುಗಳಿಲ್ಲದೆ ಬಿಲ್ ರಚಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ'
    });
  }

  const client = await getClient();

  try {
    await client.query('BEGIN');

    let subtotal = 0;
    const enrichedBillItems = [];

    for (const item of items) {
      const prodId = item.product_id;
      const qty = parseInt(item.quantity, 10);
      const size = item.size || 'M';

      if (!prodId || qty <= 0) {
        throw new Error('Invalid item or quantity in billing request');
      }

      // 1. Fetch product
      const pRes = await query('SELECT * FROM products WHERE id = $1', [prodId]);
      if (pRes.rows.length === 0) {
        throw new Error(`Product ${prodId} not found`);
      }
      const prod = pRes.rows[0];
      const unitPrice = parseFloat(item.unit_price || prod.price);
      const itemTotal = unitPrice * qty;
      subtotal += itemTotal;

      // 2. Check active unexpired cart reservations for this product and store
      const resRes = await query(
        `SELECT * FROM cart_reservations WHERE product_id = $1 AND store_id = $2`,
        [prodId, store_id]
      );
      const now = Date.now();
      const reservedQty = resRes.rows
        .filter(r => r.status === 'ACTIVE' && new Date(r.expires_at).getTime() > now)
        .reduce((sum, r) => sum + parseInt(r.quantity, 10), 0);

      // 3. Fetch current store inventory
      const invRes = await query(
        `SELECT * FROM store_inventory WHERE store_id = $1 AND product_id = $2`,
        [store_id, prodId]
      );

      const currentStock = invRes.rows.length > 0 ? invRes.rows[0].stock : 0;
      const availableStock = currentStock - reservedQty;

      if (qty > availableStock) {
        throw {
          status: 409,
          code: 'STOCK_UNAVAILABLE',
          message: `Cannot bill "${prod.name_en}": requested ${qty}, but only ${availableStock} available (${reservedQty} reserved in active online customer carts).`,
          messageKn: `"${prod.name_kn || prod.name_en}" ಬಿಲ್ ಮಾಡಲು ಸಾಧ್ಯವಿಲ್ಲ: ಕೋರಲಾದ ಪ್ರಮಾಣ ${qty}, ಆದರೆ ಲಭ್ಯವಿರುವುದು ${availableStock} ಮಾತ್ರ (${reservedQty} ಆನ್‌ಲೈನ್ ಕಾರ್ಟ್‌ಗಳಲ್ಲಿ ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ).`,
        };
      }

      // 4. Atomic conditional update on store inventory
      const updateInvSql = `UPDATE store_inventory SET stock = stock - $1 WHERE store_id = $2 AND product_id = $3 AND stock >= $1`;
      const updateResult = await client.query(updateInvSql, [qty, store_id, prodId]);

      if (updateResult.rowCount === 0) {
        throw {
          status: 409,
          code: 'OUT_OF_STOCK',
          message: `Oversell prevented: "${prod.name_en}" stock just changed. Current store stock is insufficient.`,
          messageKn: `ಸ್ಟಾಕ್ ಖಾಲಿಯಾಗಿದೆ: "${prod.name_kn || prod.name_en}" ಗಾಗಿ ದಾಸ್ತಾನು ಲಭ್ಯವಿಲ್ಲ.`
        };
      }

      // 5. Decrement central stock
      await client.query('UPDATE products SET central_stock = central_stock - $1 WHERE id = $2', [qty, prodId]);

      enrichedBillItems.push({
        id: uuidv4(),
        product_id: prodId,
        name_en: prod.name_en,
        name_kn: prod.name_kn,
        quantity: qty,
        size,
        unit_price: unitPrice,
        total_price: itemTotal
      });
    }

    const discount = parseFloat(discount_amount || 0);
    const taxAmount = Math.round(subtotal * 0.05 * 100) / 100; // 5% GST
    const totalAmount = Math.max(0, Math.round((subtotal + taxAmount - discount) * 100) / 100);

    const billId = uuidv4();
    const billNumber = generateBillNumber();
    const cashierId = req.user?.id || 'user-admin-1';

    // 6. Insert Offline Bill record
    await client.query(
      `INSERT INTO offline_bills (
        id, bill_number, store_id, cashier_id, customer_name, customer_phone, customer_email,
        payment_method, subtotal, tax_amount, discount_amount, total_amount, notes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        billId,
        billNumber,
        store_id,
        cashierId,
        customer_name,
        customer_phone,
        customer_email,
        payment_method,
        subtotal,
        taxAmount,
        discount,
        totalAmount,
        notes,
        'PAID'
      ]
    );

    // 7. Insert Line Items
    for (const bi of enrichedBillItems) {
      await client.query(
        `INSERT INTO offline_bill_items (id, bill_id, product_id, quantity, unit_price, total_price, size)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [bi.id, billId, bi.product_id, bi.quantity, bi.unit_price, bi.total_price, bi.size]
      );
    }

    await client.query('COMMIT');

    // 8. Publish Real-time Business Events to Kafka and Sync OpenSearch / SSE
    const billData = {
      id: billId,
      bill_number: billNumber,
      store_id,
      customer_name,
      customer_phone,
      payment_method,
      subtotal,
      tax_amount: taxAmount,
      discount_amount: discount,
      total_amount: totalAmount,
      items: enrichedBillItems,
      created_at: new Date().toISOString()
    };

    // Publish orders Kafka event
    await publishOfflineBillCreated(billData);

    // Immediately publish stock-updates and sync OpenSearch + SSE
    for (const bi of enrichedBillItems) {
      await publishStockUpdate({
        productId: bi.product_id,
        storeId: store_id,
        delta: -bi.quantity,
        reason: `Offline In-Store POS Bill ${billNumber}`,
        source: 'offline_pos'
      });
      await syncProductStockAndOpenSearch(bi.product_id, store_id, `Offline POS Bill ${billNumber}`);
    }

    // Fetch store info for receipt printing
    const storeRes = await query('SELECT * FROM stores WHERE id = $1', [store_id]);
    const store = storeRes.rows[0] || { name: 'Urban Store Indiranagar Flagship', city: 'Bengaluru' };

    return res.status(201).json({
      success: true,
      message: 'In-store bill created and shared stock decremented successfully',
      bill: {
        ...billData,
        store,
        items: enrichedBillItems
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Billing Error]:', err);
    const status = err.status || 500;
    return res.status(status).json({
      error: err.message || 'Failed to process in-store billing',
      errorKn: err.messageKn || 'ಇನ್-ಸ್ಟೋರ್ ಬಿಲ್ಲಿಂಗ್ ಪ್ರಕ್ರಿಯೆ ವಿಫಲವಾಗಿದೆ'
    });
  }
}

/**
 * Fetch Offline Bill History (searchable, filterable by date, payment method, customer)
 */
export async function getBillHistory(req, res) {
  try {
    const { store_id, startDate, endDate, search, payment_method } = req.query;

    const billsRes = await query('SELECT * FROM offline_bills ORDER BY created_at DESC');
    let bills = billsRes.rows;

    if (store_id) {
      bills = bills.filter(b => b.store_id === store_id);
    }

    if (payment_method && payment_method !== 'ALL') {
      bills = bills.filter(b => b.payment_method?.toUpperCase() === payment_method.toUpperCase());
    }

    if (startDate) {
      const start = new Date(startDate).getTime();
      bills = bills.filter(b => new Date(b.created_at).getTime() >= start);
    }

    if (endDate) {
      const end = new Date(endDate).getTime() + 24 * 3600 * 1000;
      bills = bills.filter(b => new Date(b.created_at).getTime() <= end);
    }

    if (search) {
      const q = search.toLowerCase();
      bills = bills.filter(b =>
        (b.bill_number && b.bill_number.toLowerCase().includes(q)) ||
        (b.customer_name && b.customer_name.toLowerCase().includes(q)) ||
        (b.customer_phone && b.customer_phone.includes(q))
      );
    }

    // Attach items and store names
    const storesRes = await query('SELECT * FROM stores');
    const storeMap = new Map(storesRes.rows.map(s => [s.id, s]));

    const enrichedBills = await Promise.all(
      bills.map(async (bill) => {
        const itemsRes = await query('SELECT * FROM offline_bill_items WHERE bill_id = $1', [bill.id]);
        return {
          ...bill,
          store_name: storeMap.get(bill.store_id)?.name || 'Urban Store Flagship',
          items: itemsRes.rows
        };
      })
    );

    return res.json({
      success: true,
      count: enrichedBills.length,
      bills: enrichedBills
    });
  } catch (err) {
    console.error('[Billing History Error]:', err);
    return res.status(500).json({ error: 'Failed to retrieve bill history' });
  }
}

/**
 * Get single bill for receipt printing
 */
export async function getBillById(req, res) {
  try {
    const { id } = req.params;
    const billRes = await query('SELECT * FROM offline_bills WHERE id = $1', [id]);
    if (billRes.rows.length === 0) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    const bill = billRes.rows[0];
    const itemsRes = await query('SELECT * FROM offline_bill_items WHERE bill_id = $1', [bill.id]);

    const storeRes = await query('SELECT * FROM stores WHERE id = $1', [bill.store_id]);
    const store = storeRes.rows[0] || { name: 'Urban Store Indiranagar', city: 'Bengaluru' };

    return res.json({
      success: true,
      bill: {
        ...bill,
        store,
        items: itemsRes.rows
      }
    });
  } catch (err) {
    console.error('[Bill Details Error]:', err);
    return res.status(500).json({ error: 'Failed to retrieve bill details' });
  }
}

export const createOfflineBill = createBill;
export const getBillingHistory = getBillHistory;


