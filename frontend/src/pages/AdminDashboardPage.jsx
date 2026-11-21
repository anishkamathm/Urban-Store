import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  ShoppingBag,
  History,
  Boxes,
  Inbox,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  Clock,
  Store,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar.jsx';
import { api } from '../services/api.js';

export default function AdminDashboardPage() {
  const [kpis, setKpis] = useState({
    revenue: { total: 0, online: 0, offline: 0 },
    counts: {
      onlineOrders: 0,
      offlineBills: 0,
      totalProducts: 0,
      lowStockItems: 0,
      pendingRequests: 0,
      lostSearches: 0,
      lostRevenue: 0,
    }
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [kpiRes, ordersRes] = await Promise.all([
        api.getAdminKpis(),
        api.getAllOrders(),
      ]);
      if (kpiRes) setKpis(kpiRes);
      if (ordersRes.orders) setRecentOrders(ordersRes.orders.slice(0, 10));
    } catch (err) {
      console.error('Failed to load dashboard KPIs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      loadDashboardData();
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-slate-50">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-100 pb-5">
          <div>
            <h1 className="text-2xl font-bold font-serif text-slate-900">
              Store Operations Dashboard
            </h1>
            <p className="text-xs text-slate-500">
              Real-time omnichannel sales, shared inventory status, and fulfillment tracking
            </p>
          </div>

          <Link
            to="/admin/billing"
            className="px-5 py-2.5 rounded-2xl bg-brand-900 hover:bg-brand-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer self-start sm:self-auto"
          >
            <Receipt className="w-4 h-4" />
            <span>Launch POS Billing Terminal</span>
          </Link>
        </div>

        {/* 1. KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Revenue */}
          <div className="bg-white rounded-3xl border border-purple-100 p-5 shadow-soft">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Omnichannel Revenue
            </span>
            <p className="text-2xl font-black text-slate-900 mt-1">
              ₹{(kpis.revenue?.total || 0).toLocaleString('en-IN')}
            </p>
            <div className="mt-2 text-[11px] text-slate-500 flex justify-between border-t border-purple-50 pt-2 font-medium">
              <span>Online: ₹{(kpis.revenue?.online || 0).toLocaleString('en-IN')}</span>
              <span>POS: ₹{(kpis.revenue?.offline || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Pending Requests Alert */}
          <Link
            to="/admin/requests"
            className="bg-white rounded-3xl border border-purple-100 p-5 shadow-soft hover:border-amber-300 transition block group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Pending Returns & Alerts</span>
              <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
                <Inbox className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl font-black text-amber-600">
              {kpis.counts?.pendingRequests || 0}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 group-hover:text-brand-700">
              <span>Review 7-day clothes returns</span>
              <ArrowRight className="w-3 h-3" />
            </p>
          </Link>

          {/* Low Stock Alert */}
          <Link
            to="/admin/inventory"
            className="bg-white rounded-3xl border border-purple-100 p-5 shadow-soft hover:border-rose-300 transition block group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Low Stock Warnings</span>
              <span className="p-1.5 rounded-lg bg-rose-50 text-rose-700">
                <AlertTriangle className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl font-black text-rose-600">
              {kpis.counts?.lowStockItems || 0}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 group-hover:text-brand-700">
              <span>Stock level ≤ 5 units</span>
              <ArrowRight className="w-3 h-3" />
            </p>
          </Link>

          {/* Lost Opportunity Demand */}
          <Link
            to="/admin/lost-opportunities"
            className="bg-white rounded-3xl border border-purple-100 p-5 shadow-soft hover:border-purple-300 transition block group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Missed Search Demand</span>
              <span className="p-1.5 rounded-lg bg-purple-50 text-purple-700">
                <TrendingDown className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl font-black text-purple-700">
              {kpis.counts?.lostSearches || 0}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 group-hover:text-brand-700">
              <span>View demand leaderboard</span>
              <ArrowRight className="w-3 h-3" />
            </p>
          </Link>
        </div>

        {/* 2. Quick Action Shortcuts */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/admin/billing"
            className="p-5 rounded-3xl bg-gradient-to-br from-brand-900 to-purple-900 text-white shadow-soft flex items-center justify-between hover:scale-[1.01] transition"
          >
            <div>
              <p className="text-xs font-semibold text-pink-300 uppercase tracking-wider">Offline POS</p>
              <h3 className="text-base font-bold mt-1">Create In-Store Bill</h3>
              <p className="text-[11px] text-purple-200 mt-0.5">Deducts shared stock instantly</p>
            </div>
            <Receipt className="w-8 h-8 text-pink-300/80" />
          </Link>

          <Link
            to="/admin/purchase-history"
            className="p-5 rounded-3xl bg-white border border-purple-100 shadow-soft flex items-center justify-between hover:border-purple-300 transition"
          >
            <div>
              <p className="text-xs font-semibold text-brand-700 uppercase tracking-wider">Sales Analytics</p>
              <h3 className="text-base font-bold text-slate-900 mt-1">Purchase History</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Daily, weekly & monthly reports</p>
            </div>
            <History className="w-8 h-8 text-purple-600" />
          </Link>

          <Link
            to="/admin/requests"
            className="p-5 rounded-3xl bg-white border border-purple-100 shadow-soft flex items-center justify-between hover:border-purple-300 transition"
          >
            <div>
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Customer Service</p>
              <h3 className="text-base font-bold text-slate-900 mt-1">Process Requests</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Approve returns & restock items</p>
            </div>
            <Inbox className="w-8 h-8 text-amber-600" />
          </Link>
        </div>

        {/* 3. Recent Online Orders & Status Stepper */}
        <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-purple-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Recent Online Orders</h3>
              <p className="text-[11px] text-slate-400">Manage fulfillment: PLACED → PACKED → OUT_FOR_DELIVERY → DELIVERED</p>
            </div>
            <button
              onClick={loadDashboardData}
              className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-brand-900 text-xs font-bold"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading orders...</div>
          ) : recentOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">No orders received yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-purple-50 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Order Number</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Delivery Type</th>
                    <th className="p-3">Total Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Update Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-purple-50/40">
                      <td className="p-3 font-mono font-bold text-brand-900">{ord.order_number}</td>
                      <td className="p-3 font-medium text-slate-800">
                        {ord.customer_name}
                        <span className="block text-[10px] text-slate-400">{ord.customer_email}</span>
                      </td>
                      <td className="p-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700">
                          {ord.delivery_type === 'instant_30min' ? '⚡ 30-Min Instant' : '📦 Standard (₹30)'}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        ₹{Number(ord.total_amount).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ord.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.status === 'OUT_FOR_DELIVERY'
                              ? 'bg-blue-100 text-blue-800'
                              : ord.status === 'PACKED'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <select
                          value={ord.status}
                          onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                          className="px-2 py-1 rounded-lg border border-purple-200 text-xs font-semibold bg-white"
                        >
                          <option value="PLACED">PLACED</option>
                          <option value="PACKED">PACKED</option>
                          <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                          <option value="DELIVERED">DELIVERED</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
