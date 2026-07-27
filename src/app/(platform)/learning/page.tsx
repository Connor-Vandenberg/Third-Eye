'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, Zap, FlaskConical, Moon, Repeat, Swords, ArrowRightLeft, Target, Award, Activity, BarChart3, Gauge, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface LearningState {
  cycle_count: number;
  verdict: string;
  verdict_color: string;
  self_play: { rounds_completed: number; current_difficulty: number; best_accuracy: number; challenges_generated: number; challenges_solved: number; solve_rate: number };
  neural: { updates_applied: number; avg_recent_loss: number; loss_trend: number[]; learning_rate: number };
  ab_testing: { active_experiments: number; completed_experiments: number; experiments: { name: string; variant_a: string; variant_b: string; samples_a: number; samples_b: number; winner: string; p_value: number }[] };
  spaced_repetition: { items_tracked: number; total_reviews: number; due_now: number };
  sleep: { consolidations: number; is_consolidating: boolean; last_consolidation_hours_ago: number };
  transfer: { transfers_applied: number; domains_with_knowledge: number };
  counterfactual: { total_regret: number; decisions_analyzed: number; avg_regret: number };
  reward: { weights: Record<string, number>; hacking_flags: number };
  drift: { detected: boolean; last_check: string; metrics_stable: number; metrics_drifting: number };
  curriculum: { difficulty_history: [number, number][]; };
}

// =============================================================================
// MOCK DATA
// =============================================================================

function generateMockLearning(): LearningState {
  return {
    cycle_count: 4821,
    verdict: 'GOOD: Progressing well. Neural model converging, handling challenges adequately.',
    verdict_color: '#22c55e',
    self_play: { rounds_completed: 241, current_difficulty: 0.72, best_accuracy: 0.84, challenges_generated: 4820, challenges_solved: 3614, solve_rate: 0.75 },
    neural: { updates_applied: 38568, avg_recent_loss: 0.34, loss_trend: [0.8, 0.72, 0.65, 0.58, 0.51, 0.47, 0.42, 0.39, 0.36, 0.34, 0.33, 0.34, 0.32, 0.34, 0.33], learning_rate: 0.001 },
    ab_testing: { active_experiments: 2, completed_experiments: 7, experiments: [
      { name: 'Embedding dim 512 vs 768', variant_a: '512-dim', variant_b: '768-dim', samples_a: 450, samples_b: 445, winner: '', p_value: 0.12 },
      { name: 'Convergence threshold 0.7 vs 0.8', variant_a: '0.7 threshold', variant_b: '0.8 threshold', samples_a: 892, samples_b: 887, winner: '0.8 threshold', p_value: 0.003 },
    ] },
    spaced_repetition: { items_tracked: 2847, total_reviews: 18432, due_now: 14 },
    sleep: { consolidations: 12, is_consolidating: false, last_consolidation_hours_ago: 4.2 },
    transfer: { transfers_applied: 347, domains_with_knowledge: 8 },
    counterfactual: { total_regret: 12.4, decisions_analyzed: 4821, avg_regret: 0.0026 },
    reward: { weights: { new_entities_discovered: 0.32, convergence_signals_fired: 0.54, predictions_improved: 0.61, watchlist_hits: 1.02, duplicate_penalty: -0.28, curiosity_bonus: 0.22, novelty_bonus: 0.17 }, hacking_flags: 0 },
    drift: { detected: false, last_check: new Date().toISOString(), metrics_stable: 14, metrics_drifting: 0 },
    curriculum: { difficulty_history: [[0, 0.3], [500, 0.35], [1000, 0.42], [1500, 0.48], [2000, 0.55], [2500, 0.61], [3000, 0.65], [3500, 0.68], [4000, 0.70], [4500, 0.71], [4821, 0.72]] },
  };
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function LearningPage() {
  const [state, setState] = useState<LearningState>(generateMockLearning);

  useEffect(() => {
    const interval = setInterval(() => setState(generateMockLearning()), 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-violet-400" />
            Learning System
          </h1>
          <p className="text-sm text-zinc-400 mt-1">R-Zero Self-Play + 20 Learning Subsystems | Cycle #{state.cycle_count}</p>
        </div>
        <div className="px-4 py-2 rounded-lg border" style={{ borderColor: state.verdict_color + '44', backgroundColor: state.verdict_color + '11' }}>
          <span className="text-xs font-mono" style={{ color: state.verdict_color }}>{state.verdict.split(':')[0]}</span>
        </div>
      </div>

      {/* TOP METRICS */}
      <div className="grid grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Self-Play Rounds', value: state.self_play.rounds_completed.toString(), icon: Swords, color: 'text-red-400' },
          { label: 'Solve Rate', value: `${(state.self_play.solve_rate * 100).toFixed(0)}%`, icon: Target, color: 'text-emerald-400' },
          { label: 'Neural Loss', value: state.neural.avg_recent_loss.toFixed(3), icon: TrendingUp, color: 'text-blue-400' },
          { label: 'Difficulty', value: `${(state.self_play.current_difficulty * 100).toFixed(0)}%`, icon: Gauge, color: 'text-orange-400' },
          { label: 'Transfers', value: state.transfer.transfers_applied.toString(), icon: ArrowRightLeft, color: 'text-cyan-400' },
          { label: 'Consolidations', value: state.sleep.consolidations.toString(), icon: Moon, color: 'text-purple-400' },
        ].map(m => (
          <div key={m.label} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <m.icon className={`w-3.5 h-3.5 ${m.color}`} />
              <span className="text-[10px] font-mono text-zinc-500 uppercase">{m.label}</span>
            </div>
            <span className="text-xl font-bold font-mono">{m.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* NEURAL LOSS CURVE */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <h3 className="text-xs font-bold flex items-center gap-1.5 mb-3"><TrendingUp className="w-3.5 h-3.5 text-blue-400" /> Neural Loss Curve</h3>
          <div className="h-24 flex items-end gap-0.5">
            {state.neural.loss_trend.map((loss, i) => (
              <div key={i} className="flex-1 bg-blue-500/30 rounded-t" style={{ height: `${loss * 100}%` }}>
                <div className="w-full bg-blue-500 rounded-t" style={{ height: `${(1 - loss) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1 text-[8px] font-mono text-zinc-600">
            <span>Cycle {state.cycle_count - state.neural.loss_trend.length * 50}</span>
            <span>Now</span>
          </div>
          <div className="mt-2 text-[9px] font-mono text-zinc-500">
            Updates: {state.neural.updates_applied.toLocaleString()} | LR: {state.neural.learning_rate}
          </div>
        </div>

        {/* SELF-PLAY STATS */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <h3 className="text-xs font-bold flex items-center gap-1.5 mb-3"><Swords className="w-3.5 h-3.5 text-red-400" /> R-Zero Self-Play</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-zinc-500">Challenges generated</span>
              <span className="text-zinc-300">{state.self_play.challenges_generated.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-zinc-500">Challenges solved</span>
              <span className="text-emerald-400">{state.self_play.challenges_solved.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-zinc-500">Best accuracy</span>
              <span className="text-yellow-400">{(state.self_play.best_accuracy * 100).toFixed(1)}%</span>
            </div>
            <div className="mt-2">
              <span className="text-[9px] font-mono text-zinc-500 block mb-1">Difficulty progression</span>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500 rounded-full" style={{ width: `${state.self_play.current_difficulty * 100}%` }} />
              </div>
              <div className="flex justify-between text-[8px] font-mono text-zinc-600 mt-0.5">
                <span>Easy (0.3)</span>
                <span>MAX (0.95)</span>
              </div>
            </div>
          </div>
        </div>

        {/* A/B TESTING */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <h3 className="text-xs font-bold flex items-center gap-1.5 mb-3"><FlaskConical className="w-3.5 h-3.5 text-cyan-400" /> A/B Experiments</h3>
          <div className="text-[9px] font-mono text-zinc-500 mb-2">{state.ab_testing.active_experiments} active | {state.ab_testing.completed_experiments} completed</div>
          {state.ab_testing.experiments.map((exp, i) => (
            <div key={i} className="mb-2 p-2 bg-zinc-800/50 rounded">
              <div className="text-[10px] font-medium text-zinc-300 mb-1">{exp.name}</div>
              <div className="flex items-center gap-2 text-[9px] font-mono">
                <span className="text-zinc-500">{exp.variant_a} ({exp.samples_a})</span>
                <span className="text-zinc-600">vs</span>
                <span className="text-zinc-500">{exp.variant_b} ({exp.samples_b})</span>
              </div>
              <div className="mt-1 text-[9px] font-mono">
                {exp.winner ? (
                  <span className="text-emerald-400">Winner: {exp.winner} (p={exp.p_value.toFixed(4)})</span>
                ) : (
                  <span className="text-yellow-400">Running... (p={exp.p_value.toFixed(3)})</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* REWARD SHAPING */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <h3 className="text-xs font-bold flex items-center gap-1.5 mb-3"><Award className="w-3.5 h-3.5 text-yellow-400" /> Reward Weights</h3>
          <div className="space-y-1.5">
            {Object.entries(state.reward.weights).map(([key, val]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-zinc-500 w-36 truncate">{key.replace(/_/g, ' ')}</span>
                <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${val >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${Math.min(Math.abs(val) * 80, 100)}%` }} />
                </div>
                <span className={`text-[9px] font-mono w-8 text-right ${val >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{val.toFixed(2)}</span>
              </div>
            ))}
          </div>
          {state.reward.hacking_flags > 0 && (
            <div className="mt-2 flex items-center gap-1 text-[9px] text-red-400 font-mono">
              <AlertTriangle className="w-3 h-3" /> {state.reward.hacking_flags} reward hacking flags
            </div>
          )}
        </div>

        {/* COUNTERFACTUAL & REGRET */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <h3 className="text-xs font-bold flex items-center gap-1.5 mb-3"><Repeat className="w-3.5 h-3.5 text-orange-400" /> Counterfactual Reasoning</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-zinc-500">Total regret</span>
              <span className="text-orange-400">{state.counterfactual.total_regret.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-zinc-500">Decisions analyzed</span>
              <span className="text-zinc-300">{state.counterfactual.decisions_analyzed.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-zinc-500">Avg regret/decision</span>
              <span className={state.counterfactual.avg_regret < 0.01 ? 'text-emerald-400' : 'text-orange-400'}>{state.counterfactual.avg_regret.toFixed(4)}</span>
            </div>
            <div className="mt-2 p-2 bg-zinc-800/50 rounded">
              <span className="text-[9px] font-mono text-zinc-500">Interpretation: </span>
              <span className="text-[9px] font-mono text-zinc-300">
                {state.counterfactual.avg_regret < 0.01 ? 'Minimal regret. Actions are near-optimal.' : 'Some missed opportunities. Reviewing alternative strategies.'}
              </span>
            </div>
          </div>
        </div>

        {/* CONCEPT DRIFT & SPACED REP & SLEEP */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <h3 className="text-xs font-bold flex items-center gap-1.5 mb-3"><Activity className="w-3.5 h-3.5 text-purple-400" /> System Health</h3>
          <div className="space-y-3">
            {/* Drift */}
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                {state.drift.detected ? <AlertTriangle className="w-3 h-3 text-red-400" /> : <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                <span className="text-[10px] font-mono text-zinc-400">Concept Drift: {state.drift.detected ? 'DETECTED' : 'STABLE'}</span>
              </div>
              <span className="text-[9px] font-mono text-zinc-500">{state.drift.metrics_stable} metrics stable | {state.drift.metrics_drifting} drifting</span>
            </div>
            {/* Spaced Rep */}
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="w-3 h-3 text-blue-400" />
                <span className="text-[10px] font-mono text-zinc-400">Spaced Repetition</span>
              </div>
              <span className="text-[9px] font-mono text-zinc-500">{state.spaced_repetition.items_tracked} items | {state.spaced_repetition.due_now} due now | {state.spaced_repetition.total_reviews.toLocaleString()} reviews</span>
            </div>
            {/* Sleep */}
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Moon className="w-3 h-3 text-indigo-400" />
                <span className="text-[10px] font-mono text-zinc-400">Sleep Consolidation</span>
              </div>
              <span className="text-[9px] font-mono text-zinc-500">
                {state.sleep.is_consolidating ? '🌙 CONSOLIDATING NOW...' : `Last: ${state.sleep.last_consolidation_hours_ago.toFixed(1)}h ago | ${state.sleep.consolidations} total`}
              </span>
            </div>
            {/* Transfer */}
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <ArrowRightLeft className="w-3 h-3 text-cyan-400" />
                <span className="text-[10px] font-mono text-zinc-400">Transfer Learning</span>
              </div>
              <span className="text-[9px] font-mono text-zinc-500">{state.transfer.transfers_applied} transfers | {state.transfer.domains_with_knowledge} domains</span>
            </div>
          </div>
        </div>
      </div>

      {/* VERDICT */}
      <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-bold">LEARNING SYSTEM VERDICT</span>
        </div>
        <p className="text-sm font-mono" style={{ color: state.verdict_color }}>{state.verdict}</p>
      </div>
    </div>
  );
}
