'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { GZM_CONFIG } from './gzm-config';

interface RealtimeMessage {
  type: string;
  [key: string]: unknown;
}

interface UseRealtimeOptions {
  userId: string;
  displayName: string;
  role?: string;
  onSignal?: (signal: RealtimeMessage) => void;
  onAlert?: (alert: RealtimeMessage) => void;
  onPresenceChange?: (users: unknown[]) => void;
  onAnnotation?: (annotation: RealtimeMessage) => void;
  onChatMessage?: (message: RealtimeMessage) => void;
  autoReconnect?: boolean;
}

interface UseRealtimeReturn {
  isConnected: boolean;
  onlineUsers: unknown[];
  send: (message: RealtimeMessage) => void;
  moveCursor: (position: { lat: number; lng: number }) => void;
  selectEntity: (entityId: string) => void;
  sendChat: (message: string) => void;
  addAnnotation: (params: { entity_id?: string; text: string; type?: string }) => void;
  disconnect: () => void;
}

/**
 * Real-time collaboration and signal WebSocket hook.
 * 
 * Connects to the GZM backend WebSocket at /collab/ws/{userId}
 * Receives:
 * - Live convergence signals (signal_fire)
 * - Alert broadcasts (alert_broadcast) 
 * - Presence updates (presence_join/leave)
 * - Chat messages
 * - Annotation updates
 * - Threat board changes
 */
export function useRealtime(options: UseRealtimeOptions): UseRealtimeReturn {
  const { userId, displayName, role = 'analyst', onSignal, onAlert, onPresenceChange, onAnnotation, onChatMessage, autoReconnect = true } = options;
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<unknown[]>([]);

  const connect = useCallback(() => {
    const wsUrl = `${GZM_CONFIG.WS_URL}/collab/ws/${userId}?name=${encodeURIComponent(displayName)}&role=${role}`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log('[GZM] WebSocket connected');
        // Start heartbeat
        const heartbeat = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'presence_heartbeat' }));
          } else {
            clearInterval(heartbeat);
          }
        }, 30_000);
      };

      ws.onmessage = (event) => {
        try {
          const msg: RealtimeMessage = JSON.parse(event.data);
          
          switch (msg.type) {
            case 'state_sync':
              setOnlineUsers(msg.online_users as unknown[] || []);
              break;
            case 'presence_join':
            case 'presence_leave':
              // Refresh presence
              onPresenceChange?.(msg.online_users as unknown[] || onlineUsers);
              break;
            case 'signal_fire':
              onSignal?.(msg);
              break;
            case 'alert_broadcast':
              onAlert?.(msg);
              break;
            case 'annotation_add':
            case 'annotation_reply':
              onAnnotation?.(msg);
              break;
            case 'chat_message':
              onChatMessage?.(msg);
              break;
            case 'pong':
              // Server acknowledged heartbeat
              break;
          }
        } catch (e) {
          console.warn('[GZM] Failed to parse WS message:', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log('[GZM] WebSocket disconnected');
        if (autoReconnect) {
          reconnectTimer.current = setTimeout(connect, 3000);
        }
      };

      ws.onerror = (error) => {
        console.warn('[GZM] WebSocket error:', error);
      };
    } catch (e) {
      console.warn('[GZM] WebSocket connection failed:', e);
      if (autoReconnect) {
        reconnectTimer.current = setTimeout(connect, 5000);
      }
    }
  }, [userId, displayName, role, autoReconnect, onSignal, onAlert, onPresenceChange, onAnnotation, onChatMessage, onlineUsers]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((message: RealtimeMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const moveCursor = useCallback((position: { lat: number; lng: number }) => {
    send({ type: 'cursor_move', position });
  }, [send]);

  const selectEntity = useCallback((entityId: string) => {
    send({ type: 'entity_select', entity_id: entityId });
  }, [send]);

  const sendChat = useCallback((message: string) => {
    send({ type: 'chat_message', message });
  }, [send]);

  const addAnnotation = useCallback((params: { entity_id?: string; text: string; type?: string }) => {
    send({ type: 'annotation_add', ...params, annotation_type: params.type || 'note' });
  }, [send]);

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    wsRef.current?.close();
  }, []);

  return { isConnected, onlineUsers, send, moveCursor, selectEntity, sendChat, addAnnotation, disconnect };
}
