'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface MeshPeer {
  id: string;
  name: string;
  address: string;
  status: 'connected' | 'syncing' | 'degraded' | 'offline' | 'air-gapped';
  trust_score: number;
  last_seen: string;
  latency_ms: number;
  sync_progress: number;
  data_shared: number;
  data_received: number;
  role: 'hub' | 'relay' | 'edge' | 'collector';
  region: string;
  encryption: string;
  crdt_version: number;
}

interface MeshMessage {
  id: string;
  from: string;
  to: string;
  type: 'sync' | 'alert' | 'query' | 'response' | 'heartbeat';
  payload_size: number;
  timestamp: string;
  encrypted: boolean;
  hops: number;
}

interface MeshStats {
  total_peers: number;
  connected_peers: number;
  total_messages_24h: number;
  data_replicated_mb: number;
  avg_latency_ms: number;
  crdt_conflicts_resolved: number;
  air_gapped_nodes: number;
  network_health: number;
}

interface MeshState {
  peers: MeshPeer[];
  messages: MeshMessage[];
  stats: MeshStats | null;
  loading: boolean;
  error: string | null;
  selectedPeer: MeshPeer | null;
  view: 'topology' | 'peers' | 'messages';
}

// ============================================================================
// CONSTANTS
// ============================================================================

const GZM_API = process.env.NEXT_PUBLIC_GZM_API_URL || 'http://localhost:8000';

const STATUS_CONFIG: Record<string, { color: string; label: string; pulse: boolean }> = {
  connected: { color: 'var(--green)', label: 'CONNECTED', pulse: false },
  syncing: { color: 'var(--accent)', label: 'SYNCING', pulse: true },
  degraded: { color: 'var(--yellow)', label: 'DEGRADED', pulse: false },
  offline: { color: 'var(--red)', label: 'OFFLINE', pulse: false },
  'air-gapped': { color: 'oklch(0.7 0.15 300)', label: 'AIR-GAPPED', pulse: true },
};

const ROLE_ICONS: Record<string, string> = {
  hub: '◉', relay: '◎', edge: '○', collector: '◈',
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function MeshPage() {
  const [state, setState] = useState<MeshState>({
    peers: [],
    messages: [],
    stats: null,
    loading: true,
    error: null,
    selectedPeer: null,
    view: 'topology',
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ──────────────────────────────────────────────────────────────────────────
  // DATA FETCHING
  // ──────────────────────────────────────────────────────────────────────────

  const fetchMesh = useCallback(async () => {
    try {
      const [peersRes, statsRes, msgsRes] = await Promise.allSettled([
        fetch(`${GZM_API}/mesh/peers`),
        fetch(`${GZM_API}/mesh/stats`),
        fetch(`${GZM_API}/mesh/messages?limit=50`),
      ]);

      const peers = peersRes.status === 'fulfilled' && peersRes.value.ok
        ? await peersRes.value.json() : [];
      const stats = statsRes.status === 'fulfilled' && statsRes.value.ok
        ? await statsRes.value.json() : null;
      const messages = msgsRes.status === 'fulfilled' && msgsRes.value.ok
        ? await msgsRes.value.json() : [];

      setState(prev => ({
        ...prev,
        peers: peers.peers || peers || [],
        stats: stats,
        messages: messages.messages || messages || [],
        loading: false,
        error: null,
      }));
    } catch (err) {
      setState(prev => ({ ...prev, loading: false, error: err instanceof Error ? err.message : 'Mesh fetch failed' }));
    }
  }, []);

  useEffect(() => { fetchMesh(); }, [fetchMesh]);
  useEffect(() => {
    const interval = setInterval(fetchMesh, 10_000);
    return () => clearInterval(interval);
  }, [fetchMesh]);

  // ──────────────────────────────────────────────────────────────────────────
  // TOPOLOGY CANVAS
  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (state.view !== 'topology' || !canvasRef.current || state.peers.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const cx = w / 2;
    const cy = h / 2;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Position peers in a circle
    const peers = state.peers;
    const radius = Math.min(w, h) * 0.35;
    const positions = peers.map((_, i) => ({
      x: cx + radius * Math.cos((2 * Math.PI * i) / peers.length - Math.PI / 2),
      y: cy + radius * Math.sin((2 * Math.PI * i) / peers.length - Math.PI / 2),
    }));

    // Draw edges (connections between connected peers)
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < peers.length; i++) {
      for (let j = i + 1; j < peers.length; j++) {
        if (peers[i].status === 'connected' && peers[j].status === 'connected') {
          ctx.beginPath();
          ctx.moveTo(positions[i].x, positions[i].y);
          ctx.lineTo(positions[j].x, positions[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw hub connections (thicker)
    const hubs = peers.filter(p => p.role === 'hub');
    if (hubs.length > 0) {
      ctx.strokeStyle = 'rgba(100, 200, 255, 0.3)';
      ctx.lineWidth = 2;
      hubs.forEach((hub) => {
        const hubIdx = peers.indexOf(hub);
        peers.forEach((peer, peerIdx) => {
          if (peerIdx !== hubIdx && peer.status !== 'offline') {
            ctx.beginPath();
            ctx.moveTo(positions[hubIdx].x, positions[hubIdx].y);
            ctx.lineTo(positions[peerIdx].x, positions[peerIdx].y);
            ctx.stroke();
          }
        });
      });
    }

    // Draw nodes
    peers.forEach((peer, i) => {
      const { x, y } = positions[i];
      const cfg = STATUS_CONFIG[peer.status] || STATUS_CONFIG.offline;
      const nodeRadius = peer.role === 'hub' ? 12 : peer.role === 'relay' ? 9 : 7;

      // Glow for active nodes
      if (peer.status === 'connected' || peer.status === 'syncing') {
        ctx.beginPath();
        ctx.arc(x, y, nodeRadius + 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100, 200, 255, 0.1)`;
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(x, y, nodeRadius, 0, Math.PI * 2);
      ctx.fillStyle = peer.status === 'connected' ? '#22c55e' :
                      peer.status === 'syncing' ? '#60a5fa' :
                      peer.status === 'degraded' ? '#eab308' :
                      peer.status === 'air-gapped' ? '#a855f7' : '#666';
      ctx.fill();

      // Label
      ctx.fillStyle = '#ccc';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(peer.name || peer.id.slice(0, 6), x, y + nodeRadius + 14);
    });

    // Center label
    ctx.fillStyle = 'rgba(100, 200, 255, 0.4)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GZM MESH', cx, cy - 6);
    ctx.fillText(`${peers.filter(p => p.status === 'connected').length}/${peers.length} nodes`, cx, cy + 8);

  }, [state.view, state.peers]);

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────

  const viewTabStyle = (v: string) => ({
    padding: '6px 14px', fontSize: '11px', fontFamily: 'var(--font-mono)' as const,
    fontWeight: 600 as const, borderRadius: '4px', border: 'none' as const,
    cursor: 'pointer' as const,
    background: state.view === v ? 'var(--accent-subtle)' : 'transparent',
    color: state.view === v ? 'var(--accent)' : 'var(--text-tertiary)',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <h1 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>P2P Mesh Network</h1>
            <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', margin: '2px 0 0' }}>
              CRDT Sync · NaCl Encryption · Air-Gap Ready
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              padding: '4px 10px', borderRadius: '10px', fontSize: '10px',
              fontFamily: 'var(--font-mono)', fontWeight: 600,
              background: (state.stats?.network_health || 0) >= 0.8 ? 'oklch(0.22 0.04 145)' : 'oklch(0.25 0.04 85)',
              color: (state.stats?.network_health || 0) >= 0.8 ? 'var(--green)' : 'var(--yellow)',
            }}>
              HEALTH: {Math.round((state.stats?.network_health || 0) * 100)}%
            </div>
          </div>
        </div>

        {/* Stats bar */}
        {state.stats && (
          <div style={{ display: 'flex', gap: '24px', marginBottom: '12px' }}>
            {[
              { label: 'PEERS', value: `${state.stats.connected_peers}/${state.stats.total_peers}` },
              { label: 'MSG/24H', value: state.stats.total_messages_24h.toLocaleString() },
              { label: 'REPLICATED', value: `${state.stats.data_replicated_mb}MB` },
              { label: 'AVG LATENCY', value: `${state.stats.avg_latency_ms}ms` },
              { label: 'CRDT CONFLICTS', value: state.stats.crdt_conflicts_resolved.toString() },
              { label: 'AIR-GAPPED', value: state.stats.air_gapped_nodes.toString() },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{s.value}</span>
                <span style={{ fontSize: '9px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* View tabs */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={() => setState(prev => ({ ...prev, view: 'topology' }))} style={viewTabStyle('topology')}>Topology</button>
          <button onClick={() => setState(prev => ({ ...prev, view: 'peers' }))} style={viewTabStyle('peers')}>Peers</button>
          <button onClick={() => setState(prev => ({ ...prev, view: 'messages' }))} style={viewTabStyle('messages')}>Messages</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {state.loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent)' }}>DISCOVERING MESH PEERS...</span>
          </div>
        )}

        {state.error && (
          <div style={{ padding: '20px', margin: '20px', borderRadius: '8px', background: 'oklch(0.25 0.05 25)', border: '1px solid var(--red)', color: 'var(--red)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
            MESH ERROR: {state.error}
          </div>
        )}

        {/* Topology View */}
        {state.view === 'topology' && !state.loading && (
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        )}

        {/* Peers View */}
        {state.view === 'peers' && !state.loading && (
          <div style={{ padding: '16px', overflow: 'auto', height: '100%' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
              {state.peers.map((peer, i) => {
                const cfg = STATUS_CONFIG[peer.status] || STATUS_CONFIG.offline;
                return (
                  <div key={peer.id || i} style={{
                    padding: '14px 16px', borderRadius: '8px',
                    background: 'var(--surface-1)', border: '1px solid var(--border-subtle)',
                    cursor: 'pointer', transition: 'all 150ms',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '16px' }}>{ROLE_ICONS[peer.role] || '○'}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{peer.name || peer.id.slice(0, 8)}</span>
                      <span style={{
                        marginLeft: 'auto', padding: '2px 6px', borderRadius: '3px',
                        fontSize: '9px', fontWeight: 700, fontFamily: 'var(--font-mono)',
                        color: cfg.color, background: `color-mix(in oklch, ${cfg.color} 15%, transparent)`,
                      }}>{cfg.label}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                      <span>Trust: {Math.round(peer.trust_score * 100)}%</span>
                      <span>Latency: {peer.latency_ms}ms</span>
                      <span>Sent: {peer.data_shared}KB</span>
                      <span>Recv: {peer.data_received}KB</span>
                      <span>Region: {peer.region}</span>
                      <span>CRDT v{peer.crdt_version}</span>
                    </div>
                    {/* Sync progress bar */}
                    {peer.status === 'syncing' && (
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ height: '3px', borderRadius: '2px', background: 'var(--surface-0)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${peer.sync_progress * 100}%`, background: 'var(--accent)', borderRadius: '2px', transition: 'width 300ms' }} />
                        </div>
                        <span style={{ fontSize: '9px', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{Math.round(peer.sync_progress * 100)}% synced</span>
                      </div>
                    )}
                    <div style={{ fontSize: '9px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: '6px' }}>
                      🔐 {peer.encryption} · Last seen: {peer.last_seen ? new Date(peer.last_seen).toLocaleTimeString() : 'Never'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Messages View */}
        {state.view === 'messages' && !state.loading && (
          <div style={{ padding: '16px', overflow: 'auto', height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {state.messages.map((msg, i) => (
                <div key={msg.id || i} style={{
                  padding: '8px 12px', borderRadius: '6px',
                  background: 'var(--surface-1)', display: 'flex',
                  alignItems: 'center', gap: '12px', fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                }}>
                  <span style={{ color: 'var(--text-tertiary)', minWidth: '60px' }}>
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                  </span>
                  <span style={{
                    padding: '2px 6px', borderRadius: '3px', fontSize: '9px', fontWeight: 700,
                    background: msg.type === 'alert' ? 'oklch(0.25 0.05 25)' : msg.type === 'sync' ? 'var(--accent-subtle)' : 'var(--surface-0)',
                    color: msg.type === 'alert' ? 'var(--red)' : msg.type === 'sync' ? 'var(--accent)' : 'var(--text-tertiary)',
                  }}>{msg.type.toUpperCase()}</span>
                  <span style={{ color: 'var(--accent)' }}>{msg.from?.slice(0, 8)}</span>
                  <span style={{ color: 'var(--text-tertiary)' }}>→</span>
                  <span style={{ color: 'var(--green)' }}>{msg.to?.slice(0, 8)}</span>
                  <span style={{ color: 'var(--text-tertiary)', marginLeft: 'auto' }}>{msg.payload_size}B</span>
                  <span style={{ color: 'var(--text-tertiary)' }}>{msg.hops}hop{msg.hops !== 1 ? 's' : ''}</span>
                  {msg.encrypted && <span style={{ color: 'var(--green)' }}>🔒</span>}
                </div>
              ))}
              {state.messages.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px', padding: '40px' }}>No mesh messages captured.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
