'use client';

import { useState, useEffect } from 'react';
import { AlertItem } from '@/components/alert-item';
import { useWebSocket } from '@/providers/websocket-provider';
import type { Alert } from '@/lib/types';

const MOCK_ALERTS: Alert[] = [
  { id: 'a1', type: 'convergence', timestamp: '2026-07-24T18:03:22Z', priority: 0, message: 'CONVERGENCE THRESHOLD: MV CASPIAN STAR reached 0.91 (6 signals). ISR requirement auto-generated.', source_int: 'OSINT', entity_id: 'GZM-ENT-4471' },
  { id: 'a2', type: 'tasking', timestamp: '2026-07-24T17:58:03Z', priority: 1, message: 'CBBA allocation: RAVEN-01 assigned ISR-REQ-0447. Visual confirm MV CASPIAN STAR. ETA 12min.', source_int: 'OSINT' },
  { id: 'a3', type: 'detection', timestamp: '2026-07-24T17:45:07Z', priority: 1, message: 'Temporal anomaly: 4x HF activity in Black Sea since 0600Z. Pattern matches military exercise precursors.', source_int: 'SIGINT' },
  { id: 'a4', type: 'convergence', timestamp: '2026-07-24T17:30:00Z', priority: 1, message: 'OFAC SDN ownership chain confirmed for MV CASPIAN STAR (2-hop shell company, confidence 0.82).', source_int: 'OSINT', entity_id: 'GZM-ENT-4471' },
  { id: 'a5', type: 'platform_status', timestamp: '2026-07-24T17:15:00Z', priority: 2, message: 'RAVEN-03 battery critical (18%). Auto-RTB initiated. Removing from task pool.', source_int: 'OSINT' },
  { id: 'a6', type: 'detection', timestamp: '2026-07-24T16:45:00Z', priority: 0, message: 'AIS TRANSPONDER DARK: MV CASPIAN STAR (IMO 9432871) last position 34.05N, 118.24W. Sanctions-flagged vessel.', source_int: 'OSINT', entity_id: 'GZM-ENT-4471' },
  { id: 'a7', type: 'convergence', timestamp: '2026-07-24T16:00:00Z', priority: 2, message: 'New convergence signal: Port network scan from Bandar Abbas IP range targeting shipping logistics systems.', source_int: 'SIGINT' },
  { id: 'a8', type: 'detection', timestamp: '2026-07-24T14:30:00Z', priority: 3, message: 'Through-wall sensor SENTRY-A: 2 new persons entered building at monitored location. Biometric capture initiated.', source_int: 'MASINT' },
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS);
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());
  const [priorityFilter, setPriorityFilter] = useState<number | null>(null);
  const { subscribe } = useWebSocket();

  // Live alerts from WebSocket
  useEffect(() => {
    const unsub = subscribe((data: any) => {
      if (data && data.type && data.message) {
        const newAlert: Alert = {
          id: `live-${Date.now()}`,
          type: data.type,
          timestamp: data.timestamp || new Date().toISOString(),
          priority: data.priority || 2,
          message: data.message,
          source_int: data.source_int || 'OSINT',
          entity_id: data.entity_id,
        };
        setAlerts((prev) => [newAlert, ...prev]);
      }
    });
    return unsub;
  }, [subscribe]);

  const handleAcknowledge = (id: string) => {
    setAcknowledged((prev) => new Set([...prev, id]));
  };

  const handleAcknowledgeAll = () => {
    setAcknowledged(new Set(alerts.map((a) => a.id)));
  };

  const filtered = priorityFilter !== null
    ? alerts.filter((a) => a.priority === priorityFilter)
    : alerts;

  const unackedCount = alerts.filter((a) => !acknowledged.has(a.id)).length;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ fontSize: 'var(--text-md)', fontWeight: 700 }}>Alerts</h1>
          {unackedCount > 0 && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '10px', background: 'var(--red-subtle)', color: 'var(--red)' }}>{unackedCount} unread</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Priority filters */}
          {[null, 0, 1, 2, 3].map((p) => (
            <button key={String(p)} onClick={() => setPriorityFilter(p)} style={{
              fontFamily: 'var(--font-mono)', fontSize: '10px', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer',
              border: '1px solid', letterSpacing: '0.04em',
              borderColor: priorityFilter === p ? 'var(--accent)' : 'var(--border-default)',
              background: priorityFilter === p ? 'var(--accent-subtle)' : 'transparent',
              color: priorityFilter === p ? 'var(--accent)' : 'var(--text-muted)',
            }}>{p === null ? 'ALL' : `P${p}`}</button>
          ))}
          <button onClick={handleAcknowledgeAll} style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 600, background: 'var(--surface-3)', border: '1px solid var(--border-default)', borderRadius: '5px', color: 'var(--text-secondary)', cursor: 'pointer', marginLeft: '8px' }}>Acknowledge All</button>
        </div>
      </div>

      {/* Alert List */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 12px' }}>
        {filtered.map((alert) => (
          <div key={alert.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: acknowledged.has(alert.id) ? 0.5 : 1, transition: 'opacity 200ms' }}>
            <div style={{ flex: 1 }}>
              <AlertItem alert={alert} />
            </div>
            {!acknowledged.has(alert.id) && (
              <button onClick={() => handleAcknowledge(alert.id)} title="Acknowledge" style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-2)', border: '1px solid var(--border-default)', borderRadius: '4px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', flexShrink: 0 }}>\u2713</button>
            )}
          </div>
        ))}
        {filtered.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No alerts match this filter.</div>}
      </div>

      {/* Footer stats */}
      <div style={{ padding: '8px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
        <span>{filtered.length} alerts | {unackedCount} unacknowledged</span>
        <span style={{ fontFamily: 'var(--font-mono)' }}>P0: {alerts.filter((a) => a.priority === 0).length} | P1: {alerts.filter((a) => a.priority === 1).length} | P2: {alerts.filter((a) => a.priority === 2).length}</span>
      </div>
    </div>
  );
}
