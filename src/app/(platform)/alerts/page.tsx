'use client';

import { useEffect, useState, useCallback } from 'react';
import { gzmApi, type GZMAlert, type AlertsResponse } from '@/lib/api';

const SEVERITY_STYLES: Record<string, { border: string; badge: string; icon: string }> = {
  critical: { border: '#ef4444', badge: 'bg-red-500/20 text-red-400', icon: '🔴' },
  high: { border: '#f59e0b', badge: 'bg-amber-500/20 text-amber-400', icon: '🟠' },
  medium: { border: '#eab308', badge: 'bg-yellow-500/20 text-yellow-400', icon: '🟡' },
  low: { border: '#22c55e', badge: 'bg-emerald-500/20 text-emerald-400', icon: '🟢' },
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<GZMAlert[]>([]);
  const [stats, setStats] = useState({ total: 0, critical: 0, high: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      const data = await gzmApi.alerts(100);
      if (data) {
        setAlerts(data.alerts || []);
        setStats({
          total: data.active_alerts || data.alerts?.length || 0,
          critical: data.critical || data.alerts?.filter(a => a.severity === 'critical').length || 0,
          high: data.high || data.alerts?.filter(a => a.severity === 'high').length || 0,
        });
        setError(null);
      } else {
        setError('Backend unavailable. Start FastAPI: python -m api.app');
      }
    } catch {
      setError('Failed to connect to GZM backend');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  // WebSocket for real-time updates
  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(gzmApi.alertsWsUrl());
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'alert') {
            setAlerts((prev) => [
              {
                vertex_id: msg.alert_id || msg.entity,
                name: msg.entity || msg.name,
                severity: msg.severity || 'medium',
                score: msg.convergence_score || msg.score,
                country: msg.country,
                vertex_type: msg.vertex_type,
              },
              ...prev.slice(0, 99),
            ]);
            setStats((s) => ({ ...s, total: s.total + 1 }));
          }
        } catch { /* ignore parse errors */ }
      };
    } catch { /* WebSocket not available */ }
    return () => { ws?.close(); };
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Convergence Alerts</h1>
          <p className="text-[13px] text-[rgba(240,240,255,0.5)] mt-1">
            Real-time intelligence alerts from 146+ collectors across 18 domains
          </p>
        </div>
        <div className="flex gap-3">
          <div className="px-3 py-1.5 rounded-md text-[11px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
            {stats.critical} CRITICAL
          </div>
          <div className="px-3 py-1.5 rounded-md text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {stats.high} HIGH
          </div>
          <div className="px-3 py-1.5 rounded-md text-[11px] font-bold bg-[rgba(34,211,238,0.1)] text-cyan-400 border border-cyan-500/20">
            {stats.total} TOTAL
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 p-4 rounded-lg border border-amber-500/30 bg-amber-500/5">
          <p className="text-[13px] text-amber-400">⚠️ {error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-[13px] text-[rgba(240,240,255,0.4)] animate-pulse">
            Connecting to GZM backend...
          </div>
        </div>
      )}

      {/* Alert List */}
      {!loading && alerts.length === 0 && !error && (
        <div className="text-center py-20">
          <p className="text-[14px] text-[rgba(240,240,255,0.4)]">No active alerts</p>
          <p className="text-[12px] text-[rgba(240,240,255,0.25)] mt-2">Run the pipeline to generate convergence alerts</p>
        </div>
      )}

      <div className="space-y-2">
        {alerts.map((alert, i) => {
          const sev = (alert.severity || 'low').toLowerCase();
          const style = SEVERITY_STYLES[sev] || SEVERITY_STYLES.low;
          return (
            <div
              key={alert.vertex_id || i}
              className="flex items-start gap-4 p-4 rounded-lg border transition-colors hover:bg-[rgba(255,255,255,0.02)]"
              style={{
                background: '#0f0f1a',
                borderColor: 'rgba(255,255,255,0.06)',
                borderLeftWidth: '3px',
                borderLeftColor: style.border,
              }}
            >
              <span className="text-lg flex-shrink-0 mt-0.5">{style.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[14px] font-semibold text-white truncate">
                    {alert.name || alert.entity_name || alert.vertex_id || 'Unknown Entity'}
                  </span>
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${style.badge}`}>
                    {sev}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-[rgba(240,240,255,0.4)]">
                  {alert.vertex_type && <span>Type: {alert.vertex_type}</span>}
                  {alert.country && <span>📍 {alert.country}</span>}
                  {alert.score != null && <span>Score: {(alert.score * 100).toFixed(0)}%</span>}
                  {alert.source && <span>Source: {alert.source}</span>}
                </div>
              </div>
              {alert.created_at && (
                <span className="text-[10px] text-[rgba(240,240,255,0.3)] font-mono flex-shrink-0">
                  {alert.created_at}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
