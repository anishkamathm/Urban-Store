import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from '../services/api.js';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('urban_store_cart') || localStorage.getItem('shopmart_guest_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);

  // Silent reservation state for last-unit items (NO visible timer/countdown)
  const [hasReservedItem, setHasReservedItem] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [reminderMessage, setReminderMessage] = useState('');

  const reminderDismissedRef = useRef(false);
  const silentTimerRef = useRef(null);

  // Clean out legacy cart expiry
  useEffect(() => {
    localStorage.removeItem('urban_store_cart_expiry');
  }, []);

  // Sync cart and reservation status from server
  const processServerReservation = (resData) => {
    if (!resData) {
      setHasReservedItem(false);
      setShowReminder(false);
      setIsExpired(false);
      return;
    }

    if (resData.hasReservedItem) {
      setHasReservedItem(true);

      if (resData.isExpired || resData.status === 'EXPIRED') {
        setIsExpired(true);
        setShowReminder(false);
        setReminderMessage(resData.message || 'The hold on the last available item has expired.');
      } else if (resData.active) {
        setIsExpired(false);
        const sec = resData.secondsRemaining || 0;

        // If at or past 8-minute mark (<= 120s remaining)
        if (sec <= 120 && sec > 0 && !reminderDismissedRef.current) {
          setShowReminder(true);
          setReminderMessage('Complete your payment to secure the last available unit in your bag.');
        }

        // Setup silent internal timer for 8-min reminder and 10-min release
        if (silentTimerRef.current) clearInterval(silentTimerRef.current);
        let rem = sec;
        silentTimerRef.current = setInterval(() => {
          rem -= 1;
          if (rem <= 120 && rem > 0 && !reminderDismissedRef.current) {
            setShowReminder(true);
            setReminderMessage('Complete your payment to secure the last available unit in your bag.');
          }
          if (rem <= 0) {
            clearInterval(silentTimerRef.current);
            setIsExpired(true);
            setShowReminder(false);
            setReminderMessage('Your reservation on the last unit has expired.');
            // Re-fetch cart quietly to sync status
            if (isAuthenticated) {
              api.getCart().catch(() => {});
            }
          }
        }, 1000);
      }
    } else {
      setHasReservedItem(false);
      setShowReminder(false);
      setIsExpired(false);
      if (silentTimerRef.current) clearInterval(silentTimerRef.current);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      api.getCart()
        .then(data => {
          if (data && Array.isArray(data.items)) {
            setItems(data.items);
            processServerReservation(data.reservation);
          }
        })
        .catch(err => console.warn('Could not fetch server cart:', err))
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated]);

  // Persist items locally
  useEffect(() => {
    localStorage.setItem('urban_store_cart', JSON.stringify(items));
    if (items.length === 0) {
      setHasReservedItem(false);
      setShowReminder(false);
      setIsExpired(false);
      reminderDismissedRef.current = false;
      if (silentTimerRef.current) clearInterval(silentTimerRef.current);
    }
  }, [items]);

  const dismissReminder = () => {
    setShowReminder(false);
    reminderDismissedRef.current = true;
  };

  const addToCart = async (product, quantity = 1, size = 'M') => {
    const qty = parseInt(quantity, 10) || 1;
    const prodId = product.id || product.product_id;

    // Optimistic local update
    setItems(prev => {
      const idx = prev.findIndex(i => (i.product_id || i.product?.id) === prodId);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          quantity: copy[idx].quantity + qty,
          size: size || copy[idx].size || 'M',
        };
        return copy;
      }
      return [
        ...prev,
        {
          id: `item-${prodId}`,
          product_id: prodId,
          quantity: qty,
          size: size || 'M',
          product: {
            id: product.id,
            name_en: product.name_en,
            name_kn: product.name_kn,
            price: parseFloat(product.price),
            image_url: product.image_url,
            category_id: product.category_id,
            category: product.category,
            central_stock: product.central_stock,
          }
        }
      ];
    });

    if (isAuthenticated) {
      try {
        const data = await api.addToCart(prodId, qty, size);
        if (data && Array.isArray(data.items)) {
          setItems(data.items);
          processServerReservation(data.reservation);
        }
      } catch (err) {
        console.error('Failed to add to cart on server:', err);
      }
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    const qty = parseInt(newQuantity, 10);

    if (qty <= 0) {
      return removeFromCart(productId);
    }

    setItems(prev => prev.map(item => {
      const pId = item.product_id || item.product?.id;
      if (pId === productId) {
        return { ...item, quantity: qty };
      }
      return item;
    }));

    if (isAuthenticated) {
      try {
        const data = await api.updateCartItem(productId, qty);
        if (data && Array.isArray(data.items)) {
          setItems(data.items);
          processServerReservation(data.reservation);
        }
      } catch (err) {
        console.error('Failed to update cart item on server:', err);
      }
    }
  };

  const removeFromCart = async (productId) => {
    setItems(prev => prev.filter(item => (item.product_id || item.product?.id) !== productId));

    if (isAuthenticated) {
      try {
        const data = await api.removeFromCart(productId);
        if (data && Array.isArray(data.items)) {
          setItems(data.items);
          processServerReservation(data.reservation);
        }
      } catch (err) {
        console.error('Failed to remove from cart on server:', err);
      }
    }
  };

  const clearCart = async () => {
    setItems([]);
    setHasReservedItem(false);
    setShowReminder(false);
    setIsExpired(false);
    reminderDismissedRef.current = false;
    if (silentTimerRef.current) clearInterval(silentTimerRef.current);
    localStorage.removeItem('urban_store_cart');

    if (isAuthenticated) {
      try {
        await api.clearCart();
      } catch (err) {
        console.error('Failed to clear cart on server:', err);
      }
    }
  };

  const itemCount = items.reduce((sum, item) => sum + (parseInt(item.quantity, 10) || 0), 0);
  const subtotal = items.reduce((sum, item) => sum + ((parseFloat(item.product?.price) || 0) * (parseInt(item.quantity, 10) || 0)), 0);

  return (
    <CartContext.Provider value={{
      items,
      itemCount,
      subtotal: Math.round(subtotal * 100) / 100,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      loading,
      // Quiet Last-Unit Reservation State (NO visible countdown numbers)
      hasReservedItem,
      showReminder,
      isExpired,
      reminderMessage,
      dismissReminder,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
