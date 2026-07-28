/**
 * GZM Map + H3 + ISR API Client.
 *
 * Connects Third-Eye frontend to GZM backend map/convergence/ISR endpoints.
 * Handles REST calls for map data + WebSocket for real-time updates.
 *
 * Backend endpoints served by:
 * - api/map_endpoints.py -> /map/*
 * - api/h3_convergence_endpoint.py -> /api/h3/*
 * - api/isr_endpoints.py -> /isr/*
 * - api/isr_allocation_endpoint.py -> /isr/allocate
 * - api/app.py -> /ws/map, /ws/alerts
 */

import { GZM_CONFIG } from './gzm-config';
import ReconnectingWebSocket from 'reconnecting-websocket';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface H3ConvergenceCell {
  hex: string;
  score: number;
  signals: number;
  top_int: string;
  lat: number;
  lng: number;
  region: string;
  tier: string;
  velocity: number;
}

export interface MapAOI {
  aoi_id: string;
  name: string;
  threat_level: number;
  active_signals: number;
  top_signals: string[];
  center: [number, number];
  geometry: GeoJSON.Polygon;
  tasked_platforms: string[];
  last_anomaly: string | null;
}

export interface DarkVessel {
  mmsi: string;
  name: string;
  lat: number;
  lon: number;
  last_ais: string;
  gap_hours: number;
  classification: 'SANCTIONED' | 'DARK' | 'SPOOFING' | 'UNKNOWN';
  flag: string;
  risk_score: number;
}

export interface DroneSwarmThreat {
  id: string;
  lat: number;
  lon: number;
  swarm_size: number;
  estimated_type: string;
  first_detected: string;
  threat_level: number;
  kill_chain_stage: string;
}

export interface ActiveFire {
  lat: number;
  lon: number;
  brightness: number;
  confidence: number;
  satellite: string;
  detected_at: string;
}

export interface PredictionSummary {
  pending: number;
  resolved: number;
  mean_brier: number | null;
  predictions: Array<{
    id: string;
    hypothesis: string;
    confidence: number;
    horizon_hours: number;
    created_at: string;
    status: 'pending' | 'confirmed' | 'disconfirmed';
  }>;
}

export interface ISRAsset {
  id: string;
  type: 'drone' | 'satellite' | 'ground_sensor' | 'sdr' | 'ship';
  name: string;
  lat: number;
  lng: number;
  status: 'ready' | 'busy' | 'returning' | 'maintenance';
  coverage_radius_km: number;
  endurance_hours: number;
  capabilities: string[];
  current_mission: string | null;
}

export interface ISRTaskRequest {
  target_lat: number;
  target_lng: number;
  target_h3?: string;
  priority: 'critical' | 'high' | 'routine';
  collection_type: string[];
  duration_hours: number;
  requester: string;
}

export interface ISRTaskResponse {
  task_id: string;
  assigned_asset: string;
  eta_minutes: number;
  coverage_polygon: [number, number][];
  status: 'queued' | 'assigned' | 'executing';
}

export interface MapWebSocketMessage {
  type: 'signal' | 'entity_move' | 'alert' | 'prediction' | 'data_update' | 'connected' | 'pong';
  timestamp: string;
  payload?: {
    id?: string;
    lat?: number;
    lng?: number;
    int_domain?: string;
    confidence?: number;
    convergence_score?: number;
    metadata?: Record<string, unknown>;
    file?: string;
  };
}

// ═══════════════════════════════════════════════════════════════════
// REST CLIENT
// ═══════════════════════════════════════════════════════════════════

class GZMMapClient {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.baseUrl = GZM_CONFIG.API_URL;
    this.timeout = GZM_CONFIG.TIMEOUT;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        ...options,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`GZM Map API error ${response.status}: ${errorText}`);
      }

      return response.json() as Promise<T>;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // ─── MAP ENDPOINTS (api/map_endpoints.py) ───

  async getAOIs(): Promise<{ features: MapAOI[] }> {
    return this.request('/map/aois');
  }

  async getDarkVessels(): Promise<{ vessels: DarkVessel[] }> {
    return this.request('/map/vessels/dark');
  }

  async getDroneThreats(): Promise<{ threats: DroneSwarmThreat[] }> {
    return this.request('/map/drones/threats');
  }

  async getActiveFires(): Promise<{ fires: ActiveFire[] }> {
    return this.request('/map/fires/active');
  }

  async getPredictionsSummary(): Promise<PredictionSummary> {
    return this.request('/map/predictions/summary');
  }

  // ─── H3 CONVERGENCE (api/h3_convergence_endpoint.py) ───

  async getConvergenceHeatmap(
    resolution: number = 6,
    hours: number = 24
  ): Promise<H3ConvergenceCell[]> {
    return this.request(`/api/h3/convergence?resolution=${resolution}&hours=${hours}`);
  }

  // ─── ISR ENDPOINTS (api/isr_endpoints.py + api/isr_allocation_endpoint.py) ───

  async getISRAssets(): Promise<{ assets: ISRAsset[] }> {
    return this.request('/isr/assets');
  }

  async taskISR(request: ISRTaskRequest): Promise<ISRTaskResponse> {
    return this.request('/isr/task', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getISRMissions(): Promise<{ missions: Record<string, unknown>[] }> {
    return this.request('/isr/missions');
  }

  async allocateISR(convergence_signal_id: string): Promise<Record<string, unknown>> {
    return this.request('/isr/allocate', {
      method: 'POST',
      body: JSON.stringify({ signal_id: convergence_signal_id }),
    });
  }

  // ─── AOI DASHBOARD (api/app.py) ───

  async getAOIDashboard(): Promise<{ aois: Record<string, unknown>[] }> {
    return this.request('/aoi/dashboard');
  }

  // ─── PIPELINE STATS ───

  async getStats(): Promise<Record<string, unknown>> {
    return this.request('/stats');
  }
}

// ═══════════════════════════════════════════════════════════════════
// WEBSOCKET CLIENT
// ═══════════════════════════════════════════════════════════════════

export type MapWSCallback = (message: MapWebSocketMessage) => void;

class GZMMapWebSocket {
  private ws: ReconnectingWebSocket | null = null;
  private listeners: Set<MapWSCallback> = new Set();
  private _connected = false;

  get connected(): boolean {
    return this._connected;
  }

  connect(endpoint: '/ws/map' | '/ws/alerts' = '/ws/map'): void {
    if (this.ws) return;

    const url = `${GZM_CONFIG.WS_URL}${endpoint}`;
    this.ws = new ReconnectingWebSocket(url, [], {
      maxRetries: 20,
      reconnectionDelayGrowFactor: 1.5,
      maxReconnectionDelay: 30000,
      minReconnectionDelay: 1000,
    });

    this.ws.onopen = () => {
      this._connected = true;
      console.log(`[GZM-WS] Connected to ${endpoint}`);
    };

    this.ws.onclose = () => {
      this._connected = false;
      console.log(`[GZM-WS] Disconnected from ${endpoint}`);
    };

    this.ws.onmessage = (event) => {
      try {
        const message: MapWebSocketMessage = JSON.parse(event.data);
        this.listeners.forEach((cb) => cb(message));
      } catch {
        // Ignore malformed messages
      }
    };

    this.ws.onerror = () => {
      // ReconnectingWebSocket handles reconnection automatically
    };
  }

  subscribe(callback: MapWSCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
    this._connected = false;
    this.listeners.clear();
  }

  sendPing(): void {
    if (this.ws && this._connected) {
      this.ws.send('ping');
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// SINGLETON EXPORTS
// ═══════════════════════════════════════════════════════════════════

export const gzmMapApi = new GZMMapClient();
export const gzmMapWS = new GZMMapWebSocket();
export default gzmMapApi;
