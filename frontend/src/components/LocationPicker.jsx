import React from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Navigation, X, Check, Zap, Truck } from 'lucide-react';
import { useLocation } from '../contexts/LocationContext.jsx';

export default function LocationPicker() {
  const { t, i18n } = useTranslation();
  const {
    location,
    presets,
    isDetectingGps,
    isLocationModalOpen,
    setIsLocationModalOpen,
    updateLocation,
    detectGps,
  } = useLocation();

  if (!isLocationModalOpen) return null;

  const handleSelectPreset = (preset) => {
    updateLocation({
      id: preset.id,
      labelEn: preset.labelEn,
      labelKn: preset.labelKn,
      city: preset.city,
      lat: preset.lat,
      lng: preset.lng,
      isDemo: true,
    });
    setIsLocationModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="bg-stone-900 p-6 text-white flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-stone-800 rounded-xl text-amber-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight uppercase tracking-wider">{t('location.modalTitle')}</h3>
              <p className="text-xs text-stone-300 mt-0.5">{t('location.modalSubtitle')}</p>
            </div>
          </div>
          <button
            onClick={() => setIsLocationModalOpen(false)}
            className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* GPS Button */}
          <button
            onClick={detectGps}
            disabled={isDetectingGps}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl border-2 border-stone-900 text-stone-900 hover:bg-stone-50 font-bold text-xs uppercase tracking-wider transition shadow-2xs group cursor-pointer"
          >
            <Navigation className={`w-4 h-4 ${isDetectingGps ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}`} />
            <span>{isDetectingGps ? t('location.detecting') : t('location.useGps')}</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-stone-400">
            <div className="h-px bg-stone-200 flex-1"></div>
            <span className="font-semibold uppercase tracking-wider text-[10px]">{t('location.demoLocations')}</span>
            <div className="h-px bg-stone-200 flex-1"></div>
          </div>

          <p className="text-[11px] text-stone-500 leading-normal">
            {t('location.presetHelper')}
          </p>

          {/* Preset list */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {presets.map((preset) => {
              const isSelected = location.id === preset.id;
              const isInstant = preset.deliveryExpected === 'instant_30min';
              const label = i18n.language === 'kn' ? (preset.labelKn || preset.labelEn) : preset.labelEn;

              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`w-full flex items-start justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-stone-900 bg-stone-50 shadow-xs ring-1 ring-stone-900'
                      : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 p-1.5 rounded-lg ${isInstant ? 'bg-amber-100 text-amber-800' : 'bg-stone-200 text-stone-700'}`}>
                      {isInstant ? <Zap className="w-4 h-4 fill-current" /> : <Truck className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-900">{label}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isInstant ? 'bg-amber-100 text-amber-900' : 'bg-stone-200 text-stone-700'
                        }`}>
                          {isInstant ? '⚡ 30-min express' : '📦 3-5 days'}
                        </span>
                        <span className="text-[10px] text-stone-400 font-medium">{preset.city}</span>
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-stone-900 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
