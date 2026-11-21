import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { testPostgresConnection, isLivePostgres } from './config/postgres.js';
import { getKafkaProducer, isLiveKafka } from './config/kafka.js';
import { testOpenSearchConnection, isLiveOpenSearch, createIndexIfNotExists } from './config/opensearch.js';
import { startConsumer } from './consumer.js';
import { seedInitialDataIfEmpty } from './scripts/seedData.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import storeRoutes from './routes/storeRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import sseRoutes from './routes/sseRoutes.js';

const app = express();

// Middleware
app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/admin', adminRoutes);
app.use('/events', sseRoutes);

// Health check and Aiven service diagnostics
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'Urban Store Retail Engine',
    timestamp: new Date().toISOString(),
    aivenServices: {
      postgres: {
        connected: isLivePostgres(),
        role: 'Relational source of truth & atomic transactions',
      },
      kafka: {
        connected: isLiveKafka(),
        role: 'Real-time business event streaming',
      },
      opensearch: {
        connected: isLiveOpenSearch(),
        role: 'Bilingual fuzzy & geo-distance search engine',
      }
    }
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: config.env === 'development' ? err.message : undefined,
  });
});

async function startServer() {
  console.log('========================================================');
  console.log('       Starting Urban Store Retail Backend Engine       ');
  console.log('========================================================');

  // Test connections to all 3 Aiven services
  await testPostgresConnection();
  await getKafkaProducer();
  await testOpenSearchConnection();
  await createIndexIfNotExists();

  // Populate data if storage is fresh
  await seedInitialDataIfEmpty();

  // Start internal consumer to listen to events
  startConsumer();

  app.listen(config.port, () => {
    console.log(`\n🚀 Urban Store API server running at http://localhost:${config.port}`);
    console.log(`⚡ Real-Time SSE Stream active at http://localhost:${config.port}/events`);
    console.log(`🔍 Health Check at http://localhost:${config.port}/api/health\n`);
  });
}

// Export app for tests and external scripts
export { app, startServer };

if (process.argv[1]?.endsWith('server.js')) {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
  });
}
