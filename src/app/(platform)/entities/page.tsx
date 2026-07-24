'use client';

import { useState, useCallback } from 'react';
import { gzmApi, type QueryResult, type DossierResponse } from '@/lib/api';

const VERTEX_COLORS: Record<string, string> = {
  SanctionsEntity: '#ef4444', SanctionedEntity: '#ef4444',
  ThreatActor: '#a855f7', CyberEntity: '#a855f7',
  Country: '#06b6d4', Organization: '#10b981',
  Person: '#3b82f6', Vessel: '#38bdf8',
  ConvergenceAlert: '#f97316', MilitaryFlight: '#8b5cf6',
  GeopoliticalEvent: '#eab308', MarketSignal: '#34d399',
};

export default function EntitiesPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<QueryResult['results']>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<DossierResponse | null>(null);
  const [dossierLoading, setDossierLoading] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSelectedEntity(null);
    const data = await gzmApi.query(query.trim());
    setResults(data?.results || []);
    setLoading(false);
  }, [query]);

  const loadDossier = useCallback(async (name: string) => {
    setDossierLoading(true);
    const data = await gzmApi.dossier(name);
    if (data) setSelectedEntity(data);
    setDossierLoading(false);
  }, []);

  const riskColor = (score: number) =>
    score > 0.7 ? '#ef4444' : score > 0.4 ? '#f59e0b' : '#10b981';

  return (
    <div className="flex h-[calc(100vh-40px)]">
      {/* Left: Search + Results */}
      <div className="flex-1 p-6 overflow-y-auto">
        <h1 className="text-[20px] font-bold text-white tracking-tight mb-1">Entity Intelligence</h1>
        <p className="text-[12px] mb-5" style={{ color: 'rgba(240,240,255,0.45)' }}>
          Search across 78 vertex types \u00b7 13M+ entities \u00b7 44.5M relationships
        </p>

        {/* Search */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search: OVLAS TRADING, APT28, Russia, Iran..."
            className="flex-1 px-4 py-2.5 rounded-lg text-[12px] text-white placeholder:text-[rgba(240,240,255,0.25)] outline-none focus:ring-1 focus:ring-cyan-500/40"
            style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.06)' }}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-5 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-opacity hover:opacity-85 disabled:opacity-50"
            style={{ background: '#22d3ee', color: '#0a0a0f' }}
          >
            {loading ? 'Searching...' : 'Search Graph'}
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-1">
            <div className="text-[10px] mb-2" style={{ color: 'rgba(240,240,255,0.3)' }}>
              {results.length} results
            </div>
            {results.map((r, i) => {
              const color = VERTEX_COLORS[r.vertex_type || ''] || '#6b7280';
              return (
                <button
                  key={r.vertex_id || i}
                  onClick={() => loadDossier(r.name || r.vertex_id || '')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left hover:bg-[rgba(255,255,255,0.03)] transition-colors"
                  style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: `${color}15`, color }}>
                    {r.vertex_type || '?'}
                  </span>
                  <span className="text-[13px] text-white font-medium truncate flex-1">
                    {r.name || r.vertex_id}
                  </span>
                  {r.country && (
                    <span className="text-[10px] flex-shrink-0" style={{ color: 'rgba(240,240,255,0.35)' }}>
                      {r.country}
                    </span>
                  )}
                  {r.connections && (
                    <span className="text-[9px] font-mono tabular-nums flex-shrink-0" style={{ color: 'rgba(240,240,255,0.25)' }}>
                      {r.connections} links
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {!loading && results.length === 0 && query && (
          <div className="text-center py-16 text-[12px]" style={{ color: 'rgba(240,240,255,0.3)' }}>
            No entities found. Try: "Russia", "APT28", "OVLAS TRADING"
          </div>
        )}
      </div>

      {/* Right: Dossier Panel (Intelligence Card) */}
      {selectedEntity && (
        <div
          className="w-[380px] flex-shrink-0 overflow-y-auto p-5"
          style={{ background: '#0d0d18', borderLeft: '1px solid rgba(255,255,255,0.06)' }}
        >
          {dossierLoading ? (
            <div className="text-[12px] animate-pulse" style={{ color: 'rgba(240,240,255,0.4)' }}>Loading dossier...</div>
          ) : (
            <>
              <button onClick={() => setSelectedEntity(null)} className="text-[11px] mb-4 hover:text-white" style={{ color: 'rgba(240,240,255,0.4)' }}>
                \u2715 Close
              </button>

              <h2 className="text-[16px] font-bold text-white mb-1 break-words">{selectedEntity.entity_name}</h2>
              <div className="text-[9px] uppercase tracking-wider mb-5" style={{ color: 'rgba(240,240,255,0.3)' }}>
                {selectedEntity.labels?.join(' \u00b7 ')}
              </div>

              {/* Risk Score */}
              {selectedEntity.risk_score != null && (
                <div className="mb-5">
                  <div className="flex justify-between text-[9px] uppercase tracking-wide mb-1" style={{ color: 'rgba(240,240,255,0.3)' }}>
                    <span>Risk Score</span>
                    <span style={{ color: riskColor(selectedEntity.risk_score) }}>
                      {(selectedEntity.risk_score * 100).toFixed(0)}/100
                    </span>
                  </div>
                  <div className="text-[28px] font-bold tabular-nums mb-2" style={{ color: riskColor(selectedEntity.risk_score) }}>
                    {selectedEntity.risk_score.toFixed(3)}
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, selectedEntity.risk_score * 100)}%`, background: riskColor(selectedEntity.risk_score) }}
                    />
                  </div>
                </div>
              )}

              {/* Key Facts */}
              <div className="space-y-1.5 mb-5">
                <Fact label="Connections" value={String(selectedEntity.connections || 0)} />
                <Fact label="Sources" value={String(selectedEntity.sources?.length || 0)} />
                <Fact label="Confidence" value={selectedEntity.confidence_grade || '\u2014'} />
                {selectedEntity.sanctions_status && (
                  <Fact label="Sanctions" value={selectedEntity.sanctions_status.program} color="#ef4444" />
                )}
                {selectedEntity.network_risk != null && (
                  <Fact label="Network Risk" value={`${(selectedEntity.network_risk).toFixed(1)}`} />
                )}
                {selectedEntity.evidence_count != null && (
                  <Fact label="Evidence Items" value={String(selectedEntity.evidence_count)} />
                )}
              </div>

              {/* Domains */}
              {selectedEntity.domains_present?.length > 0 && (
                <div className="mb-5">
                  <div className="text-[9px] uppercase tracking-wide mb-2" style={{ color: 'rgba(240,240,255,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '4px' }}>
                    Active Domains
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedEntity.domains_present.map(d => (
                      <span key={d} className="text-[8px] font-bold uppercase px-2 py-0.5 rounded" style={{ background: 'rgba(34,211,238,0.08)', color: '#22d3ee' }}>
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Relationships */}
              {selectedEntity.offshore_connections?.length > 0 && (
                <div>
                  <div className="text-[9px] uppercase tracking-wide mb-2" style={{ color: 'rgba(240,240,255,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '4px' }}>
                    Relationships ({selectedEntity.offshore_connections.length})
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {selectedEntity.offshore_connections.slice(0, 20).map((rel, i) => (
                      <button
                        key={i}
                        onClick={() => loadDossier(rel.target_id)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-[10px] hover:bg-[rgba(255,255,255,0.03)] transition-colors"
                      >
                        <span className="font-mono text-[8px] px-1 rounded" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(240,240,255,0.4)' }}>
                          {rel.edge_type?.substring(0, 12)}
                        </span>
                        <span className="truncate" style={{ color: '#22d3ee' }}>{rel.target_id}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Fact({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between text-[11px] py-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
      <span style={{ color: 'rgba(240,240,255,0.4)' }}>{label}</span>
      <span className="font-semibold tabular-nums" style={{ color: color || 'white' }}>{value}</span>
    </div>
  );
}
