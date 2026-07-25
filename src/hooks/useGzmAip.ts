'use client';

/**
 * React hook for interacting with the GZM AIP backend.
 * Provides query, signals, briefing, and real-time connection.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  queryIntelligence,
  generateBrief,
  getSignals,
  getHealth,
  GZMRealtimeConnection,
  type AIPQueryResponse,
  type SignalResponse,
  type IntelligenceBrief,
  type HealthStatus,
} from '@/lib/gzm-aip-client';

export interface UseGzmAipOptions {
  autoConnect?: boolean;
  userId?: string;
  displayName?: string;
}

export function useGzmAip(options: UseGzmAipOptions = {}) {
  const [isQuerying, setIsQuerying] = useState(false);
  const [lastResponse, setLastResponse] = useState<AIPQueryResponse | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [signals, setSignals] = useState<SignalResponse | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const realtimeRef = useRef<GZMRealtimeConnection | null>(null);

  // Real-time WebSocket connection
  useEffect(() => {
    if (options.autoConnect && options.userId) {
      const conn = new GZMRealtimeConnection(
        options.userId,
        options.displayName || options.userId
      );
      conn.on('connected', () => setIsConnected(true));
      conn.on('disconnected', () => setIsConnected(false));
      conn.on('signal_fire', (data) => {
        // Auto-refresh signals when new ones arrive
        refreshSignals();
      });
      conn.connect();
      realtimeRef.current = conn;

      return () => {
        conn.disconnect();
        realtimeRef.current = null;
      };
    }
  }, [options.autoConnect, options.userId, options.displayName]);

  const query = useCallback(async (text: string, context?: Record<string, unknown>): Promise<AIPQueryResponse | null> => {
    setIsQuerying(true);
    setLastError(null);
    try {
      const response = await queryIntelligence({
        query: text,
        context,
        include_raw: false,
      });
      setLastResponse(response);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Query failed';
      setLastError(message);
      return null;
    } finally {
      setIsQuerying(false);
    }
  }, []);

  const getBriefing = useCallback(async (region?: string): Promise<IntelligenceBrief | null> => {
    setIsQuerying(true);
    setLastError(null);
    try {
      return await generateBrief(region);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Briefing generation failed';
      setLastError(message);
      return null;
    } finally {
      setIsQuerying(false);
    }
  }, []);

  const refreshSignals = useCallback(async () => {
    try {
      const data = await getSignals({ min_severity: 0.4, hours_back: 24 });
      setSignals(data);
    } catch (err) {
      console.warn('Failed to refresh signals:', err);
    }
  }, []);

  const checkHealth = useCallback(async () => {
    try {
      const data = await getHealth();
      setHealth(data);
      return data;
    } catch (err) {
      console.warn('Health check failed:', err);
      return null;
    }
  }, []);

  return {
    // State
    isQuerying,
    lastResponse,
    lastError,
    signals,
    health,
    isConnected,
    // Actions
    query,
    getBriefing,
    refreshSignals,
    checkHealth,
    // Real-time
    realtime: realtimeRef.current,
  };
}
