import React from 'react';
import { useTranslation } from 'react-i18next';
import { Zap, Truck } from 'lucide-react';

export default function DeliveryBadge({ badge, className = '' }) {
  const { t, i18n } = useTranslation();

  if (!badge) return null;

  const isInstant = badge.isInstant;
  const isKn = i18n.language === 'kn';
  const text = isKn ? (badge.textKn || badge.textEn) : (badge.textEn || badge.textKn);

  if (isInstant) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-900 border border-amber-200/80 shadow-2xs ${className}`}>
        <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500 shrink-0 animate-pulse" />
        <span className="truncate">{text}</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 ${className}`}>
      <Truck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
      <span className="truncate">{text || t('delivery.standardFull')}</span>
    </div>
  );
}
