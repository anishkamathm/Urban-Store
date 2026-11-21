import React from 'react';
import { useTranslation } from 'react-i18next';
import { Store, MapPin, Bike, Navigation, Compass, Radio } from 'lucide-react';

export default function LiveTrackerMap({
  delivery,
  storeName = 'ShopMart Store',
  customerAddress = 'Customer Address',
  etaMinutes = 15,
}) {
  const { t } = useTranslation();

  const status = delivery?.status || 'PLACED';

  // Calculate percentage of progress along route
  let progressPercent = 0.1;
  if (status === 'PACKED') progressPercent = 0.2;
  else if (status === 'OUT_FOR_DELIVERY') progressPercent = 0.65;
  else if (status === 'DELIVERED') progressPercent = 1.0;

  // Visual SVG coordinates (Store at x=60, y=140; Customer at x=340, y=60)
  const startX = 60;
  const startY = 140;
  const endX = 340;
  const endY = 60;

  const currentX = startX + (endX - startX) * progressPercent;
  const currentY = startY + (endY - startY) * progressPercent;

  return (
    <div className="bg-slate-900 text-white rounded-2xl overflow-hidden border border-slate-800 shadow-xl relative">
      {/* Map Header Overlay */}
      <div className="p-4 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-600/30 text-blue-400 rounded-lg border border-blue-500/30">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white tracking-wide">{t('tracking.liveMap')}</h4>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 mt-0.5">
              <Radio className="w-3 h-3 animate-pulse" />
              <span>{t('tracking.sseActive')}</span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">ETA</span>
          <span className="text-sm font-extrabold text-amber-400">
            {status === 'DELIVERED' ? 'Arrived!' : `${etaMinutes} mins`}
          </span>
        </div>
      </div>

      {/* Interactive Vector Route Map Canvas */}
      <div className="relative h-64 sm:h-72 w-full bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] bg-slate-900 flex items-center justify-center overflow-hidden">
        {/* Subtle grid roads */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
          <line x1="0" y1="80" x2="400" y2="80" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="0" y1="180" x2="400" y2="180" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="120" y1="0" x2="120" y2="240" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="260" y1="0" x2="260" y2="240" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 4" />
        </svg>

        {/* Dynamic Route SVG */}
        <svg viewBox="0 0 400 200" className="w-full h-full z-10">
          <defs>
            <linearGradient id="routeGradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Background Path Track */}
          <path
            d={`M ${startX} ${startY} Q 180 180, 220 120 T ${endX} ${endY}`}
            fill="none"
            stroke="#334155"
            strokeWidth="6"
            strokeLinecap="round"
          />

          {/* Active Highlighted Route with Pulse */}
          <path
            d={`M ${startX} ${startY} Q 180 180, 220 120 T ${endX} ${endY}`}
            fill="none"
            stroke="url(#routeGradient)"
            strokeWidth="4"
            strokeDasharray="6 3"
            strokeLinecap="round"
            className="animate-pulse"
          />

          {/* Store Pin (Origin) */}
          <g transform={`translate(${startX}, ${startY})`}>
            <circle r="16" fill="#1e3a8a" fillOpacity="0.6" className="animate-ping" />
            <circle r="12" fill="#2563eb" />
            <circle r="5" fill="#ffffff" />
          </g>

          {/* Customer House Pin (Destination) */}
          <g transform={`translate(${endX}, ${endY})`}>
            <circle r="16" fill="#065f46" fillOpacity="0.6" className="animate-ping" />
            <circle r="12" fill="#059669" />
            <circle r="5" fill="#ffffff" />
          </g>

          {/* Live Animated Rider Vehicle */}
          <g
            transform={`translate(${currentX}, ${currentY})`}
            className="transition-all duration-1000 ease-in-out"
          >
            <circle r="20" fill="#f59e0b" fillOpacity="0.3" className="animate-ping" />
            <circle r="14" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" filter="url(#glow)" />
          </g>
        </svg>

        {/* DOM Tooltip / Label Overlay */}
        <div className="absolute bottom-3 left-4 bg-slate-950/90 border border-slate-700/80 px-3 py-2 rounded-xl text-[11px] shadow-lg flex items-center gap-2">
          <Store className="w-3.5 h-3.5 text-blue-400" />
          <div>
            <span className="text-slate-400 block text-[9px] uppercase font-bold">Store Origin</span>
            <span className="font-semibold text-slate-200">{storeName}</span>
          </div>
        </div>

        <div className="absolute top-3 right-4 bg-slate-950/90 border border-slate-700/80 px-3 py-2 rounded-xl text-[11px] shadow-lg flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          <div>
            <span className="text-slate-400 block text-[9px] uppercase font-bold">Destination</span>
            <span className="font-semibold text-slate-200 truncate max-w-[140px] block">{customerAddress}</span>
          </div>
        </div>

        {/* Live Rider Badge Floating */}
        <div
          className="absolute z-20 pointer-events-none transition-all duration-1000 ease-in-out"
          style={{
            left: `${(progressPercent * 70) + 15}%`,
            top: `${(progressPercent * -20) + 55}%`,
          }}
        >
          <div className="bg-amber-500 text-slate-950 px-2.5 py-1 rounded-full text-[10px] font-black flex items-center gap-1.5 shadow-xl border-2 border-white -translate-x-1/2 -translate-y-8 animate-bounce">
            <Bike className="w-3 h-3 stroke-[3]" />
            <span>{delivery?.rider_name || 'Rider'}</span>
          </div>
        </div>
      </div>

      {/* Map Footer Details */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-slate-300">
            {status === 'DELIVERED'
              ? 'Package delivered safely'
              : status === 'OUT_FOR_DELIVERY'
              ? 'Rider moving towards destination via EV bike'
              : 'Partner packaging items with eco bags'}
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-500">
          GPS: {delivery?.current_lat ? `${Number(delivery.current_lat).toFixed(4)}, ${Number(delivery.current_lng).toFixed(4)}` : '12.9719, 77.6412'}
        </span>
      </div>
    </div>
  );
}
