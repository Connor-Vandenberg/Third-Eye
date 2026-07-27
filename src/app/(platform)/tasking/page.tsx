'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Satellite, Radio, Ship, Bot, Battery, MapPin, Clock, Target, Zap, Play, Pause, Square, ChevronRight, AlertTriangle, CheckCircle2, Circle, BarChart3, Layers, Crosshair, Send } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface Mission {
  id: string;
  platform_id: string;
  platform_type: 'drone' | 'satellite' | 'sdr' | 'ground_robot' | 'ship';
  platform_name: string;
  status: 'active' | 'queued' | 'completed' | 'aborted' | 'returning';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  aoi_id: string;
  aoi_name: string;
  target_lat: number;
  target_lon: number;
  trigger: string;
  trigger_signal_id: string;
  started: string;
  eta_complete: string;
  progress_pct: number;
  autonomous: boolean;
  waypoints: { lat: number; lon: number; alt: number; action: string }[];
  telemetry: { battery_pct: number; speed_kmh: number; altitude_m: number; signal_strength: number };
  cost_usd: number;
  roe_compliant: boolean;
}

interface Platform {
  id: string;
  type: 'drone' | 'satellite' | 'sdr' | 'ground_robot' | 'ship';
  name: string;
  status: 'idle' | 'active' | 'returning' | 'maintenance' | 'offline';
  lat: number;
  lon: number;
  battery_pct: number;
  coverage_radius_km: number;
  missions_completed: number;
  uptime_hours: number;
  current_mission_id: string | null;
}

interface ISRRequirement {
  id: string;
  source: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  target_description: string;
  aoi_id: string;
  lat: number;
  lon: number;
  required_sensor: string;
  status: 'pending' | 'allocated' | 'collecting' | 'fulfilled';
  created: string;
}

interface TaskingStats {
  active_missions: number;
  queued_missions: number;
  platforms_available: number;
  platforms_total: number;
  autonomous_rate_pct: number;
  coverage_gap_pct: number;
  total_cost_today_usd: number;
  avg_response_time_min: number;
  missions_completed_24h: number;
  cbba_allocations_24h: number;
}

// =============================================================================
// MOCK DATA
// =============================================================================

const MOCK_MISSIONS: Mission[] = [
  { id: 'msn_014', platform_id: 'drone_01', platform_type: 'drone', platform_name: 'Recon-Alpha', status: 'active', priority: 'CRITICAL', aoi_id: 'zaporizhzhia', aoi_name: 'Zaporizhzhia NPP', target_lat: 47.507, target_lon: 34.585, trigger: 'SATELLITE_SIGINT_OSINT_CONVERGENCE', trigger_signal_id: 'conv_001', started: new Date(Date.now() - 1200000).toISOString(), eta_complete: new Date(Date.now() + 1800000).toISOString(), progress_pct: 67, autonomous: true, waypoints: [{ lat: 47.5, lon: 34.5, alt: 120, action: 'transit' }, { lat: 47.507, lon: 34.585, alt: 80, action: 'loiter_observe' }, { lat: 47.51, lon: 34.59, alt: 80, action: 'image_capture' }], telemetry: { battery_pct: 68, speed_kmh: 45, altitude_m: 80, signal_strength: 92 }, cost_usd: 12.50, roe_compliant: true },
  { id: 'msn_015', platform_id: 'sat_s2a', platform_type: 'satellite', platform_name: 'Sentinel-2A', status: 'active', priority: 'HIGH', aoi_id: 'kaliningrad', aoi_name: 'Kaliningrad Oblast', target_lat: 54.7, target_lon: 20.5, trigger: 'MILITARY_BUILDUP_INDICATOR', trigger_signal_id: 'conv_003', started: new Date(Date.now() - 3600000).toISOString(), eta_complete: new Date(Date.now() + 7200000).toISOString(), progress_pct: 35, autonomous: true, waypoints: [], telemetry: { battery_pct: 100, speed_kmh: 27000, altitude_m: 786000, signal_strength: 100 }, cost_usd: 0, roe_compliant: true },
  { id: 'msn_016', platform_id: 'sdr_01', platform_type: 'sdr', platform_name: 'SDR-Crimea', status: 'active', priority: 'MEDIUM', aoi_id: 'crimea_bridge', aoi_name: 'Crimean Bridge', target_lat: 45.3, target_lon: 36.5, trigger: 'SCHEDULED_COLLECTION', trigger_signal_id: '', started: new Date(Date.now() - 7200000).toISOString(), eta_complete: new Date(Date.now() + 3600000).toISOString(), progress_pct: 80, autonomous: true, waypoints: [], telemetry: { battery_pct: 100, speed_kmh: 0, altitude_m: 0, signal_strength: 87 }, cost_usd: 0, roe_compliant: true },
  { id: 'msn_017', platform_id: 'drone_02', platform_type: 'drone', platform_name: 'Recon-Beta', status: 'queued', priority: 'HIGH', aoi_id: 'donbas', aoi_name: 'Donbas Front', target_lat: 48.1, target_lon: 37.9, trigger: 'NOVEL_SIGNAL', trigger_signal_id: 'ns_002', started: '', eta_complete: '', progress_pct: 0, autonomous: true, waypoints: [{ lat: 48.0, lon: 37.8, alt: 100, action: 'transit' }, { lat: 48.1, lon: 37.9, alt: 60, action: 'loiter_observe' }], telemetry: { battery_pct: 95, speed_kmh: 0, altitude_m: 0, signal_strength: 100 }, cost_usd: 0, roe_compliant: true },
];

const MOCK_PLATFORMS: Platform[] = [
  { id: 'drone_01', type: 'drone', name: 'Recon-Alpha', status: 'active', lat: 47.505, lon: 34.58, battery_pct: 68, coverage_radius_km: 5, missions_completed: 47, uptime_hours: 312, current_mission_id: 'msn_014' },
  { id: 'drone_02', type: 'drone', name: 'Recon-Beta', status: 'idle', lat: 48.0, lon: 37.8, battery_pct: 95, coverage_radius_km: 5, missions_completed: 31, uptime_hours: 248, current_mission_id: null },
  { id: 'sat_s2a', type: 'satellite', name: 'Sentinel-2A', status: 'active', lat: 54.0, lon: 20.0, battery_pct: 100, coverage_radius_km: 290, missions_completed: 892, uptime_hours: 52000, current_mission_id: 'msn_015' },
  { id: 'sdr_01', type: 'sdr', name: 'SDR-Crimea', status: 'active', lat: 45.3, lon: 36.4, battery_pct: 100, coverage_radius_km: 50, missions_completed: 1204, uptime_hours: 8760, current_mission_id: 'msn_016' },
  { id: 'robot_01', type: 'ground_robot', name: 'Scout-1', status: 'maintenance', lat: 47.5, lon: 34.5, battery_pct: 12, coverage_radius_km: 2, missions_completed: 8, uptime_hours: 94, current_mission_id: null },
];

const MOCK_ISR_QUEUE: ISRRequirement[] = [
  { id: 'isr_001', source: 'convergence_engine', priority: 'CRITICAL', target_description: 'Confirm vehicle column composition at Zaporizhzhia corridor', aoi_id: 'zaporizhzhia', lat: 47.51, lon: 34.59, required_sensor: 'EO/IR camera', status: 'collecting', created: new Date(Date.now() - 1800000).toISOString() },
  { id: 'isr_002', source: 'novel_signal_detector', priority: 'HIGH', target_description: 'Identify unknown RF emitter near Donbas front (2.4GHz anomaly)', aoi_id: 'donbas', lat: 48.1, lon: 37.9, required_sensor: 'SDR wideband', status: 'pending', created: new Date(Date.now() - 3600000).toISOString() },
  { id: 'isr_003', source: 'prediction_engine', priority: 'MEDIUM', target_description: 'Verify predicted troop staging at Kaliningrad rail terminus', aoi_id: 'kaliningrad', lat: 54.72, lon: 20.48, required_sensor: 'SAR satellite', status: 'allocated', created: new Date(Date.now() - 7200000).toISOString() },
  { id: 'isr_004', source: 'watchlist_tipper', priority: 'HIGH', target_description: 'Track watchlist entity movement south of Crimean Bridge', aoi_id: 'crimea_bridge', lat: 45.28, lon: 36.52, required_sensor: 'EO camera', status: 'pending', created: new Date(Date.now() - 900000).toISOString() },
];

const MOCK_STATS: TaskingStats = {
  active_missions: 3,
  queued_missions: 1,
  platforms_available: 2,
  platforms_total: 5,
  autonomous_rate_pct: 94,
  coverage_gap_pct: 12,
  total_cost_today_usd: 47.80,
  avg_response_time_min: 4.2,
  missions_completed_24h: 18,
  cbba_allocations_24h: 23,
};

// =============================================================================
// HELPERS
// =============================================================================

const PLATFORM_ICONS: Record<string, typeof Plane> = { drone: Plane, satellite: Satellite, sdr: Radio, ground_robot: Bot, ship: Ship };
const STATUS_COLORS: Record<string, string> = { active: '#22c55e', queued: '#f59e0b', completed: '#6b7280', aborted: '#ef4444', returning: '#3b82f6', idle: '#6b7280', maintenance: '#f97316', offline: '#ef4444' };
const PRIORITY_COLORS: Record<string, string> = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#f59e0b', LOW: '#3b82f6' };

// =============================================================================
// COMPONENT
// =============================================================================

export default function TaskingPage() {
  const [missions] = useState<Mission[]>(MOCK_MISSIONS);
  const [platforms] = useState<Platform[]>(MOCK_PLATFORMS);
  const [isrQueue] = useState<ISRRequirement[]>(MOCK_ISR_QUEUE);
  const [stats] = useState<TaskingStats>(MOCK_STATS);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [activeTab, setActiveTab] = useState<'missions' | 'platforms' | 'isr_queue'>('missions');

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Crosshair className="w-6 h-6 text-cyan-400" />
            Autonomous Tasking
          </h1>
          <p className="text-sm text-zinc-400 mt-1">CBBA + MAPPO-GAT: Intelligence-driven collection orchestration</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-500/20 border border-emerald-500/30">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-emerald-300">{stats.autonomous_rate_pct}% AUTONOMOUS</span>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-xs font-bold">
            <Send className="w-3.5 h-3.5" /> NEW MISSION
          </button>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Active', value: stats.active_missions.toString(), sub: `+${stats.queued_missions} queued`, icon: Play, color: 'text-emerald-400' },
          { label: 'Platforms', value: `${stats.platforms_available}/${stats.platforms_total}`, sub: 'available', icon: Layers, color: 'text-cyan-400' },
          { label: 'Completed (24h)', value: stats.missions_completed_24h.toString(), sub: `${stats.cbba_allocations_24h} CBBA allocs`, icon: CheckCircle2, color: 'text-blue-400' },
          { label: 'Avg Response', value: `${stats.avg_response_time_min}min`, sub: 'signal to action', icon: Clock, color: 'text-orange-400' },
          { label: 'Coverage Gap', value: `${stats.coverage_gap_pct}%`, sub: `$${stats.total_cost_today_usd.toFixed(2)} today`, icon: Target, color: 'text-red-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
              <span className="text-[10px] font-mono text-zinc-500 uppercase">{stat.label}</span>
            </div>
            <span className="text-xl font-bold font-mono">{stat.value}</span>
            <span className="text-[9px] font-mono text-zinc-500 ml-2">{stat.sub}</span>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div className="flex items-center gap-1 mb-4 border-b border-zinc-800 pb-2">
        {(['missions', 'platforms', 'isr_queue'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1.5 rounded-t text-xs font-mono ${activeTab === tab ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 border-b-zinc-800' : 'text-zinc-500 hover:text-zinc-300'}`}>
            {tab === 'isr_queue' ? 'ISR QUEUE' : tab.toUpperCase()} ({tab === 'missions' ? missions.length : tab === 'platforms' ? platforms.length : isrQueue.length})
          </button>
        ))}
      </div>

      {/* MISSIONS TAB */}
      {activeTab === 'missions' && (
        <div className="space-y-2">
          {missions.map(msn => {
            const Icon = PLATFORM_ICONS[msn.platform_type] || Plane;
            return (
              <motion.div key={msn.id} className={`bg-zinc-900 border rounded-lg p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors ${selectedMission?.id === msn.id ? 'border-cyan-500/50' : 'border-zinc-800'}`} onClick={() => setSelectedMission(selectedMission?.id === msn.id ? null : msn)} layout>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" style={{ color: STATUS_COLORS[msn.status] }} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{msn.platform_name}</span>
                        <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: PRIORITY_COLORS[msn.priority] + '33', color: PRIORITY_COLORS[msn.priority] }}>{msn.priority}</span>
                        <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: STATUS_COLORS[msn.status] + '33', color: STATUS_COLORS[msn.status] }}>{msn.status.toUpperCase()}</span>
                        {msn.autonomous && <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">AUTO</span>}
                        {msn.roe_compliant && <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">ROE OK</span>}
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">{msn.aoi_name} | Trigger: {msn.trigger.replace(/_/g, ' ').slice(0, 35)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {msn.status === 'active' && (
                      <div className="w-32">
                        <div className="flex justify-between text-[8px] font-mono text-zinc-500 mb-0.5">
                          <span>{msn.progress_pct}%</span>
                          <span>ETA {new Date(msn.eta_complete).toLocaleTimeString()}</span>
                        </div>
                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${msn.progress_pct}%` }} />
                        </div>
                      </div>
                    )}
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-[9px] font-mono text-zinc-500">
                        <Battery className="w-3 h-3" />{msn.telemetry.battery_pct}%
                      </div>
                      {msn.cost_usd > 0 && <span className="text-[9px] font-mono text-zinc-600">${msn.cost_usd.toFixed(2)}</span>}
                    </div>
                  </div>
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {selectedMission?.id === msn.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-3 pt-3 border-t border-zinc-800">
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <span className="text-[9px] font-mono text-zinc-500 block mb-1">TELEMETRY</span>
                          <div className="space-y-0.5 text-[10px] font-mono text-zinc-300">
                            <div>Speed: {msn.telemetry.speed_kmh} km/h</div>
                            <div>Alt: {msn.telemetry.altitude_m}m</div>
                            <div>Signal: {msn.telemetry.signal_strength}%</div>
                            <div>Battery: {msn.telemetry.battery_pct}%</div>
                          </div>
                        </div>
                        <div>
                          <span className="text-[9px] font-mono text-zinc-500 block mb-1">WAYPOINTS ({msn.waypoints.length})</span>
                          {msn.waypoints.map((wp, i) => (
                            <div key={i} className="text-[9px] font-mono text-zinc-400 flex items-center gap-1">
                              <Circle className="w-2 h-2" />{wp.action} ({wp.lat.toFixed(3)}, {wp.lon.toFixed(3)}) @{wp.alt}m
                            </div>
                          ))}
                        </div>
                        <div>
                          <span className="text-[9px] font-mono text-zinc-500 block mb-1">TARGET</span>
                          <div className="text-[10px] font-mono text-zinc-300">
                            <div>Lat: {msn.target_lat.toFixed(4)}</div>
                            <div>Lon: {msn.target_lon.toFixed(4)}</div>
                            <div>AOI: {msn.aoi_name}</div>
                          </div>
                        </div>
                        <div>
                          <span className="text-[9px] font-mono text-zinc-500 block mb-1">ACTIONS</span>
                          <div className="space-y-1">
                            <button className="w-full text-[9px] px-2 py-1 rounded bg-red-600/30 text-red-300 hover:bg-red-600/50 font-mono flex items-center gap-1"><Square className="w-3 h-3" />ABORT</button>
                            <button className="w-full text-[9px] px-2 py-1 rounded bg-yellow-600/30 text-yellow-300 hover:bg-yellow-600/50 font-mono flex items-center gap-1"><Pause className="w-3 h-3" />HOLD</button>
                            <button className="w-full text-[9px] px-2 py-1 rounded bg-blue-600/30 text-blue-300 hover:bg-blue-600/50 font-mono flex items-center gap-1"><MapPin className="w-3 h-3" />RETARGET</button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* PLATFORMS TAB */}
      {activeTab === 'platforms' && (
        <div className="grid grid-cols-2 gap-3">
          {platforms.map(p => {
            const Icon = PLATFORM_ICONS[p.type] || Bot;
            return (
              <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5" style={{ color: STATUS_COLORS[p.status] }} />
                    <span className="text-sm font-bold">{p.name}</span>
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: STATUS_COLORS[p.status] + '33', color: STATUS_COLORS[p.status] }}>{p.status.toUpperCase()}</span>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-500">{p.type}</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-[10px] font-mono text-zinc-400">
                  <div><Battery className="w-3 h-3 inline" /> {p.battery_pct}%</div>
                  <div><Target className="w-3 h-3 inline" /> {p.coverage_radius_km}km</div>
                  <div><CheckCircle2 className="w-3 h-3 inline" /> {p.missions_completed} msns</div>
                  <div><Clock className="w-3 h-3 inline" /> {p.uptime_hours}h</div>
                </div>
                <div className="mt-2 flex items-center gap-2 text-[9px] font-mono text-zinc-500">
                  <MapPin className="w-3 h-3" />{p.lat.toFixed(3)}, {p.lon.toFixed(3)}
                  {p.current_mission_id && <span className="text-cyan-400">MSN: {p.current_mission_id}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ISR QUEUE TAB */}
      {activeTab === 'isr_queue' && (
        <div className="space-y-2">
          <div className="text-[10px] font-mono text-zinc-500 mb-2">Intelligence requirements awaiting collection platform allocation (CBBA)</div>
          {isrQueue.map(req => (
            <div key={req.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[req.priority] }} />
                  <span className="text-xs font-medium">{req.target_description}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">{req.required_sensor}</span>
                  <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: req.status === 'collecting' ? '#22c55e33' : req.status === 'allocated' ? '#3b82f633' : '#f59e0b33', color: req.status === 'collecting' ? '#22c55e' : req.status === 'allocated' ? '#3b82f6' : '#f59e0b' }}>{req.status.toUpperCase()}</span>
                </div>
              </div>
              <div className="mt-1 flex items-center gap-3 text-[9px] font-mono text-zinc-500">
                <span>Source: {req.source}</span>
                <span>AOI: {req.aoi_id}</span>
                <span>{new Date(req.created).toLocaleTimeString()}</span>
                {req.status === 'pending' && <button className="ml-auto text-[9px] px-2 py-0.5 rounded bg-cyan-600/30 text-cyan-300 hover:bg-cyan-600/50">ALLOCATE NOW</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
