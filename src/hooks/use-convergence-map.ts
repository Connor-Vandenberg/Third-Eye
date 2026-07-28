/**
 * useConvergenceMap — React hook for H3 convergence data + ISR tasking.
 *
 * Orchestrates:
 * 1. Fetching H3 convergence heatmap from /api/h3/convergence
 * 2. Streaming live updates from /ws/map WebSocket
 * 3. ISR tasking workflow (select hex -> task asset -> confirm)
 * 4. Auto-resolution switching based on map zoom level
 *
 * Usage:
 *   const { cells, selectedHex, isrAssets, taskISR, wsConnected } = useConvergenceMap({
 *     enabled: activeLayers.convergence,
 *     zoom: currentZoom,
 *   });
 *
 * Connected to:
 *   - src/lib/gzm-map-client.ts (gzmMapApi, gzmMapWS)
 *   - src/components/convergence-h3-overlay.tsx
 *   - Backend: api/h3_convergence_endpoint.py
 *   - Backend: api/isr_endpoints.py
 *   - Backend: api/map_endpoints.py /ws/map
 *
 * Author: Connor Vandenberg
 * DARPA SBIR: DPA26BZ04-DV015 | CAGE: 22HU5
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  gzmMapApi,
  gzmMapWS,
  type H3ConvergenceCell,
  type ISRAsset,
  type ISRTaskRequest,
  type ISRTaskResponse,
  type MapWebSocketMessage,
} from '@/lib/gzm-map-client';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface UseConvergenceMapOptions {
  /** Whether convergence layer is enabled */
  enabled: boolean;
  /** Current map zoom level (drives H3 resolution selection) */
  zoom?: number;
  /** Hours of convergence data to fetch */
  hours?: number;
  /** Auto-refresh interval in ms (default: 60000 = 1min) */
  refreshInterval?: number;
}

interface UseConvergenceMapReturn {
  /** H3 convergence cells for rendering */
  cells: H3ConvergenceCell[];
  /** Currently selected/hovered hex */
  selectedHex: H3ConvergenceCell | null;
  /** Whether data is loading */
  loading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Whether WebSocket is connected */
  wsConnected: boolean;
  /** Available ISR assets for tasking */
  isrAssets: ISRAsset[];
  /** Last ISR task response */
  lastTask: ISRTaskResponse | null;
  /** Whether ISR tasking is in progress */
  tasking: boolean;
  /** Current H3 resolution being used */
  resolution: number;
  /** Total active signals across all cells */
  totalSignals: number;
  /** Count of critical (>0.8) cells */
  criticalCount: number;
  /** Count of high (>0.6) cells */
  highCount: number;

  // Actions
  /** Select a hex (from click) */
  selectHex: (cell: H3ConvergenceCell | null) => void;
  /** Task ISR collection to selected hex */
  taskISR: (priority?: 'critical' | 'high' | 'routine') => Promise<ISRTaskResponse | null>;
  /** Force refresh convergence data */
  refresh: () => Promise<void>;
  /** Fetch ISR assets */
  fetchAssets: () => Promise<void>;
}

// ═══════════════════════════════════════════════════════════════════
// RESOLUTION LOGIC
// ═══════════════════════════════════════════════════════════════════

/** Map zoom level to optimal H3 resolution for visual density. */
function zoomToResolution(zoom: number): number {
  if (zoom <= 2) return 2;
  if (zoom <= 3.5) return 3;
  if (zoom <= 5) return 4;
  if (zoom <= 7) return 5;
  if (zoom <= 9) return 6;
  if (zoom <= 11) return 7;
  if (zoom <= 13) return 8;
  return 9;
}

// ═══════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════

export function useConvergenceMap(options: UseConvergenceMapOptions): UseConvergenceMapReturn {
  const { enabled, zoom = 4, hours = 24, refreshInterval = 60000 } = options;

  const [cells, setCells] = useState<H3ConvergenceCell[]>([]);
  const [selectedHex, setSelectedHex] = useState<H3ConvergenceCell | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [isrAssets, setIsrAssets] = useState<ISRAsset[]>([]);
  const [lastTask, setLastTask] = useState<ISRTaskResponse | null>(null);
  const [tasking, setTasking] = useState(false);

  const resolution = zoomToResolution(zoom);
  const mountedRef = useRef(true);
  const lastResolutionRef = useRef(resolution);

  // ─── FETCH CONVERGENCE DATA ───
  const fetchConvergence = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);

    try {
      const data = await gzmMapApi.getConvergenceHeatmap(resolution, hours);
      if (mountedRef.current) {
        setCells(data);
        lastResolutionRef.current = resolution;
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Convergence fetch failed');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [enabled, resolution, hours]);

  // ─── FETCH ISR ASSETS ───
  const fetchAssets = useCallback(async () => {
    try {
      const { assets } = await gzmMapApi.getISRAssets();
      if (mountedRef.current) setIsrAssets(assets);
    } catch {
      // ISR assets are optional, don't surface error
    }
  }, []);

  // ─── TASK ISR ───
  const taskISR = useCallback(async (
    priority: 'critical' | 'high' | 'routine' = 'high'
  ): Promise<ISRTaskResponse | null> => {
    if (!selectedHex) return null;
    setTasking(true);

    try {
      const request: ISRTaskRequest = {
        target_lat: selectedHex.lat,
        target_lng: selectedHex.lng,
        target_h3: selectedHex.hex,
        priority,
        collection_type: [selectedHex.top_int],
        duration_hours: priority === 'critical' ? 4 : priority === 'high' ? 8 : 12,
        requester: 'third-eye-cop',
      };

      const response = await gzmMapApi.taskISR(request);
      if (mountedRef.current) {
        setLastTask(response);
      }
      return response;
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'ISR tasking failed');
      }
      return null;
    } finally {
      if (mountedRef.current) setTasking(false);
    }
  }, [selectedHex]);

  // ─── INITIAL FETCH ───
  useEffect(() => {
    mountedRef.current = true;
    if (enabled) {
      fetchConvergence();
      fetchAssets();
    }
    return () => { mountedRef.current = false; };
  }, [enabled, fetchConvergence, fetchAssets]);

  // ─── RE-FETCH ON RESOLUTION CHANGE (zoom change) ───
  useEffect(() => {
    if (enabled && resolution !== lastResolutionRef.current) {
      fetchConvergence();
    }
  }, [enabled, resolution, fetchConvergence]);

  // ─── AUTO-REFRESH ───
  useEffect(() => {
    if (!enabled || refreshInterval <= 0) return;
    const interval = setInterval(fetchConvergence, refreshInterval);
    return () => clearInterval(interval);
  }, [enabled, refreshInterval, fetchConvergence]);

  // ─── WEBSOCKET ───
  useEffect(() => {
    if (!enabled) return;

    gzmMapWS.connect('/ws/map');

    const unsubscribe = gzmMapWS.subscribe((msg: MapWebSocketMessage) => {
      if (msg.type === 'connected') {
        setWsConnected(true);
        return;
      }

      // Full refresh on convergence file update
      if (
        msg.type === 'data_update' &&
        msg.payload?.file?.includes('convergence')
      ) {
        fetchConvergence();
        return;
      }

      // Incremental update on individual signal
      if (msg.type === 'signal' && msg.payload?.lat != null && msg.payload?.lng != null) {
        setCells(prev => {
          if (prev.length === 0) return prev;
          const { lat, lng, convergence_score } = msg.payload!;
          let closestIdx = 0;
          let closestDist = Infinity;
          for (let i = 0; i < prev.length; i++) {
            const d = Math.hypot(prev[i].lat - lat!, prev[i].lng - lng!);
            if (d < closestDist) { closestDist = d; closestIdx = i; }
          }
          // Only update if within reasonable proximity
          if (closestDist > 3) return prev;
          const updated = [...prev];
          updated[closestIdx] = {
            ...updated[closestIdx],
            score: Math.min(1, updated[closestIdx].score + (convergence_score || 0.005)),
            signals: updated[closestIdx].signals + 1,
          };
          return updated;
        });
      }
    });

    // Ping every 30s to keep connection alive
    const pingInterval = setInterval(() => gzmMapWS.sendPing(), 30000);

    return () => {
      unsubscribe();
      clearInterval(pingInterval);
    };
  }, [enabled, fetchConvergence]);

  // ─── COMPUTED STATS ───
  const totalSignals = cells.reduce((sum, c) => sum + c.signals, 0);
  const criticalCount = cells.filter(c => c.score >= 0.8).length;
  const highCount = cells.filter(c => c.score >= 0.6 && c.score < 0.8).length;

  return {
    cells,
    selectedHex,
    loading,
    error,
    wsConnected,
    isrAssets,
    lastTask,
    tasking,
    resolution,
    totalSignals,
    criticalCount,
    highCount,
    selectHex: setSelectedHex,
    taskISR,
    refresh: fetchConvergence,
    fetchAssets,
  };
}

export default useConvergenceMap;
