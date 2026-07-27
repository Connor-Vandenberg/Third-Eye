'use client';

import { useEffect, useCallback, useRef } from 'react';

// KEYBOARD SHORTCUTS SYSTEM
// Vim-inspired navigation for intelligence analysts
// Every action reachable via keyboard. Displays hints on hover.
// Critical for operator credibility in defense environments.

export interface KeyboardShortcut {
  key: string; // e.g. 'g+c' for go-to-cop, 'space' for play/pause
  description: string;
  category: 'navigation' | 'actions' | 'view' | 'playback' | 'selection';
  action: () => void;
  when?: () => boolean; // Condition for shortcut to be active
}

const MODIFIER_KEYS = ['Control', 'Alt', 'Shift', 'Meta'];

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const pendingRef = useRef<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore when typing in inputs
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

    const key = event.key.toLowerCase();

    // Handle modifier combos (Ctrl+K, etc)
    if (event.ctrlKey || event.metaKey) {
      const comboKey = `ctrl+${key}`;
      const match = shortcuts.find(s => s.key === comboKey && (!s.when || s.when()));
      if (match) { event.preventDefault(); match.action(); return; }
    }

    // Handle two-key sequences (g+c, g+s, etc)
    if (pendingRef.current) {
      const combo = `${pendingRef.current}+${key}`;
      const match = shortcuts.find(s => s.key === combo && (!s.when || s.when()));
      pendingRef.current = null;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (match) { event.preventDefault(); match.action(); return; }
    }

    // Check if this could be the start of a sequence
    const possibleSequences = shortcuts.filter(s => s.key.startsWith(`${key}+`));
    if (possibleSequences.length > 0) {
      pendingRef.current = key;
      timeoutRef.current = setTimeout(() => { pendingRef.current = null; }, 500);
      return;
    }

    // Single key shortcuts
    const match = shortcuts.find(s => s.key === key && (!s.when || s.when()));
    if (match) { event.preventDefault(); match.action(); }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Pre-built shortcut set for GZM Third-Eye
export function useGZMShortcuts(options: {
  navigate: (path: string) => void;
  togglePlay?: () => void;
  toggleFullscreen?: () => void;
  openSearch?: () => void;
  openAnalyst?: () => void;
  clearSelection?: () => void;
  zoomIn?: () => void;
  zoomOut?: () => void;
  nextEvent?: () => void;
  prevEvent?: () => void;
  acknowledgeAlert?: () => void;
}) {
  const shortcuts: KeyboardShortcut[] = [
    // Navigation (g + letter = go to page)
    { key: 'g+c', description: 'Go to COP', category: 'navigation', action: () => options.navigate('/cop') },
    { key: 'g+g', description: 'Go to Globe', category: 'navigation', action: () => options.navigate('/globe') },
    { key: 'g+s', description: 'Go to Signals', category: 'navigation', action: () => options.navigate('/signals') },
    { key: 'g+m', description: 'Go to Metrics', category: 'navigation', action: () => options.navigate('/metrics') },
    { key: 'g+a', description: 'Go to Analyst', category: 'navigation', action: () => options.navigate('/analyst') },
    { key: 'g+t', description: 'Go to Tasking', category: 'navigation', action: () => options.navigate('/tasking') },
    { key: 'g+k', description: 'Go to Kill Chain', category: 'navigation', action: () => options.navigate('/kill-chain') },
    { key: 'g+e', description: 'Go to Entities', category: 'navigation', action: () => options.navigate('/entities') },
    { key: 'g+n', description: 'Go to Mesh/Network', category: 'navigation', action: () => options.navigate('/mesh') },
    { key: 'g+l', description: 'Go to Learning', category: 'navigation', action: () => options.navigate('/learning') },
    { key: 'g+r', description: 'Go to Reports', category: 'navigation', action: () => options.navigate('/reports') },
    { key: 'g+h', description: 'Go to Schema', category: 'navigation', action: () => options.navigate('/schema-explorer') },
    { key: 'g+b', description: 'Go to Analysis Builder', category: 'navigation', action: () => options.navigate('/analysis-builder') },
    { key: 'g+f', description: 'Go to Fleet/Platforms', category: 'navigation', action: () => options.navigate('/platforms') },
    { key: 'g+w', description: 'Go to Watchlist', category: 'navigation', action: () => options.navigate('/watchlist') },
    { key: 'g+i', description: 'Go to Lifecycle', category: 'navigation', action: () => options.navigate('/lifecycle') },
    { key: 'g+o', description: 'Go to Collaborate', category: 'navigation', action: () => options.navigate('/collaborate') },

    // Search
    { key: '/', description: 'Open search', category: 'actions', action: () => options.openSearch?.() },
    { key: 'ctrl+k', description: 'Open command palette', category: 'actions', action: () => options.openSearch?.() },

    // Playback controls
    { key: ' ', description: 'Play/Pause temporal playback', category: 'playback', action: () => options.togglePlay?.() },
    { key: 'arrowright', description: 'Next event / Step forward', category: 'playback', action: () => options.nextEvent?.() },
    { key: 'arrowleft', description: 'Previous event / Step backward', category: 'playback', action: () => options.prevEvent?.() },

    // View controls
    { key: 'f', description: 'Toggle fullscreen', category: 'view', action: () => options.toggleFullscreen?.() },
    { key: '=', description: 'Zoom in', category: 'view', action: () => options.zoomIn?.() },
    { key: '-', description: 'Zoom out', category: 'view', action: () => options.zoomOut?.() },

    // Selection
    { key: 'escape', description: 'Clear selection / Close panel', category: 'selection', action: () => options.clearSelection?.() },

    // Alerts
    { key: 'a', description: 'Acknowledge active alert', category: 'actions', action: () => options.acknowledgeAlert?.() },

    // Quick access
    { key: '?', description: 'Show keyboard shortcuts', category: 'view', action: () => { /* Show shortcut modal */ } },
  ];

  useKeyboardShortcuts(shortcuts);
  return shortcuts;
}

// Shortcut hint component (shows on hover)
export function ShortcutHint({ shortcut, className = '' }: { shortcut: string; className?: string }) {
  const parts = shortcut.split('+');
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      {parts.map((part, i) => (
        <span key={i}>
          <kbd className="text-[8px] px-1 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 font-mono">
            {part === 'ctrl' ? '⌘' : part === 'shift' ? '⇧' : part === 'escape' ? 'esc' : part === ' ' ? '␣' : part}
          </kbd>
          {i < parts.length - 1 && <span className="text-[7px] text-zinc-600 mx-0.5">+</span>}
        </span>
      ))}
    </span>
  );
}

export default useKeyboardShortcuts;
