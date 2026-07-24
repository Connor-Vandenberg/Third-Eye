'use client';

/**
 * Accessible Tooltip — WCAG SC 1.4.13 Compliant.
 *
 * Requirements (Content on Hover or Focus):
 * 1. DISMISSIBLE: Escape key closes without moving pointer/focus
 * 2. HOVERABLE: User can move pointer over tooltip without it disappearing
 * 3. PERSISTENT: Stays visible until trigger removed, user dismisses, or info invalid
 *
 * Additional accessibility:
 * - Tooltip announced to screen readers via aria-describedby
 * - Works on both hover AND keyboard focus
 * - 300ms delay before showing (prevents flash on quick pass)
 * - No flash on rapid hover in/out
 */

import { useCallback, useEffect, useId, useRef, useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactElement;
  /** Delay before showing (ms). Default 300. */
  delay?: number;
  /** Position relative to trigger */
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({
  content,
  children,
  delay = 300,
  position = 'top',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipId = useId();
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const show = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    showTimer.current = setTimeout(() => setIsVisible(true), delay);
  }, [delay]);

  const hide = useCallback(() => {
    if (showTimer.current) {
      clearTimeout(showTimer.current);
      showTimer.current = null;
    }
    // Small delay allows pointer to move to tooltip (HOVERABLE requirement)
    hideTimer.current = setTimeout(() => setIsVisible(false), 100);
  }, []);

  const dismiss = useCallback(() => {
    if (showTimer.current) clearTimeout(showTimer.current);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setIsVisible(false);
  }, []);

  // DISMISSIBLE: Escape key closes tooltip
  useEffect(() => {
    if (!isVisible) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        dismiss();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isVisible, dismiss]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (showTimer.current) clearTimeout(showTimer.current);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  return (
    <span className="tooltip-wrapper" style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger element */}
      <span
        ref={triggerRef as any}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        aria-describedby={isVisible ? tooltipId : undefined}
      >
        {children}
      </span>

      {/* Tooltip content — HOVERABLE: pointer can enter without dismiss */}
      {isVisible && (
        <div
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          className={`tooltip tooltip-${position}`}
          onMouseEnter={() => {
            // HOVERABLE: cancel hide when pointer enters tooltip
            if (hideTimer.current) {
              clearTimeout(hideTimer.current);
              hideTimer.current = null;
            }
          }}
          onMouseLeave={hide}
        >
          {content}
        </div>
      )}
    </span>
  );
}
