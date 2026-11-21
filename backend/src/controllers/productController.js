import { searchCatalog, getAutocompleteSuggestions, enrichProductWithDeliveryInfo, FASHION_CATEGORIES } from '../services/searchService.js';
import { query } from '../config/postgres.js';
import { mockOpenSearchIndex } from '../config/opensearch.js';
import { SEED_CATEGORIES } from '../scripts/seedData.js';

export async function getProducts(req, res) {
  try {
    const {
      q = '',
      category = '',
      min_price = null,
      max_price = null,
      city = '',
      user_lat = null,
      user_lng = null,
      instant_only = 'false',
      max_distance = null,
    } = req.query;

    const lang = req.lang || 'en';

    const results = await searchCatalog({
      q,
      lang,
      category,
      minPrice: min_price ? parseFloat(min_price) : null,
      maxPrice: max_price ? parseFloat(max_price) : null,
      city,
      userLat: user_lat ? parseFloat(user_lat) : null,
      userLng: user_lng ? parseFloat(user_lng) : null,
      instantOnly: instant_only === 'true' || instant_only === '1',
      maxDistanceKm: max_distance ? parseFloat(max_distance) : null,
    });

    res.json(results);
  } catch (err) {
    console.error('[ProductController] getProducts error:', err);
    res.status(500).json({ error: 'Failed to search product catalog', details: err.message });
  }
}

export async function getAutocomplete(req, res) {
  try {
    const { q = '' } = req.query;
    const lang = req.lang || 'en';
    const suggestions = await getAutocompleteSuggestions(q, lang);
    res.json({ suggestions });
  } catch (err) {
    res.status(500).json({ error: 'Autocomplete error' });
  }
}

export async function getProductById(req, res) {
  try {
    const rawId = req.params.id;
    if (!rawId) {
      return res.status(404).json({
        error: 'Product not found',
        errorKn: 'ಉತ್ಪನ್ನ ಕಂಡುಬಂದಿಲ್ಲ',
      });
    }
    const cleanId = decodeURIComponent(rawId).trim();
    const { user_lat = null, user_lng = null } = req.query;
    const lang = req.lang || 'en';

    // 1. Fetch from mock/opensearch index first
    let product = mockOpenSearchIndex.get(cleanId) || mockOpenSearchIndex.get(`prod-${cleanId}`);

    if (!product) {
      // Search mockOpenSearchIndex values by slug or partial id
      for (const item of mockOpenSearchIndex.values()) {
        if (item.id === cleanId || item.slug === cleanId || item.id === `prod-${cleanId}`) {
          product = item;
          break;
        }
      }
    }

    if (!product) {
      // Query PostgreSQL database by id or prefix
      const prodRes = await query(
        'SELECT * FROM products WHERE id = $1 OR id = $2',
        [cleanId, `prod-${cleanId}`]
      );
      if (prodRes.rows.length > 0) {
        product = prodRes.rows[0];
      }
    }

    if (!product || !FASHION_CATEGORIES.includes(product.category_id)) {
      return res.status(404).json({
        error: 'Product not found',
        errorKn: 'ಉತ್ಪನ್ನ ಕಂಡುಬಂದಿಲ್ಲ',
      });
    }

    // 2. Fetch latest store inventory breakdown using canonical product.id
    const invRes = await query(
      `SELECT si.store_id, si.stock, s.name as store_name, s.city, s.latitude, s.longitude, s.delivery_radius_km
       FROM store_inventory si
       JOIN stores s ON si.store_id = s.id
       WHERE si.product_id = $1`,
      [product.id]
    );

    let stores = [];
    if (invRes.rows && invRes.rows.length > 0) {
      stores = invRes.rows.map(r => ({
        store_id: r.store_id,
        store_name: r.store_name || 'Urban Store',
        city: r.city || 'Bengaluru',
        location: {
          lat: parseFloat(r.latitude) || 12.9716,
          lon: parseFloat(r.longitude) || 77.5946,
        },
        stock: parseInt(r.stock, 10) || 0,
        delivery_radius_km: parseFloat(r.delivery_radius_km || 5),
      }));
    } else if (Array.isArray(product.stores) && product.stores.length > 0) {
      stores = product.stores;
    }

    const enriched = enrichProductWithDeliveryInfo(
      { ...product, stores },
      user_lat ? parseFloat(user_lat) : null,
      user_lng ? parseFloat(user_lng) : null,
      lang
    );

    res.json({ product: enriched });
  } catch (err) {
    console.error('[ProductController] getProductById error:', err);
    res.status(500).json({ error: 'Failed to retrieve product' });
  }
}

export async function getCategories(req, res) {
  try {
    const result = await query(
      'SELECT * FROM categories WHERE id = ANY($1) ORDER BY id ASC',
      [FASHION_CATEGORIES]
    );
    if (result.rows && result.rows.length > 0) {
      return res.json({ categories: result.rows });
    }
    return res.json({ categories: SEED_CATEGORIES });
  } catch (err) {
    console.error('[ProductController] getCategories error:', err);
    res.json({ categories: SEED_CATEGORIES });
  }
}
