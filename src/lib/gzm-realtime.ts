/**
 * GZM Real-Time Client — WebSocket connection for live updates.
 * 
 * Connects to the Python backend's /collab/ws endpoint for:
 * - Live signal broadcasts (new convergence detections)
 * - Presence awareness (who else is online)
 * - Shared cursors and entity selections
 * - Chat messages
 * - Alert broadcasts
 * - Threat board updates
 */

import { GZM_WS_URL } from './constants';

export type MessageHandler = (data: Record<string, unknown>) => void;

export interface RealtimeConfig {
  userId: string;
  displayName: string;
  role?: string;
  onSignal?: MessageHandler;
  onAlert?: MessageHandler;
  onPresence?: MessageHandler;
  onChat?: MessageHandler;
  onThreatBoard?: MessageHandler;
  onActivity?: MessageHandler;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

export class GZMRealtime {
  private ws: WebSocket | null = null;
  private config: RealtimeConfig;
  private reconnectAttempts = 0;
  private maxReconnects = 10;
  private reconnectDelay = 1000;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private handlers: Map<string, MessageHandler[]> = new Map();

  constructor(config: RealtimeConfig) {
    this.config = config;
  }

  connect(): void {
    const url = `${GZM_WS_URL}/collab/ws/${this.config.userId}?name=${encodeURIComponent(this.config.displayName)}&role=${this.config.role || 'analyst'}`;

    try {
      this.ws = new WebSocket(url);
    } catch (e) {
      console.warn('[GZM Realtime] WebSocket connection failed:', e);
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      console.log('[GZM Realtime] Connected');
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.config.onConnect?.();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.routeMessage(data);
      } catch (e) {
        console.warn('[GZM Realtime] Invalid message:', e);
      }
    };

    this.ws.onclose = () => {
      console.log('[GZM Realtime] Disconnected');
      this.stopHeartbeat();
      this.config.onDisconnect?.();
      this.scheduleReconnect();
    };

    this.ws.onerror = (error) => {
      console.warn('[GZM Realtime] Error:', error);
      this.config.onError?.(error);
    };
  }

  disconnect(): void {
    this.maxReconnects = 0; // Prevent reconnection
    this.stopHeartbeat();
    this.ws?.close();
    this.ws = null;
  }

  send(type: string, data: Record<string, unknown> = {}): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, ...data }));
    }
  }

  // ── Convenience methods ──

  moveCursor(lat: number, lng: number): void {
    this.send('cursor_move', { position: { lat, lng } });
  }

  selectEntity(entityId: string): void {
    this.send('entity_select', { entity_id: entityId });
  }

  sendChat(message: string): void {
    this.send('chat_message', { message });
  }

  addAnnotation(entityId: string, text: string, type: string = 'note'): void {
    this.send('annotation_add', { entity_id: entityId, text, annotation_type: type });
  }

  shareRegion(bounds: { north: number; south: number; east: number; west: number }, message?: string): void {
    this.send('region_share', { bounds, message });
  }

  // ── Event subscription ──

  on(type: string, handler: MessageHandler): void {
    if (!this.handlers.has(type)) this.handlers.set(type, []);
    this.handlers.get(type)!.push(handler);
  }

  off(type: string, handler: MessageHandler): void {
    const handlers = this.handlers.get(type);
    if (handlers) {
      this.handlers.set(type, handlers.filter(h => h !== handler));
    }
  }

  // ── Internal ──

  private routeMessage(data: Record<string, unknown>): void {
    const type = data.type as string;

    // Route to config handlers
    if (type === 'signal_fire') this.config.onSignal?.(data);
    else if (type === 'alert_broadcast') this.config.onAlert?.(data);
    else if (type?.startsWith('presence_')) this.config.onPresence?.(data);
    else if (type === 'chat_message') this.config.onChat?.(data);
    else if (type === 'threat_board_update') this.config.onThreatBoard?.(data);
    else if (type === 'activity') this.config.onActivity?.(data);

    // Route to dynamic handlers
    const handlers = this.handlers.get(type) || [];
    handlers.forEach(h => h(data));

    // Also emit to wildcard handlers
    const wildcardHandlers = this.handlers.get('*') || [];
    wildcardHandlers.forEach(h => h(data));
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.send('presence_heartbeat', {});
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnects) {
      console.warn('[GZM Realtime] Max reconnection attempts reached');
      return;
    }
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;
    console.log(`[GZM Realtime] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    setTimeout(() => this.connect(), delay);
  }
}
