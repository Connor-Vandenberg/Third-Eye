'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Radio, Satellite, Plane, Ship, User, Target, Crosshair, Zap, Eye, Shield, Activity, Layers, Clock, Search, ChevronDown } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface COPTrack {
  global_id: string;
  entity_type: 'vehicle' | 'aircraft' | 'vessel' | 'person' | 'emitter' | 'unknown';
  classification: 'HOSTILE' | 'NEUTRAL' | 'FRIENDLY' | 'UNKNOWN';
  lat: number;
  lng: number;
  altitude: number;
  heading: number;
  speed_kmh: number;
  confidence: number;
  source: string;
  last_seen: string;
  trail: [number, number][];
  signals: string[];
}

interface ConvergenceSignal {
  signal_id: string;
  signal_type: string;
  severity: number;
  lat: number;
  lon: number;
  sources: string[];
  source_count: number;
  timestamp: string;
  is_novel: boolean;
}

interface PlatformAsset {
  id: string;
  type: 'drone' | 'satellite' | 'ground_robot' | 'ship' | 'sdr';
  name: string;
  lat: number;
  lng: number;
  status: 'active' | 'idle' | 'returning' | 'offline';
  battery_pct?: number;
  mission_id?: string;
  coverage_radius_km: number;
}

interface GeofenceViolation {
  entity_id: string;
  geofence_name: string;
  violation_type: 'entry' | 'exit' | 'dwell';
  timestamp: string;
  lat: number;
  lng: number;
}

interface COPState {
  tracks: COPTrack[];
  signals: ConvergenceSignal[];
  platforms: PlatformAsset[];
  violations: GeofenceViolation[];
  stats: {
    active_tracks: number;
    total_tracks: number;
    convergence_signals_24h: number;
    novel_signals_24h: number;
    platforms_active: number;
    current_cycle: number;
    alerts_pending: number;
    system_status: string;
  };
}

// =============================================================================
// AOI DEFINITIONS (20 monitored areas)
// =============================================================================

const AOIS = [
  { id: 'crimea_bridge', name: 'Crimean Bridge', lat: 45.3, lng: 36.5, radius_km: 5, priority: 'CRITICAL' },
  { id: 'sevastopol', name: 'Sevastopol Naval', lat: 44.6, lng: 33.5, radius_km: 10, priority: 'CRITICAL' },
  { id: 'taiwan_strait', name: 'Taiwan Strait', lat: 24.5, lng: 119.0, radius_km: 50, priority: 'HIGH' },
  { id: 'kaliningrad', name: 'Kaliningrad', lat: 54.7, lng: 20.5, radius_km: 30, priority: 'HIGH' },
  { id: 'natanz', name: 'Natanz Nuclear', lat: 33.7, lng: 51.7, radius_km: 5, priority: 'CRITICAL' },
  { id: 'yongbyon', name: 'Yongbyon Nuclear', lat: 39.8, lng: 125.75, radius_km: 5, priority: 'CRITICAL' },
  { id: 'south_china_sea', name: 'Spratly Islands', lat: 10.0, lng: 114.0, radius_km: 100, priority: 'HIGH' },
  { id: 'arctic_nsr', name: 'Northern Sea Route', lat: 72.0, lng: 100.0, radius_km: 200, priority: 'NORMAL' },
  { id: 'bab_el_mandeb', name: 'Bab-el-Mandeb', lat: 12.5, lng: 43.3, radius_km: 30, priority: 'HIGH' },
  { id: 'suwalki', name: 'Suwalki Gap', lat: 54.1, lng: 23.0, radius_km: 20, priority: 'HIGH' },
  { id: 'zaporizhzhia', name: 'Zaporizhzhia NPP', lat: 47.5, lng: 34.6, radius_km: 5, priority: 'CRITICAL' },
  { id: 'hmeimim', name: 'Hmeimim Air Base', lat: 35.4, lng: 35.95, radius_km: 5, priority: 'HIGH' },
  { id: 'djibouti', name: 'Djibouti Bases', lat: 11.5, lng: 43.1, radius_km: 10, priority: 'NORMAL' },
  { id: 'gaza', name: 'Gaza Border', lat: 31.3, lng: 34.3, radius_km: 15, priority: 'CRITICAL' },
  { id: 'donbas', name: 'Donbas Front', lat: 48.0, lng: 38.0, radius_km: 50, priority: 'CRITICAL' },
  { id: 'hormuz', name: 'Strait of Hormuz', lat: 26.5, lng: 56.3, radius_km: 30, priority: 'HIGH' },
  { id: 'sahel', name: 'Sahel Region', lat: 14.0, lng: -2.0, radius_km: 100, priority: 'NORMAL' },
  { id: 'myanmar', name: 'Myanmar', lat: 19.0, lng: 96.0, radius_km: 50, priority: 'NORMAL' },
  { id: 'sudan', name: 'Khartoum', lat: 15.6, lng: 32.5, radius_km: 20, priority: 'HIGH' },
  { id: 'venezuela', name: 'Essequibo', lat: 6.0, lng: -59.0, radius_km: 50, priority: 'LOW' },
];

// =============================================================================
// CLASSIFICATION COLORS
// =============================================================================

const CLASS_COLORS: Record<string, string> = {
  HOSTILE: '#ef4444',
  NEUTRAL: '#f59e0b',
  FRIENDLY: '#22c55e',
  UNKNOWN: '#6b7280',
};

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  NORMAL: '#3b82f6',
  LOW: '#6b7280',
};

const ENTITY_ICONS: Record<string, typeof Plane> = {
  vehicle: Target,
  aircraft: Plane,
  vessel: Ship,
  person: User,
  emitter: Radio,
  unknown: Crosshair,
};

// =============================================================================
// MOCK DATA (replaced by WebSocket in production)
// =============================================================================

function generateMockState(): COPState {
  const tracks: COPTrack[] = [
    { global_id: 'trk_001', entity_type: 'vehicle', classification: 'HOSTILE', lat: 47.507, lng: 34.585, altitude: 0, heading: 180, speed_kmh: 45, confidence: 0.87, source: 'satellite_change_detection', last_seen: new Date().toISOString(), trail: [[47.51, 34.58], [47.509, 34.583], [47.507, 34.585]], signals: ['SATELLITE_CHANGE_DETECTED', 'SIGINT_EMITTER'] },
    { global_id: 'trk_002', entity_type: 'aircraft', classification: 'UNKNOWN', lat: 45.35, lng: 36.48, altitude: 8500, heading: 270, speed_kmh: 850, confidence: 0.72, source: 'opensky', last_seen: new Date().toISOString(), trail: [[45.34, 36.5], [45.345, 36.49], [45.35, 36.48]], signals: ['ADS_B_ANOMALY'] },
    { global_id: 'trk_003', entity_type: 'vessel', classification: 'NEUTRAL', lat: 12.4, lng: 43.2, altitude: 0, heading: 45, speed_kmh: 12, confidence: 0.91, source: 'ais_collector', last_seen: new Date().toISOString(), trail: [[12.38, 43.18], [12.39, 43.19], [12.4, 43.2]], signals: [] },
    { global_id: 'trk_004', entity_type: 'emitter', classification: 'HOSTILE', lat: 48.1, lng: 37.9, altitude: 0, heading: 0, speed_kmh: 0, confidence: 0.65, source: 'cell_survey', last_seen: new Date().toISOString(), trail: [], signals: ['FOREIGN_DEVICE_DETECTED', 'IMSI_ANOMALY'] },
    { global_id: 'trk_005', entity_type: 'person', classification: 'UNKNOWN', lat: 33.72, lng: 51.68, altitude: 0, heading: 90, speed_kmh: 5, confidence: 0.55, source: 'face_intelligence', last_seen: new Date().toISOString(), trail: [[33.71, 51.67], [33.715, 51.675], [33.72, 51.68]], signals: ['WATCHLIST_PROXIMITY'] },
  ];

  const signals: ConvergenceSignal[] = [
    { signal_id: 'conv_001', signal_type: 'SATELLITE_SIGINT_OSINT_CONVERGENCE', severity: 0.91, lat: 47.507, lon: 34.585, sources: ['satellite', 'sigint', 'telegram'], source_count: 3, timestamp: new Date().toISOString(), is_novel: false },
    { signal_id: 'conv_002', signal_type: 'NOVEL_SIGNAL', severity: 0.78, lat: 48.0, lon: 38.0, sources: ['ioda', 'bgp_monitor'], source_count: 2, timestamp: new Date().toISOString(), is_novel: true },
    { signal_id: 'conv_003', signal_type: 'MILITARY_BUILDUP_INDICATOR', severity: 0.85, lat: 54.7, lon: 20.5, sources: ['satellite', 'osint', 'sigint'], source_count: 3, timestamp: new Date().toISOString(), is_novel: false },
  ];

  const platforms: PlatformAsset[] = [
    { id: 'drone_01', type: 'drone', name: 'Recon-Alpha', lat: 47.5, lng: 34.5, status: 'active', battery_pct: 72, mission_id: 'msn_014', coverage_radius_km: 5 },
    { id: 'sat_s2a', type: 'satellite', name: 'Sentinel-2A', lat: 47.0, lng: 35.0, status: 'active', coverage_radius_km: 290 },
    { id: 'sdr_01', type: 'sdr', name: 'SDR-Crimea', lat: 45.3, lng: 36.4, status: 'active', coverage_radius_km: 50 },
  ];

  return {
    tracks,
    signals,
    platforms,
    violations: [],
    stats: {
      active_tracks: tracks.length,
      total_tracks: 1247,
      convergence_signals_24h: 89,
      novel_signals_24h: 7,
      platforms_active: platforms.filter(p => p.status === 'active').length,
      current_cycle: 4821,
      alerts_pending: 3,
      system_status: 'ULTRA MAX',
    },
  };
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function COPPage() {
  const [state, setState] = useState<COPState>(generateMockState);
  const [selectedTrack, setSelectedTrack] = useState<COPTrack | null>(null);
  const [showLayers, setShowLayers] = useState({ aois: true, tracks: true, signals: true, platforms: true, h3: false, trails: true });
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // WebSocket connection for live updates
  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const wsUrl = apiBase.replace('http', 'ws') + '/ws/cop';

    try {
      const ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data);
          if (update.type === 'cop_state') {
            setState(update.payload);
          } else if (update.type === 'track_update') {
            setState(prev => ({
              ...prev,
              tracks: prev.tracks.map(t => t.global_id === update.payload.global_id ? { ...t, ...update.payload } : t),
            }));
          } else if (update.type === 'new_signal') {
            setState(prev => ({ ...prev, signals: [update.payload, ...prev.signals].slice(0, 100) }));
          }
        } catch { /* ignore parse errors */ }
      };
      ws.onopen = () => console.log('[COP] WebSocket connected');
      ws.onerror = () => console.log('[COP] WebSocket unavailable, using mock data');
      wsRef.current = ws;
    } catch {
      // WebSocket not available, use mock data with polling
    }

    // Fallback: refresh mock data every 5s
    const interval = setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        setState(generateMockState());
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      wsRef.current?.close();
    };
  }, []);

  const getEntityIcon = (type: string) => {
    const Icon = ENTITY_ICONS[type] || Crosshair;
    return Icon;
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 0.8) return 'text-red-400';
    if (severity >= 0.6) return 'text-orange-400';
    if (severity >= 0.4) return 'text-yellow-400';
    return 'text-blue-400';
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* HEADER BAR */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/80 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Eye className="w-5 h-5 text-emerald-400" />
          <h1 className="text-sm font-bold tracking-wide">COMMON OPERATING PICTURE</h1>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
            {state.stats.system_status}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
          <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-emerald-400" />Cycle #{state.stats.current_cycle}</span>
          <span className="flex items-center gap-1"><Target className="w-3 h-3" />{state.stats.active_tracks} tracks</span>
          <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-400" />{state.stats.convergence_signals_24h} signals</span>
          <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-red-400" />{state.stats.alerts_pending} alerts</span>
          <span className="flex items-center gap-1"><Satellite className="w-3 h-3 text-blue-400" />{state.stats.platforms_active} platforms</span>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex">
        {/* MAP AREA */}
        <div className="flex-1 relative">
          {/* Map placeholder (MapLibre GL JS renders here in production) */}
          <div ref={mapRef} className="absolute inset-0 bg-zinc-900">
            {/* Simulated map background */}
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 opacity-80" />
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-zinc-600 text-sm font-mono">MapLibre GL JS renders here (requires maplibre-gl CSS import)</p>
            </div>

            {/* Track markers overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {showLayers.tracks && state.tracks.map((track) => {
                const Icon = getEntityIcon(track.entity_type);
                const color = CLASS_COLORS[track.classification];
                // Position tracks on a simple projection for demo
                const x = ((track.lng + 180) / 360) * 100;
                const y = ((90 - track.lat) / 180) * 100;
                return (
                  <motion.div
                    key={track.global_id}
                    className="absolute pointer-events-auto cursor-pointer"
                    style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.3 }}
                    onClick={() => setSelectedTrack(track)}
                  >
                    <div className="relative">
                      <Icon className="w-5 h-5" style={{ color }} />
                      {track.signals.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      )}
                      <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[8px] font-mono whitespace-nowrap" style={{ color }}>
                        {track.global_id.slice(-3)}
                      </span>
                    </div>
                  </motion.div>
                );
              })}

              {/* Convergence signal markers */}
              {showLayers.signals && state.signals.map((sig) => {
                const x = ((sig.lon + 180) / 360) * 100;
                const y = ((90 - sig.lat) / 180) * 100;
                return (
                  <motion.div
                    key={sig.signal_id}
                    className="absolute pointer-events-auto"
                    style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                    animate={sig.is_novel ? { scale: [1, 1.5, 1], opacity: [1, 0.5, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 ${sig.is_novel ? 'border-purple-400 bg-purple-400/20' : 'border-orange-400 bg-orange-400/20'}`} />
                  </motion.div>
                );
              })}

              {/* Platform positions */}
              {showLayers.platforms && state.platforms.map((p) => {
                const x = ((p.lng + 180) / 360) * 100;
                const y = ((90 - p.lat) / 180) * 100;
                return (
                  <div key={p.id} className="absolute" style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}>
                    <div className="w-3 h-3 rounded-sm bg-cyan-400/80 border border-cyan-300" title={p.name} />
                  </div>
                );
              })}

              {/* AOI circles */}
              {showLayers.aois && AOIS.filter(a => a.priority === 'CRITICAL').map((aoi) => {
                const x = ((aoi.lng + 180) / 360) * 100;
                const y = ((90 - aoi.lat) / 180) * 100;
                return (
                  <div key={aoi.id} className="absolute" style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}>
                    <div className="w-8 h-8 rounded-full border border-red-500/30 bg-red-500/5 flex items-center justify-center">
                      <span className="text-[6px] font-mono text-red-400">{aoi.name.slice(0, 4)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Layer toggle */}
          <div className="absolute top-3 left-3 bg-zinc-900/90 backdrop-blur border border-zinc-700 rounded-lg p-2 z-10">
            <div className="flex items-center gap-1 mb-1">
              <Layers className="w-3 h-3 text-zinc-400" />
              <span className="text-[10px] font-mono text-zinc-400">LAYERS</span>
            </div>
            {Object.entries(showLayers).map(([key, value]) => (
              <label key={key} className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-300 cursor-pointer py-0.5">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={() => setShowLayers(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                  className="w-3 h-3 rounded border-zinc-600 bg-zinc-800 text-emerald-500 focus:ring-0"
                />
                {key.toUpperCase()}
              </label>
            ))}
          </div>

          {/* Novel signals alert banner */}
          {state.stats.novel_signals_24h > 0 && (
            <motion.div
              className="absolute top-3 left-1/2 -translate-x-1/2 bg-purple-900/80 backdrop-blur border border-purple-500/50 rounded-lg px-4 py-1.5 z-10"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-300 animate-pulse" />
                <span className="text-xs font-mono text-purple-200">
                  {state.stats.novel_signals_24h} NOVEL SIGNALS DETECTED (24h)
                </span>
              </div>
            </motion.div>
          )}
        </div>

        {/* RIGHT PANEL: Track details + signal feed */}
        <div className="w-80 bg-zinc-900/90 border-l border-zinc-800 flex flex-col overflow-hidden">
          {/* Selected track detail */}
          <AnimatePresence>
            {selectedTrack && (
              <motion.div
                className="p-3 border-b border-zinc-800 bg-zinc-800/50"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold" style={{ color: CLASS_COLORS[selectedTrack.classification] }}>
                    {selectedTrack.classification}
                  </span>
                  <button onClick={() => setSelectedTrack(null)} className="text-zinc-500 hover:text-zinc-300 text-xs">x</button>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-zinc-300">
                  <span>ID: {selectedTrack.global_id}</span>
                  <span>Type: {selectedTrack.entity_type}</span>
                  <span>Lat: {selectedTrack.lat.toFixed(4)}</span>
                  <span>Lng: {selectedTrack.lng.toFixed(4)}</span>
                  <span>Speed: {selectedTrack.speed_kmh} km/h</span>
                  <span>Hdg: {selectedTrack.heading}deg</span>
                  <span>Conf: {(selectedTrack.confidence * 100).toFixed(0)}%</span>
                  <span>Src: {selectedTrack.source.slice(0, 15)}</span>
                </div>
                {selectedTrack.signals.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedTrack.signals.map(s => (
                      <span key={s} className="text-[8px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-mono">{s}</span>
                    ))}
                  </div>
                )}
                <div className="mt-2 flex gap-1">
                  <button className="text-[9px] px-2 py-1 rounded bg-blue-600/30 text-blue-300 hover:bg-blue-600/50 font-mono">TASK DRONE</button>
                  <button className="text-[9px] px-2 py-1 rounded bg-purple-600/30 text-purple-300 hover:bg-purple-600/50 font-mono">TASK SAT</button>
                  <button className="text-[9px] px-2 py-1 rounded bg-orange-600/30 text-orange-300 hover:bg-orange-600/50 font-mono">WATCHLIST</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active tracks list */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-[10px] font-mono text-zinc-400">ACTIVE TRACKS ({state.tracks.length})</span>
              <Search className="w-3 h-3 text-zinc-500" />
            </div>
            {state.tracks.map(track => {
              const Icon = getEntityIcon(track.entity_type);
              return (
                <div
                  key={track.global_id}
                  className={`px-3 py-2 border-b border-zinc-800/50 cursor-pointer hover:bg-zinc-800/50 transition-colors ${selectedTrack?.global_id === track.global_id ? 'bg-zinc-800' : ''}`}
                  onClick={() => setSelectedTrack(track)}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5" style={{ color: CLASS_COLORS[track.classification] }} />
                    <span className="text-[10px] font-mono text-zinc-200 flex-1">{track.global_id}</span>
                    <span className="text-[8px] font-mono" style={{ color: CLASS_COLORS[track.classification] }}>{track.classification.slice(0, 3)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 ml-5">
                    <span className="text-[9px] text-zinc-500 font-mono">{track.source.replace('_collector', '').slice(0, 12)}</span>
                    {track.signals.length > 0 && (
                      <span className="text-[8px] text-red-400 font-mono">{track.signals.length} sig</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Convergence signal feed */}
          <div className="h-48 border-t border-zinc-800 overflow-y-auto">
            <div className="px-3 py-2 border-b border-zinc-800 sticky top-0 bg-zinc-900">
              <span className="text-[10px] font-mono text-zinc-400">CONVERGENCE SIGNALS</span>
            </div>
            {state.signals.map(sig => (
              <div key={sig.signal_id} className="px-3 py-1.5 border-b border-zinc-800/30">
                <div className="flex items-center gap-1.5">
                  {sig.is_novel && <Zap className="w-3 h-3 text-purple-400" />}
                  <span className={`text-[9px] font-mono ${getSeverityColor(sig.severity)}`}>
                    {sig.signal_type.replace(/_/g, ' ').slice(0, 30)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[8px] text-zinc-500 font-mono">{sig.source_count} sources</span>
                  <span className="text-[8px] text-zinc-600 font-mono">sev: {(sig.severity * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM STATUS BAR */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-900/80 border-t border-zinc-800 text-[9px] font-mono text-zinc-500">
        <div className="flex items-center gap-4">
          <span>TOTAL TRACKS: {state.stats.total_tracks}</span>
          <span>NOVEL SIGNALS (24h): {state.stats.novel_signals_24h}</span>
          <span>20 AOIs MONITORED</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-emerald-500" />CLASSIFICATION: UNCLASSIFIED</span>
          <span><Clock className="w-3 h-3 inline" /> {new Date().toISOString().slice(0, 19)}Z</span>
        </div>
      </div>
    </div>
  );
}
