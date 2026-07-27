'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crosshair, CheckCircle, Clock, AlertTriangle, XCircle,
  Play, Pause, RotateCcw, ChevronRight, Eye, Radio,
  Satellite, Plane, Anchor, Target, Zap, Brain, Shield,
  ArrowRight, Activity, Filter, Search
} from 'lucide-react';

type TaskStatus = 'created' | 'queued' | 'assigned' | 'executing' | 'confirming' | 'complete' | 'failed' | 'cancelled';

interface TaskLifecycle {
  id: string;
  name: string;
  type: 'satellite_pass' | 'drone_mission' | 'sigint_collection' | 'osint_scrape' | 'cyber_scan' | 'prediction_run';
  status: TaskStatus;
  priority: 'critical' | 'high' | 'medium' | 'low';
  assignedPlatform?: string;
  targetEntity?: string;
  aoi: string;
  createdAt: string;
  transitions: Array<{
    from: TaskStatus;
    to: TaskStatus;
    timestamp: string;
    actor: string;
    notes?: string;
  }>;
  convergenceScore?: number;
  confidence?: number;
  result?: string;
}

const STATUS_CONFIG: Record<TaskStatus, { color: string; bgColor: string; icon: any; label: string }> = {
  created: { color: '#6b7280', bgColor: 'rgba(107,114,128,0.1)', icon: Clock, label: 'Created' },
  queued: { color: '#3b82f6', bgColor: 'rgba(59,130,246,0.1)', icon: Clock, label: 'Queued' },
  assigned: { color: '#8b5cf6', bgColor: 'rgba(139,92,246,0.1)', icon: Target, label: 'Assigned' },
  executing: { color: '#f59e0b', bgColor: 'rgba(245,158,11,0.1)', icon: Play, label: 'Executing' },
  confirming: { color: '#06b6d4', bgColor: 'rgba(6,182,212,0.1)', icon: Eye, label: 'Confirming' },
  complete: { color: '#10b981', bgColor: 'rgba(16,185,129,0.1)', icon: CheckCircle, label: 'Complete' },
  failed: { color: '#ef4444', bgColor: 'rgba(239,68,68,0.1)', icon: XCircle, label: 'Failed' },
  cancelled: { color: '#71717a', bgColor: 'rgba(113,113,122,0.1)', icon: XCircle, label: 'Cancelled' },
};

const TASK_TYPE_ICONS: Record<string, any> = {
  satellite_pass: Satellite,
  drone_mission: Plane,
  sigint_collection: Radio,
  osint_scrape: Eye,
  cyber_scan: Shield,
  prediction_run: Brain,
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#fbbf24',
  low: '#6b7280',
};

const STATUS_FLOW: TaskStatus[] = ['created', 'queued', 'assigned', 'executing', 'confirming', 'complete'];

const MOCK_TASKS: TaskLifecycle[] = [
  {
    id: 'task-001', name: 'Sentinel-2 Pass: Crimea Military Base', type: 'satellite_pass',
    status: 'executing', priority: 'critical', assignedPlatform: 'Sentinel-2A (Orbit 47832)',
    targetEntity: 'Sevastopol Naval Base', aoi: 'Crimea', createdAt: '14m ago',
    transitions: [
      { from: 'created', to: 'queued', timestamp: '14m ago', actor: 'CBBA Allocator' },
      { from: 'queued', to: 'assigned', timestamp: '12m ago', actor: 'Satellite Tasking API' },
      { from: 'assigned', to: 'executing', timestamp: '8m ago', actor: 'Sentinel-2A', notes: 'Pass window: 3min 22s' },
    ],
    convergenceScore: 87, confidence: 82,
  },
  {
    id: 'task-002', name: 'ADS-B Surveillance: Kaliningrad Airspace', type: 'sigint_collection',
    status: 'complete', priority: 'high', assignedPlatform: 'EDGE-SIGINT Node',
    targetEntity: 'Kaliningrad Military Flights', aoi: 'Kaliningrad', createdAt: '45m ago',
    transitions: [
      { from: 'created', to: 'queued', timestamp: '45m ago', actor: 'Convergence Engine' },
      { from: 'queued', to: 'assigned', timestamp: '44m ago', actor: 'CBBA Allocator' },
      { from: 'assigned', to: 'executing', timestamp: '43m ago', actor: 'EDGE-SIGINT' },
      { from: 'executing', to: 'confirming', timestamp: '15m ago', actor: 'EDGE-SIGINT', notes: '129 military flights detected' },
      { from: 'confirming', to: 'complete', timestamp: '5m ago', actor: 'Prediction Validator', notes: 'Confirmed: 340% above baseline' },
    ],
    convergenceScore: 71, confidence: 94, result: '129 military flights, 340% above 30-day baseline',
  },
  {
    id: 'task-003', name: 'OSINT Sweep: Sudan Telegram Channels', type: 'osint_scrape',
    status: 'assigned', priority: 'high', assignedPlatform: 'Telegram Collector v2',
    targetEntity: 'SAF/RSF Information Ops', aoi: 'Sudan', createdAt: '8m ago',
    transitions: [
      { from: 'created', to: 'queued', timestamp: '8m ago', actor: 'Novel Signal Detector' },
      { from: 'queued', to: 'assigned', timestamp: '6m ago', actor: 'CBBA Allocator' },
    ],
    convergenceScore: 94,
  },
  {
    id: 'task-004', name: 'BGP Hijack Investigation: Baltic ASNs', type: 'cyber_scan',
    status: 'confirming', priority: 'medium', assignedPlatform: 'BGP Monitor Engine',
    targetEntity: 'AS12345 Route Anomaly', aoi: 'Baltic Sea', createdAt: '32m ago',
    transitions: [
      { from: 'created', to: 'queued', timestamp: '32m ago', actor: 'BGP Hijack Detector' },
      { from: 'queued', to: 'assigned', timestamp: '31m ago', actor: 'CBBA Allocator' },
      { from: 'assigned', to: 'executing', timestamp: '30m ago', actor: 'BGP Monitor' },
      { from: 'executing', to: 'confirming', timestamp: '10m ago', actor: 'BGP Monitor', notes: 'Suspicious AS path change detected' },
    ],
    convergenceScore: 76, confidence: 71,
  },
  {
    id: 'task-005', name: 'ST-GNN Forecast: South China Sea (14-day)', type: 'prediction_run',
    status: 'complete', priority: 'medium', assignedPlatform: 'ST-GNN Engine + TabICL',
    targetEntity: 'SCS Escalation Probability', aoi: 'South China Sea', createdAt: '1h ago',
    transitions: [
      { from: 'created', to: 'queued', timestamp: '1h ago', actor: 'Scheduled (daily)' },
      { from: 'queued', to: 'assigned', timestamp: '58m ago', actor: 'Pipeline Wiring v2' },
      { from: 'assigned', to: 'executing', timestamp: '57m ago', actor: 'ST-GNN Engine' },
      { from: 'executing', to: 'confirming', timestamp: '42m ago', actor: 'TabICL Ensemble' },
      { from: 'confirming', to: 'complete', timestamp: '38m ago', actor: 'Prediction Validator', notes: 'Brier: 0.14, calibrated' },
    ],
    convergenceScore: 82, confidence: 87, result: '62% escalation probability (14-day), Brier: 0.142',
  },
  {
    id: 'task-006', name: 'Drone ISR: Bab-el-Mandeb Strait', type: 'drone_mission',
    status: 'failed', priority: 'high', assignedPlatform: 'MAVSDK Drone-03',
    targetEntity: 'Vessel Diversion Pattern', aoi: 'Bab-el-Mandeb', createdAt: '2h ago',
    transitions: [
      { from: 'created', to: 'queued', timestamp: '2h ago', actor: 'Maritime Fusion Engine' },
      { from: 'queued', to: 'assigned', timestamp: '1h 58m ago', actor: 'CBBA + MAPPO-GAT' },
      { from: 'assigned', to: 'executing', timestamp: '1h 55m ago', actor: 'Drone-03' },
      { from: 'executing', to: 'failed', timestamp: '1h 20m ago', actor: 'System', notes: 'Link lost: DDIL environment, mesh timeout 120s exceeded' },
    ],
    convergenceScore: 64,
  },
];

function StatusPipeline({ task }: { task: TaskLifecycle }) {
  const currentIndex = STATUS_FLOW.indexOf(task.status);
  const isFailed = task.status === 'failed' || task.status === 'cancelled';

  return (
    <div className="flex items-center gap-1">
      {STATUS_FLOW.map((status, i) => {
        const config = STATUS_CONFIG[status];
        const isActive = status === task.status;
        const isPast = i < currentIndex && !isFailed;
        const Icon = config.icon;

        return (
          <div key={status} className="flex items-center">
            <motion.div
              className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${isActive ? 'scale-110' : ''}`}
              style={{
                borderColor: isPast || isActive ? config.color : '#3f3f46',
                backgroundColor: isPast ? config.color : isActive ? config.bgColor : 'transparent',
              }}
              animate={isActive ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
            >
              {isPast ? (
                <CheckCircle className="w-3 h-3 text-white" />
              ) : isActive ? (
                <Icon className="w-3 h-3" style={{ color: config.color }} />
              ) : (
                <div className="w-2 h-2 rounded-full bg-zinc-700" />
              )}
            </motion.div>
            {i < STATUS_FLOW.length - 1 && (
              <div className="w-4 h-0.5 mx-0.5" style={{ backgroundColor: isPast ? config.color : '#3f3f46' }} />
            )}
          </div>
        );
      })}
      {isFailed && (
        <div className="ml-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center border-2 border-red-500 bg-red-500/10">
            <XCircle className="w-3 h-3 text-red-400" />
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, isSelected, onClick }: { task: TaskLifecycle; isSelected: boolean; onClick: () => void }) {
  const statusConfig = STATUS_CONFIG[task.status];
  const TypeIcon = TASK_TYPE_ICONS[task.type] || Crosshair;
  const priorityColor = PRIORITY_COLORS[task.priority];

  return (
    <motion.div
      layout
      onClick={onClick}
      className={`bg-zinc-900/50 border rounded-xl p-4 cursor-pointer transition-all ${
        isSelected ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/5' : 'border-zinc-800 hover:border-zinc-700'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: statusConfig.bgColor, border: `1px solid ${statusConfig.color}30` }}>
          <TypeIcon className="w-4 h-4" style={{ color: statusConfig.color }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-white truncate">{task.name}</h3>
            <span className="text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider" style={{ backgroundColor: `${priorityColor}20`, color: priorityColor }}>
              {task.priority}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1 text-[10px] text-zinc-500">
            <span>{task.aoi}</span>
            {task.assignedPlatform && <><span>•</span><span>{task.assignedPlatform}</span></>}
            <span>•</span><span>{task.createdAt}</span>
          </div>

          {/* Status Pipeline */}
          <div className="mt-3">
            <StatusPipeline task={task} />
          </div>

          {/* Result (if complete) */}
          {task.result && (
            <div className="mt-2 px-2 py-1.5 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
              <span className="text-[10px] text-emerald-400">{task.result}</span>
            </div>
          )}
        </div>

        <div className="text-right flex-shrink-0">
          {task.convergenceScore && (
            <div className={`text-sm font-bold font-mono ${task.convergenceScore >= 80 ? 'text-red-400' : task.convergenceScore >= 60 ? 'text-yellow-400' : 'text-zinc-400'}`}>
              CS:{task.convergenceScore}
            </div>
          )}
          <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: statusConfig.bgColor, color: statusConfig.color }}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Expanded: Transition History */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <h4 className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-2">Lifecycle Transitions</h4>
              <div className="space-y-2">
                {task.transitions.map((t, i) => {
                  const toConfig = STATUS_CONFIG[t.to];
                  return (
                    <div key={i} className="flex items-start gap-2">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full mt-1" style={{ backgroundColor: toConfig.color }} />
                        {i < task.transitions.length - 1 && <div className="w-px h-full bg-zinc-800 mt-1" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-zinc-500">{t.from}</span>
                          <ArrowRight className="w-3 h-3 text-zinc-600" />
                          <span className="text-[10px] font-mono font-medium" style={{ color: toConfig.color }}>{t.to}</span>
                          <span className="text-[9px] text-zinc-600">{t.timestamp}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-zinc-500">by {t.actor}</span>
                          {t.notes && <span className="text-[9px] text-zinc-400">• {t.notes}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function LifecyclePage() {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<string | 'all'>('all');

  const filteredTasks = MOCK_TASKS.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    return true;
  });

  const statusCounts = MOCK_TASKS.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-orange-500/30 flex items-center justify-center">
              <Activity className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Task Lifecycle Manager</h1>
              <p className="text-xs text-zinc-500">CBBA allocation • MAPPO-GAT coordination • Autonomous ISR pipeline • Full state machine visibility</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="border-b border-zinc-800 px-6 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-colors ${
              statusFilter === 'all' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            All ({MOCK_TASKS.length})
          </button>
          {Object.entries(STATUS_CONFIG).map(([status, config]) => {
            const count = statusCounts[status] || 0;
            if (count === 0) return null;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status as TaskStatus)}
                className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium rounded-md transition-colors ${
                  statusFilter === status ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                style={statusFilter === status ? { backgroundColor: `${config.color}20`, color: config.color } : {}}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.color }} />
                {config.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Task List */}
      <div className="p-6 space-y-3">
        {filteredTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            isSelected={selectedTask === task.id}
            onClick={() => setSelectedTask(selectedTask === task.id ? null : task.id)}
          />
        ))}
      </div>
    </div>
  );
}
