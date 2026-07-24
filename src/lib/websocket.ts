type MessageHandler = (data: unknown) => void;

export class GZMWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectDelay = 1000;
  private maxDelay = 16000;
  private listeners: Set<MessageHandler> = new Set();
  private shouldReconnect = true;

  constructor(url?: string) {
    this.url = url || (process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/alerts');
    this.connect();
  }

  private connect(): void {
    if (!this.shouldReconnect) return;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectDelay = 1000;
        console.log('[GZM-WS] Connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.listeners.forEach((fn) => fn(data));
        } catch (e) {
          console.warn('[GZM-WS] Failed to parse message:', e);
        }
      };

      this.ws.onclose = () => {
        console.log(`[GZM-WS] Disconnected. Reconnecting in ${this.reconnectDelay}ms`);
        setTimeout(() => this.connect(), this.reconnectDelay);
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxDelay);
      };

      this.ws.onerror = (error) => {
        console.error('[GZM-WS] Error:', error);
        this.ws?.close();
      };
    } catch (e) {
      console.error('[GZM-WS] Connection failed:', e);
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
      this.ws.send(JSON.stringify(data));
    }
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  close(): void {
    this.shouldReconnect = false;
    this.ws?.close();
  }
}
