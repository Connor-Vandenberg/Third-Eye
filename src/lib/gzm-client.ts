/**
 * GZM Backend Client — Type-safe interface to all Python backend endpoints.
 * 
 * Connects the Next.js frontend to the GZM AIP Intelligence Engine,
 * Collaboration system, Provenance tracking, and Writeback actions.
 */

import { GZM_BACKEND_URL } from './constants';

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

export interface AIPQueryResponse {
  narrative: string;
  intent: string;
  graph_result: {
    vertices: Array<Record<string, unknown>>;
    edges: Array<Record<string, unknown>>;
    statistics: Record<string, unknown>;
    query_used: string;
    execution_ms: number;
  };
  entities_found: number;
  connections_found: number;
  signals_detected: Array<Record<string, unknown>>;
  follow_up_suggestions: string[];
  confidence: number;
  timestamp: string;
  provider_used: string;
  model_used: string;
  tokens_used: number;
}

export interface SignalRequest {
  min_severity?: number;
  region?: string;
  signal_types?: string[];
  hours_back?: number;
  limit?: number;
}

export interface SignalResponse {
  signals: Array<Record<string, unknown>>;
  total_count: number;
  by_severity: Record<string, number>;
  by_type: Record<string, number>;
  narrative: string;
}

export interface HealthResponse {
  status: string;
  llm_providers: Record<string, boolean>;
  tigergraph: boolean;
  schema: { loaded: boolean; vertices: number; edges: number };
  tools_registered: number;
  capabilities: Record<string, boolean>;
}

export interface BriefResponse {
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

export interface AutonomousCycleResponse {
  cycle_completed: boolean;
  execution_ms: number;
  gaps_detected: number;
  convergence_events: number;
  isr_requirements_created: number;
  critical_regions: string[];
  top_gaps: Array<{ entity: string; priority: number }>;
  timestamp: string;
}

export interface ProvenanceTrace {
  entity_id: string;
  entity_type: string;
  current_version: number;
  admiralty_code: string;
  effective_confidence: number;
  freshness: number;
  staleness_hours: number;
  is_stale: boolean;
  source_collector: string;
  corroboration: Record<string, unknown>;
  version_history: Array<Record<string, unknown>>;
}

// ============================================================================
// CLIENT
// ============================================================================

class GZMClient {
  private baseUrl: string;

  constructor(baseUrl: string = GZM_BACKEND_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });

    if (!response.ok) {
      const error = await response.text().catch(() => response.statusText);
      throw new Error(`GZM API Error ${response.status}: ${error}`);
    }

    return response.json() as Promise<T>;
  }

  // ── AIP Intelligence Engine ──

  async query(req: AIPQueryRequest): Promise<AIPQueryResponse> {
    return this.request('/aip/query', { method: 'POST', body: JSON.stringify(req) });
  }

  async getSignals(req: SignalRequest = {}): Promise<SignalResponse> {
    return this.request('/aip/signals', { method: 'POST', body: JSON.stringify(req) });
  }

  async health(): Promise<HealthResponse> {
    return this.request('/aip/health');
  }

  async brief(region?: string): Promise<BriefResponse> {
    return this.request('/aip/brief', { method: 'POST', body: JSON.stringify({ region }) });
  }

  async autonomous(): Promise<AutonomousCycleResponse> {
    return this.request('/aip/autonomous', { method: 'POST' });
  }

  async gaps(staleness_hours: number = 72): Promise<Record<string, unknown>> {
    return this.request(`/aip/gaps?staleness_hours=${staleness_hours}`, { method: 'POST' });
  }

  async tools(): Promise<Record<string, unknown>> {
    return this.request('/aip/tools');
  }

  async schema(): Promise<Record<string, unknown>> {
    return this.request('/aip/schema');
  }

  async invokeTool(toolName: string, args: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    return this.request(`/aip/tool/${toolName}`, { method: 'POST', body: JSON.stringify(args) });
  }

  // ── Provenance ──

  async traceProvenance(entityId: string): Promise<ProvenanceTrace> {
    return this.request(`/provenance/trace/${entityId}`);
  }

  async provenanceStats(): Promise<Record<string, unknown>> {
    return this.request('/provenance/statistics');
  }

  async contradictions(): Promise<Record<string, unknown>> {
    return this.request('/provenance/contradictions');
  }

  async needsCollection(): Promise<Record<string, unknown>> {
    return this.request('/provenance/needs-collection');
  }

  // ── Writeback Actions ──

  async executeAction(actionType: string, targetEntity: string, params: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    return this.request('/actions/execute', {
      method: 'POST',
      body: JSON.stringify({ action_type: actionType, target_entity: targetEntity, parameters: params }),
    });
  }

  async pendingActions(): Promise<Record<string, unknown>> {
    return this.request('/actions/pending');
  }

  async confirmAction(actionId: string): Promise<Record<string, unknown>> {
    return this.request(`/actions/confirm/${actionId}`, { method: 'POST' });
  }

  async actionAudit(): Promise<Record<string, unknown>> {
    return this.request('/actions/audit');
  }

  // ── Collaboration (REST fallbacks) ──

  async presence(): Promise<Record<string, unknown>> {
    return this.request('/collab/presence');
  }

  async activityFeed(): Promise<Record<string, unknown>> {
    return this.request('/collab/activity');
  }

  async threatBoard(): Promise<Record<string, unknown>> {
    return this.request('/collab/threat-board');
  }
}

export const gzmClient = new GZMClient();
export default GZMClient;
