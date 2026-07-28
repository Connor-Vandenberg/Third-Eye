'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import Map from 'react-map-gl/maplibre';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { useControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

import { useGzmWebSocket } from '@/hooks/useGzmWebSocket';
import { fetchConvergenceHeatmap, type H3Cell, type SignalEvent } from '@/lib/gzm-client';
import { createConvergenceHeatmapLayer, zoomToH3Resolution } from './layers/convergence-heatmap';
import { createIntLayer, INT_LAYER_CONFIGS, type IntDomain } from './layers/int-layers';
import { LayerTogglePanel } from './LayerTogglePanel';
import { ISRTaskPanel } from './ISRTaskPanel';
import { TacticalHUD } from './TacticalHUD';
import { AlertToast } from './AlertToast';

/**
 * GZM Intelligence Map
 * Main map component integrating all GZM visualization layers.
 *
 * Architecture:
 * - MapLibre GL JS as basemap (dark style)
 * - deck.gl layers via MapboxOverlay (interleaved mode)
 * - WebSocket for real-time signal streaming
 * - H3 convergence heatmap (the killer feature)
 * - 10-INT toggleable layers
 * - Click-to-task ISR panel
 * - Tactical HUD overlay
 */

// deck.gl overlay hook for react-map-gl
function DeckGLOverlay(props: any) {
  const overlay = useControl(() => new MapboxOverlay({ interleaved: true }));
  overlay.setProps(props);
  return null;
}

const DARK_BASEMAP = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const INITIAL_VIEW = {
  longitude: 35.0,
  latitude: 30.0,
  zoom: 3,
  pitch: 45,
  bearing: 0,
};

export function GzmIntelligenceMap() {
  // State
  const [viewState, setViewState] = useState(INITIAL_VIEW);
  const [activeLayers, setActiveLayers] = useState<Set<IntDomain>>(
    new Set(['OSINT', 'GEOINT', 'SIGINT', 'CYBER'] as IntDomain[])
  );
  const [convergenceData, setConvergenceData] = useState<H3Cell[]>([]);
  const [selectedCell, setSelectedCell] = useState<H3Cell | null>(null);
  const [showISRPanel, setShowISRPanel] = useState(false);
  const [alerts, setAlerts] = useState<SignalEvent[]>([]);

  // WebSocket connection
  const { connected, events, signalsPerMinute, lastUpdate } = useGzmWebSocket({
    maxEvents: 10000,
    onAlert: (signal) => {
      setAlerts(prev => [...prev.slice(-4), signal]);
      setTimeout(() => setAlerts(prev => prev.slice(1)), 8000);
    },
  });

  // Fetch convergence heatmap on zoom change
  useEffect(() => {
    const resolution = zoomToH3Resolution(viewState.zoom);
    fetchConvergenceHeatmap(resolution, 24)
      .then(setConvergenceData)
      .catch(() => {});
  }, [Math.floor(viewState.zoom)]);

  // Layer toggle handler
  const handleToggle = useCallback((domain: IntDomain) => {
    setActiveLayers(prev => {
      const next = new Set(prev);
      if (next.has(domain)) next.delete(domain);
      else next.add(domain);
      return next;
    });
  }, []);

  // Event counts per domain
  const eventCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const config of INT_LAYER_CONFIGS) {
      counts[config.domain] = events.filter(e => e.int_domain === config.domain).length;
    }
    return counts as Record<IntDomain, number>;
  }, [events]);

  // Convergence cell click
  const handleCellClick = useCallback((info: { object: H3Cell }) => {
    if (info.object) {
      setSelectedCell(info.object);
      setShowISRPanel(true);
    }
  }, []);

  // Build deck.gl layers
  const layers = useMemo(() => {
    const result: any[] = [];

    // H3 Convergence Heatmap (always on)
    result.push(
      createConvergenceHeatmapLayer({
        data: convergenceData,
        visible: true,
        onClick: handleCellClick,
      })
    );

    // 10-INT layers
    for (const config of INT_LAYER_CONFIGS) {
      result.push(
        createIntLayer(config.domain, events, activeLayers.has(config.domain))
      );
    }

    return result;
  }, [convergenceData, events, activeLayers, handleCellClick]);

  return (
    <div className="relative w-full h-screen bg-black">
      {/* Tactical HUD */}
      <TacticalHUD
        connected={connected}
        signalsPerMinute={signalsPerMinute}
        lastUpdate={lastUpdate}
      />

      {/* Map */}
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle={DARK_BASEMAP}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      >
        <DeckGLOverlay layers={layers} />
      </Map>

      {/* Layer Toggle Panel */}
      <LayerTogglePanel
        activeLayers={activeLayers}
        onToggle={handleToggle}
        eventCounts={eventCounts}
      />

      {/* ISR Task Panel */}
      {showISRPanel && (
        <ISRTaskPanel
          targetCell={selectedCell}
          onClose={() => {
            setShowISRPanel(false);
            setSelectedCell(null);
          }}
          onTaskComplete={(response) => {
            console.log('[GZM] ISR Task complete:', response);
          }}
        />
      )}

      {/* Alert Toasts */}
      <AlertToast alerts={alerts} />

      {/* Bottom Timeline Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 h-10 bg-black/90 backdrop-blur-sm border-t border-gray-800 flex items-center px-4 gap-4">
        <button className="text-gray-400 hover:text-white text-xs">▶</button>
        <div className="flex-1 h-1 bg-gray-800 rounded-full relative">
          <div className="absolute left-0 top-0 h-full w-1/3 bg-cyan-600 rounded-full" />
          <div className="absolute left-[33%] top-[-3px] w-2 h-2 bg-cyan-400 rounded-full border border-black" />
        </div>
        <span className="text-[10px] text-gray-500 font-mono">-24h</span>
        <span className="text-[10px] text-cyan-400 font-mono">NOW</span>
        <div className="flex gap-1">
          <button className="text-[9px] text-gray-500 hover:text-white px-1">1x</button>
          <button className="text-[9px] text-gray-500 hover:text-white px-1">10x</button>
          <button className="text-[9px] text-gray-500 hover:text-white px-1">100x</button>
        </div>
      </div>
    </div>
  );
}
