'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { NAV_ITEMS, NAV_BOTTOM } from '@/lib/constants';
import { useStats } from '@/lib/queries';
import { useWebSocket } from '@/providers/websocket-provider';
import { SecurityInit } from './security-init';

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [clock, setClock] = useState('');

  // LIVE DATA: polls /stats every 10 seconds
  const { data: stats } = useStats();

  // LIVE WEBSOCKET: connection status + alert count
  const { connected, alertCount } = useWebSocket();

  // Zulu clock
  useEffect(() => {
    const tick = () => setClock(new Date().toISOString().slice(0, 19).replace('T', ' ') + 'Z');
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const shortcuts: Record<string, string> = {
        g: '/', i: '/intel', e: '/entities', x: '/graph',
        t: '/timeline', p: '/platforms', r: '/reports', a: '/alerts',
      };
      const path = shortcuts[e.key.toLowerCase()];
      if (path) {
        e.preventDefault();
        router.push(path);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [router]);

  // Live stats from backend (falls back to defaults)
  const displayStats = [
    { value: stats?.node_count ? `${Math.round(stats.node_count / 1000)}K` : '146', label: 'Collectors' },
    { value: stats?.relationship_count ? `${Math.round(stats.relationship_count / 1000)}K` : '1,347', label: 'Signals' },
    { value: '12', label: 'Platforms' },
    { value: '4', label: 'ISR Tasks' },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: '48px 1fr',
      gridTemplateColumns: '56px 1fr',
      height: '100vh',
      overflow: 'hidden',
      background: 'var(--surface-0)',
    }}>
      {/* SECURITY INITIALIZATION */}
      <SecurityInit />

      {/* TOP BAR */}
      <header style={{
        gridColumn: '1 / -1',
        background: 'var(--surface-1)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* GZM Crosshair Logo */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="var(--accent)" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="4" fill="var(--accent)" />
            <line x1="12" y1="2" x2="12" y2="6" stroke="var(--accent)" strokeWidth="1.5" />
            <line x1="12" y1="18" x2="12" y2="22" stroke="var(--accent)" strokeWidth="1.5" />
            <line x1="2" y1="12" x2="6" y2="12" stroke="var(--accent)" strokeWidth="1.5" />
            <line x1="18" y1="12" x2="22" y2="12" stroke="var(--accent)" strokeWidth="1.5" />
          </svg>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '14px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: 'var(--accent)',
          }}>GRAY ZONE MONITOR</span>
        </div>

        {/* Live Stats */}
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          {displayStats.map((stat) => (
            <div key={stat.label} style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                fontFeatureSettings: "'tnum' 1",
              }}>{stat.value}</span>
              <span style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}>{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Right: Clock + Connection */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: 'var(--accent)',
            fontFeatureSettings: "'tnum' 1",
          }}>{clock}</span>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: connected ? 'var(--green)' : 'var(--red)',
              transition: 'background 300ms',
            }} />
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: connected ? 'var(--green)' : 'var(--red)',
            }}>{connected ? 'LIVE' : 'OFFLINE'}</span>
          </div>
        </div>
      </header>

      {/* NAV RAIL */}
      <nav style={{
        background: 'var(--surface-1)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '12px',
        gap: '4px',
      }}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/' && pathname?.startsWith(item.path));
          return (
            <Link
              key={item.id}
              href={item.path}
              title={`${item.label} (${item.shortcut})`}
              style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                color: isActive ? 'var(--accent)' : 'var(--text-tertiary)',
                background: isActive ? 'var(--accent-subtle)' : 'transparent',
                textDecoration: 'none',
                transition: 'all var(--duration-fast) var(--ease-out)',
                fontSize: '16px',
                position: 'relative',
              }}
            >
              {item.icon.charAt(0).toUpperCase()}
            </Link>
          );
        })}

        <div style={{ flex: 1 }} />

        {NAV_BOTTOM.map((item) => {
          const isActive = pathname?.startsWith(item.path);
          return (
            <Link
              key={item.id}
              href={item.path}
              title={item.label}
              style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                color: isActive ? 'var(--accent)' : 'var(--text-tertiary)',
                background: isActive ? 'var(--accent-subtle)' : 'transparent',
                textDecoration: 'none',
                transition: 'all var(--duration-fast) var(--ease-out)',
                fontSize: '16px',
                position: 'relative',
              }}
            >
              {item.icon.charAt(0).toUpperCase()}
              {/* Alert badge */}
              {item.id === 'alerts' && alertCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  minWidth: '16px',
                  height: '16px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  fontWeight: 700,
                  color: 'var(--surface-0)',
                  background: 'var(--red)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                }}>{alertCount > 99 ? '99+' : alertCount}</span>
              )}
            </Link>
          );
        })}
        <div style={{ height: '12px' }} />
      </nav>

      {/* MAIN CONTENT */}
      <main style={{ overflow: 'auto', background: 'var(--surface-0)' }}>
        {children}
      </main>
    </div>
  );
}
