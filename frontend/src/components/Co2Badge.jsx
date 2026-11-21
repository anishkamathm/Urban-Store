import React from 'react';
import { useTranslation } from 'react-i18next';
import { Leaf, Info } from 'lucide-react';

export default function Co2Badge({ co2, compact = false }) {
  const { t, i18n } = useTranslation();

  if (!co2) return null;

  const co2Kg = co2.deliveryCo2Kg !== undefined ? co2.deliveryCo2Kg : 0.1;
  const savedKg = co2.savedCo2Kg !== undefined ? co2.savedCo2Kg : 0.45;
  const isKn = i18n.language === 'kn';

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
        <Leaf className="w-3 h-3 text-emerald-600 fill-emerald-500" />
        <span>{t('checkout.estimatedCo2', { co2: co2Kg })}</span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-xl p-3.5 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500 text-white rounded-lg shadow-2xs">
            <Leaf className="w-4 h-4 fill-current" />
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-950 block">{t('product.ecoImpact')}</span>
            <span className="text-[11px] text-emerald-800 font-medium">
              {t('product.co2Emissions', { co2: co2Kg })}
            </span>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/60 text-emerald-900 border border-emerald-300">
          Green Route
        </span>
      </div>

      <div className="flex items-start gap-1.5 text-[11px] text-emerald-800/90 bg-white/70 p-2 rounded-lg border border-emerald-100">
        <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
        <p>
          {isKn ? (co2.descriptionKn || t('product.co2Comparison', { saved: savedKg })) : (co2.descriptionEn || t('product.co2Comparison', { saved: savedKg }))}
        </p>
      </div>
    </div>
  );
}
