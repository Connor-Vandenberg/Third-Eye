'use client';

import { useEffect, useRef } from 'react';
import { initAntiScrape, validateEnvironment, protectClipboard } from '@/lib/security';
import { generateFingerprint, initBehavioralTracking, persistFingerprint, reportFingerprint } from '@/lib/fingerprint';
import { detectVPNAdvanced, detectBotsAdvanced, initDeepBehavioralTracking, analyzeBehavior, assessThreat, adaptiveRateCheck } from '@/lib/threat-detection';

/**
 * GZM UNIFIED SECURITY INITIALIZATION
 * 
 * This component wires together ALL security systems into one automated pipeline.
 * Mount once at the platform layout level. Everything runs automatically.
 *
 * PIPELINE (executes in order on mount):
 * 1. Environment validation (origin check)
 * 2. DevTools lockout (5 detection methods)
 * 3. Anti-scrape (right-click, view-source, print)
 * 4. Clipboard watermarking
 * 5. Device fingerprinting (32+ hardware signals)
 * 6. Advanced VPN/proxy detection (12 signals including WebRTC leak)
 * 7. Advanced bot/AI detection (22 checks including stealth mode bypass)
 * 8. Deep behavioral biometrics (mouse entropy, typing cadence, scroll curves)
 * 9. Adaptive rate limiting (learns normal patterns, auto-tightens on burst)
 * 10. Continuous threat assessment loop (every 30 seconds)
 * 11. Auto-escalation based on composite threat score
 * 12. All findings reported to backend for server-side correlation
 *
 * THREAT RESPONSE:
 * - Score 0-19: Allow (clear)
 * - Score 20-39: Allow + flag for review
 * - Score 40-59: Challenge (degrade functionality, show verification)
 * - Score 60-79: Throttle (1 request per 10 seconds max)
 * - Score 80-100: Block (nuke page, redirect to denied screen)
 */
export function SecurityInit() {
  const threatLevelRef = useRef<'clear' | 'low' | 'medium' | 'high' | 'critical'>('clear');
  const assessmentIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // ============================================================
    // PHASE 1: IMMEDIATE PROTECTIONS (synchronous, instant)
    // ============================================================

    // Validate origin (blocks if not authorized domain)
    validateEnvironment();

    // Lock DevTools (5 methods: debugger trap, toString trick, resize, keyboard, console nuke)
    lockDevTools();

    // Anti-scrape (right-click, Ctrl+U, Ctrl+S, Ctrl+P, F12)
    initAntiScrape();

    // Clipboard watermarking (copies get watermarked with timestamp)
    protectClipboard();

    // ============================================================
    // PHASE 2: DEVICE IDENTIFICATION (async, ~500ms)
    // ============================================================

    // Basic fingerprint (32 signals: canvas, WebGL, audio, fonts, etc.)
    generateFingerprint().then((fp) => {
      persistFingerprint(fp);
      reportFingerprint(fp);

      // Immediate bot check from fingerprint
      if (fp.is_bot && process.env.NODE_ENV === 'production') {
        blockAccess(fp.device_id, 'Automation detected via fingerprint');
        return;
      }
    });

    // ============================================================
    // PHASE 3: BEHAVIORAL TRACKING (starts immediately, builds over time)
    // ============================================================

    // Basic behavioral (from fingerprint.ts)
    initBehavioralTracking();

    // Deep behavioral (from threat-detection.ts: entropy, curves, precision)
    initDeepBehavioralTracking();

    // ============================================================
    // PHASE 4: ADVANCED THREAT DETECTION (async, ~2-3s)
    // ============================================================

    // Run full advanced detection suite after a short delay
    // (gives behavioral tracking time to collect initial data)
    setTimeout(async () => {
      try {
        // Advanced VPN detection (12 signals)
        const vpnResult = await detectVPNAdvanced();

        // Advanced bot detection (22 checks)
        const botResult = detectBotsAdvanced();

        // Report to backend
        reportThreatFindings({
          vpn: vpnResult,
          bot: botResult,
          timestamp: new Date().toISOString(),
        });

        // Immediate response for critical threats
        if (botResult.confidence >= 0.8 && process.env.NODE_ENV === 'production') {
          blockAccess('bot-' + botResult.category, `Bot detected: ${botResult.signals.join(', ')}`);
          return;
        }

        // Flag VPN users (don't block, but note it)
        if (vpnResult.vpnLikelihood >= 0.7) {
          flagSession('vpn-detected', vpnResult);
        }
      } catch (e) {
        // Security checks should never crash the app
        console.error('[GZM-SEC] Threat detection error (non-fatal)');
      }
    }, 3000);

    // ============================================================
    // PHASE 5: CONTINUOUS MONITORING (runs every 30 seconds)
    // ============================================================

    assessmentIntervalRef.current = setInterval(async () => {
      try {
        // Full composite threat assessment
        const assessment = await assessThreat();
        threatLevelRef.current = assessment.level;

        // Adaptive rate limit check
        const rateStatus = adaptiveRateCheck();

        // Auto-escalation based on threat score
        if (process.env.NODE_ENV === 'production') {
          switch (assessment.action) {
            case 'block':
              blockAccess('threat-score-' + assessment.score, `Threat score: ${assessment.score}/100`);
              break;

            case 'throttle':
              // Inject aggressive throttle into all API calls
              window.__GZM_THROTTLE_MS = 10000; // 10 second minimum between requests
              showThrottleWarning();
              break;

            case 'challenge':
              // Degrade functionality: hide sensitive data, require re-auth
              window.__GZM_CHALLENGE_MODE = true;
              showChallengeOverlay();
              break;

            case 'allow':
              // Clear any previous throttle/challenge
              window.__GZM_THROTTLE_MS = 0;
              window.__GZM_CHALLENGE_MODE = false;
              break;
          }
        }

        // Report behavioral analysis periodically
        const behavior = analyzeBehavior();
        if (behavior.verdict === 'definitely-bot' || behavior.verdict === 'likely-bot') {
          reportThreatFindings({
            type: 'behavioral-anomaly',
            behavior,
            assessment,
            timestamp: new Date().toISOString(),
          });
        }

        // Rate limit enforcement
        if (!rateStatus.allowed) {
          showThrottleWarning();
        }
      } catch {
        // Non-fatal: continuous monitoring should never crash the app
      }
    }, 30000); // Every 30 seconds

    // ============================================================
    // CONSOLE WARNING
    // ============================================================
    if (process.env.NODE_ENV === 'production') {
      console.clear();
      console.log('%c\u26A0\uFE0F STOP', 'color:red;font-size:48px;font-weight:bold;text-shadow:2px 2px black;');
      console.log('%cClassified Intelligence System', 'font-size:16px;color:#ef4444;font-weight:bold;');
      console.log('%c18 U.S.C. \u00A7 1030. Device fingerprinted. Session monitored. Behavioral analysis active.', 'font-size:12px;color:#666;');
    }

    // Cleanup
    return () => {
      if (assessmentIntervalRef.current) clearInterval(assessmentIntervalRef.current);
    };
  }, []);

  // Honeypot fields
  return (
    <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: '-9999px', opacity: 0, pointerEvents: 'none' }}>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      <input type="email" name="email_confirm" tabIndex={-1} autoComplete="off" />
      <input type="text" name="phone_backup" tabIndex={-1} autoComplete="off" />
      <input type="password" name="secret_code" tabIndex={-1} autoComplete="off" />
    </div>
  );
}

// ============================================================
// RESPONSE ACTIONS
// ============================================================

function blockAccess(reason: string, detail: string): void {
  // Report the block to backend
  reportThreatFindings({ type: 'block', reason, detail, timestamp: new Date().toISOString() });

  // Nuke the page
  document.body.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0a0a0f;color:#ef4444;font-family:'JetBrains Mono',monospace;text-align:center;padding:40px;">
      <div>
        <div style="font-size:64px;margin-bottom:16px;">\u26D4</div>
        <h1 style="font-size:28px;margin-bottom:12px;">ACCESS DENIED</h1>
        <p style="color:#888;font-size:14px;margin-bottom:24px;">This incident has been logged and reported.</p>
        <p style="color:#444;font-size:11px;">Ref: ${reason.slice(0, 20)} | ${new Date().toISOString()}</p>
      </div>
    </div>
  `;

  // Prevent any further JS execution
  setTimeout(() => { window.stop(); }, 100);
}

function showThrottleWarning(): void {
  // Show a non-blocking banner at the top
  const existing = document.getElementById('gzm-throttle-banner');
  if (existing) return; // Already showing

  const banner = document.createElement('div');
  banner.id = 'gzm-throttle-banner';
  banner.style.cssText = 'position:fixed;top:0;left:0;right:0;padding:8px 20px;background:#7c2d12;color:#fb923c;font-family:var(--font-mono);font-size:12px;text-align:center;z-index:99999;';
  banner.textContent = '\u26A0\uFE0F Unusual activity detected. Requests are being throttled. Normal service will resume shortly.';
  document.body.prepend(banner);

  // Auto-remove after 30 seconds
  setTimeout(() => banner.remove(), 30000);
}

function showChallengeOverlay(): void {
  const existing = document.getElementById('gzm-challenge-overlay');
  if (existing) return;

  const overlay = document.createElement('div');
  overlay.id = 'gzm-challenge-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(10,10,15,0.95);display:flex;align-items:center;justify-content:center;z-index:99998;font-family:var(--font-mono);';
  overlay.innerHTML = `
    <div style="text-align:center;color:#e2e8f0;">
      <div style="font-size:36px;margin-bottom:16px;">\u{1F50D}</div>
      <h2 style="font-size:20px;margin-bottom:12px;">Verification Required</h2>
      <p style="color:#94a3b8;font-size:13px;margin-bottom:24px;">Unusual activity detected on this session.<br/>Please verify you are an authorized operator.</p>
      <button onclick="this.parentElement.parentElement.remove();window.__GZM_CHALLENGE_MODE=false;" style="padding:12px 32px;background:#0ea5e9;color:white;border:none;border-radius:6px;font-size:14px;font-weight:600;cursor:pointer;">I am an authorized user</button>
    </div>
  `;
  document.body.appendChild(overlay);
}

function flagSession(reason: string, data: unknown): void {
  // Store flag in sessionStorage for backend to pick up
  try {
    const flags = JSON.parse(sessionStorage.getItem('_gzm_flags') || '[]');
    flags.push({ reason, timestamp: new Date().toISOString(), data });
    sessionStorage.setItem('_gzm_flags', JSON.stringify(flags));
  } catch {}
}

async function reportThreatFindings(findings: Record<string, unknown>): Promise<void> {
  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    await fetch(`${API_BASE}/api/v1/security/threat-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'GZM-Frontend' },
      body: JSON.stringify(findings),
      credentials: 'same-origin',
    });
  } catch {
    // Silent fail (don't block app if reporting fails)
  }
}

// ============================================================
// DEVTOOLS LOCKOUT (5 methods)
// ============================================================

function lockDevTools(): void {
  if (typeof window === 'undefined') return;

  // Method 1: Debugger timing trap
  if (process.env.NODE_ENV === 'production') {
    setInterval(() => {
      const s = performance.now();
      // eslint-disable-next-line no-debugger
      debugger;
      if (performance.now() - s > 100) {
        document.body.style.display = 'none';
        window.location.href = '/unauthorized';
      }
    }, 2000);
  }

  // Method 2: Console.log image toString trick
  if (process.env.NODE_ENV === 'production') {
    const el = new Image();
    Object.defineProperty(el, 'id', { get: () => { console.clear(); } });
    setInterval(() => { console.log('%c', el as any); }, 1000);
  }

  // Method 3: Window resize detection
  if (process.env.NODE_ENV === 'production') {
    setInterval(() => {
      if (window.outerWidth - window.innerWidth > 200 || window.outerHeight - window.innerHeight > 200) {
        console.clear();
      }
    }, 500);
  }

  // Method 4: Keyboard shortcut blocking
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F12') { e.preventDefault(); e.stopPropagation(); }
    if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) { e.preventDefault(); e.stopPropagation(); }
    if (e.ctrlKey && e.key === 'u') { e.preventDefault(); e.stopPropagation(); }
    if (e.metaKey && e.altKey && ['i', 'j'].includes(e.key)) { e.preventDefault(); e.stopPropagation(); }
    if (e.metaKey && e.shiftKey && e.key === 'c') { e.preventDefault(); e.stopPropagation(); }
  }, true);

  // Method 5: Console method override
  if (process.env.NODE_ENV === 'production') {
    const noop = () => {};
    (window as any).console.log = noop;
    (window as any).console.info = noop;
    (window as any).console.debug = noop;
    (window as any).console.table = noop;
    (window as any).console.dir = noop;
    (window as any).console.trace = noop;
  }
}

// ============================================================
// GLOBAL TYPE EXTENSIONS
// ============================================================

declare global {
  interface Window {
    __GZM_THROTTLE_MS: number;
    __GZM_CHALLENGE_MODE: boolean;
  }
}
