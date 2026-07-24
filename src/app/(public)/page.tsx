'use client';

import { useEffect, useState } from 'react';
import { generateFingerprint, initBehavioralTracking, persistFingerprint, reportFingerprint } from '@/lib/fingerprint';

/**
 * Public login page.
 * DevTools are locked out HERE too (before auth).
 * Fingerprinting runs immediately on page load.
 * No intelligence data is accessible from this page.
 */
export default function LoginPage() {
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    // Lock DevTools on login screen
    lockLoginDevTools();

    // Start behavioral tracking immediately
    initBehavioralTracking();

    // Fingerprint on arrival (before they even log in)
    generateFingerprint().then((fp) => {
      persistFingerprint(fp);
      reportFingerprint(fp);

      if (fp.is_bot) {
        setBlocked(true);
      }

      setLoading(false);
    });

    // Block right-click and view-source on login too
    const blockContext = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', blockContext);

    return () => document.removeEventListener('contextmenu', blockContext);
  }, []);

  if (blocked) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--surface-0)', fontFamily: 'var(--font-mono)', textAlign: 'center',
      }}>
        <div>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>\u26D4</div>
          <h1 style={{ color: 'var(--red)', fontSize: '24px', marginBottom: '8px' }}>ACCESS DENIED</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Automated access detected. This incident has been logged and reported.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--surface-0)',
    }}>
      <div style={{ width: '360px', padding: '40px' }}>
        {/* Logo + Brand */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 16px' }}>
            <circle cx="12" cy="12" r="10" stroke="var(--accent)" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="4" fill="var(--accent)" />
            <line x1="12" y1="2" x2="12" y2="6" stroke="var(--accent)" strokeWidth="1.5" />
            <line x1="12" y1="18" x2="12" y2="22" stroke="var(--accent)" strokeWidth="1.5" />
            <line x1="2" y1="12" x2="6" y2="12" stroke="var(--accent)" strokeWidth="1.5" />
            <line x1="18" y1="12" x2="22" y2="12" stroke="var(--accent)" strokeWidth="1.5" />
          </svg>
          <h1 style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '18px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: 'var(--accent)',
            marginBottom: '8px',
          }}>GRAY ZONE MONITOR</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
            Multi-Domain Intelligence Fusion Platform
          </p>
        </div>

        {/* Warning Banner */}
        <div style={{
          padding: '12px 16px',
          background: 'var(--red-subtle)',
          border: '1px solid var(--red)',
          borderRadius: '6px',
          marginBottom: '24px',
          fontSize: '11px',
          color: 'var(--red)',
          lineHeight: 1.5,
        }}>
          \u26A0\uFE0F WARNING: This system contains classified intelligence. Unauthorized access is a violation of 18 U.S.C. \u00A7 1030. All sessions are monitored and fingerprinted.
        </div>

        {/* Login Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              spellCheck={false}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'var(--surface-2)',
                border: '1px solid var(--border-default)',
                borderRadius: '6px',
                fontSize: '14px',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
              placeholder="operator@grayzonemonitor.com"
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'var(--surface-2)',
                border: '1px solid var(--border-default)',
                borderRadius: '6px',
                fontSize: '14px',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
              placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
            />
          </div>
          <button style={{
            width: '100%',
            padding: '12px',
            background: 'var(--accent)',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--surface-0)',
            cursor: 'pointer',
            marginTop: '8px',
          }}>
            {loading ? 'Verifying device...' : 'Sign In'}
          </button>
        </div>

        {/* MFA notice */}
        <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: '20px' }}>
          Multi-factor authentication required. Device fingerprint will be verified.
        </p>

        {/* Honeypot fields (invisible, catches bots) */}
        <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: '-9999px', opacity: 0, pointerEvents: 'none' }}>
          <input type="text" name="username_confirm" tabIndex={-1} autoComplete="off" />
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          <input type="password" name="pass_backup" tabIndex={-1} autoComplete="off" />
        </div>
      </div>
    </div>
  );
}

/**
 * DevTools lockout specifically for the login page.
 * Even more aggressive than the platform-level lock because
 * this is where attackers first try to inspect/reverse-engineer.
 */
function lockLoginDevTools(): void {
  if (typeof window === 'undefined') return;

  // Block ALL DevTools keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F12') { e.preventDefault(); return; }
    if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) { e.preventDefault(); return; }
    if (e.ctrlKey && e.key === 'u') { e.preventDefault(); return; }
    if (e.metaKey && e.altKey && ['i', 'j'].includes(e.key)) { e.preventDefault(); return; }
    if (e.metaKey && e.shiftKey && e.key === 'c') { e.preventDefault(); return; }
  }, true);

  // Continuous debugger trap (production only)
  if (process.env.NODE_ENV === 'production') {
    setInterval(() => {
      const before = performance.now();
      // eslint-disable-next-line no-debugger
      debugger;
      if (performance.now() - before > 100) {
        // Someone has DevTools open with debugger
        window.location.reload();
      }
    }, 3000);
  }

  // Nuke console in production
  if (process.env.NODE_ENV === 'production') {
    const noop = () => {};
    console.log = noop;
    console.info = noop;
    console.debug = noop;
    console.table = noop;
    console.dir = noop;
    console.trace = noop;
    // Keep console.warn and console.error for genuine issues
  }

  // Disable right-click
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  // Disable text selection on the entire login page
  document.body.style.userSelect = 'none';
  document.body.style.webkitUserSelect = 'none';
}
