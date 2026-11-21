import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Zap,
  ShoppingBag,
  Clock,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Headphones,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Watch,
  Footprints,
  Shirt,
  Briefcase,
  Wallet,
  Glasses
} from 'lucide-react';
import { api } from '../services/api.js';
import { useLocation } from '../contexts/LocationContext.jsx';
import SearchBar from '../components/SearchBar.jsx';
import ProductCard from '../components/ProductCard.jsx';

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const { location, setIsLocationModalOpen } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suggestion, setSuggestion] = useState(null);

  // Search & Filter state
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [instantOnly, setInstantOnly] = useState(searchParams.get('instant') === 'true');

  // Carousel slide state
  const [currentSlide, setCurrentSlide] = useState(0);

  const isKn = i18n.language === 'kn';

  const slides = [
    {
      badge: isKn ? 'ಹೊಸ ಚಳಿಗಾಲದ ಸಂಗ್ರಹ 2025' : 'Winter & Festive Essentials 2025',
      title: isKn ? 'ನಿಮ್ಮ ಶೈಲಿಗೆ ತಕ್ಕಂತೆ ರೂಪಿಸಿದ ಅರ್ಬನ್ ಫ್ಯಾಷನ್' : 'Winter Fashion Essentials',
      italicTitle: isKn ? 'ವಿಶೇಷ ವಿನ್ಯಾಸಗಳು' : 'The Haute Edit',
      subtitle: isKn
        ? 'ಕ್ಯಾಶ್ಮಿಯರ್ ಬ್ಲೇಜರ್‌ಗಳು, ರೋಸ್ ಗೋಲ್ಡ್ ವಾಚ್‌ಗಳು ಮತ್ತು ಇಟಾಲಿಯನ್ ಲೆದರ್ ಶೂಗಳು — ಕೇವಲ 30 ನಿಮಿಷಗಳಲ್ಲಿ ನಿಮ್ಮ ಮನೆಬಾಗಿಲಿಗೆ.'
        : 'Curated cashmere outerwear, rose gold horology, and Italian crafted boots — delivered to your door in 30 minutes.',
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=80',
      cta: isKn ? 'ಈಗಲೇ ಖರೀದಿಸಿ' : 'Shop Now',
      ctaLink: '#trending',
      tag: '⚡ 30-Min Delivery'
    },
    {
      badge: isKn ? 'ಐಷಾರಾಮಿ ವಾಚ್‌ಗಳ ಸಂಗ್ರಹ' : 'Precision & Elegance',
      title: isKn ? 'ಶಾಶ್ವತ ಸೌಂದರ್ಯದ ಪ್ರೀಮಿಯಂ ವಾಚ್‌ಗಳು' : 'Timeless Luxury Chronographs',
      italicTitle: isKn ? 'ಅರ್ಬನ್ ಪ್ರೆಸ್ಟೀಜ್' : 'Urban Prestige',
      subtitle: isKn
        ? 'ಸ್ವಿಸ್ ಮೂವ್‌ಮೆಂಟ್ ರೋಸ್ ಗೋಲ್ಡ್ ಕ್ರೋನೋಗ್ರಾಫ್ ಮತ್ತು ಕ್ಲಾಸಿಕ್ ಚರ್ಮದ ವಾಚ್‌ಗಳು.'
        : 'Mastercrafted automatic chronographs and minimalist rose-gold dials with authentic store warranty.',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1600&auto=format&fit=crop&q=80',
      cta: isKn ? 'ವಾಚ್‌ಗಳನ್ನು ನೋಡಿ' : 'Explore Watches',
      ctaLink: '/?category=cat-watches',
      tag: 'Authenticity Guaranteed'
    },
    {
      badge: isKn ? 'ಹ್ಯಾಂಡ್‌ಕ್ರಾಫ್ಟೆಡ್ ಲೆದರ್' : 'Artisan Craftsmanship',
      title: isKn ? 'ಪ್ರೀಮಿಯಂ ಲೆದರ್ ಶೂಗಳು & ಹ್ಯಾಂಡ್‌ಬ್ಯಾಗ್‌ಗಳು' : 'Handcrafted Bags & Footwear',
      italicTitle: isKn ? 'ಇಟಾಲಿಯನ್ ಫಿನಿಶ್' : 'Pure Elegance',
      subtitle: isKn
        ? 'ಟೊಸ್ಕಾನಾ ಟ್ರಾವೆಲ್ ಟೋಟ್ ಬ್ಯಾಗ್‌ಗಳು, ಚೆಲ್ಸಿಯಾ ಬೂಟುಗಳು ಮತ್ತು ಸಾಂಪ್ರದಾಯಿಕ ವಾಲೆಟ್‌ಗಳು.'
        : 'Full-grain leather tote bags, Chelsea boots, and designer wallets crafted for everyday luxury.',
      image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=1600&auto=format&fit=crop&q=80',
      cta: isKn ? 'ಬ್ಯಾಗ್‌ಗಳನ್ನು ನೋಡಿ' : 'View Collection',
      ctaLink: '/?category=cat-handbags',
      tag: '7-Day Easy Returns'
    }
  ];

  // Auto advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Synchronize category with URL changes
  useEffect(() => {
    const urlCategory = searchParams.get('category') || '';
    if (urlCategory !== selectedCategory) {
      setSelectedCategory(urlCategory);
      fetchProducts(query, { category: urlCategory });
    }
  }, [searchParams]);

  // Fetch categories on mount
  useEffect(() => {
    api.getCategories()
      .then(data => {
        if (data.categories) setCategories(data.categories);
      })
      .catch(() => {});
  }, [i18n.language]);

  const fetchProducts = async (overrideQuery = query, filterOverrides = {}) => {
    setLoading(true);
    try {
      const activeFilters = {
        q: overrideQuery !== undefined ? overrideQuery : query,
        category: filterOverrides.category !== undefined ? filterOverrides.category : selectedCategory,
        minPrice: filterOverrides.minPrice !== undefined ? filterOverrides.minPrice : minPrice,
        maxPrice: filterOverrides.maxPrice !== undefined ? filterOverrides.maxPrice : maxPrice,
        city: filterOverrides.city !== undefined ? filterOverrides.city : city,
        instantOnly: filterOverrides.instantOnly !== undefined ? filterOverrides.instantOnly : instantOnly,
        userLat: location.lat,
        userLng: location.lng,
      };

      const res = await api.getProducts(activeFilters);
      setProducts(res.products || []);
      setSuggestion(res.suggestion || null);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [location, i18n.language]);

  const handleSearchTrigger = (searchWord, filterOverrides) => {
    fetchProducts(searchWord, filterOverrides);
  };

  const handleCategorySelect = (catId) => {
    const next = selectedCategory === catId ? '' : catId;
    setSelectedCategory(next);
    setSearchParams(next ? { category: next } : {});
    fetchProducts(query, { category: next });
  };

  // 6 Pastel Category Tiles Data
  const pastelCategories = [
    {
      id: 'cat-watches',
      nameEn: 'Watches',
      nameKn: 'ವಾಚ್‌ಗಳು',
      icon: Watch,
      bg: 'bg-[#F5EEFD]',
      border: 'border-purple-200',
      text: 'text-purple-900',
      badge: 'From ₹4,999'
    },
    {
      id: 'cat-shoes',
      nameEn: 'Shoes & Boots',
      nameKn: 'ಶೂಗಳು',
      icon: Footprints,
      bg: 'bg-[#F0F9FF]',
      border: 'border-sky-200',
      text: 'text-sky-900',
      badge: 'Italian Leather'
    },
    {
      id: 'cat-clothes',
      nameEn: 'Clothes & Apparel',
      nameKn: 'ಉಡುಪುಗಳು',
      icon: Shirt,
      bg: 'bg-[#FDF2F8]',
      border: 'border-pink-200',
      text: 'text-pink-900',
      badge: '7-Day Return'
    },
    {
      id: 'cat-handbags',
      nameEn: 'Handbags',
      nameKn: 'ಹ್ಯಾಂಡ್‌ಬ್ಯಾಗ್‌ಗಳು',
      icon: Briefcase,
      bg: 'bg-[#FFFBEB]',
      border: 'border-amber-200',
      text: 'text-amber-900',
      badge: 'Designer Totes'
    },
    {
      id: 'cat-wallets',
      nameEn: 'Bags & Wallets',
      nameKn: 'ಬ್ಯಾಗ್ & ವಾಲೆಟ್',
      icon: Wallet,
      bg: 'bg-[#F0FDF4]',
      border: 'border-emerald-200',
      text: 'text-emerald-900',
      badge: 'Slim Bi-fold'
    },
    {
      id: 'cat-accessories',
      nameEn: 'Accessories',
      nameKn: 'ಪರಿಕರಗಳು',
      icon: Glasses,
      bg: 'bg-[#EDE9FE]',
      border: 'border-violet-200',
      text: 'text-violet-900',
      badge: 'Premium Style'
    },
  ];

  const slide = slides[currentSlide];

  return (
    <div className="space-y-12 pb-24">
      {/* 1. Hero Banner Carousel */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-950 via-purple-950 to-brand-900 text-white shadow-soft-lg border border-purple-800/40">
        <div className="absolute inset-0 z-0 opacity-30 mix-blend-overlay">
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover transition-opacity duration-1000"
          />
        </div>

        <div className="relative z-10 p-6 sm:p-12 lg:p-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[460px]">
          {/* Left Content */}
          <div className="lg:col-span-8 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-pink-300 text-xs font-semibold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>{slide.badge}</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold font-sans tracking-tight text-white leading-tight">
                {slide.title}
              </h1>
              <p className="font-serif italic text-2xl sm:text-3xl lg:text-4xl text-pink-200 font-normal">
                {slide.italicTitle}
              </p>
            </div>

            <p className="text-sm sm:text-base text-purple-100/90 leading-relaxed max-w-xl font-normal">
              {slide.subtitle}
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <a
                href={slide.ctaLink}
                className="px-7 py-3.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-purple-500/25 transition active:scale-95 flex items-center gap-2"
              >
                <span>{slide.cta}</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={() => setIsLocationModalOpen(true)}
                className="px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs uppercase tracking-wider rounded-2xl backdrop-blur-md border border-white/20 transition active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>{t('hero.ctaStores')}</span>
              </button>
            </div>
          </div>

          {/* Right Featured Card Graphic */}
          <div className="hidden lg:flex lg:col-span-4 justify-center">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-white/10 backdrop-blur-md p-3 max-w-xs w-full">
              <div className="aspect-3/4 rounded-2xl overflow-hidden relative">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-slate-900/80 backdrop-blur-md text-white text-xs">
                  <p className="text-[10px] uppercase font-bold text-pink-300">{slide.tag}</p>
                  <p className="font-semibold truncate">{slide.title}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Arrows & Dots */}
        <div className="absolute bottom-4 right-6 z-20 flex items-center gap-3">
          <div className="flex gap-1.5 mr-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  currentSlide === idx ? 'w-8 bg-pink-400' : 'bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={() => setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length)}
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white transition cursor-pointer"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentSlide(prev => (prev + 1) % slides.length)}
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white transition cursor-pointer"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* 2. Row of 6 Pastel Category Tiles */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-purple-100 pb-3">
          <div>
            <h2 className="text-xl font-bold font-serif text-slate-900 tracking-tight">
              {isKn ? 'ಫ್ಯಾಷನ್ ವಿಭಾಗಗಳು' : 'Shop by Category'}
            </h2>
            <p className="text-xs text-slate-500">
              {isKn ? 'ನಿಮ್ಮ ಸಮೀಪದ ಮಳಿಗೆಯಿಂದ ತಕ್ಷಣ ಲಭ್ಯವಿರುವ ಶೈಲಿಗಳು' : 'Select a style category to explore instant delivery pieces'}
            </p>
          </div>
          <span className="text-xs text-purple-600 font-bold">
            6 Collections
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {pastelCategories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 cursor-pointer hover:shadow-soft hover:-translate-y-0.5 ${cat.bg} ${cat.border} ${
                  isSelected ? 'ring-2 ring-brand-700 shadow-md scale-[1.02]' : ''
                }`}
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div className={`p-2.5 rounded-xl bg-white/80 shadow-xs ${cat.text}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {cat.badge}
                  </span>
                </div>
                <div>
                  <p className={`text-sm font-bold truncate ${cat.text}`}>
                    {isKn ? cat.nameKn : cat.nameEn}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                    {isSelected ? 'Selected ✓' : 'Explore →'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Trust Strip */}
      <section className="bg-white rounded-2xl border border-purple-100 p-6 shadow-soft">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-purple-100">
          <div className="flex items-center gap-3.5 pt-4 sm:pt-0 sm:px-4">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 fill-amber-500" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                {isKn ? '30-ನಿಮಿಷದ ಡೆಲಿವರಿ' : 'Fast 30-Min Delivery'}
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isKn ? 'ಹತ್ತಿರದ ಮಳಿಗೆಯಿಂದ ನೇರ ಮನೆಬಾಗಿಲಿಗೆ' : 'From nearest flagship store hub'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 pt-4 sm:pt-0 sm:px-4">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                {isKn ? 'ಸುರಕ್ಷಿತ ಪಾವತಿ' : 'Secure Payments'}
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isKn ? 'ಯುಪಿಐ, ಕಾರ್ಡ್ & ನೆಟ್ ಬ್ಯಾಂಕಿಂಗ್' : '100% encrypted checkout'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 pt-4 sm:pt-0 sm:px-4">
            <div className="w-11 h-11 rounded-2xl bg-pink-50 border border-pink-200 text-pink-600 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                {isKn ? '7 ದಿನಗಳ ರಿಟರ್ನ್' : 'Easy 7-Day Returns'}
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isKn ? 'ಉಡುಪುಗಳಿಗೆ ತ್ವರಿತ ಮರುಪಾವತಿ' : 'Hassle-free pickups for clothes'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 pt-4 sm:pt-0 sm:px-4">
            <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                {isKn ? '24/7 ಬೆಂಬಲ' : '24/7 Store Support'}
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isKn ? 'ನಿಮ್ಮ ಎಲ್ಲಾ ಪ್ರಶ್ನೆಗಳಿಗೆ ನೆರವು' : 'Dedicated fashion concierge'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Search & Filters Bar */}
      <section className="space-y-4">
        <SearchBar
          query={query}
          setQuery={setQuery}
          onSearch={handleSearchTrigger}
          suggestion={suggestion}
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          minPrice={minPrice}
          setMinPrice={setMinPrice}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          city={city}
          setCity={setCity}
          instantOnly={instantOnly}
          setInstantOnly={setInstantOnly}
        />

        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span className="font-semibold text-slate-700">
            {products.length} {t('search.resultsFound')}
          </span>
          {instantOnly && (
            <span className="text-amber-800 font-bold flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              <Zap className="w-3.5 h-3.5 fill-current text-amber-600" />
              Showing 30-min express eligible styles
            </span>
          )}
        </div>
      </section>

      {/* 5. "Trending Now" Product Grid */}
      <section id="trending" className="space-y-6">
        <div className="flex items-center justify-between border-b border-purple-100 pb-3">
          <div>
            <h2 className="text-2xl font-bold font-serif text-slate-900 tracking-tight">
              {isKn ? 'ಟ್ರೆಂಡಿಂಗ್ ಫ್ಯಾಷನ್ ಸಂಗ್ರಹ' : 'Trending Now'}
            </h2>
            <p className="text-xs text-slate-500">
              {isKn ? 'ಗ್ರಾಹಕರು ಮೆಚ್ಚಿದ ಅತ್ಯುತ್ಕೃಷ್ಟ ಶೈಲಿಗಳು' : 'Our most coveted fashion pieces across watches, shoes, and apparel'}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl border border-purple-100 p-4 space-y-4 animate-pulse">
                <div className="aspect-3/4 bg-purple-50 rounded-2xl"></div>
                <div className="h-4 bg-purple-100 rounded w-3/4"></div>
                <div className="h-3 bg-purple-100 rounded w-1/2"></div>
                <div className="h-9 bg-purple-100 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-purple-100 p-8 space-y-4 shadow-soft">
            <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">{t('search.noResults')}</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              {isKn
                ? 'ಬೇರೆ ಕೀವರ್ಡ್ ಬಳಸಿ ಅಥವಾ ಫಿಲ್ಟರ್ ಮರುಹೊಂದಿಸಿ. ವಾಚ್, ಶೂ, ಕುರ್ತಾ ಹುಡುಕಿ ನೋಡಿ.'
                : 'Try searching for rose gold watch, Chelsea boots, linen shirts, handbags, or reset your filters.'}
            </p>
            <button
              onClick={() => {
                setQuery('');
                setSelectedCategory('');
                setMinPrice('');
                setMaxPrice('');
                setCity('');
                setInstantOnly(false);
                setSearchParams({});
                fetchProducts('', { category: '', minPrice: '', maxPrice: '', city: '', instantOnly: false });
              }}
              className="mt-2 px-5 py-2.5 bg-brand-900 text-white rounded-xl text-xs font-bold hover:bg-brand-800 transition cursor-pointer"
            >
              {t('search.resetFilters')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
