'use client';

import { useEffect } from 'react';

/**
 * Keyboard Shortcuts Hook
 * Global keyboard shortcuts for the intelligence map.
 *
 * Shortcuts:
 * F - Toggle fullscreen
 * S - Share current view (copy URL with viewport state)
 * R - Reset view to default
 * Q - Open NL query panel
 * L - Toggle layer panel
 * 3 - Toggle 3D globe mode
 * Escape - Close all panels
 * Space - Play/pause timeline
 * [ - Slow down timeline
 * ] - Speed up timeline
 */

interface ShortcutHandlers {
  onFullscreen?: () => void;
  onShare?: () => void;
  onReset?: () => void;
  onQuery?: () => void;
  onToggleLayers?: () => void;
  onToggle3D?: () => void;
  onEscape?: () => void;
  onPlayPause?: () => void;
  onSlowDown?: () => void;
  onSpeedUp?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'f':
          e.preventDefault();
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            document.documentElement.requestFullscreen();
          }
          handlers.onFullscreen?.();
          break;

        case 's':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            handlers.onShare?.();
          }
          break;

        case 'r':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            handlers.onReset?.();
          }
          break;

        case 'q':
          e.preventDefault();
          handlers.onQuery?.();
          break;

        case 'l':
          e.preventDefault();
          handlers.onToggleLayers?.();
          break;

        case '3':
          e.preventDefault();
          handlers.onToggle3D?.();
          break;

        case 'escape':
          handlers.onEscape?.();
          break;

        case ' ':
          e.preventDefault();
          handlers.onPlayPause?.();
          break;

        case '[':
          e.preventDefault();
          handlers.onSlowDown?.();
          break;

        case ']':
          e.preventDefault();
          handlers.onSpeedUp?.();
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}
