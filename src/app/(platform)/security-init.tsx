'use client';

import { useEffect } from 'react';
import { initAntiScrape, validateEnvironment, protectClipboard } from '@/lib/security';
import { generateFingerprint, initBehavioralTracking, persistFingerprint, reportFingerprint } from '@/lib/fingerprint';

/**
 * Security initialization component.
 * Mount once at the platform layout level.
 * Activates:
 * - Device fingerprinting (32+ signals, VPN-resistant)
 * - Behavioral biometrics (mouse/typing/scroll patterns)
 * - Anti-scrape (right-click, view-source, print disabled)
 * - DevTools lockout (detection + continuous blocking)
 * - Origin validation
 * - Clipboard watermarking
 * - Console social engineering warning
 * - Bot detection honeypots
 */
export function SecurityInit() {
  useEffect(() => {
    // === ENVIRONMENT VALIDATION ===
    validateEnvironment();

    // === ANTI-SCRAPE + DEVTOOLS BLOCK ===
    initAntiScrape();
    lockDevTools(); // Extra aggressive DevTools blocking

    // === CLIPBOARD PROTECTION ===
    protectClipboard();

    // === DEVICE FINGERPRINTING ===
    // Runs async, captures 32+ signals, reports to backend
    generateFingerprint().then((fp) => {
      persistFingerprint(fp);
      reportFingerprint(fp);

      // If bot detected, log and optionally block
      if (fp.is_bot) {
        console.warn('[GZM-SEC] Bot/automation detected:', fp.bot_signals);
        // In production, could redirect to a honeypot or show captcha
        if (process.env.NODE_ENV === 'production') {
          document.body.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0a0a0f;color:#ef4444;font-family:monospace;font-size:18px;text-align:center;padding:40px;">
              <div>
                <h1 style="font-size:48px;margin-bottom:16px;">\u26D4 ACCESS DENIED</h1>
                <p>Automated access detected. This incident has been logged.</p>
                <p style="color:#666;font-size:12px;margin-top:20px;">Ref: ${fp.device_id.slice(0, 12)}</p>
              </div>
            </div>
          `;
        }
      }

      // If VPN detected, log (don't block, just flag)
      if (fp.vpn_detected) {
        console.info('[GZM-SEC] VPN/proxy likely detected. Timezone/language mismatch.');
      }
    });

    // === BEHAVIORAL BIOMETRICS ===
    // Tracks mouse movement patterns, typing cadence, scroll behavior
    // Builds a human-vs-bot score over time
    initBehavioralTracking();

    // === CONSOLE WARNING ===
    if (process.env.NODE_ENV === 'production') {
      // Clear any previous logs first
      console.clear();
      console.log(
        '%c\u26A0\uFE0F STOP',
        'color: red; font-size: 48px; font-weight: bold; text-shadow: 2px 2px black;'
      );
      console.log(
        '%cThis is a classified intelligence system.',
        'font-size: 16px; color: #ef4444; font-weight: bold;'
      );
      console.log(
        '%cUnauthorized access, reverse engineering, or data extraction is a federal offense under 18 U.S.C. \u00A7 1030 (Computer Fraud and Abuse Act).\n\nYour device has been fingerprinted. This session is being monitored.',
        'font-size: 13px; color: #999;'
      );
    }
  }, []);

  // Honeypot fields (invisible, catches bots that auto-fill all form fields)
  return (
    <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: '-9999px', opacity: 0, pointerEvents: 'none' }}>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      <input type="email" name="email_confirm" tabIndex={-1} autoComplete="off" />
      <input type="text" name="phone_backup" tabIndex={-1} autoComplete="off" />
      <input type="password" name="secret_code" tabIndex={-1} autoComplete="off" />
    </div>
  );
}

/**
 * Aggressive DevTools lockout.
 * Works on login screen and all other pages.
 * Multiple detection methods that are hard to bypass.
 */
function lockDevTools(): void {
  if (typeof window === 'undefined') return;

  // Method 1: Continuous debugger statement (freezes DevTools if open)
  // Only in production to not annoy during development
  if (process.env.NODE_ENV === 'production') {
    const antiDebug = () => {
      const start = performance.now();
      // This line will pause execution if DevTools are open with breakpoints
      // eslint-disable-next-line no-debugger
      debugger;
      const end = performance.now();
      // If more than 100ms passed, debugger was open
      if (end - start > 100) {
        // DevTools detected via debugger timing
        document.body.style.display = 'none';
        window.location.href = '/unauthorized';
      }
    };
    // Run every 2 seconds
    setInterval(antiDebug, 2000);
  }

  // Method 2: Detect via toString (works in Chrome)
  if (process.env.NODE_ENV === 'production') {
    const element = new Image();
    let devtoolsDetected = false;
    Object.defineProperty(element, 'id', {
      get: function () {
        devtoolsDetected = true;
        // DevTools inspected this element
        console.clear();
      },
    });
    setInterval(() => {
      devtoolsDetected = false;
      console.log('%c', element as any);
      if (devtoolsDetected) {
        document.body.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0a0a0f;color:#ef4444;font-family:monospace;text-align:center;">
            <div>
              <h1 style="font-size:36px;">\u26D4 Developer Tools Detected</h1>
              <p style="color:#666;margin-top:12px;">This application cannot run with developer tools open.</p>
            </div>
          </div>
        `;
      }
    }, 1000);
  }

  // Method 3: Resize detection (DevTools docked changes window size)
  if (process.env.NODE_ENV === 'production') {
    let lastWidth = window.outerWidth;
    let lastHeight = window.outerHeight;

    setInterval(() => {
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;

      // Significant diff = docked DevTools
      if (widthDiff > 200 || heightDiff > 200) {
        // Don't nuke the page, just clear console and show warning
        console.clear();
        console.log('%c\u26D4 MONITORING ACTIVE', 'color: red; font-size: 24px; font-weight: bold;');
      }

      lastWidth = window.outerWidth;
      lastHeight = window.outerHeight;
    }, 500);
  }

  // Method 4: Block all keyboard shortcuts that open DevTools
  document.addEventListener('keydown', (e) => {
    // F12
    if (e.key === 'F12') { e.preventDefault(); e.stopPropagation(); return false; }
    // Ctrl+Shift+I (Inspect)
    if (e.ctrlKey && e.shiftKey && e.key === 'I') { e.preventDefault(); e.stopPropagation(); return false; }
    // Ctrl+Shift+J (Console)
    if (e.ctrlKey && e.shiftKey && e.key === 'J') { e.preventDefault(); e.stopPropagation(); return false; }
    // Ctrl+Shift+C (Element picker)
    if (e.ctrlKey && e.shiftKey && e.key === 'C') { e.preventDefault(); e.stopPropagation(); return false; }
    // Ctrl+U (View source)
    if (e.ctrlKey && e.key === 'u') { e.preventDefault(); e.stopPropagation(); return false; }
    // Cmd variants for Mac
    if (e.metaKey && e.altKey && e.key === 'i') { e.preventDefault(); e.stopPropagation(); return false; }
    if (e.metaKey && e.altKey && e.key === 'j') { e.preventDefault(); e.stopPropagation(); return false; }
    if (e.metaKey && e.shiftKey && e.key === 'c') { e.preventDefault(); e.stopPropagation(); return false; }
  }, true); // Capture phase to intercept before anything else

  // Method 5: Override console methods in production
  if (process.env.NODE_ENV === 'production') {
    const noop = () => {};
    // Keep console.error for genuine errors, nuke everything else
    (window as any).console.log = noop;
    (window as any).console.info = noop;
    (window as any).console.debug = noop;
    (window as any).console.table = noop;
    (window as any).console.dir = noop;
    (window as any).console.trace = noop;
  }
}
