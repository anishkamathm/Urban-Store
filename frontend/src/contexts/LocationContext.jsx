import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';

const DEFAULT_LOCATION = {
  id: 'demo-indiranagar',
  labelEn: 'Indiranagar 100ft Rd, Bengaluru (1.2 km)',
  labelKn: 'ಇಂದಿರಾನಗರ 100 ಅಡಿ ರಸ್ತೆ, ಬೆಂಗಳೂರು (1.2 ಕಿ.ಮೀ.)',
  city: 'Bengaluru',
  lat: 12.9719,
  lng: 77.6412,
  isDemo: true,
};

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [location, setLocation] = useState(() => {
    const saved = sessionStorage.getItem('shopmart_location');
    return saved ? JSON.parse(saved) : DEFAULT_LOCATION;
  });

  const [presets, setPresets] = useState([]);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  useEffect(() => {
    api.getDemoLocations()
      .then(data => {
        if (data.presets) setPresets(data.presets);
      })
      .catch(() => {});
  }, []);

  const updateLocation = (newLoc) => {
    setLocation(newLoc);
    sessionStorage.setItem('shopmart_location', JSON.stringify(newLoc));
  };

  const detectGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const customLoc = {
          id: 'custom-gps',
          labelEn: `Current GPS (${position.coords.latitude.toFixed(3)}, ${position.coords.longitude.toFixed(3)})`,
          labelKn: `ಪ್ರಸ್ತುತ ಜಿಪಿಎಸ್ (${position.coords.latitude.toFixed(3)}, ${position.coords.longitude.toFixed(3)})`,
          city: 'Current Location',
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          isDemo: false,
        };
        updateLocation(customLoc);
        setIsDetectingGps(false);
        setIsLocationModalOpen(false);
      },
      (error) => {
        console.warn('GPS error:', error.message);
        setIsDetectingGps(false);
        alert('Could not access device GPS. Please choose a demo preset location.');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  return (
    <LocationContext.Provider value={{
      location,
      presets,
      isDetectingGps,
      isLocationModalOpen,
      setIsLocationModalOpen,
      updateLocation,
      detectGps,
    }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) throw new Error('useLocation must be used within LocationProvider');
  return context;
}
