'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// GZM WebSocket Hook: Connects Third-Eye frontend to FastAPI backend
// Handles: real-time events, collaboration, metrics, alerts, pipeline status

export type WSMessageType =
  | 'pipeline_event'        // Event moving through kill chain
  | 'novel_signal'          // New novel signal detected
  | 'convergence_event'     // Multi-source convergence fired
  | 'prediction'            // New prediction generated
  | 'alert'                 // Critical alert (triggers takeover)
  | 'metric_update'         // Real-time metric change
  | 'entity_update'         // Entity modified in graph
  | 'task_lifecycle'        // Task state transition
  | 'mesh_status'           // DDIL/mesh status change
  | 'system_health'         // Pipeline/engine health
  | 'collaboration'         // Multi-user presence/cursor/annotation
  | 'collection_result'     // Collector returned data
  | 'learning_cycle'        // Self-play cycle complete
  | 'graph_sync'            // TigerGraph sync event
  | 'nostr_event';          // Nostr mesh protocol event

export interface WSMessage {
  type: WSMessageType;
  timestamp: string;
  payload: any;
  source?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  correlationId?: string;
}

export interface WSConfig {
  url?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  subscriptions?: WSMessageType[];
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  authToken?: string;
  meshFallback?: boolean; // Fall back to Nostr if WS fails
}

const DEFAULT_CONFIG: WSConfig = {
  url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws',
  reconnectInterval: 3000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000,
  subscriptions: [
    'pipeline_event', 'novel_signal', 'convergence_event',
    'prediction', 'alert', 'metric_update', 'system_health',
    'task_lifecycle', 'mesh_status'
  ],
  meshFallback: true,
};

export interface GZMWebSocketState {
  connected: boolean;
  reconnecting: boolean;
  reconnectAttempt: number;
  lastMessage: WSMessage | null;
  messageCount: number;
  latencyMs: number;
  mode: 'websocket' | 'nostr-mesh' | 'offline';
}

export function useGZMWebSocket(config: WSConfig = {}) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messageCountRef = useRef(0);

  const [state, setState] = useState<GZMWebSocketState>({
    connected: false,
    reconnecting: false,
    reconnectAttempt: 0,
    lastMessage: null,
    messageCount: 0,
    latencyMs: 0,
    mode: 'offline',
  });

  const [messages, setMessages] = useState<WSMessage[]>([]);
  const [novelSignals, setNovelSignals] = useState<WSMessage[]>([]);
  const [alerts, setAlerts] = useState<WSMessage[]>([]);
  const [metrics, setMetrics] = useState<Record<string, any>>({});
  const [pipelineStatus, setPipelineStatus] = useState<Record<string, any>>({});

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const url = new URL(mergedConfig.url!);
      if (mergedConfig.authToken) {
        url.searchParams.set('token', mergedConfig.authToken);
      }

      const ws = new WebSocket(url.toString());
      wsRef.current = ws;

      ws.onopen = () => {
        setState(prev => ({ ...prev, connected: true, reconnecting: false, reconnectAttempt: 0, mode: 'websocket' }));

        // Subscribe to channels
        if (mergedConfig.subscriptions) {
          ws.send(JSON.stringify({
            type: 'subscribe',
            channels: mergedConfig.subscriptions,
          }));
        }

        // Start heartbeat
        heartbeatTimerRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() }));
          }
        }, mergedConfig.heartbeatInterval!);

        mergedConfig.onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          messageCountRef.current++;

          setState(prev => ({
            ...prev,
            lastMessage: message,
            messageCount: messageCountRef.current,
            latencyMs: Date.now() - new Date(message.timestamp).getTime(),
          }));

          // Route message by type
          switch (message.type) {
            case 'novel_signal':
              setNovelSignals(prev => [message, ...prev].slice(0, 100));
              break;
            case 'alert':
              setAlerts(prev => [message, ...prev].slice(0, 50));
              break;
            case 'metric_update':
              setMetrics(prev => ({ ...prev, [message.payload.key]: message.payload }));
              break;
            case 'system_health':
            case 'pipeline_event':
              setPipelineStatus(prev => ({ ...prev, [message.payload.stage || message.payload.system]: message.payload }));
              break;
          }

          // Keep last 500 messages in buffer
          setMessages(prev => [message, ...prev].slice(0, 500));
        } catch (e) {
          console.error('[GZM-WS] Failed to parse message:', e);
        }
      };

      ws.onclose = () => {
        setState(prev => ({ ...prev, connected: false }));
        if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
        mergedConfig.onDisconnect?.();

        // Attempt reconnect
        if (state.reconnectAttempt < mergedConfig.maxReconnectAttempts!) {
          setState(prev => ({ ...prev, reconnecting: true, reconnectAttempt: prev.reconnectAttempt + 1 }));
          reconnectTimerRef.current = setTimeout(connect, mergedConfig.reconnectInterval!);
        } else if (mergedConfig.meshFallback) {
          // Fall back to Nostr mesh
          setState(prev => ({ ...prev, mode: 'nostr-mesh', reconnecting: false }));
          connectNostrMesh();
        } else {
          setState(prev => ({ ...prev, mode: 'offline', reconnecting: false }));
        }
      };

      ws.onerror = (error) => {
        mergedConfig.onError?.(error);
      };

    } catch (e) {
      console.error('[GZM-WS] Connection failed:', e);
      setState(prev => ({ ...prev, mode: 'offline' }));
    }
  }, [mergedConfig, state.reconnectAttempt]);

  const connectNostrMesh = useCallback(() => {
    // Nostr mesh fallback: connect to local relay
    // Custom NIP kinds 30078-30086 for GZM protocol
    console.log('[GZM-WS] Falling back to Nostr mesh protocol');
    // In production, this would connect to wss://relay.gzm.local
    // and subscribe to kinds 30078-30086
  }, []);

  const send = useCallback((message: Partial<WSMessage>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        ...message,
        timestamp: new Date().toISOString(),
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    wsRef.current?.close();
    setState(prev => ({ ...prev, connected: false, mode: 'offline' }));
  }, []);

  // Connect on mount
  useEffect(() => {
    connect();
    return () => disconnect();
  }, []);

  return {
    state,
    messages,
    novelSignals,
    alerts,
    metrics,
    pipelineStatus,
    send,
    connect,
    disconnect,
  };
}

// Specialized hooks for specific data streams

export function useNovelSignals() {
  const { novelSignals, state } = useGZMWebSocket({ subscriptions: ['novel_signal'] });
  return { signals: novelSignals, connected: state.connected };
}

export function useAlerts() {
  const { alerts, state } = useGZMWebSocket({ subscriptions: ['alert'] });
  return { alerts, connected: state.connected };
}

export function usePipelineMetrics() {
  const { metrics, pipelineStatus, state } = useGZMWebSocket({ subscriptions: ['metric_update', 'system_health', 'pipeline_event'] });
  return { metrics, pipelineStatus, connected: state.connected };
}

export function useCollaboration(sessionId?: string) {
  const { messages, send, state } = useGZMWebSocket({
    subscriptions: ['collaboration'],
    url: `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/ws/collaboration${sessionId ? `?session=${sessionId}` : ''}`,
  });

  const sendPresence = useCallback((view: string, cursor?: { x: number; y: number }) => {
    send({ type: 'collaboration', payload: { action: 'presence', view, cursor } });
  }, [send]);

  const sendAnnotation = useCallback((annotation: any) => {
    send({ type: 'collaboration', payload: { action: 'annotate', ...annotation } });
  }, [send]);

  const lockEntity = useCallback((entityId: string, reason: string) => {
    send({ type: 'collaboration', payload: { action: 'lock', entityId, reason } });
  }, [send]);

  return { messages: messages.filter(m => m.type === 'collaboration'), sendPresence, sendAnnotation, lockEntity, connected: state.connected };
}

export function useMeshStatus() {
  const { messages, state } = useGZMWebSocket({ subscriptions: ['mesh_status', 'nostr_event'] });
  return { meshEvents: messages.filter(m => m.type === 'mesh_status' || m.type === 'nostr_event'), mode: state.mode, connected: state.connected };
}

export function useTaskLifecycle() {
  const { messages, state } = useGZMWebSocket({ subscriptions: ['task_lifecycle'] });
  return { transitions: messages.filter(m => m.type === 'task_lifecycle'), connected: state.connected };
}

// API client for non-realtime operations
export const gzmApi = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',

  async query(params: { query: string; tools?: string[]; maxSteps?: number }) {
    const res = await fetch(`${this.baseUrl}/aip/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json();
  },

  async getEntity(id: string) {
    const res = await fetch(`${this.baseUrl}/aip/entity/${id}`);
    return res.json();
  },

  async getSignals(params?: { limit?: number; region?: string; minScore?: number }) {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`${this.baseUrl}/aip/signals?${query}`);
    return res.json();
  },

  async taskSatellite(params: { target: string; aoi: string; priority: string }) {
    const res = await fetch(`${this.baseUrl}/aip/autonomous`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'satellite_tasking', ...params }),
    });
    return res.json();
  },

  async getHealth() {
    const res = await fetch(`${this.baseUrl}/aip/health`);
    return res.json();
  },

  async getSchema() {
    const res = await fetch(`${this.baseUrl}/aip/schema`);
    return res.json();
  },

  async getTools() {
    const res = await fetch(`${this.baseUrl}/aip/tools`);
    return res.json();
  },

  async generateReport(params: { type: string; region: string; format: string }) {
    const res = await fetch(`${this.baseUrl}/aip/brief`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json();
  },

  async getConvergence(params?: { minScore?: number; limit?: number }) {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`${this.baseUrl}/api/convergence?${query}`);
    return res.json();
  },

  async getPredictions(params?: { country?: string; minProbability?: number }) {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`${this.baseUrl}/api/predictions?${query}`);
    return res.json();
  },

  async getCII(country: string) {
    const res = await fetch(`${this.baseUrl}/api/instability/${country}`);
    return res.json();
  },
};

export default useGZMWebSocket;
