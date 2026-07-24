'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  shortcut: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Globe', icon: '🌐', shortcut: 'G' },
  { href: '/intel', label: 'Intel Feed', icon: '📡', shortcut: 'I' },
  { href: '/entities', label: 'Entities', icon: '🔍', shortcut: 'E' },
  { href: '/graph', label: 'Graph', icon: '🕸️', shortcut: 'X' },
  { href: '/timeline', label: 'Timeline', icon: '⏱️', shortcut: 'T' },
  { href: '/alerts', label: 'Alerts', icon: '🔔', shortcut: 'A' },
  { href: '/reports', label: 'Reports', icon: '📋', shortcut: 'R' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 z-50 flex flex-col border-r transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-56'
      }`}
      style={{
        background: '#0a0a0f',
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2 px-4 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        {!collapsed && (
          <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: '#22d3ee' }}>
            Gray Zone Monitor
          </span>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
                isActive
                  ? 'text-white'
                  : 'text-[rgba(240,240,255,0.5)] hover:text-[rgba(240,240,255,0.8)] hover:bg-[rgba(255,255,255,0.04)]'
              }`}
              style={isActive ? { background: 'rgba(34,211,238,0.08)', borderLeft: '2px solid #22d3ee' } : {}}
              title={collapsed ? `${item.label} (${item.shortcut})` : undefined}
            >
              <span className="text-base flex-shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.href === '/alerts' && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold">
                  ●
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t space-y-1" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-[12px] text-[rgba(240,240,255,0.4)] hover:text-[rgba(240,240,255,0.7)] hover:bg-[rgba(255,255,255,0.04)] transition-colors"
        >
          <span>{collapsed ? '→' : '←'}</span>
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
