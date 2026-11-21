-- Migration 001: Urban Store POS Billing, Cart Reservations, Customer Requests, and Lost Opportunities

-- 1. Offline POS Bills for in-store sales
CREATE TABLE IF NOT EXISTS offline_bills (
  id VARCHAR(64) PRIMARY KEY,
  bill_number VARCHAR(32) UNIQUE NOT NULL,
  store_id VARCHAR(64) REFERENCES stores(id) ON DELETE SET NULL,
  cashier_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  customer_name VARCHAR(255) NOT NULL DEFAULT 'Walk-in Customer',
  customer_phone VARCHAR(64),
  customer_email VARCHAR(255),
  payment_method VARCHAR(32) NOT NULL DEFAULT 'CASH', -- CASH, CARD, UPI
  subtotal NUMERIC(10, 2) NOT NULL,
  tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(10, 2) NOT NULL,
  notes TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'PAID',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Offline Bill Line Items
CREATE TABLE IF NOT EXISTS offline_bill_items (
  id VARCHAR(64) PRIMARY KEY,
  bill_id VARCHAR(64) REFERENCES offline_bills(id) ON DELETE CASCADE,
  product_id VARCHAR(64) REFERENCES products(id) ON DELETE SET NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL,
  total_price NUMERIC(10, 2) NOT NULL,
  size VARCHAR(32) DEFAULT 'M'
);

-- 3. Cart Reservations (10-minute hold with 8-minute reminder)
CREATE TABLE IF NOT EXISTS cart_reservations (
  id VARCHAR(64) PRIMARY KEY,
  cart_id VARCHAR(64) REFERENCES carts(id) ON DELETE CASCADE,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  product_id VARCHAR(64) REFERENCES products(id) ON DELETE CASCADE,
  store_id VARCHAR(64) REFERENCES stores(id) ON DELETE SET NULL,
  quantity INT NOT NULL DEFAULT 1,
  size VARCHAR(32) DEFAULT 'M',
  reserved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  reminder_sent BOOLEAN DEFAULT FALSE,
  status VARCHAR(32) DEFAULT 'ACTIVE' -- ACTIVE, EXPIRED, ORDERED
);

-- 4. Customer Requests (Returns within 7 days, Cancellations, Restock alerts)
CREATE TABLE IF NOT EXISTS customer_requests (
  id VARCHAR(64) PRIMARY KEY,
  request_number VARCHAR(32) UNIQUE NOT NULL,
  request_type VARCHAR(32) NOT NULL, -- 'RETURN', 'CANCELLATION', 'RESTOCK_ALERT'
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  order_id VARCHAR(64) REFERENCES orders(id) ON DELETE SET NULL,
  product_id VARCHAR(64) REFERENCES products(id) ON DELETE SET NULL,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(64),
  customer_email VARCHAR(255),
  reason TEXT,
  refund_amount NUMERIC(10, 2) DEFAULT 0.00,
  status VARCHAR(32) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'completed'
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Lost Opportunities (Tracking unavailable & out-of-stock search demand)
CREATE TABLE IF NOT EXISTS lost_opportunities (
  id VARCHAR(64) PRIMARY KEY,
  query VARCHAR(255) NOT NULL,
  normalized_query VARCHAR(255) NOT NULL UNIQUE,
  category_id VARCHAR(64),
  product_id VARCHAR(64),
  product_name VARCHAR(255),
  search_count INT DEFAULT 1,
  estimated_lost_revenue NUMERIC(10, 2) DEFAULT 0.00,
  last_searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_offline_bills_date ON offline_bills(created_at);
CREATE INDEX IF NOT EXISTS idx_offline_bills_store ON offline_bills(store_id);
CREATE INDEX IF NOT EXISTS idx_cart_res_active ON cart_reservations(product_id, store_id, status, expires_at);
CREATE INDEX IF NOT EXISTS idx_requests_status ON customer_requests(status);
CREATE INDEX IF NOT EXISTS idx_lost_opp_count ON lost_opportunities(search_count DESC);
