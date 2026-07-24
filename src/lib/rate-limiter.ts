/**
 * GZM Global Rate Limiter
 * Prevents rate bombs, cost overruns, and accidental API abuse.
 * Enforced CLIENT-SIDE before any request leaves the browser.
 * Backend has its own limits too (defense in depth).
 */

// === CONFIGURATION ===
const LIMITS = {
  // Global: max requests per minute across ALL endpoints
  GLOBAL_MAX_PER_MINUTE: 200,

  // Per-endpoint categories
  DATA_READ_PER_MINUTE: 60,       // GET /stats, /alerts, /hotspots, /dossier, /vertices
  MUTATION_PER_MINUTE: 10,         // POST /predict, /task, /enrich
  EXPORT_PER_MINUTE: 5,            // GET /export/*
  WEBSOCKET_MESSAGES_PER_SECOND: 50,

  // Expensive operations (these can cost real money)
  SATELLITE_TASK_PER_HOUR: 3,      // Planet/ICEYE/Capella tasking = $$$
  REPORT_GENERATE_PER_HOUR: 10,    // LLM calls = tokens = cost
  BATCH_ENRICH_PER_HOUR: 5,        // Bulk enrichment = many API calls

  // Circuit breaker
  CONSECUTIVE_FAILURES_BEFORE_BREAK: 5,
  CIRCUIT_BREAK_DURATION_MS: 30000, // 30 seconds

  // Budget guard (estimated daily cost in cents)
  DAILY_BUDGET_LIMIT_CENTS: 500,   // $5/day hard stop (configurable)
} as const;

// === STATE ===
interface RateBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateBucket>();
let globalBucket: RateBucket = { count: 0, resetAt: Date.now() + 60000 };
let consecutiveFailures = 0;
let circuitBrokenUntil = 0;
let dailyCostCents = 0;
let dailyCostResetAt = getNextMidnight();

// Deduplication: recent request hashes
const recentRequests = new Map<string, { timestamp: number; promise: Promise<any> }>();

function getNextMidnight(): number {
  const now = new Date();
  now.setHours(24, 0, 0, 0);
  return now.getTime();
}

// === COST ESTIMATION ===
const COST_MAP: Record<string, number> = {
  '/api/v1/isr/task': 100,           // Satellite tasking: ~$1.00
  '/api/v1/export/pdf': 5,           // PDF generation: ~$0.05
  '/predict': 10,                     // LLM prediction: ~$0.10
  '/api/v1/enrich/batch': 50,        // Batch enrichment: ~$0.50
  '/briefing': 15,                    // Country briefing (LLM): ~$0.15
  '/dossier': 5,                      // Dossier generation: ~$0.05
  default: 0,                         // Most reads are free
};

function estimateCost(endpoint: string): number {
  for (const [pattern, cost] of Object.entries(COST_MAP)) {
    if (endpoint.startsWith(pattern)) return cost;
  }
  return COST_MAP.default;
}

// === CATEGORIZATION ===
function getCategory(endpoint: string, method: string): string {
  if (endpoint.includes('/isr/task') || endpoint.includes('satellite')) return 'satellite';
  if (endpoint.includes('/export')) return 'export';
  if (endpoint.includes('/enrich/batch')) return 'batch_enrich';
  if (endpoint.includes('/briefing') || endpoint.includes('/predict')) return 'report';
  if (method === 'POST' || method === 'PUT' || method === 'DELETE') return 'mutation';
  return 'data_read';
}

function getLimitForCategory(category: string): { max: number; windowMs: number } {
  switch (category) {
    case 'satellite': return { max: LIMITS.SATELLITE_TASK_PER_HOUR, windowMs: 3600000 };
    case 'batch_enrich': return { max: LIMITS.BATCH_ENRICH_PER_HOUR, windowMs: 3600000 };
    case 'report': return { max: LIMITS.REPORT_GENERATE_PER_HOUR, windowMs: 3600000 };
    case 'export': return { max: LIMITS.EXPORT_PER_MINUTE, windowMs: 60000 };
    case 'mutation': return { max: LIMITS.MUTATION_PER_MINUTE, windowMs: 60000 };
    default: return { max: LIMITS.DATA_READ_PER_MINUTE, windowMs: 60000 };
  }
}

// === CORE FUNCTIONS ===

/**
 * Check if a request is allowed. Returns { allowed, reason } .
 * Call this BEFORE every fetch/API call.
 */
export function checkRequest(endpoint: string, method: string = 'GET'): { allowed: boolean; reason?: string } {
  const now = Date.now();

  // 1. Circuit breaker check
  if (now < circuitBrokenUntil) {
    const waitSec = Math.ceil((circuitBrokenUntil - now) / 1000);
    return { allowed: false, reason: `Circuit breaker active. Retry in ${waitSec}s.` };
  }

  // 2. Daily budget check
  if (now > dailyCostResetAt) {
    dailyCostCents = 0;
    dailyCostResetAt = getNextMidnight();
  }
  const estimatedCost = estimateCost(endpoint);
  if (dailyCostCents + estimatedCost > LIMITS.DAILY_BUDGET_LIMIT_CENTS) {
    return { allowed: false, reason: `Daily budget limit reached ($${(LIMITS.DAILY_BUDGET_LIMIT_CENTS / 100).toFixed(2)}). Resets at midnight.` };
  }

  // 3. Global rate limit
  if (now > globalBucket.resetAt) {
    globalBucket = { count: 0, resetAt: now + 60000 };
  }
  if (globalBucket.count >= LIMITS.GLOBAL_MAX_PER_MINUTE) {
    return { allowed: false, reason: 'Global rate limit (200/min). Slow down.' };
  }

  // 4. Per-category rate limit
  const category = getCategory(endpoint, method);
  const { max, windowMs } = getLimitForCategory(category);
  const bucketKey = `${category}`;
  const bucket = buckets.get(bucketKey);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
  } else if (bucket.count >= max) {
    return { allowed: false, reason: `${category} rate limit (${max}/${windowMs / 1000}s). Wait.` };
  } else {
    bucket.count++;
  }

  // 5. All checks passed
  globalBucket.count++;
  dailyCostCents += estimatedCost;
  return { allowed: true };
}

/**
 * Report a successful request (resets failure counter)
 */
export function reportSuccess(): void {
  consecutiveFailures = 0;
}

/**
 * Report a failed request (increments failure counter, may trip circuit breaker)
 */
export function reportFailure(): void {
  consecutiveFailures++;
  if (consecutiveFailures >= LIMITS.CONSECUTIVE_FAILURES_BEFORE_BREAK) {
    circuitBrokenUntil = Date.now() + LIMITS.CIRCUIT_BREAK_DURATION_MS;
    consecutiveFailures = 0;
    console.warn(`[GZM-RATE] Circuit breaker tripped. All requests blocked for ${LIMITS.CIRCUIT_BREAK_DURATION_MS / 1000}s.`);
  }
}

/**
 * Deduplicate identical requests within a 2-second window.
 * Returns existing promise if same request was made recently.
 */
export function deduplicateRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const existing = recentRequests.get(key);

  if (existing && now - existing.timestamp < 2000) {
    return existing.promise as Promise<T>;
  }

  const promise = requestFn();
  recentRequests.set(key, { timestamp: now, promise });

  // Cleanup old entries
  if (recentRequests.size > 100) {
    for (const [k, v] of recentRequests) {
      if (now - v.timestamp > 5000) recentRequests.delete(k);
    }
  }

  return promise;
}

/**
 * Get current rate limit status (for UI display)
 */
export function getRateLimitStatus(): {
  globalUsed: number;
  globalMax: number;
  dailyCostUsed: number;
  dailyCostMax: number;
  circuitBroken: boolean;
} {
  return {
    globalUsed: globalBucket.count,
    globalMax: LIMITS.GLOBAL_MAX_PER_MINUTE,
    dailyCostUsed: dailyCostCents,
    dailyCostMax: LIMITS.DAILY_BUDGET_LIMIT_CENTS,
    circuitBroken: Date.now() < circuitBrokenUntil,
  };
}

/**
 * Configure the daily budget limit (in cents)
 */
export function setDailyBudget(cents: number): void {
  (LIMITS as any).DAILY_BUDGET_LIMIT_CENTS = Math.max(0, cents);
}
