import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShoppingBag,
  Check,
  ArrowLeft,
  Store,
  ShieldCheck,
  Zap,
  Minus,
  Plus,
  Star,
  RotateCcw,
  Heart,
  Ruler,
  Clock
} from 'lucide-react';
import { api } from '../services/api.js';
import { useCart } from '../contexts/CartContext.jsx';
import { useWishlist } from '../contexts/WishlistContext.jsx';
import { useLocation } from '../contexts/LocationContext.jsx';
import StockBadge from '../components/StockBadge.jsx';
import DeliveryBadge from '../components/DeliveryBadge.jsx';
import Co2Badge from '../components/Co2Badge.jsx';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { location } = useLocation();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('M');
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getProductById(id, location.lat, location.lng)
      .then(data => {
        if (data.product) {
          setProduct(data.product);
          if (data.product.sizes && data.product.sizes.length > 0) {
            setSelectedSize(data.product.sizes[1] || data.product.sizes[0]);
          }
        }
      })
      .catch(err => console.error('Failed to load product:', err))
      .finally(() => setLoading(false));
  }, [id, location, i18n.language]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4 animate-pulse space-y-6">
        <div className="h-5 bg-purple-100 rounded w-28"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="aspect-3/4 bg-purple-100/60 rounded-3xl"></div>
          <div className="space-y-4">
            <div className="h-8 bg-purple-100 rounded w-3/4"></div>
            <div className="h-4 bg-purple-100 rounded w-1/4"></div>
            <div className="h-24 bg-purple-100/60 rounded-2xl"></div>
            <div className="h-12 bg-purple-100 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 px-4 space-y-4">
        <h2 className="text-xl font-bold font-serif text-slate-900">Product Not Found</h2>
        <p className="text-slate-500 text-sm">This fashion style is no longer available in the catalog.</p>
        <Link to="/" className="inline-block px-5 py-2.5 bg-brand-900 text-white rounded-2xl text-xs font-bold hover:bg-brand-800 transition">
          &larr; Back to Collection
        </Link>
      </div>
    );
  }

  const isKn = i18n.language === 'kn';
  const name = isKn ? (product.name_kn || product.name_en) : product.name_en;
  const description = isKn ? (product.description_kn || product.description_en) : product.description_en;
  const isOutOfStock = product.totalStock !== undefined && product.totalStock <= 0;
  const originalPrice = Math.round(Number(product.price) * 1.35);
  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedSize);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const sizes = product.sizes && product.sizes.length > 0 ? product.sizes : ['S', 'M', 'L', 'XL', 'XXL'];

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link to="/" className="hover:text-brand-900 transition flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        <span>/</span>
        <span className="text-slate-400 capitalize">{product.category_id?.replace('cat-', '') || 'Fashion'}</span>
        <span>/</span>
        <span className="text-slate-900 font-semibold truncate max-w-xs">{name}</span>
      </nav>

      {/* Main Product Card Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 bg-white p-6 sm:p-10 rounded-3xl border border-purple-100 shadow-soft">
        {/* Left Column: Portrait Photography Gallery (5 cols) */}
        <div className="md:col-span-5 space-y-4">
          <div className="aspect-3/4 rounded-3xl overflow-hidden bg-purple-50/50 border border-purple-100 relative shadow-inner group">
            <img
              src={product.image_url}
              alt={name}
              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
            />

            {/* Wishlist Heart */}
            <button
              type="button"
              onClick={() => toggleWishlist(product)}
              className="absolute top-4 left-4 z-20 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md shadow-sm flex items-center justify-center hover:scale-110 active:scale-95 transition"
            >
              <Heart className={`w-4 h-4 ${inWishlist ? 'text-pink-600 fill-pink-500' : 'text-slate-600'}`} />
            </button>

            {/* Live Stock Badge */}
            <div className="absolute top-4 right-4 z-10">
              <StockBadge productId={product.id} initialStock={product.totalStock} />
            </div>

            {/* Instant Delivery Pill */}
            {product.deliveryBadge?.isInstant && (
              <div className="absolute bottom-4 left-4 z-10">
                <span className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-950 font-black text-xs px-3 py-1 rounded-full shadow-sm tracking-wide">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  ⚡ 30-MIN INSTANT
                </span>
              </div>
            )}
          </div>

          {/* Value Badges */}
          <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-600 font-semibold pt-1">
            <div className="p-2.5 bg-purple-50/60 rounded-xl border border-purple-100">
              <span>🧵 100% Authentic</span>
            </div>
            <div className="p-2.5 bg-purple-50/60 rounded-xl border border-purple-100">
              <span>⚡ 30-Min Fast Hub</span>
            </div>
            <div className="p-2.5 bg-purple-50/60 rounded-xl border border-purple-100">
              <span>🔄 7-Day Returns</span>
            </div>
          </div>
        </div>

        {/* Right Column: Garment Specs, Size Selector & Purchase (7 cols) */}
        <div className="md:col-span-7 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <DeliveryBadge badge={product.deliveryBadge} />

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-brand-800 bg-purple-100 px-3 py-1 rounded-full inline-block">
                Urban Signature Collection
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 tracking-tight pt-1">
                {name}
              </h1>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${i < 4 ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`}
                  />
                ))}
              </div>
              <span className="font-bold text-slate-800">4.9 / 5.0</span>
              <span className="text-slate-400">· 120+ Store Reviews</span>
            </div>

            {/* Pricing Section */}
            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-1">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-slate-900 tracking-tight">
                  ₹{Number(product.price).toLocaleString('en-IN')}
                </span>
                <span className="text-sm text-slate-400 line-through">
                  ₹{originalPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                  Save 26%
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Inclusive of all taxes · Free 30-min trial delivery on orders above ₹500
              </p>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              {description}
            </p>

            {/* Size Selector */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 uppercase tracking-wider">
                  Select Size: <span className="text-brand-800">{selectedSize}</span>
                </span>
                <span className="text-slate-400 text-[11px]">Standard Indian Fit</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {sizes.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSelectedSize(sz)}
                    className={`min-w-12 h-11 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedSize === sz
                        ? 'bg-brand-900 text-white shadow-xs'
                        : 'bg-white border border-purple-200 text-slate-700 hover:border-purple-400'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Eco Delivery Impact */}
            <div className="pt-2">
              <Co2Badge co2={product.co2} />
            </div>
          </div>

          {/* Stepper & Add to Bag */}
          <div className="space-y-4 pt-6 border-t border-purple-100">
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-purple-200 rounded-2xl bg-purple-50/50 p-1">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="p-2.5 text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-bold text-sm text-slate-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={isOutOfStock}
                  className="p-2.5 text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`flex-1 py-4 px-6 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-soft cursor-pointer ${
                  isOutOfStock
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                    : added
                    ? 'bg-emerald-600 text-white'
                    : 'bg-brand-900 hover:bg-brand-800 text-white active:scale-98'
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>In Shopping Bag</span>
                  </>
                ) : isOutOfStock ? (
                  <span>Sold Out</span>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 text-pink-300" />
                    <span>Add to Bag</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>7-Day Return Policy for clothes with direct refund to original payment method.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Per-Store Stock Breakdown */}
      {product.stores && product.stores.length > 0 && (
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-purple-50 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-brand-900 flex items-center justify-center">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Store Availability & Instant Hubs
                </h3>
                <p className="text-[11px] text-slate-500">
                  Shared real-time stock across physical retail and online store
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              ⚡ Real-Time Sync
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {product.stores.map((st) => (
              <div
                key={st.store_id}
                className="p-3.5 rounded-2xl border border-purple-100 bg-purple-50/40 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900">{st.store_name}</p>
                  <p className="text-[10px] text-slate-500">{st.city} · Radius: {st.delivery_radius_km} km</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    st.stock > 5
                      ? 'bg-emerald-100 text-emerald-800'
                      : st.stock > 0
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {st.stock > 0 ? `${st.stock} in stock` : 'Sold out'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
