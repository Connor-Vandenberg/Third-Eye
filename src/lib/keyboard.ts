/**
 * GZM Global Keyboard Shortcuts
 *
 * Navigation:
 *   G = Globe (map view)
 *   I = Intel Feed
 *   E = Entities
 *   X = Graph Explorer
 *   T = Timeline
 *   A = Alerts
 *   R = Reports
 *   Cmd+K / Ctrl+K = Quick search
 *   Escape = Close modal/panel
 */

export interface ShortcutConfig {
  key: string;
  meta?: boolean; // Cmd/Ctrl
  shift?: boolean;
  action: () => void;
  description: string;
}

const isInputFocused = (): boolean => {
  const active = document.activeElement;
  if (!active) return false;
  const tag = active.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || (active as HTMLElement).isContentEditable;
};

export function registerShortcuts(shortcuts: ShortcutConfig[]): () => void {
  const handler = (e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs (except Cmd+K and Escape)
    const isMeta = e.metaKey || e.ctrlKey;

    for (const shortcut of shortcuts) {
      const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
      const metaMatch = shortcut.meta ? isMeta : !isMeta;
      const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;

      if (keyMatch && metaMatch && shiftMatch) {
        // Allow Cmd+K and Escape even when input focused
        if (isInputFocused() && !shortcut.meta && shortcut.key !== 'Escape') {
          continue;
        }
        e.preventDefault();
        shortcut.action();
        return;
      }
    }
  };

  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}

export const NAV_SHORTCUTS: Array<{ key: string; path: string; label: string }> = [
  { key: 'g', path: '/', label: 'Globe' },
  { key: 'i', path: '/intel', label: 'Intel Feed' },
  { key: 'e', path: '/entities', label: 'Entities' },
  { key: 'x', path: '/graph', label: 'Graph' },
  { key: 't', path: '/timeline', label: 'Timeline' },
  { key: 'a', path: '/alerts', label: 'Alerts' },
  { key: 'r', path: '/reports', label: 'Reports' },
];
