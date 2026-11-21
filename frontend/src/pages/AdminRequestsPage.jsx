import React, { useState, useEffect } from 'react';
import {
  Inbox,
  RotateCcw,
  Ban,
  BellRing,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  AlertCircle
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar.jsx';
import { api } from '../services/api.js';

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminRequests({ status: statusFilter, type: typeFilter });
      if (data.requests) setRequests(data.requests);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [statusFilter, typeFilter]);

  const handleUpdateStatus = async (id, newStatus, requestType) => {
    setActionSuccess('');
    setActionError('');
    try {
      const notes = prompt(`Enter admin notes for marking as ${newStatus}:`, `Processed by store manager on ${new Date().toLocaleDateString()}`);
      if (notes === null) return; // cancelled

      const res = await api.updateAdminRequestStatus(id, {
        status: newStatus,
        admin_notes: notes,
      });

      if (newStatus === 'APPROVED' && requestType === 'RETURN') {
        setActionSuccess(`Return approved! Refund initiated and 1 unit restored to shared inventory.`);
      } else {
        setActionSuccess(`Request updated to ${newStatus}. Customer notified.`);
      }

      loadRequests();
    } catch (err) {
      setActionError(err.message || 'Failed to update request');
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-slate-50">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-100 pb-5">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-100 text-brand-900">
              <Inbox className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold font-serif text-slate-900">
                Process Customer Requests
              </h1>
              <p className="text-xs text-slate-500">
                Manage 7-day clothes returns, cancellations, and restock notifications
              </p>
            </div>
          </div>
        </div>

        {actionSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {actionError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Filters Bar */}
        <div className="bg-white rounded-3xl border border-purple-100 p-5 shadow-soft flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Status:
            </span>
            <div className="flex items-center gap-1 bg-purple-50 p-1 rounded-2xl">
              {[
                { id: '', label: 'All' },
                { id: 'PENDING', label: 'Pending' },
                { id: 'APPROVED', label: 'Approved' },
                { id: 'REJECTED', label: 'Rejected' },
                { id: 'COMPLETED', label: 'Completed' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStatusFilter(s.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    statusFilter === s.id
                      ? 'bg-brand-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-brand-900'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Type:
            </span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-purple-200 text-xs font-semibold bg-white"
            >
              <option value="">All Types</option>
              <option value="RETURN">Returns</option>
              <option value="CANCELLATION">Cancellations</option>
              <option value="RESTOCK_ALERT">Restock Alerts</option>
            </select>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">
              Active Customer Requests ({requests.length})
            </h3>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs">Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">No customer requests in this category.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-purple-50 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Type</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Order / Product</th>
                    <th className="p-3">Reason / Details</th>
                    <th className="p-3">Refund Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-center">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map((req) => {
                    const isPending = req.status === 'PENDING';
                    return (
                      <tr key={req.id} className="hover:bg-purple-50/40">
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              req.request_type === 'RETURN'
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : req.request_type === 'CANCELLATION'
                                ? 'bg-rose-100 text-rose-900 border border-rose-200'
                                : 'bg-purple-100 text-purple-900 border border-purple-200'
                            }`}
                          >
                            {req.request_type === 'RETURN' && <RotateCcw className="w-3 h-3" />}
                            {req.request_type === 'CANCELLATION' && <Ban className="w-3 h-3" />}
                            {req.request_type === 'RESTOCK_ALERT' && <BellRing className="w-3 h-3" />}
                            {req.request_type}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-slate-800">
                          {req.user_name || 'Customer'}
                          <span className="block text-[10px] text-slate-400">{req.user_email || req.customer_email}</span>
                        </td>
                        <td className="p-3">
                          {req.order_number && (
                            <span className="font-mono font-bold text-slate-900 block">{req.order_number}</span>
                          )}
                          <span className="text-slate-600">{req.product_name || 'Item'}</span>
                        </td>
                        <td className="p-3 max-w-xs text-slate-600">
                          <p className="line-clamp-2">{req.reason}</p>
                          {req.admin_notes && (
                            <p className="text-[10px] text-purple-700 italic mt-0.5">Note: {req.admin_notes}</p>
                          )}
                        </td>
                        <td className="p-3 font-bold text-slate-900">
                          {req.refund_amount > 0 ? (
                            <>
                              ₹{Number(req.refund_amount).toLocaleString('en-IN')}
                              <span className="block text-[9px] text-emerald-600 font-normal">Original Payment</span>
                            </>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              req.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : req.status === 'REJECTED'
                                ? 'bg-rose-100 text-rose-800'
                                : req.status === 'COMPLETED'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {isPending ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleUpdateStatus(req.id, 'APPROVED', req.request_type)}
                                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs"
                                title="Approve & Restore Stock"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(req.id, 'REJECTED', req.request_type)}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-rose-100 text-rose-700 font-bold text-[11px]"
                                title="Reject Request"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(req.id, 'COMPLETED', req.request_type)}
                              className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-[10px]"
                            >
                              Update Status
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
