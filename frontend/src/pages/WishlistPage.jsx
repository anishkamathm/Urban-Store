import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Heart,
  Trash2,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Check,
  Star,
  Zap,
  Package
} from 'lucide-react';
import { useWishlist } from '../contexts/WishlistContext.jsx';
import { useCart } from '../contexts/CartContext.jsx';
import DeliveryBadge from '../components/DeliveryBadge.jsx';
import StockBadge from '../components/StockBadge.jsx';

export default function WishlistPage() {
  const { t, i18n } = useTranslation();
  const { wishlist, removeFromWishlist, loading } = useWishlist();
  const { addToCart } = useCart();
  const [addedMap, setAddedMap] = useState({});

  const isKn = i18n.language === 'kn';

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1, 'M');
    const pid = product.id || product.product_id;
    setAddedMap(prev => ({ ...prev, [pid]: true }));
    setTimeout(() => {
      setAddedMap(prev => ({ ...prev, [pid]: false }));
    }, 1500);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4 space-y-6">
        <div className="h-6 bg-purple-100 rounded w-36 animate-pulse"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="aspect-3/4 bg-purple-100/60 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-6 bg-white rounded-3xl border border-purple-100 shadow-soft my-10 animate-fadeIn">
        <div className="w-20 h-20 bg-pink-50 text-pink-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <Heart className="w-10 h-10 stroke-[1.5]" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-serif text-slate-900">
            {isKn ? 'ನಿಮ್ಮ ಬಯಕೆಪಟ್ಟಿ ಖಾಲಿಯಾಗಿದೆ' : 'Your Wishlist is Empty'}
          </h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            {isKn
              ? 'ನೀವು ಇಷ್ಟಪಡುವ ಫ್ಯಾಷನ್ ಉಡುಪುಗಳನ್ನು ಬಯಕೆಪಟ್ಟಿಗೆ ಸೇರಿಸಲು ಹಾರ್ಟ್ ಐಕಾನ್ ಒತ್ತಿರಿ.'
              : 'Save items you love to your personal wishlist by clicking the heart icon on any fashion piece.'}
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand-900 hover:bg-brand-800 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-xs transition active:scale-95"
        >
          <span>{isKn ? 'ಸಂಗ್ರಹವನ್ನು ಅನ್ವೇಷಿಸಿ' : 'Explore Collections'}</span>
          <ArrowRight className="w-4 h-4 text-pink-300" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-100 pb-5">
        <div className="space-y-1">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-900 transition">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{isKn ? 'ಖರೀದಿ ಮುಂದುವರಿಸಿ' : 'Continue Shopping'}</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 flex items-center gap-3">
            <span>{isKn ? 'ನನ್ನ ಬಯಕೆಪಟ್ಟಿ' : 'My Wishlist'}</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-800 border border-pink-200">
              {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'}
            </span>
          </h1>
        </div>
      </div>

      {/* Grid of Wishlist Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {wishlist.map((item) => {
          const prod = item.product || {};
          const prodId = item.product_id || prod.id;
          const name = isKn ? (prod.name_kn || prod.name_en) : prod.name_en;
          const isAdded = !!addedMap[prodId];
          const isOutOfStock = prod.totalStock !== undefined && prod.totalStock <= 0;

          return (
            <div
              key={item.id || prodId}
              className="group bg-white rounded-3xl border border-purple-100 hover:border-purple-300 hover:shadow-soft-lg transition-all duration-300 flex flex-col overflow-hidden relative"
            >
              {/* Product Image Link */}
              <Link to={`/product/${prodId}`} className="relative aspect-3/4 overflow-hidden bg-purple-50/50 block">
                <img
                  src={prod.image_url}
                  alt={name}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
                  loading="lazy"
                />

                {/* Remove Button (Trash) Top Right */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeFromWishlist(prodId);
                  }}
                  className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md shadow-sm text-slate-500 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition active:scale-95"
                  title="Remove from Wishlist"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Stock status badge Top Left */}
                <div className="absolute top-3 left-3 z-10">
                  <StockBadge productId={prodId} initialStock={prod.totalStock} />
                </div>
              </Link>

              {/* Card Details */}
              <div className="p-4 flex flex-col flex-1 justify-between gap-3 bg-white">
                <div className="space-y-1">
                  {prod.deliveryBadge && (
                    <DeliveryBadge badge={prod.deliveryBadge} />
                  )}

                  <Link to={`/product/${prodId}`} className="block">
                    <h3 className="font-bold text-sm text-slate-900 line-clamp-1 hover:text-brand-700 transition-colors">
                      {name}
                    </h3>
                  </Link>

                  <div className="flex items-baseline gap-2 pt-1">
                    <span className="text-base font-bold text-slate-900">
                      ₹{Number(prod.price || 0).toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-slate-400 line-through">
                      ₹{Math.round(Number(prod.price || 0) * 1.35).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Actions: Add to Bag and Remove */}
                <div className="pt-3 border-t border-purple-50 flex items-center justify-between gap-2 mt-auto">
                  <button
                    type="button"
                    onClick={(e) => handleAddToCart(e, prod)}
                    disabled={isOutOfStock}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                      isOutOfStock
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : isAdded
                        ? 'bg-emerald-600 text-white'
                        : 'bg-brand-900 hover:bg-brand-800 text-white active:scale-95'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-200" />
                        <span>{t('product.inCart')}</span>
                      </>
                    ) : isOutOfStock ? (
                      <span>{t('product.outOfStock')}</span>
                    ) : (
                      <>
                        <ShoppingBag className="w-3.5 h-3.5 text-pink-300" />
                        <span>{t('product.addToCart')}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => removeFromWishlist(prodId)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
