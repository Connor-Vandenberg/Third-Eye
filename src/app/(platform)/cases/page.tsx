'use client';

import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface CaseEntity {
  id: string;
  name: string;
  type: string;
  role: string;
}

interface CaseEvidence {
  id: string;
  source: string;
  type: string;
  summary: string;
  timestamp: string;
  confidence: number;
  collector: string;
}

interface CaseTimeline {
  timestamp: string;
  event: string;
  actor: string;
  type: 'creation' | 'update' | 'evidence' | 'escalation' | 'resolution';
}

interface InvestigationCase {
  id: string;
  title: string;
  status: 'open' | 'active' | 'pending' | 'escalated' | 'resolved' | 'closed';
  priority: number;
  category: string;
  region: string;
  description: string;
  hypothesis: string;
  entities: CaseEntity[];
  evidence: CaseEvidence[];
  timeline: CaseTimeline[];
  signals_linked: number;
  assigned_to: string;
  created_at: string;
  updated_at: string;
  convergence_score: number;
  threat_level: number;
  tags: string[];
}

interface CasesState {
  cases: InvestigationCase[];
  loading: boolean;
  error: string | null;
  selectedCase: InvestigationCase | null;
  filter: {
    status: string | null;
    priority: number | null;
  };
  creating: boolean;
  detailTab: 'overview' | 'evidence' | 'timeline' | 'entities';
}

// ============================================================================
// CONSTANTS
// ============================================================================

const GZM_API = process.env.NEXT_PUBLIC_GZM_API_URL || 'http://localhost:8000';

const STATUS_CONFIG: Record<string, { color: string; label: string; bg: string }> = {
  open: { color: 'var(--accent)', label: 'OPEN', bg: 'var(--accent-subtle)' },
  active: { color: 'var(--green)', label: 'ACTIVE', bg: 'oklch(0.22 0.04 145)' },
  pending: { color: 'var(--yellow)', label: 'PENDING', bg: 'oklch(0.25 0.04 85)' },
  escalated: { color: 'var(--red)', label: 'ESCALATED', bg: 'oklch(0.25 0.05 25)' },
  resolved: { color: 'var(--text-tertiary)', label: 'RESOLVED', bg: 'var(--surface-1)' },
  closed: { color: 'var(--text-tertiary)', label: 'CLOSED', bg: 'var(--surface-1)' },
};

const PRIORITY_LABELS: Record<number, string> = { 1: 'CRITICAL', 2: 'HIGH', 3: 'MEDIUM', 4: 'LOW', 5: 'INFO' };
const PRIORITY_COLORS: Record<number, string> = { 1: 'var(--red)', 2: 'oklch(0.75 0.18 50)', 3: 'var(--yellow)', 4: 'var(--green)', 5: 'var(--text-tertiary)' };

// ============================================================================
// COMPONENT
// ============================================================================

export default function CasesPage() {
  const [state, setState] = useState<CasesState>({
    cases: [],
    loading: true,
    error: null,
    selectedCase: null,
    filter: { status: null, priority: null },
    creating: false,
    detailTab: 'overview',
  });

  // ──────────────────────────────────────────────────────────────────────────
  // DATA FETCHING
  // ──────────────────────────────────────────────────────────────────────────

  const fetchCases = useCallback(async () => {
    try {
      const res = await fetch(`${GZM_API}/cases`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setState(prev => ({ ...prev, cases: data.cases || data || [], loading: false, error: null }));
    } catch (err) {
      setState(prev => ({ ...prev, loading: false, error: err instanceof Error ? err.message : 'Failed to load cases' }));
    }
  }, []);

  const createCase = useCallback(async () => {
    setState(prev => ({ ...prev, creating: true }));
    try {
      const res = await fetch(`${GZM_API}/cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Investigation',
          status: 'open',
          priority: 3,
          category: 'Gray Zone Activity',
          description: '',
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const newCase = await res.json();
      setState(prev => ({ ...prev, cases: [newCase, ...prev.cases], creating: false, selectedCase: newCase }));
    } catch (err) {
      setState(prev => ({ ...prev, creating: false, error: err instanceof Error ? err.message : 'Failed to create case' }));
    }
  }, []);

  useEffect(() => { fetchCases(); }, [fetchCases]);
  useEffect(() => {
    const interval = setInterval(fetchCases, 30_000);
    return () => clearInterval(interval);
  }, [fetchCases]);

  // ──────────────────────────────────────────────────────────────────────────
  // FILTERING
  // ──────────────────────────────────────────────────────────────────────────

  const filteredCases = state.cases.filter(c => {
    if (state.filter.status && c.status !== state.filter.status) return false;
    if (state.filter.priority && c.priority !== state.filter.priority) return false;
    return true;
  });

  const statusCounts = state.cases.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────

  const sc = state.selectedCase;
  const tabStyle = (tab: string) => ({
    padding: '6px 12px',
    fontSize: '11px',
    fontFamily: 'var(--font-mono)' as const,
    fontWeight: 600 as const,
    borderRadius: '4px',
    border: 'none' as const,
    cursor: 'pointer' as const,
    background: state.detailTab === tab ? 'var(--accent-subtle)' : 'transparent',
    color: state.detailTab === tab ? 'var(--accent)' : 'var(--text-tertiary)',
    transition: 'all 150ms',
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', height: '100%', overflow: 'hidden' }}>
      {/* LEFT: Case List */}
      <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-subtle)' }}>
        {/* Header */}
        <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h1 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Cases</h1>
            <button
              onClick={createCase}
              disabled={state.creating}
              style={{
                padding: '5px 12px', borderRadius: '6px', border: 'none',
                background: 'var(--accent)', color: 'var(--surface-0)',
                fontSize: '11px', fontWeight: 600, cursor: 'pointer',
              }}
            >{state.creating ? '...' : '+ New'}</button>
          </div>

          {/* Status pills */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setState(prev => ({ ...prev, filter: { ...prev.filter, status: null } }))}
              style={{
                padding: '3px 8px', borderRadius: '10px', border: '1px solid var(--border-subtle)',
                background: !state.filter.status ? 'var(--accent-subtle)' : 'transparent',
                color: !state.filter.status ? 'var(--accent)' : 'var(--text-tertiary)',
                fontSize: '10px', fontFamily: 'var(--font-mono)', cursor: 'pointer',
              }}
            >ALL ({state.cases.length})</button>
            {Object.entries(STATUS_CONFIG).filter(([k]) => statusCounts[k]).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setState(prev => ({ ...prev, filter: { ...prev.filter, status: key } }))}
                style={{
                  padding: '3px 8px', borderRadius: '10px', border: '1px solid var(--border-subtle)',
                  background: state.filter.status === key ? cfg.bg : 'transparent',
                  color: state.filter.status === key ? cfg.color : 'var(--text-tertiary)',
                  fontSize: '10px', fontFamily: 'var(--font-mono)', cursor: 'pointer',
                }}
              >{cfg.label} ({statusCounts[key]})</button>
            ))}
          </div>
        </div>

        {/* Case List */}
        <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
          {state.loading && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
              LOADING CASES...
            </div>
          )}
          {filteredCases.map((c, idx) => {
            const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.open;
            return (
              <div
                key={c.id || idx}
                onClick={() => setState(prev => ({ ...prev, selectedCase: c, detailTab: 'overview' }))}
                style={{
                  padding: '12px 14px', marginBottom: '6px', borderRadius: '8px',
                  background: sc?.id === c.id ? 'var(--accent-subtle)' : 'var(--surface-1)',
                  border: `1px solid ${sc?.id === c.id ? 'var(--accent)' : 'var(--border-subtle)'}`,
                  cursor: 'pointer', transition: 'all 150ms',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{
                    width: '7px', height: '7px', borderRadius: '50%', background: cfg.color,
                  }} />
                  <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: PRIORITY_COLORS[c.priority], fontWeight: 700 }}>
                    {PRIORITY_LABELS[c.priority]}
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                    {c.signals_linked || 0} signals
                  </span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px', lineHeight: 1.3 }}>
                  {c.title}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                  {c.region} · {c.entities?.length || 0} entities · {c.updated_at ? new Date(c.updated_at).toLocaleDateString() : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Case Detail */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!sc ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-tertiary)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.3 }}>📋</div>
              <p style={{ fontSize: '13px' }}>Select a case to investigate</p>
            </div>
          </div>
        ) : (
          <>
            {/* Case Header */}
            <div style={{ padding: '20px 24px 12px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{
                  padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700,
                  fontFamily: 'var(--font-mono)', background: STATUS_CONFIG[sc.status]?.bg, color: STATUS_CONFIG[sc.status]?.color,
                }}>{STATUS_CONFIG[sc.status]?.label}</span>
                <span style={{
                  padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700,
                  fontFamily: 'var(--font-mono)', color: PRIORITY_COLORS[sc.priority],
                  background: `color-mix(in oklch, ${PRIORITY_COLORS[sc.priority]} 15%, transparent)`,
                }}>{PRIORITY_LABELS[sc.priority]}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                  ID: {sc.id?.slice(0, 8) || 'N/A'}
                </span>
              </div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>{sc.title}</h2>
              <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', margin: 0 }}>
                {sc.category} · {sc.region} · Assigned: {sc.assigned_to || 'Unassigned'}
              </p>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: '4px', marginTop: '14px' }}>
                <button onClick={() => setState(prev => ({ ...prev, detailTab: 'overview' }))} style={tabStyle('overview')}>Overview</button>
                <button onClick={() => setState(prev => ({ ...prev, detailTab: 'evidence' }))} style={tabStyle('evidence')}>Evidence ({sc.evidence?.length || 0})</button>
                <button onClick={() => setState(prev => ({ ...prev, detailTab: 'timeline' }))} style={tabStyle('timeline')}>Timeline</button>
                <button onClick={() => setState(prev => ({ ...prev, detailTab: 'entities' }))} style={tabStyle('entities')}>Entities ({sc.entities?.length || 0})</button>
              </div>
            </div>

            {/* Tab Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
              {state.detailTab === 'overview' && (
                <div>
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>DESCRIPTION</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6 }}>{sc.description || 'No description provided.'}</p>
                  </div>
                  {sc.hypothesis && (
                    <div style={{ marginBottom: '20px', padding: '12px 16px', borderRadius: '8px', background: 'var(--accent-subtle)', borderLeft: '3px solid var(--accent)' }}>
                      <h3 style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>HYPOTHESIS</h3>
                      <p style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.5 }}>{sc.hypothesis}</p>
                    </div>
                  )}
                  {/* Metrics */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--surface-1)', textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{sc.signals_linked || 0}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>SIGNALS</div>
                    </div>
                    <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--surface-1)', textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{Math.round((sc.convergence_score || 0) * 100)}%</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>CONVERGENCE</div>
                    </div>
                    <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--surface-1)', textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: sc.threat_level >= 0.7 ? 'var(--red)' : 'var(--yellow)', fontFamily: 'var(--font-mono)' }}>{Math.round((sc.threat_level || 0) * 100)}%</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>THREAT</div>
                    </div>
                  </div>
                  {/* Tags */}
                  {sc.tags?.length > 0 && (
                    <div>
                      <h3 style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>TAGS</h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {sc.tags.map((t, i) => (
                          <span key={i} style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '10px', background: 'var(--surface-1)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>#{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {state.detailTab === 'evidence' && (
                <div>
                  {(!sc.evidence || sc.evidence.length === 0) ? (
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>No evidence collected yet.</p>
                  ) : sc.evidence.map((ev, i) => (
                    <div key={i} style={{
                      padding: '12px 14px', marginBottom: '8px', borderRadius: '8px',
                      background: 'var(--surface-1)', border: '1px solid var(--border-subtle)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 600 }}>{ev.type?.toUpperCase()}</span>
                        <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{ev.source}</span>
                        <span style={{ marginLeft: 'auto', fontSize: '10px', fontFamily: 'var(--font-mono)', color: ev.confidence >= 0.8 ? 'var(--green)' : 'var(--yellow)' }}>
                          {Math.round(ev.confidence * 100)}%
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>{ev.summary}</p>
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: '6px' }}>
                        Collector: {ev.collector} · {ev.timestamp ? new Date(ev.timestamp).toLocaleString() : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {state.detailTab === 'timeline' && (
                <div style={{ position: 'relative', paddingLeft: '20px' }}>
                  <div style={{ position: 'absolute', left: '6px', top: 0, bottom: 0, width: '2px', background: 'var(--border-subtle)' }} />
                  {(!sc.timeline || sc.timeline.length === 0) ? (
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>No timeline events.</p>
                  ) : sc.timeline.map((ev, i) => (
                    <div key={i} style={{ position: 'relative', marginBottom: '16px', paddingLeft: '12px' }}>
                      <div style={{
                        position: 'absolute', left: '-16px', top: '4px',
                        width: '10px', height: '10px', borderRadius: '50%',
                        background: ev.type === 'escalation' ? 'var(--red)' : ev.type === 'evidence' ? 'var(--green)' : 'var(--accent)',
                        border: '2px solid var(--surface-0)',
                      }} />
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginBottom: '2px' }}>
                        {ev.timestamp ? new Date(ev.timestamp).toLocaleString() : ''} · {ev.actor}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{ev.event}</div>
                    </div>
                  ))}
                </div>
              )}

              {state.detailTab === 'entities' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                  {(!sc.entities || sc.entities.length === 0) ? (
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>No entities linked.</p>
                  ) : sc.entities.map((ent, i) => (
                    <div key={i} style={{
                      padding: '10px 12px', borderRadius: '8px',
                      background: 'var(--surface-1)', border: '1px solid var(--border-subtle)',
                    }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{ent.name}</div>
                      <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{ent.type}</div>
                      <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', marginTop: '2px' }}>Role: {ent.role}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
