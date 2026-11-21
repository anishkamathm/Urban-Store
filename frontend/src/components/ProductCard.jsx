import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, Check, Zap, Star, Heart } from 'lucide-react';
import { useCart } from '../contexts/CartContext.jsx';
import { useWishlist } from '../contexts/WishlistContext.jsx';
import StockBadge from './StockBadge.jsx';
import DeliveryBadge from './DeliveryBadge.jsx';

export default function ProductCard({ product }) {
  const { t, i18n } = useTranslation();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [added, setAdded] = useState(false);
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[1] || product.sizes?.[0] || 'M');

  const isKn = i18n.language === 'kn';
  const name = isKn ? (product.name_kn || product.name_en) : product.name_en;
  const description = isKn ? (product.description_kn || product.description_en) : product.description_en;

  const inWishlist = isInWishlist(product.id);

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1, selectedSize);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const isOutOfStock = product.totalStock !== undefined && product.totalStock <= 0;
  const originalPrice = Math.round(Number(product.price) * 1.35);
  const prodId = product.id || product.product_id;

  return (
    <div className="group bg-white rounded-3xl border border-purple-100 hover:border-purple-300 hover:shadow-soft-lg transition-all duration-300 flex flex-col overflow-hidden relative">
      {/* 3:4 Portrait Image Container */}
      <Link to={`/product/${prodId}`} className="relative aspect-3/4 overflow-hidden bg-purple-50/50 block">
        <img
          src={product.image_url}
          alt={name}
          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
          loading="lazy"
        />

        {/* Subtle Dark Gradient Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Wishlist Heart Top Left */}
        <button
          type="button"
          onClick={handleToggleWishlist}
          className="absolute top-3 left-3 z-20 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md shadow-sm flex items-center justify-center hover:scale-110 active:scale-95 transition"
          title="Add to Wishlist"
        >
          <Heart className={`w-4 h-4 ${inWishlist ? 'text-pink-600 fill-pink-500' : 'text-slate-600'}`} />
        </button>

        {/* Live Stock Badge Top Right */}
        <div className="absolute top-3 right-3 z-10">
          <StockBadge productId={product.id} initialStock={product.totalStock} />
        </div>

        {/* 30-Min Delivery Pill */}
        {product.deliveryBadge?.isInstant ? (
          <div className="absolute bottom-3 left-3 z-10 group-hover:opacity-0 transition-opacity">
            <span className="inline-flex items-center gap-1 bg-amber-400 text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-full shadow-sm tracking-wide">
              <Zap className="w-3 h-3 fill-current text-slate-950" />
              ⚡ 30-MIN
            </span>
          </div>
        ) : (
          <div className="absolute bottom-3 left-3 z-10 group-hover:opacity-0 transition-opacity">
            <span className="inline-flex items-center gap-1 bg-purple-900/80 backdrop-blur-xs text-purple-100 font-semibold text-[10px] px-2.5 py-0.5 rounded-full shadow-sm">
              FLAT ₹30
            </span>
          </div>
        )}

        {/* Hover Quick Size Selector Bar */}
        {product.sizes && product.sizes.length > 0 && (
          <div className="absolute bottom-3 left-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-1.5 bg-white/95 backdrop-blur-md py-1.5 px-2 rounded-xl shadow-md">
            <span className="text-[10px] uppercase font-bold text-slate-500 mr-1">Size:</span>
            {product.sizes.map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedSize(sz);
                }}
                className={`w-6 h-6 rounded-md text-[10px] font-bold transition ${
                  selectedSize === sz
                    ? 'bg-brand-900 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-purple-100'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>
        )}
      </Link>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3 bg-white">
        <div className="space-y-1.5">
          {/* Nearest Store Delivery Info */}
          <DeliveryBadge badge={product.deliveryBadge} />

          {/* Title */}
          <Link to={`/product/${prodId}`} className="block">
            <h3 className="font-bold text-sm text-slate-900 line-clamp-1 hover:text-brand-700 transition-colors tracking-tight">
              {name}
            </h3>
          </Link>

          {/* Short description */}
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {description}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-1 text-xs text-amber-500 pt-0.5">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${i < 4 ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`}
                />
              ))}
            </div>
            <span className="text-[11px] font-bold text-slate-700 ml-1">4.9</span>
            <span className="text-[10px] text-slate-400">(Urban Verified)</span>
          </div>
        </div>

        {/* Pricing & Add to Bag */}
        <div className="pt-3 border-t border-purple-50 flex items-center justify-between gap-2 mt-auto">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-slate-900 tracking-tight">
                ₹{Number(product.price).toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-slate-400 line-through">
                ₹{originalPrice.toLocaleString('en-IN')}
              </span>
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold block">
              Inclusive of GST
            </span>
          </div>

          <button
            onClick={handleAdd}
            disabled={isOutOfStock}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : added
                ? 'bg-emerald-600 text-white'
                : 'bg-brand-900 hover:bg-brand-800 text-white active:scale-95'
            }`}
          >
            {added ? (
              <>
                <Check className="w-4 h-4 text-emerald-200" />
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
        </div>
      </div>
    </div>
  );
}
