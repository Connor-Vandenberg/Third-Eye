/**
 * GZM WebSocket Manager
 *
 * Reconnecting WebSocket with:
 * - Exponential backoff (1s → 2s → 4s → 8s → 16s max)
 * - Heartbeat/pong handling
 * - Event bus pattern (subscribe/unsubscribe)
 * - Connection state tracking
 * - Auto-reconnect on close/error
 * - Message type discrimination
 */

import { gzmApi } from './api';

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export interface WsAlert {
  type: 'alert';
  alert_id?: string;
  entity?: string;
  name?: string;
  severity?: string;
  convergence_score?: number;
  score?: number;
  country?: string;
  domain_count?: number;
  vertex_type?: string;
  created_at?: string;
}

export interface WsHeartbeat {
  type: 'heartbeat';
  active_alerts?: number;
  critical?: number;
  connections?: number;
}

export interface WsConnected {
  type: 'connected';
  message?: string;
}

export type WsMessage = WsAlert | WsHeartbeat | WsConnected | { type: string; [key: string]: unknown };

type Listener = (msg: WsMessage) => void;

class GZMWebSocket {
  private ws: WebSocket | null = null;
  private listeners: Set<Listener> = new Set();
  private reconnectAttempt = 0;
  private maxReconnectDelay = 16000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private _state: ConnectionState = 'disconnected';
  private intentionalClose = false;

  get state(): ConnectionState {
    return this._state;
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
      return;
    }

    this.intentionalClose = false;
    this._state = this.reconnectAttempt > 0 ? 'reconnecting' : 'connecting';
    this.notifyState();

    try {
      this.ws = new WebSocket(gzmApi.alertsWsUrl());

      this.ws.onopen = () => {
        this._state = 'connected';
        this.reconnectAttempt = 0;
        this.notifyState();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as WsMessage;
          this.listeners.forEach((fn) => fn(msg));
        } catch { /* ignore malformed messages */ }
      };

      this.ws.onclose = () => {
        this._state = 'disconnected';
        this.notifyState();
        if (!this.intentionalClose) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        // onclose will fire after this
      };
    } catch {
      this._state = 'disconnected';
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    this.intentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
    this._state = 'disconnected';
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private scheduleReconnect(): void {
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempt), this.maxReconnectDelay);
    this.reconnectAttempt++;
    this._state = 'reconnecting';

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private notifyState(): void {
    // Emit a synthetic state message so listeners can react to connection changes
    const stateMsg: WsMessage = { type: `_state_${this._state}` };
    this.listeners.forEach((fn) => fn(stateMsg));
  }
}

// Singleton instance
export const gzmWs = new GZMWebSocket();
export default gzmWs;
