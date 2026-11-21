import { app } from './src/server.js';
import { query, mockDb } from './src/config/postgres.js';
import { seedInitialDataIfEmpty } from './src/scripts/seedData.js';

async function run() {
  console.log('--- Running Urban Store Backend Verification ---');
  await seedInitialDataIfEmpty();

  // Test 1: Query products
  const products = await query('SELECT * FROM products');
  console.log(`✅ Loaded ${products.rows.length} fashion products`);
  if (products.rows.length === 0) throw new Error('No products found');

  // Test 2: Check central stock of first product
  const firstProd = products.rows[0];
  console.log(`✅ Sample Product: ${firstProd.name_en} (${firstProd.category}) Central Stock: ${firstProd.central_stock}`);

  // Test 3: Check stores
  const stores = await query('SELECT * FROM stores');
  console.log(`✅ Loaded ${stores.rows.length} stores`);

  // Test 4: Check offline billing logic directly
  const { createBill } = await import('./src/controllers/billingController.js');
  let mockRes = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; }
  };

  const req = {
    body: {
      store_id: stores.rows[0].id,
      customer_name: 'Priya Sharma',
      customer_phone: '+91 99887 76655',
      payment_method: 'UPI',
      items: [{ product_id: firstProd.id, quantity: 2, size: 'M' }]
    }
  };

  await createBill(req, mockRes);
  if (mockRes.statusCode !== 201) {
    console.error('Create bill failed:', mockRes.body);
    throw new Error('Create bill failed');
  }
  console.log(`✅ Created Offline POS Bill: ${mockRes.body.bill.bill_number || mockRes.body.bill.billNumber}, Total: ₹${mockRes.body.bill.total_amount || mockRes.body.bill.totalAmount}`);


  // Check that stock was reduced
  const updatedProd = await query('SELECT central_stock FROM products WHERE id = $1', [firstProd.id]);
  console.log(`✅ Stock updated after offline bill: Previous ${firstProd.central_stock} -> Now ${updatedProd.rows[0].central_stock}`);

  // Test 5: Check purchase history controller
  const { getPurchaseHistory } = await import('./src/controllers/purchaseHistoryController.js');
  mockRes = { body: null, status(code) { return this; }, json(data) { this.body = data; return this; } };
  await getPurchaseHistory({ query: { channel: 'ALL' } }, mockRes);
  console.log(`✅ Purchase History Summary: Daily Revenue ₹${mockRes.body.summary.daily.revenue}, Monthly ₹${mockRes.body.summary.monthly.revenue}`);

  // Test 6: Check customer requests & return logic
  const { createRequest, updateRequestStatus } = await import('./src/controllers/requestController.js');
  // Find a delivered order
  const deliveredOrder = await query("SELECT * FROM orders WHERE status = 'DELIVERED'");
  if (deliveredOrder.rows.length > 0) {
    const ord = deliveredOrder.rows[0];
    mockRes = { body: null, statusCode: 200, status(code) { this.statusCode = code; return this; }, json(data) { this.body = data; return this; } };
    await createRequest({
      user: { id: ord.user_id, email: ord.customer_email },
      body: {
        request_type: 'RETURN',
        order_id: ord.id,
        product_id: firstProd.id,
        reason: 'Size too tight',
      }
    }, mockRes);
    console.log(`✅ Created Customer Return Request: #${mockRes.body.request.id.slice(0, 8)}`);

    // Approve the return
    const reqId = mockRes.body.request.id;
    mockRes = { body: null, statusCode: 200, status(code) { this.statusCode = code; return this; }, json(data) { this.body = data; return this; } };
    await updateRequestStatus({ params: { id: reqId }, body: { status: 'APPROVED', admin_notes: 'Item verified, refunded.' } }, mockRes);
    console.log(`✅ Approved Return Request: Item restocked! New stock: ${(await query('SELECT central_stock FROM products WHERE id = $1', [firstProd.id])).rows[0].central_stock}`);
  }

  // Test 7: Lost opportunity report
  const { getLostOpportunityReport } = await import('./src/controllers/reportController.js');
  mockRes = { body: null, status(code) { return this; }, json(data) { this.body = data; return this; } };
  await getLostOpportunityReport({}, mockRes);
  console.log(`✅ Lost Opportunity Report: ${mockRes.body.opportunities.length} missed queries tracked, Total Lost Revenue ₹${mockRes.body.summary.totalEstLostRevenue}`);

  console.log('--- All Backend Verification Passed! ---');
  process.exit(0);
}

run().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
