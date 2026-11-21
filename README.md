# 🛍️ Urban Store: Omnichannel Fashion Retail & Real-Time POS Engine

> **Fashion • Style • Everyday**  
> A high-performance, bilingual (English + Kannada) omnichannel fashion store selling online and offline. Powered by **Aiven PostgreSQL**, **Aiven Apache Kafka**, and **Aiven OpenSearch**.

---

## 🌟 Architecture & Aiven Services Integration

All three Aiven managed cloud services perform critical, real-time work in Urban Store's retail lifecycle:

1. **Aiven PostgreSQL (Source of Truth & Atomic Stock Concurrency)**:
   - Shared single source of truth for physical retail stores and online e-commerce.
   - Enforces atomic conditional updates to prevent overselling between online buyers and in-store shoppers:
     ```sql
     UPDATE store_inventory SET stock = stock - qty 
     WHERE store_id = $storeId AND product_id = $productId AND stock >= qty;
     ```
   - Respects active 10-minute cart reservations when verifying in-store POS checkouts.
   - Manages tables: `products`, `categories`, `stores`, `store_inventory`, `orders`, `order_items`, `offline_bills`, `offline_bill_items`, `cart_reservations`, `customer_requests`, `lost_opportunities`.

2. **Aiven Apache Kafka (Real-Time Omnichannel Event Streaming)**:
   - Decoupled event-driven backbone operating on topics:
     - `orders`: Emitted whenever an online order or offline POS bill is placed.
     - `stock-updates`: Emitted whenever shared stock changes, triggering OpenSearch index synchronization and instant SSE updates to active shoppers.
     - `cart-reservations`: Manages 10-minute reservation locks and 8-minute payment reminders.
     - `notifications`: Alerts customers when their return requests are approved and refunded.
     - `search-events`: Automatically captures zero-result / out-of-stock searches and persists them into the Lost Opportunity Demand report.

3. **Aiven OpenSearch (Bilingual & Geo-Aware Fashion Discovery Engine)**:
   - Full-text typo-tolerant product search across English and Kannada.
   - Handles common fashion typos ("chinos", "chelsea boots", "chronograf", "handbag").
   - Kannada synonym mappings and phonetic transliteration aliases ("ವಾಚ್", "ಶೂ", "ಕುರ್ತಾ", "ಬ್ಯಾಗ್").
   - Geo-distance filtering on store locations to check instant 30-min delivery eligibility.

---

## 🚀 Key Features

### 1. Branding & Fashion Catalogue
- **Fashion Focus**: Exclusive collection of luxury watches, Italian leather shoes, cashmere and pure Mysore silk clothes, designer handbags, and slim RFID wallets.
- **100% Bilingual (English + ಕನ್ನಡ)**: Complete translation across storefront, product details, cart, checkout, returns, receipts, and admin tools with zero hardcoded strings.

### 2. Omnichannel In-Store Billing (POS Terminal)
- **Top Priority Billing Engine**: Located in the Admin Panel (`/admin/billing`).
- Shopkeepers generate digital and printable receipts for walk-in shoppers across any Karnataka retail store.
- **Shared Stock Deduction**: An in-store purchase immediately decrements the same shared inventory used by the website in real time via an atomic transaction.
- **Cart Reservation Protection**: Offline checkout validates active online cart reservations to prevent accidental overselling.
- **Printable Invoices**: Generates formatted receipts with store GSTIN, itemized rates, discounts, tax, and prints via `window.print()`.

### 3. 10-Minute Cart Reservation & Payment Reminders
- Items added to the cart are reserved exclusively in stock for **10 minutes**, with a visible countdown timer (`09:45`).
- **8-Minute Reminder**: At 8 minutes elapsed (2 minutes remaining), the user receives an urgent payment reminder banner and in-app alert.
- **10-Minute Auto-Release**: If checkout is not completed within 10 minutes, the reservation expires automatically and items are released back to stock. Users can renew the timer with one click ("Extend 10 Min").

### 4. Smart Delivery & Flat ₹30 Faraway Charge
- **Instant 30-Min Delivery**: Customers located within 5 km of any Urban Store flagship receive instant delivery fulfilled by two-wheeler EV couriers.
- **Flat ₹30 Delivery**: Faraway orders outside the store radius are fulfilled via central warehouse dispatch for a flat ₹30 delivery fee, with no complex per-km calculations.

### 5. 7-Day Clothes Returns & Customer Requests
- Customers can raise a return on delivered clothes within **7 days** directly from the Orders page (`/orders`).
- **Store Manager Approval**: In the Admin Process Requests section (`/admin/requests`), store managers review returns.
- **Automatic Restock & Refund**: Approving a return initiates a refund to the original payment method and puts the item back into store stock via Kafka event dispatch.

### 6. Unified Purchase History & Sales Analytics
- Accessible in `/admin/purchase-history`.
- Unified transaction ledger combining online website orders and offline in-store POS receipts.
- **Sales KPI Summaries**: Daily, weekly, and monthly revenue and transaction counts.
- **Channel Breakdown**: Online e-commerce revenue vs. offline retail revenue.
- Searchable and filterable by date, customer, phone number, and store.

### 7. Lost Opportunity Demand Report
- Accessible in `/admin/lost-opportunities`.
- Tracks OpenSearch queries that returned 0 results or were out-of-stock.
- Ranks missed customer searches by frequency and estimated lost revenue.
- Includes a **"Quick Restock 10 Units"** button that lets the store manager replenish inventory on the spot.

### 8. Admin Panel Layout
- Modern left sidebar navigation:
  - **Dashboard**: Revenue KPIs, pending return alerts, low-stock warnings, live orders.
  - **Billing (POS)**: In-store terminal, item scanner, shared stock check, printable receipts.
  - **Orders**: Online orders tracking with live status stepper.
  - **Purchase History**: Omnichannel sales history with daily, weekly, monthly summaries.
  - **Inventory**: Central and per-store stock levels, add/edit/delete fashion styles.
  - **Process Requests**: Customer returns, cancellations, and restock alerts.
  - **Lost Opportunity Report**: Demand leaderboard with quick restock triggers.

---

## 🛠️ Quick Start & Local Run

### Prerequisites
- Node.js v18+
- Aiven Account (PostgreSQL, Apache Kafka, OpenSearch) or use local mock mode automatically.

### 1. Installation
```bash
# Clone the repository
cd Buildbang

# Install Backend Dependencies
cd backend
npm install

# Install Frontend Dependencies
cd ../frontend
npm install
```

### 2. Configure Environment
Copy `.env.example` in `backend/` and `frontend/`:
```bash
cp backend/.env.example backend/.env
```
Ensure your Aiven SSL certificates (`ca.pem`, `service.cert`, `service.key`) are in `certs/` if connecting to live Aiven Kafka. The application automatically falls back to local high-throughput emulation if credentials are not provided.

### 3. Run Application
```bash
# Terminal 1: Run Backend API & Consumer
cd backend
npm start

# Terminal 2: Run Frontend Vite Dev Server
cd frontend
npm run dev
```

Visit the app at **http://localhost:5173**.

---

## 👥 Demo Logins

| Role | Email | Password | Privileges |
| :--- | :--- | :--- | :--- |
| **Store Manager (Admin)** | `admin@urbanstore.in` | `admin123` | Full access to POS Billing, Inventory, Requests, Analytics |
| **Shopper (Customer)** | `customer@urbanstore.in` | `customer123` | Browsing, Bag, Checkout, 7-Day Returns, Orders |

---

## 📜 Database Schema Migrations
All schema enhancements for Urban Store are version-controlled in:
- `backend/src/scripts/migrations/001_urban_store.sql`
- Automatically applied via `backend/src/scripts/initDb.js` without losing existing records.
