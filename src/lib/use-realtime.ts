'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { GZM_WS_URL } from './gzm-config';

export interface RealtimeSignal {
  type: string;
  signal?: Record<string, unknown>;
  alert?: Record<string, unknown>;
  timestamp: string;
}

export interface UseRealtimeOptions {
  userId?: string;
  displayName?: string;
  role?: string;
  onSignal?: (signal: RealtimeSignal) => void;
  onAlert?: (alert: RealtimeSignal) => void;
  onPresenceChange?: (users: Record<string, unknown>[]) => void;
  autoReconnect?: boolean;
}

export function useRealtime(options: UseRealtimeOptions = {}) {
  const {
    userId = `analyst_${Date.now()}`,
    displayName = 'Analyst',
    role = 'analyst',
    onSignal,
    onAlert,
    onPresenceChange,
    autoReconnect = true,
  } = options;

  const [connected, setConnected] = useState(false);
  const [signals, setSignals] = useState<RealtimeSignal[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, unknown>[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    const wsUrl = `${GZM_WS_URL}/collab/ws/${userId}?name=${encodeURIComponent(displayName)}&role=${role}`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        console.log('[GZM] WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as RealtimeSignal & { online_users?: Record<string, unknown>[]; type: string };
          
          if (data.type === 'signal_fire') {
            setSignals(prev => [data, ...prev].slice(0, 100));
            onSignal?.(data);
          } else if (data.type === 'alert_broadcast') {
            onAlert?.(data);
          } else if (data.type === 'state_sync' || data.type === 'presence_join' || data.type === 'presence_leave') {
            if (data.online_users) {
              setOnlineUsers(data.online_users);
              onPresenceChange?.(data.online_users);
            }
          }
        } catch (e) {
          console.warn('[GZM] Failed to parse WebSocket message:', e);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        console.log('[GZM] WebSocket disconnected');
        if (autoReconnect) {
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        }
      };

      ws.onerror = (error) => {
        console.warn('[GZM] WebSocket error:', error);
      };
    } catch (e) {
      console.warn('[GZM] WebSocket connection failed:', e);
      if (autoReconnect) {
        reconnectTimeoutRef.current = setTimeout(connect, 5000);
      }
    }
  }, [userId, displayName, role, onSignal, onAlert, onPresenceChange, autoReconnect]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const sendMessage = useCallback((type: string, data: Record<string, unknown> = {}) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, ...data }));
    }
  }, []);

  const sendCursorPosition = useCallback((lat: number, lng: number) => {
    sendMessage('cursor_move', { position: { lat, lng } });
  }, [sendMessage]);

  const selectEntity = useCallback((entityId: string) => {
    sendMessage('entity_select', { entity_id: entityId });
  }, [sendMessage]);

  const addAnnotation = useCallback((entityId: string, text: string, type = 'note') => {
    sendMessage('annotation_add', { entity_id: entityId, text, annotation_type: type });
  }, [sendMessage]);

  const sendChat = useCallback((message: string) => {
    sendMessage('chat_message', { message });
  }, [sendMessage]);

  return {
    connected,
    signals,
    onlineUsers,
    sendMessage,
    sendCursorPosition,
    selectEntity,
    addAnnotation,
    sendChat,
  };
}
