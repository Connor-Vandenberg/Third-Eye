'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { NAV_ITEMS } from '@/lib/constants';

interface CommandItem {
  id: string;
  label: string;
  category: string;
  action: () => void;
  shortcut?: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Build command list
  const commands: CommandItem[] = [
    ...NAV_ITEMS.map((item) => ({
      id: `nav-${item.id}`,
      label: item.label,
      category: 'Navigation',
      action: () => { router.push(item.path); setOpen(false); },
      shortcut: item.shortcut,
    })),
    { id: 'nav-alerts', label: 'Alerts', category: 'Navigation', action: () => { router.push('/alerts'); setOpen(false); }, shortcut: 'A' },
    { id: 'action-task-drone', label: 'Task Drone (RAVEN-01)', category: 'Actions', action: () => { router.push('/platforms'); setOpen(false); } },
    { id: 'action-task-satellite', label: 'Task Satellite', category: 'Actions', action: () => { router.push('/platforms'); setOpen(false); } },
    { id: 'action-generate-report', label: 'Generate Situation Report', category: 'Actions', action: () => { router.push('/reports'); setOpen(false); } },
    { id: 'action-export-stix', label: 'Export STIX 2.1', category: 'Actions', action: () => { setOpen(false); } },
    { id: 'action-run-isr-cycle', label: 'Run ISR Cycle (Manual)', category: 'Actions', action: () => { fetch('/api/v1/isr/cycle', { method: 'POST' }); setOpen(false); } },
    { id: 'entity-caspian', label: 'MV CASPIAN STAR', category: 'Entities', action: () => { router.push('/entities/MV%20CASPIAN%20STAR'); setOpen(false); } },
    { id: 'entity-alrashid', label: 'Al-Rashid Trading FZE', category: 'Entities', action: () => { router.push('/entities/Al-Rashid%20Trading%20FZE'); setOpen(false); } },
    { id: 'entity-irgc', label: 'IRGC Quds Force Network', category: 'Entities', action: () => { router.push('/entities/IRGC%20Quds%20Force%20Network'); setOpen(false); } },
    { id: 'briefing-iran', label: 'Country Briefing: Iran', category: 'Reports', action: () => { router.push('/reports'); setOpen(false); } },
    { id: 'briefing-russia', label: 'Country Briefing: Russia', category: 'Reports', action: () => { router.push('/reports'); setOpen(false); } },
    { id: 'briefing-china', label: 'Country Briefing: China', category: 'Reports', action: () => { router.push('/reports'); setOpen(false); } },
  ];

  const filtered = query
    ? commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()) || c.category.toLowerCase().includes(query.toLowerCase()))
    : commands;

  // Keyboard: Cmd+K to open, Escape to close, arrows to navigate, Enter to select
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) { inputRef.current?.focus(); setQuery(''); setSelectedIndex(0); }
  }, [open]);

  useEffect(() => { setSelectedIndex(0); }, [query]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && filtered[selectedIndex]) { filtered[selectedIndex].action(); }
  }, [filtered, selectedIndex]);

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh' }} onClick={() => setOpen(false)}>
      {/* Backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />

      {/* Palette */}
      <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', width: '560px', maxHeight: '400px', background: 'var(--surface-1)', border: '1px solid var(--border-default)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        {/* Input */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search commands, entities, actions..."
            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: '16px', color: 'var(--text-primary)', fontFamily: 'var(--font-ui)' }}
          />
        </div>

        {/* Results */}
        <div style={{ maxHeight: '320px', overflow: 'auto', padding: '8px' }}>
          {filtered.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>No results</div>}
          {filtered.map((item, i) => (
            <div
              key={item.id}
              onClick={item.action}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
                background: i === selectedIndex ? 'var(--surface-3)' : 'transparent',
                transition: 'background 80ms',
              }}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{item.label}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{item.category}</div>
              </div>
              {item.shortcut && <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', padding: '2px 6px', background: 'var(--surface-2)', borderRadius: '4px', color: 'var(--text-muted)' }}>{item.shortcut}</kbd>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
