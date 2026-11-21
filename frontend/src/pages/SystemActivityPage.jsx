import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  Cpu,
  Search,
  Database,
  Radio,
  CheckCircle2,
  Clock,
  Code,
  ArrowRight,
  Terminal,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api.js';
import { useSse } from '../contexts/SseContext.jsx';

export default function SystemActivityPage() {
  const { t } = useTranslation();
  const { isConnected, subscribeSystemActivity } = useSse();

  const [kafkaEvents, setKafkaEvents] = useState([]);
  const [lastOpenSearch, setLastOpenSearch] = useState(null);
  const [lastPostgresTx, setLastPostgresTx] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch initial activity snapshot
  useEffect(() => {
    api.getSystemActivity()
      .then(data => {
        if (data.kafkaEvents) setKafkaEvents(data.kafkaEvents);
        if (data.lastOpenSearch) setLastOpenSearch(data.lastOpenSearch);
        if (data.lastPostgresTx) setLastPostgresTx(data.lastPostgresTx);
      })
      .catch(err => console.error('Failed to fetch activity snapshot:', err))
      .finally(() => setLoading(false));
  }, []);

  // Listen to real-time updates via SSE
  useEffect(() => {
    const unsubscribe = subscribeSystemActivity((payload) => {
      if (payload.type === 'KAFKA_EVENT') {
        setKafkaEvents(prev => [payload.event, ...prev.slice(0, 24)]);
      } else if (payload.type === 'OPENSEARCH_QUERY') {
        setLastOpenSearch(payload.openSearch);
      } else if (payload.type === 'POSTGRES_TRANSACTION') {
        setLastPostgresTx(payload.postgresTx);
      }
    });

    return () => unsubscribe();
  }, [subscribeSystemActivity]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
              <Activity className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Live Hackathon Demo Proof
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('systemActivity.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('systemActivity.subtitle')}
          </p>
        </div>

        {/* Live SSE Badge */}
        <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border shadow-xs ${
          isConnected
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
            : 'bg-amber-50 text-amber-800 border-amber-300'
        }`}>
          <Radio className={`w-3.5 h-3.5 ${isConnected ? 'animate-pulse text-emerald-600' : 'text-amber-500'}`} />
          <span>{isConnected ? t('systemActivity.liveStream') : 'Connecting stream...'}</span>
        </div>
      </div>

      {/* Grid of the 3 Aiven Services */}
      <div className="space-y-8">
        {/* 1. Aiven Apache Kafka Stream */}
        <section className="bg-slate-900 text-slate-100 rounded-3xl border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-500/20 text-orange-400 rounded-xl border border-orange-500/30">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-wide">
                  {t('systemActivity.kafkaTitle')}
                </h2>
                <p className="text-xs text-slate-400">{t('systemActivity.kafkaSub')}</p>
              </div>
            </div>

            <span className="text-[11px] font-mono text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-md border border-orange-500/20">
              {kafkaEvents.length} events logged
            </span>
          </div>

          {kafkaEvents.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4">{t('systemActivity.noEvents')}</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2 divide-y divide-slate-800/80">
              {kafkaEvents.map((ev, i) => (
                <div key={ev.id || i} className="pt-3 first:pt-0 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px]">
                        {ev.topic}
                      </span>
                      <span className="text-slate-400 text-[11px] font-mono">
                        Key: {ev.key}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200">{ev.summary}</p>

                  {/* Collapsible/Formatted Payload */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-36">
                    <pre>{JSON.stringify(ev.payload, null, 2)}</pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 2. Aiven OpenSearch Live Query Inspector */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-wide">
                  {t('systemActivity.openSearchTitle')}
                </h2>
                <p className="text-xs text-slate-500">{t('systemActivity.openSearchSub')}</p>
              </div>
            </div>

            {lastOpenSearch && (
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg">
                  {lastOpenSearch.hitsCount} hits
                </span>
                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-mono rounded-lg">
                  {lastOpenSearch.executionTimeMs} ms
                </span>
              </div>
            )}
          </div>

          {!lastOpenSearch?.queryDsl ? (
            <p className="text-xs text-slate-500 italic py-4">{t('systemActivity.noQuery')}</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-semibold">Last Search Parameters:</span>
                  <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                    "{lastOpenSearch.options?.q || 'All'}" | Lang: {lastOpenSearch.options?.lang} | Instant: {String(lastOpenSearch.options?.instantOnly)}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Engine: {lastOpenSearch.mode === 'aiven' ? 'Aiven OpenSearch Cluster' : 'OpenSearch Emulation Engine'}
                </span>
              </div>

              {/* Formatted JSON DSL */}
              <div className="bg-slate-900 text-emerald-400 p-4 rounded-2xl border border-slate-800 font-mono text-xs overflow-x-auto max-h-72 shadow-inner">
                <pre>{JSON.stringify(lastOpenSearch.queryDsl, null, 2)}</pre>
              </div>
            </div>
          )}
        </section>

        {/* 3. Aiven PostgreSQL Transaction Audit */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-wide">
                  {t('systemActivity.postgresTitle')}
                </h2>
                <p className="text-xs text-slate-500">{t('systemActivity.postgresSub')}</p>
              </div>
            </div>

            {lastPostgresTx && (
              <div className="flex items-center gap-2 text-xs">
                <span className={`px-2.5 py-1 font-bold rounded-lg ${
                  lastPostgresTx.status === 'COMMITTED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {lastPostgresTx.status}
                </span>
                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-mono rounded-lg">
                  {lastPostgresTx.durationMs} ms
                </span>
              </div>
            )}
          </div>

          {!lastPostgresTx?.queries || lastPostgresTx.queries.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4">{t('systemActivity.noTx')}</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold">Isolation Level:</span>
                  <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                    READ COMMITTED (Row-Level Locking on store_inventory)
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Rows Affected: {lastPostgresTx.affectedRows}
                </span>
              </div>

              {/* SQL Statements Executed */}
              <div className="bg-slate-900 text-blue-300 p-4 rounded-2xl border border-slate-800 font-mono text-xs overflow-x-auto space-y-1.5 shadow-inner">
                {lastPostgresTx.queries.map((q, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-slate-500 select-none">{idx + 1}.</span>
                    <span className={q.includes('COMMIT') ? 'text-emerald-400 font-bold' : q.includes('ROLLBACK') ? 'text-red-400 font-bold' : 'text-slate-200'}>
                      {q}
                    </span>
                  </div>
                ))}
              </div>

              {lastPostgresTx.details && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 font-mono">
                  <pre>{JSON.stringify(lastPostgresTx.details, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
