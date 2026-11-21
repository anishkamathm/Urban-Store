import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  Minus,
  Plus,
  Zap,
  ShieldCheck,
  Truck,
  ArrowLeft,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { useCart } from '../contexts/CartContext.jsx';
import { useLocation } from '../contexts/LocationContext.jsx';
import Co2Badge from '../components/Co2Badge.jsx';

export default function CartPage() {
  const { t, i18n } = useTranslation();
  const {
    items,
    itemCount,
    subtotal,
    updateQuantity,
    removeFromCart,
    clearCart,
    showReminder,
    isExpired,
    hasReservedItem,
    reminderMessage
  } = useCart();
  const { location } = useLocation();
  const navigate = useNavigate();

  const isKn = i18n.language === 'kn';
  const isInstant = location.id !== 'demo-remote';
  // Faraway delivery flat Rs. 30, instant is free over 500 or 25
  const deliveryFee = isInstant ? (subtotal > 500 || subtotal === 0 ? 0 : 25) : 30;
  const total = subtotal + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-6 bg-white rounded-3xl border border-purple-100 shadow-soft my-10 animate-fadeIn">
        <div className="w-20 h-20 bg-purple-50 text-brand-800 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-serif text-slate-900">
            {t('cart.empty')}
          </h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            {t('cart.emptySubtitle')}
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand-900 hover:bg-brand-800 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-xs transition active:scale-95"
        >
          <span>{t('cart.explore')}</span>
          <ArrowRight className="w-4 h-4 text-pink-300" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-fadeIn">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-100 pb-5">
        <div className="space-y-1">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-900 transition">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue Shopping</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 flex items-center gap-3">
            <span>{t('cart.title')}</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-brand-900 border border-purple-200">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </span>
          </h1>
        </div>

        <button
          onClick={clearCart}
          className="text-xs text-rose-600 hover:text-rose-800 font-semibold transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Cart</span>
        </button>
      </div>

      {/* 8-Minute Payment Reminder Alert (Sent once per cart for last unit, NO countdown timer) */}
      {showReminder && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span className="font-bold">
              {isKn
                ? '⚡ ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪಾವತಿಯನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ: ಕೊನೆಯ ಲಭ್ಯವಿರುವ ಯೂನಿಟ್ ಶೀಘ್ರದಲ್ಲೇ ಬಿಡುಗಡೆಯಾಗುತ್ತದೆ.'
                : '⚡ Complete your payment: The last available unit in your bag is held for you. Complete payment now before it is released.'}
            </span>
          </div>
          <button
            onClick={() => navigate('/checkout')}
            className="px-4 py-1.5 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 transition shrink-0 cursor-pointer"
          >
            {isKn ? 'ಈಗಲೇ ಪಾವತಿಸಿ' : 'Pay Now'}
          </button>
        </div>
      )}

      {/* Reservation Expired Notice (Quiet & friendly) */}
      {isExpired && hasReservedItem && (
        <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <RotateCcw className="w-4 h-4 text-purple-600 shrink-0" />
            <span>
              {isKn
                ? 'ಕೊನೆಯ ಯೂನಿಟ್‌ನ ಕಾಯ್ದಿರಿಸುವಿಕೆ ಅವಧಿ ಮುಕ್ತಾಯಗೊಂಡಿದೆ. ಸ್ಟಾಕ್ ಲಭ್ಯವಿದ್ದರೆ ನೀವು ಇನ್ನೂ ಆರ್ಡರ್ ಮಾಡಬಹುದು.'
                : 'The 10-minute hold on the last unit has expired. If stock is still available, you can proceed to checkout.'}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl border border-purple-100 shadow-soft divide-y divide-purple-50 overflow-hidden">
            {items.map((item) => {
              const prod = item.product || {};
              const name = isKn ? (prod.name_kn || prod.name_en) : prod.name_en;
              const prodId = item.product_id || prod.id;
              const unitPrice = parseFloat(prod.price) || 0;
              const itemTotal = unitPrice * item.quantity;

              return (
                <div key={item.id || prodId} className="p-5 sm:p-6 flex items-start gap-4 sm:gap-6 hover:bg-purple-50/30 transition group">
                  {/* Image */}
                  <Link to={`/product/${prodId}`} className="relative aspect-3/4 w-20 sm:w-24 rounded-2xl overflow-hidden bg-purple-50 shrink-0 border border-purple-100 block">
                    <img
                      src={prod.image_url}
                      alt={name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <Link to={`/product/${prodId}`}>
                      <h4 className="font-bold text-sm text-slate-900 hover:text-brand-700 transition truncate">
                        {name}
                      </h4>
                    </Link>

                    <p className="text-xs text-slate-400">
                      Size: <span className="font-semibold text-slate-700">{item.size || 'M'}</span> • Fashion
                    </p>

                    <div className="pt-2 flex items-center gap-3">
                      <span className="text-base font-bold text-slate-900">
                        ₹{unitPrice.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Quantity Controls & Delete */}
                    <div className="pt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 border border-purple-200 rounded-xl p-1 bg-purple-50/50">
                        <button
                          type="button"
                          onClick={() => updateQuantity(prodId, item.quantity - 1)}
                          className="w-6 h-6 rounded-lg bg-white shadow-2xs flex items-center justify-center text-slate-700 hover:bg-purple-100 transition cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(prodId, item.quantity + 1)}
                          className="w-6 h-6 rounded-lg bg-white shadow-2xs flex items-center justify-center text-slate-700 hover:bg-purple-100 transition cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-sm text-brand-900 block">
                          ₹{itemTotal.toLocaleString('en-IN')}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFromCart(prodId)}
                          className="text-[11px] text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Guarantee pill */}
          <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100 flex items-center gap-3 text-xs text-slate-600">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              {isKn
                ? 'ಪ್ರತಿಯೊಂದು ವಸ್ತುವನ್ನು ಆಫ್‌ಲೈನ್ ಮತ್ತು ಆನ್‌ಲೈನ್ ಮಳಿಗೆಯ ಹಂಚಿಕೆಯ ಸ್ಟಾಕ್‌ನಿಂದ ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ.'
                : 'Atomic stock reservation active across physical retail and online store. Overselling prevented.'}
            </span>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-purple-100 shadow-soft p-6 space-y-6 sticky top-28">
            <h3 className="font-bold text-sm text-slate-900 border-b border-purple-50 pb-3">
              Order Summary
            </h3>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span>{t('cart.subtotal')}</span>
                <span className="font-bold text-slate-900">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex items-center justify-between">
                <span>{t('cart.deliveryFee')}</span>
                <span className={`font-bold ${deliveryFee === 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                  {deliveryFee === 0 ? t('cart.freeDelivery') : `₹${deliveryFee}`}
                </span>
              </div>

              <div className="border-t border-purple-50 pt-3 flex items-center justify-between text-base font-bold text-slate-900">
                <span>{t('cart.total')}</span>
                <span className="text-brand-900 font-black">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="w-full py-4 rounded-2xl bg-brand-900 hover:bg-brand-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-soft transition active:scale-98 cursor-pointer"
            >
              <span>{t('cart.proceedToCheckout')}</span>
              <ArrowRight className="w-4 h-4 text-pink-300" />
            </button>

            <div className="pt-2">
              <Co2Badge co2={{ deliveryCo2Kg: isInstant ? 0.18 : 0.45, savedCo2Kg: isInstant ? 0.72 : 1.2 }} compact={true} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
