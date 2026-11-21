import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useAuth } from './AuthContext.jsx';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  // Clear out legacy shared localStorage safely
  useEffect(() => {
    localStorage.removeItem('urban_store_wishlist');
  }, []);

  // Fetch user-specific wishlist when authenticated and not admin
  useEffect(() => {
    if (isAuthenticated && !isAdmin && user?.id) {
      setLoading(true);
      api.getWishlist()
        .then(data => {
          if (Array.isArray(data.wishlist)) {
            setWishlist(data.wishlist);
          }
        })
        .catch(err => {
          console.warn('[Wishlist] Could not fetch user wishlist:', err.message);
          setWishlist([]);
        })
        .finally(() => setLoading(false));
    } else {
      // Admin or logged out: no customer wishlist
      setWishlist([]);
    }
  }, [isAuthenticated, isAdmin, user?.id]);

  const isInWishlist = (productId) => {
    if (!isAuthenticated || isAdmin || !productId) return false;
    return wishlist.some(item => (item.product_id || item.product?.id || item.id) === productId);
  };

  const toggleWishlist = async (product) => {
    if (!isAuthenticated) {
      // Guests who aren't logged in should be asked to log in when they tap the heart
      const shouldLogin = window.confirm('Please sign in to save fashion items to your personal wishlist.');
      if (shouldLogin) {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      }
      return false;
    }

    if (isAdmin) {
      return false;
    }

    const prodId = product.id || product.product_id;
    const currentlyIn = isInWishlist(prodId);

    // Optimistic UI update (updates immediately)
    if (currentlyIn) {
      setWishlist(prev => prev.filter(i => (i.product_id || i.product?.id || i.id) !== prodId));
    } else {
      const optimisticItem = {
        id: 'temp-' + Date.now(),
        user_id: user?.id,
        product_id: prodId,
        product: product,
        created_at: new Date().toISOString()
      };
      setWishlist(prev => [optimisticItem, ...prev]);
    }

    try {
      const res = await api.toggleWishlist(prodId);
      const fresh = await api.getWishlist();
      if (Array.isArray(fresh.wishlist)) {
        setWishlist(fresh.wishlist);
      }
      return res.inWishlist;
    } catch (err) {
      console.error('[Wishlist] Toggle failed:', err);
      // Revert from backend on failure
      const fresh = await api.getWishlist().catch(() => ({ wishlist: [] }));
      if (Array.isArray(fresh.wishlist)) setWishlist(fresh.wishlist);
      return false;
    }
  };

  const removeFromWishlist = async (productId) => {
    if (!isAuthenticated || isAdmin || !productId) return;

    // Optimistic remove (instant update in UI)
    setWishlist(prev => prev.filter(i => (i.product_id || i.product?.id || i.id) !== productId));

    try {
      await api.removeFromWishlist(productId);
      const fresh = await api.getWishlist();
      if (Array.isArray(fresh.wishlist)) {
        setWishlist(fresh.wishlist);
      }
    } catch (err) {
      console.error('[Wishlist] Remove failed:', err);
      const fresh = await api.getWishlist().catch(() => ({ wishlist: [] }));
      if (Array.isArray(fresh.wishlist)) setWishlist(fresh.wishlist);
    }
  };

  return (
    <WishlistContext.Provider value={{
      wishlist,
      wishlistCount: isAdmin ? 0 : wishlist.length,
      toggleWishlist,
      isInWishlist,
      removeFromWishlist,
      loading,
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within WishlistProvider');
  return context;
}
