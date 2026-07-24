'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { NAV_ITEMS, NAV_BOTTOM } from '@/lib/constants';

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [clock, setClock] = useState('');
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const tick = () => setClock(new Date().toISOString().slice(0, 19) + 'Z');
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Keyboard shortcuts
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const shortcuts: Record<string, string> = {
        g: '/', i: '/intel', e: '/entities', x: '/graph',
        t: '/timeline', p: '/platforms', r: '/reports', a: '/alerts',
      };
      const path = shortcuts[e.key.toLowerCase()];
      if (path) window.location.href = path;
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: '48px 1fr',
      gridTemplateColumns: '56px 1fr',
      height: '100vh',
      overflow: 'hidden',
      background: 'var(--surface-0)',
    }}>
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
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '15px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: 'var(--accent)',
          }}>GZM</span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-muted)',
            background: 'var(--surface-2)',
            padding: '2px 8px',
            borderRadius: '3px',
          }}>v4.1</span>
        </div>

        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          {[
            { value: '146', label: 'Collectors' },
            { value: '1,347', label: 'Signals' },
            { value: '12', label: 'Platforms' },
            { value: '4', label: 'ISR Tasks' },
          ].map((stat) => (
            <div key={stat.label} style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            color: 'var(--accent)',
          }}>{clock}</span>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: connected ? 'var(--green)' : 'var(--red)',
          }} />
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
                fontSize: '18px',
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
                fontSize: '18px',
              }}
            >
              {item.icon.charAt(0).toUpperCase()}
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
