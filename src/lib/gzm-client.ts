'use client';

/**
 * GZM Backend API Client
 * Typed client for all GZM backend services with circuit breaker pattern.
 * Connects to: API (8080), MCP (8090), GEOINT, ISR (8087), Reporting (8086)
 */

const GZM_API = process.env.NEXT_PUBLIC_GZM_API_URL || 'http://localhost:8080';
const GZM_MCP = process.env.NEXT_PUBLIC_GZM_MCP_URL || 'http://localhost:8090';
const GZM_GEOINT = process.env.NEXT_PUBLIC_GZM_GEOINT_URL || 'http://localhost:8083';
const GZM_ISR = process.env.NEXT_PUBLIC_GZM_ISR_URL || 'http://localhost:8087';
const GZM_REPORTING = process.env.NEXT_PUBLIC_GZM_REPORTING_URL || 'http://localhost:8086';
const GZM_WS = process.env.NEXT_PUBLIC_GZM_WS_URL || 'ws://localhost:9090/ws';

// Circuit breaker state
interface CircuitState {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open';
}

const circuits: Record<string, CircuitState> = {};

function getCircuit(service: string): CircuitState {
  if (!circuits[service]) {
    circuits[service] = { failures: 0, lastFailure: 0, state: 'closed' };
  }
  const c = circuits[service];
  if (c.state === 'open' && Date.now() - c.lastFailure > 30000) {
    c.state = 'half-open';
  }
  return c;
}

async function gzmFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const service = new URL(url).origin;
  const circuit = getCircuit(service);

  if (circuit.state === 'open') {
    throw new Error(`Circuit open for ${service}`);
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

    circuit.failures = 0;
    circuit.state = 'closed';
    return res.json();
  } catch (err) {
    circuit.failures++;
    circuit.lastFailure = Date.now();
    if (circuit.failures >= 5) circuit.state = 'open';
    throw err;
  }
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

export interface H3Cell {
  hex: string;
  score: number;
  signals: number;
  top_int: string;
  lat: number;
  lng: number;
}

export interface SignalEvent {
  id: string;
  type: 'signal' | 'entity_move' | 'alert' | 'prediction';
  timestamp: string;
  lat: number;
  lng: number;
  int_domain: string;
  confidence: number;
  convergence_score: number;
  metadata: Record<string, unknown>;
}

export interface ISRAsset {
  id: string;
  name: string;
  type: 'drone' | 'satellite' | 'ground_sensor' | 'ship' | 'aircraft';
  status: 'ready' | 'busy' | 'maintenance';
  lat: number;
  lng: number;
  coverage_radius_km: number;
  capabilities: string[];
}

export interface ISRTaskRequest {
  target_hex: string;
  target_lat: number;
  target_lng: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  asset_id: string;
  collection_type: string;
  duration_minutes: number;
}

export interface ISRTaskResponse {
  task_id: string;
  status: 'accepted' | 'queued' | 'rejected';
  eta_minutes: number;
  asset_name: string;
}

export interface EntityDetail {
  id: string;
  name: string;
  type: string;
  confidence: number;
  first_seen: string;
  last_seen: string;
  lat: number;
  lng: number;
  int_domains: string[];
  relationships: { target: string; type: string; weight: number }[];
  signals: SignalEvent[];
}

export interface PredictionResult {
  id: string;
  hypothesis: string;
  confidence: number;
  horizon_hours: number;
  lat: number;
  lng: number;
  brier_score: number | null;
  resolved: boolean;
}

// H3 Convergence Heatmap
export async function fetchConvergenceHeatmap(resolution = 6, hours = 24): Promise<H3Cell[]> {
  return gzmFetch<H3Cell[]>(
    `${GZM_API}/api/h3/convergence?resolution=${resolution}&hours=${hours}`
  );
}

// Entity details
export async function fetchEntityDetail(entityId: string): Promise<EntityDetail> {
  return gzmFetch<EntityDetail>(`${GZM_API}/api/entities/${entityId}`);
}

// Map data (all entities with positions)
export async function fetchMapEntities(bbox?: [number, number, number, number]): Promise<SignalEvent[]> {
  const params = bbox ? `?bbox=${bbox.join(',')}` : '';
  return gzmFetch<SignalEvent[]>(`${GZM_API}/api/map/entities${params}`);
}

// ISR Assets
export async function fetchISRAssets(): Promise<ISRAsset[]> {
  return gzmFetch<ISRAsset[]>(`${GZM_ISR}/api/assets`);
}

// Task ISR
export async function taskISR(request: ISRTaskRequest): Promise<ISRTaskResponse> {
  return gzmFetch<ISRTaskResponse>(`${GZM_ISR}/api/task`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

// Predictions
export async function fetchPredictions(hours = 72): Promise<PredictionResult[]> {
  return gzmFetch<PredictionResult[]>(`${GZM_API}/api/predictions?hours=${hours}`);
}

// GEOINT NL Query
export async function queryGEOINT(query: string, sessionId?: string) {
  return gzmFetch(`${GZM_GEOINT}/query`, {
    method: 'POST',
    body: JSON.stringify({ query, session_id: sessionId || '' }),
  });
}

// Health check
export async function checkHealth(): Promise<{ status: string; services: Record<string, boolean> }> {
  return gzmFetch(`${GZM_API}/health`);
}

// WebSocket URL export
export const WS_URL = GZM_WS;

// Export base URLs for direct use
export const ENDPOINTS = {
  API: GZM_API,
  MCP: GZM_MCP,
  GEOINT: GZM_GEOINT,
  ISR: GZM_ISR,
  REPORTING: GZM_REPORTING,
  WS: GZM_WS,
} as const;
