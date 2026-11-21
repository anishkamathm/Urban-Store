import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { LocationProvider } from './contexts/LocationContext.jsx';
import { CartProvider } from './contexts/CartContext.jsx';
import { WishlistProvider } from './contexts/WishlistContext.jsx';
import { SseProvider } from './contexts/SseContext.jsx';

import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';

import HomePage from './pages/HomePage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import CartPage from './pages/CartPage.jsx';
import WishlistPage from './pages/WishlistPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import OrderConfirmationPage from './pages/OrderConfirmationPage.jsx';
import OrderTrackingPage from './pages/OrderTrackingPage.jsx';
import OrderHistoryPage from './pages/OrderHistoryPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';

// Admin Pages
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import AdminBillingPage from './pages/AdminBillingPage.jsx';
import AdminPurchaseHistoryPage from './pages/AdminPurchaseHistoryPage.jsx';
import AdminInventoryPage from './pages/AdminInventoryPage.jsx';
import AdminRequestsPage from './pages/AdminRequestsPage.jsx';
import AdminLostOpportunityPage from './pages/AdminLostOpportunityPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LocationProvider>
          <WishlistProvider>
            <CartProvider>
              <SseProvider>
                <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#F8F5FF] via-[#FAF5FF] to-[#FFF5F8] text-slate-800 font-sans selection:bg-brand-700 selection:text-white">
                  <Navbar />
                  <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                    <Routes>
                      {/* Customer Storefront Routes */}
                      <Route path="/" element={<HomePage />} />
                      <Route path="/product/:id" element={<ProductDetailPage />} />
                      <Route path="/cart" element={<CartPage />} />
                      <Route path="/wishlist" element={<WishlistPage />} />
                      <Route path="/checkout" element={<CheckoutPage />} />
                      <Route path="/order-confirmation/:id" element={<OrderConfirmationPage />} />
                      <Route path="/orders/track/:id" element={<OrderTrackingPage />} />
                      <Route path="/orders" element={<OrderHistoryPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />

                      {/* Admin Retail & POS Routes */}
                      <Route path="/admin" element={<AdminDashboardPage />} />
                      <Route path="/admin/billing" element={<AdminBillingPage />} />
                      <Route path="/admin/purchase-history" element={<AdminPurchaseHistoryPage />} />
                      <Route path="/admin/inventory" element={<AdminInventoryPage />} />
                      <Route path="/admin/requests" element={<AdminRequestsPage />} />
                      <Route path="/admin/lost-opportunities" element={<AdminLostOpportunityPage />} />
                      <Route path="/admin/orders" element={<AdminDashboardPage />} />
                    </Routes>
                  </main>
                  <Footer />
                </div>
              </SseProvider>
            </CartProvider>
          </WishlistProvider>
        </LocationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
