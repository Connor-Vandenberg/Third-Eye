'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers, Eye, EyeOff, Globe, Zap, Target, Radio,
  Satellite, Anchor, Plane, Shield, Activity, Clock,
  Filter, Maximize2, Play, Pause, ChevronRight
} from 'lucide-react';

// deck.gl GPU-Accelerated Intelligence Map
// Handles 1M+ points at 60fps via WebGL2
// Replaces CSS-positioned div approach on /globe and /cop

// NOTE: In production, import from deck.gl packages:
// import DeckGL from '@deck.gl/react';
// import { ScatterplotLayer, ArcLayer, IconLayer, HeatmapLayer, H3HexagonLayer } from '@deck.gl/layers';
// import { TripsLayer } from '@deck.gl/geo-layers';
// import { DataFilterExtension } from '@deck.gl/extensions';
// import { Map } from 'react-map-gl/maplibre';

// This file provides the component architecture that wraps deck.gl
// Install: npm install deck.gl @deck.gl/react @deck.gl/layers @deck.gl/geo-layers @deck.gl/aggregation-layers @deck.gl/extensions react-map-gl maplibre-gl

export interface IntelMapEvent {
  id: string;
  position: [number, number]; // [lng, lat]
  timestamp: number;
  type: string;
  severity: number;
  convergenceScore: number;
  domain: string;
  label: string;
  decayRate?: number;
  entities?: string[];
}

export interface IntelMapTrack {
  id: string;
  path: Array<{ coordinates: [number, number]; timestamp: number }>;
  type: 'vessel' | 'aircraft' | 'vehicle' | 'person';
  affiliation: 'friendly' | 'hostile' | 'neutral' | 'unknown';
  label: string;
  speed?: number;
  heading?: number;
}

export interface IntelMapArc {
  id: string;
  source: [number, number];
  target: [number, number];
  type: string;
  weight: number;
  color?: [number, number, number, number];
  label?: string;
}

export interface IntelMapHexagon {
  h3Index: string;
  value: number;
  domain: string;
}

export interface LayerConfig {
  id: string;
  name: string;
  type: 'scatter' | 'arc' | 'heatmap' | 'hexagon' | 'trips' | 'icon';
  visible: boolean;
  opacity: number;
  data: any[];
  color?: string;
  icon?: any;
}

export interface DeckGLIntelMapProps {
  events: IntelMapEvent[];
  tracks: IntelMapTrack[];
  arcs: IntelMapArc[];
  hexagons?: IntelMapHexagon[];
  layers: LayerConfig[];
  onLayerToggle: (layerId: string) => void;
  onEventClick: (event: IntelMapEvent) => void;
  onEventHover: (event: IntelMapEvent | null) => void;
  currentTime: number;
  timeRange: [number, number];
  isPlaying: boolean;
  viewState?: any;
  onViewStateChange?: (viewState: any) => void;
  showHeatmap?: boolean;
  showTracks?: boolean;
  showArcs?: boolean;
  className?: string;
}

// Color scales for different data types
const SEVERITY_COLOR_SCALE = [
  [52, 211, 153, 180],   // low: emerald
  [251, 191, 36, 200],   // medium: amber
  [249, 115, 22, 220],   // high: orange
  [239, 68, 68, 255],    // critical: red
];

const DOMAIN_COLORS: Record<string, [number, number, number, number]> = {
  OSINT: [59, 130, 246, 200],
  SIGINT: [139, 92, 246, 200],
  GEOINT: [16, 185, 129, 200],
  CYBER: [239, 68, 68, 200],
  FININT: [6, 182, 212, 200],
  HUMINT: [245, 158, 11, 200],
  MASINT: [236, 72, 153, 200],
  ELINT: [168, 85, 247, 200],
  IMINT: [20, 184, 166, 200],
  INFOPS: [249, 115, 22, 200],
};

const AFFILIATION_COLORS: Record<string, [number, number, number, number]> = {
  friendly: [128, 224, 255, 200],
  hostile: [255, 128, 128, 240],
  neutral: [170, 255, 170, 180],
  unknown: [255, 255, 128, 160],
};

function getSeverityColor(severity: number): [number, number, number, number] {
  if (severity >= 0.8) return SEVERITY_COLOR_SCALE[3] as [number, number, number, number];
  if (severity >= 0.6) return SEVERITY_COLOR_SCALE[2] as [number, number, number, number];
  if (severity >= 0.4) return SEVERITY_COLOR_SCALE[1] as [number, number, number, number];
  return SEVERITY_COLOR_SCALE[0] as [number, number, number, number];
}

// Layer configuration generator for deck.gl
// In production, these return actual deck.gl Layer instances
export function generateDeckLayers(props: DeckGLIntelMapProps) {
  const { events, tracks, arcs, hexagons, currentTime, timeRange, showHeatmap, showTracks, showArcs } = props;
  const layers: any[] = [];

  // 1. HEATMAP LAYER: Gaussian kernel density for convergence events
  if (showHeatmap) {
    layers.push({
      type: 'HeatmapLayer',
      id: 'convergence-heatmap',
      data: events.filter(e => e.convergenceScore > 50),
      getPosition: (d: IntelMapEvent) => d.position,
      getWeight: (d: IntelMapEvent) => d.convergenceScore / 100,
      radiusPixels: 60,
      intensity: 1.5,
      threshold: 0.1,
      colorRange: [
        [0, 0, 0, 0],
        [59, 130, 246, 80],
        [251, 191, 36, 150],
        [249, 115, 22, 200],
        [239, 68, 68, 255],
      ],
      aggregation: 'SUM',
    });
  }

  // 2. H3 HEXAGON LAYER: Hierarchical spatial indexing
  if (hexagons && hexagons.length > 0) {
    layers.push({
      type: 'H3HexagonLayer',
      id: 'h3-density',
      data: hexagons,
      getHexagon: (d: IntelMapHexagon) => d.h3Index,
      getFillColor: (d: IntelMapHexagon) => {
        const intensity = Math.min(d.value / 100, 1);
        return [59 + intensity * 180, 130 - intensity * 80, 246 - intensity * 200, 40 + intensity * 160];
      },
      getElevation: (d: IntelMapHexagon) => d.value * 100,
      elevationScale: 10,
      extruded: true,
      coverage: 0.9,
      pickable: true,
    });
  }

  // 3. TRIPS LAYER: Animated vessel/aircraft tracks with temporal decay
  if (showTracks && tracks.length > 0) {
    layers.push({
      type: 'TripsLayer',
      id: 'animated-tracks',
      data: tracks,
      getPath: (d: IntelMapTrack) => d.path.map(p => p.coordinates),
      getTimestamps: (d: IntelMapTrack) => d.path.map(p => p.timestamp),
      getColor: (d: IntelMapTrack) => AFFILIATION_COLORS[d.affiliation] || AFFILIATION_COLORS.unknown,
      currentTime: currentTime,
      trailLength: 600, // seconds of trail to show
      capRounded: true,
      jointRounded: true,
      widthMinPixels: 3,
      widthMaxPixels: 8,
      fadeTrail: true,
    });
  }

  // 4. ARC LAYER: Relationship arcs with animated flow
  if (showArcs && arcs.length > 0) {
    layers.push({
      type: 'ArcLayer',
      id: 'relationship-arcs',
      data: arcs,
      getSourcePosition: (d: IntelMapArc) => d.source,
      getTargetPosition: (d: IntelMapArc) => d.target,
      getSourceColor: (d: IntelMapArc) => d.color || [59, 130, 246, 160],
      getTargetColor: (d: IntelMapArc) => d.color || [239, 68, 68, 160],
      getWidth: (d: IntelMapArc) => 1 + d.weight * 4,
      greatCircle: true,
      numSegments: 50,
      pickable: true,
    });
  }

  // 5. SCATTERPLOT LAYER: Events with GPU-side time filtering
  layers.push({
    type: 'ScatterplotLayer',
    id: 'events-scatter',
    data: events,
    getPosition: (d: IntelMapEvent) => d.position,
    getRadius: (d: IntelMapEvent) => 4 + d.convergenceScore * 0.3,
    getFillColor: (d: IntelMapEvent) => {
      // Apply temporal decay to alpha channel
      const age = (currentTime - d.timestamp) / 1000;
      const decayFactor = d.decayRate ? Math.exp(-d.decayRate * age / 3600) : 1;
      const baseColor = DOMAIN_COLORS[d.domain] || [128, 128, 128, 200];
      return [...baseColor.slice(0, 3), Math.floor(baseColor[3] * decayFactor)];
    },
    getLineColor: (d: IntelMapEvent) => d.severity >= 0.8 ? [255, 255, 255, 200] : [0, 0, 0, 0],
    lineWidthMinPixels: 1,
    stroked: true,
    filled: true,
    radiusScale: 1,
    radiusMinPixels: 3,
    radiusMaxPixels: 30,
    pickable: true,
    autoHighlight: true,
    highlightColor: [255, 255, 255, 80],
    // DataFilterExtension for GPU-side temporal filtering
    extensions: ['DataFilterExtension'],
    filterRange: timeRange,
    getFilterValue: (d: IntelMapEvent) => d.timestamp,
    filterSoftRange: [timeRange[0] + (timeRange[1] - timeRange[0]) * 0.1, timeRange[1]],
  });

  // 6. ICON LAYER: MIL-STD-2525D symbols for tracked entities
  layers.push({
    type: 'IconLayer',
    id: 'mil-symbols',
    data: tracks.filter(t => t.path.length > 0).map(t => ({
      ...t,
      position: t.path[t.path.length - 1].coordinates,
    })),
    getPosition: (d: any) => d.position,
    getIcon: (d: any) => d.affiliation,
    getSize: 32,
    pickable: true,
    // iconAtlas and iconMapping would be defined with your MIL-STD sprite sheet
    sizeScale: 1,
    sizeMinPixels: 20,
    sizeMaxPixels: 60,
  });

  return layers;
}

// Viewport presets for AOIs
export const AOI_VIEWPORTS: Record<string, { longitude: number; latitude: number; zoom: number; pitch?: number }> = {
  'Global': { longitude: 30, latitude: 20, zoom: 2, pitch: 30 },
  'Crimea': { longitude: 34.5, latitude: 45.3, zoom: 8 },
  'Taiwan Strait': { longitude: 120.2, latitude: 23.5, zoom: 7 },
  'South China Sea': { longitude: 114.0, latitude: 14.5, zoom: 5 },
  'Kaliningrad': { longitude: 20.5, latitude: 54.7, zoom: 8 },
  'Baltic Sea': { longitude: 20.0, latitude: 57.5, zoom: 6 },
  'Persian Gulf': { longitude: 52.0, latitude: 26.5, zoom: 6 },
  'Bab-el-Mandeb': { longitude: 43.1, latitude: 12.5, zoom: 8 },
  'Horn of Africa': { longitude: 47.0, latitude: 8.0, zoom: 5 },
  'Sudan': { longitude: 32.5, latitude: 15.4, zoom: 6 },
  'Arctic NSR': { longitude: 100.0, latitude: 72.0, zoom: 3, pitch: 45 },
};

// Performance monitoring
export function getMapPerformanceMetrics() {
  return {
    fps: 0, // Would read from deck.gl metrics
    gpuMemory: '0 MB',
    visibleLayers: 0,
    totalDataPoints: 0,
    renderTime: '0ms',
  };
}

// Map dark style URL for MapLibre
export const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

// Component wrapper (placeholder until deck.gl is installed)
export function DeckGLIntelMap(props: DeckGLIntelMapProps) {
  const { events, tracks, arcs, currentTime, className = '' } = props;
  const [hoveredEvent, setHoveredEvent] = useState<IntelMapEvent | null>(null);

  const layers = useMemo(() => generateDeckLayers(props), [props]);

  // In production, this renders:
  // <DeckGL layers={layers} viewState={viewState} onViewStateChange={onViewStateChange}>
  //   <Map mapStyle={MAP_STYLE} />
  // </DeckGL>

  return (
    <div className={`relative w-full h-full bg-zinc-950 ${className}`}>
      {/* Placeholder: shows layer configuration summary */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <Globe className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-sm text-zinc-500 font-medium">deck.gl v9.3 GPU Map</p>
          <p className="text-xs text-zinc-600 mt-1">
            {layers.length} layers configured | {events.length} events | {tracks.length} tracks | {arcs.length} arcs
          </p>
          <p className="text-[10px] text-zinc-700 mt-2">Install: npm install deck.gl @deck.gl/react @deck.gl/layers @deck.gl/geo-layers react-map-gl maplibre-gl</p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-[9px]">
            {layers.map((l: any) => (
              <div key={l.id} className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1">
                <span className="text-cyan-400">{l.type}</span>
                <span className="text-zinc-500 block">{l.id}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance overlay */}
      <div className="absolute top-2 right-2 bg-zinc-900/80 border border-zinc-800 rounded-lg px-2 py-1.5 text-[8px] font-mono text-zinc-500">
        <div>Layers: {layers.length}</div>
        <div>Events: {events.length.toLocaleString()}</div>
        <div>Tracks: {tracks.length}</div>
        <div>GPU Filter: DataFilterExtension</div>
        <div>Target: 60fps @ 1M pts</div>
      </div>
    </div>
  );
}

export default DeckGLIntelMap;
