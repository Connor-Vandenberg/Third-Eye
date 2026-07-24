'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { GZMWebSocket } from '@/lib/websocket';
import { useQueryClient } from '@tanstack/react-query';

interface WSContextValue {
  connected: boolean;
  lastMessage: unknown | null;
  subscribe: (fn: (data: unknown) => void) => () => void;
  alertCount: number;
}

const WSContext = createContext<WSContextValue>({
  connected: false,
  lastMessage: null,
  subscribe: () => () => {},
  alertCount: 0,
});

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const wsRef = useRef<GZMWebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<unknown | null>(null);
  const [alertCount, setAlertCount] = useState(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    const ws = new GZMWebSocket();
    wsRef.current = ws;

    const unsub = ws.subscribe((data: any) => {
      setLastMessage(data);
      setAlertCount((c) => c + 1);

      // Auto-invalidate relevant queries based on message type
      if (data?.type === 'convergence' || data?.type === 'detection') {
        queryClient.invalidateQueries({ queryKey: ['alerts'] });
        queryClient.invalidateQueries({ queryKey: ['entities'] });
      }
      if (data?.type === 'tasking' || data?.type === 'platform_status') {
        queryClient.invalidateQueries({ queryKey: ['platforms'] });
        queryClient.invalidateQueries({ queryKey: ['isr-requirements'] });
      }
    });

    // Check connection status
    const interval = setInterval(() => {
      setConnected(ws.connected);
    }, 1000);

    return () => {
      unsub();
      clearInterval(interval);
      ws.close();
    };
  }, [queryClient]);

  const subscribe = useCallback((fn: (data: unknown) => void) => {
    return wsRef.current?.subscribe(fn) || (() => {});
  }, []);

  return (
    <WSContext.Provider value={{ connected, lastMessage, subscribe, alertCount }}>
      {children}
    </WSContext.Provider>
  );
}

export function useWebSocket() {
  return useContext(WSContext);
}
