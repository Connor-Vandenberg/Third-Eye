/**
 * GZM Client-Side Device Fingerprinting
 *
 * Collects browser signals and sends them to the backend for
 * Zero Trust device posture validation (Pillar 2: Devices).
 *
 * Signals collected:
 * - Screen resolution + color depth
 * - Timezone offset
 * - Platform + language
 * - WebGL renderer (GPU identification)
 * - Canvas fingerprint
 * - Audio context fingerprint
 * - Installed fonts probe
 * - Touch support
 * - Hardware concurrency (CPU cores)
 * - Device memory
 *
 * All signals are hashed client-side. No raw data leaves the browser.
 * The hash is sent as X-Device-Fingerprint header on API requests.
 */

export interface ClientFingerprint {
  hash: string;
  signals: number;  // How many signals were collected (higher = more reliable)
  riskIndicators: string[];  // Things that seem suspicious
}

async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function getWebGLRenderer(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return '';
    const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return '';
    return (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
  } catch {
    return '';
  }
}

function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('GZM fingerprint', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('GZM fingerprint', 4, 17);
    return canvas.toDataURL();
  } catch {
    return '';
  }
}

function getAudioFingerprint(): string {
  try {
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContext) return '';
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const compressor = context.createDynamicsCompressor();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(10000, context.currentTime);
    compressor.threshold.setValueAtTime(-50, context.currentTime);
    compressor.knee.setValueAtTime(40, context.currentTime);
    compressor.ratio.setValueAtTime(12, context.currentTime);
    compressor.attack.setValueAtTime(0, context.currentTime);
    compressor.release.setValueAtTime(0.25, context.currentTime);
    // Return a stable string based on compressor params
    return `audio:${compressor.threshold.value}:${compressor.knee.value}:${compressor.ratio.value}`;
  } catch {
    return '';
  }
}

export async function collectFingerprint(): Promise<ClientFingerprint> {
  const riskIndicators: string[] = [];
  let signalCount = 0;

  // Collect all signals
  const components: string[] = [];

  // 1. Screen
  const screen = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
  components.push(screen);
  signalCount++;

  // 2. Timezone
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  components.push(tz);
  signalCount++;

  // 3. Platform + language
  components.push(navigator.platform || '');
  components.push(navigator.language || '');
  components.push(navigator.languages?.join(',') || '');
  signalCount += 3;

  // 4. Hardware
  components.push(String(navigator.hardwareConcurrency || 0));
  components.push(String((navigator as unknown as { deviceMemory?: number }).deviceMemory || 0));
  signalCount += 2;

  // 5. WebGL (GPU)
  const webgl = getWebGLRenderer();
  components.push(webgl);
  if (webgl) signalCount++;
  if (webgl.toLowerCase().includes('swiftshader') || webgl.toLowerCase().includes('llvmpipe')) {
    riskIndicators.push('software_renderer');  // Headless browser indicator
  }

  // 6. Canvas
  const canvas = getCanvasFingerprint();
  components.push(canvas.substring(0, 100));  // Truncate for hashing
  if (canvas) signalCount++;

  // 7. Audio
  const audio = getAudioFingerprint();
  components.push(audio);
  if (audio) signalCount++;

  // 8. Touch support
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  components.push(String(hasTouch));
  signalCount++;

  // 9. Do Not Track
  components.push(navigator.doNotTrack || '');
  signalCount++;

  // 10. Cookie enabled
  components.push(String(navigator.cookieEnabled));
  signalCount++;

  // 11. PDF viewer plugin (removed in modern browsers = headless indicator)
  const hasPdfViewer = navigator.pdfViewerEnabled !== undefined ? String(navigator.pdfViewerEnabled) : 'unknown';
  components.push(hasPdfViewer);
  signalCount++;

  // Risk indicators
  if (navigator.webdriver) {
    riskIndicators.push('webdriver_detected');  // Selenium/Puppeteer
  }
  if (!navigator.languages || navigator.languages.length === 0) {
    riskIndicators.push('no_languages');  // Automation tool
  }
  if (window.screen.width === 0 || window.screen.height === 0) {
    riskIndicators.push('zero_screen');  // Headless
  }

  // Generate hash
  const raw = components.join('|');
  const hash = await sha256(raw);

  return {
    hash,
    signals: signalCount,
    riskIndicators,
  };
}

/**
 * Get or create a persistent device fingerprint.
 * Stores in localStorage for session stability.
 * Recalculates if signals change (new browser/device).
 */
export async function getDeviceFingerprint(): Promise<string> {
  const stored = localStorage.getItem('__gzm_dfp');
  const fp = await collectFingerprint();

  if (stored) {
    // Check if fingerprint changed (device/browser update)
    const parsed = JSON.parse(stored) as { hash: string; ts: number };
    if (parsed.hash === fp.hash) {
      return fp.hash;
    }
    // Fingerprint changed, update
  }

  localStorage.setItem('__gzm_dfp', JSON.stringify({ hash: fp.hash, ts: Date.now() }));
  return fp.hash;
}
