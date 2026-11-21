import React from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Package, Bike, Home, Clock } from 'lucide-react';

const STAGES = [
  { key: 'PLACED', titleKey: 'tracking.stepper.placed', descKey: 'tracking.stepperSub.placed', icon: Clock },
  { key: 'PACKED', titleKey: 'tracking.stepper.packed', descKey: 'tracking.stepperSub.packed', icon: Package },
  { key: 'OUT_FOR_DELIVERY', titleKey: 'tracking.stepper.outForDelivery', descKey: 'tracking.stepperSub.outForDelivery', icon: Bike },
  { key: 'DELIVERED', titleKey: 'tracking.stepper.delivered', descKey: 'tracking.stepperSub.delivered', icon: Home },
];

export default function ProgressStepper({ currentStatus = 'PLACED' }) {
  const { t } = useTranslation();

  const getStageIndex = (status) => {
    switch (status) {
      case 'PLACED': return 0;
      case 'PACKED': return 1;
      case 'OUT_FOR_DELIVERY': return 2;
      case 'DELIVERED': return 3;
      default: return 0;
    }
  };

  const currentIndex = getStageIndex(currentStatus);

  return (
    <div className="w-full py-4">
      {/* Progress Bar Line */}
      <div className="relative">
        <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-stone-200 -translate-y-1/2 rounded-full -z-0">
          <div
            className="h-full bg-stone-900 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${(currentIndex / (STAGES.length - 1)) * 100}%` }}
          />
        </div>

        {/* Steps */}
        <div className="relative z-10 flex items-center justify-between">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const Icon = stage.icon;

            return (
              <div key={stage.key} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                      : isCurrent
                      ? 'bg-stone-900 text-amber-400 ring-4 ring-amber-100 shadow-stone-900/30 scale-110'
                      : 'bg-white border-2 border-stone-200 text-stone-400'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  ) : (
                    <Icon className={`w-5 h-5 ${isCurrent ? 'animate-bounce' : ''}`} />
                  )}
                </div>

                <div className="mt-3 text-center max-w-[90px] sm:max-w-[120px]">
                  <p className={`text-xs font-bold leading-tight ${isCurrent ? 'text-amber-700' : isCompleted ? 'text-stone-900' : 'text-stone-400'}`}>
                    {t(stage.titleKey)}
                  </p>
                  <p className="text-[10px] text-stone-400 hidden sm:block mt-1 leading-snug">
                    {t(stage.descKey)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
