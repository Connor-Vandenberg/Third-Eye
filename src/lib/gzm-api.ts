/**
 * GZM Backend API Client.
 * 
 * Connects the Third-Eye frontend to the GZM backend at /aip/* endpoints.
 * Handles all communication with the 70+ tool AIP engine.
 */

import { GZM_API_URL } from './gzm-config';

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
    vertices: Record<string, unknown>[];
    edges: Record<string, unknown>[];
    statistics: Record<string, unknown>;
    query_used: string;
    execution_ms: number;
  };
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

export interface HealthResponse {
  status: string;
  llm_providers: Record<string, boolean>;
  tigergraph: boolean;
  schema: { loaded: boolean; vertices: number; edges: number };
  tools_registered: number;
  capabilities: Record<string, boolean>;
}

class GZMApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = GZM_API_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers as Record<string, string> },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`GZM API error ${response.status}: ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  // ═══════════════════════════════════════════════════
  // AIP INTELLIGENCE ENGINE
  // ═══════════════════════════════════════════════════

  async query(req: AIPQueryRequest): Promise<AIPQueryResponse> {
    return this.request<AIPQueryResponse>('/aip/query', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  async getSignals(hoursBback = 24, minSeverity = 0.4, limit = 50): Promise<SignalResponse> {
    return this.request<SignalResponse>('/aip/signals', {
      method: 'POST',
      body: JSON.stringify({ hours_back: hoursBback, min_severity: minSeverity, limit }),
    });
  }

  async generateBrief(region?: string): Promise<BriefResponse> {
    return this.request<BriefResponse>('/aip/brief', {
      method: 'POST',
      body: JSON.stringify({ region: region || null }),
    });
  }

  async runAutonomousCycle(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/aip/autonomous', { method: 'POST' });
  }

  async detectGaps(stalenessHours = 72): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(`/aip/gaps?staleness_hours=${stalenessHours}`, { method: 'POST' });
  }

  async invokeTool(toolName: string, args: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(`/aip/tool/${toolName}`, {
      method: 'POST',
      body: JSON.stringify(args),
    });
  }

  async getTools(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/aip/tools');
  }

  async getSchema(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/aip/schema');
  }

  // ═══════════════════════════════════════════════════
  // PROVENANCE
  // ═══════════════════════════════════════════════════

  async traceLineage(entityId: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(`/provenance/trace/${entityId}`);
  }

  async getContradictions(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/provenance/contradictions');
  }

  async getProvenanceStats(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/provenance/statistics');
  }

  // ═══════════════════════════════════════════════════
  // ACTIONS (WRITEBACK)
  // ═══════════════════════════════════════════════════

  async executeAction(actionType: string, targetEntity: string, params: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/actions/execute', {
      method: 'POST',
      body: JSON.stringify({ action_type: actionType, target_entity: targetEntity, parameters: params }),
    });
  }

  async getPendingActions(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/actions/pending');
  }

  async confirmAction(actionId: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(`/actions/confirm/${actionId}`, { method: 'POST' });
  }

  // ═══════════════════════════════════════════════════
  // COLLABORATION
  // ═══════════════════════════════════════════════════

  async getPresence(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/collab/presence');
  }

  async getActivity(limit = 50): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(`/collab/activity?limit=${limit}`);
  }

  async getThreatBoard(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/collab/threat-board');
  }

  // ═══════════════════════════════════════════════════
  // SYSTEM
  // ═══════════════════════════════════════════════════

  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/aip/health');
  }

  async systemStats(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/stats');
  }
}

// Singleton export
export const gzmApi = new GZMApiClient();
export default gzmApi;
