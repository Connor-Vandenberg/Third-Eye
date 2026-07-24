'use client';

/**
 * Loading State Announcer — Accessible async operation feedback.
 * WCAG SC 4.1.3 (Status Messages)
 *
 * Announces loading start/completion to screen readers via role="status".
 * Sighted users see visual spinners/skeletons; SR users hear this.
 */

import { useEffect, useRef } from 'react';

interface LoadingAnnouncerProps {
  isLoading: boolean;
  loadingMessage?: string;
  completedMessage?: string;
  errorMessage?: string;
  hasError?: boolean;
}

export function LoadingAnnouncer({
  isLoading,
  loadingMessage = 'Loading data...',
  completedMessage = 'Content loaded.',
  errorMessage = 'Error loading content.',
  hasError = false,
}: LoadingAnnouncerProps) {
  const prevLoading = useRef(isLoading);
  const announcementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only announce transitions, not initial state
    if (prevLoading.current !== isLoading) {
      prevLoading.current = isLoading;
    }
  }, [isLoading]);

  const getMessage = () => {
    if (hasError) return errorMessage;
    if (isLoading) return loadingMessage;
    if (!isLoading && prevLoading.current) return completedMessage;
    return '';
  };

  return (
    <div
      ref={announcementRef}
      role={hasError ? 'alert' : 'status'}
      aria-live={hasError ? 'assertive' : 'polite'}
      aria-atomic="true"
      className="sr-only"
    >
      {getMessage()}
    </div>
  );
}
