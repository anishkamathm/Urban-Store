import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Zap, Truck, AlertTriangle, ArrowRight, CheckCircle2, Lock } from 'lucide-react';
import { useCart } from '../contexts/CartContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useLocation } from '../contexts/LocationContext.jsx';
import { api } from '../services/api.js';
import Co2Badge from '../components/Co2Badge.jsx';

export default function CheckoutPage() {
  const { t, i18n } = useTranslation();
  const { items, subtotal, clearCart, hasReservedItem, isExpired, showReminder } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { location, setIsLocationModalOpen } = useLocation();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState(user?.name || 'Priya Sharma');
  const [customerEmail, setCustomerEmail] = useState(user?.email || 'customer@urbanstore.in');
  const [address, setAddress] = useState('Flat 402, Green Palms, 12th Main, 100ft Rd, Indiranagar, Bengaluru');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const isKn = i18n.language === 'kn';
  const isInstant = location.id !== 'demo-remote';
  // Flat Rs. 30 for faraway orders, free over 500 or 25 for instant
  const deliveryFee = isInstant ? (subtotal > 500 || subtotal === 0 ? 0 : 25) : 30;
  const total = subtotal + deliveryFee;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const orderPayload = {
        items: items.map(item => ({
          product_id: item.product_id || item.product?.id,
          quantity: item.quantity,
          size: item.size || 'M'
        })),
        customer_name: customerName,
        customer_email: customerEmail,
        delivery_address: address,
        delivery_lat: location.lat,
        delivery_lng: location.lng,
      };

      const res = await api.placeOrder(orderPayload);

      // Clear bag locally
      clearCart();

      // Navigate to confirmation page
      navigate(`/order-confirmation/${res.order.id || res.order.orderNumber}`, {
        state: { order: res.order }
      });
    } catch (err) {
      console.error('Order placement failed:', err);
      const msg = isKn && err.data?.errorKn ? err.data.errorKn : (err.message || 'Failed to place order.');
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">
            {t('checkout.title')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isKn ? 'ನಿಮ್ಮ ಮನೆಬಾಗಿಲಿಗೆ 30 ನಿಮಿಷಗಳ ವಿತರಣೆ' : 'Immediate fulfillment from nearest retail store hub or standard dispatch'}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 self-start sm:self-auto">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>256-Bit SSL Encrypted Checkout</span>
        </div>
      </div>

      {/* Expired reservation notice or last-unit hold status (NO timer/countdown) */}
      {isExpired && hasReservedItem ? (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900 shadow-xs">
          <span>
            {isKn
              ? 'ಗಮನಿಸಿ: ನಿಮ್ಮ 10 ನಿಮಿಷಗಳ ಕಾಯ್ದಿರಿಸುವಿಕೆ ಅವಧಿ ಮುಗಿದಿದೆ. ನೀವು ಆರ್ಡರ್ ಮಾಡುವಾಗ ಪ್ರಸ್ತುತ ದಾಸ್ತಾನನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತದೆ.'
              : 'Notice: Your 10-minute hold on the last unit has expired. Current stock will be re-verified upon checkout.'}
          </span>
        </div>
      ) : hasReservedItem ? (
        <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 flex items-center justify-between text-xs text-purple-900">
          <span className="font-semibold">
            {isKn ? 'ಕೊನೆಯ ಲಭ್ಯವಿರುವ ಯೂನಿಟ್ ನಿಮ್ಮ ಆರ್ಡರ್‌ಗಾಗಿ ಲಾಕ್ ಆಗಿದೆ.' : 'Last available unit is reserved for your order.'}
          </span>
          <span className="text-[11px] text-emerald-700 font-bold">✓ Stock Reserved</span>
        </div>
      ) : null}

      {/* Error alert if out of stock or concurrency failure */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-start gap-3 text-rose-800 animate-fadeIn shadow-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm">Inventory Reservation Update</h4>
            <p className="text-xs leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: Customer Information & Delivery Address */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-purple-100 shadow-soft p-6 sm:p-8 space-y-5">
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-900 border-b border-purple-50 pb-3">
              {t('checkout.deliveryDetails')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">{t('checkout.fullName')}</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-3.5 bg-purple-50/40 border border-purple-200 rounded-2xl focus:ring-2 focus:ring-brand-500 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full p-3.5 bg-purple-50/40 border border-purple-200 rounded-2xl focus:ring-2 focus:ring-brand-500 font-medium text-slate-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1.5">{t('checkout.address')}</label>
                <textarea
                  rows="2"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-3.5 bg-purple-50/40 border border-purple-200 rounded-2xl focus:ring-2 focus:ring-brand-500 font-medium text-slate-900"
                />
              </div>
            </div>

            {/* Matched Store & Delivery Mode Preview */}
            <div className="p-4 rounded-2xl border border-purple-100 bg-purple-50/50 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 uppercase tracking-wider">Fulfillment Routing</span>
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(true)}
                  className="text-brand-800 hover:underline font-bold cursor-pointer"
                >
                  Change Store / Hub
                </button>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <div className={`p-2.5 rounded-xl ${isInstant ? 'bg-amber-100 text-amber-900' : 'bg-purple-100 text-purple-900'}`}>
                  {isInstant ? <Zap className="w-5 h-5 fill-amber-500 text-amber-600" /> : <Truck className="w-5 h-5 text-purple-700" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    {isInstant ? '⚡ Instant 30-Min Delivery from Nearest Store' : '📦 Faraway Standard Delivery (Flat ₹30)'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {isKn ? (location.labelKn || location.labelEn) : location.labelEn}
                  </p>
                </div>
              </div>
            </div>

            {/* CO2 Emissions Badge */}
            <Co2Badge co2={{ deliveryCo2Kg: isInstant ? 0.18 : 0.45, savedCo2Kg: isInstant ? 0.72 : 1.2 }} />
          </div>
        </div>

        {/* Right: Checkout Summary */}
        <div className="space-y-5">
          <div className="bg-white rounded-3xl border border-purple-100 shadow-soft p-6 sm:p-8 space-y-5 sticky top-28">
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-900 border-b border-purple-50 pb-3">
              {t('checkout.orderSummary')}
            </h3>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span>{t('cart.subtotal')}</span>
                <span className="font-bold text-slate-900">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Delivery Charge</span>
                <span className={`font-bold ${deliveryFee === 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                  {deliveryFee === 0 ? t('cart.freeDelivery') : `Flat ₹${deliveryFee}`}
                </span>
              </div>
              <div className="border-t border-purple-50 pt-3 flex items-center justify-between text-base font-bold text-slate-900">
                <span>{t('cart.total')}</span>
                <span className="text-brand-900 font-black">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || items.length === 0}
              className={`w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-soft cursor-pointer ${
                isSubmitting
                  ? 'bg-slate-300 text-slate-500 cursor-wait'
                  : 'bg-brand-900 hover:bg-brand-800 text-white active:scale-98'
              }`}
            >
              {isSubmitting ? (
                <span>Placing Order & Decreasing Stock...</span>
              ) : (
                <>
                  <span>Place Order Now</span>
                  <ArrowRight className="w-4 h-4 text-pink-300" />
                </>
              )}
            </button>

            <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 flex items-start gap-2 text-[10px] text-slate-500 leading-snug">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                100% Encrypted & Authenticated · Shared stock atomic verification across online and physical stores.
              </span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
