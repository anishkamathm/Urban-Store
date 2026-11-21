import { query } from '../config/postgres.js';

/**
 * Get unified purchase history (Online Orders + Offline POS Bills) with sales summaries
 */
export async function getPurchaseHistory(req, res) {
  try {
    const {
      channel = 'ALL', // 'ALL', 'ONLINE', 'OFFLINE'
      search = '',
      date_from,
      date_to,
      store_id,
      page = 1,
      limit = 50,
    } = req.query;

    const allRecords = [];

    // 1. Fetch Online Orders (unless channel === 'OFFLINE')
    if (channel === 'ALL' || channel === 'ONLINE') {
      const ordersRes = await query('SELECT * FROM orders ORDER BY created_at DESC');
      const orderItemsRes = await query('SELECT * FROM order_items');
      const storesRes = await query('SELECT id, name FROM stores');
      const storesMap = new Map(storesRes.rows.map(s => [s.id, s.name]));

      for (const ord of ordersRes.rows) {
        const items = orderItemsRes.rows.filter(item => item.order_id === ord.id);
        allRecords.push({
          id: ord.id,
          number: ord.order_number,
          channel: 'ONLINE',
          customerName: ord.customer_name || 'Online Customer',
          customerContact: ord.customer_email || '',
          storeId: ord.store_id,
          storeName: storesMap.get(ord.store_id) || 'Central Warehouse',
          subtotal: parseFloat(ord.subtotal || 0),
          deliveryFee: parseFloat(ord.delivery_fee || 0),
          discount: 0,
          tax: 0,
          totalAmount: parseFloat(ord.total_amount || 0),
          status: ord.status,
          paymentMethod: 'ONLINE_CARD_UPI',
          itemCount: items.reduce((acc, i) => acc + (parseInt(i.quantity, 10) || 1), 0),
          items: items.map(i => ({
            productId: i.product_id,
            quantity: i.quantity,
            unitPrice: parseFloat(i.unit_price),
            totalPrice: parseFloat(i.total_price),
          })),
          createdAt: ord.created_at,
        });
      }
    }

    // 2. Fetch Offline Bills (unless channel === 'ONLINE')
    if (channel === 'ALL' || channel === 'OFFLINE') {
      const billsRes = await query('SELECT * FROM offline_bills ORDER BY created_at DESC');
      const billItemsRes = await query('SELECT * FROM offline_bill_items');
      const storesRes = await query('SELECT id, name FROM stores');
      const storesMap = new Map(storesRes.rows.map(s => [s.id, s.name]));

      for (const bill of billsRes.rows) {
        const items = billItemsRes.rows.filter(item => item.bill_id === bill.id);
        allRecords.push({
          id: bill.id,
          number: bill.bill_number,
          channel: 'OFFLINE',
          customerName: bill.customer_name || 'Walk-in Customer',
          customerContact: bill.customer_phone || '',
          storeId: bill.store_id,
          storeName: storesMap.get(bill.store_id) || 'Store POS',
          subtotal: parseFloat(bill.subtotal || 0),
          deliveryFee: 0,
          discount: parseFloat(bill.discount_amount || 0),
          tax: parseFloat(bill.tax_amount || 0),
          totalAmount: parseFloat(bill.total_amount || 0),
          status: 'PAID',
          paymentMethod: bill.payment_method || 'CASH',
          itemCount: items.reduce((acc, i) => acc + (parseInt(i.quantity, 10) || 1), 0),
          items: items.map(i => ({
            productId: i.product_id,
            productName: i.product_name,
            quantity: i.quantity,
            unitPrice: parseFloat(i.unit_price),
            totalPrice: parseFloat(i.total_price),
          })),
          cashierName: bill.cashier_name,
          createdAt: bill.created_at,
        });
      }
    }

    // Sort descending by date
    allRecords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 3. Calculate Summaries (Daily, Weekly, Monthly, and Channel)
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    let dailyRevenue = 0;
    let dailyTransactions = 0;
    let weeklyRevenue = 0;
    let weeklyTransactions = 0;
    let monthlyRevenue = 0;
    let monthlyTransactions = 0;
    let onlineRevenue = 0;
    let offlineRevenue = 0;

    for (const rec of allRecords) {
      const recTime = new Date(rec.createdAt).getTime();
      const amount = rec.totalAmount || 0;

      if (recTime >= startOfToday) {
        dailyRevenue += amount;
        dailyTransactions++;
      }
      if (recTime >= sevenDaysAgo) {
        weeklyRevenue += amount;
        weeklyTransactions++;
      }
      if (recTime >= thirtyDaysAgo) {
        monthlyRevenue += amount;
        monthlyTransactions++;
      }

      if (rec.channel === 'ONLINE') {
        onlineRevenue += amount;
      } else {
        offlineRevenue += amount;
      }
    }

    // 4. Apply Filters to the returned list
    let filtered = allRecords;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(rec =>
        (rec.number && rec.number.toLowerCase().includes(q)) ||
        (rec.customerName && rec.customerName.toLowerCase().includes(q)) ||
        (rec.customerContact && rec.customerContact.toLowerCase().includes(q)) ||
        (rec.storeName && rec.storeName.toLowerCase().includes(q)) ||
        (rec.items && rec.items.some(i => i.productName && i.productName.toLowerCase().includes(q)))
      );
    }

    if (store_id) {
      filtered = filtered.filter(rec => rec.storeId === store_id);
    }

    if (date_from) {
      const fromTime = new Date(date_from).getTime();
      filtered = filtered.filter(rec => new Date(rec.createdAt).getTime() >= fromTime);
    }

    if (date_to) {
      const toTime = new Date(date_to).getTime() + (24 * 60 * 60 * 1000 - 1);
      filtered = filtered.filter(rec => new Date(rec.createdAt).getTime() <= toTime);
    }

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(startIndex, startIndex + limitNum);

    res.json({
      summary: {
        daily: {
          revenue: Math.round(dailyRevenue * 100) / 100,
          transactions: dailyTransactions,
        },
        weekly: {
          revenue: Math.round(weeklyRevenue * 100) / 100,
          transactions: weeklyTransactions,
        },
        monthly: {
          revenue: Math.round(monthlyRevenue * 100) / 100,
          transactions: monthlyTransactions,
        },
        channelBreakdown: {
          online: Math.round(onlineRevenue * 100) / 100,
          offline: Math.round(offlineRevenue * 100) / 100,
          total: Math.round((onlineRevenue + offlineRevenue) * 100) / 100,
        }
      },
      pagination: {
        total: filtered.length,
        page: pageNum,
        totalPages: Math.ceil(filtered.length / limitNum),
      },
      records: paginated,
    });
  } catch (err) {
    console.error('[PurchaseHistoryController] getPurchaseHistory error:', err);
    res.status(500).json({ error: 'Failed to retrieve purchase history', details: err.message });
  }
}
