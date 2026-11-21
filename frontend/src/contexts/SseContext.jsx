import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

const SseContext = createContext(null);

export function SseProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const listenersRef = useRef({
    inventory_changed: new Set(),
    delivery_status_changed: new Set(),
    system_activity: new Set(),
  });

  useEffect(() => {
    let eventSource = null;

    try {
      eventSource = new EventSource('/events');

      eventSource.onopen = () => {
        setIsConnected(true);
        console.log('[SSE] Connected to real-time event stream');
      };

      eventSource.addEventListener('connected', (e) => {
        setIsConnected(true);
      });

      eventSource.addEventListener('inventory_changed', (e) => {
        try {
          const data = JSON.parse(e.data);
          listenersRef.current.inventory_changed.forEach(cb => cb(data));
        } catch (err) {}
      });

      eventSource.addEventListener('delivery_status_changed', (e) => {
        try {
          const data = JSON.parse(e.data);
          listenersRef.current.delivery_status_changed.forEach(cb => cb(data));
        } catch (err) {}
      });

      eventSource.addEventListener('system_activity', (e) => {
        try {
          const data = JSON.parse(e.data);
          listenersRef.current.system_activity.forEach(cb => cb(data));
        } catch (err) {}
      });

      eventSource.onerror = (e) => {
        setIsConnected(false);
      };
    } catch (err) {
      console.warn('[SSE] EventSource init failed:', err);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  const subscribeInventory = (cb) => {
    listenersRef.current.inventory_changed.add(cb);
    return () => listenersRef.current.inventory_changed.delete(cb);
  };

  const subscribeDelivery = (cb) => {
    listenersRef.current.delivery_status_changed.add(cb);
    return () => listenersRef.current.delivery_status_changed.delete(cb);
  };

  const subscribeSystemActivity = (cb) => {
    listenersRef.current.system_activity.add(cb);
    return () => listenersRef.current.system_activity.delete(cb);
  };

  return (
    <SseContext.Provider value={{
      isConnected,
      subscribeInventory,
      subscribeDelivery,
      subscribeSystemActivity,
    }}>
      {children}
    </SseContext.Provider>
  );
}

export function useSse() {
  const context = useContext(SseContext);
  if (!context) throw new Error('useSse must be used within SseProvider');
  return context;
}
