import { Kafka, logLevel } from 'kafkajs';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { config } from './env.js';

let kafka = null;
let producer = null;
let isConnected = false;

// In-memory fallback bus for offline / local demo mode
export const localEventBus = new EventEmitter();

function buildKafkaConfig() {
  const kafkaOptions = {
    clientId: config.kafka.clientId,
    brokers: config.kafka.brokers,
    logLevel: logLevel.WARN,
    connectionTimeout: 5000,
  };

  if (config.kafka.authType === 'SSL') {
    try {
      const resolveCert = (configuredPath, defaultName) => {
        const candidates = [
          path.resolve(configuredPath),
          path.resolve('./certs', defaultName),
          path.resolve('../certs', defaultName),
          path.resolve('./backend/certs', defaultName),
        ];
        return candidates.find(p => fs.existsSync(p)) || path.resolve(configuredPath);
      };

      const caPath = resolveCert(config.kafka.caCertPath, 'ca.pem');
      const certPath = resolveCert(config.kafka.accessCertPath, 'service.cert');
      const keyPath = resolveCert(config.kafka.accessKeyPath, 'service.key');

      if (fs.existsSync(caPath) && fs.existsSync(certPath) && fs.existsSync(keyPath)) {
        kafkaOptions.ssl = {
          rejectUnauthorized: false,
          ca: [fs.readFileSync(caPath, 'utf-8')],
          key: fs.readFileSync(keyPath, 'utf-8'),
          cert: fs.readFileSync(certPath, 'utf-8'),
        };
        console.log('[Kafka] Configured with Aiven SSL client certificates from:', caPath);
      } else {
        kafkaOptions.ssl = { rejectUnauthorized: false };
        console.warn('[Kafka] SSL cert files not found in ./certs/ - using basic SSL.');
      }
    } catch (err) {
      console.warn('[Kafka] Error loading certs:', err.message);
      kafkaOptions.ssl = { rejectUnauthorized: false };
    }
  } else if (config.kafka.authType === 'SASL') {
    kafkaOptions.ssl = true;
    kafkaOptions.sasl = {
      mechanism: config.kafka.saslMechanism,
      username: config.kafka.saslUsername,
      password: config.kafka.saslPassword,
    };
    console.log('[Kafka] Configured with Aiven SASL authentication.');
  }

  return kafkaOptions;
}

export async function getKafkaProducer() {
  if (producer && isConnected) {
    return producer;
  }

  // Check if brokers look configured
  const firstBroker = config.kafka.brokers[0] || '';
  if (!firstBroker || firstBroker.includes('YOUR_AIVEN_KAFKA_HOST')) {
    console.log('[Kafka] No Aiven Kafka credentials provided. Running in memory-synced bus mode.');
    isConnected = false;
    return null;
  }

  try {
    kafka = new Kafka(buildKafkaConfig());
    producer = kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 30000,
    });
    await producer.connect();
    isConnected = true;
    console.log(`[Kafka] Connected to Aiven Kafka brokers: ${config.kafka.brokers.join(', ')}`);
    return producer;
  } catch (err) {
    console.warn(`[Kafka] Connection to Aiven Kafka failed (${err.message}). Using local event bus.`);
    isConnected = false;
    producer = null;
    return null;
  }
}

export function isLiveKafka() {
  return isConnected;
}

export async function publishEvent(topic, message, key = null) {
  const payload = typeof message === 'string' ? message : JSON.stringify(message);
  const eventObj = typeof message === 'string' ? JSON.parse(message) : message;

  // 1. Try publishing to real Aiven Kafka
  try {
    const prod = await getKafkaProducer();
    if (prod) {
      const record = {
        value: payload,
      };
      if (key) record.key = String(key);

      const result = await prod.send({
        topic,
        messages: [record],
      });

      console.log(`[Kafka -> ${topic}] Published event ${eventObj.eventId || key || 'N/A'} to Aiven Kafka.`);
      return { success: true, mode: 'aiven', result };
    }
  } catch (err) {
    console.error(`[Kafka -> ${topic}] Publish error (${err.message}). Falling back to local bus.`);
  }

  // 2. Publish to local event bus fallback
  console.log(`[LocalBus -> ${topic}] Dispatched event ${eventObj.eventId || key || 'N/A'}`);
  localEventBus.emit(topic, {
    topic,
    key: key ? String(key) : null,
    value: payload,
    timestamp: Date.now(),
    parsed: eventObj,
  });

  return { success: true, mode: 'fallback' };
}

export function createKafkaConsumer(groupId = config.kafka.groupId) {
  if (!kafka) {
    kafka = new Kafka(buildKafkaConfig());
  }
  return kafka.consumer({ groupId });
}
