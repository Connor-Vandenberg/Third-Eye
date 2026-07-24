'use client';

/**
 * Skip Navigation — First focusable element on every page.
 * WCAG SC 2.4.1: Bypass Blocks
 *
 * Appears only on focus (keyboard users). Skips past navigation
 * to main content. Required for all pages.
 */

import { useCallback } from 'react';

export function SkipNavigation() {
  const handleClick = useCallback(() => {
    const main = document.querySelector('main') || document.getElementById('main-content');
    if (main) {
      main.setAttribute('tabindex', '-1');
      main.focus();
      // Remove tabindex after blur to avoid unexpected tab stops
      main.addEventListener('blur', () => main.removeAttribute('tabindex'), { once: true });
    }
  }, []);

  return (
    <a
      href="#main-content"
      onClick={(e) => {
        e.preventDefault();
        handleClick();
      }}
      className="skip-navigation"
      aria-label="Skip to main content"
    >
      Skip to main content
    </a>
  );
}

// CSS (add to global styles):
// .skip-navigation {
//   position: absolute;
//   top: -100%;
//   left: 16px;
//   z-index: 9999;
//   padding: 8px 16px;
//   background: var(--color-surface-elevated);
//   color: var(--color-text-primary);
//   border: 2px solid var(--color-focus-ring);
//   border-radius: 4px;
//   font-size: 14px;
//   font-weight: 500;
//   text-decoration: none;
//   transition: top 0.15s ease;
// }
// .skip-navigation:focus {
//   top: 16px;
//   outline: none;
// }
