/**
 * GZM Clerk Authentication Configuration
 *
 * Setup instructions:
 * 1. Sign up at clerk.com (free tier: 50K MRU)
 * 2. Create application, select Next.js
 * 3. Enable MFA in Clerk Dashboard -> User & Authentication -> Multi-factor
 * 4. Set env vars:
 *    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
 *    CLERK_SECRET_KEY=sk_live_...
 * 5. npm install @clerk/nextjs
 *
 * MFA Enforcement:
 * - Clerk Dashboard -> User & Authentication -> Multi-factor -> "Required"
 * - Supports: Authenticator app (TOTP), SMS, Backup codes
 *
 * This file provides shared config for the Clerk integration.
 */

// Routes that DON'T require authentication (public)
export const PUBLIC_ROUTES = [
  '/',              // Landing page only (if you have one)
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',  // Clerk webhooks
];

// Routes that ALWAYS require authentication
export const PROTECTED_ROUTES = [
  '/alerts(.*)',
  '/entities(.*)',
  '/graph(.*)',
  '/intel(.*)',
  '/timeline(.*)',
  '/reports(.*)',
];

// Clerk appearance customization (dark theme matching GZM design system)
export const CLERK_APPEARANCE = {
  baseTheme: undefined, // Use Clerk's dark theme
  variables: {
    colorPrimary: '#22d3ee',        // Cyan accent
    colorBackground: '#0f0f1a',     // Surface color
    colorInputBackground: '#0a0a0f', // Base color
    colorText: '#f0f0ff',           // Primary text
    colorTextSecondary: 'rgba(240,240,255,0.5)',
    borderRadius: '8px',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  elements: {
    card: {
      backgroundColor: '#0f0f1a',
      border: '1px solid rgba(255,255,255,0.06)',
      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
    },
    formButtonPrimary: {
      backgroundColor: '#22d3ee',
      color: '#0a0a0f',
      fontWeight: '700',
      '&:hover': { backgroundColor: '#06b6d4' },
    },
    footerActionLink: {
      color: '#22d3ee',
    },
  },
};

// Session configuration
export const SESSION_CONFIG = {
  // Idle timeout: 30 minutes (NIST 800-171 AC.L2-3.1.11)
  maxIdleMinutes: 30,
  // Absolute timeout: 8 hours
  maxSessionHours: 8,
};
