import { sanitizeInput, secureFetch, checkRateLimit } from './security';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;

  // Rate limit: 120 requests per minute per endpoint
  if (!checkRateLimit(path, 120, 60000)) {
    throw new APIError(429, 'Rate limit exceeded');
  }

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
      throw new APIError(res.status, `API error: ${res.status} ${res.statusText}`);
    }

    // Max response size: 10MB
    const contentLength = res.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
      throw new APIError(413, 'Response too large');
    }

    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  // System
  health: () => request<{ status: string }>('/health'),
  stats: () => request<{ node_count: number; relationship_count: number; uptime: number }>('/stats'),

  // Intelligence (sanitize user-provided names)
  alerts: () => request<any[]>('/alerts'),
  hotspots: () => request<any[]>('/hotspots'),
  dossier: (name: string) => {
    const clean = sanitizeInput(name);
    if (!clean) throw new APIError(400, 'Invalid entity name');
    return request<any>(`/dossier/${encodeURIComponent(clean)}`);
  },
  briefing: (country: string) => {
    const clean = sanitizeInput(country);
    if (!clean) throw new APIError(400, 'Invalid country name');
    return request<any>(`/briefing/${encodeURIComponent(clean)}`);
  },

  // Prediction (sanitize body)
  predict: (data: Record<string, unknown>) => {
    // Don't allow arbitrary keys longer than 100 chars
    const sanitized = Object.fromEntries(
      Object.entries(data).filter(([k]) => k.length <= 100)
    );
    return request<any>('/predict', { method: 'POST', body: JSON.stringify(sanitized) });
  },

  // CRUD (sanitize type parameter)
  getVertices: (type: string, limit = 100) => {
    const cleanType = sanitizeInput(type).replace(/[^a-zA-Z0-9_]/g, '');
    const safeLimit = Math.min(Math.max(1, limit), 1000); // Clamp 1-1000
    return request<any[]>(`/api/v1/vertices/${cleanType}?limit=${safeLimit}`);
  },
  getVertex: (type: string, id: string) => {
    const cleanType = sanitizeInput(type).replace(/[^a-zA-Z0-9_]/g, '');
    const cleanId = sanitizeInput(id).replace(/[^a-zA-Z0-9_\-]/g, '');
    return request<any>(`/api/v1/vertices/${cleanType}/${cleanId}`);
  },

  // Export (returns URL, doesn't fetch)
  exportCSV: (params: Record<string, string>) => {
    const sanitizedParams = Object.fromEntries(
      Object.entries(params).map(([k, v]) => [sanitizeInput(k), sanitizeInput(v)])
    );
    const qs = new URLSearchParams(sanitizedParams).toString();
    return `${API_BASE}/api/v1/export/csv?${qs}`;
  },

  // ISR Tasking
  isrRequirements: () => request<any[]>('/api/v1/isr/requirements'),
  platformStatus: () => request<any[]>('/api/v1/platforms'),
  taskPlatform: (task: Record<string, unknown>) => {
    // Validate required fields exist before sending
    if (!task.target_entity_id || !task.required_sensor) {
      throw new APIError(400, 'Missing required tasking fields');
    }
    return request<any>('/api/v1/isr/task', { method: 'POST', body: JSON.stringify(task) });
  },
};
