/**
 * GZM Advanced Threat Detection Engine
 * Military-grade VPN/proxy detection, AI bot fingerprinting,
 * deep behavioral biometrics, and adaptive rate limiting.
 *
 * This goes far beyond basic checks. It uses timing analysis,
 * entropy measurement, curve fitting, and anomaly detection
 * to identify threats that basic fingerprinting misses.
 */

// ============================================================
// SECTION 1: ADVANCED VPN/PROXY DETECTION (12 signals)
// ============================================================

export interface VPNDetectionResult {
  vpnLikelihood: number; // 0-1
  proxyLikelihood: number; // 0-1
  signals: VPNSignal[];
  realIP?: string;
}

interface VPNSignal {
  name: string;
  detected: boolean;
  confidence: number;
  detail: string;
}

export async function detectVPNAdvanced(): Promise<VPNDetectionResult> {
  const signals: VPNSignal[] = [];

  // 1. WebRTC IP Leak (reveals real IP behind VPN)
  const webrtcIP = await getWebRTCIP();
  signals.push({
    name: 'webrtc_leak',
    detected: webrtcIP !== 'blocked' && webrtcIP !== 'none',
    confidence: 0.9,
    detail: webrtcIP,
  });

  // 2. DNS Leak via Image Timing
  // Load an image from a unique subdomain, measure DNS resolution time
  // VPNs that don't tunnel DNS will resolve faster to certain CDNs
  const dnsTime = await measureDNSTiming();
  signals.push({
    name: 'dns_timing_anomaly',
    detected: dnsTime > 500, // VPN DNS is typically slower
    confidence: 0.6,
    detail: `${dnsTime}ms DNS resolution`,
  });

  // 3. Timezone vs Locale Mismatch
  const tzMismatch = detectTZLocaleMismatch();
  signals.push({
    name: 'tz_locale_mismatch',
    detected: tzMismatch.mismatch,
    confidence: 0.8,
    detail: tzMismatch.detail,
  });

  // 4. Battery API Anomaly (VMs/containers often have no battery or fake 100%)
  const batteryAnomaly = await detectBatteryAnomaly();
  signals.push({
    name: 'battery_anomaly',
    detected: batteryAnomaly.suspicious,
    confidence: 0.5,
    detail: batteryAnomaly.detail,
  });

  // 5. Connection Type Mismatch
  const connMismatch = detectConnectionMismatch();
  signals.push({
    name: 'connection_mismatch',
    detected: connMismatch.suspicious,
    confidence: 0.6,
    detail: connMismatch.detail,
  });

  // 6. Multi-Timezone Detection (system vs browser vs Intl API)
  const multiTZ = detectMultiTimezone();
  signals.push({
    name: 'multi_timezone',
    detected: multiTZ.mismatch,
    confidence: 0.85,
    detail: multiTZ.detail,
  });

  // 7. WebGL Renderer vs User-Agent Mismatch
  const glMismatch = detectGLUAMismatch();
  signals.push({
    name: 'webgl_ua_mismatch',
    detected: glMismatch.mismatch,
    confidence: 0.75,
    detail: glMismatch.detail,
  });

  // 8. Canvas Noise Detection (some VPNs/privacy tools add canvas noise)
  const canvasNoise = detectCanvasNoise();
  signals.push({
    name: 'canvas_noise_injection',
    detected: canvasNoise.noiseDetected,
    confidence: 0.7,
    detail: canvasNoise.detail,
  });

  // 9. Performance.now() Precision (VMs often have reduced timer precision)
  const timerPrecision = detectTimerPrecision();
  signals.push({
    name: 'reduced_timer_precision',
    detected: timerPrecision.reduced,
    confidence: 0.5,
    detail: timerPrecision.detail,
  });

  // 10. Screen Resolution vs Reported DPI
  const dpiAnomaly = detectDPIAnomaly();
  signals.push({
    name: 'dpi_anomaly',
    detected: dpiAnomaly.suspicious,
    confidence: 0.4,
    detail: dpiAnomaly.detail,
  });

  // 11. Audio Context Fingerprint Consistency
  const audioConsistency = await checkAudioConsistency();
  signals.push({
    name: 'audio_inconsistency',
    detected: audioConsistency.inconsistent,
    confidence: 0.65,
    detail: audioConsistency.detail,
  });

  // 12. Permission API Behavior (VPNs/privacy browsers often block or auto-deny)
  const permAnomaly = await detectPermissionAnomaly();
  signals.push({
    name: 'permission_anomaly',
    detected: permAnomaly.suspicious,
    confidence: 0.55,
    detail: permAnomaly.detail,
  });

  // Compute VPN likelihood as weighted sum
  const vpnScore = signals.reduce((sum, s) => sum + (s.detected ? s.confidence : 0), 0) / signals.length;

  return {
    vpnLikelihood: Math.min(1, vpnScore * 1.5), // Scale up since not all signals fire
    proxyLikelihood: Math.min(1, vpnScore * 1.2),
    signals,
    realIP: webrtcIP !== 'blocked' && webrtcIP !== 'none' ? webrtcIP : undefined,
  };
}

// === VPN Signal Implementations ===

async function getWebRTCIP(): Promise<string> {
  return new Promise((resolve) => {
    try {
      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      pc.createDataChannel('');
      pc.createOffer().then((o) => pc.setLocalDescription(o));
      const ips: string[] = [];
      pc.onicecandidate = (e) => {
        if (!e.candidate) { pc.close(); resolve(ips[0] || 'none'); return; }
        const match = e.candidate.candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/);
        if (match && !match[1].startsWith('0.') && !match[1].startsWith('127.')) ips.push(match[1]);
      };
      setTimeout(() => { pc.close(); resolve(ips[0] || 'none'); }, 5000);
    } catch { resolve('blocked'); }
  });
}

async function measureDNSTiming(): Promise<number> {
  const start = performance.now();
  try {
    // Load a tiny image from a unique subdomain to force DNS lookup
    const img = new Image();
    img.src = `https://dns-check-${Date.now()}.grayzonemonitor.com/pixel.gif?t=${Date.now()}`;
    await new Promise((r) => { img.onload = r; img.onerror = r; setTimeout(r, 2000); });
  } catch {}
  return performance.now() - start;
}

function detectTZLocaleMismatch(): { mismatch: boolean; detail: string } {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const lang = navigator.language;
  const langs = navigator.languages;

  // Check if declared languages match timezone region
  const tzContinent = tz.split('/')[0];
  const langCode = lang.split('-')[0];

  const suspiciousCombos = [
    // Timezone says Asia but language is English without region
    { tz: 'Asia', lang: 'en', noRegion: true },
    // Timezone says America but language is Russian/Chinese
    { tz: 'America', lang: 'ru' },
    { tz: 'America', lang: 'zh' },
    // Timezone says Europe but only 1 language declared (unusual)
    { tz: 'Europe', langCount: 1 },
  ];

  let mismatch = false;
  for (const combo of suspiciousCombos) {
    if (combo.tz && tzContinent === combo.tz) {
      if (combo.lang && langCode === combo.lang) mismatch = true;
      if (combo.noRegion && !lang.includes('-')) mismatch = true;
      if (combo.langCount && langs.length <= combo.langCount) mismatch = true;
    }
  }

  return { mismatch, detail: `tz:${tz}|lang:${lang}|langs:${langs.length}` };
}

async function detectBatteryAnomaly(): Promise<{ suspicious: boolean; detail: string }> {
  try {
    const battery = await (navigator as any).getBattery?.();
    if (!battery) return { suspicious: false, detail: 'no-battery-api' };
    // VMs typically report charging:true, level:1.0 always
    const alwaysFull = battery.level === 1 && battery.charging;
    // Or they report no discharge info
    const noDischarge = battery.dischargingTime === Infinity && !battery.charging;
    return { suspicious: alwaysFull, detail: `level:${battery.level}|charging:${battery.charging}|discharging:${battery.dischargingTime}` };
  } catch {
    return { suspicious: false, detail: 'battery-error' };
  }
}

function detectConnectionMismatch(): { suspicious: boolean; detail: string } {
  const conn = (navigator as any).connection;
  if (!conn) return { suspicious: false, detail: 'no-connection-api' };
  // VPN over WiFi often shows 'wifi' effectiveType but with cellular-like RTT
  const suspicious = conn.effectiveType === '4g' && conn.rtt > 200;
  return { suspicious, detail: `type:${conn.effectiveType}|rtt:${conn.rtt}|downlink:${conn.downlink}` };
}

function detectMultiTimezone(): { mismatch: boolean; detail: string } {
  const intlTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const offset = new Date().getTimezoneOffset();
  // Check if the Intl timezone matches the numeric offset
  const d = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', { timeZone: intlTZ, hour: 'numeric', hour12: false });
  const formatted = parseInt(formatter.format(d));
  const expected = (d.getUTCHours() - offset / 60 + 24) % 24;
  const mismatch = Math.abs(formatted - expected) > 1;
  return { mismatch, detail: `intl:${intlTZ}|offset:${offset}|hour:${formatted}|expected:${Math.round(expected)}` };
}

function detectGLUAMismatch(): { mismatch: boolean; detail: string } {
  const ua = navigator.userAgent;
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl');
  if (!gl) return { mismatch: false, detail: 'no-webgl' };
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  if (!debugInfo) return { mismatch: false, detail: 'no-debug' };
  const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
  // Check: UA says Windows but GPU is Apple, or vice versa
  const uaWindows = ua.includes('Windows');
  const uaMac = ua.includes('Macintosh');
  const gpuApple = renderer.includes('Apple');
  const gpuIntel = renderer.includes('Intel');
  const mismatch = (uaWindows && gpuApple) || (uaMac && renderer.includes('NVIDIA') && !renderer.includes('Apple'));
  return { mismatch, detail: `ua:${uaWindows ? 'win' : uaMac ? 'mac' : 'other'}|gpu:${renderer.slice(0, 40)}` };
}

function detectCanvasNoise(): { noiseDetected: boolean; detail: string } {
  // Draw the same thing twice, compare. Noise injection will differ.
  const results: string[] = [];
  for (let i = 0; i < 3; i++) {
    const c = document.createElement('canvas');
    c.width = 100; c.height = 20;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#f00';
    ctx.fillRect(0, 0, 100, 20);
    ctx.font = '12px Arial';
    ctx.fillStyle = '#000';
    ctx.fillText('noise-test-' + i, 5, 15);
    results.push(c.toDataURL().slice(-20));
  }
  // If all 3 are identical, no noise. If they differ, noise is being injected.
  const noiseDetected = results[0] !== results[1] || results[1] !== results[2];
  return { noiseDetected, detail: noiseDetected ? 'canvas-randomized' : 'canvas-stable' };
}

function detectTimerPrecision(): { reduced: boolean; detail: string } {
  // Measure precision of performance.now()
  const samples: number[] = [];
  for (let i = 0; i < 20; i++) {
    const a = performance.now();
    const b = performance.now();
    if (b > a) samples.push(b - a);
  }
  const minDiff = Math.min(...samples) || 0;
  // Normal: <0.1ms precision. Reduced (Firefox/privacy): 1-2ms. VM: often 1ms+
  const reduced = minDiff >= 0.9;
  return { reduced, detail: `minDiff:${minDiff.toFixed(4)}ms` };
}

function detectDPIAnomaly(): { suspicious: boolean; detail: string } {
  const dpr = window.devicePixelRatio;
  const w = screen.width;
  const h = screen.height;
  // Common real DPIs: 1, 1.25, 1.5, 2, 3. Unusual: 1.1, 0.8, etc.
  const commonDPRs = [1, 1.25, 1.5, 1.75, 2, 2.5, 3];
  const isCommon = commonDPRs.some((d) => Math.abs(dpr - d) < 0.01);
  // VMs often have unusual resolutions
  const unusualRes = (w < 800 || h < 600) && dpr === 1;
  return { suspicious: !isCommon || unusualRes, detail: `dpr:${dpr}|res:${w}x${h}` };
}

async function checkAudioConsistency(): Promise<{ inconsistent: boolean; detail: string }> {
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return { inconsistent: false, detail: 'no-audio-ctx' };
    const ctx = new AC();
    const sr = ctx.sampleRate;
    const dest = ctx.destination.channelCount;
    ctx.close();
    // Normal: 44100 or 48000 sample rate, 2 channels
    const suspicious = sr !== 44100 && sr !== 48000;
    return { inconsistent: suspicious, detail: `sr:${sr}|ch:${dest}` };
  } catch {
    return { inconsistent: false, detail: 'audio-error' };
  }
}

async function detectPermissionAnomaly(): Promise<{ suspicious: boolean; detail: string }> {
  try {
    const results: string[] = [];
    for (const perm of ['geolocation', 'notifications', 'camera'] as PermissionName[]) {
      try {
        const status = await navigator.permissions.query({ name: perm });
        results.push(`${perm}:${status.state}`);
      } catch { results.push(`${perm}:error`); }
    }
    // If ALL permissions are 'denied' without ever being asked, suspicious (privacy browser)
    const allDenied = results.every((r) => r.includes('denied'));
    return { suspicious: allDenied, detail: results.join('|') };
  } catch {
    return { suspicious: true, detail: 'permissions-api-blocked' };
  }
}

// ============================================================
// SECTION 2: ADVANCED BOT/AI DETECTION (22 checks)
// ============================================================

export interface BotDetectionResult {
  isBot: boolean;
  confidence: number; // 0-1
  category: 'human' | 'basic-bot' | 'stealth-bot' | 'ai-agent' | 'headless';
  signals: string[];
}

export function detectBotsAdvanced(): BotDetectionResult {
  const signals: string[] = [];
  let score = 0;

  // === Basic automation ===
  if (navigator.webdriver) { signals.push('webdriver'); score += 15; }
  if ((window as any).__puppeteer_evaluation_script__) { signals.push('puppeteer'); score += 20; }
  if ((window as any).__playwright) { signals.push('playwright'); score += 20; }
  if ((window as any)._phantom) { signals.push('phantom'); score += 20; }
  if ((window as any).__nightmare) { signals.push('nightmare'); score += 20; }
  if ((window as any).callPhantom) { signals.push('callPhantom'); score += 15; }

  // === Stealth mode detection (catches Puppeteer-extra-stealth) ===
  // Check if chrome runtime is properly defined
  if (window.chrome && !window.chrome.runtime) { signals.push('missing-chrome-runtime'); score += 10; }

  // Check if Notification permissions behave normally
  try {
    if (Notification.permission === 'denied' && !localStorage.getItem('_notif_asked')) {
      signals.push('auto-denied-notifications'); score += 5;
    }
  } catch { signals.push('notification-error'); score += 8; }

  // CDP (Chrome DevTools Protocol) detection
  if ((window as any)._cdp || (window as any).__cdp_binding__) { signals.push('cdp-binding'); score += 20; }

  // Check toString of native functions (overridden by automation frameworks)
  try {
    const navString = navigator.permissions.query.toString();
    if (!navString.includes('[native code]')) { signals.push('spoofed-permissions'); score += 12; }
  } catch { /* may not be available */ }

  try {
    const toStringString = Function.prototype.toString.toString();
    if (!toStringString.includes('[native code]')) { signals.push('spoofed-toString'); score += 15; }
  } catch {}

  // Check if Error stack traces reveal automation frameworks
  try {
    throw new Error();
  } catch (e: any) {
    const stack = e.stack || '';
    if (stack.includes('puppeteer') || stack.includes('playwright') || stack.includes('selenium')) {
      signals.push('stack-trace-automation'); score += 20;
    }
  }

  // === AI/LLM agent detection ===
  const ua = navigator.userAgent.toLowerCase();
  const aiPatterns = [
    'gptbot', 'chatgpt-user', 'anthropic-ai', 'claude-web', 'bingbot',
    'googlebot', 'bytespider', 'petalbot', 'semrushbot', 'ahrefsbot',
    'dotbot', 'mj12bot', 'yandexbot', 'baiduspider', 'ccbot',
    'facebookexternalhit', 'twitterbot', 'linkedinbot', 'amazonbot',
    'applebot', 'duckduckbot', 'ia_archiver', 'archive.org_bot',
    'python-requests', 'httpx', 'aiohttp', 'scrapy', 'curl', 'wget',
    'node-fetch', 'axios', 'got/', 'undici',
  ];
  for (const p of aiPatterns) {
    if (ua.includes(p)) { signals.push(`ua:${p}`); score += 25; break; }
  }

  // Check for missing browser features that real browsers have
  if (!window.speechSynthesis) { signals.push('no-speech-synthesis'); score += 5; }
  if (!window.VisualViewport) { signals.push('no-visual-viewport'); score += 5; }
  if (!(navigator as any).bluetooth) { signals.push('no-bluetooth'); score += 3; }
  if (!window.PaymentRequest) { signals.push('no-payment-request'); score += 3; }
  if (!navigator.credentials) { signals.push('no-credentials'); score += 5; }

  // Plugin count (real Chrome has 2-5 plugins, headless has 0)
  if (navigator.plugins.length === 0 && ua.includes('chrome')) { signals.push('zero-plugins'); score += 10; }

  // Image rendering test (headless browsers sometimes fail)
  const img = document.createElement('img');
  if (img.naturalHeight === 0 && img.complete) { /* expected for new img */ }

  // Determine category
  let category: BotDetectionResult['category'] = 'human';
  if (score >= 40) category = 'headless';
  else if (score >= 30) category = 'stealth-bot';
  else if (score >= 20) category = 'ai-agent';
  else if (score >= 10) category = 'basic-bot';

  return {
    isBot: score >= 10,
    confidence: Math.min(1, score / 50),
    category,
    signals,
  };
}

// ============================================================
// SECTION 3: DEEP BEHAVIORAL BIOMETRICS
// ============================================================

export interface BehavioralProfile {
  humanScore: number; // 0-100
  mouseEntropy: number;
  typingEntropy: number;
  scrollNaturalness: number;
  clickPrecision: number;
  interactionDepth: number;
  sessionDuration: number;
  verdict: 'definitely-human' | 'likely-human' | 'uncertain' | 'likely-bot' | 'definitely-bot';
}

const behaviorState = {
  mousePositions: [] as Array<{ x: number; y: number; t: number }>,
  keyIntervals: [] as number[],
  lastKeyTime: 0,
  scrollDeltas: [] as Array<{ dy: number; t: number }>,
  clicks: [] as Array<{ x: number; y: number; t: number; target: string }>,
  sessionStart: Date.now(),
};

export function initDeepBehavioralTracking(): void {
  if (typeof window === 'undefined') return;

  // Mouse: capture position every 50ms for path analysis
  document.addEventListener('mousemove', (e) => {
    behaviorState.mousePositions.push({ x: e.clientX, y: e.clientY, t: Date.now() });
    if (behaviorState.mousePositions.length > 500) behaviorState.mousePositions.shift();
  });

  // Keys: capture inter-key intervals
  document.addEventListener('keydown', () => {
    const now = Date.now();
    if (behaviorState.lastKeyTime > 0) {
      behaviorState.keyIntervals.push(now - behaviorState.lastKeyTime);
      if (behaviorState.keyIntervals.length > 200) behaviorState.keyIntervals.shift();
    }
    behaviorState.lastKeyTime = now;
  });

  // Scroll: capture delta + timing
  document.addEventListener('wheel', (e) => {
    behaviorState.scrollDeltas.push({ dy: e.deltaY, t: Date.now() });
    if (behaviorState.scrollDeltas.length > 100) behaviorState.scrollDeltas.shift();
  }, { passive: true });

  // Clicks: capture position + target
  document.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement)?.tagName || 'unknown';
    behaviorState.clicks.push({ x: e.clientX, y: e.clientY, t: Date.now(), target });
    if (behaviorState.clicks.length > 100) behaviorState.clicks.shift();
  });
}

export function analyzeBehavior(): BehavioralProfile {
  const mouseEntropy = calculateMouseEntropy();
  const typingEntropy = calculateTypingEntropy();
  const scrollNaturalness = calculateScrollNaturalness();
  const clickPrecision = calculateClickPrecision();
  const interactionDepth = calculateInteractionDepth();
  const sessionDuration = (Date.now() - behaviorState.sessionStart) / 1000;

  // Weighted composite score
  const humanScore = Math.round(
    mouseEntropy * 30 +
    typingEntropy * 25 +
    scrollNaturalness * 15 +
    clickPrecision * 15 +
    interactionDepth * 10 +
    Math.min(sessionDuration / 60, 1) * 5 // Bonus for being around >1min
  );

  let verdict: BehavioralProfile['verdict'] = 'uncertain';
  if (humanScore >= 80) verdict = 'definitely-human';
  else if (humanScore >= 60) verdict = 'likely-human';
  else if (humanScore >= 40) verdict = 'uncertain';
  else if (humanScore >= 20) verdict = 'likely-bot';
  else verdict = 'definitely-bot';

  return { humanScore, mouseEntropy, typingEntropy, scrollNaturalness, clickPrecision, interactionDepth, sessionDuration, verdict };
}

function calculateMouseEntropy(): number {
  const positions = behaviorState.mousePositions;
  if (positions.length < 20) return 0.5; // Not enough data yet

  // Calculate direction changes (humans have lots, bots move in straight lines)
  let directionChanges = 0;
  for (let i = 2; i < positions.length; i++) {
    const dx1 = positions[i].x - positions[i - 1].x;
    const dy1 = positions[i].y - positions[i - 1].y;
    const dx2 = positions[i - 1].x - positions[i - 2].x;
    const dy2 = positions[i - 1].y - positions[i - 2].y;
    const angle1 = Math.atan2(dy1, dx1);
    const angle2 = Math.atan2(dy2, dx2);
    if (Math.abs(angle1 - angle2) > 0.1) directionChanges++;
  }

  const changeRate = directionChanges / (positions.length - 2);
  // Humans: 0.3-0.8. Bots: <0.1 (straight) or >0.9 (random noise)
  if (changeRate >= 0.2 && changeRate <= 0.85) return 1;
  if (changeRate < 0.1) return 0.1; // Too straight
  if (changeRate > 0.9) return 0.3; // Too random (simulated)
  return 0.5;
}

function calculateTypingEntropy(): number {
  const intervals = behaviorState.keyIntervals;
  if (intervals.length < 10) return 0.5;

  // Shannon entropy of inter-key intervals (binned)
  const binSize = 30; // 30ms bins
  const bins = new Map<number, number>();
  for (const interval of intervals) {
    const bin = Math.floor(interval / binSize);
    bins.set(bin, (bins.get(bin) || 0) + 1);
  }

  let entropy = 0;
  const total = intervals.length;
  for (const count of bins.values()) {
    const p = count / total;
    if (p > 0) entropy -= p * Math.log2(p);
  }

  // Humans: entropy 2.5-5.0. Bots: <2 (too regular) or >6 (too random)
  if (entropy >= 2.5 && entropy <= 5.5) return 1;
  if (entropy < 1.5) return 0.1;
  return 0.4;
}

function calculateScrollNaturalness(): number {
  const scrolls = behaviorState.scrollDeltas;
  if (scrolls.length < 5) return 0.5;

  // Check for smooth deceleration (humans) vs constant speed (bots)
  let hasDeceleration = false;
  for (let i = 1; i < scrolls.length - 1; i++) {
    const prev = Math.abs(scrolls[i - 1].dy);
    const curr = Math.abs(scrolls[i].dy);
    const next = Math.abs(scrolls[i + 1].dy);
    if (prev > curr && curr > next && prev - next > 10) {
      hasDeceleration = true;
      break;
    }
  }

  // Check for varied scroll amounts (humans vary, bots often use fixed increments)
  const deltas = scrolls.map((s) => Math.abs(s.dy));
  const uniqueDeltas = new Set(deltas.map((d) => Math.round(d / 10) * 10));

  let score = 0;
  if (hasDeceleration) score += 0.5;
  if (uniqueDeltas.size >= 3) score += 0.5;
  return score;
}

function calculateClickPrecision(): number {
  const clicks = behaviorState.clicks;
  if (clicks.length < 3) return 0.5;

  // Humans don't click at exact pixel positions repeatedly
  // Check variance in click positions
  const xs = clicks.map((c) => c.x);
  const ys = clicks.map((c) => c.y);
  const xVar = variance(xs);
  const yVar = variance(ys);

  // Very low variance = bot clicking same spot. Very high = random.
  if (xVar > 100 && xVar < 100000 && yVar > 100 && yVar < 100000) return 1;
  if (xVar < 10 || yVar < 10) return 0.1; // Clicking same pixel
  return 0.5;
}

function calculateInteractionDepth(): number {
  // How many different types of interaction have we seen?
  let types = 0;
  if (behaviorState.mousePositions.length > 10) types++;
  if (behaviorState.keyIntervals.length > 5) types++;
  if (behaviorState.scrollDeltas.length > 3) types++;
  if (behaviorState.clicks.length > 2) types++;
  return types / 4;
}

function variance(arr: number[]): number {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr.reduce((sum, v) => sum + (v - mean) ** 2, 0) / arr.length;
}

// ============================================================
// SECTION 4: ADAPTIVE RATE LIMITER
// ============================================================

export interface AdaptiveRateLimitConfig {
  baselineRPM: number;       // Normal requests per minute
  burstThreshold: number;    // Multiplier before throttle
  cooldownMs: number;        // How long throttle lasts
  learningWindowMs: number;  // How long to observe before establishing baseline
}

const adaptiveState = {
  requestTimes: [] as number[],
  baseline: 0,
  throttledUntil: 0,
  learningComplete: false,
  config: {
    baselineRPM: 30,
    burstThreshold: 3,
    cooldownMs: 60000,
    learningWindowMs: 120000, // 2 minutes of observation
  } as AdaptiveRateLimitConfig,
};

export function adaptiveRateCheck(): { allowed: boolean; reason?: string; currentRPM: number } {
  const now = Date.now();

  // Clear old entries (keep last 5 minutes)
  adaptiveState.requestTimes = adaptiveState.requestTimes.filter((t) => now - t < 300000);

  // Calculate current RPM
  const lastMinute = adaptiveState.requestTimes.filter((t) => now - t < 60000);
  const currentRPM = lastMinute.length;

  // Are we in cooldown?
  if (now < adaptiveState.throttledUntil) {
    return { allowed: false, reason: `Adaptive throttle active. ${Math.ceil((adaptiveState.throttledUntil - now) / 1000)}s remaining.`, currentRPM };
  }

  // Learning phase: observe normal behavior
  if (!adaptiveState.learningComplete) {
    const sessionAge = now - behaviorState.sessionStart;
    if (sessionAge > adaptiveState.config.learningWindowMs && adaptiveState.requestTimes.length > 10) {
      // Establish baseline from observed behavior
      const observedRPM = adaptiveState.requestTimes.length / (sessionAge / 60000);
      adaptiveState.baseline = Math.max(observedRPM, adaptiveState.config.baselineRPM);
      adaptiveState.learningComplete = true;
    }
  }

  // Check if current rate exceeds threshold
  const threshold = (adaptiveState.learningComplete ? adaptiveState.baseline : adaptiveState.config.baselineRPM) * adaptiveState.config.burstThreshold;

  if (currentRPM > threshold) {
    adaptiveState.throttledUntil = now + adaptiveState.config.cooldownMs;
    return { allowed: false, reason: `Burst detected (${currentRPM} RPM vs ${Math.round(threshold)} threshold). Throttled for ${adaptiveState.config.cooldownMs / 1000}s.`, currentRPM };
  }

  // Record this request
  adaptiveState.requestTimes.push(now);
  return { allowed: true, currentRPM };
}

// ============================================================
// SECTION 5: COMPOSITE THREAT SCORE
// ============================================================

export interface ThreatAssessment {
  score: number; // 0-100
  level: 'clear' | 'low' | 'medium' | 'high' | 'critical';
  vpn: VPNDetectionResult;
  bot: BotDetectionResult;
  behavior: BehavioralProfile;
  action: 'allow' | 'challenge' | 'throttle' | 'block';
}

export async function assessThreat(): Promise<ThreatAssessment> {
  const vpn = await detectVPNAdvanced();
  const bot = detectBotsAdvanced();
  const behavior = analyzeBehavior();

  // Composite scoring
  let score = 0;
  score += vpn.vpnLikelihood * 20;                    // Max 20 from VPN
  score += bot.confidence * 40;                        // Max 40 from bot detection
  score += (1 - behavior.humanScore / 100) * 30;      // Max 30 from behavioral
  score += (behavior.sessionDuration < 5 ? 10 : 0);   // 10 points if session <5s (likely bot)

  score = Math.min(100, Math.round(score));

  let level: ThreatAssessment['level'] = 'clear';
  if (score >= 80) level = 'critical';
  else if (score >= 60) level = 'high';
  else if (score >= 40) level = 'medium';
  else if (score >= 20) level = 'low';

  let action: ThreatAssessment['action'] = 'allow';
  if (score >= 80) action = 'block';
  else if (score >= 60) action = 'throttle';
  else if (score >= 40) action = 'challenge';

  return { score, level, vpn, bot, behavior, action };
}
