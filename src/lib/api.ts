const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    throw new APIError(res.status, `API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export const api = {
  // System
  health: () => request<{ status: string }>('/health'),
  stats: () => request<{ node_count: number; relationship_count: number; uptime: number }>('/stats'),

  // Intelligence
  alerts: () => request<any[]>('/alerts'),
  hotspots: () => request<any[]>('/hotspots'),
  dossier: (name: string) => request<any>(`/dossier/${encodeURIComponent(name)}`),
  briefing: (country: string) => request<any>(`/briefing/${encodeURIComponent(country)}`),

  // Prediction
  predict: (data: Record<string, unknown>) =>
    request<any>('/predict', { method: 'POST', body: JSON.stringify(data) }),

  // CRUD
  getVertices: (type: string, limit = 100) =>
    request<any[]>(`/api/v1/vertices/${type}?limit=${limit}`),
  getVertex: (type: string, id: string) =>
    request<any>(`/api/v1/vertices/${type}/${id}`),

  // Export
  exportCSV: (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return `${API_BASE}/api/v1/export/csv?${qs}`;
  },

  // ISR Tasking
  isrRequirements: () => request<any[]>('/api/v1/isr/requirements'),
  platformStatus: () => request<any[]>('/api/v1/platforms'),
  taskPlatform: (task: Record<string, unknown>) =>
    request<any>('/api/v1/isr/task', { method: 'POST', body: JSON.stringify(task) }),
};
