import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Bike, Phone, Clock, Radio, ShieldCheck, Zap } from 'lucide-react';
import { api } from '../services/api.js';
import { useSse } from '../contexts/SseContext.jsx';
import ProgressStepper from '../components/ProgressStepper.jsx';
import LiveTrackerMap from '../components/LiveTrackerMap.jsx';
import Co2Badge from '../components/Co2Badge.jsx';

export default function OrderTrackingPage() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const { subscribeDelivery } = useSse();

  const [order, setOrder] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch initial order and delivery state
  useEffect(() => {
    api.getOrder(id)
      .then(data => {
        if (data.order) {
          setOrder(data.order);
          setDelivery(data.order.delivery);
        }
      })
      .catch(err => console.error('Failed to load tracking data:', err))
      .finally(() => setLoading(false));
  }, [id, i18n.language]);

  // Subscribe to real-time delivery status updates via Server-Sent Events (SSE)
  useEffect(() => {
    const unsubscribe = subscribeDelivery((update) => {
      if (update.orderId === order?.id || update.orderId === id) {
        setOrder(prev => prev ? { ...prev, status: update.status } : prev);
        setDelivery(prev => ({
          ...prev,
          status: update.status,
          current_lat: update.currentLat !== undefined ? update.currentLat : prev?.current_lat,
          current_lng: update.currentLng !== undefined ? update.currentLng : prev?.current_lng,
          eta_minutes: update.etaMinutes !== undefined ? update.etaMinutes : prev?.eta_minutes,
          rider_name: update.riderName || prev?.rider_name,
          rider_phone: update.riderPhone || prev?.rider_phone,
        }));
      }
    });

    return () => unsubscribe();
  }, [order?.id, id, subscribeDelivery]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 space-y-6 animate-pulse">
        <div className="h-6 bg-purple-100 rounded w-32"></div>
        <div className="h-40 bg-purple-100/60 rounded-3xl"></div>
        <div className="h-64 bg-purple-100/60 rounded-3xl"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 px-4 space-y-4">
        <h2 className="text-xl font-bold font-serif text-slate-900">Tracking Information Unavailable</h2>
        <p className="text-slate-500 text-sm">Order tracking details not found.</p>
        <Link to="/orders" className="inline-block px-5 py-2.5 bg-brand-900 text-white rounded-2xl text-xs font-bold">
          &larr; View My Orders
        </Link>
      </div>
    );
  }

  const currentStatus = delivery?.status || order.status || 'PLACED';
  const etaMinutes = delivery?.eta_minutes !== undefined ? delivery.eta_minutes : order.eta_minutes;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Back to Orders */}
      <div className="flex items-center justify-between">
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-brand-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>My Orders</span>
        </Link>

        {/* Live Tracking Active Pill */}
        <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 shadow-2xs">
          <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
          <span className="font-bold">Live Real-Time Stream</span>
        </div>
      </div>

      {/* Main Tracking Card */}
      <div className="bg-white rounded-3xl border border-purple-100 shadow-soft p-6 sm:p-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-50 pb-5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Order Reference</span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
              {order.order_number}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Estimated Arrival</span>
              <span className="text-lg font-bold text-brand-900 flex items-center gap-1.5 justify-end">
                <Clock className="w-4 h-4" />
                {currentStatus === 'DELIVERED' ? 'Delivered' : `${etaMinutes} min`}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="py-2">
          <ProgressStepper currentStatus={currentStatus} />
        </div>

        {/* Live Vector Map Simulation */}
        <div>
          <LiveTrackerMap
            delivery={delivery}
            storeName={order.storeName || 'Urban Store Indiranagar'}
            customerAddress={order.delivery_address || 'Delivery Address'}
            etaMinutes={etaMinutes}
          />
        </div>

        {/* Rider Information Panel */}
        <div className="p-5 rounded-2xl border border-purple-100 bg-purple-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-brand-900 text-pink-300 flex items-center justify-center font-bold text-base shadow-xs">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                Fulfilling Courier
              </span>
              <p className="text-sm font-bold text-slate-900">
                {delivery?.rider_name || 'Assigned Courier (Urban Store Fleet)'}
              </p>
              <p className="text-xs text-slate-500">Urban Store Express EV Fleet</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`tel:${delivery?.rider_phone || '+919876543210'}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-purple-200 hover:bg-purple-50 text-brand-900 font-bold text-xs rounded-xl shadow-2xs transition cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 text-pink-500" />
              <span>{delivery?.rider_phone || '+91 98450 12345'}</span>
            </a>
          </div>
        </div>

        {/* Eco Emissions Impact */}
        <div className="pt-2">
          <Co2Badge co2={order.co2} />
        </div>
      </div>
    </div>
  );
}
