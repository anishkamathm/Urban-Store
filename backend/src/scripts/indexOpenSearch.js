import { createIndexIfNotExists, indexProduct, getOpenSearchClient, isLiveOpenSearch } from '../config/opensearch.js';
import { query } from '../config/postgres.js';
import { config } from '../config/env.js';
import { SEED_PRODUCTS, SEED_STORES } from './seedData.js';

async function runIndexOpenSearch() {
  console.log('========================================================');
  console.log('  Syncing Urban Store Fashion to Aiven OpenSearch Index ');
  console.log('========================================================');

  await createIndexIfNotExists();

  const fashionIds = SEED_PRODUCTS.map(p => p.id);

  // If live OpenSearch is connected, delete any legacy non-fashion products from the index
  const osClient = getOpenSearchClient();
  if (osClient && isLiveOpenSearch()) {
    try {
      await osClient.deleteByQuery({
        index: config.opensearch.index,
        body: {
          query: {
            bool: {
              must_not: [
                { terms: { id: fashionIds } }
              ]
            }
          }
        },
        refresh: true,
      });
      console.log('✓ Purged legacy documents from OpenSearch index');
    } catch (purgeErr) {
      console.warn('OpenSearch purge notice:', purgeErr.message);
    }
  }

  const prodRes = await query('SELECT * FROM products WHERE id = ANY($1)', [fashionIds]);
  const products = prodRes.rows && prodRes.rows.length > 0 ? prodRes.rows : SEED_PRODUCTS;

  for (const p of products) {
    const invRes = await query(
      `SELECT si.store_id, si.stock, s.name as store_name, s.city, s.latitude, s.longitude, s.delivery_radius_km
       FROM store_inventory si
       JOIN stores s ON si.store_id = s.id
       WHERE si.product_id = $1`,
      [p.id]
    );

    let storeDocs = [];
    if (invRes.rows.length > 0) {
      storeDocs = invRes.rows.map(r => ({
        store_id: r.store_id,
        store_name: r.store_name,
        city: r.city,
        location: { lat: parseFloat(r.latitude), lon: parseFloat(r.longitude) },
        stock: r.stock,
        delivery_radius_km: parseFloat(r.delivery_radius_km || 5),
      }));
    } else if (p.stocks) {
      for (const [sId, stock] of Object.entries(p.stocks)) {
        const sInfo = SEED_STORES.find(s => s.id === sId);
        if (sInfo) {
          storeDocs.push({
            store_id: sId,
            store_name: sInfo.name,
            city: sInfo.city,
            location: { lat: sInfo.latitude, lon: sInfo.longitude },
            stock,
            delivery_radius_km: sInfo.delivery_radius_km,
          });
        }
      }
    }

    const doc = {
      id: p.id,
      category_id: p.category_id,
      name_en: p.name_en,
      name_kn: p.name_kn,
      description_en: p.description_en,
      description_kn: p.description_kn,
      price: parseFloat(p.price),
      central_stock: p.central_stock,
      image_url: p.image_url,
      keywords: p.keywords || `${p.name_en} ${p.name_kn || ''}`,
      is_featured: p.is_featured,
      stores: storeDocs,
    };

    await indexProduct(doc);
    console.log(`✓ Indexed: ${p.name_en} (${p.name_kn}) [Stores: ${storeDocs.length}]`);
  }

  console.log('\n✨ OpenSearch indexing complete!');
  process.exit(0);
}

runIndexOpenSearch().catch(err => {
  console.error('[OpenSearch Indexing Error]:', err);
  process.exit(1);
});
