'use client';

import { QueryProvider } from './query-provider';
import { WebSocketProvider } from './websocket-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <WebSocketProvider>
        {children}
      </WebSocketProvider>
    </QueryProvider>
  );
}
