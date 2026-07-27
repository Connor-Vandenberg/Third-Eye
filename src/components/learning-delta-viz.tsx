'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, TrendingDown, Activity, Zap, Target, RefreshCw, ChevronRight, BarChart3 } from 'lucide-react';

// LEARNING DELTA VISUALIZATION
// Shows what the model CHANGED after each self-play cycle
// Animated diff of model state. Nobody else shows their learning process.
// Radical transparency: "The system got smarter by X% because..."

export interface LearningCycle {
  cycleNumber: number;
  timestamp: string;
  duration: number; // seconds
  reward: number;
  loss: number;
  improvements: Array<{
    metric: string;
    before: number;
    after: number;
    delta: number;
    significance: 'high' | 'medium' | 'low';
  }>;
  weightsChanged: number; // count of parameters that shifted > threshold
  totalParameters: number;
  predictionsImproved: Array<{
    region: string;
    beforeAccuracy: number;
    afterAccuracy: number;
  }>;
  signalRulesAdded: number;
  signalRulesDeprecated: number;
  convergenceThresholdAdjustments: Array<{
    rule: string;
    oldThreshold: number;
    newThreshold: number;
  }>;
  adversarialAttacks: Array<{
    type: string;
    success: boolean;
    defenseStrength: number;
  }>;
  triggerReason: string;
}

interface LearningDeltaVizProps {
  currentCycle: LearningCycle;
  history: LearningCycle[];
  isRunning: boolean;
  className?: string;
}

function DeltaBar({ label, before, after, significance }: { label: string; before: number; after: number; significance: string }) {
  const delta = after - before;
  const isPositive = delta > 0;
  const absDelta = Math.abs(delta);
  const maxVal = Math.max(before, after, 1);
  const sigColor = significance === 'high' ? '#10b981' : significance === 'medium' ? '#06b6d4' : '#6b7280';

  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-zinc-400 w-28 text-right truncate">{label}</span>
      <div className="flex-1 flex items-center gap-1">
        {/* Before bar */}
        <div className="w-16 h-3 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-zinc-600 rounded-full" style={{ width: `${(before / maxVal) * 100}%` }} />
        </div>
        {/* Arrow */}
        <motion.div initial={{ x: -5, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          {isPositive ? <TrendingUp className="w-3 h-3 text-emerald-400" /> : <TrendingDown className="w-3 h-3 text-red-400" />}
        </motion.div>
        {/* After bar */}
        <div className="w-16 h-3 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: sigColor }}
            initial={{ width: `${(before / maxVal) * 100}%` }}
            animate={{ width: `${(after / maxVal) * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>
      <span className={`text-[9px] font-mono font-bold w-12 text-right ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
        {isPositive ? '+' : ''}{(delta * 100).toFixed(2)}%
      </span>
    </div>
  );
}

function RewardSparkline({ history }: { history: LearningCycle[] }) {
  const data = history.slice(-30).map(h => h.reward);
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 120;
  const height = 30;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline points={points} fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx={width} cy={height - ((data[data.length - 1] - min) / range) * height} r="2.5" fill="#8b5cf6" />
    </svg>
  );
}

export function LearningDeltaViz({ currentCycle, history, isRunning, className = '' }: LearningDeltaVizProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const weightChangePercent = (currentCycle.weightsChanged / currentCycle.totalParameters * 100).toFixed(4);
  const avgReward = history.length > 0 ? (history.reduce((a, h) => a + h.reward, 0) / history.length).toFixed(3) : '0';

  return (
    <div className={`bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Brain className="w-5 h-5 text-violet-400" />
              {isRunning && (
                <motion.div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-violet-400" animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 1, repeat: Infinity }} />
              )}
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">R-Zero Self-Play: Cycle #{currentCycle.cycleNumber}</h3>
              <p className="text-[9px] text-zinc-500">{currentCycle.triggerReason} • {currentCycle.duration}s</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-violet-400">{currentCycle.reward.toFixed(3)}</div>
            <div className="text-[8px] text-zinc-500">reward (avg: {avgReward})</div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-5 gap-2 px-4 py-3 border-b border-zinc-800">
        <div className="text-center">
          <div className="text-sm font-bold text-emerald-400">{currentCycle.reward.toFixed(3)}</div>
          <div className="text-[8px] text-zinc-500">Reward</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-cyan-400">{currentCycle.loss.toFixed(4)}</div>
          <div className="text-[8px] text-zinc-500">Loss</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-yellow-400">{weightChangePercent}%</div>
          <div className="text-[8px] text-zinc-500">Params Changed</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-blue-400">+{currentCycle.signalRulesAdded}</div>
          <div className="text-[8px] text-zinc-500">Rules Added</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-red-400">-{currentCycle.signalRulesDeprecated}</div>
          <div className="text-[8px] text-zinc-500">Rules Deprecated</div>
        </div>
      </div>

      {/* Metric improvements (THE DELTA) */}
      <div className="px-4 py-3">
        <h4 className="text-[9px] uppercase tracking-wider text-zinc-500 font-medium mb-2">What Changed This Cycle</h4>
        <div className="space-y-1.5">
          {currentCycle.improvements.map((imp, i) => (
            <DeltaBar key={i} label={imp.metric} before={imp.before} after={imp.after} significance={imp.significance} />
          ))}
        </div>
      </div>

      {/* Regional prediction improvements */}
      {currentCycle.predictionsImproved.length > 0 && (
        <div className="px-4 py-3 border-t border-zinc-800">
          <h4 className="text-[9px] uppercase tracking-wider text-zinc-500 font-medium mb-2">Prediction Accuracy by Region</h4>
          <div className="grid grid-cols-2 gap-1.5">
            {currentCycle.predictionsImproved.map((pred, i) => {
              const delta = pred.afterAccuracy - pred.beforeAccuracy;
              return (
                <div key={i} className="flex items-center justify-between bg-zinc-800/30 rounded px-2 py-1">
                  <span className="text-[9px] text-zinc-400">{pred.region}</span>
                  <span className={`text-[9px] font-mono font-bold ${delta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {delta > 0 ? '+' : ''}{(delta * 100).toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reward history sparkline */}
      <div className="px-4 py-3 border-t border-zinc-800 flex items-center justify-between">
        <div>
          <span className="text-[9px] text-zinc-500">Reward History ({history.length} cycles)</span>
          <div className="mt-1">
            <RewardSparkline history={history} />
          </div>
        </div>
        <div className="text-right text-[8px] text-zinc-600">
          <p>Zero human labels required</p>
          <p>Adversarial self-improvement</p>
          <p>Updates every {Math.round(history.length > 1 ? (Date.now() - new Date(history[0].timestamp).getTime()) / history.length / 1000 : 15)}s</p>
        </div>
      </div>

      {/* Advanced: adversarial + threshold adjustments */}
      <div className="border-t border-zinc-800">
        <button onClick={() => setShowAdvanced(!showAdvanced)} className="w-full px-4 py-2 text-[9px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1">
          <ChevronRight className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
          Advanced: Adversarial Tests + Threshold Adjustments
        </button>
        {showAdvanced && (
          <div className="px-4 pb-3 space-y-2">
            {currentCycle.adversarialAttacks.map((attack, i) => (
              <div key={i} className="flex items-center justify-between text-[9px] bg-zinc-800/30 rounded px-2 py-1">
                <span className="text-zinc-400">{attack.type}</span>
                <span className={attack.success ? 'text-red-400' : 'text-emerald-400'}>
                  {attack.success ? 'BYPASSED' : `BLOCKED (${(attack.defenseStrength * 100).toFixed(0)}%)`}
                </span>
              </div>
            ))}
            {currentCycle.convergenceThresholdAdjustments.map((adj, i) => (
              <div key={i} className="flex items-center justify-between text-[9px] bg-zinc-800/30 rounded px-2 py-1">
                <span className="text-zinc-400 truncate">{adj.rule}</span>
                <span className="text-zinc-300 font-mono">{adj.oldThreshold.toFixed(2)} → {adj.newThreshold.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default LearningDeltaViz;
