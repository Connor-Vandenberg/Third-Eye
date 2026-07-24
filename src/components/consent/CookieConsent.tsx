'use client';

/**
 * Cookie Consent Banner — GDPR / CCPA / GPC Compliant.
 *
 * Requirements met:
 * - No non-essential scripts fire before consent (GDPR)
 * - "Accept All" and "Reject All" equally prominent (CNIL enforcement)
 * - Granular category controls available
 * - Consent stored and auditable
 * - Honors Global Privacy Control (GPC) signal automatically
 * - Easy withdrawal (same effort as giving consent)
 * - Accessible: keyboard navigable, proper ARIA, focus trapped
 *
 * Categories:
 * - Essential: Always active (session, auth, security)
 * - Analytics: Usage statistics (opt-in required for EU)
 * - Functional: Enhanced features, preferences
 * - Performance: Application performance monitoring
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusTrap } from '@/lib/accessibility';

type ConsentState = 'undecided' | 'accepted_all' | 'rejected_all' | 'custom';

interface ConsentPreferences {
  essential: true; // Always true
  analytics: boolean;
  functional: boolean;
  performance: boolean;
}

const CONSENT_STORAGE_KEY = 'gzm_consent_preferences';
const CONSENT_VERSION = '1.0';

function getStoredConsent(): ConsentPreferences | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed.preferences;
  } catch {
    return null;
  }
}

function storeConsent(preferences: ConsentPreferences): void {
  localStorage.setItem(
    CONSENT_STORAGE_KEY,
    JSON.stringify({
      version: CONSENT_VERSION,
      preferences,
      timestamp: new Date().toISOString(),
      gpc: navigator.globalPrivacyControl ?? false,
    }),
  );
}

export function CookieConsent() {
  const [state, setState] = useState<ConsentState>('undecided');
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    essential: true,
    analytics: false,
    functional: false,
    performance: false,
  });
  const bannerRef = useRef<HTMLDivElement>(null);
  const isVisible = state === 'undecided';

  useFocusTrap(bannerRef, isVisible);

  // Check for existing consent or GPC signal on mount
  useEffect(() => {
    const stored = getStoredConsent();
    if (stored) {
      setPreferences(stored);
      setState('custom');
      return;
    }

    // Honor Global Privacy Control (GPC)
    if (navigator.globalPrivacyControl) {
      const gpcPrefs: ConsentPreferences = {
        essential: true,
        analytics: false,
        functional: false,
        performance: false,
      };
      setPreferences(gpcPrefs);
      storeConsent(gpcPrefs);
      setState('rejected_all');
      // Notify backend
      fetch('/api/v1/privacy/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analytics: false, functional: false, performance: false }),
      }).catch(() => { /* non-blocking */ });
    }
  }, []);

  const handleAcceptAll = useCallback(() => {
    const prefs: ConsentPreferences = {
      essential: true,
      analytics: true,
      functional: true,
      performance: true,
    };
    setPreferences(prefs);
    storeConsent(prefs);
    setState('accepted_all');
    fetch('/api/v1/privacy/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analytics: true, functional: true, performance: true }),
    }).catch(() => {});
  }, []);

  const handleRejectAll = useCallback(() => {
    const prefs: ConsentPreferences = {
      essential: true,
      analytics: false,
      functional: false,
      performance: false,
    };
    setPreferences(prefs);
    storeConsent(prefs);
    setState('rejected_all');
    fetch('/api/v1/privacy/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analytics: false, functional: false, performance: false }),
    }).catch(() => {});
  }, []);

  const handleSaveCustom = useCallback(() => {
    storeConsent(preferences);
    setState('custom');
    fetch('/api/v1/privacy/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        analytics: preferences.analytics,
        functional: preferences.functional,
        performance: preferences.performance,
      }),
    }).catch(() => {});
  }, [preferences]);

  if (!isVisible) return null;

  return (
    <div
      ref={bannerRef}
      role="dialog"
      aria-label="Cookie consent"
      aria-describedby="consent-description"
      aria-modal="true"
      className="cookie-consent-banner"
    >
      <div className="consent-content">
        <h2 className="consent-title">Privacy Preferences</h2>
        <p id="consent-description" className="consent-description">
          We use cookies and similar technologies to provide essential platform
          functionality. Optional cookies help us understand how you use GZM
          and improve the experience. You can accept all, reject all, or
          customize your preferences.
        </p>

        {showDetails && (
          <fieldset className="consent-categories" aria-label="Cookie categories">
            <legend className="sr-only">Choose which cookie categories to allow</legend>

            <label className="consent-category">
              <input
                type="checkbox"
                checked={true}
                disabled={true}
                aria-describedby="essential-desc"
              />
              <span className="category-name">Essential</span>
              <span id="essential-desc" className="category-desc">
                Required for authentication, security, and core functionality. Always active.
              </span>
            </label>

            <label className="consent-category">
              <input
                type="checkbox"
                checked={preferences.analytics}
                onChange={(e) =>
                  setPreferences(p => ({ ...p, analytics: e.target.checked }))
                }
                aria-describedby="analytics-desc"
              />
              <span className="category-name">Analytics</span>
              <span id="analytics-desc" className="category-desc">
                Helps us understand how you use the platform to improve features.
              </span>
            </label>

            <label className="consent-category">
              <input
                type="checkbox"
                checked={preferences.functional}
                onChange={(e) =>
                  setPreferences(p => ({ ...p, functional: e.target.checked }))
                }
                aria-describedby="functional-desc"
              />
              <span className="category-name">Functional</span>
              <span id="functional-desc" className="category-desc">
                Remembers your preferences and customizations across sessions.
              </span>
            </label>

            <label className="consent-category">
              <input
                type="checkbox"
                checked={preferences.performance}
                onChange={(e) =>
                  setPreferences(p => ({ ...p, performance: e.target.checked }))
                }
                aria-describedby="performance-desc"
              />
              <span className="category-name">Performance</span>
              <span id="performance-desc" className="category-desc">
                Monitors application performance to detect and fix issues.
              </span>
            </label>
          </fieldset>
        )}

        <div className="consent-actions">
          <button
            onClick={handleRejectAll}
            className="consent-btn consent-btn-reject"
            aria-label="Reject all optional cookies"
          >
            Reject All
          </button>

          {showDetails ? (
            <button
              onClick={handleSaveCustom}
              className="consent-btn consent-btn-save"
              aria-label="Save custom cookie preferences"
            >
              Save Preferences
            </button>
          ) : (
            <button
              onClick={() => setShowDetails(true)}
              className="consent-btn consent-btn-customize"
              aria-expanded={showDetails}
              aria-controls="consent-details"
            >
              Customize
            </button>
          )}

          <button
            onClick={handleAcceptAll}
            className="consent-btn consent-btn-accept"
            aria-label="Accept all cookies"
          >
            Accept All
          </button>
        </div>

        <p className="consent-links">
          <a href="/legal/privacy">Privacy Policy</a>
          {' \u00b7 '}
          <a href="/legal/terms">Terms of Service</a>
        </p>
      </div>
    </div>
  );
}
