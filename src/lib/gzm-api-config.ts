/**
 * GZM API Configuration.
 * 
 * The frontend connects to the Python backend at this URL.
 * Set NEXT_PUBLIC_GZM_API_URL in your .env.local file.
 * 
 * Default: http://localhost:8000 (local development)
 * Production: https://api.grayzonemonitor.com
 */

export const GZM_API_URL = process.env.NEXT_PUBLIC_GZM_API_URL || 'http://localhost:8000';

export const GZM_ENDPOINTS = {
  // AIP Intelligence Engine
  query: `${GZM_API_URL}/aip/query`,
  signals: `${GZM_API_URL}/aip/signals`,
  entity: `${GZM_API_URL}/aip/entity`,
  brief: `${GZM_API_URL}/aip/brief`,
  autonomous: `${GZM_API_URL}/aip/autonomous`,
  gaps: `${GZM_API_URL}/aip/gaps`,
  tools: `${GZM_API_URL}/aip/tools`,
  health: `${GZM_API_URL}/aip/health`,
  schema: `${GZM_API_URL}/aip/schema`,

  // Collaboration
  collabWs: `${GZM_API_URL.replace('http', 'ws')}/collab/ws`,
  presence: `${GZM_API_URL}/collab/presence`,
  activity: `${GZM_API_URL}/collab/activity`,

  // Provenance
  provenanceTrace: (id: string) => `${GZM_API_URL}/provenance/trace/${id}`,
  provenanceStats: `${GZM_API_URL}/provenance/statistics`,
  contradictions: `${GZM_API_URL}/provenance/contradictions`,

  // Writeback Actions
  executeAction: `${GZM_API_URL}/actions/execute`,
  pendingActions: `${GZM_API_URL}/actions/pending`,
  auditLog: `${GZM_API_URL}/actions/audit`,

  // Legacy (gateway)
  healthLegacy: `${GZM_API_URL}/health`,
  stats: `${GZM_API_URL}/stats`,
  alerts: `${GZM_API_URL}/alerts`,
  hotspots: `${GZM_API_URL}/hotspots`,
} as const;
