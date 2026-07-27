'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Satellite, Eye, AlertTriangle, TreePine, Construction, Flame, Waves, Shield, Camera, Layers, Clock, Globe, ChevronRight, Crosshair, Zap, TrendingDown, TrendingUp } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface AOIStatus {
  aoi_id: string;
  name: string;
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
  lat: number;
  lng: number;
  last_observation: string;
  baseline_observations: number;
  cloud_cover_pct: number;
  change_detected: boolean;
  change_type: string | null;
  change_area_m2: number;
  confidence: number;
  military_objects: number;
  camouflage_alerts: number;
}

interface ChangeResult {
  id: string;
  aoi_id: string;
  aoi_name: string;
  change_type: string;
  change_area_m2: number;
  confidence: number;
  ndvi_delta: number;
  bsi_delta: number;
  nbr_delta: number;
  max_z_score: number;
  description: string;
  military_objects: { class: string; count: number }[];
  timestamp: string;
  acquisition_date: string;
  camouflage_detected: boolean;
}

interface DeviationAlert {
  aoi_id: string;
  aoi_name: string;
  actual: number;
  expected: number;
  z_score: number;
  direction: string;
  interpretation: string;
}

// =============================================================================
// MOCK DATA
// =============================================================================

const MOCK_AOIS: AOIStatus[] = [
  { aoi_id: 'zaporizhzhia', name: 'Zaporizhzhia NPP', priority: 'CRITICAL', lat: 47.5, lng: 34.6, last_observation: '2026-07-26', baseline_observations: 47, cloud_cover_pct: 8, change_detected: true, change_type: 'CONSTRUCTION', change_area_m2: 4200, confidence: 0.87, military_objects: 3, camouflage_alerts: 1 },
  { aoi_id: 'crimea_bridge', name: 'Crimean Bridge', priority: 'CRITICAL', lat: 45.3, lng: 36.5, last_observation: '2026-07-25', baseline_observations: 52, cloud_cover_pct: 12, change_detected: false, change_type: null, change_area_m2: 0, confidence: 0, military_objects: 0, camouflage_alerts: 0 },
  { aoi_id: 'kaliningrad', name: 'Kaliningrad Oblast', priority: 'HIGH', lat: 54.7, lng: 20.5, last_observation: '2026-07-26', baseline_observations: 38, cloud_cover_pct: 22, change_detected: true, change_type: 'VEHICLE_STAGING', change_area_m2: 18500, confidence: 0.79, military_objects: 12, camouflage_alerts: 0 },
  { aoi_id: 'natanz', name: 'Natanz Nuclear', priority: 'CRITICAL', lat: 33.7, lng: 51.7, last_observation: '2026-07-24', baseline_observations: 41, cloud_cover_pct: 3, change_detected: true, change_type: 'SOIL_DISTURBANCE', change_area_m2: 2800, confidence: 0.91, military_objects: 0, camouflage_alerts: 2 },
  { aoi_id: 'donbas', name: 'Donbas Front', priority: 'CRITICAL', lat: 48.0, lng: 38.0, last_observation: '2026-07-26', baseline_observations: 55, cloud_cover_pct: 15, change_detected: true, change_type: 'BURN_SCAR', change_area_m2: 45000, confidence: 0.94, military_objects: 8, camouflage_alerts: 0 },
  { aoi_id: 'taiwan_strait', name: 'Taiwan Strait', priority: 'HIGH', lat: 24.5, lng: 119.0, last_observation: '2026-07-25', baseline_observations: 33, cloud_cover_pct: 45, change_detected: false, change_type: null, change_area_m2: 0, confidence: 0, military_objects: 0, camouflage_alerts: 0 },
  { aoi_id: 'hmeimim', name: 'Hmeimim Air Base', priority: 'HIGH', lat: 35.4, lng: 35.95, last_observation: '2026-07-26', baseline_observations: 44, cloud_cover_pct: 5, change_detected: true, change_type: 'INFRASTRUCTURE_NEW', change_area_m2: 8900, confidence: 0.82, military_objects: 6, camouflage_alerts: 1 },
  { aoi_id: 'gaza', name: 'Gaza Border', priority: 'CRITICAL', lat: 31.3, lng: 34.3, last_observation: '2026-07-26', baseline_observations: 61, cloud_cover_pct: 2, change_detected: true, change_type: 'INFRASTRUCTURE_DAMAGED', change_area_m2: 92000, confidence: 0.96, military_objects: 0, camouflage_alerts: 0 },
];

const MOCK_CHANGES: ChangeResult[] = [
  { id: 'chg_001', aoi_id: 'donbas', aoi_name: 'Donbas Front', change_type: 'BURN_SCAR', change_area_m2: 45000, confidence: 0.94, ndvi_delta: -4.2, bsi_delta: 2.1, nbr_delta: -5.8, max_z_score: 7.3, description: 'Burn scar detected at Donbas Front (possible strike BDA), affecting approximately 4.5 hectares, with high confidence. NBR decrease of 5.8 sigma from baseline. Source: Sentinel-2 MSI, 55 baseline observations.', military_objects: [{ class: 'crater', count: 8 }], timestamp: new Date().toISOString(), acquisition_date: '2026-07-26', camouflage_detected: false },
  { id: 'chg_002', aoi_id: 'kaliningrad', aoi_name: 'Kaliningrad Oblast', change_type: 'VEHICLE_STAGING', change_area_m2: 18500, confidence: 0.79, ndvi_delta: -1.8, bsi_delta: 3.2, nbr_delta: -0.3, max_z_score: 4.1, description: 'Vehicle staging area changes at Kaliningrad Oblast, affecting approximately 1.9 hectares, with moderate confidence. Bare soil index increase of 3.2 sigma. Military objects detected: 12 vehicles.', military_objects: [{ class: 'tank', count: 5 }, { class: 'APC', count: 4 }, { class: 'truck', count: 3 }], timestamp: new Date(Date.now() - 3600000).toISOString(), acquisition_date: '2026-07-26', camouflage_detected: false },
  { id: 'chg_003', aoi_id: 'natanz', aoi_name: 'Natanz Nuclear', change_type: 'SOIL_DISTURBANCE', change_area_m2: 2800, confidence: 0.91, ndvi_delta: -2.9, bsi_delta: 4.7, nbr_delta: -0.5, max_z_score: 5.9, description: 'Soil disturbance (possible trenching/earthworks) at Natanz Nuclear, affecting approximately 2800 m\u00b2, with high confidence. BSI increase of 4.7 sigma indicates fresh excavation. Camouflage nets detected over 2 areas.', military_objects: [], timestamp: new Date(Date.now() - 7200000).toISOString(), acquisition_date: '2026-07-24', camouflage_detected: true },
];

const MOCK_DEVIATIONS: DeviationAlert[] = [
  { aoi_id: 'natanz', aoi_name: 'Natanz Nuclear', actual: 0.42, expected: 0.28, z_score: 4.2, direction: 'accelerating', interpretation: 'Activity EXCEEDING normal trajectory (possible acceleration of underground facility construction)' },
  { aoi_id: 'kaliningrad', aoi_name: 'Kaliningrad', actual: 0.38, expected: 0.22, z_score: 3.5, direction: 'accelerating', interpretation: 'Vehicle count growth rate exceeds historical pattern (possible unannounced mobilization)' },
];

// =============================================================================
// HELPERS
// =============================================================================

const CHANGE_ICONS: Record<string, typeof TreePine> = { VEGETATION_LOSS: TreePine, CONSTRUCTION: Construction, BURN_SCAR: Flame, SOIL_DISTURBANCE: Layers, VEHICLE_STAGING: Crosshair, WATER_CHANGE: Waves, INFRASTRUCTURE_NEW: Construction, INFRASTRUCTURE_DAMAGED: AlertTriangle, CAMOUFLAGE_DETECTED: Shield };
const CHANGE_COLORS: Record<string, string> = { VEGETATION_LOSS: '#22c55e', CONSTRUCTION: '#f59e0b', BURN_SCAR: '#ef4444', SOIL_DISTURBANCE: '#a855f7', VEHICLE_STAGING: '#f97316', WATER_CHANGE: '#3b82f6', INFRASTRUCTURE_NEW: '#eab308', INFRASTRUCTURE_DAMAGED: '#dc2626', CAMOUFLAGE_DETECTED: '#6366f1' };
const PRIORITY_COLORS: Record<string, string> = { CRITICAL: '#ef4444', HIGH: '#f97316', NORMAL: '#3b82f6', LOW: '#6b7280' };

// =============================================================================
// COMPONENT
// =============================================================================

export default function SatellitesPage() {
  const [selectedAOI, setSelectedAOI] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'aois' | 'changes' | 'deviations'>('aois');

  const aoisWithChanges = MOCK_AOIS.filter(a => a.change_detected).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Satellite className="w-6 h-6 text-blue-400" />
            Satellite Intelligence
          </h1>
          <p className="text-sm text-zinc-400 mt-1">Sentinel-2 Multi-Spectral Change Detection | 20 AOIs | {MOCK_AOIS.reduce((s, a) => s + a.baseline_observations, 0)} total observations</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded bg-red-500/20 border border-red-500/30">
            <span className="text-xs font-mono text-red-300">{aoisWithChanges} AOIs with changes</span>
          </div>
          <button className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-xs font-bold">ORDER IMAGERY</button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { label: 'AOIs Monitored', value: '20', icon: Globe, color: 'text-blue-400' },
          { label: 'Changes (7d)', value: MOCK_CHANGES.length.toString(), icon: Eye, color: 'text-red-400' },
          { label: 'Military Objects', value: MOCK_AOIS.reduce((s, a) => s + a.military_objects, 0).toString(), icon: Crosshair, color: 'text-orange-400' },
          { label: 'Camouflage Alerts', value: MOCK_AOIS.reduce((s, a) => s + a.camouflage_alerts, 0).toString(), icon: Shield, color: 'text-purple-400' },
          { label: 'Deviations', value: MOCK_DEVIATIONS.length.toString(), icon: Zap, color: 'text-yellow-400' },
        ].map(s => (
          <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1"><s.icon className={`w-3.5 h-3.5 ${s.color}`} /><span className="text-[10px] font-mono text-zinc-500 uppercase">{s.label}</span></div>
            <span className="text-xl font-bold font-mono">{s.value}</span>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div className="flex gap-1 mb-4 border-b border-zinc-800 pb-2">
        {(['aois', 'changes', 'deviations'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1.5 rounded-t text-xs font-mono ${activeTab === tab ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 border-b-zinc-800' : 'text-zinc-500 hover:text-zinc-300'}`}>
            {tab === 'aois' ? `AOI STATUS (${MOCK_AOIS.length})` : tab === 'changes' ? `CHANGES (${MOCK_CHANGES.length})` : `DEVIATIONS (${MOCK_DEVIATIONS.length})`}
          </button>
        ))}
      </div>

      {/* AOI STATUS */}
      {activeTab === 'aois' && (
        <div className="grid grid-cols-2 gap-3">
          {MOCK_AOIS.map(aoi => {
            const ChangeIcon = aoi.change_type ? (CHANGE_ICONS[aoi.change_type] || Eye) : Eye;
            return (
              <div key={aoi.aoi_id} className={`bg-zinc-900 border rounded-lg p-4 ${aoi.change_detected ? 'border-red-500/30' : 'border-zinc-800'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[aoi.priority] }} />
                    <span className="text-sm font-bold">{aoi.name}</span>
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: PRIORITY_COLORS[aoi.priority] + '22', color: PRIORITY_COLORS[aoi.priority] }}>{aoi.priority}</span>
                  </div>
                  {aoi.change_detected && <ChangeIcon className="w-4 h-4" style={{ color: CHANGE_COLORS[aoi.change_type || ''] }} />}
                </div>
                <div className="grid grid-cols-3 gap-2 text-[9px] font-mono text-zinc-500">
                  <span><Clock className="w-3 h-3 inline" /> {aoi.last_observation}</span>
                  <span><Layers className="w-3 h-3 inline" /> {aoi.baseline_observations} obs</span>
                  <span><Camera className="w-3 h-3 inline" /> {aoi.cloud_cover_pct}% cloud</span>
                </div>
                {aoi.change_detected && (
                  <div className="mt-2 p-2 bg-zinc-800/50 rounded">
                    <div className="flex items-center gap-2 text-[10px] font-mono">
                      <span style={{ color: CHANGE_COLORS[aoi.change_type || ''] }}>{aoi.change_type?.replace(/_/g, ' ')}</span>
                      <span className="text-zinc-500">|</span>
                      <span className="text-zinc-400">{aoi.change_area_m2 > 10000 ? `${(aoi.change_area_m2 / 10000).toFixed(1)} ha` : `${aoi.change_area_m2} m\u00b2`}</span>
                      <span className="text-zinc-500">|</span>
                      <span className="text-zinc-400">{(aoi.confidence * 100).toFixed(0)}% conf</span>
                      {aoi.military_objects > 0 && <span className="text-orange-400">{aoi.military_objects} mil obj</span>}
                      {aoi.camouflage_alerts > 0 && <span className="text-purple-400">{aoi.camouflage_alerts} camo</span>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CHANGE RESULTS */}
      {activeTab === 'changes' && (
        <div className="space-y-3">
          {MOCK_CHANGES.map(chg => {
            const Icon = CHANGE_ICONS[chg.change_type] || Eye;
            return (
              <div key={chg.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5" style={{ color: CHANGE_COLORS[chg.change_type] }} />
                    <span className="text-sm font-bold">{chg.change_type.replace(/_/g, ' ')}</span>
                    <span className="text-[9px] font-mono text-zinc-500">{chg.aoi_name}</span>
                    {chg.camouflage_detected && <span className="text-[8px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">CAMO DETECTED</span>}
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">{chg.acquisition_date}</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed mb-3">{chg.description}</p>
                <div className="grid grid-cols-5 gap-3 text-[9px] font-mono">
                  <div className="text-center"><span className="text-zinc-500 block">NDVI \u0394</span><span className={chg.ndvi_delta < 0 ? 'text-red-400' : 'text-emerald-400'}>{chg.ndvi_delta > 0 ? '+' : ''}{chg.ndvi_delta.toFixed(1)}\u03c3</span></div>
                  <div className="text-center"><span className="text-zinc-500 block">BSI \u0394</span><span className={chg.bsi_delta > 0 ? 'text-orange-400' : 'text-emerald-400'}>{chg.bsi_delta > 0 ? '+' : ''}{chg.bsi_delta.toFixed(1)}\u03c3</span></div>
                  <div className="text-center"><span className="text-zinc-500 block">NBR \u0394</span><span className={chg.nbr_delta < 0 ? 'text-red-400' : 'text-emerald-400'}>{chg.nbr_delta > 0 ? '+' : ''}{chg.nbr_delta.toFixed(1)}\u03c3</span></div>
                  <div className="text-center"><span className="text-zinc-500 block">Max Z</span><span className="text-yellow-400">{chg.max_z_score.toFixed(1)}</span></div>
                  <div className="text-center"><span className="text-zinc-500 block">Conf</span><span className="text-emerald-400">{(chg.confidence * 100).toFixed(0)}%</span></div>
                </div>
                {chg.military_objects.length > 0 && (
                  <div className="mt-2 flex gap-2">
                    {chg.military_objects.map(obj => (
                      <span key={obj.class} className="text-[9px] px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 font-mono">{obj.count}x {obj.class}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* DEVIATIONS (SIAD/JEPA) */}
      {activeTab === 'deviations' && (
        <div className="space-y-3">
          <p className="text-[11px] text-zinc-500 font-mono mb-2">SIAD/JEPA counterfactual: comparing actual evolution against predicted trajectory. Deviations indicate activity that shouldn't be happening based on learned patterns.</p>
          {MOCK_DEVIATIONS.map(dev => (
            <div key={dev.aoi_id} className="bg-zinc-900 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {dev.direction === 'accelerating' ? <TrendingUp className="w-5 h-5 text-red-400" /> : <TrendingDown className="w-5 h-5 text-blue-400" />}
                  <span className="text-sm font-bold">{dev.aoi_name}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300">{dev.z_score.toFixed(1)} SIGMA DEVIATION</span>
                </div>
                <span className="text-xs font-mono text-red-400 uppercase">{dev.direction}</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed mb-2">{dev.interpretation}</p>
              <div className="flex gap-4 text-[9px] font-mono text-zinc-500">
                <span>Expected: {dev.expected.toFixed(3)}</span>
                <span>Actual: <span className="text-red-400">{dev.actual.toFixed(3)}</span></span>
                <span>Deviation: {dev.z_score.toFixed(1)} sigma</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
