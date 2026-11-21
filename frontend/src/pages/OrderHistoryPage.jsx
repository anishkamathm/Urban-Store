import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShoppingBag,
  ArrowRight,
  Leaf,
  Clock,
  MapPin,
  Zap,
  RotateCcw,
  CheckCircle2,
  X,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function OrderHistoryPage() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [ecoImpact, setEcoImpact] = useState({ totalOrders: 0, totalCo2SavedKg: 0, treesEquivalent: 0 });
  const [loading, setLoading] = useState(true);

  // Return Request Modal State
  const [returnModalOrder, setReturnModalOrder] = useState(null);
  const [returnReason, setReturnReason] = useState('Size does not fit properly');
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [returnSuccessMessage, setReturnSuccessMessage] = useState('');
  const [returnErrorMessage, setReturnErrorMessage] = useState('');

  const isKn = i18n.language === 'kn';

  const loadOrders = () => {
    if (isAuthenticated) {
      setLoading(true);
      api.getMyOrders()
        .then(data => {
          if (data.orders) setOrders(data.orders);
          if (data.ecoImpact) setEcoImpact(data.ecoImpact);
        })
        .catch(err => console.error('Failed to load orders:', err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [isAuthenticated, i18n.language]);

  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    if (!returnModalOrder) return;

    setIsSubmittingReturn(true);
    setReturnErrorMessage('');
    try {
      await api.createCustomerRequest({
        request_type: 'RETURN',
        order_id: returnModalOrder.id,
        reason: returnReason,
      });

      setReturnSuccessMessage(
        isKn
          ? `ಆರ್ಡರ್ #${returnModalOrder.order_number} ಗೆ ರಿಟರ್ನ್ ವಿನಂತಿಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ. ಅಂಗಡಿ ಮ್ಯಾನೇಜರ್ ಅನುಮೋದಿಸಿದ ತಕ್ಷಣ ₹${returnModalOrder.total_amount} ಮರುಪಾವತಿಯನ್ನು ಮೂಲ ಪಾವತಿ ವಿಧಾನಕ್ಕೆ ಜಮೆ ಮಾಡಲಾಗುತ್ತದೆ.`
          : `Return request submitted for Order ${returnModalOrder.order_number}. Refund of ₹${returnModalOrder.total_amount} will be credited to original payment method upon approval.`
      );
      setReturnModalOrder(null);
      loadOrders();
    } catch (err) {
      setReturnErrorMessage(err.message || 'Failed to submit return request');
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4 bg-white rounded-3xl border border-purple-100 shadow-soft my-8">
        <div className="w-16 h-16 bg-purple-50 text-purple-700 rounded-full flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-serif text-slate-900">Please Sign In</h2>
        <p className="text-xs text-slate-500">Log in to view your order history, track deliveries, and manage 7-day returns.</p>
        <Link
          to="/login"
          className="inline-block px-6 py-3 bg-brand-900 hover:bg-brand-800 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-xs transition"
        >
          {t('nav.login')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="border-b border-purple-100 pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">
          {t('orders.title')}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review previous orders, track live dispatch, and manage 7-day clothes returns
        </p>
      </div>

      {returnSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{returnSuccessMessage}</span>
        </div>
      )}

      {/* Eco Impact Summary Banner */}
      <div className="bg-gradient-to-br from-brand-950 to-purple-950 text-purple-100 rounded-3xl p-6 sm:p-8 shadow-soft border border-purple-800/40 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-emerald-500/20 rounded-2xl text-emerald-400 border border-emerald-400/30">
            <Leaf className="w-8 h-8 fill-current" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-serif text-white">{t('orders.ecoImpact')}</h3>
            <p className="text-xs text-purple-200/80 mt-0.5">
              Optimized local store routing with two-wheeler EV couriers vs. personal car trips.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-center sm:text-right">
          <div>
            <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider block">
              {t('orders.co2Saved')}
            </span>
            <span className="text-2xl font-black text-emerald-400">
              {ecoImpact.totalCo2SavedKg} kg
            </span>
          </div>
          <div className="h-8 w-px bg-purple-800"></div>
          <div>
            <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider block">
              {t('orders.treesEquivalent')}
            </span>
            <span className="text-2xl font-black text-pink-300">
              {ecoImpact.treesEquivalent} 🌲
            </span>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-28 bg-purple-100/50 rounded-2xl"></div>
          <div className="h-28 bg-purple-100/50 rounded-2xl"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-purple-100 p-8 space-y-4 shadow-soft">
          <p className="text-slate-500 text-sm">{t('orders.empty')}</p>
          <Link to="/" className="inline-block px-5 py-2.5 bg-brand-900 text-white rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-brand-800 transition">
            Explore Collection
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => {
            const isInstant = ord.delivery_type === 'instant_30min';
            const orderDate = new Date(ord.created_at).getTime();
            const daysSince = Math.floor((Date.now() - orderDate) / (1000 * 60 * 60 * 24));
            const isDelivered = ord.status === 'DELIVERED';
            const returnEligible = isDelivered && daysSince <= 7;

            return (
              <div
                key={ord.id}
                className="bg-white rounded-3xl border border-purple-100 p-6 shadow-soft hover:border-purple-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono font-bold text-sm text-brand-900">{ord.order_number}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      ord.status === 'DELIVERED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-purple-100 text-brand-900'
                    }`}>
                      {ord.status}
                    </span>
                    {isInstant ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-950 px-2 py-0.5 rounded-md">
                        <Zap className="w-3 h-3 fill-amber-500" />
                        30-Min Instant
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                        Standard Delivery (₹30)
                      </span>
                    )}

                    {returnEligible && (
                      <span className="text-[10px] font-bold bg-pink-50 text-pink-700 px-2.5 py-0.5 rounded-full border border-pink-200">
                        🔄 {7 - daysSince} days left to return
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(ord.created_at).toLocaleString('en-IN')}</span>
                    <span>·</span>
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate max-w-xs">{ord.delivery_address}</span>
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-0 border-purple-50">
                  <div className="text-right mr-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total</span>
                    <span className="text-base font-bold text-slate-900">
                      ₹{Number(ord.total_amount).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* 7-Day Return Button for eligible delivered clothes */}
                  {returnEligible && (
                    <button
                      type="button"
                      onClick={() => setReturnModalOrder(ord)}
                      className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-brand-900 font-bold text-xs rounded-2xl border border-purple-200 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-pink-600" />
                      <span>{t('orders.requestReturn')}</span>
                    </button>
                  )}

                  <Link
                    to={`/orders/track/${ord.id}`}
                    className="px-5 py-2.5 bg-brand-900 hover:bg-brand-800 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-xs transition flex items-center gap-1.5"
                  >
                    <span>{t('orders.viewTracking')}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-pink-300" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Return Request Modal */}
      {returnModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-purple-100 p-6 space-y-4 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-purple-100 pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-pink-600" />
                <h3 className="font-bold text-base text-slate-900">
                  {t('returns.modalTitle')}
                </h3>
              </div>
              <button
                onClick={() => setReturnModalOrder(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              {t('returns.modalSubtitle')}
            </p>

            {returnErrorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{returnErrorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmitReturn} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t('returns.reasonLabel')}
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white font-medium"
                >
                  <option value="Size does not fit properly">{t('returns.reasonSize')}</option>
                  <option value="Fabric or quality difference">{t('returns.reasonQuality')}</option>
                  <option value="Damaged or defective item">{t('returns.reasonDefect')}</option>
                  <option value="Changed my mind">{t('returns.reasonChangedMind')}</option>
                </select>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100 text-purple-900 text-xs space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Refund Amount:</span>
                  <span>₹{Number(returnModalOrder.total_amount).toLocaleString('en-IN')}</span>
                </div>
                <p className="text-[11px] text-purple-700">
                  Refund Method: Original Payment Method (UPI/Card). Approved returns automatically restore the items to store inventory.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReturnModalOrder(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReturn}
                  className="px-5 py-2.5 rounded-xl bg-brand-900 hover:bg-brand-800 text-white font-bold transition shadow-xs"
                >
                  {isSubmittingReturn ? t('returns.submitting') : t('returns.submitReturn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
