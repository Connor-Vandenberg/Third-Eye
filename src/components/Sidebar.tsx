'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { registerShortcuts, NAV_SHORTCUTS } from '@/lib/keyboard';
import { gzmApi } from '@/lib/api';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  shortcut: string;
  badge?: number | null;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [alertCount, setAlertCount] = useState<number | null>(null);
  const [systemOnline, setSystemOnline] = useState<boolean | null>(null);

  // Fetch live alert count
  useEffect(() => {
    const fetchStatus = async () => {
      const [alerts, health] = await Promise.all([
        gzmApi.alerts(1),
        gzmApi.health(),
      ]);
      if (alerts) setAlertCount(alerts.active_alerts);
      setSystemOnline(health?.status === 'ok' || health?.tigergraph === true);
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Register keyboard shortcuts for navigation
  useEffect(() => {
    const unregister = registerShortcuts(
      NAV_SHORTCUTS.map((s) => ({
        key: s.key,
        action: () => router.push(s.path),
        description: `Navigate to ${s.label}`,
      }))
    );
    return unregister;
  }, [router]);

  const navItems: NavItem[] = [
    { href: '/', label: 'Globe', icon: '\u{1F310}', shortcut: 'G' },
    { href: '/intel', label: 'Intel Feed', icon: '\u{1F4E1}', shortcut: 'I' },
    { href: '/entities', label: 'Entities', icon: '\u{1F50D}', shortcut: 'E' },
    { href: '/graph', label: 'Graph', icon: '\u{1F578}\uFE0F', shortcut: 'X' },
    { href: '/timeline', label: 'Timeline', icon: '\u{23F1}\uFE0F', shortcut: 'T' },
    { href: '/alerts', label: 'Alerts', icon: '\u{1F514}', shortcut: 'A', badge: alertCount },
    { href: '/reports', label: 'Reports', icon: '\u{1F4CB}', shortcut: 'R' },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 z-50 flex flex-col transition-all duration-200 select-none ${
        collapsed ? 'w-[60px]' : 'w-[220px]'
      }`}
      style={{
        background: '#0a0a0f',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Brand */}
      <div
        className="flex items-center gap-2.5 px-4 h-[52px] flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
          systemOnline === true ? 'bg-emerald-400 animate-pulse' :
          systemOnline === false ? 'bg-red-400' : 'bg-zinc-600'
        }`} />
        {!collapsed && (
          <span
            className="text-[10px] font-bold tracking-[0.12em] uppercase whitespace-nowrap"
            style={{ color: '#22d3ee' }}
          >
            Gray Zone Monitor
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto scrollbar-none">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 px-3 py-2 rounded-md text-[12px] font-medium transition-all duration-150 ${
                isActive
                  ? 'text-white'
                  : 'text-[rgba(240,240,255,0.45)] hover:text-[rgba(240,240,255,0.85)] hover:bg-[rgba(255,255,255,0.03)]'
              }`}
              style={isActive ? {
                background: 'rgba(34,211,238,0.06)',
                borderLeft: '2px solid #22d3ee',
                paddingLeft: '10px',
              } : undefined}
            >
              <span className="text-[15px] flex-shrink-0 w-5 text-center">{item.icon}</span>
              {!collapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {item.badge != null && item.badge > 0 && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 tabular-nums">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                  <span className="text-[9px] text-[rgba(240,240,255,0.2)] font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.shortcut}
                  </span>
                </>
              )}

              {/* Tooltip on collapsed */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2.5 py-1.5 rounded-md text-[11px] font-medium text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-[100]" style={{ background: '#1c1c2e', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {item.label}
                  {item.badge != null && item.badge > 0 && (
                    <span className="ml-2 text-red-400">({item.badge})</span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-[11px] text-[rgba(240,240,255,0.3)] hover:text-[rgba(240,240,255,0.6)] hover:bg-[rgba(255,255,255,0.03)] transition-all"
        >
          <span className="text-[13px] w-5 text-center">{collapsed ? '\u{25B6}' : '\u{25C0}'}</span>
          {!collapsed && <span>Collapse</span>}
        </button>
        {!collapsed && (
          <div className="mt-2 px-3 text-[9px] text-[rgba(240,240,255,0.2)] space-y-0.5">
            <div>146+ collectors \u00b7 89+ engines</div>
            <div>v3.2.1 \u00b7 grayzonemonitor.com</div>
          </div>
        )}
      </div>
    </aside>
  );
}
