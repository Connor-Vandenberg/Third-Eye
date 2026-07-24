'use client';

/**
 * ARIA Live Region Provider — Screen reader announcement system.
 * WCAG SC 4.1.3: Status Messages
 *
 * Three-tier urgency model for GZM:
 * - assertive: Critical threat alerts, system errors (interrupts immediately)
 * - polite: Intelligence updates, filter results (announced at next pause)
 * - off: Background updates (not announced, available on navigation)
 *
 * Includes throttling to prevent announcement floods from WebSocket streams.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

interface Announcement {
  id: string;
  message: string;
  priority: 'polite' | 'assertive';
  timestamp: number;
}

const THROTTLE_MS = 2000; // Minimum gap between polite announcements
const MAX_QUEUE_SIZE = 10;

export function LiveRegionProvider({ children }: { children: React.ReactNode }) {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');
  const lastAnnounceTime = useRef(0);
  const queueRef = useRef<Announcement[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const processQueue = useCallback(() => {
    const now = Date.now();
    const queue = queueRef.current;

    if (queue.length === 0) return;

    // Process assertive immediately
    const assertiveIdx = queue.findIndex(a => a.priority === 'assertive');
    if (assertiveIdx >= 0) {
      const item = queue.splice(assertiveIdx, 1)[0];
      setAssertiveMessage(item.message);
      // Clear after announcement
      setTimeout(() => setAssertiveMessage(''), 100);
      lastAnnounceTime.current = now;
    }

    // Process polite with throttling
    if (now - lastAnnounceTime.current >= THROTTLE_MS) {
      const politeIdx = queue.findIndex(a => a.priority === 'polite');
      if (politeIdx >= 0) {
        // If multiple polite messages queued, batch them
        const politeItems = queue.filter(a => a.priority === 'polite');
        queueRef.current = queue.filter(a => a.priority !== 'polite');

        const batchedMessage = politeItems.length > 1
          ? `${politeItems.length} updates: ${politeItems.map(i => i.message).join('. ')}`
          : politeItems[0].message;

        setPoliteMessage(batchedMessage);
        setTimeout(() => setPoliteMessage(''), 100);
        lastAnnounceTime.current = now;
      }
    } else {
      // Schedule retry
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(
        processQueue,
        THROTTLE_MS - (now - lastAnnounceTime.current),
      );
    }
  }, []);

  const announce = useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      const announcement: Announcement = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        message,
        priority,
        timestamp: Date.now(),
      };

      // Trim queue if too long
      if (queueRef.current.length >= MAX_QUEUE_SIZE) {
        queueRef.current = queueRef.current.slice(-MAX_QUEUE_SIZE / 2);
      }

      queueRef.current.push(announcement);
      processQueue();
    },
    [processQueue],
  );

  // Listen for custom announce events (from useAnnounce hook)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.message) {
        announce(detail.message, detail.priority || 'polite');
      }
    };
    window.addEventListener('gzm:announce', handler);
    return () => window.removeEventListener('gzm:announce', handler);
  }, [announce]);

  return (
    <>
      {children}

      {/* Assertive live region — interrupts screen reader immediately */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveMessage}
      </div>

      {/* Polite live region — announced at next pause */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeMessage}
      </div>

      {/* Log region for accumulated updates (navigable, not auto-announced) */}
      <div
        role="log"
        aria-live="off"
        aria-label="Activity log"
        aria-relevant="additions"
        className="sr-only"
        id="gzm-activity-log"
      />
    </>
  );
}
