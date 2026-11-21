import { broadcastSystemActivity } from './sseService.js';
import { query } from '../config/postgres.js';
import { v4 as uuidv4 } from 'uuid';

const MAX_KAFKA_EVENTS = 30;

class ActivityLogger {
  constructor() {
    this.kafkaEvents = [];
    this.lastOpenSearch = {
      queryDsl: null,
      options: null,
      hitsCount: 0,
      executionTimeMs: 0,
      mode: 'N/A',
      timestamp: new Date().toISOString(),
    };
    this.lastPostgresTx = {
      txType: 'None',
      status: 'IDLE',
      durationMs: 0,
      queries: [],
      affectedRows: 0,
      details: {},
      timestamp: new Date().toISOString(),
    };
  }

  logKafkaEvent(topic, eventData, source = 'KafkaConsumer') {
    const entry = {
      id: eventData.eventId || uuidv4(),
      topic,
      source,
      timestamp: new Date().toISOString(),
      key: eventData.orderId || eventData.productId || 'system',
      summary: eventData.summary || `Event on ${topic}`,
      payload: eventData,
    };

    this.kafkaEvents.unshift(entry);
    if (this.kafkaEvents.length > MAX_KAFKA_EVENTS) {
      this.kafkaEvents.pop();
    }

    // Persist to Postgres system_logs (asynchronous, non-blocking)
    query('INSERT INTO system_logs (id, event_type, details) VALUES ($1, $2, $3)', [
      entry.id,
      topic,
      JSON.stringify(entry),
    ]).catch(() => {});

    broadcastSystemActivity({
      type: 'KAFKA_EVENT',
      event: entry,
      allEvents: this.kafkaEvents.slice(0, 10),
    });

    return entry;
  }

  logOpenSearchQuery(dsl, options, hitsCount, executionTimeMs, mode = 'aiven') {
    this.lastOpenSearch = {
      queryDsl: dsl,
      options,
      hitsCount,
      executionTimeMs,
      mode,
      timestamp: new Date().toISOString(),
    };

    broadcastSystemActivity({
      type: 'OPENSEARCH_QUERY',
      openSearch: this.lastOpenSearch,
    });
  }

  logPostgresTransaction(txType, status, queries, affectedRows, durationMs, details = {}) {
    this.lastPostgresTx = {
      txType,
      status,
      durationMs,
      queries: Array.isArray(queries) ? queries : [queries],
      affectedRows,
      details,
      timestamp: new Date().toISOString(),
    };

    broadcastSystemActivity({
      type: 'POSTGRES_TRANSACTION',
      postgresTx: this.lastPostgresTx,
    });
  }

  getSnapshot() {
    return {
      kafkaEvents: this.kafkaEvents,
      lastOpenSearch: this.lastOpenSearch,
      lastPostgresTx: this.lastPostgresTx,
    };
  }
}

export const activityLogger = new ActivityLogger();
