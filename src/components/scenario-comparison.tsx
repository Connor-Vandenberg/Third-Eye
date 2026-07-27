'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitBranch, Clock, TrendingUp, Globe, Target, Shield,
  AlertTriangle, CheckCircle, ArrowRight, Brain, Activity,
  ChevronRight, BarChart3
} from 'lucide-react';

// SCENARIO COMPARISON (Palantir Workshop Scenario Manager equivalent)
// Side-by-side "what-if" analysis:
// Current State vs Historical Analog vs GZM Prediction vs Alternative Scenario

export interface Scenario {
  id: string;
  label: string;
  type: 'current' | 'historical' | 'predicted' | 'alternative';
  timestamp: string;
  color: string;
  metrics: Record<string, number>;
  events: Array<{ label: string; timestamp: string; severity: number }>;
  outcome?: string;
  probability?: number;
  description: string;
  source: string;
}

interface ScenarioComparisonProps {
  scenarios: Scenario[];
  metricLabels: Record<string, { label: string; unit: string; higherIsBetter: boolean }>;
  title?: string;
  onScenarioSelect?: (id: string) => void;
  className?: string;
}

const TYPE_CONFIG: Record<string, { icon: any; bgColor: string }> = {
  current: { icon: Globe, bgColor: 'rgba(6, 182, 212, 0.1)' },
  historical: { icon: Clock, bgColor: 'rgba(107, 114, 128, 0.1)' },
  predicted: { icon: Brain, bgColor: 'rgba(139, 92, 246, 0.1)' },
  alternative: { icon: GitBranch, bgColor: 'rgba(249, 115, 22, 0.1)' },
};

function MetricComparison({ metricKey, metricConfig, scenarios }: {
  metricKey: string;
  metricConfig: { label: string; unit: string; higherIsBetter: boolean };
  scenarios: Scenario[];
}) {
  const values = scenarios.map(s => s.metrics[metricKey] || 0);
  const maxVal = Math.max(...values, 1);
  const best = metricConfig.higherIsBetter ? Math.max(...values) : Math.min(...values);

  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] text-zinc-400 font-medium">{metricConfig.label}</span>
        <span className="text-[8px] text-zinc-600">{metricConfig.unit}</span>
      </div>
      <div className="space-y-1">
        {scenarios.map(scenario => {
          const value = scenario.metrics[metricKey] || 0;
          const isBest = value === best;
          const width = (value / maxVal) * 100;

          return (
            <div key={scenario.id} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: scenario.color }} />
              <div className="flex-1 h-3 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: scenario.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${width}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <span className={`text-[9px] font-mono w-12 text-right ${isBest ? 'font-bold text-white' : 'text-zinc-500'}`}>
                {value.toFixed(1)}
                {isBest && ' ✓'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ScenarioComparison({ scenarios, metricLabels, title, onScenarioSelect, className = '' }: ScenarioComparisonProps) {
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'metrics' | 'timeline' | 'outcomes'>('metrics');

  return (
    <div className={`bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-orange-400" />
            <h3 className="text-xs font-bold text-white">{title || 'Scenario Comparison'}</h3>
            <span className="text-[9px] text-zinc-500">{scenarios.length} scenarios</span>
          </div>
          <div className="flex items-center bg-zinc-800 rounded-lg p-0.5">
            {(['metrics', 'timeline', 'outcomes'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-2.5 py-1 text-[9px] font-medium rounded-md transition-colors capitalize ${
                  viewMode === mode ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Scenario tags */}
        <div className="flex gap-2 mt-2">
          {scenarios.map(scenario => {
            const config = TYPE_CONFIG[scenario.type];
            const Icon = config.icon;
            return (
              <button
                key={scenario.id}
                onClick={() => onScenarioSelect?.(scenario.id)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-colors"
                style={{ backgroundColor: config.bgColor, borderColor: `${scenario.color}30` }}
              >
                <Icon className="w-3 h-3" style={{ color: scenario.color }} />
                <span className="text-[9px] font-medium" style={{ color: scenario.color }}>{scenario.label}</span>
                {scenario.probability !== undefined && (
                  <span className="text-[8px] font-mono text-zinc-500">{(scenario.probability * 100).toFixed(0)}%</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content based on view mode */}
      <div className="px-4 py-3">
        {viewMode === 'metrics' && (
          <div className="divide-y divide-zinc-800/50">
            {Object.entries(metricLabels).map(([key, config]) => (
              <MetricComparison key={key} metricKey={key} metricConfig={config} scenarios={scenarios} />
            ))}
          </div>
        )}

        {viewMode === 'timeline' && (
          <div className="space-y-3">
            {scenarios.map(scenario => (
              <div key={scenario.id}>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: scenario.color }} />
                  <span className="text-[10px] font-medium" style={{ color: scenario.color }}>{scenario.label}</span>
                </div>
                <div className="pl-4 border-l-2 space-y-1" style={{ borderColor: `${scenario.color}40` }}>
                  {scenario.events.slice(0, 5).map((event, i) => (
                    <div key={i} className="flex items-center gap-2 text-[9px]">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: event.severity >= 0.8 ? '#ef4444' : event.severity >= 0.5 ? '#f59e0b' : scenario.color }} />
                      <span className="text-zinc-300">{event.label}</span>
                      <span className="text-zinc-600 font-mono">{event.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'outcomes' && (
          <div className="grid grid-cols-2 gap-3">
            {scenarios.map(scenario => {
              const config = TYPE_CONFIG[scenario.type];
              const Icon = config.icon;
              return (
                <div key={scenario.id} className="p-3 rounded-lg border" style={{ backgroundColor: config.bgColor, borderColor: `${scenario.color}20` }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Icon className="w-3.5 h-3.5" style={{ color: scenario.color }} />
                    <span className="text-[10px] font-bold" style={{ color: scenario.color }}>{scenario.label}</span>
                  </div>
                  <p className="text-[9px] text-zinc-400">{scenario.description}</p>
                  {scenario.outcome && (
                    <div className="mt-2 p-2 bg-zinc-900/50 rounded">
                      <span className="text-[9px] text-zinc-300">{scenario.outcome}</span>
                    </div>
                  )}
                  {scenario.probability !== undefined && (
                    <div className="mt-2 flex items-center gap-1">
                      <Target className="w-3 h-3" style={{ color: scenario.color }} />
                      <span className="text-[9px] font-bold" style={{ color: scenario.color }}>{(scenario.probability * 100).toFixed(0)}% likely</span>
                    </div>
                  )}
                  <div className="mt-1 text-[8px] text-zinc-600">Source: {scenario.source}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ScenarioComparison;
