import { createKafkaConsumer, isLiveKafka, localEventBus } from './config/kafka.js';
import { query } from './config/postgres.js';
import { config } from './config/env.js';
import { activityLogger } from './services/activityLogger.js';
import { publishStockUpdate, publishDeliveryAssigned, publishDeliveryStatusChanged } from './services/kafkaProducer.js';
import { broadcastStockUpdate, broadcastDeliveryUpdate, broadcastNotification } from './services/sseService.js';
import { indexProduct } from './config/opensearch.js';

console.log('====================================================');
console.log('   Urban Store Retail Engine - Kafka Event Consumer ');
console.log('====================================================');

// Rider names for simulation (Bilingual)
const RIDERS = [
  { nameEn: 'Ramesh Kumar', nameKn: 'ರಮೇಶ್ ಕುಮಾರ್', phone: '+91 98450 12345' },
  { nameEn: 'Praveen Gowda', nameKn: 'ಪ್ರವೀಣ್ ಗೌಡ', phone: '+91 97410 56789' },
  { nameEn: 'Suresh Nayak', nameKn: 'ಸುರೇಶ್ ನಾಯಕ್', phone: '+91 99000 67890' },
  { nameEn: 'Manjunath B', nameKn: 'ಮಂಜುನಾಥ್ ಬಿ', phone: '+91 96110 34567' },
];

/**
 * Check and enforce idempotency using processed_events table
 */
async function isEventAlreadyProcessed(eventId, topic) {
  try {
    await query('INSERT INTO processed_events (event_id, topic, processed_at) VALUES ($1, $2, NOW())', [eventId, topic]);
    return false; // Not processed before, insert succeeded
  } catch (err) {
    if (err.code === '23505' || err.message?.includes('duplicate key') || err.message?.includes('unique constraint')) {
      console.warn(`[Consumer Idempotency] Skipping duplicate event ${eventId} on topic ${topic}`);
      return true; // Already processed!
    }
    return false;
  }
}

/**
 * Process order.placed event:
 * (a) Confirms delivery assignment
 * (b) Logs order confirmation in customer's preferred language
 * (c) Publishes stock.updated and delivery.assigned
 * (d) Re-syncs product in OpenSearch
 * (e) Simulates rider movement with short timers
 */
async function handleOrderPlaced(event) {
  const { eventId, orderId, orderNumber, language = 'en', items = [], storeId, deliveryType, deliveryLat, deliveryLng } = event;

  if (await isEventAlreadyProcessed(eventId, config.kafka.topics.orders)) {
    return;
  }

  console.log(`\n📦 [Consumer] Processing new online order: ${orderNumber} (${orderId}) [Lang: ${language.toUpperCase()}]`);

  // (a) Confirm Delivery Assignment
  const randomRider = RIDERS[Math.floor(Math.random() * RIDERS.length)];
  const riderName = language === 'kn' ? randomRider.nameKn : randomRider.nameEn;

  await query(
    `UPDATE deliveries SET rider_name = $1, rider_phone = $2, status = 'ASSIGNED', updated_at = NOW() WHERE order_id = $3`,
    [riderName, randomRider.phone, orderId]
  );

  // (b) Send / Log Bilingual Order Confirmation
  if (language === 'kn') {
    console.log(`📩 [SMS / Email Confirmation Sent (Kannada)]:
    "ನಮಸ್ಕಾರ! ನಿಮ್ಮ ಅರ್ಬನ್ ಸ್ಟೋರ್ (Urban Store) ಆರ್ಡರ್ ${orderNumber} ದೃಢೀಕರಿಸಲ್ಪಟ್ಟಿದೆ.
    ವಿತರಣಾ ಪಾಲುದಾರ: ${riderName} (${randomRider.phone}).
    ಸ್ಥಿತಿ: ಪ್ಯಾಕಿಂಗ್ ಪ್ರಾರಂಭವಾಗಿದೆ."`);
  } else {
    console.log(`📩 [SMS / Email Confirmation Sent (English)]:
    "Hello! Your Urban Store order ${orderNumber} is confirmed.
    Delivery Partner: ${riderName} (${randomRider.phone}).
    Status: Preparing order."`);
  }

  // (c) Publish delivery.assigned event
  const deliveryData = {
    id: event.deliveryId || `del-${orderId}`,
    order_id: orderId,
    store_id: storeId,
    rider_name: riderName,
    rider_phone: randomRider.phone,
    eta_minutes: event.etaMinutes || 25,
  };
  await publishDeliveryAssigned(deliveryData);

  // (c) & (d) Publish stock-updates & Re-sync OpenSearch for each ordered product
  for (const item of items) {
    const prodId = item.productId || item.product_id;
    const qty = item.quantity;

    await syncProductStockAndOpenSearch(prodId, storeId, `Online order ${orderNumber} fulfilled`);
  }

  // (e) Simulate Rider Movement with short timers
  simulateRiderMovement(orderId, orderNumber, storeId, deliveryLat, deliveryLng, language, riderName, randomRider.phone);
}

/**
 * Handle offline POS bill event
 */
async function handleOfflineBill(event) {
  const { eventId, billNumber, storeId, items = [], totalAmount } = event;

  if (await isEventAlreadyProcessed(eventId, config.kafka.topics.orders)) {
    return;
  }

  console.log(`\n🏬 [Consumer] Processing offline in-store POS bill: ${billNumber} at store ${storeId} (Total: ₹${totalAmount})`);

  for (const item of items) {
    const prodId = item.productId || item.product_id;
    await syncProductStockAndOpenSearch(prodId, storeId, `Offline POS sale ${billNumber}`);
  }
}

/**
 * Helper to re-sync PostgreSQL stock with OpenSearch and broadcast SSE
 */
export async function syncProductStockAndOpenSearch(prodId, storeId, reason = 'stock_sync') {
  try {
    const pRes = await query('SELECT * FROM products WHERE id = $1', [prodId]);
    const invRes = await query(
      `SELECT si.store_id, si.stock, s.name as store_name, s.city, s.latitude, s.longitude, s.delivery_radius_km
       FROM store_inventory si
       JOIN stores s ON si.store_id = s.id
       WHERE si.product_id = $1`,
      [prodId]
    );

    if (pRes.rows.length > 0) {
      const prod = pRes.rows[0];
      const stores = invRes.rows.map(r => ({
        store_id: r.store_id,
        store_name: r.store_name,
        city: r.city,
        location: { lat: parseFloat(r.latitude), lon: parseFloat(r.longitude) },
        stock: r.stock,
        delivery_radius_km: parseFloat(r.delivery_radius_km || 5),
      }));

      const totalStock = (prod.central_stock || 0) + stores.reduce((sum, s) => sum + s.stock, 0);

      // Re-index in OpenSearch
      await indexProduct({
        ...prod,
        price: parseFloat(prod.price),
        stores,
      });

      // Broadcast inventory update to SSE clients
      broadcastStockUpdate(prodId, storeId, stores.find(s => s.store_id === storeId)?.stock || 0, totalStock);
      console.log(`[Sync] OpenSearch & SSE updated for product ${prodId}: total stock now ${totalStock}`);
    }
  } catch (err) {
    console.error(`[Sync Error] Failed to sync product ${prodId}:`, err.message);
  }
}

/**
 * Simulates rider movement through timed stages:
 * PACKED -> OUT_FOR_DELIVERY -> DELIVERED
 */
function simulateRiderMovement(orderId, orderNumber, storeId, destLat, destLng, language, riderName, riderPhone) {
  const delays = config.delivery.simulationDelays;

  const targetLat = destLat ? parseFloat(destLat) : 12.9716;
  const targetLng = destLng ? parseFloat(destLng) : 77.5946;

  query('SELECT latitude, longitude FROM stores WHERE id = $1', [storeId]).then(sRes => {
    const startLat = sRes.rows.length > 0 ? parseFloat(sRes.rows[0].latitude) : targetLat - 0.02;
    const startLng = sRes.rows.length > 0 ? parseFloat(sRes.rows[0].longitude) : targetLng - 0.02;

    // STEP 1: PACKED
    setTimeout(async () => {
      console.log(`\n📦 [Simulation] Order ${orderNumber} is PACKED at store!`);
      await query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2', ['PACKED', orderId]);
      await query('UPDATE deliveries SET status = $1, updated_at = NOW() WHERE order_id = $2', ['PACKED', orderId]);

      const deliveryPayload = {
        order_id: orderId,
        status: 'PACKED',
        rider_name: riderName,
        rider_phone: riderPhone,
        current_lat: startLat,
        current_lng: startLng,
        eta_minutes: 18,
      };

      await publishDeliveryStatusChanged(deliveryPayload, language === 'kn' ? 'ಆರ್ಡರ್ ಪ್ಯಾಕ್ ಮಾಡಲಾಗಿದೆ' : 'Order packed and sealed');
      broadcastDeliveryUpdate(orderId, deliveryPayload);

      // STEP 2: OUT_FOR_DELIVERY
      setTimeout(async () => {
        const midLat = startLat + (targetLat - startLat) * 0.55;
        const midLng = startLng + (targetLng - startLng) * 0.55;

        console.log(`\n🛵 [Simulation] Rider is OUT_FOR_DELIVERY for ${orderNumber}! (${midLat.toFixed(4)}, ${midLng.toFixed(4)})`);
        await query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2', ['OUT_FOR_DELIVERY', orderId]);
        await query('UPDATE deliveries SET status = $1, current_lat = $2, current_lng = $3, eta_minutes = $4, updated_at = NOW() WHERE order_id = $5', [
          'OUT_FOR_DELIVERY',
          midLat,
          midLng,
          8,
          orderId,
        ]);

        const outDeliveryPayload = {
          order_id: orderId,
          status: 'OUT_FOR_DELIVERY',
          rider_name: riderName,
          rider_phone: riderPhone,
          current_lat: midLat,
          current_lng: midLng,
          eta_minutes: 8,
        };

        await publishDeliveryStatusChanged(outDeliveryPayload, language === 'kn' ? 'ವಿತರಣೆಗೆ ಹೊರಟಿದೆ' : 'Out for delivery on EV courier');
        broadcastDeliveryUpdate(orderId, outDeliveryPayload);

        // STEP 3: DELIVERED
        setTimeout(async () => {
          console.log(`\n✅ [Simulation] Order ${orderNumber} has been DELIVERED to customer!`);
          await query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2', ['DELIVERED', orderId]);
          await query('UPDATE deliveries SET status = $1, current_lat = $2, current_lng = $3, eta_minutes = $4, updated_at = NOW() WHERE order_id = $5', [
            'DELIVERED',
            targetLat,
            targetLng,
            0,
            orderId,
          ]);

          const deliveredPayload = {
            order_id: orderId,
            status: 'DELIVERED',
            rider_name: riderName,
            rider_phone: riderPhone,
            current_lat: targetLat,
            current_lng: targetLng,
            eta_minutes: 0,
          };

          await publishDeliveryStatusChanged(deliveredPayload, language === 'kn' ? 'ಯಶಸ್ವಿಯಾಗಿ ತಲುಪಿಸಲಾಗಿದೆ' : 'Delivered to doorstep');
          broadcastDeliveryUpdate(orderId, deliveredPayload);
        }, delays.delivered * 1000);

      }, delays.outForDelivery * 1000);

    }, delays.packed * 1000);
  });
}

/**
 * Route incoming message by topic
 */
async function routeMessage(topic, messageObj) {
  activityLogger.logKafkaEvent(topic, messageObj);

  switch (topic) {
    case config.kafka.topics.orders:
    case config.kafka.topics.orderPlaced:
      if (messageObj.eventType === 'offline_bill.created') {
        await handleOfflineBill(messageObj);
      } else {
        await handleOrderPlaced(messageObj);
      }
      break;

    case config.kafka.topics.stockUpdates:
    case config.kafka.topics.inventoryChanged:
      console.log(`🔄 [Consumer] Stock update event: Product ${messageObj.productId} (Delta: ${messageObj.delta || 0}, Reason: ${messageObj.reason || 'updated'})`);
      if (messageObj.productId) {
        await syncProductStockAndOpenSearch(messageObj.productId, messageObj.storeId, messageObj.reason);
      }
      break;

    case config.kafka.topics.cartReservations:
      console.log(`🛒 [Consumer] Cart reservation event: ${messageObj.eventType} for product ${messageObj.productId}`);
      if (messageObj.eventType === 'cart.reservation.expired' || messageObj.eventType === 'cart.reservation.released') {
        await syncProductStockAndOpenSearch(messageObj.productId, messageObj.storeId, 'Reservation released');
      }
      break;

    case config.kafka.topics.notifications:
      console.log(`🔔 [Consumer] User notification: ${messageObj.titleEn}`);
      broadcastNotification(messageObj);
      break;

    case config.kafka.topics.searchEvents:
      console.log(`🔎 [Consumer] Search event: "${messageObj.query}" (Lost opp: ${messageObj.unavailableOrOutOfStock})`);
      if (messageObj.unavailableOrOutOfStock) {
        // Record in lost_opportunities table
        const id = `opp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        await query(
          `INSERT INTO lost_opportunities (id, query, normalized_query, category_id, product_id, product_name, search_count, estimated_lost_revenue, last_searched_at)
           VALUES ($1, $2, $3, $4, $5, $6, 1, $7, NOW())
           ON CONFLICT (normalized_query) DO UPDATE
           SET search_count = lost_opportunities.search_count + 1,
               estimated_lost_revenue = lost_opportunities.estimated_lost_revenue + $7,
               last_searched_at = NOW()`,
          [
            id,
            messageObj.query,
            messageObj.normalizedQuery || messageObj.query.toLowerCase().trim(),
            messageObj.matchedProduct?.category_id || null,
            messageObj.matchedProduct?.id || null,
            messageObj.matchedProduct?.name_en || messageObj.query,
            parseFloat(messageObj.matchedProduct?.price || 2999),
          ]
        );
      }
      break;

    case config.kafka.topics.productUpdated:
      console.log(`🏷️ [Consumer] Handled product.updated: Product ${messageObj.productId}`);
      break;
    case config.kafka.topics.deliveryAssigned:
      console.log(`🛵 [Consumer] Handled delivery.assigned: Order ${messageObj.orderId}`);
      break;
    case config.kafka.topics.deliveryStatusChanged:
      console.log(`📍 [Consumer] Handled delivery.status.changed: Order ${messageObj.orderId} -> ${messageObj.status}`);
      break;
    default:
      console.log(`[Consumer] Handled event on topic: ${topic}`);
  }
}

/**
 * Start listening via Aiven Kafka Consumer or Fallback Event Bus
 */
export async function startConsumer() {
  const topics = [
    config.kafka.topics.orders,
    config.kafka.topics.stockUpdates,
    config.kafka.topics.cartReservations,
    config.kafka.topics.notifications,
    config.kafka.topics.searchEvents,
    config.kafka.topics.orderPlaced,
    config.kafka.topics.inventoryChanged,
    config.kafka.topics.productUpdated,
    config.kafka.topics.deliveryAssigned,
    config.kafka.topics.deliveryStatusChanged,
  ];

  // Distinct topics
  const uniqueTopics = [...new Set(topics.filter(Boolean))];

  // 1. Subscribe to Local Event Bus fallback
  for (const topic of uniqueTopics) {
    localEventBus.on(topic, async (event) => {
      try {
        await routeMessage(topic, event.parsed);
      } catch (err) {
        console.error(`[LocalBus Error] Topic ${topic}:`, err);
      }
    });
  }

  // 2. Try starting Aiven Kafka Consumer if credentials provided
  try {
    const firstBroker = config.kafka.brokers[0] || '';
    if (firstBroker && !firstBroker.includes('YOUR_AIVEN_KAFKA_HOST')) {
      const consumer = createKafkaConsumer();
      await consumer.connect();
      console.log(`[Aiven Kafka] Consumer connected. Subscribing to topics: ${uniqueTopics.join(', ')}`);

      for (const t of uniqueTopics) {
        await consumer.subscribe({ topic: t, fromBeginning: false });
      }

      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const raw = message.value.toString();
            const parsed = JSON.parse(raw);
            console.log(`[Aiven Kafka Consumer] Received message on topic "${topic}" [Partition: ${partition}]`);
            await routeMessage(topic, parsed);
          } catch (err) {
            console.error(`[Consumer Error] Processing failed for message on ${topic}:`, err);
          }
        },
      });
      return;
    }
  } catch (err) {
    console.warn(`[Aiven Kafka Consumer] Unable to connect to Kafka brokers (${err.message}). Using synchronized local bus.`);
  }

  console.log('[Consumer] Kafka Consumer active and listening for business events.');
}

if (process.argv[1]?.endsWith('consumer.js')) {
  startConsumer();
}
