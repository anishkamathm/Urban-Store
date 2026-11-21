import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { useSse } from '../contexts/SseContext.jsx';

export default function StockBadge({ productId, initialStock = 10, isLive = true }) {
  const { t } = useTranslation();
  const { subscribeInventory } = useSse();
  const [stock, setStock] = useState(initialStock);
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    setStock(initialStock);
  }, [initialStock]);

  useEffect(() => {
    if (!isLive) return;

    // Listen to Kafka inventory.changed events broadcasted via SSE
    const unsubscribe = subscribeInventory((data) => {
      if (data.productId === productId) {
        setStock(data.totalStock !== undefined ? data.totalStock : data.stock);
        setIsPulsing(true);
        setTimeout(() => setIsPulsing(false), 2000);
      }
    });

    return () => unsubscribe();
  }, [productId, isLive, subscribeInventory]);

  if (stock <= 0) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200 transition-all ${isPulsing ? 'scale-110 ring-2 ring-red-400' : ''}`}>
        <AlertCircle className="w-3 h-3" />
        {t('product.outOfStock')}
      </span>
    );
  }

  if (stock <= 5) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 transition-all ${isPulsing ? 'scale-110 ring-2 ring-amber-400 animate-pulse' : 'animate-pulse'}`}>
        <Clock className="w-3 h-3 text-amber-600" />
        {t('product.onlyLeft', { count: stock })}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 transition-all ${isPulsing ? 'scale-110 ring-2 ring-emerald-400' : ''}`}>
      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
      {t('product.inStock')}
    </span>
  );
}
