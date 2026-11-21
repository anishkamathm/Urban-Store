import { query } from '../config/postgres.js';

export async function getStores(req, res) {
  try {
    const result = await query('SELECT * FROM stores ORDER BY city ASC, name ASC');
    res.json({ stores: result.rows });
  } catch (err) {
    console.error('[StoreController] getStores error:', err);
    res.status(500).json({ error: 'Failed to retrieve stores' });
  }
}

export async function getDemoLocations(req, res) {
  // Preset points near each store + one distant location for fallback standard delivery testing
  const presets = [
    {
      id: 'demo-indiranagar',
      labelEn: 'Indiranagar 100ft Rd (1.2 km from Indiranagar Store)',
      labelKn: 'ಇಂದಿರಾನಗರ 100 ಅಡಿ ರಸ್ತೆ (ಇಂದಿರಾನಗರ ಮಳಿಗೆಯಿಂದ 1.2 ಕಿ.ಮೀ.)',
      city: 'Bengaluru',
      lat: 12.9719,
      lng: 77.6412,
      targetStore: 'ShopMart Indiranagar',
      deliveryExpected: 'instant_30min',
    },
    {
      id: 'demo-koramangala',
      labelEn: 'Koramangala 5th Block (0.8 km from Koramangala Store)',
      labelKn: 'ಕೋರಮಂಗಲ 5 ನೇ ಬ್ಲಾಕ್ (ಕೋರಮಂಗಲ ಮಳಿಗೆಯಿಂದ 0.8 ಕಿ.ಮೀ.)',
      city: 'Bengaluru',
      lat: 12.9348,
      lng: 77.6200,
      targetStore: 'ShopMart Koramangala',
      deliveryExpected: 'instant_30min',
    },
    {
      id: 'demo-malleshwaram',
      labelEn: 'Malleshwaram 8th Cross (1.5 km from Malleshwaram Store)',
      labelKn: 'ಮಲ್ಲೇಶ್ವರಂ 8 ನೇ ಕ್ರಾಸ್ (ಮಲ್ಲೇಶ್ವರಂ ಮಳಿಗೆಯಿಂದ 1.5 ಕಿ.ಮೀ.)',
      city: 'Bengaluru',
      lat: 13.0035,
      lng: 77.5702,
      targetStore: 'ShopMart Malleshwaram',
      deliveryExpected: 'instant_30min',
    },
    {
      id: 'demo-jayanagar',
      labelEn: 'Jayanagar 4th Block (1.1 km from Jayanagar Store)',
      labelKn: 'ಜಯನಗರ 4 ನೇ ಬ್ಲಾಕ್ (ಜಯನಗರ ಮಳಿಗೆಯಿಂದ 1.1 ಕಿ.ಮೀ.)',
      city: 'Bengaluru',
      lat: 12.9298,
      lng: 77.5855,
      targetStore: 'ShopMart Jayanagar',
      deliveryExpected: 'instant_30min',
    },
    {
      id: 'demo-whitefield',
      labelEn: 'Whitefield ITPL (2.2 km from Whitefield Store)',
      labelKn: 'ವೈಟ್‌ಫೀಲ್ಡ್ ಐಟಿಪಿಎಲ್ (ವೈಟ್‌ಫೀಲ್ಡ್ ಮಳಿಗೆಯಿಂದ 2.2 ಕಿ.ಮೀ.)',
      city: 'Bengaluru',
      lat: 12.9850,
      lng: 77.7380,
      targetStore: 'ShopMart Whitefield',
      deliveryExpected: 'instant_30min',
    },
    {
      id: 'demo-mysuru',
      labelEn: 'Mysuru Saraswathipuram (1.8 km from Mysuru Store)',
      labelKn: 'ಮೈಸೂರು ಸರಸ್ವತಿಪುರಂ (ಮೈಸೂರು ಮಳಿಗೆಯಿಂದ 1.8 ಕಿ.ಮೀ.)',
      city: 'Mysuru',
      lat: 12.2980,
      lng: 76.6350,
      targetStore: 'ShopMart Mysuru Kuvempunagar',
      deliveryExpected: 'instant_30min',
    },
    {
      id: 'demo-remote',
      labelEn: 'Outskirts / Rural Highway (25 km away - Standard 3-5 days delivery)',
      labelKn: 'ಗ್ರಾಮೀಣ ಹೆದ್ದಾರಿ / ದೂರದ ಪ್ರದೇಶ (25 ಕಿ.ಮೀ. - ಪ್ರಮಾಣಿತ 3-5 ದಿನಗಳ ವಿತರಣೆ)',
      city: 'Bengaluru Outskirts',
      lat: 12.8000,
      lng: 77.7000,
      targetStore: null,
      deliveryExpected: 'standard_warehouse',
    }
  ];

  res.json({ presets });
}
