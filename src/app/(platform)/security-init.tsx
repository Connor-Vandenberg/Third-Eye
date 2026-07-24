'use client';

import { useEffect } from 'react';
import { initAntiScrape, validateEnvironment, protectClipboard } from '@/lib/security';

/**
 * Security initialization component.
 * Mount once at the platform layout level.
 * Activates: anti-scrape, origin validation, clipboard protection, DevTools detection.
 */
export function SecurityInit() {
  useEffect(() => {
    // Validate we're running on an authorized origin
    validateEnvironment();

    // Enable anti-scrape protections (production only)
    initAntiScrape();

    // Watermark sensitive clipboard copies
    protectClipboard();

    // Console warning for social engineering attacks
    if (process.env.NODE_ENV === 'production') {
      console.log(
        '%c\u26A0\uFE0F STOP',
        'color: red; font-size: 40px; font-weight: bold; text-shadow: 2px 2px black;'
      );
      console.log(
        '%cThis is a classified intelligence system. Unauthorized access is a federal offense under 18 U.S.C. \u00A7 1030.',
        'font-size: 14px; color: white;'
      );
    }
  }, []);

  // Honeypot field (invisible, catches bots that auto-fill all fields)
  return (
    <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: '-9999px', opacity: 0 }}>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      <input type="email" name="email_confirm" tabIndex={-1} autoComplete="off" />
    </div>
  );
}
