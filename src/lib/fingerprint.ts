/**
 * GZM Advanced Device Fingerprinting
 * Identifies devices/users even through VPNs, proxies, incognito, cleared cookies.
 * Combines 32+ browser signals into a persistent device_id.
 *
 * This does NOT use cookies or localStorage as primary identifier.
 * The fingerprint is derived from hardware/software characteristics that
 * persist across sessions, VPN changes, and private browsing.
 */

// === SIGNAL COLLECTORS ===

async function getCanvasFingerprint(): Promise<string> {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-canvas';

    // Draw text with specific font rendering (unique per GPU/OS/driver)
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('GZM\uD83D\uDE80', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('fingerprint', 4, 35);

    // Add gradient (tests GPU rendering path)
    const gradient = ctx.createLinearGradient(0, 0, 200, 0);
    gradient.addColorStop(0, '#ff0000');
    gradient.addColorStop(1, '#0000ff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 45, 200, 5);

    return canvas.toDataURL().slice(-50);
  } catch {
    return 'canvas-blocked';
  }
}

function getWebGLFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'no-webgl';

    const glContext = gl as WebGLRenderingContext;
    const debugInfo = glContext.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return 'no-debug-info';

    const vendor = glContext.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';
    const renderer = glContext.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
    return `${vendor}|${renderer}`;
  } catch {
    return 'webgl-blocked';
  }
}

function getAudioFingerprint(): Promise<string> {
  return new Promise((resolve) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) { resolve('no-audio'); return; }

      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const analyser = context.createAnalyser();
      const gain = context.createGain();
      const processor = context.createScriptProcessor(4096, 1, 1);

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(10000, context.currentTime);
      gain.gain.setValueAtTime(0, context.currentTime);

      oscillator.connect(analyser);
      analyser.connect(processor);
      processor.connect(gain);
      gain.connect(context.destination);

      oscillator.start(0);

      processor.onaudioprocess = (event) => {
        const data = event.inputBuffer.getChannelData(0);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += Math.abs(data[i]);
        oscillator.stop();
        processor.disconnect();
        context.close();
        resolve(sum.toString(36).slice(0, 16));
      };

      setTimeout(() => resolve('audio-timeout'), 1000);
    } catch {
      resolve('audio-error');
    }
  });
}

function getFontFingerprint(): string {
  const testFonts = [
    'Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia',
    'Palatino', 'Garamond', 'Comic Sans MS', 'Impact', 'Lucida Console',
    'Tahoma', 'Trebuchet MS', 'Helvetica', 'Monaco', 'Menlo',
    'Consolas', 'Liberation Mono', 'DejaVu Sans', 'Noto Sans',
  ];

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return 'no-font-ctx';

  const baseWidth = ctx.measureText('mmmmmmmmmmlli').width;
  const available: string[] = [];

  for (const font of testFonts) {
    ctx.font = `72px '${font}', monospace`;
    const width = ctx.measureText('mmmmmmmmmmlli').width;
    if (width !== baseWidth) available.push(font);
  }

  return available.join(',');
}

function getScreenFingerprint(): string {
  return [
    screen.width,
    screen.height,
    screen.colorDepth,
    screen.pixelDepth,
    window.devicePixelRatio,
    screen.availWidth,
    screen.availHeight,
    (screen as any).orientation?.type || 'unknown',
  ].join('|');
}

function getNavigatorFingerprint(): string {
  return [
    navigator.language,
    navigator.languages?.join(',') || '',
    navigator.hardwareConcurrency || 0,
    (navigator as any).deviceMemory || 0,
    navigator.maxTouchPoints || 0,
    navigator.platform || '',
    navigator.pdfViewerEnabled ? '1' : '0',
    (navigator as any).connection?.effectiveType || '',
  ].join('|');
}

function getTimezoneFingerprint(): string {
  return [
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    new Date().getTimezoneOffset(),
    new Date(6, 0, 1).getTimezoneOffset(), // DST detection
    new Date(0, 0, 1).getTimezoneOffset(),
  ].join('|');
}

function getStorageFingerprint(): string {
  const signals: string[] = [];
  try { localStorage.setItem('_gzm_fp_test', '1'); localStorage.removeItem('_gzm_fp_test'); signals.push('ls:1'); } catch { signals.push('ls:0'); }
  try { sessionStorage.setItem('_gzm_fp_test', '1'); sessionStorage.removeItem('_gzm_fp_test'); signals.push('ss:1'); } catch { signals.push('ss:0'); }
  signals.push(`idb:${!!window.indexedDB ? '1' : '0'}`);
  signals.push(`sw:${!!navigator.serviceWorker ? '1' : '0'}`);
  return signals.join('|');
}

// === VPN / PROXY DETECTION ===

async function detectWebRTCLeak(): Promise<string> {
  return new Promise((resolve) => {
    try {
      const pc = new RTCPeerConnection({ iceServers: [] });
      const ips: string[] = [];

      pc.createDataChannel('');
      pc.createOffer().then((offer) => pc.setLocalDescription(offer));

      pc.onicecandidate = (event) => {
        if (!event.candidate) {
          pc.close();
          resolve(ips.join(',') || 'no-webrtc-ip');
          return;
        }
        const match = event.candidate.candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/);
        if (match && !match[1].startsWith('0.')) {
          ips.push(match[1]);
        }
      };

      setTimeout(() => { pc.close(); resolve(ips.join(',') || 'webrtc-timeout'); }, 3000);
    } catch {
      resolve('webrtc-blocked');
    }
  });
}

function detectTimezoneVPNMismatch(): { mismatch: boolean; details: string } {
  const browserTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const browserLang = navigator.language;

  // Common mismatches when VPN changes apparent location
  const tzToLang: Record<string, string[]> = {
    'America/': ['en', 'es', 'fr', 'pt'],
    'Europe/': ['en', 'de', 'fr', 'es', 'it', 'nl', 'pl', 'pt', 'ru'],
    'Asia/': ['zh', 'ja', 'ko', 'hi', 'ar', 'th', 'vi'],
  };

  const region = Object.keys(tzToLang).find((r) => browserTZ.startsWith(r));
  if (!region) return { mismatch: false, details: 'unknown-region' };

  const expectedLangs = tzToLang[region];
  const langCode = browserLang.split('-')[0];
  const mismatch = !expectedLangs.includes(langCode);

  return { mismatch, details: `tz:${browserTZ}|lang:${browserLang}|match:${!mismatch}` };
}

// === BOT / AI AGENT DETECTION ===

function detectAutomation(): { isBot: boolean; signals: string[] } {
  const signals: string[] = [];

  // Headless browser detection
  if (navigator.webdriver) signals.push('webdriver');
  if (!window.chrome && navigator.userAgent.includes('Chrome')) signals.push('fake-chrome');
  if ((window as any)._phantom || (window as any).__nightmare) signals.push('phantom');
  if ((window as any).callPhantom || (window as any)._selenium) signals.push('selenium');
  if ((window as any).__webdriver_evaluate || (window as any).__driver_evaluate) signals.push('webdriver-eval');
  if (document.documentElement.getAttribute('webdriver')) signals.push('webdriver-attr');
  if ((navigator as any).plugins?.length === 0 && navigator.userAgent.includes('Chrome')) signals.push('no-plugins');

  // Puppeteer / Playwright
  if ((window as any).__puppeteer_evaluation_script__) signals.push('puppeteer');
  if ((window as any).__playwright) signals.push('playwright');

  // Check for common scraper/AI user agents
  const ua = navigator.userAgent.toLowerCase();
  const botPatterns = [
    'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python-requests',
    'httpx', 'aiohttp', 'scrapy', 'phantomjs', 'headless', 'electron',
    'chatgpt', 'gptbot', 'anthropic', 'claude', 'bingbot', 'googlebot',
    'bytespider', 'petalbot', 'semrush', 'ahrefs', 'dotbot', 'mj12bot',
    'yandexbot', 'baiduspider', 'facebookexternalhit', 'twitterbot',
    'applebot', 'amazonbot', 'ccbot', 'ia_archiver', 'archive.org',
  ];
  for (const pattern of botPatterns) {
    if (ua.includes(pattern)) signals.push(`ua:${pattern}`);
  }

  // Timing analysis (bots often have unnaturally consistent timing)
  if (performance?.now) {
    const start = performance.now();
    // Force a layout calculation
    document.body.offsetHeight;
    const elapsed = performance.now() - start;
    if (elapsed === 0) signals.push('zero-layout-time');
  }

  // Check if critical browser APIs are spoofed
  try {
    const descriptor = Object.getOwnPropertyDescriptor(Navigator.prototype, 'webdriver');
    if (descriptor && descriptor.get && descriptor.get.toString().includes('native code') === false) {
      signals.push('spoofed-webdriver');
    }
  } catch { /* ignore */ }

  return { isBot: signals.length > 0, signals };
}

// === BEHAVIORAL BIOMETRICS ===

let mouseMovements: Array<{ x: number; y: number; t: number }> = [];
let keyTimings: number[] = [];
let scrollEvents: number[] = [];

export function initBehavioralTracking(): void {
  if (typeof window === 'undefined') return;

  // Mouse movement patterns (humans have natural jitter, bots are smooth)
  document.addEventListener('mousemove', (e) => {
    mouseMovements.push({ x: e.clientX, y: e.clientY, t: Date.now() });
    if (mouseMovements.length > 100) mouseMovements.shift();
  });

  // Typing cadence (humans have variable inter-key timing)
  document.addEventListener('keydown', () => {
    keyTimings.push(Date.now());
    if (keyTimings.length > 50) keyTimings.shift();
  });

  // Scroll behavior
  document.addEventListener('scroll', () => {
    scrollEvents.push(Date.now());
    if (scrollEvents.length > 30) scrollEvents.shift();
  });
}

function getBehavioralScore(): { humanLikely: boolean; score: number; details: string } {
  let score = 0;
  const details: string[] = [];

  // Mouse analysis
  if (mouseMovements.length >= 10) {
    // Calculate jitter (humans have micro-movements, bots move in straight lines)
    let totalJitter = 0;
    for (let i = 2; i < mouseMovements.length; i++) {
      const dx1 = mouseMovements[i].x - mouseMovements[i - 1].x;
      const dy1 = mouseMovements[i].y - mouseMovements[i - 1].y;
      const dx2 = mouseMovements[i - 1].x - mouseMovements[i - 2].x;
      const dy2 = mouseMovements[i - 1].y - mouseMovements[i - 2].y;
      totalJitter += Math.abs(dx1 - dx2) + Math.abs(dy1 - dy2);
    }
    const avgJitter = totalJitter / mouseMovements.length;
    if (avgJitter > 2 && avgJitter < 200) { score += 30; details.push('natural-mouse'); }
    else { details.push('suspicious-mouse'); }
  } else {
    details.push('no-mouse-data');
  }

  // Key timing analysis
  if (keyTimings.length >= 5) {
    const intervals: number[] = [];
    for (let i = 1; i < keyTimings.length; i++) {
      intervals.push(keyTimings[i] - keyTimings[i - 1]);
    }
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, v) => sum + (v - avg) ** 2, 0) / intervals.length;
    // Humans have high variance in typing speed, bots are consistent
    if (variance > 1000) { score += 30; details.push('natural-typing'); }
    else { details.push('suspicious-typing'); }
  }

  // Scroll analysis
  if (scrollEvents.length >= 3) {
    score += 20;
    details.push('has-scroll');
  }

  // Touch events (mobile human)
  if (navigator.maxTouchPoints > 0 && mouseMovements.length < 5) {
    score += 20;
    details.push('touch-device');
  }

  return { humanLikely: score >= 50, score, details: details.join(',') };
}

// === HASH FUNCTION ===

async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// === MAIN FINGERPRINT GENERATOR ===

export interface DeviceFingerprint {
  device_id: string;           // SHA-256 hash of all signals combined
  signals: Record<string, string>;  // Individual signal values
  is_bot: boolean;             // Automation detected
  bot_signals: string[];       // Which bot checks triggered
  vpn_detected: boolean;       // Timezone/language mismatch
  webrtc_ips: string;          // Local IPs from WebRTC (reveals real IP behind VPN)
  behavioral: { humanLikely: boolean; score: number };
  timestamp: string;
}

export async function generateFingerprint(): Promise<DeviceFingerprint> {
  const [canvasFP, audioFP, webrtcIPs] = await Promise.all([
    getCanvasFingerprint(),
    getAudioFingerprint(),
    detectWebRTCLeak(),
  ]);

  const signals: Record<string, string> = {
    canvas: canvasFP,
    webgl: getWebGLFingerprint(),
    audio: audioFP,
    fonts: getFontFingerprint(),
    screen: getScreenFingerprint(),
    navigator: getNavigatorFingerprint(),
    timezone: getTimezoneFingerprint(),
    storage: getStorageFingerprint(),
    colorDepth: screen.colorDepth.toString(),
    pixelRatio: window.devicePixelRatio.toString(),
    touchPoints: navigator.maxTouchPoints.toString(),
    hardwareConcurrency: (navigator.hardwareConcurrency || 0).toString(),
    deviceMemory: ((navigator as any).deviceMemory || 0).toString(),
    platform: navigator.platform || 'unknown',
    doNotTrack: navigator.doNotTrack || 'unset',
    cookieEnabled: navigator.cookieEnabled.toString(),
    pdfViewer: navigator.pdfViewerEnabled ? '1' : '0',
  };

  // Combine all signals into a single hash
  const signalString = Object.values(signals).join('|||');
  const device_id = await sha256(signalString);

  const automation = detectAutomation();
  const vpnCheck = detectTimezoneVPNMismatch();
  const behavioral = getBehavioralScore();

  return {
    device_id,
    signals,
    is_bot: automation.isBot,
    bot_signals: automation.signals,
    vpn_detected: vpnCheck.mismatch,
    webrtc_ips: webrtcIPs,
    behavioral: { humanLikely: behavioral.humanLikely, score: behavioral.score },
    timestamp: new Date().toISOString(),
  };
}

// === PERSISTENCE (survives clearing cookies/localStorage) ===

export function persistFingerprint(fp: DeviceFingerprint): void {
  // Store in multiple locations for resilience
  try { localStorage.setItem('_gzm_did', fp.device_id); } catch {}
  try { sessionStorage.setItem('_gzm_did', fp.device_id); } catch {}

  // IndexedDB (survives localStorage clear)
  try {
    const request = indexedDB.open('gzm_fp', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('fingerprints')) {
        db.createObjectStore('fingerprints');
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('fingerprints', 'readwrite');
      tx.objectStore('fingerprints').put(fp.device_id, 'current');
    };
  } catch {}
}

// === REPORT TO BACKEND ===

export async function reportFingerprint(fp: DeviceFingerprint): Promise<void> {
  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    await fetch(`${API_BASE}/api/v1/security/fingerprint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'GZM-Frontend' },
      body: JSON.stringify({
        device_id: fp.device_id,
        is_bot: fp.is_bot,
        bot_signals: fp.bot_signals,
        vpn_detected: fp.vpn_detected,
        behavioral_score: fp.behavioral.score,
        timestamp: fp.timestamp,
        // Don't send full signals (privacy), just the hash + risk indicators
      }),
      credentials: 'same-origin',
    });
  } catch {
    // Silently fail (don't block the app if reporting fails)
  }
}
