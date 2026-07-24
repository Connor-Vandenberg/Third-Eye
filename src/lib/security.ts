/**
 * GZM Frontend Security Module
 * Prevents: XSS, injection, scraping, oracle poisoning, bot access, data exfiltration
 */

// === INPUT SANITIZATION ===
// Strip all HTML tags and dangerous characters from user input
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '') // Strip angle brackets (XSS)
    .replace(/javascript:/gi, '') // Strip javascript: protocol
    .replace(/on\w+=/gi, '') // Strip event handlers
    .replace(/data:/gi, '') // Strip data: URIs
    .replace(/vbscript:/gi, '') // Strip vbscript:
    .replace(/expression\(/gi, '') // Strip CSS expressions
    .replace(/url\(/gi, '') // Strip CSS url()
    .trim()
    .slice(0, 500); // Max 500 chars for any single input
}

// Sanitize object keys and values recursively
export function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const cleanKey = sanitizeInput(key);
    if (typeof value === 'string') {
      result[cleanKey] = sanitizeInput(value);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      result[cleanKey] = value;
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[cleanKey] = sanitizeObject(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      result[cleanKey] = value.map((v) => typeof v === 'string' ? sanitizeInput(v) : v);
    }
  }
  return result;
}

// === RATE LIMITING ===
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(endpoint: string, maxRequests = 60, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = requestCounts.get(endpoint);

  if (!entry || now > entry.resetAt) {
    requestCounts.set(endpoint, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    console.warn(`[GZM-SEC] Rate limit exceeded for ${endpoint}`);
    return false;
  }

  entry.count++;
  return true;
}

// === SECURE FETCH ===
export async function secureFetch<T>(url: string, options?: RequestInit): Promise<T> {
  // Rate limit check
  const endpoint = new URL(url, window.location.origin).pathname;
  if (!checkRateLimit(endpoint)) {
    throw new Error('Rate limit exceeded. Please wait before retrying.');
  }

  // Timeout (30s default)
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'GZM-Frontend', // Helps backend identify legit requests
        'X-GZM-Client': 'v4.1',
        ...options?.headers,
      },
      credentials: 'same-origin', // Never send cookies to third parties
    });

    if (!response.ok) {
      // Don't leak error details to console in production
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Request failed');
      }
      throw new Error(`API ${response.status}: ${response.statusText}`);
    }

    // Validate response size (max 10MB)
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
      throw new Error('Response too large');
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

// === ANTI-SCRAPE MEASURES ===
export function initAntiScrape(): void {
  if (typeof window === 'undefined') return;
  if (process.env.NODE_ENV !== 'production') return;

  // Disable right-click context menu
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  // Disable Ctrl+U (view source), Ctrl+S (save), Ctrl+P (print)
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && ['u', 's', 'p'].includes(e.key.toLowerCase())) {
      e.preventDefault();
    }
    // Disable F12 (DevTools)
    if (e.key === 'F12') {
      e.preventDefault();
    }
  });

  // Detect DevTools open (timing-based)
  let devtoolsOpen = false;
  const threshold = 160;
  const check = () => {
    const widthDiff = window.outerWidth - window.innerWidth > threshold;
    const heightDiff = window.outerHeight - window.innerHeight > threshold;
    if (widthDiff || heightDiff) {
      if (!devtoolsOpen) {
        devtoolsOpen = true;
        console.clear();
        console.log('%c\u26A0\uFE0F SECURITY WARNING', 'color: red; font-size: 24px; font-weight: bold;');
        console.log('%cThis browser feature is intended for developers. If someone told you to paste something here, they are trying to compromise your account.', 'font-size: 14px;');
      }
    } else {
      devtoolsOpen = false;
    }
  };
  setInterval(check, 1000);

  // Disable text selection on sensitive elements
  const style = document.createElement('style');
  style.textContent = `
    [data-sensitive] {
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
  `;
  document.head.appendChild(style);
}

// === WEBSOCKET SECURITY ===
export function validateWSMessage(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;

  const msg = data as Record<string, unknown>;

  // Must have expected fields
  if (!msg.type || !msg.timestamp) return false;

  // Type must be one of known types
  const validTypes = ['convergence', 'detection', 'tasking', 'platform_status', 'heartbeat'];
  if (!validTypes.includes(msg.type as string)) return false;

  // Message size limit (prevent memory bombs)
  const serialized = JSON.stringify(data);
  if (serialized.length > 65536) { // 64KB max per message
    console.warn('[GZM-SEC] WebSocket message exceeds size limit');
    return false;
  }

  // Timestamp must be recent (within 5 minutes, prevents replay attacks)
  const ts = new Date(msg.timestamp as string).getTime();
  const now = Date.now();
  if (Math.abs(now - ts) > 5 * 60 * 1000) {
    console.warn('[GZM-SEC] WebSocket message has stale timestamp');
    return false;
  }

  return true;
}

// === CONTENT INTEGRITY ===
// Verify response hasn't been tampered with (when backend provides hash)
export function verifyResponseIntegrity(data: unknown, expectedHash?: string): boolean {
  if (!expectedHash) return true; // No hash provided, skip check

  // Simple checksum (production would use HMAC)
  const serialized = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < serialized.length; i++) {
    const char = serialized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36) === expectedHash;
}

// === ENVIRONMENT VALIDATION ===
export function validateEnvironment(): void {
  if (typeof window === 'undefined') return;

  // Ensure we're running on expected origin
  const allowedOrigins = [
    'https://grayzonemonitor.com',
    'http://localhost:3000',
    'http://localhost:3001',
  ];

  if (process.env.NODE_ENV === 'production' && !allowedOrigins.includes(window.location.origin)) {
    console.error('[GZM-SEC] Running on unauthorized origin:', window.location.origin);
    document.body.innerHTML = '<h1>Unauthorized</h1>';
  }
}

// === CLIPBOARD PROTECTION ===
// Prevent copying sensitive data (entity IDs, coordinates, etc.)
export function protectClipboard(): void {
  if (typeof window === 'undefined') return;
  if (process.env.NODE_ENV !== 'production') return;

  document.addEventListener('copy', (e) => {
    const selection = window.getSelection()?.toString() || '';

    // If copying something that looks like coordinates or entity IDs, watermark it
    if (/GZM-ENT-\d+/.test(selection) || /\d+\.\d+\u00b0[NS]/.test(selection)) {
      const watermarked = `${selection}\n[Copied from Gray Zone Monitor - ${new Date().toISOString()}]`;
      e.clipboardData?.setData('text/plain', watermarked);
      e.preventDefault();
    }
  });
}
