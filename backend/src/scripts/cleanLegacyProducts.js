import { query, testPostgresConnection, isLivePostgres, mockDb } from '../config/postgres.js';
import {
  getOpenSearchClient,
  testOpenSearchConnection,
  isLiveOpenSearch,
  createIndexIfNotExists,
  indexProduct,
  mockOpenSearchIndex
} from '../config/opensearch.js';
import { config } from '../config/env.js';
import { SEED_PRODUCTS, SEED_CATEGORIES, SEED_STORES, seedInitialDataIfEmpty } from './seedData.js';

async function main() {
  console.log('=================================================================');
  console.log('  Urban Store: Purge Legacy Grocery Data & Sync Fashion Catalog  ');
  console.log('=================================================================');

  // 1. Test connections
  await testPostgresConnection();
  await testOpenSearchConnection();

  const fashionIds = SEED_PRODUCTS.map(p => p.id);
  const fashionCatIds = SEED_CATEGORIES.map(c => c.id);

  console.log(`\n[Catalog Info] Expecting ${fashionIds.length} fashion products across ${fashionCatIds.length} categories.`);

  // 2. PostgreSQL Purge
  try {
    console.log('\n[1/3] Purging legacy data from PostgreSQL...');
    await query(`DELETE FROM cart_items WHERE product_id != ALL($1)`, [fashionIds]);
    await query(`DELETE FROM store_inventory WHERE product_id != ALL($1)`, [fashionIds]);
    await query(`DELETE FROM order_items WHERE product_id != ALL($1)`, [fashionIds]);
    await query(`DELETE FROM products WHERE id != ALL($1)`, [fashionIds]);
    await query(`DELETE FROM categories WHERE id != ALL($1)`, [fashionCatIds]);
    console.log('✓ Successfully cleaned non-fashion records from PostgreSQL tables');
  } catch (err) {
    console.warn('PostgreSQL purge warning:', err.message);
  }

  // 3. OpenSearch Purge & Re-index
  const osClient = getOpenSearchClient();
  if (osClient && isLiveOpenSearch()) {
    console.log('\n[2/3] Purging legacy documents from Aiven OpenSearch cluster...');
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
      console.log(`✓ Purged non-fashion documents from index "${config.opensearch.index}"`);
    } catch (osErr) {
      console.warn('OpenSearch deleteByQuery warning:', osErr.message);
    }
  } else {
    console.log('\n[2/3] OpenSearch is in fallback in-memory mode; purging memory index...');
    for (const key of Array.from(mockOpenSearchIndex.keys())) {
      if (!fashionIds.includes(key)) {
        mockOpenSearchIndex.delete(key);
      }
    }
    console.log('✓ In-memory search index cleaned.');
  }

  // 4. Seed and Index All 16 Fashion Products
  console.log('\n[3/3] Re-seeding and indexing all official Urban Store fashion items...');
  await seedInitialDataIfEmpty();

  // 5. Verification
  console.log('\n================ Verification ================');
  try {
    const prodRes = await query('SELECT id, name_en, category_id, price FROM products ORDER BY id ASC');
    console.log(`PostgreSQL Products Count: ${prodRes.rows.length}`);
    prodRes.rows.forEach(p => console.log(`  - [${p.category_id}] ${p.id}: ${p.name_en} (₹${p.price})`));

    const catRes = await query('SELECT id, slug, name_en FROM categories ORDER BY id ASC');
    console.log(`PostgreSQL Categories Count: ${catRes.rows.length}`);
    catRes.rows.forEach(c => console.log(`  - ${c.id} (${c.slug}): ${c.name_en}`));
  } catch (vErr) {
    console.warn('Verification query warning:', vErr.message);
  }

  console.log('\n✨ Urban Store catalog purge and sync completed successfully!');
  process.exit(0);
}

main().catch(err => {
  console.error('[Fatal Error]:', err);
  process.exit(1);
});
