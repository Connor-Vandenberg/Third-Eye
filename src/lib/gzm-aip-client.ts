/**
 * GZM AIP Client — Connects the frontend to the Python backend's
 * /aip/* intelligence engine endpoints.
 *
 * This replaces the old Gemini-based /api/ai/analyze route with direct
 * calls to the GZM backend's multi-step reasoning engine (70+ tools,
 * graph-backed intelligence, autonomous briefing).
 */

const GZM_API_URL = process.env.NEXT_PUBLIC_GZM_API_URL || 'http://localhost:8000';

// ============================================================================
// TYPES
// ============================================================================

export interface AIPQueryRequest {
  query: string;
  context?: Record<string, unknown>;
  provider?: 'claude' | 'openai' | 'ollama';
  model?: string;
  max_graph_depth?: number;
  include_raw?: boolean;
}

export interface GraphResult {
  vertices: Record<string, unknown>[];
  edges: Record<string, unknown>[];
  statistics: Record<string, unknown>;
  query_used: string;
  execution_ms: number;
}

export interface AIPQueryResponse {
  narrative: string;
  intent: string;
  graph_result: GraphResult;
  entities_found: number;
  connections_found: number;
  signals_detected: Record<string, unknown>[];
  follow_up_suggestions: string[];
  confidence: number;
  timestamp: string;
  provider_used: string;
  model_used: string;
  tokens_used: number;
}

export interface SignalResponse {
  signals: Record<string, unknown>[];
  total_count: number;
  by_severity: Record<string, number>;
  by_type: Record<string, number>;
  narrative: string;
}

export interface IntelligenceBrief {
  title: string;
  priority: number;
  category: string;
  narrative: string;
  entities_involved: string[];
  signals_correlated: string[];
  gaps_identified: string[];
  recommended_actions: string[];
  confidence: number;
  generated_at: string;
}

export interface HealthStatus {
  status: string;
  llm_providers: Record<string, boolean>;
  tigergraph: boolean;
  schema: { loaded: boolean; vertices: number; edges: number; version?: string };
  tools_registered: number;
  capabilities: Record<string, boolean>;
}

export interface AutonomousCycleResult {
  cycle_completed: boolean;
  execution_ms: number;
  gaps_detected: number;
  convergence_events: number;
  isr_requirements_created: number;
  critical_regions: string[];
  top_gaps: { entity: string; priority: number }[];
  timestamp: string;
}

// ============================================================================
// CLIENT
// ============================================================================

async function gzmFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${GZM_API_URL}${endpoint}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(`GZM API error (${res.status}): ${errorText.slice(0, 200)}`);
  }

  return res.json() as Promise<T>;
}

/**
 * Query the GZM Intelligence Engine with natural language.
 * Uses multi-step reasoning with 70+ tools.
 */
export async function queryIntelligence(request: AIPQueryRequest): Promise<AIPQueryResponse> {
  return gzmFetch<AIPQueryResponse>('/aip/query', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Get active convergence signals.
 */
export async function getSignals(params: {
  min_severity?: number;
  hours_back?: number;
  limit?: number;
  region?: string;
} = {}): Promise<SignalResponse> {
  return gzmFetch<SignalResponse>('/aip/signals', {
    method: 'POST',
    body: JSON.stringify({
      min_severity: params.min_severity ?? 0.4,
      hours_back: params.hours_back ?? 24,
      limit: params.limit ?? 50,
      region: params.region,
    }),
  });
}

/**
 * Generate an autonomous intelligence brief.
 */
export async function generateBrief(region?: string): Promise<IntelligenceBrief> {
  return gzmFetch<IntelligenceBrief>('/aip/brief', {
    method: 'POST',
    body: JSON.stringify({ region }),
  });
}

/**
 * Run one autonomous reasoning cycle (gap detection + signal correlation + auto-tasking).
 */
export async function runAutonomousCycle(): Promise<AutonomousCycleResult> {
  return gzmFetch<AutonomousCycleResult>('/aip/autonomous', {
    method: 'POST',
  });
}

/**
 * Check AIP system health.
 */
export async function getHealth(): Promise<HealthStatus> {
  return gzmFetch<HealthStatus>('/aip/health');
}

/**
 * Get available tools the AI can invoke.
 */
export async function getTools(): Promise<{ tools: Record<string, unknown>; count: number }> {
  return gzmFetch('/aip/tools');
}

/**
 * Invoke a specific tool directly.
 */
export async function invokeTool(toolName: string, args: Record<string, unknown> = {}): Promise<unknown> {
  return gzmFetch(`/aip/tool/${toolName}`, {
    method: 'POST',
    body: JSON.stringify(args),
  });
}

/**
 * Get intelligence gaps (stale high-threat entities).
 */
export async function getGaps(staleness_hours = 72): Promise<unknown> {
  return gzmFetch(`/aip/gaps?staleness_hours=${staleness_hours}`, { method: 'POST' });
}

/**
 * Get provenance lineage for an entity.
 */
export async function getProvenance(entityId: string): Promise<unknown> {
  return gzmFetch(`/provenance/trace/${entityId}`);
}

/**
 * Execute a writeback action.
 */
export async function executeAction(actionType: string, targetEntity: string, params: Record<string, unknown> = {}): Promise<unknown> {
  return gzmFetch('/actions/execute', {
    method: 'POST',
    body: JSON.stringify({
      action_type: actionType,
      target_entity: targetEntity,
      parameters: params,
      skip_confirmation: false,
    }),
  });
}

// ============================================================================
// REAL-TIME COLLABORATION WEBSOCKET
// ============================================================================

export class GZMRealtimeConnection {
  private ws: WebSocket | null = null;
  private userId: string;
  private displayName: string;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(userId: string, displayName: string) {
    this.userId = userId;
    this.displayName = displayName;
  }

  connect(): void {
    const wsUrl = GZM_API_URL.replace('http', 'ws');
    this.ws = new WebSocket(
      `${wsUrl}/collab/ws/${this.userId}?name=${encodeURIComponent(this.displayName)}&role=analyst`
    );

    this.ws.onopen = () => {
      this.emit('connected', { userId: this.userId });
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const type = data.type || 'unknown';
        this.emit(type, data);
        this.emit('*', data); // Wildcard listener
      } catch (e) {
        console.warn('GZM WS: Failed to parse message', e);
      }
    };

    this.ws.onclose = () => {
      this.emit('disconnected', { userId: this.userId });
      // Auto-reconnect after 3 seconds
      this.reconnectTimer = setTimeout(() => this.connect(), 3000);
    };

    this.ws.onerror = (err) => {
      console.warn('GZM WS error:', err);
    };
  }

  disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }

  send(type: string, data: Record<string, unknown> = {}): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, ...data }));
    }
  }

  on(event: string, callback: (data: unknown) => void): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach((cb) => cb(data));
  }

  // Convenience methods
  moveCursor(lat: number, lng: number): void {
    this.send('cursor_move', { position: { lat, lng } });
  }

  selectEntity(entityId: string): void {
    this.send('entity_select', { entity_id: entityId });
  }

  sendChat(message: string): void {
    this.send('chat_message', { message });
  }

  shareRegion(bounds: { north: number; south: number; east: number; west: number }, message?: string): void {
    this.send('region_share', { bounds, message });
  }
}
