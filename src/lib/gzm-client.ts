/**
 * GZM Backend Client — Unified API interface.
 * 
 * Connects the Third-Eye frontend to ALL GZM backend endpoints:
 * - /aip/query (natural language intelligence queries)
 * - /aip/signals (convergence signals)
 * - /aip/brief (intelligence briefings)
 * - /aip/autonomous (autonomous reasoning cycle)
 * - /aip/entity (entity lookup)
 * - /aip/health (system health)
 * - /aip/tools (available AI tools)
 * - /aip/gaps (intelligence gaps)
 * - /provenance/trace/{id} (data lineage)
 * - /actions/execute (writeback actions)
 * - /collab/* (collaboration)
 */

import { GZM_CONFIG } from './gzm-config';

interface AIPQueryRequest {
  query: string;
  context?: Record<string, unknown>;
  provider?: 'claude' | 'openai' | 'ollama';
  model?: string;
  max_graph_depth?: number;
  include_raw?: boolean;
}

interface AIPQueryResponse {
  narrative: string;
  intent: string;
  graph_result: {
    vertices: unknown[];
    edges: unknown[];
    statistics: Record<string, unknown>;
    query_used: string;
    execution_ms: number;
  };
  entities_found: number;
  connections_found: number;
  signals_detected: unknown[];
  follow_up_suggestions: string[];
  confidence: number;
  provider_used: string;
  model_used: string;
  tokens_used: number;
}

interface SignalResponse {
  signals: unknown[];
  total_count: number;
  by_severity: Record<string, number>;
  by_type: Record<string, number>;
  narrative: string;
}

interface BriefResponse {
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

interface HealthResponse {
  status: string;
  llm_providers: Record<string, boolean>;
  tigergraph: boolean;
  schema: { loaded: boolean; vertices: number; edges: number };
  tools_registered: number;
  capabilities: Record<string, boolean>;
}

async function gzmFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${GZM_CONFIG.API_URL}${endpoint}`;
  
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GZM_CONFIG.TIMEOUT);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `GZM API error: ${response.status}`);
    }
    
    return await response.json() as T;
  } finally {
    clearTimeout(timeout);
  }
}

/** Send a natural language query to the GZM Intelligence Engine */
export async function queryIntelligence(request: AIPQueryRequest): Promise<AIPQueryResponse> {
  return gzmFetch<AIPQueryResponse>('/aip/query', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/** Get active convergence signals */
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
      hours_back: params.hours_back ?? 48,
      limit: params.limit ?? 50,
      region: params.region,
    }),
  });
}

/** Generate an intelligence briefing */
export async function generateBrief(region?: string): Promise<BriefResponse> {
  return gzmFetch<BriefResponse>('/aip/brief', {
    method: 'POST',
    body: JSON.stringify({ region }),
  });
}

/** Run autonomous reasoning cycle */
export async function runAutonomous(): Promise<Record<string, unknown>> {
  return gzmFetch('/aip/autonomous', { method: 'POST' });
}

/** Get system health */
export async function getHealth(): Promise<HealthResponse> {
  return gzmFetch<HealthResponse>('/aip/health');
}

/** Get intelligence gaps */
export async function getGaps(staleness_hours = 72): Promise<Record<string, unknown>> {
  return gzmFetch(`/aip/gaps?staleness_hours=${staleness_hours}`, { method: 'POST' });
}

/** Get provenance lineage for an entity */
export async function getProvenance(entityId: string): Promise<Record<string, unknown>> {
  return gzmFetch(`/provenance/trace/${entityId}`);
}

/** Execute a writeback action */
export async function executeAction(params: {
  action_type: string;
  target_entity: string;
  parameters?: Record<string, unknown>;
  priority?: string;
}): Promise<Record<string, unknown>> {
  return gzmFetch('/actions/execute', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/** Invoke a specific AIP tool */
export async function invokeTool(toolName: string, args: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
  return gzmFetch(`/aip/tool/${toolName}`, {
    method: 'POST',
    body: JSON.stringify(args),
  });
}

/** Get available tools */
export async function getTools(): Promise<Record<string, unknown>> {
  return gzmFetch('/aip/tools');
}

/** Get online users from collaboration */
export async function getPresence(): Promise<Record<string, unknown>> {
  return gzmFetch('/collab/presence');
}

/** Get graph schema */
export async function getSchema(): Promise<Record<string, unknown>> {
  return gzmFetch('/aip/schema');
}

export const gzmClient = {
  queryIntelligence,
  getSignals,
  generateBrief,
  runAutonomous,
  getHealth,
  getGaps,
  getProvenance,
  executeAction,
  invokeTool,
  getTools,
  getPresence,
  getSchema,
};

export default gzmClient;
