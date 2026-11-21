import React, { useState } from 'react';
import { Link, useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShoppingBag,
  Heart,
  MapPin,
  User,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  Zap,
  Sparkles,
  Search,
  Clock,
  Layers,
  FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCart } from '../contexts/CartContext.jsx';
import { useWishlist } from '../contexts/WishlistContext.jsx';
import { useLocation } from '../contexts/LocationContext.jsx';
import LocationPicker from './LocationPicker.jsx';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, isAdmin, logout, setPreferredLanguage } = useAuth();
  const { itemCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { location, setIsLocationModalOpen } = useLocation();
  const routerLocation = useRouterLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchNavInput, setSearchNavInput] = useState('');

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'kn' ? 'en' : 'kn';
    setPreferredLanguage(nextLang);
  };

  const currentLangLabel = i18n.language === 'kn' ? 'ಕನ್ನಡ' : 'EN';
  const locationLabel = i18n.language === 'kn' ? (location.labelKn || location.labelEn) : location.labelEn;

  const handleNavSearch = (e) => {
    e.preventDefault();
    if (searchNavInput.trim()) {
      navigate(`/?q=${encodeURIComponent(searchNavInput.trim())}`);
    }
  };

  const navPills = [
    { key: 'home', path: '/', label: t('nav.home') },
    { key: 'clothes', path: '/?category=cat-clothes', label: t('nav.clothes') },
    { key: 'shoes', path: '/?category=cat-shoes', label: t('nav.shoes') },
    { key: 'watches', path: '/?category=cat-watches', label: t('nav.watches') },
    { key: 'handbags', path: '/?category=cat-handbags', label: t('nav.handbags') },
    { key: 'wallets', path: '/?category=cat-wallets', label: t('nav.wallets') },
    { key: 'new', path: '/?sort=new', label: t('nav.newArrivals') },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-purple-100 shadow-xs transition-all">
        {/* Top Marquee Strip */}
        <div className="bg-gradient-to-r from-brand-950 via-brand-900 to-purple-900 text-purple-100 text-[11px] font-medium py-1.5 px-4 tracking-wide border-b border-purple-800">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2 truncate">
              <span className="flex h-2 w-2 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-400"></span>
              </span>
              <span className="truncate font-normal text-purple-200">
                {t('topBanner.announcement')}
              </span>
            </div>

            <div className="hidden md:flex items-center space-x-5 text-purple-300 text-[11px] shrink-0">
              <button
                onClick={() => setIsLocationModalOpen(true)}
                className="hover:text-white transition flex items-center gap-1 cursor-pointer"
              >
                <MapPin className="w-3 h-3 text-pink-400" />
                <span>{t('topBanner.stores')}</span>
              </button>
              <span className="text-purple-700">|</span>
              <span className="text-purple-200 font-medium">
                {locationLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Main Brand & Action Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-700 hover:text-brand-900 focus:outline-hidden"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Brand Logo & Tagline */}
            <Link to="/" className="flex flex-col group shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-700 to-brand-900 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5 text-pink-300 fill-pink-300" />
                </div>
                <div>
                  <span className="font-serif tracking-wider text-2xl font-bold text-slate-900 group-hover:text-brand-800 transition-colors">
                    URBAN STORE
                  </span>
                  <p className="text-[10px] tracking-widest uppercase font-medium text-purple-600">
                    Fashion • Style • Everyday
                  </p>
                </div>
              </div>
            </Link>

            {/* Wide Rounded Search Bar */}
            <form onSubmit={handleNavSearch} className="hidden md:flex flex-1 max-w-xl mx-4">
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchNavInput}
                  onChange={(e) => setSearchNavInput(e.target.value)}
                  placeholder={t('search.placeholder')}
                  className="w-full pl-10 pr-10 py-2.5 rounded-full border border-purple-200 bg-purple-50/50 focus:bg-white focus:border-brand-600 focus:ring-2 focus:ring-purple-200 text-sm text-slate-800 placeholder-slate-400 transition outline-none"
                />
                <Search className="w-4 h-4 text-purple-500 absolute left-3.5 top-3.5 pointer-events-none" />
                {searchNavInput && (
                  <button
                    type="button"
                    onClick={() => setSearchNavInput('')}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>

            {/* Right Action Icons & Controls */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Language Selector */}
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-purple-200 bg-purple-50 hover:bg-purple-100 text-xs font-semibold text-brand-900 transition cursor-pointer"
                title="Switch Language"
              >
                <span>{currentLangLabel}</span>
              </button>

              {/* Wishlist Button (Per-user, hidden for Admin) */}
              {!isAdmin && (
                <Link
                  to="/wishlist"
                  className="relative p-2.5 text-slate-700 hover:text-brand-700 hover:bg-purple-50 rounded-full transition cursor-pointer"
                  title={t('nav.wishlist')}
                >
                  <Heart className={`w-5 h-5 ${wishlistCount > 0 ? 'text-pink-600 fill-pink-500' : ''}`} />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-pink-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Shopping Bag Button (Silent Last-Unit Reservation, No Visible Countdown) */}
              <Link
                to="/cart"
                className="relative flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 text-brand-900 bg-purple-100/70 hover:bg-purple-200/80 rounded-full transition cursor-pointer"
                title={t('nav.cart')}
              >
                <div className="relative">
                  <ShoppingBag className="w-5 h-5 text-brand-800" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-brand-700 text-white text-[10px] font-bold flex items-center justify-center px-1 ring-2 ring-white">
                      {itemCount}
                    </span>
                  )}
                </div>
              </Link>

              {/* Account Dropdown */}
              <div className="relative">
                {isAuthenticated ? (
                  <div className="relative">
                    <button
                      onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                      className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-full border border-purple-200 bg-white hover:border-purple-400 transition"
                    >
                      <div className="w-7 h-7 rounded-full bg-brand-700 text-white text-xs font-bold flex items-center justify-center">
                        {user.name ? user.name[0].toUpperCase() : 'U'}
                      </div>
                      <span className="hidden sm:inline text-xs font-medium text-slate-800 truncate max-w-[90px]">
                        {user.name}
                      </span>
                    </button>

                    {userDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-xl border border-purple-100 py-2 z-50 animate-scaleIn">
                        <div className="px-4 py-2 border-b border-slate-100">
                          <p className="text-xs text-slate-500 font-normal">Signed in as</p>
                          <p className="text-sm font-semibold text-slate-900 truncate">{user.email}</p>
                          {isAdmin && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold bg-purple-100 text-brand-800 rounded-full">
                              Admin
                            </span>
                          )}
                        </div>

                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-brand-900 hover:bg-purple-50 font-medium"
                          >
                            <ShieldCheck className="w-4 h-4 text-brand-600" />
                            {t('nav.admin')}
                          </Link>
                        )}

                        <Link
                          to="/orders"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <FileText className="w-4 h-4 text-slate-400" />
                          {t('nav.orders')}
                        </Link>

                        <button
                          onClick={() => {
                            logout();
                            setUserDropdownOpen(false);
                            navigate('/');
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50"
                        >
                          <LogOut className="w-4 h-4" />
                          {t('nav.logout')}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-900 hover:bg-brand-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>{t('nav.login')}</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pill Navigation Row: Home, Men, Women, Footwear, Accessories, New Arrivals, Offers */}
        <nav className="border-t border-purple-100 bg-white/70 backdrop-blur-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 py-2 overflow-x-auto no-scrollbar">
              {navPills.map((pill) => {
                const isActive = routerLocation.pathname + routerLocation.search === pill.path ||
                  (pill.path === '/' && routerLocation.pathname === '/' && !routerLocation.search);
                return (
                  <Link
                    key={pill.key}
                    to={pill.path}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-brand-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-brand-900 hover:bg-purple-100/60'
                    }`}
                  >
                    {pill.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-purple-100 bg-white px-4 pt-3 pb-6 space-y-3">
            <form onSubmit={handleNavSearch} className="relative w-full mb-3">
              <input
                type="text"
                value={searchNavInput}
                onChange={(e) => setSearchNavInput(e.target.value)}
                placeholder={t('search.placeholder')}
                className="w-full pl-9 pr-8 py-2 rounded-full border border-purple-200 text-xs"
              />
              <Search className="w-4 h-4 text-purple-400 absolute left-3 top-2.5" />
            </form>

            <div className="grid grid-cols-2 gap-2">
              {navPills.map((pill) => (
                <Link
                  key={pill.key}
                  to={pill.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-slate-700 bg-purple-50/60 hover:bg-purple-100"
                >
                  {pill.label}
                </Link>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <button
                onClick={() => {
                  setIsLocationModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-1.5 text-brand-800 font-medium"
              >
                <MapPin className="w-3.5 h-3.5 text-pink-500" />
                <span>{locationLabel}</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Location Picker Modal */}
      <LocationPicker />
    </>
  );
}
