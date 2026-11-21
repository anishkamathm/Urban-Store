import { Client } from '@opensearch-project/opensearch';
import { config } from './env.js';

let client = null;
let isConnected = false;

// Fallback in-memory index for local evaluation / offline testing
export const mockOpenSearchIndex = new Map();

export function getOpenSearchClient() {
  if (client && isConnected) return client;

  if (!config.opensearch.node || config.opensearch.node.includes('YOUR_AIVEN_OPENSEARCH_HOST')) {
    console.log('[OpenSearch] No Aiven OpenSearch URL configured. Using in-memory geo-fuzzy search engine.');
    isConnected = false;
    return null;
  }

  try {
    client = new Client({
      node: config.opensearch.node,
      ssl: {
        rejectUnauthorized: config.opensearch.sslRejectUnauthorized,
      },
    });
    return client;
  } catch (err) {
    console.warn('[OpenSearch] Init error:', err.message);
    return null;
  }
}

export async function testOpenSearchConnection() {
  const osClient = getOpenSearchClient();
  if (!osClient) {
    isConnected = false;
    return false;
  }

  try {
    const health = await osClient.cluster.health({});
    isConnected = true;
    console.log(`[OpenSearch] Connected to Aiven OpenSearch cluster. Status: ${health.body.status}`);
    return true;
  } catch (err) {
    isConnected = false;
    console.warn(`[OpenSearch] Connection failed (${err.message}). Using fallback search engine.`);
    return false;
  }
}

export function isLiveOpenSearch() {
  return isConnected;
}

export const OPENSEARCH_MAPPINGS = {
  settings: {
    index: {
      number_of_shards: 1,
      number_of_replicas: 1,
      analysis: {
        filter: {
          bilingual_synonyms: {
            type: 'synonym',
            synonyms: [
              "watch, luxury watch, chronograph, automatic watch, wristwatch, time piece, ಕೈಗಡಿಯಾರ, ವಾಚ್",
              "shoes, footwear, sneakers, boots, chelsea boots, brogues, dress shoes, low top, ಶೂ, ಶೂಗಳು, ಪಾದರಕ್ಷೆಗಳು, ಬೂಟ್ಸ್, ಸ್ನೀಕರ್ಸ್",
              "clothes, apparel, shirt, blazer, suit, dress, jeans, denim, trousers, ಉಡುಪುಗಳು, ಬಟ್ಟೆಗಳು, ಶರ್ಟ್, ಬ್ಲೇಜರ್, ಜೀನ್ಸ್",
              "handbag, purse, tote bag, shoulder bag, crossbody, satchel, ಹ್ಯಾಂಡ್‌ಬ್ಯಾಗ್, ಪರ್ಸ್, ಮಹಿಳಾ ಬ್ಯಾಗ್",
              "wallet, bifold, cardholder, backpack, laptop bag, bags and wallets, ವಾಲೆಟ್, ಜೇಬು ಪರ್ಸ್, ಬ್ಯಾಗ್‌ಪ್ಯಾಕ್",
              "shirt, formal shirt, oxford shirt, button down, linen shirt, ಶರ್ಟ್, ಅಂಗಿ, ಲಿನೆನ್",
              "jeans, denim, selvedge, raw denim, ಜೀನ್ಸ್, ಡೆನಿಮ್",
              "blazer, suit, coat, jacket, ಬ್ಲೇಜರ್, ಕೋಟ್, ಜಾಕೆಟ್"
            ]
          },
          autocomplete_filter: {
            type: 'edge_ngram',
            min_gram: 2,
            max_gram: 15
          }
        },
        analyzer: {
          bilingual_search_analyzer: {
            type: 'custom',
            tokenizer: 'standard',
            filter: ['lowercase', 'bilingual_synonyms']
          },
          autocomplete_index_analyzer: {
            type: 'custom',
            tokenizer: 'standard',
            filter: ['lowercase', 'autocomplete_filter']
          }
        }
      }
    }
  },
  mappings: {
    properties: {
      id: { type: 'keyword' },
      name_en: {
        type: 'text',
        analyzer: 'bilingual_search_analyzer',
        fields: {
          autocomplete: {
            type: 'text',
            analyzer: 'autocomplete_index_analyzer',
            search_analyzer: 'standard'
          },
          keyword: { type: 'keyword' }
        }
      },
      name_kn: {
        type: 'text',
        analyzer: 'bilingual_search_analyzer',
        fields: {
          keyword: { type: 'keyword' }
        }
      },
      description_en: { type: 'text' },
      description_kn: { type: 'text' },
      keywords: {
        type: 'text',
        analyzer: 'bilingual_search_analyzer'
      },
      category_id: { type: 'keyword' },
      category_name_en: { type: 'keyword' },
      category_name_kn: { type: 'keyword' },
      price: { type: 'float' },
      central_stock: { type: 'integer' },
      image_url: { type: 'keyword', index: false },
      is_featured: { type: 'boolean' },
      stores: {
        type: 'nested',
        properties: {
          store_id: { type: 'keyword' },
          store_name: { type: 'keyword' },
          city: { type: 'keyword' },
          location: { type: 'geo_point' },
          stock: { type: 'integer' },
          delivery_radius_km: { type: 'float' }
        }
      },
      updated_at: { type: 'date' }
    }
  }
};

export async function createIndexIfNotExists() {
  const osClient = getOpenSearchClient();
  const indexName = config.opensearch.index;

  if (osClient && isConnected) {
    try {
      const { body: exists } = await osClient.indices.exists({ index: indexName });
      if (!exists) {
        await osClient.indices.create({
          index: indexName,
          body: OPENSEARCH_MAPPINGS
        });
        console.log(`[OpenSearch] Created index "${indexName}" with bilingual and geo mappings.`);
      } else {
        console.log(`[OpenSearch] Index "${indexName}" already exists.`);
      }
      return true;
    } catch (err) {
      console.warn('[OpenSearch] Error creating index:', err.message);
      return false;
    }
  }
  return true;
}

export async function indexProduct(productDoc) {
  // Always update in-memory mock index
  mockOpenSearchIndex.set(productDoc.id, {
    ...productDoc,
    updated_at: new Date().toISOString()
  });

  const osClient = getOpenSearchClient();
  if (osClient && isConnected) {
    try {
      await osClient.index({
        index: config.opensearch.index,
        id: productDoc.id,
        body: productDoc,
        refresh: true
      });
      console.log(`[OpenSearch] Indexed product ${productDoc.id} (${productDoc.name_en})`);
    } catch (err) {
      console.warn(`[OpenSearch] Failed to index product ${productDoc.id}:`, err.message);
    }
  }
}
