/**
 * GZM Client-Side Security Utilities
 *
 * Defense-in-depth for the intelligence dashboard:
 * - DevTools detection (log + optional callback)
 * - Clipboard interception (prevent copying sensitive data)
 * - Dynamic watermarking (user attribution on screenshots)
 * - Right-click prevention on sensitive panels
 * - Console warning for social engineering attacks
 *
 * NOTE: Client-side protections are deterrents, not absolute barriers.
 * The real security is server-side auth + CORS + rate limiting.
 * These make casual scraping/leaking harder and attributable.
 */

// =============================================================================
// DEVTOOLS DETECTION
// =============================================================================

let devToolsOpen = false;

/**
 * Detect if browser DevTools are open.
 * Uses the debugger timing method (most reliable cross-browser).
 * Call this in a useEffect with an interval.
 */
export function detectDevTools(onDetected?: () => void): boolean {
  const threshold = 160;
  const widthDiff = window.outerWidth - window.innerWidth;
  const heightDiff = window.outerHeight - window.innerHeight;

  const isOpen = widthDiff > threshold || heightDiff > threshold;

  if (isOpen && !devToolsOpen) {
    devToolsOpen = true;
    console.warn(
      '%c\u26a0\ufe0f GZM Security Notice',
      'color: #ef4444; font-size: 20px; font-weight: bold;'
    );
    console.warn(
      '%cThis is a protected intelligence platform. All access is logged and monitored.',
      'color: #f59e0b; font-size: 14px;'
    );
    onDetected?.();
  } else if (!isOpen) {
    devToolsOpen = false;
  }

  return isOpen;
}

// =============================================================================
// CLIPBOARD PROTECTION
// =============================================================================

/**
 * Intercept copy events on sensitive containers.
 * Replaces copied text with a warning + watermark.
 */
export function protectClipboard(container: HTMLElement, userId?: string): () => void {
  const handler = (e: ClipboardEvent) => {
    e.preventDefault();
    const watermark = userId ? ` [User: ${userId}]` : '';
    const warning = `[GZM Intelligence Data - Unauthorized Distribution Prohibited${watermark}]`;

    if (e.clipboardData) {
      e.clipboardData.setData('text/plain', warning);
    }
  };

  container.addEventListener('copy', handler);
  return () => container.removeEventListener('copy', handler);
}

// =============================================================================
// WATERMARK
// =============================================================================

/**
 * Apply an invisible forensic watermark over the page.
 * Survives screenshots, resists casual DevTools removal via MutationObserver.
 */
export function applyWatermark(userId: string): () => void {
  const watermarkId = '__gzm_wm';

  function createWatermark(): HTMLDivElement {
    const el = document.createElement('div');
    el.id = watermarkId;
    el.style.cssText = [
      'position: fixed',
      'inset: 0',
      'z-index: 99999',
      'pointer-events: none',
      'overflow: hidden',
      `background: repeating-linear-gradient(-45deg, transparent, transparent 200px, rgba(255,255,255,0.015) 200px, rgba(255,255,255,0.015) 201px)`,
    ].join(';');

    // Create text pattern
    const text = `${userId} \u00b7 ${new Date().toISOString().substring(0, 10)}`;
    el.innerHTML = `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="wmPattern" patternUnits="userSpaceOnUse" width="400" height="200" patternTransform="rotate(-30)">
          <text x="10" y="100" fill="rgba(255,255,255,0.02)" font-size="11" font-family="monospace">${text}</text>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#wmPattern)"/>
    </svg>`;

    return el;
  }

  let el = createWatermark();
  document.body.appendChild(el);

  // MutationObserver to re-inject if removed via DevTools
  const observer = new MutationObserver(() => {
    if (!document.getElementById(watermarkId)) {
      el = createWatermark();
      document.body.appendChild(el);
    }
  });

  observer.observe(document.body, { childList: true, subtree: false });

  return () => {
    observer.disconnect();
    el.remove();
  };
}

// =============================================================================
// CONSOLE WARNING (Anti Social Engineering)
// =============================================================================

/**
 * Print a security warning in the browser console.
 * Deters paste-in-console attacks ("paste this code to unlock features").
 */
export function printConsoleWarning(): void {
  if (typeof window === 'undefined') return;

  console.log(
    '%c\u{1F6E1}\ufe0f GRAY ZONE MONITOR',
    'color: #22d3ee; font-size: 24px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);'
  );
  console.log(
    '%cThis is a restricted intelligence platform.\nAll sessions are authenticated, logged, and monitored.\nUnauthorized access attempts are reported.',
    'color: #f59e0b; font-size: 13px; line-height: 1.6;'
  );
  console.log(
    '%c\u26a0\ufe0f If someone told you to paste something here, they are trying to hack your account.',
    'color: #ef4444; font-size: 14px; font-weight: bold;'
  );
}

// =============================================================================
// RIGHT-CLICK PREVENTION (for sensitive data panels)
// =============================================================================

/**
 * Prevent right-click context menu on sensitive elements.
 * NOTE: This is a deterrent only. Determined users can bypass it.
 */
export function preventContextMenu(container: HTMLElement): () => void {
  const handler = (e: MouseEvent) => {
    e.preventDefault();
    return false;
  };
  container.addEventListener('contextmenu', handler);
  return () => container.removeEventListener('contextmenu', handler);
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialize all client-side security measures.
 * Call once in the root layout or platform layout.
 */
export function initSecurity(options?: { userId?: string; watermark?: boolean }): () => void {
  const cleanups: Array<() => void> = [];

  // Console warning
  printConsoleWarning();

  // DevTools detection (check every 2s)
  const devToolsInterval = setInterval(() => detectDevTools(), 2000);
  cleanups.push(() => clearInterval(devToolsInterval));

  // Watermark (if user is authenticated)
  if (options?.watermark && options?.userId) {
    cleanups.push(applyWatermark(options.userId));
  }

  // Disable drag on images (prevents easy image saving)
  const imgHandler = (e: DragEvent) => {
    if ((e.target as HTMLElement)?.tagName === 'IMG') {
      e.preventDefault();
    }
  };
  document.addEventListener('dragstart', imgHandler);
  cleanups.push(() => document.removeEventListener('dragstart', imgHandler));

  return () => cleanups.forEach((fn) => fn());
}
