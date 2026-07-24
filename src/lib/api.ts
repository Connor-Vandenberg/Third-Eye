import { sanitizeInput, secureFetch, checkRateLimit } from './security';
import { checkRequest, reportSuccess, reportFailure, deduplicateRequest } from './rate-limiter';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const method = options?.method || 'GET';

  // RATE LIMIT CHECK (blocks request before it leaves the browser)
  const rateCheck = checkRequest(path, method);
  if (!rateCheck.allowed) {
    throw new APIError(429, rateCheck.reason || 'Rate limited');
  }

  const url = `${API_BASE}${path}`;

  // Timeout: 30 seconds
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'GZM-Frontend',
        'X-GZM-Client': 'v4.1',
        ...options?.headers,
      },
      credentials: 'same-origin',
    });

    if (!res.ok) {
      reportFailure();
      throw new APIError(res.status, `API error: ${res.status} ${res.statusText}`);
    }

    // Max response size: 10MB
    const contentLength = res.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
      reportFailure();
      throw new APIError(413, 'Response too large');
    }

    reportSuccess();
    return res.json();
  } catch (e) {
    if (e instanceof APIError) throw e;
    reportFailure();
    throw new APIError(0, 'Network error or timeout');
  } finally {
    clearTimeout(timeout);
  }
}

// Deduplicated GET (prevents duplicate requests within 2s)
function deduplicatedGet<T>(path: string): Promise<T> {
  return deduplicateRequest(path, () => request<T>(path));
}

export const api = {
  // System (deduplicated, polled frequently)
  health: () => deduplicatedGet<{ status: string }>('/health'),
  stats: () => deduplicatedGet<{ node_count: number; relationship_count: number; uptime: number }>('/stats'),

  // Intelligence (deduplicated reads)
  alerts: () => deduplicatedGet<any[]>('/alerts'),
  hotspots: () => deduplicatedGet<any[]>('/hotspots'),
  dossier: (name: string) => {
    const clean = sanitizeInput(name);
    if (!clean) throw new APIError(400, 'Invalid entity name');
    return deduplicatedGet<any>(`/dossier/${encodeURIComponent(clean)}`);
  },
  briefing: (country: string) => {
    const clean = sanitizeInput(country);
    if (!clean) throw new APIError(400, 'Invalid country name');
    return deduplicatedGet<any>(`/briefing/${encodeURIComponent(clean)}`);
  },

  // Prediction (mutation, rate limited: 10/min)
  predict: (data: Record<string, unknown>) => {
    const sanitized = Object.fromEntries(
      Object.entries(data).filter(([k]) => k.length <= 100)
    );
    return request<any>('/predict', { method: 'POST', body: JSON.stringify(sanitized) });
  },

  // CRUD (deduplicated, sanitized)
  getVertices: (type: string, limit = 100) => {
    const cleanType = sanitizeInput(type).replace(/[^a-zA-Z0-9_]/g, '');
    const safeLimit = Math.min(Math.max(1, limit), 1000);
    return deduplicatedGet<any[]>(`/api/v1/vertices/${cleanType}?limit=${safeLimit}`);
  },
  getVertex: (type: string, id: string) => {
    const cleanType = sanitizeInput(type).replace(/[^a-zA-Z0-9_]/g, '');
    const cleanId = sanitizeInput(id).replace(/[^a-zA-Z0-9_\-]/g, '');
    return deduplicatedGet<any>(`/api/v1/vertices/${cleanType}/${cleanId}`);
  },

  // Export (rate limited: 5/min)
  exportCSV: (params: Record<string, string>) => {
    const rateCheck = checkRequest('/api/v1/export/csv', 'GET');
    if (!rateCheck.allowed) throw new APIError(429, rateCheck.reason || 'Export rate limited');
    const sanitizedParams = Object.fromEntries(
      Object.entries(params).map(([k, v]) => [sanitizeInput(k), sanitizeInput(v)])
    );
    const qs = new URLSearchParams(sanitizedParams).toString();
    return `${API_BASE}/api/v1/export/csv?${qs}`;
  },

  // ISR Tasking (EXPENSIVE: 3/hour for satellite, 10/min for drone)
  isrRequirements: () => deduplicatedGet<any[]>('/api/v1/isr/requirements'),
  platformStatus: () => deduplicatedGet<any[]>('/api/v1/platforms'),
  taskPlatform: (task: Record<string, unknown>) => {
    if (!task.target_entity_id || !task.required_sensor) {
      throw new APIError(400, 'Missing required tasking fields');
    }
    // Extra confirmation for satellite tasking (costs real money)
    if (task.platform_type === 'satellite') {
      const satCheck = checkRequest('/api/v1/isr/task/satellite', 'POST');
      if (!satCheck.allowed) throw new APIError(429, satCheck.reason || 'Satellite tasking limit reached (3/hour)');
    }
    return request<any>('/api/v1/isr/task', { method: 'POST', body: JSON.stringify(task) });
  },
};
