'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { gzmApi, type GZMStats } from '@/lib/api';
import { gzmWs, type ConnectionState } from '@/lib/websocket';

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState<GZMStats | null>(null);
  const [wsState, setWsState] = useState<ConnectionState>('disconnected');
  const [zuluTime, setZuluTime] = useState('');

  // Fetch system stats
  useEffect(() => {
    const fetchStats = async () => {
      const data = await gzmApi.stats();
      if (data) setStats(data);
    };
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  // Zulu clock
  useEffect(() => {
    const tick = () => {
      setZuluTime(new Date().toISOString().replace('T', ' ').substring(0, 19) + 'Z');
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // Connect WebSocket at layout level (persists across navigation)
  useEffect(() => {
    gzmWs.connect();
    const unsub = gzmWs.subscribe((msg) => {
      if (msg.type?.startsWith('_state_')) {
        setWsState(msg.type.replace('_state_', '') as ConnectionState);
      }
    });
    return () => {
      unsub();
      gzmWs.disconnect();
    };
  }, []);

  const fmt = (n: number | undefined): string => {
    if (n == null) return '\u2014';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return String(n);
  };

  const wsColor = wsState === 'connected' ? '#10b981' : wsState === 'reconnecting' ? '#f59e0b' : '#ef4444';
  const wsLabel = wsState === 'connected' ? 'LIVE' : wsState === 'reconnecting' ? 'RECONNECTING' : 'OFFLINE';

  return (
    <div className="flex min-h-screen" style={{ background: '#07090f', color: '#f0f0ff' }}>
      <Sidebar />

      {/* Main content area */}
      <main className="flex-1 ml-[220px] flex flex-col min-h-screen">
        {/* Global Status Bar */}
        <header
          className="sticky top-0 z-40 flex items-center justify-between h-10 px-5 flex-shrink-0"
          style={{
            background: 'rgba(7,9,15,0.92)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-center gap-5">
            <span className="text-[10px] font-mono tabular-nums" style={{ color: 'rgba(240,240,255,0.4)' }}>
              {zuluTime}
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: wsColor }} />
              <span className="text-[9px] font-bold tracking-wide" style={{ color: wsColor }}>
                {wsLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-5">
            {stats && (
              <>
                <Stat label="Entities" value={fmt(stats.node_count)} />
                <Stat label="Relations" value={fmt(stats.relationship_count)} />
                <Stat label="Uptime" value={stats.uptime_seconds ? `${Math.floor(stats.uptime_seconds / 3600)}h` : '\u2014'} />
              </>
            )}
            <div className="h-3 w-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <span className="text-[9px]" style={{ color: 'rgba(240,240,255,0.25)' }}>146+ collectors</span>
            <span className="text-[9px]" style={{ color: 'rgba(240,240,255,0.25)' }}>89+ engines</span>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-[11px] font-semibold tabular-nums" style={{ color: '#22d3ee' }}>{value}</div>
      <div className="text-[8px] uppercase tracking-wider" style={{ color: 'rgba(240,240,255,0.25)' }}>{label}</div>
    </div>
  );
}
