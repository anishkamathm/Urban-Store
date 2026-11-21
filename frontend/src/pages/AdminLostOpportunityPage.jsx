import React, { useState, useEffect } from 'react';
import {
  TrendingDown,
  Search,
  AlertTriangle,
  PackagePlus,
  CheckCircle2,
  Sparkles,
  BarChart3
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar.jsx';
import { api } from '../services/api.js';

export default function AdminLostOpportunityPage() {
  const [data, setData] = useState({
    summary: { totalLostSearches: 0, totalEstLostRevenue: 0, uniqueMissedQueries: 0 },
    opportunities: []
  });
  const [loading, setLoading] = useState(true);
  const [restockSuccess, setRestockSuccess] = useState('');

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await api.getLostOpportunities();
      setData(res);
    } catch (err) {
      console.error('Failed to load lost opportunity report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const handleQuickRestock = async (opp) => {
    setRestockSuccess('');
    try {
      await api.restockLostOpportunity({
        id: opp.id,
        product_id: opp.product_id,
        stock_to_add: 10,
      });
      setRestockSuccess(`Restocked +10 units for "${opp.query}". Missed demand marked resolved.`);
      loadReport();
    } catch (err) {
      console.error('Failed to restock item:', err);
    }
  };

  const summary = data.summary || { totalLostSearches: 0, totalEstLostRevenue: 0, uniqueMissedQueries: 0 };

  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-slate-50">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-100 pb-5">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-100 text-brand-900">
              <TrendingDown className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold font-serif text-slate-900">
                Lost Opportunity & Demand Analytics
              </h1>
              <p className="text-xs text-slate-500">
                Captures OpenSearch queries for unavailable or out-of-stock items to optimize inventory
              </p>
            </div>
          </div>
        </div>

        {restockSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{restockSuccess}</span>
          </div>
        )}

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-3xl border border-purple-100 p-5 shadow-soft">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Lost Searches
            </span>
            <p className="text-3xl font-black text-rose-600 mt-1">
              {summary.totalLostSearches}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Customer searches that returned 0 or sold-out items
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-purple-100 p-5 shadow-soft">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Estimated Missed Revenue
            </span>
            <p className="text-3xl font-black text-slate-900 mt-1">
              ₹{(summary.totalEstLostRevenue || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Calculated based on average selling price per category
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-purple-100 p-5 shadow-soft">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Unique Unmet Keywords
            </span>
            <p className="text-3xl font-black text-purple-700 mt-1">
              {summary.uniqueMissedQueries}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              High-intent queries with immediate purchase demand
            </p>
          </div>
        </div>

        {/* Opportunity Leaderboard Table */}
        <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">
              Ranked Unmet Customer Demand Leaderboard
            </h3>
            <span className="text-xs text-purple-600 font-bold">
              Ranked by Search Volume
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs">Loading lost opportunities...</div>
          ) : data.opportunities?.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">No lost search opportunities recorded. All searches met with stock!</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-purple-50 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3 text-center">Rank</th>
                    <th className="p-3">Missed Search Query</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-center">Search Count</th>
                    <th className="p-3 text-right">Est. Lost Revenue</th>
                    <th className="p-3">Last Searched</th>
                    <th className="p-3 text-center">Procurement Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.opportunities.map((opp, idx) => (
                    <tr key={opp.id} className="hover:bg-purple-50/40">
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${
                          idx === 0 ? 'bg-amber-400 text-slate-950' : idx === 1 ? 'bg-slate-200 text-slate-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        <span className="text-brand-900 font-mono text-sm">"{opp.query}"</span>
                        {opp.product_name && (
                          <span className="block text-[10px] text-slate-400 font-sans">Matched style: {opp.product_name}</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-600 uppercase text-[10px] font-bold">
                        {opp.category || 'Fashion'}
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-xs border border-rose-200">
                          {opp.search_count} searches
                        </span>
                      </td>
                      <td className="p-3 text-right font-black text-slate-900 text-sm">
                        ₹{Number(opp.estimated_lost_revenue).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-slate-400 text-[11px]">
                        {new Date(opp.last_searched_at).toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleQuickRestock(opp)}
                          className="px-3 py-1.5 rounded-xl bg-brand-900 hover:bg-brand-800 text-white font-bold text-[11px] shadow-xs flex items-center justify-center gap-1.5 mx-auto transition cursor-pointer"
                        >
                          <PackagePlus className="w-3.5 h-3.5" />
                          <span>Restock 10 Units</span>
                        </button>
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
