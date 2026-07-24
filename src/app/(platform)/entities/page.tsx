'use client';

import { useState, useMemo } from 'react';
import { ConfidenceBar } from '@/components/confidence-bar';
import { IntBadge } from '@/components/int-badge';
import type { Entity } from '@/lib/types';

const MOCK_ENTITIES: Entity[] = [
  { id: 'GZM-ENT-4471', name: 'MV CASPIAN STAR', type: 'Maritime Vessel', threat_score: 0.87, confidence: 0.64, convergence_score: 0.91, last_observed: '2026-07-24T14:22:00Z', location: { lat: 34.05, lon: -118.24 }, sources: [{ discipline: 'OSINT', detail: 'AIS transponder dark since 14:22Z', timestamp: '4.2h', confidence: 0.9 }, { discipline: 'SIGINT', detail: 'HF burst 8.291MHz detected', timestamp: '2.1h', confidence: 0.7 }, { discipline: 'MASINT', detail: 'SAR return confirmed at location', timestamp: '1.8h', confidence: 0.85 }] },
  { id: 'GZM-ENT-3891', name: 'Al-Rashid Trading FZE', type: 'Organization', threat_score: 0.72, confidence: 0.81, convergence_score: 0.67, last_observed: '2026-07-24T12:00:00Z', sources: [{ discipline: 'OSINT', detail: 'OFAC SDN ownership chain match', timestamp: '12d', confidence: 0.82 }, { discipline: 'FININT', detail: 'Wire transfer to sanctioned port agent', timestamp: '3d', confidence: 0.75 }] },
  { id: 'GZM-ENT-5102', name: 'Bandar Abbas Port Complex', type: 'Facility', threat_score: 0.55, confidence: 0.73, convergence_score: 0.58, last_observed: '2026-07-24T16:00:00Z', sources: [{ discipline: 'GEOINT', detail: 'Satellite imagery shows increased activity', timestamp: '6h', confidence: 0.7 }] },
  { id: 'GZM-ENT-2744', name: 'Captain Mohammad Ahmadi', type: 'Person', threat_score: 0.48, confidence: 0.55, convergence_score: 0.33, last_observed: '2026-07-20T09:00:00Z', sources: [{ discipline: 'HUMINT', detail: 'Port records show as vessel master', timestamp: '4d', confidence: 0.6 }] },
  { id: 'GZM-ENT-6233', name: 'Dubai Shell Corporation Ltd', type: 'Organization', threat_score: 0.65, confidence: 0.70, convergence_score: 0.52, last_observed: '2026-07-22T14:00:00Z', sources: [{ discipline: 'FININT', detail: 'Shell company registered 2024, no employees', timestamp: '2d', confidence: 0.8 }, { discipline: 'OSINT', detail: 'Director linked to IRGC network', timestamp: '12d', confidence: 0.6 }] },
  { id: 'GZM-ENT-1899', name: 'Black Sea HF Emitter', type: 'Signal', threat_score: 0.60, confidence: 0.42, convergence_score: 0.45, last_observed: '2026-07-24T17:45:00Z', sources: [{ discipline: 'SIGINT', detail: '4x normal HF activity since 0600Z', timestamp: '20m', confidence: 0.65 }] },
  { id: 'GZM-ENT-7811', name: 'Suspected Arms Depot Facility', type: 'Facility', threat_score: 0.78, confidence: 0.38, convergence_score: 0.72, last_observed: '2026-07-23T08:00:00Z', sources: [{ discipline: 'IMINT', detail: 'Drone detection pending confirmation', timestamp: 'PEND', confidence: 0.4 }, { discipline: 'SIGINT', detail: 'RF activity consistent with military comms', timestamp: '1d', confidence: 0.5 }] },
  { id: 'GZM-ENT-9045', name: 'IRGC Quds Force Network', type: 'Organization', threat_score: 0.92, confidence: 0.88, convergence_score: 0.95, last_observed: '2026-07-24T11:00:00Z', sources: [{ discipline: 'OSINT', detail: 'Treasury designation, multiple fronts identified', timestamp: '30d', confidence: 0.95 }, { discipline: 'SIGINT', detail: 'Comms intercept linking to vessel operations', timestamp: '5d', confidence: 0.7 }, { discipline: 'HUMINT', detail: 'Source reporting on logistics chain', timestamp: '14d', confidence: 0.6 }] },
];

type SortKey = 'name' | 'threat_score' | 'confidence' | 'convergence_score' | 'last_observed';

export default function EntitiesPage() {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('threat_score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const types = useMemo(() => ['all', ...new Set(MOCK_ENTITIES.map((e) => e.type))], []);

  const sorted = useMemo(() => {
    let data = MOCK_ENTITIES.filter((e) =>
      (typeFilter === 'all' || e.type === typeFilter) &&
      (search === '' || e.name.toLowerCase().includes(search.toLowerCase()) || e.id.toLowerCase().includes(search.toLowerCase()))
    );
    data.sort((a, b) => {
      const av = a[sortKey] as any;
      const bv = b[sortKey] as any;
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return data;
  }, [search, sortKey, sortDir, typeFilter]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <th onClick={() => handleSort(field)} style={{ padding: '10px 12px', textAlign: 'left', cursor: 'pointer', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: sortKey === field ? 'var(--accent)' : 'var(--text-muted)', userSelect: 'none', whiteSpace: 'nowrap' }}>
      {label} {sortKey === field ? (sortDir === 'desc' ? '\u25BC' : '\u25B2') : ''}
    </th>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h1 style={{ fontSize: 'var(--text-md)', fontWeight: 700, marginRight: '16px' }}>Entities</h1>
        <input
          type="text" placeholder="Search by name or ID..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border-default)', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', color: 'var(--text-primary)', width: '240px', outline: 'none' }}
        />
        <select
          value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border-default)', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}
        >
          {types.map((t) => <option key={t} value={t}>{t === 'all' ? 'All Types' : t}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>{sorted.length} results</div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, background: 'var(--surface-1)', zIndex: 1 }}>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <SortHeader label="Entity" field="name" />
              <th style={{ padding: '10px 12px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Type</th>
              <SortHeader label="Threat" field="threat_score" />
              <SortHeader label="Confidence" field="confidence" />
              <SortHeader label="Convergence" field="convergence_score" />
              <th style={{ padding: '10px 12px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Sources</th>
              <SortHeader label="Last Seen" field="last_observed" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((entity) => {
              const threatColor = entity.threat_score >= 0.8 ? 'var(--red)' : entity.threat_score >= 0.5 ? 'var(--amber)' : 'var(--green)';
              const timeSince = Math.round((Date.now() - new Date(entity.last_observed).getTime()) / 3600000);
              return (
                <tr key={entity.id} style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'background 100ms' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{entity.name}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{entity.id}</div>
                  </td>
                  <td style={{ padding: '12px', fontSize: '11px', color: 'var(--text-secondary)' }}>{entity.type}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: threatColor }}>{entity.threat_score.toFixed(2)}</span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ConfidenceBar value={entity.confidence} width={48} />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>{entity.confidence.toFixed(2)}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: entity.convergence_score >= 0.8 ? 'var(--red)' : 'var(--text-secondary)' }}>{entity.convergence_score.toFixed(2)}</span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {entity.sources.map((s, i) => <IntBadge key={i} discipline={s.discipline} size="xs" />)}
                    </div>
                  </td>
                  <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>{timeSince}h ago</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
