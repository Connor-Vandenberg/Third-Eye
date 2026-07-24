/**
 * GZM Accessibility Utilities — Core hooks, helpers, and constants
 * for WCAG 2.1 AA compliance across the entire platform.
 *
 * Provides:
 * - Focus management (trap, restore, skip-to-content)
 * - Screen reader announcements (live regions)
 * - Keyboard navigation helpers
 * - Reduced motion detection
 * - Contrast-safe color tokens
 * - ARIA attribute builders
 */

import { useCallback, useEffect, useId, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** WCAG 2.1 AA contrast ratios */
export const CONTRAST = {
  TEXT_NORMAL: 4.5,    // SC 1.4.3
  TEXT_LARGE: 3.0,     // SC 1.4.3
  UI_COMPONENT: 3.0,   // SC 1.4.11
  FOCUS_INDICATOR: 3.0, // SC 2.4.7 (enhanced)
} as const;

/** Keyboard codes for accessible interactions */
export const KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
} as const;

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Detect reduced motion preference (SC 2.3.1 helper).
 * Returns true if user prefers reduced motion.
 */
export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return prefersReduced;
}

/**
 * Focus trap hook for modals, dialogs, and overlays (SC 2.1.2).
 * Traps Tab/Shift+Tab within container. Escape calls onClose.
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  isActive: boolean,
  onClose?: () => void,
) {
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Store current focus to restore later
    previousFocus.current = document.activeElement as HTMLElement;

    // Focus first focusable element
    const focusables = getFocusableElements(containerRef.current);
    if (focusables.length > 0) {
      (focusables[0] as HTMLElement).focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === KEYS.ESCAPE && onClose) {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== KEYS.TAB) return;

      const focusables = getFocusableElements(containerRef.current!);
      if (focusables.length === 0) return;

      const first = focusables[0] as HTMLElement;
      const last = focusables[focusables.length - 1] as HTMLElement;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus on unmount
      if (previousFocus.current && previousFocus.current.focus) {
        previousFocus.current.focus();
      }
    };
  }, [isActive, containerRef, onClose]);
}

/**
 * Announce messages to screen readers via live regions.
 * Returns announce function. Messages are queued and cleared automatically.
 */
export function useAnnounce() {
  const announce = useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      const event = new CustomEvent('gzm:announce', {
        detail: { message, priority },
      });
      window.dispatchEvent(event);
    },
    [],
  );

  return announce;
}

/**
 * Generate unique IDs for ARIA relationships (describedby, labelledby, etc.).
 */
export function useAriaIds(prefix: string) {
  const reactId = useId();
  return {
    labelId: `${prefix}-label-${reactId}`,
    descId: `${prefix}-desc-${reactId}`,
    errorId: `${prefix}-error-${reactId}`,
    helpId: `${prefix}-help-${reactId}`,
  };
}

/**
 * Roving tabindex for composite widgets (SC 2.1.1).
 * Manages focus within a group of elements using arrow keys.
 */
export function useRovingTabindex(
  items: HTMLElement[],
  options: {
    orientation?: 'horizontal' | 'vertical' | 'both';
    loop?: boolean;
  } = {},
) {
  const { orientation = 'both', loop = true } = options;
  const [activeIndex, setActiveIndex] = useState(0);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const prevKeys =
        orientation === 'horizontal'
          ? [KEYS.ARROW_LEFT]
          : orientation === 'vertical'
            ? [KEYS.ARROW_UP]
            : [KEYS.ARROW_LEFT, KEYS.ARROW_UP];

      const nextKeys =
        orientation === 'horizontal'
          ? [KEYS.ARROW_RIGHT]
          : orientation === 'vertical'
            ? [KEYS.ARROW_DOWN]
            : [KEYS.ARROW_RIGHT, KEYS.ARROW_DOWN];

      let newIndex = activeIndex;

      if (prevKeys.includes(e.key as any)) {
        e.preventDefault();
        newIndex = activeIndex - 1;
        if (newIndex < 0) newIndex = loop ? items.length - 1 : 0;
      } else if (nextKeys.includes(e.key as any)) {
        e.preventDefault();
        newIndex = activeIndex + 1;
        if (newIndex >= items.length) newIndex = loop ? 0 : items.length - 1;
      } else if (e.key === KEYS.HOME) {
        e.preventDefault();
        newIndex = 0;
      } else if (e.key === KEYS.END) {
        e.preventDefault();
        newIndex = items.length - 1;
      }

      if (newIndex !== activeIndex) {
        setActiveIndex(newIndex);
        items[newIndex]?.focus();
      }
    },
    [activeIndex, items, orientation, loop],
  );

  return { activeIndex, setActiveIndex, handleKeyDown };
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/** Get all focusable elements within a container. */
export function getFocusableElements(container: HTMLElement): NodeListOf<Element> {
  return container.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), ' +
    'select:not([disabled]), textarea:not([disabled]), ' +
    '[tabindex]:not([tabindex="-1"]), [contenteditable="true"]',
  );
}

/** Check if element is visible (not hidden via CSS or ARIA). */
export function isElementVisible(el: HTMLElement): boolean {
  if (el.getAttribute('aria-hidden') === 'true') return false;
  const style = window.getComputedStyle(el);
  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
}

/** Build aria-label from multiple parts, filtering empty strings. */
export function buildAriaLabel(...parts: (string | undefined | null)[]): string {
  return parts.filter(Boolean).join(', ');
}

/**
 * Calculate relative luminance of a color (for contrast checking).
 * Input: hex color string (#RRGGBB)
 */
export function relativeLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const linearize = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/** Calculate contrast ratio between two hex colors. */
export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
