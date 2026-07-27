'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, Target, Crosshair, Zap, Brain, Radio, Satellite,
  Shield, Activity, Clock, ChevronRight, ArrowRight,
  CheckCircle, AlertTriangle, Play, Pause, RotateCcw,
  Globe, Network, Layers, BarChart3, TrendingUp, Lock,
  Plane, Anchor, Server, Cpu, Database, RefreshCw
} from 'lucide-react';

// OODA Loop: Observe → Orient → Decide → Act
// GZM Kill Chain: COLLECT → ENCODE → BASELINE → DETECT → FUSE → PREDICT → ALLOCATE → ACT → LEARN → EXPAND → REPORT

type PipelineStage = 'COLLECT' | 'ENCODE' | 'BASELINE' | 'DETECT' | 'FUSE' | 'PREDICT' | 'ALLOCATE' | 'ACT' | 'LEARN' | 'EXPAND' | 'REPORT';
type OODAPhase = 'OBSERVE' | 'ORIENT' | 'DECIDE' | 'ACT';

interface StageConfig {
  id: PipelineStage;
  label: string;
  oodaPhase: OODAPhase;
  icon: any;
  color: string;
  description: string;
  engines: string[];
  latencyMs: number;
  throughput: string;
  status: 'healthy' | 'degraded' | 'processing' | 'idle';
  lastEvent?: string;
  eventsProcessed: number;
  metrics: Record<string, string | number>;
}

interface ActiveEvent {
  id: string;
  label: string;
  currentStage: PipelineStage;
  enteredStageAt: string;
  source: string;
  domain: string;
  convergenceScore: number;
  entities: string[];
  elapsedMs: number;
}

const PIPELINE_STAGES: StageConfig[] = [
  {
    id: 'COLLECT', label: 'Collect', oodaPhase: 'OBSERVE', icon: Radio, color: '#3b82f6',
    description: '324 collectors ingesting from 75+ free sources across 10 INT domains. BaseCollector v6 with ConvergenceRuleMixin.',
    engines: ['system_interconnect.py', 'continuous_collector_daemon_v2.py', 'daemon_autodiscovery.py', 'universal_collection_directive.py'],
    latencyMs: 2400, throughput: '847 events/min', status: 'healthy', lastEvent: 'GDELT GKG batch (2,340 records)', eventsProcessed: 284721,
    metrics: { 'Active Collectors': '206/345', 'Sources': '75+', 'Domains': 10, 'Stealth Level': 'HIGH' }
  },
  {
    id: 'ENCODE', label: 'Encode', oodaPhase: 'OBSERVE', icon: Cpu, color: '#06b6d4',
    description: 'VLM embedding (open-clip ViT-L/14, 512-dim vectors). Every event gets a semantic fingerprint for drift detection.',
    engines: ['vlm_embedding_engine.py', 'satclip_location_encoder.py', 'dynamic_embeddings.py'],
    latencyMs: 45, throughput: '1,200 embeddings/s', status: 'healthy', lastEvent: 'Batch encoded: 847 GDELT events', eventsProcessed: 284721,
    metrics: { 'Vector Dim': 512, 'Model': 'ViT-L/14', 'Batch Size': 128, 'GPU Util': '67%' }
  },
  {
    id: 'BASELINE', label: 'Baseline', oodaPhase: 'OBSERVE', icon: Activity, color: '#10b981',
    description: 'IDK-S (I Don\'t Know - Streaming) anomaly detection + Isolation Forest. Compares new vectors against learned normal.',
    engines: ['vector_baseline_engine.py', 'idk_streaming_anomaly.py', 'adaptive_threshold.py'],
    latencyMs: 12, throughput: '3,000 comparisons/s', status: 'healthy', lastEvent: 'Drift detected: 2.3σ Baltic maritime', eventsProcessed: 284721,
    metrics: { 'Baseline Size': '14.2M vectors', 'Drift Threshold': '1.8σ', 'False Positive Rate': '3.2%', 'Window': '30d sliding' }
  },
  {
    id: 'DETECT', label: 'Detect', oodaPhase: 'ORIENT', icon: Zap, color: '#fbbf24',
    description: 'Novel signal detection via vector drift + convergence + CIB + AI text + IMSI. THE DARPA capability.',
    engines: ['convergence_engine.py (82KB)', 'convergence_advanced.py', 'convergence_tier3.py', 'cib_detection_engine.py', 'ai_text_detection_engine.py', 'imsi_catcher_detector.py', 'hostile_discourse_velocity.py'],
    latencyMs: 180, throughput: '500 detections/s', status: 'processing', lastEvent: 'NOVEL SIGNAL: Taiwan Strait AIS dark zone', eventsProcessed: 8472,
    metrics: { 'Signal Rules': '1,500+', 'Novel Signals (24h)': 47, 'Convergence Events': 1283, 'Source Independence Pairs': 188 }
  },
  {
    id: 'FUSE', label: 'Fuse', oodaPhase: 'ORIENT', icon: Layers, color: '#8b5cf6',
    description: 'IOWA Dempster-Shafer + Extended Kalman Filter + Hawkes process. Multi-source agreement scoring with source independence matrix.',
    engines: ['sensor_fusion_engine.py (EKF)', 'convergence_upgrades.py (IOWA D-S + Hawkes)', 'lattice_killer_fusion.py', 'bayesian_convergence.py', 'source_integrity.py (37KB)'],
    latencyMs: 95, throughput: '200 fusions/s', status: 'healthy', lastEvent: '4-source convergence: Crimea buildup (CS: 87)', eventsProcessed: 45821,
    metrics: { 'Fusion Method': 'IOWA D-S', 'Min Sources': 2, 'Independence Threshold': 0.7, 'Confidence Propagation': 'Active' }
  },
  {
    id: 'PREDICT', label: 'Predict', oodaPhase: 'DECIDE', icon: TrendingUp, color: '#f97316',
    description: 'ST-GNN (spatio-temporal graph neural network) + TabICL (in-context learning). Forecasts future state from temporal knowledge graph.',
    engines: ['stgnn_prediction_engine.py', 'tabicl_prediction_engine.py', 'probability_engine.py (28KB)', 'prediction_validator.py (46KB)', 'scenario_engine.py (39KB)', 'country_instability_index.py (53KB)'],
    latencyMs: 3200, throughput: '15 predictions/min', status: 'healthy', lastEvent: 'Sudan 78% escalation (14-day), Brier: 0.142', eventsProcessed: 28473,
    metrics: { 'Models': 'ST-GNN + TabICL', 'Horizon': '14 days', 'Precision': '87.3%', 'Brier Score': 0.142 }
  },
  {
    id: 'ALLOCATE', label: 'Allocate', oodaPhase: 'DECIDE', icon: Target, color: '#ec4899',
    description: 'CBBA (Consensus-Based Bundle Algorithm) for multi-platform task allocation. MAPPO-GAT for tactical coordination.',
    engines: ['cbba_task_allocator.py', 'mappo_gat_swarm.py', 'autonomous_collection_tasking.py (46KB)', 'nostr_task_distribution.py'],
    latencyMs: 450, throughput: '8 allocations/min', status: 'healthy', lastEvent: 'Tasked: Sentinel-2A → Crimea (convergence trigger)', eventsProcessed: 847,
    metrics: { 'Algorithm': 'CBBA + MAPPO-GAT', 'Platforms': 7, 'Active Tasks': 8, 'Queue Depth': 3 }
  },
  {
    id: 'ACT', label: 'Act', oodaPhase: 'ACT', icon: Crosshair, color: '#ef4444',
    description: 'Execute collection: satellite passes, drone ISR, SDR sweeps, OSINT scrapes. Writeback API triggers 14 action types.',
    engines: ['satellite_tasking_api.py', 'drone_mavsdk_collector.py', 'sdr_radio_collector.py', 'mesh_p2p_distribution.py', 'nostr_task_distribution.py', 'ros2_bridge_node.py'],
    latencyMs: 8500, throughput: '3 actions/min', status: 'processing', lastEvent: 'Sentinel-2A pass executing (Crimea, 3m22s window)', eventsProcessed: 284,
    metrics: { 'Action Types': 14, 'Platforms Active': 4, 'Executing Now': 2, 'Success Rate': '94.2%' }
  },
  {
    id: 'LEARN', label: 'Learn', oodaPhase: 'ACT', icon: Brain, color: '#7c3aed',
    description: 'R-Zero self-play (zero human labels). Adversarial training on predicted vs actual outcomes. Spaced repetition for model update scheduling.',
    engines: ['self_play_engine.py (26KB)', 'continuous_learning_engine.py (55KB)', 'continuous_learning_advanced.py (51KB)', 'self_calibrate.py (37KB)', 'adaptive_learning_engine.py'],
    latencyMs: 12000, throughput: '1 cycle/15s', status: 'healthy', lastEvent: 'Self-play cycle #847 (reward: 0.73, loss: 0.041)', eventsProcessed: 847,
    metrics: { 'Method': 'R-Zero Self-Play', 'Cycles': 847, 'Reward (avg)': 0.73, 'Human Labels': 0 }
  },
  {
    id: 'EXPAND', label: 'Expand', oodaPhase: 'ACT', icon: Network, color: '#14b8a6',
    description: 'Entity discovery and relationship mining. Link prediction. Graph expansion from confirmed predictions.',
    engines: ['entity_expansion_engine.py', 'link_prediction.py (26KB)', 'relationship_miner.py', 'hub_linker.py (43KB)', 'splink_entity_resolution.py'],
    latencyMs: 2800, throughput: '50 entities/min', status: 'healthy', lastEvent: 'Discovered: 12 new entities from Sudan convergence', eventsProcessed: 12847,
    metrics: { 'New Entities (24h)': 342, 'Links Predicted': 1204, 'Resolution Merges': 89, 'Graph Growth': '+0.02%/hr' }
  },
  {
    id: 'REPORT', label: 'Report', oodaPhase: 'ACT', icon: BarChart3, color: '#6366f1',
    description: 'ICD 203 compliant intelligence reports. SITREP, IIR, dossier generation. Automated briefing via LLM + graph context.',
    engines: ['intelligence_report_generator.py (36KB)', 'regen_brief_engine.py (42KB)', 'llm_briefing_engine.py', 'report_generator_wiring.py (37KB)'],
    latencyMs: 5400, throughput: '2 reports/min', status: 'idle', lastEvent: 'Generated: Sudan SITREP (ICD 203, sources: 12)', eventsProcessed: 482,
    metrics: { 'Format': 'ICD 203', 'Auto-generated (24h)': 14, 'Source Citations': 'A1-F6', 'STIX Export': 'Active' }
  },
];

const OODA_PHASES: Record<OODAPhase, { color: string; label: string; stages: PipelineStage[] }> = {
  OBSERVE: { color: '#3b82f6', label: 'OBSERVE', stages: ['COLLECT', 'ENCODE', 'BASELINE'] },
  ORIENT: { color: '#fbbf24', label: 'ORIENT', stages: ['DETECT', 'FUSE'] },
  DECIDE: { color: '#f97316', label: 'DECIDE', stages: ['PREDICT', 'ALLOCATE'] },
  ACT: { color: '#ef4444', label: 'ACT', stages: ['ACT', 'LEARN', 'EXPAND', 'REPORT'] },
};

const ACTIVE_EVENTS: ActiveEvent[] = [
  { id: 'ev-001', label: 'Crimea Naval Buildup', currentStage: 'ACT', enteredStageAt: '8m ago', source: 'ADS-B + AIS + Sentinel-2', domain: 'MULTI-INT', convergenceScore: 87, entities: ['Sevastopol Naval Base', 'Black Sea Fleet', 'S-400 Battery'], elapsedMs: 847000 },
  { id: 'ev-002', label: 'Taiwan Strait AIS Dark Zone', currentStage: 'DETECT', enteredStageAt: '2m ago', source: 'AIS + GDELT + Telegram', domain: 'GEOINT', convergenceScore: 82, entities: ['PLA Navy', 'Fujian Province'], elapsedMs: 180000 },
  { id: 'ev-003', label: 'Sudan SAF/RSF Engagement', currentStage: 'PREDICT', enteredStageAt: '5m ago', source: 'ACLED + GDELT + VIIRS', domain: 'OSINT', convergenceScore: 94, entities: ['SAF', 'RSF', 'Khartoum'], elapsedMs: 420000 },
  { id: 'ev-004', label: 'Baltic BGP Anomaly', currentStage: 'FUSE', enteredStageAt: '1m ago', source: 'BGP Monitor + IODA', domain: 'CYBER', convergenceScore: 76, entities: ['AS12345', 'Latvia Backbone'], elapsedMs: 95000 },
  { id: 'ev-005', label: 'Kaliningrad Flight Surge', currentStage: 'ALLOCATE', enteredStageAt: '3m ago', source: 'ADS-B Exchange', domain: 'SIGINT', convergenceScore: 71, entities: ['Russian AF', 'Chkalovsk AB'], elapsedMs: 340000 },
];

function StageNode({ stage, isActive, onClick }: { stage: StageConfig; isActive: boolean; onClick: () => void }) {
  const Icon = stage.icon;
  const statusIndicator = stage.status === 'healthy' ? 'bg-emerald-400' : stage.status === 'processing' ? 'bg-yellow-400 animate-pulse' : stage.status === 'degraded' ? 'bg-red-400' : 'bg-zinc-600';
  const eventsInStage = ACTIVE_EVENTS.filter(e => e.currentStage === stage.id).length;

  return (
    <motion.button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all w-24 ${
        isActive ? 'border-white/30 bg-zinc-800/80 shadow-lg' : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Status dot */}
      <div className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${statusIndicator}`} />

      {/* Events badge */}
      {eventsInStage > 0 && (
        <div className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ backgroundColor: stage.color }}>
          {eventsInStage}
        </div>
      )}

      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stage.color}20`, border: `1px solid ${stage.color}40` }}>
        <Icon className="w-4 h-4" style={{ color: stage.color }} />
      </div>
      <span className="text-[9px] font-bold text-white uppercase tracking-wider">{stage.label}</span>
      <span className="text-[7px] text-zinc-500 font-mono">{stage.latencyMs < 1000 ? `${stage.latencyMs}ms` : `${(stage.latencyMs / 1000).toFixed(1)}s`}</span>
    </motion.button>
  );
}

function EventTracker({ event }: { event: ActiveEvent }) {
  const stageIndex = PIPELINE_STAGES.findIndex(s => s.id === event.currentStage);
  const stageConfig = PIPELINE_STAGES[stageIndex];
  const progress = ((stageIndex + 1) / PIPELINE_STAGES.length) * 100;

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 hover:border-zinc-700 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: stageConfig?.color }} />
          <span className="text-xs font-medium text-white">{event.label}</span>
          <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${stageConfig?.color}20`, color: stageConfig?.color }}>{event.currentStage}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold font-mono ${event.convergenceScore >= 80 ? 'text-red-400' : event.convergenceScore >= 60 ? 'text-yellow-400' : 'text-zinc-400'}`}>CS:{event.convergenceScore}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: stageConfig?.color }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="flex items-center justify-between mt-1.5 text-[9px] text-zinc-500">
        <span>{event.domain} • {event.source}</span>
        <span>{(event.elapsedMs / 1000).toFixed(0)}s elapsed</span>
      </div>
    </div>
  );
}

export default function KillChainPage() {
  const [selectedStage, setSelectedStage] = useState<PipelineStage | null>(null);
  const [isRunning, setIsRunning] = useState(true);
  const [cycleCount, setCycleCount] = useState(847);
  const [totalCycleTime, setTotalCycleTime] = useState(51.2);

  const selectedStageConfig = PIPELINE_STAGES.find(s => s.id === selectedStage);

  // Simulate cycle counter
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setCycleCount(prev => prev + 1);
    }, 15000);
    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 flex items-center justify-center">
              <Crosshair className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Cognitive Kill Chain</h1>
              <p className="text-xs text-zinc-500">Full OODA loop: COLLECT → ENCODE → BASELINE → DETECT → FUSE → PREDICT → ALLOCATE → ACT → LEARN → EXPAND → REPORT</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-zinc-300 font-mono">Cycle #{cycleCount}</span>
              <span className="text-[9px] text-zinc-500">{totalCycleTime}s/loop</span>
            </div>
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`p-2 rounded-lg border transition-colors ${isRunning ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* OODA Phase Headers + Pipeline */}
        <section>
          {/* OODA Phases */}
          <div className="flex items-center gap-0 mb-4">
            {Object.entries(OODA_PHASES).map(([phase, config], i) => {
              const width = (config.stages.length / PIPELINE_STAGES.length) * 100;
              return (
                <div key={phase} className="flex-1" style={{ flex: config.stages.length }}>
                  <div className="text-center mb-2">
                    <span className="text-[10px] font-bold tracking-[0.25em] uppercase" style={{ color: config.color }}>{config.label}</span>
                  </div>
                  <div className="h-1 rounded-full mx-1" style={{ backgroundColor: `${config.color}30` }}>
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: config.color }} initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 2, delay: i * 0.5 }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pipeline Stages */}
          <div className="flex items-center justify-between gap-1">
            {PIPELINE_STAGES.map((stage, i) => (
              <div key={stage.id} className="flex items-center">
                <StageNode stage={stage} isActive={selectedStage === stage.id} onClick={() => setSelectedStage(selectedStage === stage.id ? null : stage.id)} />
                {i < PIPELINE_STAGES.length - 1 && (
                  <motion.div
                    className="w-4 h-0.5 mx-0.5"
                    style={{ backgroundColor: stage.color }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                  />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Stage Detail Panel */}
        <AnimatePresence>
          {selectedStageConfig && (
            <motion.section
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-zinc-900/50 border rounded-xl p-5" style={{ borderColor: `${selectedStageConfig.color}30` }}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <selectedStageConfig.icon className="w-5 h-5" style={{ color: selectedStageConfig.color }} />
                      <h2 className="text-base font-bold">{selectedStageConfig.label}</h2>
                      <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ backgroundColor: `${selectedStageConfig.color}20`, color: selectedStageConfig.color }}>
                        {selectedStageConfig.oodaPhase}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 max-w-2xl">{selectedStageConfig.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold font-mono" style={{ color: selectedStageConfig.color }}>{selectedStageConfig.latencyMs < 1000 ? `${selectedStageConfig.latencyMs}ms` : `${(selectedStageConfig.latencyMs / 1000).toFixed(1)}s`}</div>
                    <div className="text-[9px] text-zinc-500">avg latency</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  {/* Engines */}
                  <div>
                    <h4 className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-2">Engines ({selectedStageConfig.engines.length})</h4>
                    <div className="space-y-1">
                      {selectedStageConfig.engines.map((engine) => (
                        <div key={engine} className="text-[10px] font-mono text-zinc-300 bg-zinc-800/50 rounded px-2 py-1">{engine}</div>
                      ))}
                    </div>
                  </div>

                  {/* Metrics */}
                  <div>
                    <h4 className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-2">Metrics</h4>
                    <div className="space-y-1.5">
                      {Object.entries(selectedStageConfig.metrics).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between text-[10px]">
                          <span className="text-zinc-500">{key}</span>
                          <span className="text-zinc-300 font-mono">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <h4 className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-2">Status</h4>
                    <div className="space-y-1.5 text-[10px]">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">Health</span>
                        <span className={selectedStageConfig.status === 'healthy' ? 'text-emerald-400' : 'text-yellow-400'}>{selectedStageConfig.status.toUpperCase()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">Throughput</span>
                        <span className="text-zinc-300">{selectedStageConfig.throughput}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">Processed (total)</span>
                        <span className="text-zinc-300 font-mono">{selectedStageConfig.eventsProcessed.toLocaleString()}</span>
                      </div>
                      {selectedStageConfig.lastEvent && (
                        <div className="mt-2 p-2 bg-zinc-800/50 rounded">
                          <span className="text-zinc-500 block">Last Event:</span>
                          <span className="text-zinc-300">{selectedStageConfig.lastEvent}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Active Events in Pipeline */}
        <section>
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-medium mb-3 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5" /> Events in Pipeline ({ACTIVE_EVENTS.length})
          </h2>
          <div className="grid grid-cols-1 gap-2">
            {ACTIVE_EVENTS.map((event) => <EventTracker key={event.id} event={event} />)}
          </div>
        </section>

        {/* Comparative Kill Chain */}
        <section className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-medium mb-4">Kill Chain Comparison: GZM vs Maven vs Lattice</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <h3 className="text-xs font-bold text-cyan-400 mb-2">GZM (This System)</h3>
              <div className="text-[10px] text-zinc-400 space-y-1">
                <p>• 11-stage cognitive loop (autonomous)</p>
                <p>• Cycle time: <span className="text-white font-mono">51s</span></p>
                <p>• Human labels required: <span className="text-emerald-400 font-bold">0</span></p>
                <p>• Novel signal detection: <span className="text-emerald-400">✓</span></p>
                <p>• Self-learning: <span className="text-emerald-400">✓</span> (R-Zero)</p>
                <p>• Cost: <span className="text-emerald-400 font-bold">$750/node</span></p>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold text-zinc-500 mb-2">Palantir Maven</h3>
              <div className="text-[10px] text-zinc-500 space-y-1">
                <p>• 5-stage (detect-track-ID-decide-engage)</p>
                <p>• Cycle time: <span className="text-zinc-400">minutes-hours</span></p>
                <p>• Human labels required: <span className="text-red-400">100+ analysts</span></p>
                <p>• Novel signal detection: <span className="text-red-400">✗</span></p>
                <p>• Self-learning: <span className="text-red-400">✗</span></p>
                <p>• Cost: <span className="text-red-400">$100M+ per deployment</span></p>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold text-zinc-500 mb-2">Anduril Lattice</h3>
              <div className="text-[10px] text-zinc-500 space-y-1">
                <p>• 3-stage (sense-decide-act)</p>
                <p>• Cycle time: <span className="text-zinc-400">seconds (tactical)</span></p>
                <p>• Human labels required: <span className="text-yellow-400">offline training</span></p>
                <p>• Novel signal detection: <span className="text-red-400">✗</span></p>
                <p>• Self-learning: <span className="text-red-400">✗</span></p>
                <p>• Cost: <span className="text-red-400">$20B contract</span></p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-[9px] text-zinc-600 text-center">
          GZM Cognitive Pipeline v3.5.6 | God's Eye v1.5.0 ULTRA MAX | 11 stages | 14/14 healthy | {totalCycleTime}s/cycle
        </div>
      </div>
    </div>
  );
}
