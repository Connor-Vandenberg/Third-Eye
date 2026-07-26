'use client';

import { useState, useEffect } from 'react';

interface MeshNode {
  id: string;
  type: 'drone' | 'ground_station' | 'relay' | 'sensor' | 'analyst';
  status: 'online' | 'degraded' | 'offline';
  lat: number;
  lon: number;
  battery_pct: number;
  uptime_hours: number;
  peers: string[];
  bandwidth_kbps: number;
  last_heartbeat: string;
  current_task: string | null;
}

const NODE_ICONS: Record<string, string> = {
  drone: '\u2708\ufe0f', ground_station: '\ud83d\udce1', relay: '\ud83d\udd17', sensor: '\ud83d\udcf6', analyst: '\ud83d\udc64',
};

const STATUS_COLORS: Record<string, string> = {
  online: '#22c55e', degraded: '#f59e0b', offline: '#ef4444',
};

export default function MeshPage() {
  const [nodes, setNodes] = useState<MeshNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMeshState();
    const interval = setInterval(fetchMeshState, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchMeshState() {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/mesh/status`);
      if (res.ok) {
        const data = await res.json();
        setNodes(data.nodes || []);
      } else {
        setNodes(generateDemoNodes());
      }
    } catch {
      setNodes(generateDemoNodes());
    } finally {
      setLoading(false);
    }
  }

  function generateDemoNodes(): MeshNode[] {
    return [
      { id: 'drone_alpha', type: 'drone', status: 'online', lat: 48.86, lon: 2.35, battery_pct: 78, uptime_hours: 2.3, peers: ['relay_01', 'ground_hq'], bandwidth_kbps: 2400, last_heartbeat: new Date().toISOString(), current_task: 'OVERFLIGHT ukraine_east sector 4' },
      { id: 'drone_bravo', type: 'drone', status: 'online', lat: 48.88, lon: 2.38, battery_pct: 92, uptime_hours: 0.8, peers: ['relay_01', 'drone_alpha'], bandwidth_kbps: 2100, last_heartbeat: new Date().toISOString(), current_task: 'LOITER convergence_point_A' },
      { id: 'drone_charlie', type: 'drone', status: 'degraded', lat: 48.84, lon: 2.32, battery_pct: 23, uptime_hours: 4.1, peers: ['relay_02'], bandwidth_kbps: 800, last_heartbeat: new Date(Date.now() - 15000).toISOString(), current_task: 'RTL (low battery)' },
      { id: 'relay_01', type: 'relay', status: 'online', lat: 48.87, lon: 2.36, battery_pct: 100, uptime_hours: 168, peers: ['drone_alpha', 'drone_bravo', 'ground_hq', 'sensor_sigint'], bandwidth_kbps: 54000, last_heartbeat: new Date().toISOString(), current_task: null },
      { id: 'relay_02', type: 'relay', status: 'online', lat: 48.85, lon: 2.33, battery_pct: 100, uptime_hours: 168, peers: ['drone_charlie', 'ground_hq', 'sensor_wifi'], bandwidth_kbps: 54000, last_heartbeat: new Date().toISOString(), current_task: null },
      { id: 'ground_hq', type: 'ground_station', status: 'online', lat: 48.85, lon: 2.35, battery_pct: 100, uptime_hours: 720, peers: ['relay_01', 'relay_02', 'sensor_sigint', 'sensor_wifi', 'analyst_01'], bandwidth_kbps: 1000000, last_heartbeat: new Date().toISOString(), current_task: 'COGNITIVE_LOOP active' },
      { id: 'sensor_sigint', type: 'sensor', status: 'online', lat: 48.89, lon: 2.40, battery_pct: 95, uptime_hours: 48, peers: ['relay_01', 'ground_hq'], bandwidth_kbps: 1200, last_heartbeat: new Date().toISOString(), current_task: 'SDR_SWEEP 446MHz PMR' },
      { id: 'sensor_wifi', type: 'sensor', status: 'online', lat: 48.83, lon: 2.31, battery_pct: 88, uptime_hours: 72, peers: ['relay_02', 'ground_hq'], bandwidth_kbps: 500, last_heartbeat: new Date().toISOString(), current_task: 'WIFI_PROBE monitor mode' },
      { id: 'analyst_01', type: 'analyst', status: 'online', lat: 48.85, lon: 2.35, battery_pct: 100, uptime_hours: 4, peers: ['ground_hq'], bandwidth_kbps: 100000, last_heartbeat: new Date().toISOString(), current_task: 'Reviewing CASE-2026-0147' },
    ];
  }

  const onlineCount = nodes.filter(n => n.status === 'online').length;
  const totalBandwidth = nodes.reduce((sum, n) => sum + n.bandwidth_kbps, 0);
  const avgBattery = nodes.filter(n => n.type === 'drone').reduce((sum, n) => sum + n.battery_pct, 0) / Math.max(nodes.filter(n => n.type === 'drone').length, 1);

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'var(--font-mono, monospace)' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text, #e2e8f0)', margin: 0 }}>Mesh Network Status</h1>
        <p style={{ color: 'var(--color-text-dim, #94a3b8)', fontSize: '14px', margin: '4px 0 0' }}>CycloneDDS P2P | MANET Mesh | DKF Shared Perception</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border, #334155)', background: 'var(--color-surface, #1e293b)' }}>
          <div style={{ fontSize: '11px', color: 'var(--color-text-dim)', marginBottom: '4px' }}>NODES ONLINE</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#22c55e' }}>{onlineCount}/{nodes.length}</div>
        </div>
        <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border, #334155)', background: 'var(--color-surface, #1e293b)' }}>
          <div style={{ fontSize: '11px', color: 'var(--color-text-dim)', marginBottom: '4px' }}>MESH BANDWIDTH</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text, #e2e8f0)' }}>{(totalBandwidth / 1000).toFixed(0)} Mbps</div>
        </div>
        <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border, #334155)', background: 'var(--color-surface, #1e293b)' }}>
          <div style={{ fontSize: '11px', color: 'var(--color-text-dim)', marginBottom: '4px' }}>AVG DRONE BATTERY</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: avgBattery > 50 ? '#22c55e' : avgBattery > 25 ? '#f59e0b' : '#ef4444' }}>{avgBattery.toFixed(0)}%</div>
        </div>
        <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border, #334155)', background: 'var(--color-surface, #1e293b)' }}>
          <div style={{ fontSize: '11px', color: 'var(--color-text-dim)', marginBottom: '4px' }}>ACTIVE TASKS</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-accent, #3b82f6)' }}>{nodes.filter(n => n.current_task).length}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '12px' }}>
        {nodes.map(node => (
          <div key={node.id} style={{ padding: '16px 20px', borderRadius: '8px', border: `1px solid ${STATUS_COLORS[node.status]}40`, background: `${STATUS_COLORS[node.status]}08`, display: 'grid', gridTemplateColumns: '40px 180px 100px 1fr 100px 120px', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>{NODE_ICONS[node.type]}</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text, #e2e8f0)' }}>{node.id}</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-dim)' }}>{node.type.replace('_', ' ')}</div>
            </div>
            <span style={{ padding: '2px 8px', borderRadius: '4px', background: `${STATUS_COLORS[node.status]}20`, color: STATUS_COLORS[node.status], fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', textAlign: 'center' }}>{node.status}</span>
            <div style={{ fontSize: '12px', color: 'var(--color-text-dim)' }}>{node.current_task || 'Idle'}</div>
            <div style={{ fontSize: '12px', color: node.battery_pct > 50 ? '#22c55e' : node.battery_pct > 25 ? '#f59e0b' : '#ef4444', textAlign: 'right' }}>{node.battery_pct}% bat</div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-dim)', textAlign: 'right' }}>{node.peers.length} peers | {(node.bandwidth_kbps / 1000).toFixed(0)}Mbps</div>
          </div>
        ))}
      </div>
    </div>
  );
}
