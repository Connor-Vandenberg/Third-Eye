'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { gzmApi, type GZMAlert, type Severity } from '@/lib/api';
import { gzmWs, type WsMessage, type WsAlert } from '@/lib/websocket';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; icon: string; priority: number }> = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', icon: '\u{1F534}', priority: 0 },
  high:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', icon: '\u{1F7E0}', priority: 1 },
  medium:   { color: '#eab308', bg: 'rgba(234,179,8,0.06)',  icon: '\u{1F7E1}', priority: 2 },
  low:      { color: '#10b981', bg: 'rgba(16,185,129,0.06)', icon: '\u{1F7E2}', priority: 3 },
};

type ViewMode = 'feed' | 'grid' | 'compact';
type FilterSeverity = 'all' | Severity;

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<GZMAlert[]>([]);
  const [stats, setStats] = useState({ total: 0, critical: 0, high: 0, medium: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterSeverity>('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('feed');
  const [wsConnected, setWsConnected] = useState(false);

  // ─── Initial fetch ───────────────────────────────────────────
  const fetchAlerts = useCallback(async () => {
    try {
      const data = await gzmApi.alerts(200);
      if (data) {
        setAlerts(data.alerts || []);
        const all = data.alerts || [];
        setStats({
          total: data.active_alerts || all.length,
          critical: data.critical || all.filter(a => a.severity === 'critical').length,
          high: data.high || all.filter(a => a.severity === 'high').length,
          medium: all.filter(a => a.severity === 'medium').length,
        });
        setError(null);
      } else {
        setError('Backend unavailable. Run: python -m api.app');
      }
    } catch {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  // ─── WebSocket live updates ──────────────────────────────────
  useEffect(() => {
    const unsub = gzmWs.subscribe((msg: WsMessage) => {
      if (msg.type === '_state_connected') setWsConnected(true);
      if (msg.type === '_state_disconnected') setWsConnected(false);
      if (msg.type === 'alert') {
        const a = msg as WsAlert;
        const newAlert: GZMAlert = {
          vertex_id: a.alert_id || a.entity || String(Date.now()),
          name: a.entity || a.name,
          severity: (a.severity as Severity) || 'medium',
          score: a.convergence_score || a.score,
          country: a.country,
          vertex_type: a.vertex_type,
          domain_count: a.domain_count,
          created_at: a.created_at || new Date().toISOString(),
        };
        setAlerts(prev => [newAlert, ...prev.slice(0, 199)]);
        setStats(s => ({
          ...s,
          total: s.total + 1,
          critical: s.critical + (newAlert.severity === 'critical' ? 1 : 0),
          high: s.high + (newAlert.severity === 'high' ? 1 : 0),
        }));
      }
      if (msg.type === 'heartbeat') {
        const hb = msg as { active_alerts?: number; critical?: number };
        if (hb.active_alerts != null) setStats(s => ({ ...s, total: hb.active_alerts! }));
      }
    });
    return unsub;
  }, []);

  // ─── Filtered + searched alerts ──────────────────────────────
  const displayed = useMemo(() => {
    let result = alerts;
    if (filter !== 'all') {
      result = result.filter(a => (a.severity || 'low') === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        (a.name || '').toLowerCase().includes(q) ||
        (a.entity_name || '').toLowerCase().includes(q) ||
        (a.country || '').toLowerCase().includes(q) ||
        (a.vertex_type || '').toLowerCase().includes(q)
      );
    }
    // Sort by severity priority, then recency
    return result.sort((a, b) => {
      const pa = SEVERITY_CONFIG[(a.severity || 'low')]?.priority ?? 3;
      const pb = SEVERITY_CONFIG[(b.severity || 'low')]?.priority ?? 3;
      return pa - pb;
    });
  }, [alerts, filter, search]);

  // ─── Score bar visualization ─────────────────────────────────
  const ScoreBar = ({ score }: { score?: number }) => {
    const pct = Math.min(100, (score || 0) * 100);
    const color = pct > 70 ? '#ef4444' : pct > 40 ? '#f59e0b' : '#10b981';
    return (
      <div className="flex items-center gap-2">
        <div className="w-16 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
        </div>
        <span className="text-[10px] font-mono tabular-nums" style={{ color }}>{pct.toFixed(0)}%</span>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* ─── Header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-bold text-white tracking-tight">Convergence Alerts</h1>
          <p className="text-[12px] mt-1" style={{ color: 'rgba(240,240,255,0.45)' }}>
            Multi-domain intelligence convergence from 146+ collectors \u00b7 3-tier Dempster-Shafer fusion
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md" style={{ background: wsConnected ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${wsConnected ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
            <div className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            <span className="text-[9px] font-bold" style={{ color: wsConnected ? '#10b981' : '#ef4444' }}>
              {wsConnected ? 'LIVE' : 'POLLING'}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Stats Row ──────────────────────────────────────── */}
      <div className="flex gap-3 mb-5">
        {[
          { label: 'CRITICAL', count: stats.critical, color: '#ef4444' },
          { label: 'HIGH', count: stats.high, color: '#f59e0b' },
          { label: 'MEDIUM', count: stats.medium, color: '#eab308' },
          { label: 'TOTAL', count: stats.total, color: '#22d3ee' },
        ].map(({ label, count, color }) => (
          <button
            key={label}
            onClick={() => setFilter(label === 'TOTAL' ? 'all' : label.toLowerCase() as FilterSeverity)}
            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${
              (filter === label.toLowerCase() || (filter === 'all' && label === 'TOTAL'))
                ? 'ring-1'
                : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              background: `${color}10`,
              color,
              border: `1px solid ${color}30`,
              ...(filter === label.toLowerCase() || (filter === 'all' && label === 'TOTAL')
                ? { ringColor: color }
                : {}),
            }}
          >
            {count} {label}
          </button>
        ))}
      </div>

      {/* ─── Search + View Toggle ───────────────────────────── */}
      <div className="flex gap-3 mb-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by entity, country, type..."
          className="flex-1 px-4 py-2 rounded-lg text-[12px] text-white placeholder:text-[rgba(240,240,255,0.25)] outline-none focus:ring-1 focus:ring-cyan-500/40 transition-shadow"
          style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.06)' }}
        />
        <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          {(['feed', 'grid', 'compact'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-2 text-[10px] font-bold uppercase ${
                viewMode === mode ? 'text-cyan-400' : 'text-[rgba(240,240,255,0.3)]'
              }`}
              style={{ background: viewMode === mode ? 'rgba(34,211,238,0.06)' : '#0f0f1a' }}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Error ──────────────────────────────────────────── */}
      {error && (
        <div className="mb-4 p-4 rounded-lg" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <p className="text-[12px] text-amber-400">\u26A0\uFE0F {error}</p>
        </div>
      )}

      {/* ─── Loading ────────────────────────────────────────── */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <div className="text-[12px] animate-pulse" style={{ color: 'rgba(240,240,255,0.35)' }}>
            Connecting to GZM backend...
          </div>
        </div>
      )}

      {/* ─── Empty ──────────────────────────────────────────── */}
      {!loading && displayed.length === 0 && !error && (
        <div className="text-center py-24">
          <p className="text-[14px]" style={{ color: 'rgba(240,240,255,0.4)' }}>No alerts match current filters</p>
          <p className="text-[11px] mt-2" style={{ color: 'rgba(240,240,255,0.2)' }}>
            Run the pipeline to generate convergence alerts: python run_all_v2.py
          </p>
        </div>
      )}

      {/* ─── Alert List ─────────────────────────────────────── */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-2'}>
        {displayed.map((alert, i) => {
          const sev = (alert.severity || 'low').toLowerCase();
          const config = SEVERITY_CONFIG[sev] || SEVERITY_CONFIG.low;

          if (viewMode === 'compact') {
            return (
              <div
                key={alert.vertex_id || i}
                className="flex items-center gap-3 px-3 py-1.5 rounded text-[11px] hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                style={{ borderLeft: `2px solid ${config.color}` }}
              >
                <span className="font-medium text-white truncate flex-1">
                  {alert.name || alert.entity_name || alert.vertex_id}
                </span>
                <span style={{ color: config.color }} className="text-[9px] font-bold uppercase">{sev}</span>
                {alert.country && <span className="text-[rgba(240,240,255,0.3)]">{alert.country}</span>}
                <ScoreBar score={alert.score || alert.convergence_score} />
              </div>
            );
          }

          return (
            <div
              key={alert.vertex_id || i}
              className="flex items-start gap-4 p-4 rounded-lg transition-all hover:translate-x-0.5"
              style={{
                background: config.bg,
                border: '1px solid rgba(255,255,255,0.04)',
                borderLeftWidth: '3px',
                borderLeftColor: config.color,
              }}
            >
              <span className="text-[16px] flex-shrink-0 mt-0.5">{config.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[13px] font-semibold text-white truncate">
                    {alert.name || alert.entity_name || alert.vertex_id || 'Unknown'}
                  </span>
                  <span
                    className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded"
                    style={{ background: `${config.color}20`, color: config.color }}
                  >
                    {sev}
                  </span>
                  {alert.domain_count && alert.domain_count > 1 && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
                      {alert.domain_count} domains
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-[10px]" style={{ color: 'rgba(240,240,255,0.4)' }}>
                  {alert.vertex_type && <span>{alert.vertex_type}</span>}
                  {alert.country && <span>\u{1F4CD} {alert.country}</span>}
                  {alert.source && <span>via {alert.source}</span>}
                </div>
                {(alert.score != null || alert.convergence_score != null) && (
                  <div className="mt-2">
                    <ScoreBar score={alert.score || alert.convergence_score} />
                  </div>
                )}
              </div>
              {alert.created_at && (
                <span className="text-[9px] font-mono tabular-nums flex-shrink-0" style={{ color: 'rgba(240,240,255,0.25)' }}>
                  {alert.created_at.substring(11, 19) || alert.created_at}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── Footer Stats ───────────────────────────────────── */}
      {!loading && displayed.length > 0 && (
        <div className="mt-6 pt-4 flex items-center justify-between text-[10px]" style={{ borderTop: '1px solid rgba(255,255,255,0.04)', color: 'rgba(240,240,255,0.25)' }}>
          <span>Showing {displayed.length} of {alerts.length} alerts</span>
          <span>Refresh: {wsConnected ? 'real-time via WebSocket' : 'polling every 60s'}</span>
        </div>
      )}
    </div>
  );
}
