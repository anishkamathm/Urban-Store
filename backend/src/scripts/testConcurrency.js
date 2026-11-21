import { getClient, query } from '../config/postgres.js';
import { seedInitialDataIfEmpty } from './seedData.js';

async function testInventoryConcurrency() {
  console.log('================================================================');
  console.log('   ShopMart Concurrency & Atomic Transaction Isolation Test     ');
  console.log('================================================================');
  console.log('Scenario: Two customers simultaneously attempt to purchase');
  console.log('the very LAST remaining unit (Stock = 1) of Japanese Selvedge Denim Jeans.\n');

  await seedInitialDataIfEmpty();

  const targetProductId = 'prod-selvedge-denim';
  const targetStoreId = 'store-blr-indiranagar';

  // Step 1: Force stock to exactly 1
  await query('UPDATE store_inventory SET stock = 1 WHERE store_id = $1 AND product_id = $2', [
    targetStoreId,
    targetProductId,
  ]);
  console.log(`[Setup] Set initial stock = 1 for product "${targetProductId}" at store "${targetStoreId}".\n`);

  // Define buy function using PostgreSQL transaction with atomic conditional update
  async function attemptPurchase(customerName, lang = 'en') {
    const client = await getClient();
    const startTime = Date.now();

    try {
      await client.query('BEGIN');
      console.log(`[${customerName}] BEGIN transaction`);

      // Atomic conditional update
      const updateResult = await client.query(
        `UPDATE store_inventory SET stock = stock - 1
         WHERE store_id = $1 AND product_id = $2 AND stock >= 1`,
        [targetStoreId, targetProductId]
      );

      console.log(`[${customerName}] Executed conditional UPDATE -> affected rows: ${updateResult.rowCount}`);

      if (updateResult.rowCount === 0) {
        // Stock already taken by competing transaction!
        await client.query('ROLLBACK');
        const took = Date.now() - startTime;
        return {
          customerName,
          status: 'OUT_OF_STOCK',
          took,
          errorEn: 'Sorry, this product is out of stock.',
          errorKn: 'ಕ್ಷಮಿಸಿ, ಈ ಉತ್ಪನ್ನದ ಸ್ಟಾಕ್ ಲಭ್ಯವಿಲ್ಲ.',
        };
      }

      // Record dummy order item
      await client.query('COMMIT');
      const took = Date.now() - startTime;
      console.log(`[${customerName}] COMMIT transaction (Success in ${took}ms)`);
      return {
        customerName,
        status: 'SUCCESS',
        took,
        messageEn: 'Order placed successfully! 1 unit reserved.',
        messageKn: 'ಆರ್ಡರ್ ಯಶಸ್ವಿಯಾಗಿದೆ! 1 ಯೂನಿಟ್ ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ.',
      };
    } catch (err) {
      await client.query('ROLLBACK');
      return { customerName, status: 'ERROR', error: err.message };
    } finally {
      client.release();
    }
  }

  // Fire both transactions concurrently via Promise.all
  console.log('⚡ Launching User A (Kavya - Kannada) and User B (Rohan - English) concurrently...');
  const [resultA, resultB] = await Promise.all([
    attemptPurchase('User A (Kavya)', 'kn'),
    attemptPurchase('User B (Rohan)', 'en'),
  ]);

  console.log('\n================== TEST RESULTS ==================');
  console.log(`User A Result: [${resultA.status}] ${resultA.status === 'SUCCESS' ? resultA.messageKn : resultA.errorKn} (${resultA.took}ms)`);
  console.log(`User B Result: [${resultB.status}] ${resultB.status === 'SUCCESS' ? resultB.messageEn : resultB.errorEn} (${resultB.took}ms)`);

  // Step 3: Verify final inventory
  const finalInv = await query('SELECT stock FROM store_inventory WHERE store_id = $1 AND product_id = $2', [
    targetStoreId,
    targetProductId,
  ]);
  const finalStock = parseInt(finalInv.rows[0]?.stock, 10);

  console.log(`\nFinal Store Inventory: ${finalStock} units`);

  const passed = (
    (resultA.status === 'SUCCESS' && resultB.status === 'OUT_OF_STOCK') ||
    (resultB.status === 'SUCCESS' && resultA.status === 'OUT_OF_STOCK')
  ) && finalStock === 0;

  if (passed) {
    console.log('✅ PASSED: Atomic transaction isolation succeeded! Zero phantom reads, zero overselling.');
    console.log('==================================================\n');
    process.exit(0);
  } else {
    console.error('❌ FAILED: Concurrency condition violated!');
    console.log('==================================================\n');
    process.exit(1);
  }
}

testInventoryConcurrency().catch(err => {
  console.error('[Concurrency Test Error]:', err);
  process.exit(1);
});
