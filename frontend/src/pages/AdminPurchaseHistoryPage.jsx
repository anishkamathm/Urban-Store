import React, { useState, useEffect } from 'react';
import {
  History,
  TrendingUp,
  Calendar,
  Search,
  Filter,
  ShoppingBag,
  Store,
  CreditCard,
  ArrowUpRight,
  Download
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar.jsx';
import { api } from '../services/api.js';

export default function AdminPurchaseHistoryPage() {
  const [channel, setChannel] = useState('ALL');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    summary: {
      daily: { revenue: 0, transactions: 0 },
      weekly: { revenue: 0, transactions: 0 },
      monthly: { revenue: 0, transactions: 0 },
      channelBreakdown: { online: 0, offline: 0, total: 0 }
    },
    records: []
  });

  const loadPurchaseHistory = async () => {
    setLoading(true);
    try {
      const res = await api.getPurchaseHistory({
        channel,
        search,
        date_from: dateFrom,
        date_to: dateTo,
      });
      setData(res);
    } catch (err) {
      console.error('Failed to load purchase history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPurchaseHistory();
  }, [channel, search, dateFrom, dateTo]);

  const summary = data.summary || {
    daily: { revenue: 0, transactions: 0 },
    weekly: { revenue: 0, transactions: 0 },
    monthly: { revenue: 0, transactions: 0 },
    channelBreakdown: { online: 0, offline: 0, total: 0 }
  };

  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-slate-50">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-100 pb-5">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-100 text-brand-900">
              <History className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold font-serif text-slate-900">
                Unified Purchase History & Sales Analytics
              </h1>
              <p className="text-xs text-slate-500">
                Consolidated online website orders and offline in-store POS transactions
              </p>
            </div>
          </div>
        </div>

        {/* 1. Daily, Weekly & Monthly KPI Sales Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Daily Card */}
          <div className="bg-white rounded-3xl border border-purple-100 p-5 shadow-soft">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Today's Sales</span>
              <span className="p-1.5 rounded-lg bg-purple-50 text-brand-700">
                <Calendar className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl font-black text-slate-900">
              ₹{(summary.daily?.revenue || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              {summary.daily?.transactions || 0} transactions today
            </p>
          </div>

          {/* Weekly Card */}
          <div className="bg-white rounded-3xl border border-purple-100 p-5 shadow-soft">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Last 7 Days</span>
              <span className="p-1.5 rounded-lg bg-pink-50 text-pink-700">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl font-black text-slate-900">
              ₹{(summary.weekly?.revenue || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              {summary.weekly?.transactions || 0} weekly transactions
            </p>
          </div>

          {/* Monthly Card */}
          <div className="bg-white rounded-3xl border border-purple-100 p-5 shadow-soft">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Last 30 Days</span>
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl font-black text-slate-900">
              ₹{(summary.monthly?.revenue || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              {summary.monthly?.transactions || 0} monthly transactions
            </p>
          </div>

          {/* Channel Breakdown */}
          <div className="bg-white rounded-3xl border border-purple-100 p-5 shadow-soft space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Channel Split
            </span>
            <div className="space-y-1.5 text-xs pt-1">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-purple-700 font-semibold">
                  <ShoppingBag className="w-3.5 h-3.5" /> Online
                </span>
                <span className="font-bold text-slate-800">
                  ₹{(summary.channelBreakdown?.online || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <Store className="w-3.5 h-3.5" /> Offline POS
                </span>
                <span className="font-bold text-slate-800">
                  ₹{(summary.channelBreakdown?.offline || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Filters & Search Bar */}
        <div className="bg-white rounded-3xl border border-purple-100 p-5 shadow-soft space-y-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            {/* Channel Pills */}
            <div className="flex items-center gap-1.5 bg-purple-50/70 p-1 rounded-2xl w-full lg:w-auto">
              {[
                { id: 'ALL', label: 'All Channels' },
                { id: 'ONLINE', label: 'Online Store' },
                { id: 'OFFLINE', label: 'Offline POS' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setChannel(c.id)}
                  className={`flex-1 sm:flex-none px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                    channel === c.id
                      ? 'bg-brand-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-brand-900'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Search Input & Dates */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  placeholder="Search by order/bill #, customer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-purple-200 text-xs bg-white"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>

              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-purple-200 text-xs text-slate-600"
                title="Date From"
              />

              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-purple-200 text-xs text-slate-600"
                title="Date To"
              />
            </div>
          </div>
        </div>

        {/* 3. Transaction Records Table */}
        <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">
              Purchase Records ({data.records?.length || 0})
            </h3>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs">Loading transaction history...</div>
          ) : data.records?.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">No purchase records matching filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-purple-50 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Channel</th>
                    <th className="p-3">Invoice / Order #</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Store Location</th>
                    <th className="p-3">Items</th>
                    <th className="p-3">Payment</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.records.map((rec) => (
                    <tr key={rec.id} className="hover:bg-purple-50/40">
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            rec.channel === 'ONLINE'
                              ? 'bg-purple-100 text-brand-900 border border-purple-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {rec.channel === 'ONLINE' ? '🌐 Online' : '🏬 In-Store'}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-900">{rec.number}</td>
                      <td className="p-3 font-medium text-slate-800">
                        {rec.customerName}
                        <span className="block text-[10px] text-slate-400">{rec.customerContact}</span>
                      </td>
                      <td className="p-3 text-slate-600">{rec.storeName}</td>
                      <td className="p-3 text-slate-600 font-medium">{rec.itemCount} item(s)</td>
                      <td className="p-3 font-semibold text-slate-700">{rec.paymentMethod}</td>
                      <td className="p-3 text-right font-bold text-slate-900">
                        ₹{Number(rec.totalAmount).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-slate-400 text-[11px]">
                        {new Date(rec.createdAt).toLocaleString()}
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
