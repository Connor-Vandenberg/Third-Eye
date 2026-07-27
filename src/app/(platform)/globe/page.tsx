'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Layers, Eye, Filter, Maximize2, Minimize2,
  Play, Pause, RotateCcw, ZoomIn, ZoomOut, MapPin,
  Radio, Satellite, Anchor, Plane, Zap, Target, Shield,
  AlertTriangle, Activity, Clock, ChevronRight, Settings,
  Crosshair, Network, TrendingUp
} from 'lucide-react';

// Layer definitions for the 3D globe
interface GlobeLayer {
  id: string;
  name: string;
  icon: any;
  color: string;
  visible: boolean;
  opacity: number;
  count: number;
  domain: string;
}

interface GlobeEvent {
  id: string;
  lat: number;
  lng: number;
  type: string;
  severity: number;
  label: string;
  domain: string;
  timestamp: string;
  convergenceScore: number;
}

interface GlobeArc {
  id: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string;
  label: string;
  weight: number;
}

const GLOBE_LAYERS: GlobeLayer[] = [
  { id: 'conflicts', name: 'Armed Conflicts', icon: AlertTriangle, color: '#ef4444', visible: true, opacity: 1, count: 847, domain: 'OSINT' },
  { id: 'military-flights', name: 'Military Aviation', icon: Plane, color: '#f59e0b', visible: true, opacity: 0.8, count: 264, domain: 'SIGINT' },
  { id: 'maritime', name: 'Maritime Tracks', icon: Anchor, color: '#06b6d4', visible: true, opacity: 0.7, count: 1420, domain: 'GEOINT' },
  { id: 'signals', name: 'Novel Signals', icon: Zap, color: '#fbbf24', visible: true, opacity: 1, count: 47, domain: 'OSINT' },
  { id: 'satellites', name: 'Satellite Passes', icon: Satellite, color: '#10b981', visible: false, opacity: 0.6, count: 23, domain: 'GEOINT' },
  { id: 'cyber', name: 'Cyber Events', icon: Shield, color: '#8b5cf6', visible: false, opacity: 0.8, count: 156, domain: 'CYBER' },
  { id: 'convergence', name: 'Convergence Zones', icon: Target, color: '#ec4899', visible: true, opacity: 0.5, count: 12, domain: 'FUSION' },
  { id: 'infrastructure', name: 'Critical Infra', icon: Radio, color: '#6366f1', visible: false, opacity: 0.7, count: 89, domain: 'OSINT' },
  { id: 'predictions', name: 'Prediction Hotspots', icon: TrendingUp, color: '#f97316', visible: true, opacity: 0.6, count: 8, domain: 'PREDICTION' },
  { id: 'mesh-nodes', name: 'Mesh Nodes', icon: Network, color: '#14b8a6', visible: false, opacity: 0.9, count: 3, domain: 'MESH' },
];

const MOCK_EVENTS: GlobeEvent[] = [
  { id: 'ev-1', lat: 45.3, lng: 34.5, type: 'conflict', severity: 0.9, label: 'Crimea - Military Buildup', domain: 'OSINT', timestamp: '2m ago', convergenceScore: 87 },
  { id: 'ev-2', lat: 23.5, lng: 120.2, type: 'signal', severity: 0.85, label: 'Taiwan Strait - AIS Anomaly', domain: 'GEOINT', timestamp: '5m ago', convergenceScore: 82 },
  { id: 'ev-3', lat: 15.4, lng: 32.5, type: 'conflict', severity: 0.95, label: 'Sudan - SAF/RSF Engagement', domain: 'OSINT', timestamp: '8m ago', convergenceScore: 94 },
  { id: 'ev-4', lat: 54.7, lng: 20.5, type: 'military', severity: 0.7, label: 'Kaliningrad - Flight Surge', domain: 'SIGINT', timestamp: '12m ago', convergenceScore: 71 },
  { id: 'ev-5', lat: 12.5, lng: 43.1, type: 'maritime', severity: 0.6, label: 'Bab-el-Mandeb - Vessel Diversion', domain: 'GEOINT', timestamp: '15m ago', convergenceScore: 64 },
  { id: 'ev-6', lat: 26.8, lng: 55.3, type: 'financial', severity: 0.65, label: 'Dubai - OFAC Cascade', domain: 'FININT', timestamp: '23m ago', convergenceScore: 68 },
  { id: 'ev-7', lat: 57.5, lng: 24.1, type: 'cyber', severity: 0.75, label: 'Baltic - BGP Hijack Attempt', domain: 'CYBER', timestamp: '31m ago', convergenceScore: 76 },
  { id: 'ev-8', lat: 33.8, lng: 35.5, type: 'signal', severity: 0.8, label: 'Lebanon - Discourse Velocity', domain: 'INFOPS', timestamp: '42m ago', convergenceScore: 79 },
  { id: 'ev-9', lat: 69.0, lng: 33.0, type: 'military', severity: 0.55, label: 'Arctic NSR - Sub Activity', domain: 'SIGINT', timestamp: '55m ago', convergenceScore: 58 },
  { id: 'ev-10', lat: 10.0, lng: -67.0, type: 'political', severity: 0.5, label: 'Venezuela - CII Spike', domain: 'OSINT', timestamp: '1h ago', convergenceScore: 52 },
];

const MOCK_ARCS: GlobeArc[] = [
  { id: 'arc-1', startLat: 55.7, startLng: 37.6, endLat: 45.3, endLng: 34.5, color: '#ef4444', label: 'Moscow → Crimea (Supply)', weight: 0.9 },
  { id: 'arc-2', startLat: 39.9, startLng: 116.4, endLat: 23.5, endLng: 120.2, color: '#f59e0b', label: 'Beijing → Taiwan Strait (Military)', weight: 0.8 },
  { id: 'arc-3', startLat: 26.8, startLng: 55.3, endLat: 15.4, endLng: 32.5, color: '#06b6d4', label: 'Dubai → Sudan (Financial)', weight: 0.6 },
  { id: 'arc-4', startLat: 59.9, startLng: 30.3, endLat: 54.7, endLng: 20.5, color: '#8b5cf6', label: 'St Petersburg → Kaliningrad (Cyber)', weight: 0.7 },
  { id: 'arc-5', startLat: 25.3, startLng: 55.3, endLat: 12.5, endLng: 43.1, color: '#10b981', label: 'UAE → Djibouti (Maritime)', weight: 0.5 },
];

const AOI_REGIONS = [
  { name: 'Crimea', lat: 45.3, lng: 34.5, radius: 2, color: '#ef4444' },
  { name: 'Taiwan Strait', lat: 23.5, lng: 120.2, radius: 3, color: '#f59e0b' },
  { name: 'South China Sea', lat: 14.5, lng: 114.0, radius: 5, color: '#f59e0b' },
  { name: 'Kaliningrad', lat: 54.7, lng: 20.5, radius: 1.5, color: '#8b5cf6' },
  { name: 'Baltic Sea', lat: 57.5, lng: 20.0, radius: 3, color: '#8b5cf6' },
  { name: 'Persian Gulf', lat: 26.5, lng: 52.0, radius: 3, color: '#06b6d4' },
  { name: 'Bab-el-Mandeb', lat: 12.5, lng: 43.1, radius: 2, color: '#06b6d4' },
  { name: 'Horn of Africa', lat: 8.0, lng: 47.0, radius: 4, color: '#ef4444' },
  { name: 'Sahel', lat: 14.0, lng: 2.0, radius: 5, color: '#ef4444' },
  { name: 'Sudan', lat: 15.4, lng: 32.5, radius: 4, color: '#ef4444' },
];

function EventPin({ event, onClick }: { event: GlobeEvent; onClick: () => void }) {
  const severityColor = event.severity >= 0.8 ? '#ef4444' : event.severity >= 0.6 ? '#f59e0b' : '#3b82f6';
  return (
    <button onClick={onClick} className="group relative" title={event.label}>
      <motion.div
        className="w-3 h-3 rounded-full border-2 cursor-pointer"
        style={{ backgroundColor: severityColor, borderColor: 'rgba(255,255,255,0.3)' }}
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 2, repeat: Infinity, delay: Math.random() * 2 }}
      />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-xl">
          <p className="text-[10px] text-white font-medium">{event.label}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[8px] text-zinc-400">{event.domain}</span>
            <span className="text-[8px] font-mono" style={{ color: severityColor }}>CS:{event.convergenceScore}</span>
            <span className="text-[8px] text-zinc-500">{event.timestamp}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

function GlobeVisualization({ events, arcs, layers, rotation, onEventClick }: {
  events: GlobeEvent[];
  arcs: GlobeArc[];
  layers: GlobeLayer[];
  rotation: number;
  onEventClick: (event: GlobeEvent) => void;
}) {
  // Simplified 2D globe projection (actual 3D would use react-three-fiber/globe.gl)
  // This renders as an equirectangular map that can be swapped for 3D later
  const visibleLayers = layers.filter(l => l.visible);
  const visibleEvents = events.filter(e => {
    const layer = layers.find(l => l.id === e.type || l.domain === e.domain);
    return !layer || layer.visible;
  });

  return (
    <div className="relative w-full h-full bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800">
      {/* Globe background with grid */}
      <div className="absolute inset-0">
        {/* Dark map background */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-zinc-950" />
        
        {/* Grid lines */}
        <svg className="absolute inset-0 w-full h-full opacity-10">
          {/* Longitude lines */}
          {Array.from({ length: 12 }, (_, i) => (
            <line key={`lng-${i}`} x1={`${(i / 12) * 100}%`} y1="0" x2={`${(i / 12) * 100}%`} y2="100%" stroke="#3b82f6" strokeWidth="0.5" />
          ))}
          {/* Latitude lines */}
          {Array.from({ length: 6 }, (_, i) => (
            <line key={`lat-${i}`} x1="0" y1={`${(i / 6) * 100}%`} x2="100%" y2={`${(i / 6) * 100}%`} stroke="#3b82f6" strokeWidth="0.5" />
          ))}
        </svg>

        {/* AOI Regions (pulsing circles) */}
        {AOI_REGIONS.map((aoi) => {
          const x = ((aoi.lng + 180) / 360) * 100;
          const y = ((90 - aoi.lat) / 180) * 100;
          return (
            <motion.div
              key={aoi.name}
              className="absolute rounded-full"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: `${aoi.radius * 2}%`,
                height: `${aoi.radius * 3}%`,
                transform: 'translate(-50%, -50%)',
                backgroundColor: `${aoi.color}10`,
                border: `1px solid ${aoi.color}30`,
              }}
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, delay: Math.random() * 2 }}
            />
          );
        })}

        {/* Arcs (relationship lines) */}
        <svg className="absolute inset-0 w-full h-full">
          {arcs.map((arc) => {
            const x1 = ((arc.startLng + 180) / 360) * 100;
            const y1 = ((90 - arc.startLat) / 180) * 100;
            const x2 = ((arc.endLng + 180) / 360) * 100;
            const y2 = ((90 - arc.endLat) / 180) * 100;
            const midX = (x1 + x2) / 2;
            const midY = Math.min(y1, y2) - 5;
            return (
              <g key={arc.id}>
                <motion.path
                  d={`M ${x1}% ${y1}% Q ${midX}% ${midY}% ${x2}% ${y2}%`}
                  fill="none"
                  stroke={arc.color}
                  strokeWidth={arc.weight * 2}
                  strokeLinecap="round"
                  opacity="0.6"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, ease: 'easeOut' }}
                />
                {/* Animated dot along arc */}
                <circle r="2" fill={arc.color}>
                  <animateMotion
                    dur="4s"
                    repeatCount="indefinite"
                    path={`M ${x1}% ${y1}% Q ${midX}% ${midY}% ${x2}% ${y2}%`}
                  />
                </circle>
              </g>
            );
          })}
        </svg>

        {/* Event Pins */}
        {visibleEvents.map((event) => {
          const x = ((event.lng + 180) / 360) * 100;
          const y = ((90 - event.lat) / 180) * 100;
          return (
            <div
              key={event.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <EventPin event={event} onClick={() => onEventClick(event)} />
            </div>
          );
        })}
      </div>

      {/* 3D Globe placeholder text */}
      <div className="absolute bottom-4 left-4 bg-zinc-900/80 backdrop-blur border border-zinc-700/50 rounded-lg px-3 py-2">
        <span className="text-[9px] text-zinc-400">Equirectangular projection • Swap to React Three Fiber globe.gl for 3D</span>
      </div>

      {/* Active Events Counter */}
      <div className="absolute top-4 left-4 bg-zinc-900/80 backdrop-blur border border-zinc-700/50 rounded-lg px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-zinc-300 font-medium">{visibleEvents.length} active events</span>
          <span className="text-[9px] text-zinc-500">• {arcs.length} relationships</span>
          <span className="text-[9px] text-zinc-500">• {AOI_REGIONS.length} AOIs</span>
        </div>
      </div>
    </div>
  );
}

export default function GlobePage() {
  const [layers, setLayers] = useState(GLOBE_LAYERS);
  const [selectedEvent, setSelectedEvent] = useState<GlobeEvent | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [showLayerPanel, setShowLayerPanel] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [timeRange, setTimeRange] = useState<'live' | '1h' | '6h' | '24h'>('live');

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setRotation(prev => (prev + 0.1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const toggleLayer = (id: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  };

  const handleEventClick = (event: GlobeEvent) => {
    setSelectedEvent(event);
  };

  return (
    <div className={`flex bg-zinc-950 text-white ${fullscreen ? 'fixed inset-0 z-50' : 'min-h-screen'}`}>
      {/* Layer Panel (Left Sidebar) */}
      <AnimatePresence>
        {showLayerPanel && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-r border-zinc-800 flex-shrink-0 overflow-hidden"
          >
            <div className="w-[280px] h-full flex flex-col">
              {/* Panel Header */}
              <div className="p-4 border-b border-zinc-800">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Intelligence Layers
                </h2>
                <p className="text-[10px] text-zinc-500 mt-1">Toggle visibility, adjust opacity, filter by domain</p>
              </div>

              {/* Layer List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {layers.map((layer) => (
                  <div
                    key={layer.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      layer.visible ? 'bg-zinc-800/50' : 'bg-transparent hover:bg-zinc-900'
                    }`}
                    onClick={() => toggleLayer(layer.id)}
                  >
                    <div className={`w-3 h-3 rounded-sm border-2 transition-colors ${layer.visible ? '' : 'opacity-30'}`} style={{ borderColor: layer.color, backgroundColor: layer.visible ? layer.color : 'transparent' }} />
                    <layer.icon className="w-3.5 h-3.5" style={{ color: layer.visible ? layer.color : '#71717a' }} />
                    <div className="flex-1 min-w-0">
                      <span className={`text-xs ${layer.visible ? 'text-zinc-200' : 'text-zinc-500'}`}>{layer.name}</span>
                    </div>
                    <span className="text-[9px] font-mono text-zinc-500">{layer.count}</span>
                  </div>
                ))}
              </div>

              {/* AOI List */}
              <div className="border-t border-zinc-800 p-3">
                <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-2">Areas of Interest (20)</h3>
                <div className="space-y-1 max-h-[150px] overflow-y-auto scrollbar-thin scrollbar-track-zinc-900 scrollbar-thumb-zinc-700">
                  {AOI_REGIONS.map((aoi) => (
                    <div key={aoi.name} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-zinc-800/50 cursor-pointer">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: aoi.color }} />
                      <span className="text-[10px] text-zinc-400">{aoi.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Globe Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="border-b border-zinc-800 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowLayerPanel(!showLayerPanel)} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
              <Layers className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-zinc-800" />
            <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-lg p-0.5">
              {(['live', '1h', '6h', '24h'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-colors ${
                    timeRange === range ? 'bg-cyan-500/20 text-cyan-400' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {range === 'live' ? '● LIVE' : range}
                </button>
              ))}
            </div>
            <button onClick={() => setFullscreen(!fullscreen)} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400">
              {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Globe */}
        <div className="flex-1 relative">
          <GlobeVisualization
            events={MOCK_EVENTS}
            arcs={MOCK_ARCS}
            layers={layers}
            rotation={rotation}
            onEventClick={handleEventClick}
          />

          {/* Event Detail Panel (slides in from right) */}
          <AnimatePresence>
            {selectedEvent && (
              <motion.div
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                className="absolute top-4 right-4 w-72 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 rounded-xl shadow-2xl overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-zinc-500">{selectedEvent.domain}</span>
                      <h3 className="text-sm font-bold text-white mt-0.5">{selectedEvent.label}</h3>
                    </div>
                    <button onClick={() => setSelectedEvent(null)} className="p-1 rounded hover:bg-zinc-800 text-zinc-400">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
                      <span className="text-[9px] text-zinc-500 block">Convergence</span>
                      <span className={`text-lg font-bold ${selectedEvent.convergenceScore >= 80 ? 'text-red-400' : selectedEvent.convergenceScore >= 60 ? 'text-yellow-400' : 'text-blue-400'}`}>
                        {selectedEvent.convergenceScore}
                      </span>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
                      <span className="text-[9px] text-zinc-500 block">Severity</span>
                      <span className="text-lg font-bold text-white">{(selectedEvent.severity * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Location</span>
                      <span className="text-zinc-300 font-mono">{selectedEvent.lat.toFixed(2)}, {selectedEvent.lng.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Detected</span>
                      <span className="text-zinc-300">{selectedEvent.timestamp}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Type</span>
                      <span className="text-zinc-300">{selectedEvent.type}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button className="flex-1 px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-medium hover:bg-cyan-500/30 transition-colors">
                      Investigate
                    </button>
                    <button className="flex-1 px-3 py-1.5 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-medium hover:bg-orange-500/30 transition-colors">
                      Task
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
