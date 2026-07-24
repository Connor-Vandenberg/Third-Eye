'use client';

/**
 * Route Change Announcer — Focus Management for SPA Navigation.
 *
 * Next.js App Router has a built-in route announcer that announces the page title,
 * but it does NOT manage focus. This component:
 * 1. Detects route changes via pathname
 * 2. Moves focus to main content (or h1) on navigation
 * 3. Announces new page to screen readers
 *
 * Without this, keyboard/SR users are stranded at their previous position
 * after a client-side navigation.
 *
 * WCAG: SC 2.4.3 (Focus Order), SC 3.2.1 (On Focus)
 */

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAnnounce } from '@/lib/accessibility';

export function RouteAnnouncer() {
  const pathname = usePathname();
  const previousPath = useRef(pathname);
  const announce = useAnnounce();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip on initial mount (page already has focus)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (pathname === previousPath.current) return;
    previousPath.current = pathname;

    // Small delay for new page content to render
    const timer = setTimeout(() => {
      // Try to find the main heading or main content
      const h1 = document.querySelector('h1');
      const main = document.querySelector('main') || document.getElementById('main-content');
      const target = h1 || main;

      if (target) {
        // Make it focusable temporarily
        if (!target.hasAttribute('tabindex')) {
          target.setAttribute('tabindex', '-1');
          target.addEventListener(
            'blur',
            () => target.removeAttribute('tabindex'),
            { once: true },
          );
        }
        (target as HTMLElement).focus({ preventScroll: false });
      }

      // Announce page title
      const title = document.title || pathname;
      announce(`Navigated to ${title}`, 'polite');
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname, announce]);

  return null;
}
