import pg from 'pg';
import { config } from './env.js';

const { Pool } = pg;

let pool = null;
let isConnected = false;

// In-memory relational store fallback
export const mockDb = {
  users: [],
  stores: [],
  categories: [],
  products: [],
  store_inventory: [],
  carts: [],
  cart_items: [],
  orders: [],
  order_items: [],
  deliveries: [],
  processed_events: new Set(),
  system_logs: [],
  offline_bills: [],
  offline_bill_items: [],
  cart_reservations: [],
  customer_requests: [],
  lost_opportunities: [],
  wishlists: [],
};

// Initialize PostgreSQL Pool
if (config.databaseUrl) {
  try {
    const sslConfig = config.databaseUrl.includes('sslmode=require') || config.databaseUrl.includes('aivencloud.com')
      ? { rejectUnauthorized: config.pgSslRejectUnauthorized }
      : false;

    pool = new Pool({
      connectionString: config.databaseUrl,
      ssl: sslConfig,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('[PostgreSQL] Unexpected client error:', err.message);
    });
  } catch (err) {
    console.warn('[PostgreSQL] Could not initialize connection pool:', err.message);
  }
}

export async function testPostgresConnection() {
  if (!pool) {
    console.log('[PostgreSQL] No DATABASE_URL provided. Running in memory-synced emulation mode.');
    isConnected = false;
    return false;
  }
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW() as now, current_database() as db');
    client.release();
    isConnected = true;
    console.log(`[PostgreSQL] Connected to Aiven PostgreSQL database: ${res.rows[0].db} at ${res.rows[0].now}`);
    return true;
  } catch (err) {
    isConnected = false;
    console.warn(`[PostgreSQL] Connection to Aiven PostgreSQL failed (${err.message}). Using fallback storage.`);
    return false;
  }
}

export function isLivePostgres() {
  return isConnected;
}

export async function query(text, params = []) {
  if (isConnected && pool) {
    return pool.query(text, params);
  }
  // Emulate basic queries in fallback mode
  return emulateQuery(text, params);
}

export async function getClient() {
  if (isConnected && pool) {
    const client = await pool.connect();
    return {
      query: (text, params) => client.query(text, params),
      release: () => client.release(),
      isMock: false,
    };
  }

  // Emulated client for transactions
  let inTransaction = false;
  const undoLog = [];

  return {
    isMock: true,
    query: async (text, params = []) => {
      const trimmed = text.trim().toUpperCase();
      if (trimmed === 'BEGIN') {
        inTransaction = true;
        undoLog.length = 0;
        return { rowCount: 1, rows: [] };
      }
      if (trimmed === 'COMMIT') {
        inTransaction = false;
        undoLog.length = 0;
        return { rowCount: 1, rows: [] };
      }
      if (trimmed === 'ROLLBACK') {
        if (inTransaction) {
          // Only undo changes made by THIS transaction
          while (undoLog.length > 0) {
            const undo = undoLog.pop();
            undo();
          }
        }
        inTransaction = false;
        return { rowCount: 1, rows: [] };
      }
      return emulateQuery(text, params, undoLog);
    },
    release: () => {
      inTransaction = false;
      undoLog.length = 0;
    }
  };
}

// Emulate common relational queries when Aiven PostgreSQL is in local mock mode
function emulateQuery(text, params = [], undoLog = null) {
  const q = text.trim();
  const lower = q.toLowerCase();

  // SELECT from users
  if (lower.startsWith('select') && lower.includes('from users')) {
    if (lower.includes('where email = $1')) {
      const email = params[0]?.toLowerCase();
      const user = mockDb.users.find(u => u.email.toLowerCase() === email);
      return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
    }
    if (lower.includes('where id = $1')) {
      const user = mockDb.users.find(u => u.id === params[0]);
      return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
    }
    return { rows: [...mockDb.users], rowCount: mockDb.users.length };
  }

  // INSERT INTO users
  if (lower.startsWith('insert into users')) {
    const user = {
      id: params[0],
      name: params[1],
      email: params[2],
      password_hash: params[3],
      role: params[4] || 'customer',
      preferred_language: params[5] || 'en',
      created_at: new Date().toISOString(),
    };
    mockDb.users.push(user);
    return { rows: [user], rowCount: 1 };
  }

  // UPDATE users preferred_language
  if (lower.startsWith('update users set preferred_language')) {
    const lang = params[0];
    const userId = params[1];
    const user = mockDb.users.find(u => u.id === userId);
    if (user) user.preferred_language = lang;
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }

  // STORES
  if (lower.startsWith('select') && lower.includes('from stores')) {
    return { rows: [...mockDb.stores], rowCount: mockDb.stores.length };
  }

  // CATEGORIES
  if (lower.startsWith('select') && lower.includes('from categories')) {
    if (lower.includes('where id = any($1)') || lower.includes('where id in')) {
      const ids = Array.isArray(params[0]) ? params[0] : [];
      const filtered = mockDb.categories.filter(c => ids.includes(c.id));
      return { rows: filtered, rowCount: filtered.length };
    }
    return { rows: [...mockDb.categories], rowCount: mockDb.categories.length };
  }
  if (lower.startsWith('delete from categories')) {
    if (lower.includes('!= all($1)') || lower.includes('not in')) {
      const keepIds = Array.isArray(params[0]) ? params[0] : [];
      const before = mockDb.categories.length;
      mockDb.categories = mockDb.categories.filter(c => keepIds.includes(c.id));
      return { rows: [], rowCount: before - mockDb.categories.length };
    }
    return { rows: [], rowCount: 0 };
  }

  // PRODUCTS & INVENTORY
  if (lower.startsWith('delete from products')) {
    if (lower.includes('!= all($1)') || lower.includes('not in')) {
      const keepIds = Array.isArray(params[0]) ? params[0] : [];
      const before = mockDb.products.length;
      mockDb.products = mockDb.products.filter(p => keepIds.includes(p.id));
      return { rows: [], rowCount: before - mockDb.products.length };
    }
    if (lower.includes('where id = $1')) {
      const id = params[0];
      const idx = mockDb.products.findIndex(p => p.id === id);
      if (idx >= 0) {
        mockDb.products.splice(idx, 1);
        return { rows: [], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }
    return { rows: [], rowCount: 0 };
  }
  if (lower.startsWith('select') && lower.includes('from products')) {
    if (lower.includes('where id = $1 or id = $2') || lower.includes('where p.id = $1 or p.id = $2')) {
      const prod = mockDb.products.find(p => p.id === params[0] || p.id === params[1] || p.slug === params[0] || p.slug === params[1]);
      return { rows: prod ? [prod] : [], rowCount: prod ? 1 : 0 };
    }
    if (lower.includes('where id = $1') || lower.includes('where p.id = $1')) {
      const paramVal = params[0];
      const prod = mockDb.products.find(p => p.id === paramVal || p.slug === paramVal || p.id === `prod-${paramVal}`);
      return { rows: prod ? [prod] : [], rowCount: prod ? 1 : 0 };
    }
    return { rows: [...mockDb.products], rowCount: mockDb.products.length };
  }

  // STORE_INVENTORY updates
  if (lower.startsWith('update store_inventory set stock =')) {
    // 1. Atomic decrement: stock = stock - ...
    if (lower.includes('stock = stock -')) {
      let qty = 1;
      let storeId = '';
      let productId = '';

      if (lower.includes('stock - $1')) {
        qty = parseInt(params[0], 10);
        storeId = params[1];
        productId = params[2];
      } else {
        // e.g. stock = stock - 1 where store_id = $1 and product_id = $2
        const match = lower.match(/stock\s*-\s*(\d+)/);
        if (match) qty = parseInt(match[1], 10);
        storeId = params[0];
        productId = params[1];
      }

      const inv = mockDb.store_inventory.find(i => i.store_id === storeId && i.product_id === productId);
      if (inv && inv.stock >= qty) {
        const prevStock = inv.stock;
        inv.stock -= qty;
        inv.updated_at = new Date().toISOString();
        if (undoLog) {
          undoLog.push(() => {
            inv.stock = prevStock;
          });
        }
        return { rows: [inv], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    // 2. Direct set: stock = $1 or stock = 1
    let newStock = 0;
    let storeId = '';
    let productId = '';

    if (lower.includes('stock = $1')) {
      newStock = parseInt(params[0], 10);
      storeId = params[1];
      productId = params[2];
    } else {
      const match = lower.match(/stock\s*=\s*(\d+)/);
      if (match) newStock = parseInt(match[1], 10);
      storeId = params[0];
      productId = params[1];
    }

    const inv = mockDb.store_inventory.find(i => i.store_id === storeId && i.product_id === productId);
    if (inv) {
      inv.stock = newStock;
      inv.updated_at = new Date().toISOString();
      return { rows: [inv], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // CENTRAL INVENTORY atomic update
  if (lower.startsWith('update products set central_stock = central_stock - $1')) {
    const qty = parseInt(params[0], 10);
    const productId = params[1];
    const prod = mockDb.products.find(p => p.id === productId);
    if (prod && prod.central_stock >= qty) {
      prod.central_stock -= qty;
      prod.updated_at = new Date().toISOString();
      return { rows: [prod], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // STORE_INVENTORY select & delete
  if (lower.startsWith('delete from store_inventory')) {
    if (lower.includes('product_id != all($1)') || lower.includes('not in')) {
      const keepIds = Array.isArray(params[0]) ? params[0] : [];
      const before = mockDb.store_inventory.length;
      mockDb.store_inventory = mockDb.store_inventory.filter(si => keepIds.includes(si.product_id));
      return { rows: [], rowCount: before - mockDb.store_inventory.length };
    }
    return { rows: [], rowCount: 0 };
  }
  if (lower.startsWith('select') && lower.includes('from store_inventory')) {
    if (lower.includes('join stores') || lower.includes('join stores s')) {
      const prodId = params[0];
      const invs = mockDb.store_inventory.filter(i => i.product_id === prodId);
      const joined = invs.map(i => {
        const store = mockDb.stores.find(s => s.id === i.store_id) || {};
        return {
          store_id: i.store_id,
          stock: i.stock,
          store_name: store.name || 'Urban Store Flagship',
          city: store.city || 'Bengaluru',
          latitude: store.latitude || 12.9716,
          longitude: store.longitude || 77.5946,
          delivery_radius_km: store.delivery_radius_km || 5.0,
        };
      });
      return { rows: joined, rowCount: joined.length };
    }
    if (lower.includes('where store_id = $1 and product_id = $2')) {
      const inv = mockDb.store_inventory.find(i => i.store_id === params[0] && i.product_id === params[1]);
      return { rows: inv ? [inv] : [], rowCount: inv ? 1 : 0 };
    }
    if (lower.includes('where product_id = $1') || lower.includes('si.product_id = $1') || lower.includes('product_id = $1')) {
      const invs = mockDb.store_inventory.filter(i => i.product_id === params[0]);
      return { rows: invs, rowCount: invs.length };
    }
    return { rows: [...mockDb.store_inventory], rowCount: mockDb.store_inventory.length };
  }

  // CARTS
  if (lower.startsWith('select') && lower.includes('from carts')) {
    const cart = mockDb.carts.find(c => c.user_id === params[0]);
    return { rows: cart ? [cart] : [], rowCount: cart ? 1 : 0 };
  }
  if (lower.startsWith('insert into carts')) {
    const cart = { id: params[0], user_id: params[1], updated_at: new Date().toISOString() };
    mockDb.carts.push(cart);
    return { rows: [cart], rowCount: 1 };
  }

  // CART_ITEMS
  if (lower.startsWith('select') && lower.includes('from cart_items')) {
    if (lower.includes('where cart_id = $1 and product_id = $2')) {
      const item = mockDb.cart_items.find(ci => ci.cart_id === params[0] && ci.product_id === params[1]);
      return { rows: item ? [item] : [], rowCount: item ? 1 : 0 };
    }
    const items = mockDb.cart_items.filter(ci => ci.cart_id === params[0]);
    return { rows: items, rowCount: items.length };
  }
  if (lower.startsWith('update cart_items set quantity = $1')) {
    const qty = parseInt(params[0], 10);
    const cartId = params[1];
    const productId = params[2];
    const item = mockDb.cart_items.find(ci => ci.cart_id === cartId && ci.product_id === productId);
    if (item) {
      item.quantity = qty;
      item.updated_at = new Date().toISOString();
      return { rows: [item], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }
  if (lower.startsWith('insert into cart_items')) {
    const cartId = params[1];
    const productId = params[2];
    const qty = parseInt(params[3], 10);
    const existing = mockDb.cart_items.find(ci => ci.cart_id === cartId && ci.product_id === productId);
    if (existing) {
      existing.quantity += qty;
      existing.updated_at = new Date().toISOString();
      return { rows: [existing], rowCount: 1 };
    }
    const item = { id: params[0], cart_id: cartId, product_id: productId, quantity: qty, updated_at: new Date().toISOString() };
    mockDb.cart_items.push(item);
    return { rows: [item], rowCount: 1 };
  }
  if (lower.startsWith('delete from cart_items')) {
    if (lower.includes('product_id != all($1)') || lower.includes('not in')) {
      const keepIds = Array.isArray(params[0]) ? params[0] : [];
      const before = mockDb.cart_items.length;
      mockDb.cart_items = mockDb.cart_items.filter(ci => keepIds.includes(ci.product_id));
      return { rows: [], rowCount: before - mockDb.cart_items.length };
    }
    if (lower.includes('where cart_id = $1 and product_id = $2')) {
      mockDb.cart_items = mockDb.cart_items.filter(ci => !(ci.cart_id === params[0] && ci.product_id === params[1]));
      return { rowCount: 1 };
    }
    if (lower.includes('where cart_id = $1')) {
      mockDb.cart_items = mockDb.cart_items.filter(ci => ci.cart_id !== params[0]);
      return { rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // ORDERS
  if (lower.startsWith('insert into orders')) {
    const order = {
      id: params[0],
      order_number: params[1],
      user_id: params[2],
      store_id: params[3],
      delivery_type: params[4],
      status: params[5],
      subtotal: parseFloat(params[6]),
      delivery_fee: parseFloat(params[7]),
      total_amount: parseFloat(params[8]),
      eta_minutes: parseInt(params[9], 10),
      customer_name: params[10],
      customer_email: params[11],
      delivery_address: params[12],
      delivery_lat: parseFloat(params[13]),
      delivery_lng: parseFloat(params[14]),
      distance_km: parseFloat(params[15]),
      co2_kg: parseFloat(params[16]),
      language: params[17],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockDb.orders.push(order);
    return { rows: [order], rowCount: 1 };
  }

  if (lower.startsWith('select') && lower.includes('from orders')) {
    if (lower.includes('where id = $1')) {
      const o = mockDb.orders.find(ord => ord.id === params[0]);
      return { rows: o ? [o] : [], rowCount: o ? 1 : 0 };
    }
    if (lower.includes('where order_number = $1')) {
      const o = mockDb.orders.find(ord => ord.order_number === params[0]);
      return { rows: o ? [o] : [], rowCount: o ? 1 : 0 };
    }
    if (lower.includes('where user_id = $1')) {
      const ords = mockDb.orders.filter(ord => ord.user_id === params[0]).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
      return { rows: ords, rowCount: ords.length };
    }
    return { rows: [...mockDb.orders].reverse(), rowCount: mockDb.orders.length };
  }

  if (lower.startsWith('update orders set status')) {
    const status = params[0];
    const orderId = params[1];
    const order = mockDb.orders.find(o => o.id === orderId);
    if (order) {
      order.status = status;
      order.updated_at = new Date().toISOString();
    }
    return { rows: order ? [order] : [], rowCount: order ? 1 : 0 };
  }

  // ORDER_ITEMS
  if (lower.startsWith('delete from order_items')) {
    if (lower.includes('product_id != all($1)') || lower.includes('not in')) {
      const keepIds = Array.isArray(params[0]) ? params[0] : [];
      const before = mockDb.order_items.length;
      mockDb.order_items = mockDb.order_items.filter(oi => keepIds.includes(oi.product_id));
      return { rows: [], rowCount: before - mockDb.order_items.length };
    }
    return { rows: [], rowCount: 0 };
  }
  if (lower.startsWith('insert into order_items')) {
    const item = {
      id: params[0],
      order_id: params[1],
      product_id: params[2],
      store_id: params[3],
      quantity: parseInt(params[4], 10),
      unit_price: parseFloat(params[5]),
      total_price: parseFloat(params[6]),
    };
    mockDb.order_items.push(item);
    return { rows: [item], rowCount: 1 };
  }
  if (lower.startsWith('select') && lower.includes('from order_items')) {
    const items = mockDb.order_items.filter(oi => oi.order_id === params[0]);
    return { rows: items, rowCount: items.length };
  }

  // DELIVERIES
  if (lower.startsWith('insert into deliveries')) {
    const del = {
      id: params[0],
      order_id: params[1],
      store_id: params[2],
      rider_name: params[3],
      rider_phone: params[4],
      status: params[5],
      current_lat: parseFloat(params[6]),
      current_lng: parseFloat(params[7]),
      target_lat: parseFloat(params[8]),
      target_lng: parseFloat(params[9]),
      eta_minutes: parseInt(params[10], 10),
      updated_at: new Date().toISOString(),
    };
    mockDb.deliveries.push(del);
    return { rows: [del], rowCount: 1 };
  }
  if (lower.startsWith('select') && lower.includes('from deliveries')) {
    if (lower.includes('where order_id = $1')) {
      const del = mockDb.deliveries.find(d => d.order_id === params[0]);
      return { rows: del ? [del] : [], rowCount: del ? 1 : 0 };
    }
  }
  if (lower.startsWith('update deliveries set')) {
    // update status, lat, lng, eta
    const status = params[0];
    const lat = parseFloat(params[1]);
    const lng = parseFloat(params[2]);
    const eta = parseInt(params[3], 10);
    const orderId = params[4];
    const del = mockDb.deliveries.find(d => d.order_id === orderId);
    if (del) {
      del.status = status;
      del.current_lat = lat;
      del.current_lng = lng;
      del.eta_minutes = eta;
      del.updated_at = new Date().toISOString();
    }
    return { rows: del ? [del] : [], rowCount: del ? 1 : 0 };
  }

  // PROCESSED_EVENTS (Consumer Idempotency)
  if (lower.includes('insert into processed_events')) {
    const eventId = params[0];
    if (mockDb.processed_events.has(eventId)) {
      const err = new Error('duplicate key value violates unique constraint');
      err.code = '23505';
      throw err;
    }
    mockDb.processed_events.add(eventId);
    return { rowCount: 1 };
  }

  // SYSTEM_LOGS
  if (lower.startsWith('insert into system_logs')) {
    const log = {
      id: params[0],
      event_type: params[1],
      details: params[2],
      created_at: new Date().toISOString(),
    };
    mockDb.system_logs.unshift(log);
    if (mockDb.system_logs.length > 100) mockDb.system_logs.pop();
    return { rows: [log], rowCount: 1 };
  }

  // OFFLINE_BILLS
  if (lower.startsWith('insert into offline_bills')) {
    const bill = {
      id: params[0],
      bill_number: params[1],
      store_id: params[2],
      cashier_id: params[3],
      customer_name: params[4] || 'Walk-in Customer',
      customer_phone: params[5] || '',
      customer_email: params[6] || '',
      payment_method: params[7] || 'CASH',
      subtotal: parseFloat(params[8] || 0),
      tax_amount: parseFloat(params[9] || 0),
      discount_amount: parseFloat(params[10] || 0),
      total_amount: parseFloat(params[11] || 0),
      notes: params[12] || '',
      status: params[13] || 'PAID',
      created_at: new Date().toISOString(),
    };
    mockDb.offline_bills.unshift(bill);
    return { rows: [bill], rowCount: 1 };
  }

  if (lower.startsWith('select') && lower.includes('from offline_bills')) {
    if (lower.includes('where id = $1')) {
      const b = mockDb.offline_bills.find(bill => bill.id === params[0] || bill.bill_number === params[0]);
      return { rows: b ? [b] : [], rowCount: b ? 1 : 0 };
    }
    return { rows: [...mockDb.offline_bills], rowCount: mockDb.offline_bills.length };
  }

  // OFFLINE_BILL_ITEMS
  if (lower.startsWith('insert into offline_bill_items')) {
    const item = {
      id: params[0],
      bill_id: params[1],
      product_id: params[2],
      quantity: parseInt(params[3], 10),
      unit_price: parseFloat(params[4]),
      total_price: parseFloat(params[5]),
      size: params[6] || 'M'
    };
    mockDb.offline_bill_items.push(item);
    return { rows: [item], rowCount: 1 };
  }

  if (lower.startsWith('select') && lower.includes('from offline_bill_items')) {
    if (lower.includes('where bill_id = $1')) {
      const items = mockDb.offline_bill_items.filter(bi => bi.bill_id === params[0]);
      return { rows: items, rowCount: items.length };
    }
    return { rows: [...mockDb.offline_bill_items], rowCount: mockDb.offline_bill_items.length };
  }

  // CART_RESERVATIONS
  if (lower.startsWith('insert into cart_reservations')) {
    const res = {
      id: params[0],
      cart_id: params[1],
      user_id: params[2],
      product_id: params[3],
      store_id: params[4],
      quantity: parseInt(params[5], 10),
      size: params[6] || 'M',
      reserved_at: new Date().toISOString(),
      expires_at: params[7] ? new Date(params[7]).toISOString() : new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      reminder_sent: false,
      status: 'ACTIVE'
    };
    // remove any old active reservation for same user & product
    mockDb.cart_reservations = mockDb.cart_reservations.filter(r => !(r.user_id === res.user_id && r.product_id === res.product_id && r.status === 'ACTIVE'));
    mockDb.cart_reservations.push(res);
    return { rows: [res], rowCount: 1 };
  }

  if (lower.startsWith('select') && lower.includes('from cart_reservations')) {
    const now = Date.now();
    // Auto-expire
    mockDb.cart_reservations.forEach(r => {
      if (r.status === 'ACTIVE' && new Date(r.expires_at).getTime() <= now) {
        r.status = 'EXPIRED';
      }
    });

    if (lower.includes('where user_id = $1')) {
      const active = mockDb.cart_reservations.filter(r => r.user_id === params[0] && r.status === 'ACTIVE');
      return { rows: active, rowCount: active.length };
    }
    if (lower.includes('where product_id = $1 and store_id = $2')) {
      const active = mockDb.cart_reservations.filter(r => r.product_id === params[0] && r.store_id === params[1] && r.status === 'ACTIVE');
      return { rows: active, rowCount: active.length };
    }
    if (lower.includes('where product_id = $1')) {
      const active = mockDb.cart_reservations.filter(r => r.product_id === params[0] && r.status === 'ACTIVE');
      return { rows: active, rowCount: active.length };
    }
    return { rows: [...mockDb.cart_reservations], rowCount: mockDb.cart_reservations.length };
  }

  if (lower.startsWith('update cart_reservations')) {
    if (lower.includes('set status = $1 where user_id = $2')) {
      const newStatus = params[0];
      const userId = params[1];
      mockDb.cart_reservations.forEach(r => {
        if (r.user_id === userId && r.status === 'ACTIVE') r.status = newStatus;
      });
      return { rowCount: 1 };
    }
    if (lower.includes('set reminder_sent = true where id = $1')) {
      const r = mockDb.cart_reservations.find(res => res.id === params[0]);
      if (r) r.reminder_sent = true;
      return { rowCount: 1 };
    }
    if (lower.includes("set status = 'expired'")) {
      const now = Date.now();
      let count = 0;
      mockDb.cart_reservations.forEach(r => {
        if (r.status === 'ACTIVE' && new Date(r.expires_at).getTime() <= now) {
          r.status = 'EXPIRED';
          count++;
        }
      });
      return { rowCount: count };
    }
  }

  // CUSTOMER_REQUESTS
  if (lower.startsWith('insert into customer_requests')) {
    // Check if column list specified or positional
    const req = {
      id: params[0],
      request_number: params[1]?.startsWith('#REQ') ? params[1] : `#REQ-${Math.floor(1000 + Math.random() * 9000)}`,
      request_type: params[1]?.startsWith('#REQ') ? params[2] : params[1],
      user_id: params[1]?.startsWith('#REQ') ? params[3] : params[2],
      order_id: params[1]?.startsWith('#REQ') ? params[4] : params[3],
      product_id: params[1]?.startsWith('#REQ') ? params[5] : params[4],
      item_id: params[1]?.startsWith('#REQ') ? null : params[5],
      status: (params[1]?.startsWith('#REQ') ? params[11] : params[6]) || 'PENDING',
      reason: (params[1]?.startsWith('#REQ') ? params[9] : params[7]) || '',
      refund_amount: parseFloat((params[1]?.startsWith('#REQ') ? params[10] : params[8]) || 0),
      refund_method: 'ORIGINAL_PAYMENT_METHOD',
      admin_notes: (params[1]?.startsWith('#REQ') ? params[12] : params[10]) || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockDb.customer_requests.unshift(req);
    return { rows: [req], rowCount: 1 };
  }

  if (lower.startsWith('select') && lower.includes('from customer_requests')) {
    if (lower.includes('where id = $1')) {
      const r = mockDb.customer_requests.find(cr => cr.id === params[0] || cr.request_number === params[0]);
      return { rows: r ? [r] : [], rowCount: r ? 1 : 0 };
    }
    if (lower.includes('where user_id = $1') || lower.includes('where cr.user_id = $1')) {
      const reqs = mockDb.customer_requests.filter(cr => cr.user_id === params[0]);
      return { rows: reqs, rowCount: reqs.length };
    }
    return { rows: [...mockDb.customer_requests], rowCount: mockDb.customer_requests.length };
  }

  if (lower.startsWith('update customer_requests') && lower.includes('set status = $1')) {
    const newStatus = params[0];
    const notes = params[1] || '';
    const reqId = params[2];
    const r = mockDb.customer_requests.find(cr => cr.id === reqId || cr.request_number === reqId);
    if (r) {
      r.status = newStatus;
      if (notes) r.admin_notes = notes;
      r.updated_at = new Date().toISOString();
      return { rows: [r], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // LOST_OPPORTUNITIES
  if (lower.startsWith('insert into lost_opportunities')) {
    const id = params[0];
    const queryStr = params[1];
    const norm = (params[2] || queryStr).toLowerCase().trim();
    const catId = params[3] || null;
    const prodId = params[4] || null;
    const prodName = params[5] || queryStr;
    const estRev = parseFloat(params[6] || 2500);

    let existing = mockDb.lost_opportunities.find(lo => lo.normalized_query === norm);
    if (existing) {
      existing.search_count += 1;
      existing.estimated_lost_revenue += estRev;
      existing.last_searched_at = new Date().toISOString();
      return { rows: [existing], rowCount: 1 };
    } else {
      const item = {
        id,
        query: queryStr,
        normalized_query: norm,
        category_id: catId,
        product_id: prodId,
        product_name: prodName,
        search_count: 1,
        estimated_lost_revenue: estRev,
        last_searched_at: new Date().toISOString(),
      };
      mockDb.lost_opportunities.push(item);
      return { rows: [item], rowCount: 1 };
    }
  }

  if (lower.startsWith('select') && lower.includes('from lost_opportunities')) {
    const sorted = [...mockDb.lost_opportunities].sort((a,b) => b.search_count - a.search_count);
    return { rows: sorted, rowCount: sorted.length };
  }

  // WISHLISTS
  if (lower.startsWith('select') && lower.includes('from wishlists')) {
    if (lower.includes('where user_id = $1 and product_id = $2') || lower.includes('where w.user_id = $1 and w.product_id = $2')) {
      const item = mockDb.wishlists.find(w => w.user_id === params[0] && w.product_id === params[1]);
      return { rows: item ? [item] : [], rowCount: item ? 1 : 0 };
    }
    if (lower.includes('where user_id = $1') || lower.includes('where w.user_id = $1')) {
      const items = mockDb.wishlists.filter(w => w.user_id === params[0]);
      return { rows: items, rowCount: items.length };
    }
    return { rows: [...mockDb.wishlists], rowCount: mockDb.wishlists.length };
  }

  if (lower.startsWith('insert into wishlists')) {
    const id = params[0];
    const userId = params[1];
    const productId = params[2];
    const existing = mockDb.wishlists.find(w => w.user_id === userId && w.product_id === productId);
    if (!existing) {
      const entry = { id, user_id: userId, product_id: productId, created_at: new Date().toISOString() };
      mockDb.wishlists.push(entry);
      return { rows: [entry], rowCount: 1 };
    }
    return { rows: [existing], rowCount: 1 };
  }

  if (lower.startsWith('delete from wishlists')) {
    if (lower.includes('where user_id = $1 and product_id = $2')) {
      const idx = mockDb.wishlists.findIndex(w => w.user_id === params[0] && w.product_id === params[1]);
      if (idx >= 0) {
        mockDb.wishlists.splice(idx, 1);
        return { rows: [], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }
    if (lower.includes('where user_id = $1')) {
      mockDb.wishlists = mockDb.wishlists.filter(w => w.user_id !== params[0]);
      return { rows: [], rowCount: 1 };
    }
  }

  return { rows: [], rowCount: 0 };
}
