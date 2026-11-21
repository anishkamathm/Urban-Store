import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Clock, Zap, ArrowRight, ShieldCheck, MapPin, Sparkles } from 'lucide-react';
import { api } from '../services/api.js';

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const { state } = useLocation();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [order, setOrder] = useState(state?.order || null);
  const [loading, setLoading] = useState(!state?.order);

  useEffect(() => {
    if (!order && id) {
      api.getOrder(id)
        .then(data => {
          if (data.order) setOrder(data.order);
        })
        .catch(err => console.error('Failed to load order:', err))
        .finally(() => setLoading(false));
    }
  }, [id, order]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center animate-pulse space-y-4">
        <div className="w-16 h-16 bg-purple-100 rounded-full mx-auto"></div>
        <div className="h-6 bg-purple-100 rounded w-1/2 mx-auto"></div>
      </div>
    );
  }

  const orderNumber = order?.orderNumber || order?.order_number || id;
  const eta = order?.etaMinutes || order?.eta_minutes || 25;
  const total = order?.totalAmount || order?.total_amount || 0;
  const deliveryType = order?.deliveryType || order?.delivery_type || 'instant_30min';
  const isInstant = deliveryType === 'instant_30min';

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-8 animate-fadeIn">
      {/* Success Card */}
      <div className="bg-white rounded-3xl border border-purple-100 shadow-soft p-6 sm:p-10 text-center space-y-6">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner ring-8 ring-emerald-50/60">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full inline-block border border-emerald-200">
            Order Confirmed & Stock Reserved
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 tracking-tight">
            Thank You For Your Order!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Your fashion pieces have been atomically decremented from the nearest store and dispatched for delivery.
          </p>
        </div>

        {/* Highlighted Order Badge & ETA */}
        <div className="grid grid-cols-2 gap-4 bg-purple-50/60 p-5 rounded-2xl border border-purple-100 text-left">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Order Number
            </span>
            <span className="text-base font-bold text-brand-900 font-mono">
              {orderNumber}
            </span>
          </div>

          <div className="space-y-1 text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Estimated Delivery
            </span>
            <div className="inline-flex items-center gap-1.5 text-slate-900 font-bold text-base">
              {isInstant && <Zap className="w-4 h-4 fill-amber-400 text-amber-500" />}
              <span>{isInstant ? `${eta} mins` : '3-5 days'}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 justify-center">
          <Link
            to={`/orders/track/${order?.id || orderNumber}`}
            className="w-full sm:w-auto px-7 py-3.5 bg-brand-900 hover:bg-brand-800 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-soft flex items-center justify-center gap-2 transition active:scale-95"
          >
            <span>Live Order Tracking</span>
            <ArrowRight className="w-4 h-4 text-pink-300" />
          </Link>

          <Link
            to="/"
            className="w-full sm:w-auto px-7 py-3.5 bg-purple-50 hover:bg-purple-100 text-brand-900 font-bold text-xs uppercase tracking-wider rounded-2xl transition"
          >
            Continue Shopping
          </Link>
        </div>

        <div className="border-t border-purple-50 pt-4 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>7-Day Return Policy for clothes active once your order is marked delivered.</span>
        </div>
      </div>
    </div>
  );
}
