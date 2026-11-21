import { config } from '../config/env.js';

/**
 * Calculate the great-circle distance between two points on the Earth's surface
 * using the Haversine formula.
 * @returns {number} distance in kilometers
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) {
    return Infinity;
  }

  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10; // Round to 1 decimal place
}

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculate Estimated Time of Arrival (ETA) in minutes:
 * 15 minutes base preparation + 3 minutes per kilometer.
 */
export function calculateEtaMinutes(distanceKm) {
  if (!distanceKm || distanceKm === Infinity) {
    return 3 * 24 * 60; // Standard warehouse: ~3-5 days
  }
  const minutes = config.delivery.basePrepTimeMin + (distanceKm * config.delivery.minutesPerKm);
  return Math.max(15, Math.round(minutes));
}

/**
 * Calculate Delivery CO2 Emissions:
 * CO2 = distance_km * emission_factor (default 0.1 kg/km for two-wheeler/EV)
 */
export function calculateCo2Emissions(distanceKm) {
  if (!distanceKm || distanceKm === Infinity) {
    return {
      deliveryCo2Kg: 0.5,
      benchmarkCo2Kg: 2.5,
      savedCo2Kg: 2.0,
      descriptionEn: 'Standard freight delivery optimized via consolidated logistics route.',
      descriptionKn: 'ಸಂಘಟಿತ ಸರಕು ಸಾಗಣೆ ಮಾರ್ಗದ ಮೂಲಕ ಕಾರ್ಬನ್ ಉಳಿತಾಯ.'
    };
  }

  const deliveryCo2 = Math.round(distanceKm * config.delivery.emissionFactorKgPerKm * 100) / 100;
  // Typical personal round-trip car/auto trip emission (distance * 2 * 0.28 kg)
  const benchmarkCo2 = Math.round(distanceKm * 2 * config.delivery.benchmarkTripFactorKgPerKm * 100) / 100;
  const savedCo2 = Math.max(0, Math.round((benchmarkCo2 - deliveryCo2) * 100) / 100);

  return {
    deliveryCo2Kg: deliveryCo2,
    benchmarkCo2Kg: benchmarkCo2,
    savedCo2Kg: savedCo2,
    descriptionEn: `Saves ${savedCo2} kg CO2 compared to a personal round-trip drive (${benchmarkCo2} kg CO2).`,
    descriptionKn: `ವೈಯಕ್ತಿಕ ಪ್ರಯಾಣಕ್ಕೆ ಹೋಲಿಸಿದರೆ ${savedCo2} ಕೆಜಿ CO2 ಹೊರಸೂಸುವಿಕೆಯನ್ನು ಉಳಿಸುತ್ತದೆ.`
  };
}

/**
 * Find the nearest store that has sufficient stock for all requested items
 * within its delivery radius.
 *
 * @param {Array} stores - Array of store objects (with lat, lng, delivery_radius_km)
 * @param {Array} items - Array of { productId, quantity }
 * @param {Array} inventory - Array of store_inventory records { store_id, product_id, stock }
 * @param {number} customerLat
 * @param {number} customerLng
 * @returns {Object|null} { store, distanceKm, etaMinutes, co2 } or null if none eligible
 */
export function findNearestEligibleStore(stores, items, inventory, customerLat, customerLng) {
  if (!customerLat || !customerLng || !stores || stores.length === 0) {
    return null;
  }

  const eligibleCandidates = [];

  for (const store of stores) {
    const dist = calculateHaversineDistance(
      customerLat,
      customerLng,
      parseFloat(store.latitude),
      parseFloat(store.longitude)
    );

    const radius = parseFloat(store.delivery_radius_km || config.delivery.defaultRadiusKm);

    // Check if customer is within instant delivery radius
    if (dist <= radius) {
      // Check if store has enough stock for ALL items
      let hasAllStock = true;
      for (const item of items) {
        const invRecord = inventory.find(
          inv => inv.store_id === store.id && inv.product_id === item.productId
        );
        const availableStock = invRecord ? invRecord.stock : 0;
        if (availableStock < item.quantity) {
          hasAllStock = false;
          break;
        }
      }

      if (hasAllStock) {
        const eta = calculateEtaMinutes(dist);
        const co2 = calculateCo2Emissions(dist);
        eligibleCandidates.push({
          store,
          distanceKm: dist,
          etaMinutes: eta,
          co2,
        });
      }
    }
  }

  // Sort by closest distance
  eligibleCandidates.sort((a, b) => a.distanceKm - b.distanceKm);

  return eligibleCandidates.length > 0 ? eligibleCandidates[0] : null;
}
