'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface IntelBrief {
  id: string;
  title: string;
  priority: number;
  category: string;
  narrative: string;
  entities_involved: string[];
  signals_correlated: string[];
  gaps_identified: string[];
  recommended_actions: string[];
  confidence: number;
  generated_at: string;
  region?: string;
  classification: 'UNCLASSIFIED' | 'CUI' | 'SECRET';
  source_count: number;
  convergence_score: number;
}

interface BriefsState {
  briefs: IntelBrief[];
  loading: boolean;
  error: string | null;
  generating: boolean;
  filter: {
    priority: number | null;
    region: string | null;
    category: string | null;
  };
  selectedBrief: IntelBrief | null;
  autoRefresh: boolean;
  lastRefresh: string | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const GZM_API = process.env.NEXT_PUBLIC_GZM_API_URL || 'http://localhost:8000';

const REGIONS = [
  'Indo-Pacific', 'Eastern Europe', 'Middle East', 'Arctic',
  'Sub-Saharan Africa', 'Central Asia', 'South China Sea',
  'Black Sea', 'Baltic States', 'Taiwan Strait',
];

const CATEGORIES = [
  'Escalation Warning', 'Gray Zone Activity', 'Military Movement',
  'Cyber Operation', 'Economic Coercion', 'Information Operation',
  'Maritime Incident', 'Space/Counter-Space', 'Nuclear Signaling',
];

const PRIORITY_COLORS: Record<number, string> = {
  1: 'var(--red)',
  2: 'oklch(0.75 0.18 50)',
  3: 'var(--yellow)',
  4: 'var(--green)',
  5: 'var(--text-tertiary)',
};

const PRIORITY_LABELS: Record<number, string> = {
  1: 'FLASH', 2: 'IMMEDIATE', 3: 'PRIORITY', 4: 'ROUTINE', 5: 'DEFERRED',
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function BriefsPage() {
  const [state, setState] = useState<BriefsState>({
    briefs: [],
    loading: true,
    error: null,
    generating: false,
    filter: { priority: null, region: null, category: null },
    selectedBrief: null,
    autoRefresh: true,
    lastRefresh: null,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ──────────────────────────────────────────────────────────────────────────
  // DATA FETCHING
  // ──────────────────────────────────────────────────────────────────────────

  const fetchBriefs = useCallback(async () => {
    try {
      const res = await fetch(`${GZM_API}/regen/briefs`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setState(prev => ({
        ...prev,
        briefs: data.briefs || data || [],
        loading: false,
        error: null,
        lastRefresh: new Date().toISOString(),
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch briefs',
      }));
    }
  }, []);

  const generateBrief = useCallback(async (region?: string) => {
    setState(prev => ({ ...prev, generating: true }));
    try {
      const res = await fetch(`${GZM_API}/aip/brief`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region: region || null }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const brief = await res.json();
      setState(prev => ({
        ...prev,
        briefs: [brief, ...prev.briefs],
        generating: false,
        selectedBrief: brief,
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        generating: false,
        error: err instanceof Error ? err.message : 'Brief generation failed',
      }));
    }
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  // LIFECYCLE
  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchBriefs();
  }, [fetchBriefs]);

  useEffect(() => {
    if (state.autoRefresh) {
      intervalRef.current = setInterval(fetchBriefs, 60_000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [state.autoRefresh, fetchBriefs]);

  // ──────────────────────────────────────────────────────────────────────────
  // FILTERING
  // ──────────────────────────────────────────────────────────────────────────

  const filteredBriefs = state.briefs.filter(b => {
    if (state.filter.priority && b.priority !== state.filter.priority) return false;
    if (state.filter.region && b.region !== state.filter.region) return false;
    if (state.filter.category && b.category !== state.filter.category) return false;
    return true;
  });

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', height: '100%', overflow: 'hidden' }}>
      {/* LEFT: Brief List */}
      <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-subtle)' }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--surface-1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Intelligence Briefs
              </h1>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: '4px 0 0', fontFamily: 'var(--font-mono)' }}>
                ReGenAI — Autonomous Intelligence Synthesis
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {/* Auto-refresh toggle */}
              <button
                onClick={() => setState(prev => ({ ...prev, autoRefresh: !prev.autoRefresh }))}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  background: state.autoRefresh ? 'var(--accent-subtle)' : 'transparent',
                  color: state.autoRefresh ? 'var(--accent)' : 'var(--text-tertiary)',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  transition: 'all 150ms',
                }}
              >
                {state.autoRefresh ? '● LIVE' : '○ PAUSED'}
              </button>
              {/* Generate brief */}
              <button
                onClick={() => generateBrief()}
                disabled={state.generating}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'var(--accent)',
                  color: 'var(--surface-0)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: state.generating ? 'wait' : 'pointer',
                  opacity: state.generating ? 0.6 : 1,
                  transition: 'all 150ms',
                }}
              >
                {state.generating ? 'Generating...' : '+ New Brief'}
              </button>
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <select
              value={state.filter.priority || ''}
              onChange={e => setState(prev => ({ ...prev, filter: { ...prev.filter, priority: e.target.value ? Number(e.target.value) : null } }))}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--surface-0)',
                color: 'var(--text-secondary)',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <option value="">All Priorities</option>
              {[1,2,3,4,5].map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
            </select>
            <select
              value={state.filter.region || ''}
              onChange={e => setState(prev => ({ ...prev, filter: { ...prev.filter, region: e.target.value || null } }))}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--surface-0)',
                color: 'var(--text-secondary)',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <option value="">All Regions</option>
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select
              value={state.filter.category || ''}
              onChange={e => setState(prev => ({ ...prev, filter: { ...prev.filter, category: e.target.value || null } }))}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--surface-0)',
                color: 'var(--text-secondary)',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Brief List */}
        <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
          {state.loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent)', animation: 'pulse 1.5s infinite' }}>
                LOADING INTELLIGENCE BRIEFS...
              </div>
            </div>
          )}

          {state.error && (
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'oklch(0.25 0.05 25)',
              border: '1px solid var(--red)',
              color: 'var(--red)',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
            }}>
              ERROR: {state.error}
              <button onClick={fetchBriefs} style={{ marginLeft: '12px', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Retry</button>
            </div>
          )}

          {!state.loading && filteredBriefs.length === 0 && !state.error && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
              <p style={{ fontSize: '14px' }}>No briefs match current filters</p>
              <button onClick={() => generateBrief()} style={{
                marginTop: '12px', padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--accent)',
                background: 'transparent', color: 'var(--accent)', cursor: 'pointer', fontSize: '12px',
              }}>Generate First Brief</button>
            </div>
          )}

          {filteredBriefs.map((brief, idx) => (
            <div
              key={brief.id || idx}
              onClick={() => setState(prev => ({ ...prev, selectedBrief: brief }))}
              style={{
                padding: '14px 16px',
                marginBottom: '8px',
                borderRadius: '8px',
                background: state.selectedBrief?.id === brief.id ? 'var(--accent-subtle)' : 'var(--surface-1)',
                border: `1px solid ${state.selectedBrief?.id === brief.id ? 'var(--accent)' : 'var(--border-subtle)'}`,
                cursor: 'pointer',
                transition: 'all 150ms',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontSize: '9px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  background: `color-mix(in oklch, ${PRIORITY_COLORS[brief.priority] || 'var(--text-tertiary)'} 20%, transparent)`,
                  color: PRIORITY_COLORS[brief.priority] || 'var(--text-tertiary)',
                  letterSpacing: '0.05em',
                }}>
                  {PRIORITY_LABELS[brief.priority] || 'UNK'}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                  {brief.category}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                  {brief.generated_at ? new Date(brief.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', lineHeight: 1.3 }}>
                {brief.title}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {brief.narrative}
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                  {brief.entities_involved?.length || 0} entities
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                  {brief.signals_correlated?.length || 0} signals
                </span>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: brief.confidence >= 0.8 ? 'var(--green)' : brief.confidence >= 0.5 ? 'var(--yellow)' : 'var(--red)' }}>
                  {Math.round((brief.confidence || 0) * 100)}% conf
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer stats */}
        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--surface-1)',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '10px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-tertiary)',
        }}>
          <span>{filteredBriefs.length} briefs</span>
          <span>{state.lastRefresh ? `Last: ${new Date(state.lastRefresh).toLocaleTimeString()}` : 'Never'}</span>
        </div>
      </div>

      {/* RIGHT: Brief Detail */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'auto', background: 'var(--surface-0)' }}>
        {!state.selectedBrief ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-tertiary)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.3 }}>◎</div>
              <p style={{ fontSize: '13px' }}>Select a brief to view details</p>
              <p style={{ fontSize: '11px', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>or generate a new one</p>
            </div>
          </div>
        ) : (
          <div style={{ padding: '24px', overflow: 'auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{
                  padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700,
                  fontFamily: 'var(--font-mono)', letterSpacing: '0.05em',
                  background: `color-mix(in oklch, ${PRIORITY_COLORS[state.selectedBrief.priority]} 20%, transparent)`,
                  color: PRIORITY_COLORS[state.selectedBrief.priority],
                }}>{PRIORITY_LABELS[state.selectedBrief.priority]}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', padding: '3px 8px', borderRadius: '4px', background: 'var(--surface-1)' }}>
                  {state.selectedBrief.classification || 'UNCLASSIFIED'}
                </span>
                {state.selectedBrief.region && (
                  <span style={{ fontSize: '10px', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                    📍 {state.selectedBrief.region}
                  </span>
                )}
              </div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, margin: 0 }}>
                {state.selectedBrief.title}
              </h2>
              <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: '6px' }}>
                Generated {state.selectedBrief.generated_at ? new Date(state.selectedBrief.generated_at).toLocaleString() : 'Unknown'}
              </p>
            </div>

            {/* Confidence bar */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>CONFIDENCE</span>
                <span style={{ fontSize: '10px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  {Math.round((state.selectedBrief.confidence || 0) * 100)}%
                </span>
              </div>
              <div style={{ height: '4px', borderRadius: '2px', background: 'var(--surface-1)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(state.selectedBrief.confidence || 0) * 100}%`,
                  borderRadius: '2px',
                  background: state.selectedBrief.confidence >= 0.8 ? 'var(--green)' : state.selectedBrief.confidence >= 0.5 ? 'var(--yellow)' : 'var(--red)',
                  transition: 'width 300ms ease',
                }} />
              </div>
            </div>

            {/* Narrative */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', marginBottom: '8px' }}>NARRATIVE</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {state.selectedBrief.narrative}
              </p>
            </div>

            {/* Entities */}
            {state.selectedBrief.entities_involved?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', marginBottom: '8px' }}>ENTITIES INVOLVED</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {state.selectedBrief.entities_involved.map((e, i) => (
                    <span key={i} style={{
                      padding: '4px 8px', borderRadius: '4px', fontSize: '11px',
                      background: 'var(--surface-1)', color: 'var(--accent)',
                      border: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)',
                    }}>{e}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Signals */}
            {state.selectedBrief.signals_correlated?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', marginBottom: '8px' }}>CORRELATED SIGNALS</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {state.selectedBrief.signals_correlated.map((s, i) => (
                    <div key={i} style={{
                      padding: '6px 10px', borderRadius: '4px', fontSize: '11px',
                      background: 'var(--surface-1)', color: 'var(--text-secondary)',
                      borderLeft: '3px solid var(--accent)',
                    }}>{s}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Gaps */}
            {state.selectedBrief.gaps_identified?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yellow)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', marginBottom: '8px' }}>⚠ INTELLIGENCE GAPS</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {state.selectedBrief.gaps_identified.map((g, i) => (
                    <div key={i} style={{
                      padding: '6px 10px', borderRadius: '4px', fontSize: '11px',
                      background: 'oklch(0.25 0.04 85)', color: 'var(--yellow)',
                      borderLeft: '3px solid var(--yellow)',
                    }}>{g}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Actions */}
            {state.selectedBrief.recommended_actions?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '11px', fontWeight: 600, color: 'var(--green)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', marginBottom: '8px' }}>→ RECOMMENDED ACTIONS</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {state.selectedBrief.recommended_actions.map((a, i) => (
                    <div key={i} style={{
                      padding: '8px 10px', borderRadius: '4px', fontSize: '11px',
                      background: 'oklch(0.22 0.04 145)', color: 'var(--green)',
                      borderLeft: '3px solid var(--green)',
                      display: 'flex', alignItems: 'flex-start', gap: '6px',
                    }}>
                      <span style={{ fontWeight: 700, minWidth: '16px' }}>{i + 1}.</span>
                      <span>{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generate for specific region */}
            <div style={{ marginTop: '24px', padding: '16px', borderRadius: '8px', background: 'var(--surface-1)', border: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginBottom: '10px' }}>GENERATE TARGETED BRIEF</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {REGIONS.map(r => (
                  <button
                    key={r}
                    onClick={() => generateBrief(r)}
                    disabled={state.generating}
                    style={{
                      padding: '4px 10px', borderRadius: '4px', fontSize: '10px',
                      border: '1px solid var(--border-subtle)', background: 'var(--surface-0)',
                      color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-mono)',
                      transition: 'all 150ms',
                    }}
                  >{r}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
