import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Trash2,
  Printer,
  Search,
  CheckCircle2,
  AlertTriangle,
  Store,
  User,
  Phone,
  CreditCard,
  Banknote,
  QrCode,
  X,
  Clock,
  Sparkles
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar.jsx';
import { api } from '../services/api.js';

export default function AdminBillingPage() {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState('store-blr-indiranagar');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Billing form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [cashierName, setCashierName] = useState('Anish (Store Mgr)');
  const [billItems, setBillItems] = useState([]);

  // Active product add selection
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  // Active view: 'CREATE' or 'HISTORY'
  const [activeTab, setActiveTab] = useState('CREATE');
  const [billHistory, setBillHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');

  // Printable bill modal
  const [printableBill, setPrintableBill] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [storesRes, prodsRes] = await Promise.all([
        api.getStores(),
        api.getProducts({ lang: 'en' }),
      ]);
      if (storesRes.stores) {
        setStores(storesRes.stores);
        if (storesRes.stores.length > 0) setSelectedStore(storesRes.stores[0].id);
      }
      if (prodsRes.products) {
        setProducts(prodsRes.products);
        if (prodsRes.products.length > 0) setSelectedProductId(prodsRes.products[0].id);
      }
    } catch (err) {
      console.error('Failed to load billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await api.getBillingHistory({ store_id: selectedStore, search: historySearch });
      if (data.bills) setBillHistory(data.bills);
    } catch (err) {
      console.error('Failed to fetch bill history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'HISTORY') {
      loadHistory();
    }
  }, [activeTab, selectedStore, historySearch]);

  const handleAddItem = () => {
    if (!selectedProductId) return;
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    const existingIdx = billItems.findIndex(i => i.product_id === selectedProductId && i.size === selectedSize);
    if (existingIdx !== -1) {
      const updated = [...billItems];
      updated[existingIdx].quantity += Number(selectedQuantity);
      setBillItems(updated);
    } else {
      setBillItems([
        ...billItems,
        {
          product_id: prod.id,
          name: prod.name_en,
          price: parseFloat(prod.price),
          size: selectedSize,
          quantity: Number(selectedQuantity),
          total: parseFloat(prod.price) * Number(selectedQuantity),
        }
      ]);
    }

    setSelectedQuantity(1);
  };

  const handleRemoveItem = (index) => {
    setBillItems(billItems.filter((_, i) => i !== index));
  };

  const handleUpdateItemQty = (index, delta) => {
    const updated = [...billItems];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      handleRemoveItem(index);
    } else {
      updated[index].quantity = newQty;
      updated[index].total = updated[index].price * newQty;
      setBillItems(updated);
    }
  };

  // Pricing
  const subtotal = billItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
  const discount = parseFloat(discountAmount) || 0;
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = Math.round((taxableAmount * 0.05) * 100) / 100; // 5% GST
  const grandTotal = Math.round((taxableAmount + tax) * 100) / 100;

  const handleCreateBill = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (billItems.length === 0) {
      setErrorMessage('Please add at least one item to generate an offline bill.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        store_id: selectedStore,
        customer_name: customerName || 'Walk-in Shopper',
        customer_phone: customerPhone || '+91 98000 00000',
        payment_method: paymentMethod,
        discount_amount: discount,
        cashier_name: cashierName,
        items: billItems.map(i => ({
          product_id: i.product_id,
          quantity: i.quantity,
          size: i.size,
          unit_price: i.price,
        }))
      };

      const res = await api.createOfflineBill(payload);
      if (res.bill) {
        setPrintableBill(res.bill);
        // Reset form
        setBillItems([]);
        setCustomerName('');
        setCustomerPhone('');
        setDiscountAmount(0);
        // Refresh products list to show decreased shared stock immediately
        api.getProducts({ lang: 'en' }).then(r => r.products && setProducts(r.products));
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create offline bill. Check stock availability.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStoreObj = stores.find(s => s.id === selectedStore) || { name: 'Urban Store Indiranagar', city: 'Bengaluru' };
  const currentProdObj = products.find(p => p.id === selectedProductId);

  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-slate-50">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl">
        {/* Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-100 text-brand-900">
                <Receipt className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-2xl font-bold font-serif text-slate-900">
                  In-Store Offline POS Billing
                </h1>
                <p className="text-xs text-slate-500">
                  Shared real-time stock sync with website • Cart reservation protection
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-purple-200">
            <button
              onClick={() => setActiveTab('CREATE')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'CREATE'
                  ? 'bg-brand-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-brand-900'
              }`}
            >
              + New POS Bill
            </button>
            <button
              onClick={() => setActiveTab('HISTORY')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'HISTORY'
                  ? 'bg-brand-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-brand-900'
              }`}
            >
              Bill History
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {activeTab === 'CREATE' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Store Selection & Item Picker */}
            <div className="lg:col-span-7 space-y-6">
              {/* Store Hub Selector */}
              <div className="bg-white rounded-3xl border border-purple-100 p-5 shadow-soft space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <Store className="w-4 h-4 text-brand-700" />
                    <span>POS Terminal Location</span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Shared Stock Active
                  </span>
                </div>

                <select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-purple-50/50 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.city})
                    </option>
                  ))}
                </select>
              </div>

              {/* Add Product To Bill Card */}
              <div className="bg-white rounded-3xl border border-purple-100 p-5 shadow-soft space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Select Item to Bill
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      Fashion Product & Current Stock
                    </label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name_en} — ₹{Number(p.price).toLocaleString('en-IN')} (Central Stock: {p.central_stock})
                        </option>
                      ))}
                    </select>
                  </div>

                  {currentProdObj && (
                    <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{currentProdObj.name_en}</p>
                        <p className="text-[11px] text-slate-500 font-mono">Category: {currentProdObj.category}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-brand-900">₹{Number(currentProdObj.price).toLocaleString('en-IN')}</span>
                        <p className="text-[10px] text-emerald-600 font-bold">Shared Real-Time Stock: {currentProdObj.central_stock}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        Size
                      </label>
                      <select
                        value={selectedSize}
                        onChange={(e) => setSelectedSize(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs font-bold"
                      >
                        {['S', 'M', 'L', 'XL', 'Free Size'].map((sz) => (
                          <option key={sz} value={sz}>{sz}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={selectedQuantity}
                        onChange={(e) => setSelectedQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="w-full py-2.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-brand-900 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Item to Bill</span>
                  </button>
                </div>
              </div>

              {/* Customer & Cashier Info */}
              <div className="bg-white rounded-3xl border border-purple-100 p-5 shadow-soft space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Customer & Cashier Info
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      Customer Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. Priya Sharma"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-purple-200 text-xs"
                      />
                      <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      Customer Phone (for digital receipt)
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-purple-200 text-xs"
                      />
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Cashier / Manager
                  </label>
                  <input
                    type="text"
                    value={cashierName}
                    onChange={(e) => setCashierName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Bill Summary & Checkout */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-soft space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Current POS Bill</h3>
                    <p className="text-[11px] text-slate-400">{billItems.length} items added</p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold">
                    Terminal #1
                  </span>
                </div>

                {/* Items List */}
                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto pr-1">
                  {billItems.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      No items added yet. Select a product on the left to add.
                    </div>
                  ) : (
                    billItems.map((item, idx) => (
                      <div key={idx} className="py-3 flex items-center justify-between gap-3 text-xs">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 truncate">{item.name}</p>
                          <p className="text-[11px] text-slate-400">
                            Size: {item.size} • ₹{item.price.toLocaleString('en-IN')}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQty(idx, -1)}
                            className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold"
                          >
                            -
                          </button>
                          <span className="font-bold px-1.5 text-xs">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQty(idx, 1)}
                            className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="font-bold text-slate-900">₹{(item.total).toLocaleString('en-IN')}</p>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-[10px] text-rose-500 hover:text-rose-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Payment Method Selector */}
                <div className="pt-2">
                  <label className="block text-[11px] font-bold text-slate-500 mb-2">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'UPI', label: 'UPI / QR', icon: QrCode },
                      { id: 'CARD', label: 'Card', icon: CreditCard },
                      { id: 'CASH', label: 'Cash', icon: Banknote },
                    ].map((m) => {
                      const Icon = m.icon;
                      const active = paymentMethod === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id)}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                            active
                              ? 'bg-brand-900 border-brand-900 text-white shadow-xs'
                              : 'bg-white border-purple-200 text-slate-700 hover:bg-purple-50'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Discounts & Calculations */}
                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-semibold">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Store Discount (₹)</span>
                    <input
                      type="number"
                      min="0"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(e.target.value)}
                      className="w-24 text-right px-2 py-1 rounded border border-purple-200 text-xs font-bold"
                    />
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>GST (5%)</span>
                    <span className="font-semibold">₹{tax.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                    <span>Grand Total</span>
                    <span className="text-base text-brand-900">₹{grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Submit POS Bill Button */}
                <button
                  type="button"
                  onClick={handleCreateBill}
                  disabled={billItems.length === 0 || isSubmitting}
                  className="w-full py-3.5 rounded-2xl bg-brand-900 hover:bg-brand-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Decreasing Shared Stock & Generating...</span>
                  ) : (
                    <>
                      <Printer className="w-4 h-4" />
                      <span>Complete Sale & Print Bill</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Tab 2: Bill History */
          <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-soft space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  placeholder="Search by Bill #, Customer, or Phone..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-purple-200 text-xs"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
              <button
                onClick={loadHistory}
                className="px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-brand-900 text-xs font-bold"
              >
                Refresh History
              </button>
            </div>

            {historyLoading ? (
              <div className="py-12 text-center text-slate-400 text-xs">Loading bills...</div>
            ) : billHistory.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">No offline bills recorded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-purple-50 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Bill Number</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Store</th>
                      <th className="p-3">Method</th>
                      <th className="p-3 text-right">Total</th>
                      <th className="p-3">Date</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {billHistory.map((bill) => (
                      <tr key={bill.id} className="hover:bg-purple-50/40">
                        <td className="p-3 font-mono font-bold text-brand-900">{bill.bill_number}</td>
                        <td className="p-3 font-medium text-slate-800">
                          {bill.customer_name}
                          <span className="block text-[10px] text-slate-400">{bill.customer_phone}</span>
                        </td>
                        <td className="p-3 text-slate-600">{bill.store_name || currentStoreObj.name}</td>
                        <td className="p-3 font-semibold">{bill.payment_method}</td>
                        <td className="p-3 text-right font-bold text-slate-900">
                          ₹{Number(bill.total_amount).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-slate-400 text-[11px]">
                          {new Date(bill.created_at).toLocaleString()}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setPrintableBill(bill)}
                            className="px-2.5 py-1 rounded-lg bg-purple-100 text-brand-900 font-bold hover:bg-purple-200 transition"
                          >
                            Print Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Printable Receipt Modal */}
        {printableBill && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-purple-100 overflow-hidden animate-scaleIn">
              {/* Receipt Header Actions */}
              <div className="p-4 bg-purple-50 border-b border-purple-100 flex items-center justify-between">
                <span className="text-xs font-bold text-brand-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Bill Generated & Shared Stock Decreased
                </span>
                <button
                  onClick={() => setPrintableBill(null)}
                  className="p-1 rounded-full hover:bg-purple-200 text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Printable Body */}
              <div id="printable-receipt" className="p-6 space-y-4 font-mono text-xs text-slate-800">
                <div className="text-center border-b border-dashed border-slate-300 pb-3">
                  <h2 className="text-lg font-black tracking-wider font-sans text-slate-950">URBAN STORE</h2>
                  <p className="text-[10px] tracking-widest uppercase font-sans text-slate-500">Fashion • Style • Everyday</p>
                  <p className="text-[11px] text-slate-600 mt-1">{printableBill.store?.name || currentStoreObj.name}</p>
                  <p className="text-[10px] text-slate-500">{printableBill.store?.city || currentStoreObj.city}, Karnataka</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">GSTIN: 29AABCU9603R1ZM</p>
                </div>

                <div className="text-[11px] space-y-1 border-b border-dashed border-slate-300 pb-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bill No:</span>
                    <span className="font-bold text-slate-900">{printableBill.bill_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date & Time:</span>
                    <span>{new Date(printableBill.created_at || Date.now()).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cashier:</span>
                    <span>{printableBill.cashier_name || cashierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Customer:</span>
                    <span>{printableBill.customer_name} ({printableBill.customer_phone || 'Walk-in'})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment:</span>
                    <span className="font-bold">{printableBill.payment_method}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2 border-b border-dashed border-slate-300 pb-3">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                    <span>Item / Size</span>
                    <span>Qty</span>
                    <span>Price</span>
                  </div>
                  {(printableBill.items || billItems).map((it, i) => (
                    <div key={i} className="flex justify-between items-baseline text-[11px]">
                      <span className="truncate max-w-[170px]">{it.name || it.product_name} ({it.size || 'M'})</span>
                      <span>x{it.quantity}</span>
                      <span className="font-bold">₹{Number(it.total || it.total_price).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-3">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>₹{Number(printableBill.subtotal || subtotal).toLocaleString('en-IN')}</span>
                  </div>
                  {printableBill.discount_amount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount:</span>
                      <span>-₹{Number(printableBill.discount_amount).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>GST (5%):</span>
                    <span>₹{Number(printableBill.tax_amount || tax).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-950 pt-1">
                    <span>TOTAL PAID:</span>
                    <span>₹{Number(printableBill.total_amount || grandTotal).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="text-center text-[10px] text-slate-400 space-y-1 pt-1">
                  <p className="font-semibold text-slate-600">Thank you for shopping at Urban Store!</p>
                  <p>7-Day Easy Exchange on Apparel with this bill.</p>
                  <p className="font-mono text-[9px]">SHARED INVENTORY VERIFIED • KAFKA POS EVENT DISPATCHED</p>
                </div>
              </div>

              {/* Modal Bottom Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => setPrintableBill(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
                >
                  Done
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2 rounded-xl bg-brand-900 hover:bg-brand-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
