import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root or backend folder
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config(); // fallback to current dir

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'super_secret_shopmart_jwt_key_aiven_hackathon_2024',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Aiven PostgreSQL
  databaseUrl: process.env.DATABASE_URL || '',
  pgSslRejectUnauthorized: process.env.PG_SSL_REJECT_UNAUTHORIZED === 'true',

  // Aiven Apache Kafka
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',').map(b => b.trim()),
    clientId: process.env.KAFKA_CLIENT_ID || 'urban-store-retail-engine',
    groupId: process.env.KAFKA_GROUP_ID || 'urban-store-consumer-group',
    authType: process.env.KAFKA_AUTH_TYPE || 'NONE', // 'SSL' | 'SASL' | 'NONE'
    caCertPath: process.env.KAFKA_CA_CERT_PATH || './certs/ca.pem',
    accessCertPath: process.env.KAFKA_ACCESS_CERT_PATH || './certs/service.cert',
    accessKeyPath: process.env.KAFKA_ACCESS_KEY_PATH || './certs/service.key',
    saslMechanism: process.env.KAFKA_SASL_MECHANISM || 'scram-sha-512',
    saslUsername: process.env.KAFKA_SASL_USERNAME || '',
    saslPassword: process.env.KAFKA_SASL_PASSWORD || '',
    topics: {
      stockUpdates: process.env.KAFKA_TOPIC_STOCK_UPDATES || 'stock-updates',
      cartReservations: process.env.KAFKA_TOPIC_CART_RESERVATIONS || 'cart-reservations',
      orders: process.env.KAFKA_TOPIC_ORDERS || 'orders',
      notifications: process.env.KAFKA_TOPIC_NOTIFICATIONS || 'notifications',
      searchEvents: process.env.KAFKA_TOPIC_SEARCH_EVENTS || 'search-events',
      // Backwards-compatible aliases
      orderPlaced: process.env.KAFKA_TOPIC_ORDERS || 'orders',
      inventoryChanged: process.env.KAFKA_TOPIC_STOCK_UPDATES || 'stock-updates',
      productUpdated: process.env.KAFKA_TOPIC_PRODUCT_UPDATED || 'product.updated',
      deliveryAssigned: process.env.KAFKA_TOPIC_DELIVERY_ASSIGNED || 'delivery.assigned',
      deliveryStatusChanged: process.env.KAFKA_TOPIC_DELIVERY_STATUS_CHANGED || 'delivery.status.changed',
    }
  },

  // Aiven OpenSearch
  opensearch: {
    node: process.env.OPENSEARCH_URL || '',
    index: process.env.OPENSEARCH_INDEX || 'urban_store_products',
    sslRejectUnauthorized: process.env.OPENSEARCH_SSL_REJECT_UNAUTHORIZED === 'true',
  },

  // Instant Delivery & Eco Simulation
  delivery: {
    defaultRadiusKm: parseFloat(process.env.DEFAULT_DELIVERY_RADIUS_KM || '5.0'),
    basePrepTimeMin: parseInt(process.env.BASE_PREP_TIME_MIN || '15', 10),
    minutesPerKm: parseFloat(process.env.MINUTES_PER_KM || '3.0'),
    emissionFactorKgPerKm: parseFloat(process.env.EMISSION_FACTOR_KG_PER_KM || '0.1'),
    benchmarkTripFactorKgPerKm: parseFloat(process.env.BENCHMARK_TRIP_FACTOR_KG_PER_KM || '0.28'),
    simulationDelays: {
      packed: parseInt(process.env.SIMULATION_PACKED_DELAY_SEC || '10', 10),
      outForDelivery: parseInt(process.env.SIMULATION_OUTFORDELIVERY_DELAY_SEC || '12', 10),
      delivered: parseInt(process.env.SIMULATION_DELIVERED_DELAY_SEC || '15', 10),
    }
  },

  useFallbackIfDisconnected: process.env.USE_FALLBACK_IF_DISCONNECTED !== 'false',
};
