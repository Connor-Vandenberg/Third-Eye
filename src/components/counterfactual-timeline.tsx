'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, Zap, Eye, AlertTriangle, TrendingUp, ArrowRight,
  ChevronRight, Shield, Target, Globe, Activity, Brain,
  Minus, CheckCircle
} from 'lucide-react';

// COUNTERFACTUAL TIMELINE VISUALIZATION
// Shows: "What would have happened WITHOUT GZM detecting this signal?"
// This is THE unique differentiator for DARPA. Nobody else shows this.

export interface DetectionEvent {
  id: string;
  signalType: string;
  region: string;
  detectedAt: string; // When GZM detected it
  publicAt: string; // When it became publicly known
  convergenceScore: number;
  domains: string[];
  description: string;
  impact: string;
  predictedEscalation?: number;
}

export interface CounterfactualScenario {
  withGZM: {
    detectionTime: string;
    responseTime: string;
    actionsTaken: string[];
    outcome: string;
    escalationPrevented: boolean;
  };
  withoutGZM: {
    detectionTime: string;
    delayHours: number;
    missedSignals: string[];
    outcome: string;
    escalationOccurred: boolean;
  };
}

interface CounterfactualTimelineProps {
  event: DetectionEvent;
  scenario: CounterfactualScenario;
  className?: string;
}

function TimeMarker({ time, label, color, icon: Icon, isDetection, animate }: {
  time: string;
  label: string;
  color: string;
  icon: any;
  isDetection?: boolean;
  animate?: boolean;
}) {
  return (
    <motion.div
      className="flex flex-col items-center"
      initial={animate ? { opacity: 0, y: 20 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${isDetection ? 'shadow-lg' : ''}`}
        style={{ borderColor: color, backgroundColor: `${color}20`, boxShadow: isDetection ? `0 0 20px ${color}40` : 'none' }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="text-center mt-2">
        <span className="text-[10px] font-bold block" style={{ color }}>{label}</span>
        <span className="text-[9px] text-zinc-500 font-mono">{time}</span>
      </div>
    </motion.div>
  );
}

export function CounterfactualTimeline({ event, scenario, className = '' }: CounterfactualTimelineProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [activeScenario, setActiveScenario] = useState<'with' | 'without'>('with');

  const hoursSaved = scenario.withoutGZM.delayHours;
  const detectedTime = new Date(event.detectedAt);
  const publicTime = new Date(event.publicAt);
  const leadTimeMs = publicTime.getTime() - detectedTime.getTime();
  const leadTimeHours = Math.round(leadTimeMs / 3600000);

  return (
    <div className={`bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-zinc-800">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
                <Zap className="w-4 h-4 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Counterfactual Analysis</h3>
                <p className="text-[10px] text-zinc-500">What would have happened without GZM?</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-emerald-400">+{leadTimeHours}h</div>
            <div className="text-[9px] text-zinc-500">detection lead time</div>
          </div>
        </div>

        {/* Event details */}
        <div className="mt-3 bg-zinc-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-white">{event.signalType}: {event.region}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-bold">CS:{event.convergenceScore}</span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-1">{event.description}</p>
          <div className="flex gap-1 mt-2">
            {event.domains.map(d => (
              <span key={d} className="text-[8px] px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-400">{d}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Scenario Toggle */}
      <div className="px-5 py-3 border-b border-zinc-800">
        <div className="flex items-center bg-zinc-800/50 rounded-lg p-0.5">
          <button
            onClick={() => setActiveScenario('with')}
            className={`flex-1 px-4 py-2 rounded-md text-xs font-medium transition-all ${
              activeScenario === 'with' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5 inline mr-1.5" />WITH GZM
          </button>
          <button
            onClick={() => setActiveScenario('without')}
            className={`flex-1 px-4 py-2 rounded-md text-xs font-medium transition-all ${
              activeScenario === 'without' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5" />WITHOUT GZM
          </button>
        </div>
      </div>

      {/* Timeline Visualization */}
      <div className="px-5 py-5">
        <AnimatePresence mode="wait">
          {activeScenario === 'with' ? (
            <motion.div key="with" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              {/* WITH GZM Timeline */}
              <div className="relative">
                {/* Timeline bar */}
                <div className="absolute top-5 left-5 right-5 h-1 bg-zinc-800 rounded-full">
                  <motion.div className="h-full bg-emerald-500 rounded-full" initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 1.5 }} />
                </div>

                <div className="flex justify-between relative z-10">
                  <TimeMarker time={event.detectedAt.split('T')[1]?.slice(0,5) || '00:00'} label="GZM Detects" color="#10b981" icon={Zap} isDetection animate />
                  <TimeMarker time="+2min" label="Alert Fired" color="#06b6d4" icon={AlertTriangle} animate />
                  <TimeMarker time="+5min" label="Tasking Issued" color="#f59e0b" icon={Target} animate />
                  <TimeMarker time="+15min" label="Confirmed" color="#8b5cf6" icon={Shield} animate />
                  <TimeMarker time="+1h" label="Report Generated" color="#3b82f6" icon={Activity} animate />
                </div>
              </div>

              {/* Actions taken */}
              <div className="mt-6 space-y-1.5">
                <h4 className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Actions Taken (Autonomous)</h4>
                {scenario.withGZM.actionsTaken.map((action, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px]">
                    <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                    <span className="text-zinc-300">{action}</span>
                  </div>
                ))}
              </div>

              {/* Outcome */}
              <div className="mt-4 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                <span className="text-[10px] text-emerald-400 font-medium">Outcome: </span>
                <span className="text-[10px] text-zinc-300">{scenario.withGZM.outcome}</span>
              </div>
            </motion.div>
          ) : (
            <motion.div key="without" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {/* WITHOUT GZM Timeline */}
              <div className="relative">
                {/* Timeline bar with gap */}
                <div className="absolute top-5 left-5 right-5 h-1 bg-zinc-800 rounded-full">
                  <div className="h-full bg-red-500/30 rounded-full" style={{ width: '100%' }} />
                  {/* Detection gap */}
                  <div className="absolute top-0 left-0 h-full bg-red-500/10 rounded-full" style={{ width: `${Math.min(hoursSaved / 24 * 100, 80)}%` }}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[7px] text-red-400 font-bold bg-zinc-900 px-1 rounded">{hoursSaved}h BLIND</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between relative z-10">
                  <TimeMarker time="???" label="Undetected" color="#ef4444" icon={Eye} />
                  <div className="flex flex-col items-center opacity-30">
                    <div className="w-10 h-10 rounded-full border-2 border-dashed border-zinc-600 flex items-center justify-center">
                      <Minus className="w-5 h-5 text-zinc-600" />
                    </div>
                    <span className="text-[9px] text-zinc-600 mt-2">No Alert</span>
                  </div>
                  <div className="flex flex-col items-center opacity-30">
                    <div className="w-10 h-10 rounded-full border-2 border-dashed border-zinc-600 flex items-center justify-center">
                      <Minus className="w-5 h-5 text-zinc-600" />
                    </div>
                    <span className="text-[9px] text-zinc-600 mt-2">No Tasking</span>
                  </div>
                  <TimeMarker time={`+${hoursSaved}h`} label="Public Report" color="#6b7280" icon={Globe} />
                  <TimeMarker time={`+${hoursSaved + 4}h`} label="Reaction" color="#ef4444" icon={AlertTriangle} />
                </div>
              </div>

              {/* Missed signals */}
              <div className="mt-6 space-y-1.5">
                <h4 className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Signals Missed (No Novel Signal Detection)</h4>
                {scenario.withoutGZM.missedSignals.map((signal, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px]">
                    <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
                    <span className="text-zinc-400">{signal}</span>
                  </div>
                ))}
              </div>

              {/* Outcome */}
              <div className="mt-4 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                <span className="text-[10px] text-red-400 font-medium">Outcome: </span>
                <span className="text-[10px] text-zinc-300">{scenario.withoutGZM.outcome}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom comparison stats */}
      <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-900/30">
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center">
            <div className="text-lg font-bold text-emerald-400">{leadTimeHours}h</div>
            <div className="text-[8px] text-zinc-500">Lead Time</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-cyan-400">{event.convergenceScore}</div>
            <div className="text-[8px] text-zinc-500">Convergence</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-yellow-400">{event.domains.length}</div>
            <div className="text-[8px] text-zinc-500">Sources Agreed</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-400">{scenario.withGZM.actionsTaken.length}</div>
            <div className="text-[8px] text-zinc-500">Auto Actions</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CounterfactualTimeline;
