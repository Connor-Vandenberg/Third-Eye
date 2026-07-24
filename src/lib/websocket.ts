import { validateWSMessage } from './security';

type MessageHandler = (data: unknown) => void;

export class GZMWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectDelay = 1000;
  private maxDelay = 16000;
  private listeners: Set<MessageHandler> = new Set();
  private shouldReconnect = true;
  private messageCount = 0;
  private messageResetInterval: ReturnType<typeof setInterval> | null = null;
  private readonly MAX_MESSAGES_PER_SECOND = 50; // Prevent flood
  private readonly MAX_MESSAGE_SIZE = 65536; // 64KB

  constructor(url?: string) {
    this.url = url || (process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/alerts');

    // Validate URL before connecting
    if (!this.isValidWSUrl(this.url)) {
      console.error('[GZM-WS] Invalid WebSocket URL');
      return;
    }

    this.connect();

    // Reset message counter every second
    this.messageResetInterval = setInterval(() => {
      this.messageCount = 0;
    }, 1000);
  }

  private isValidWSUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ['ws:', 'wss:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  private connect(): void {
    if (!this.shouldReconnect) return;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectDelay = 1000;
        console.log('[GZM-WS] Connected securely');
      };

      this.ws.onmessage = (event) => {
        // Rate limit incoming messages
        this.messageCount++;
        if (this.messageCount > this.MAX_MESSAGES_PER_SECOND) {
          console.warn('[GZM-WS] Message flood detected, dropping messages');
          return;
        }

        // Size check
        if (typeof event.data === 'string' && event.data.length > this.MAX_MESSAGE_SIZE) {
          console.warn('[GZM-WS] Message exceeds size limit, dropping');
          return;
        }

        try {
          const data = JSON.parse(event.data);

          // Validate message structure and freshness
          if (!validateWSMessage(data)) {
            console.warn('[GZM-WS] Invalid message structure, dropping');
            return;
          }

          this.listeners.forEach((fn) => fn(data));
        } catch (e) {
          console.warn('[GZM-WS] Failed to parse message, dropping');
        }
      };

      this.ws.onclose = (event) => {
        // Don't reconnect on authentication failures
        if (event.code === 4001 || event.code === 4003) {
          console.error('[GZM-WS] Authentication failed, not reconnecting');
          this.shouldReconnect = false;
          return;
        }

        console.log(`[GZM-WS] Disconnected (${event.code}). Reconnecting in ${this.reconnectDelay}ms`);
        setTimeout(() => this.connect(), this.reconnectDelay);
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxDelay);
      };

      this.ws.onerror = () => {
        // Don't log the error object (may contain sensitive info)
        console.error('[GZM-WS] Connection error');
        this.ws?.close();
      };
    } catch (e) {
      console.error('[GZM-WS] Failed to create connection');
      setTimeout(() => this.connect(), this.reconnectDelay);
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxDelay);
    }
  }

  subscribe(fn: MessageHandler): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  send(data: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const serialized = JSON.stringify(data);
      // Don't send oversized messages
      if (serialized.length > this.MAX_MESSAGE_SIZE) {
        console.warn('[GZM-WS] Outgoing message too large, not sending');
        return;
      }
      this.ws.send(serialized);
    }
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  close(): void {
    this.shouldReconnect = false;
    if (this.messageResetInterval) clearInterval(this.messageResetInterval);
    this.ws?.close();
  }
}
