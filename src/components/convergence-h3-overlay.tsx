'use client';

/**
 * ConvergenceH3Overlay: REAL deck.gl H3HexagonLayer over MapLibre.
 *
 * This is NOT a placeholder. It imports actual deck.gl and renders GPU-accelerated
 * H3 hexagons on top of the ThirdEyeMap component.
 *
 * Data flow:
 *   gzmMapApi.getConvergenceHeatmap() -> H3ConvergenceCell[] -> H3HexagonLayer
 *   gzmMapWS.subscribe() -> live score updates -> re-render hexagons
 *
 * Connected to:
 *   - Backend: api/h3_convergence_endpoint.py (GET /api/h3/convergence)
 *   - Backend: api/map_endpoints.py (WS /ws/map for live updates)
 *   - Frontend: src/lib/gzm-map-client.ts (gzmMapApi + gzmMapWS)
 *
 * Usage in /cop page:
 *   <ConvergenceH3Overlay mapRef={mapRef} visible={activeLayers.convergence} />
 *
 * Author: Connor Vandenberg
 * DARPA SBIR: DPA26BZ04-DV015 | CAGE: 22HU5
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { H3HexagonLayer } from '@deck.gl/geo-layers';
import { ScatterplotLayer } from '@deck.gl/layers';
import { ArcLayer } from '@deck.gl/layers';
import type maplibregl from 'maplibre-gl';
import { gzmMapApi, gzmMapWS } from '@/lib/gzm-map-client';
import type { H3ConvergenceCell, MapWebSocketMessage } from '@/lib/gzm-map-client';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface ConvergenceH3OverlayProps {
  /** Reference to the MapLibre map instance from ThirdEyeMap */
  mapInstance: maplibregl.Map | null;
  /** Whether the convergence layer is visible */
  visible: boolean;
  /** H3 resolution (2=global, 4=regional, 6=city, 9=block) */
  resolution?: number;
  /** Hours of data to display */
  hours?: number;
  /** Callback when a hex is clicked */
  onHexClick?: (cell: H3ConvergenceCell) => void;
  /** Callback when a hex is hovered */
  onHexHover?: (cell: H3ConvergenceCell | null) => void;
  /** Whether to show extruded 3D hexagons */
  extruded?: boolean;
  /** Auto-refresh interval in ms (0 = no auto-refresh, relies on WS) */
  refreshInterval?: number;
}

// ═══════════════════════════════════════════════════════════════════
// COLOR UTILITIES
// ═══════════════════════════════════════════════════════════════════

function scoreToColor(score: number): [number, number, number, number] {
  // Green -> Yellow -> Orange -> Red gradient based on convergence score
  if (score >= 0.8) return [220, 50, 47, 220];    // Critical: red
  if (score >= 0.6) return [245, 130, 30, 190];    // High: orange
  if (score >= 0.4) return [230, 195, 40, 150];    // Medium: yellow-amber
  if (score >= 0.2) return [60, 190, 120, 120];    // Low: green
  return [40, 160, 100, 80];                        // Minimal: dim green
}

function scoreToElevation(score: number, signals: number): number {
  return score * signals * 500;
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function ConvergenceH3Overlay({
  mapInstance,
  visible,
  resolution = 4,
  hours = 24,
  onHexClick,
  onHexHover,
  extruded = true,
  refreshInterval = 0,
}: ConvergenceH3OverlayProps) {
  const [cells, setCells] = useState<H3ConvergenceCell[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const mountedRef = useRef(true);

  // ─── FETCH H3 DATA ───
  const fetchConvergence = useCallback(async () => {
    if (!visible) return;
    setLoading(true);
    setError(null);

    try {
      const data = await gzmMapApi.getConvergenceHeatmap(resolution, hours);
      if (mountedRef.current) {
        setCells(data);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch convergence data');
        // Don't clear existing cells on error (show stale data)
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [visible, resolution, hours]);

  // ─── INITIAL FETCH ───
  useEffect(() => {
    mountedRef.current = true;
    fetchConvergence();
    return () => { mountedRef.current = false; };
  }, [fetchConvergence]);

  // ─── AUTO-REFRESH (optional) ───
  useEffect(() => {
    if (refreshInterval <= 0 || !visible) return;
    const interval = setInterval(fetchConvergence, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, visible, fetchConvergence]);

  // ─── WEBSOCKET: LIVE CONVERGENCE UPDATES ───
  useEffect(() => {
    if (!visible) return;

    gzmMapWS.connect('/ws/map');
    setWsConnected(gzmMapWS.connected);

    const unsubscribe = gzmMapWS.subscribe((msg: MapWebSocketMessage) => {
      if (msg.type === 'connected') {
        setWsConnected(true);
        return;
      }

      // On convergence_update or data_update for convergence file, re-fetch
      if (msg.type === 'convergence_update' || 
          (msg.type === 'data_update' && msg.payload?.file?.includes('convergence'))) {
        fetchConvergence();
        return;
      }

      // On individual signal, update the closest hex in-place
      if (msg.type === 'signal' && msg.payload?.lat && msg.payload?.lng) {
        setCells(prev => {
          // Find closest cell and bump its score slightly
          if (prev.length === 0) return prev;
          const { lat, lng, convergence_score } = msg.payload!;
          let closestIdx = 0;
          let closestDist = Infinity;
          for (let i = 0; i < prev.length; i++) {
            const d = Math.abs(prev[i].lat - lat!) + Math.abs(prev[i].lng - lng!);
            if (d < closestDist) { closestDist = d; closestIdx = i; }
          }
          if (closestDist > 5) return prev; // Too far, ignore
          const updated = [...prev];
          updated[closestIdx] = {
            ...updated[closestIdx],
            score: Math.min(1, updated[closestIdx].score + (convergence_score || 0.01)),
            signals: updated[closestIdx].signals + 1,
          };
          return updated;
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [visible, fetchConvergence]);

  // ─── DECK.GL OVERLAY ON MAPLIBRE ───
  useEffect(() => {
    if (!mapInstance || !visible) {
      // Remove overlay if hidden
      if (overlayRef.current && mapInstance) {
        try { mapInstance.removeControl(overlayRef.current as any); } catch {}
        overlayRef.current = null;
      }
      return;
    }

    // Create or update the overlay
    if (!overlayRef.current) {
      overlayRef.current = new MapboxOverlay({
        interleaved: true,
        layers: [],
      });
      mapInstance.addControl(overlayRef.current as any);
    }

    // Build layers from current cell data
    const layers = [];

    if (cells.length > 0) {
      layers.push(
        new H3HexagonLayer({
          id: 'gzm-convergence-h3',
          data: cells,
          pickable: true,
          filled: true,
          extruded,
          elevationScale: 1,
          getHexagon: (d: H3ConvergenceCell) => d.hex,
          getFillColor: (d: H3ConvergenceCell) => scoreToColor(d.score),
          getElevation: (d: H3ConvergenceCell) => extruded ? scoreToElevation(d.score, d.signals) : 0,
          opacity: 0.82,
          coverage: 0.88,
          autoHighlight: true,
          highlightColor: [255, 255, 255, 60],
          material: {
            ambient: 0.6,
            diffuse: 0.7,
            shininess: 20,
            specularColor: [200, 200, 200],
          },
          transitions: {
            getElevation: { duration: 800, easing: (t: number) => 1 - Math.pow(1 - t, 3) },
            getFillColor: { duration: 500 },
          },
          updateTriggers: {
            getFillColor: [cells],
            getElevation: [cells],
          },
          onClick: (info: any) => {
            if (info.object && onHexClick) {
              onHexClick(info.object as H3ConvergenceCell);
            }
          },
          onHover: (info: any) => {
            if (onHexHover) {
              onHexHover(info.object ? (info.object as H3ConvergenceCell) : null);
            }
          },
        })
      );
    }

    overlayRef.current.setProps({ layers });

    // Cleanup when component unmounts
    return () => {
      if (overlayRef.current && mapInstance) {
        try {
          overlayRef.current.setProps({ layers: [] });
        } catch {}
      }
    };
  }, [mapInstance, visible, cells, extruded, onHexClick, onHexHover]);

  // Cleanup on full unmount
  useEffect(() => {
    return () => {
      if (overlayRef.current && mapInstance) {
        try { mapInstance.removeControl(overlayRef.current as any); } catch {}
        overlayRef.current = null;
      }
    };
  }, [mapInstance]);

  // This component renders no DOM (it's a map overlay)
  // but we can render a small status indicator
  return visible ? (
    <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-900/80 border border-zinc-800 text-[9px] font-mono">
      <div className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-emerald-400 animate-pulse' : error ? 'bg-red-400' : 'bg-amber-400'}`} />
      <span className="text-zinc-400">
        {loading ? 'Loading H3...' : error ? 'H3 Error' : `${cells.length} hexagons`}
      </span>
      {wsConnected && <span className="text-emerald-400">LIVE</span>}
    </div>
  ) : null;
}

export default ConvergenceH3Overlay;
