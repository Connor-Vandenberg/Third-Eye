'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { WS_URL, type SignalEvent } from '@/lib/gzm-client';

/**
 * Real-time WebSocket hook for GZM God's Eye signal streaming.
 * Maintains a ring buffer of the last N events for map rendering.
 * Auto-reconnects with exponential backoff.
 */

interface UseGzmWebSocketOptions {
  maxEvents?: number;
  autoConnect?: boolean;
  onSignal?: (signal: SignalEvent) => void;
  onAlert?: (signal: SignalEvent) => void;
}

interface WebSocketState {
  connected: boolean;
  events: SignalEvent[];
  alerts: SignalEvent[];
  signalsPerMinute: number;
  lastUpdate: string | null;
}

export function useGzmWebSocket(options: UseGzmWebSocketOptions = {}) {
  const { maxEvents = 10000, autoConnect = true, onSignal, onAlert } = options;

  const [state, setState] = useState<WebSocketState>({
    connected: false,
    events: [],
    alerts: [],
    signalsPerMinute: 0,
    lastUpdate: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const eventsRef = useRef<SignalEvent[]>([]);
  const alertsRef = useRef<SignalEvent[]>([]);
  const reconnectAttempt = useRef(0);
  const signalCount = useRef(0);
  const lastMinuteReset = useRef(Date.now());

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttempt.current = 0;
        setState(prev => ({ ...prev, connected: true }));
        console.log('[GZM-WS] Connected to God\'s Eye');
      };

      ws.onmessage = (event) => {
        try {
          const signal: SignalEvent = JSON.parse(event.data);

          // Update ring buffer
          eventsRef.current.push(signal);
          if (eventsRef.current.length > maxEvents) {
            eventsRef.current = eventsRef.current.slice(-maxEvents);
          }

          // Track alerts separately
          if (signal.type === 'alert') {
            alertsRef.current.push(signal);
            if (alertsRef.current.length > 100) {
              alertsRef.current = alertsRef.current.slice(-100);
            }
            onAlert?.(signal);
          }

          // Signal rate tracking
          signalCount.current++;
          const now = Date.now();
          if (now - lastMinuteReset.current >= 60000) {
            const rate = signalCount.current;
            signalCount.current = 0;
            lastMinuteReset.current = now;
            setState(prev => ({ ...prev, signalsPerMinute: rate }));
          }

          onSignal?.(signal);

          // Batch state updates (every 500ms max)
          setState(prev => ({
            ...prev,
            events: [...eventsRef.current],
            alerts: [...alertsRef.current],
            lastUpdate: signal.timestamp,
          }));
        } catch (err) {
          console.error('[GZM-WS] Parse error:', err);
        }
      };

      ws.onclose = () => {
        setState(prev => ({ ...prev, connected: false }));
        // Exponential backoff reconnect
        const delay = Math.min(1000 * 2 ** reconnectAttempt.current, 30000);
        reconnectAttempt.current++;
        console.log(`[GZM-WS] Reconnecting in ${delay}ms (attempt ${reconnectAttempt.current})`);
        setTimeout(connect, delay);
      };

      ws.onerror = (err) => {
        console.error('[GZM-WS] Error:', err);
        ws.close();
      };
    } catch (err) {
      console.error('[GZM-WS] Connection failed:', err);
    }
  }, [maxEvents, onSignal, onAlert]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  useEffect(() => {
    if (autoConnect) connect();
    return () => disconnect();
  }, [autoConnect, connect, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
  };
}
