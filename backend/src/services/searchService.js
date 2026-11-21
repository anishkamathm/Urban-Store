import { getOpenSearchClient, isLiveOpenSearch, mockOpenSearchIndex } from '../config/opensearch.js';
import { config } from '../config/env.js';
import { activityLogger } from './activityLogger.js';
import { calculateHaversineDistance, calculateEtaMinutes } from './locationService.js';
import { publishSearchEvent } from './kafkaProducer.js';

// Official Urban Store Fashion Categories
export const FASHION_CATEGORIES = [
  'cat-watches',
  'cat-shoes',
  'cat-clothes',
  'cat-handbags',
  'cat-wallets',
  'cat-accessories'
];

// Common synonyms & typo dictionary for Urban Store fashion items
const SUGGESTION_MAP = {
  'wach': 'watch',
  'watche': 'watch',
  'waches': 'watches',
  'shoos': 'shoes',
  'shoo': 'shoes',
  'sneekers': 'sneakers',
  'sneeker': 'sneakers',
  'botes': 'boots',
  'boot': 'boots',
  'handbeg': 'handbag',
  'beg': 'bag',
  'walet': 'wallet',
  'wallets': 'wallet',
  'purs': 'purse',
  'purse': 'purse',
  'backpak': 'backpack',
  'shrt': 'shirt',
  'shart': 'shirt',
  'jeens': 'jeans',
  'jens': 'jeans',
  'pents': 'pants',
  'pant': 'pants',
  'trousr': 'trousers',
  'kurtha': 'kurta',
  'jaket': 'jacket',
  'blazr': 'blazer',
  'linin': 'linen',
  'denm': 'denim',
  'ವಾಚ': 'ವಾಚ್',
  'ಶೂ': 'ಶೂಗಳು',
  'ಬ್ಯಾಗ': 'ಬ್ಯಾಗ್',
  'ವಾಲೆಟ': 'ವಾಲೆಟ್',
  'ಶರ್ಟ': 'ಶರ್ಟ್',
  'ಜೀನಸ': 'ಜೀನ್ಸ್',
};

/**
 * Perform bilingual, fuzzy, geo-aware search using Aiven OpenSearch (or fallback engine)
 */
export async function searchCatalog({
  q = '',
  lang = 'en',
  category = '',
  minPrice = null,
  maxPrice = null,
  city = '',
  userLat = null,
  userLng = null,
  instantOnly = false,
  maxDistanceKm = null,
}) {
  const startTime = Date.now();
  const rawQuery = (q || '').trim();
  const client = getOpenSearchClient();
  const isAiven = isLiveOpenSearch() && client !== null;

  // Build OpenSearch DSL Query
  const mustClauses = [];
  const filterClauses = [];

  // 1. Text Query (Bilingual + Fuzzy for English + Aliases for Kannada)
  if (rawQuery) {
    mustClauses.push({
      bool: {
        should: [
          // English name with fuzziness (auto:1,2 for typo tolerance)
          {
            match: {
              name_en: {
                query: rawQuery,
                fuzziness: 'AUTO',
                prefix_length: 1,
                boost: 3.0,
              }
            }
          },
          // Kannada name (exact & prefix match)
          {
            match: {
              name_kn: {
                query: rawQuery,
                boost: 3.0,
              }
            }
          },
          // Autocomplete ngram match
          {
            match: {
              'name_en.autocomplete': {
                query: rawQuery,
                boost: 1.5,
              }
            }
          },
          // Keywords (contains Kannada transliterations, aliases, and English tags)
          {
            match: {
              keywords: {
                query: rawQuery,
                boost: 2.0,
              }
            }
          },
          // English description fuzzy
          {
            match: {
              description_en: {
                query: rawQuery,
                fuzziness: 'AUTO',
                boost: 1.0,
              }
            }
          },
          // Kannada description
          {
            match: {
              description_kn: {
                query: rawQuery,
                boost: 1.0,
              }
            }
          }
        ],
        minimum_should_match: 1,
      }
    });
  } else {
    mustClauses.push({ match_all: {} });
  }

  // 2. Category Filter (Strictly restricted to fashion categories to eliminate legacy grocery items)
  if (category) {
    filterClauses.push({
      term: { category_id: category }
    });
  } else {
    filterClauses.push({
      terms: { category_id: FASHION_CATEGORIES }
    });
  }

  // 3. Price Range Filter
  if (minPrice !== null || maxPrice !== null) {
    const range = {};
    if (minPrice !== null) range.gte = parseFloat(minPrice);
    if (maxPrice !== null) range.lte = parseFloat(maxPrice);
    filterClauses.push({ range: { price: range } });
  }

  // 4. Geo-Distance / Instant Delivery Filter
  if (userLat !== null && userLng !== null && (instantOnly || maxDistanceKm)) {
    const distLimit = maxDistanceKm ? `${maxDistanceKm}km` : `${config.delivery.defaultRadiusKm}km`;

    filterClauses.push({
      nested: {
        path: 'stores',
        query: {
          bool: {
            must: [
              { range: { 'stores.stock': { gt: 0 } } },
              {
                geo_distance: {
                  distance: distLimit,
                  'stores.location': {
                    lat: parseFloat(userLat),
                    lon: parseFloat(userLng),
                  }
                }
              }
            ]
          }
        }
      }
    });
  }

  // 5. City Filter
  if (city) {
    filterClauses.push({
      nested: {
        path: 'stores',
        query: {
          term: { 'stores.city': city }
        }
      }
    });
  }

  const queryDsl = {
    size: 100, // Return all matching items instead of default 10
    query: {
      bool: {
        must: mustClauses,
        filter: filterClauses,
      }
    },
    suggest: rawQuery ? {
      text_phrase_suggest: {
        text: rawQuery,
        phrase: {
          field: 'name_en',
          size: 1,
          real_word_error_likelihood: 0.95,
          max_errors: 2,
        }
      }
    } : undefined
  };

  let products = [];
  let suggestion = null;

  // Execute on Aiven OpenSearch or Fallback Engine
  const FASHION_CAT_SET = new Set(FASHION_CATEGORIES);
  if (isAiven) {
    try {
      const response = await client.search({
        index: config.opensearch.index,
        body: queryDsl,
      });

      const hits = response.body.hits?.hits || [];
      products = hits
        .map(hit => ({
          ...hit._source,
          score: hit._score,
        }))
        .filter(p => FASHION_CAT_SET.has(p.category_id));

      // Extract suggestion if available
      const suggestOptions = response.body.suggest?.text_phrase_suggest?.[0]?.options || [];
      if (suggestOptions.length > 0 && suggestOptions[0].text !== rawQuery.toLowerCase()) {
        suggestion = suggestOptions[0].text;
      }
    } catch (err) {
      console.warn('[OpenSearch] Query error, using fallback:', err.message);
      products = fallbackSearch(rawQuery, category, minPrice, maxPrice, userLat, userLng, instantOnly, maxDistanceKm, city);
    }
  } else {
    products = fallbackSearch(rawQuery, category, minPrice, maxPrice, userLat, userLng, instantOnly, maxDistanceKm, city);
  }

  // Check suggestion map fallback
  if (!suggestion && rawQuery) {
    const lowerQ = rawQuery.toLowerCase();
    if (SUGGESTION_MAP[lowerQ]) {
      suggestion = SUGGESTION_MAP[lowerQ];
    }
  }

  // Compute Geo Delivery badges for each product relative to user location
  const enrichedProducts = products.map(product => {
    return enrichProductWithDeliveryInfo(product, userLat, userLng, lang);
  });

  const durationMs = Date.now() - startTime;

  // Track Lost Opportunity if 0 results or top product is out of stock
  if (rawQuery) {
    const isOutOfStockOrZero = enrichedProducts.length === 0 || (enrichedProducts[0] && enrichedProducts[0].totalStock <= 0);
    publishSearchEvent({
      query: rawQuery,
      resultCount: enrichedProducts.length,
      unavailableOrOutOfStock: isOutOfStockOrZero,
      matchedProduct: enrichedProducts[0] || null,
      userLocation: userLat && userLng ? { lat: userLat, lng: userLng } : null,
    }).catch(() => {});
  }

  // Log in ActivityLogger for Admin System Activity demo proof
  activityLogger.logOpenSearchQuery(
    queryDsl,
    { q: rawQuery, lang, category, instantOnly, userLat, userLng },
    enrichedProducts.length,
    durationMs,
    isAiven ? 'aiven' : 'emulated'
  );

  return {
    query: rawQuery,
    total: enrichedProducts.length,
    tookMs: durationMs,
    engine: isAiven ? 'Aiven OpenSearch' : 'OpenSearch Emulated Engine',
    suggestion,
    products: enrichedProducts,
  };
}

/**
 * Autocomplete suggestions for search input
 */
export async function getAutocompleteSuggestions(prefix = '', lang = 'en') {
  if (!prefix || prefix.length < 2) return [];

  const lower = prefix.toLowerCase();
  const matches = [];
  const FASHION_CAT_SET = new Set(FASHION_CATEGORIES);

  for (const item of mockOpenSearchIndex.values()) {
    if (!FASHION_CAT_SET.has(item.category_id)) continue;
    const nameEn = (item.name_en || '').toLowerCase();
    const nameKn = item.name_kn || '';
    const keywords = (item.keywords || '').toLowerCase();

    if (nameEn.startsWith(lower) || nameEn.includes(` ${lower}`)) {
      matches.push({ title: lang === 'kn' ? (item.name_kn || item.name_en) : item.name_en, id: item.id });
    } else if (nameKn.startsWith(prefix) || keywords.includes(lower)) {
      matches.push({ title: lang === 'kn' ? item.name_kn : item.name_en, id: item.id });
    }
    if (matches.length >= 6) break;
  }

  return matches;
}

/**
 * Fallback in-memory search engine with fuzzy matching and geo-filtering
 */
function fallbackSearch(query, category, minPrice, maxPrice, userLat, userLng, instantOnly, maxDistanceKm, city) {
  const allDocs = Array.from(mockOpenSearchIndex.values());
  const lowerQ = query.toLowerCase().trim();
  const FASHION_CAT_SET = new Set(FASHION_CATEGORIES);

  let results = allDocs.filter(doc => {
    // Strict Fashion Category Guard
    if (!FASHION_CAT_SET.has(doc.category_id)) {
      return false;
    }

    // Category filter
    if (category && doc.category_id !== category) {
      return false;
    }

    // Price filter
    if (minPrice !== null && doc.price < parseFloat(minPrice)) return false;
    if (maxPrice !== null && doc.price > parseFloat(maxPrice)) return false;

    // City filter
    if (city && doc.stores && !doc.stores.some(s => (s.city || '').toLowerCase() === city.toLowerCase())) {
      return false;
    }

    // Query text match
    if (lowerQ) {
      const nameEn = (doc.name_en || '').toLowerCase();
      const nameKn = (doc.name_kn || '').toLowerCase();
      const descEn = (doc.description_en || '').toLowerCase();
      const descKn = (doc.description_kn || '').toLowerCase();
      const keywords = (doc.keywords || '').toLowerCase();

      // Direct or substring match
      const exactMatch =
        nameEn.includes(lowerQ) ||
        nameKn.includes(lowerQ) ||
        descEn.includes(lowerQ) ||
        descKn.includes(lowerQ) ||
        keywords.includes(lowerQ);

      if (exactMatch) return true;

      // Fuzzy matching for English typos (e.g. "bluetoth" ~ "bluetooth", "headfone" ~ "headphone")
      const words = [...nameEn.split(/\s+/), ...keywords.split(/\s+/)];
      const hasFuzzyWordMatch = words.some(w => {
        if (Math.abs(w.length - lowerQ.length) <= 2) {
          return levenshteinDistance(w, lowerQ) <= 2;
        }
        return false;
      });

      if (hasFuzzyWordMatch) return true;

      return false;
    }

    return true;
  });

  // Geo-filter if instant delivery requested
  if (userLat !== null && userLng !== null && (instantOnly || maxDistanceKm)) {
    const maxDist = maxDistanceKm ? parseFloat(maxDistanceKm) : config.delivery.defaultRadiusKm;
    results = results.filter(doc => {
      if (!doc.stores || doc.stores.length === 0) return false;
      return doc.stores.some(st => {
        if (st.stock <= 0) return false;
        const d = calculateHaversineDistance(userLat, userLng, st.location.lat, st.location.lon);
        return d <= maxDist;
      });
    });
  }

  return results;
}

/**
 * Enrich product with live delivery badge relative to customer coordinates
 */
export function enrichProductWithDeliveryInfo(product, userLat, userLng, lang = 'en') {
  let isInstantEligible = false;
  let nearestStore = null;
  let nearestDistance = Infinity;
  let totalStock = product.central_stock || 0;

  // Find nearest store that has stock
  if (product.stores && product.stores.length > 0) {
    for (const st of product.stores) {
      totalStock += (st.stock || 0);

      if (userLat !== null && userLng !== null && st.stock > 0) {
        const dist = calculateHaversineDistance(userLat, userLng, st.location.lat, st.location.lon);
        const radius = st.delivery_radius_km || config.delivery.defaultRadiusKm;

        if (dist <= radius && dist < nearestDistance) {
          nearestDistance = dist;
          nearestStore = st;
          isInstantEligible = true;
        }
      }
    }
  }

  let deliveryBadge = {};
  if (isInstantEligible && nearestStore) {
    const eta = calculateEtaMinutes(nearestDistance);
    deliveryBadge = {
      type: 'instant_30min',
      isInstant: true,
      storeName: nearestStore.store_name,
      distanceKm: nearestDistance,
      etaMinutes: eta,
      textEn: `⚡ ${eta}-min delivery · ${nearestStore.store_name} · ${nearestDistance} km`,
      textKn: `⚡ ${eta} ನಿಮಿಷಗಳಲ್ಲಿ ವಿತರಣೆ · ${nearestStore.store_name} · ${nearestDistance} ಕಿ.ಮೀ.`,
      tagEn: '⚡ 30-min delivery',
      tagKn: '⚡ 30 ನಿಮಿಷ ವಿತರಣೆ',
    };
  } else {
    deliveryBadge = {
      type: 'standard_warehouse',
      isInstant: false,
      storeName: 'Central Logistics Hub',
      distanceKm: null,
      etaMinutes: 3 * 24 * 60,
      textEn: 'Standard delivery 3-5 days',
      textKn: 'ಪ್ರಮಾಣಿತ ವಿತರಣೆ 3-5 ದಿನಗಳು',
      tagEn: 'Standard delivery',
      tagKn: 'ಪ್ರಮಾಣಿತ ವಿತರಣೆ',
    };
  }

  return {
    ...product,
    totalStock,
    deliveryBadge,
  };
}

function levenshteinDistance(s1, s2) {
  const m = s1.length;
  const n = s2.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}
