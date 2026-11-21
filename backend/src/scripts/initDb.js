import { query } from '../config/postgres.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initializeDatabase() {
  console.log('[DB Init] Initializing Urban Store PostgreSQL tables, indexes and migrations...');

  const ddl = `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(32) DEFAULT 'customer',
      preferred_language VARCHAR(8) DEFAULT 'en',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS stores (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      city VARCHAR(100) NOT NULL,
      latitude NUMERIC(10, 6) NOT NULL,
      longitude NUMERIC(10, 6) NOT NULL,
      delivery_radius_km NUMERIC(5, 2) DEFAULT 5.0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(64) PRIMARY KEY,
      slug VARCHAR(100) UNIQUE NOT NULL,
      name_en VARCHAR(255) NOT NULL,
      name_kn VARCHAR(255) NOT NULL,
      icon VARCHAR(64)
    );

    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(64) PRIMARY KEY,
      category_id VARCHAR(64) REFERENCES categories(id) ON DELETE SET NULL,
      name_en VARCHAR(255) NOT NULL,
      name_kn VARCHAR(255) NOT NULL,
      description_en TEXT,
      description_kn TEXT,
      price NUMERIC(10, 2) NOT NULL,
      image_url TEXT,
      central_stock INT DEFAULT 100,
      is_featured BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS store_inventory (
      id VARCHAR(64) PRIMARY KEY,
      store_id VARCHAR(64) REFERENCES stores(id) ON DELETE CASCADE,
      product_id VARCHAR(64) REFERENCES products(id) ON DELETE CASCADE,
      stock INT NOT NULL DEFAULT 0,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(store_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS carts (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id VARCHAR(64) PRIMARY KEY,
      cart_id VARCHAR(64) REFERENCES carts(id) ON DELETE CASCADE,
      product_id VARCHAR(64) REFERENCES products(id) ON DELETE CASCADE,
      quantity INT NOT NULL DEFAULT 1,
      size VARCHAR(32) DEFAULT 'M',
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(cart_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(64) PRIMARY KEY,
      order_number VARCHAR(32) UNIQUE NOT NULL,
      user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
      store_id VARCHAR(64) REFERENCES stores(id) ON DELETE SET NULL,
      delivery_type VARCHAR(32) NOT NULL,
      status VARCHAR(32) NOT NULL,
      subtotal NUMERIC(10, 2) NOT NULL,
      delivery_fee NUMERIC(10, 2) NOT NULL,
      total_amount NUMERIC(10, 2) NOT NULL,
      eta_minutes INT NOT NULL,
      customer_name VARCHAR(255),
      customer_email VARCHAR(255),
      delivery_address TEXT,
      delivery_lat NUMERIC(10, 6),
      delivery_lng NUMERIC(10, 6),
      distance_km NUMERIC(6, 2),
      co2_kg NUMERIC(6, 3),
      language VARCHAR(8) DEFAULT 'en',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id VARCHAR(64) PRIMARY KEY,
      order_id VARCHAR(64) REFERENCES orders(id) ON DELETE CASCADE,
      product_id VARCHAR(64) REFERENCES products(id),
      store_id VARCHAR(64),
      quantity INT NOT NULL,
      unit_price NUMERIC(10, 2) NOT NULL,
      total_price NUMERIC(10, 2) NOT NULL,
      size VARCHAR(32) DEFAULT 'M'
    );

    CREATE TABLE IF NOT EXISTS deliveries (
      id VARCHAR(64) PRIMARY KEY,
      order_id VARCHAR(64) REFERENCES orders(id) ON DELETE CASCADE,
      store_id VARCHAR(64),
      rider_name VARCHAR(255),
      rider_phone VARCHAR(64),
      status VARCHAR(32) NOT NULL,
      current_lat NUMERIC(10, 6),
      current_lng NUMERIC(10, 6),
      target_lat NUMERIC(10, 6),
      target_lng NUMERIC(10, 6),
      eta_minutes INT NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS processed_events (
      event_id VARCHAR(128) PRIMARY KEY,
      topic VARCHAR(128) NOT NULL,
      processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS system_logs (
      id VARCHAR(64) PRIMARY KEY,
      event_type VARCHAR(64) NOT NULL,
      details JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_store_inv_prod ON store_inventory(product_id);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  `;

  await query(ddl);

  // Apply migration 001
  const migrationPath = path.join(__dirname, 'migrations', '001_urban_store.sql');
  if (fs.existsSync(migrationPath)) {
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
    await query(migrationSql);
    console.log('[DB Init] Applied migration 001_urban_store.sql successfully.');
  }

  // Apply migration 002
  const migration2Path = path.join(__dirname, 'migrations', '002_wishlists.sql');
  if (fs.existsSync(migration2Path)) {
    const migration2Sql = fs.readFileSync(migration2Path, 'utf-8');
    await query(migration2Sql);
    console.log('[DB Init] Applied migration 002_wishlists.sql successfully.');
  }

  // Apply migration 003 (Purge legacy ShopMart grocery products and categories)
  const migration3Path = path.join(__dirname, 'migrations', '003_purge_legacy_products.sql');
  if (fs.existsSync(migration3Path)) {
    const migration3Sql = fs.readFileSync(migration3Path, 'utf-8');
    await query(migration3Sql);
    console.log('[DB Init] Applied migration 003_purge_legacy_products.sql successfully.');
  }

  console.log('[DB Init] Urban Store PostgreSQL schema and migrations complete.');
}

if (process.argv[1]?.endsWith('initDb.js')) {
  initializeDatabase().then(() => process.exit(0)).catch(err => {
    console.error('[DB Init] Error:', err);
    process.exit(1);
  });
}
