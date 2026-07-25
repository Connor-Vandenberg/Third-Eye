'use client';

import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface AgentTask {
  id: string;
  description: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  started_at: string | null;
  completed_at: string | null;
  result_summary: string | null;
  tool_used: string | null;
}

interface AgentMetrics {
  tasks_completed_24h: number;
  avg_execution_ms: number;
  success_rate: number;
  tokens_used_24h: number;
  entities_processed: number;
  signals_generated: number;
}

interface Agent {
  id: string;
  name: string;
  specialization: string;
  status: 'active' | 'idle' | 'processing' | 'error' | 'sleeping';
  description: string;
  capabilities: string[];
  tools: string[];
  current_task: AgentTask | null;
  queue_depth: number;
  metrics: AgentMetrics;
  last_active: string;
  model: string;
  priority: number;
}

interface AutonomousCycle {
  id: string;
  started_at: string;
  completed_at: string;
  execution_ms: number;
  gaps_detected: number;
  convergence_events: number;
  isr_requirements_created: number;
  critical_regions: string[];
  agents_invoked: string[];
}

interface AgentsState {
  agents: Agent[];
  recentCycles: AutonomousCycle[];
  loading: boolean;
  error: string | null;
  selectedAgent: Agent | null;
  runningCycle: boolean;
  lastCycleResult: AutonomousCycle | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const GZM_API = process.env.NEXT_PUBLIC_GZM_API_URL || 'http://localhost:8000';

const STATUS_CONFIG: Record<string, { color: string; label: string; animate: boolean }> = {
  active: { color: 'var(--green)', label: 'ACTIVE', animate: false },
  idle: { color: 'var(--text-tertiary)', label: 'IDLE', animate: false },
  processing: { color: 'var(--accent)', label: 'PROCESSING', animate: true },
  error: { color: 'var(--red)', label: 'ERROR', animate: false },
  sleeping: { color: 'oklch(0.6 0.12 280)', label: 'SLEEPING', animate: false },
};

const SPECIALIZATION_ICONS: Record<string, string> = {
  'Geopolitical Analyst': '🌍',
  'Signal Correlator': '📡',
  'Threat Assessor': '⚠️',
  'Collection Manager': '🎯',
  'Pattern Recognizer': '🔮',
  'Source Validator': '✅',
  'Narrative Builder': '📝',
  'Platform Coordinator': '🛰️',
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function AgentsPage() {
  const [state, setState] = useState<AgentsState>({
    agents: [],
    recentCycles: [],
    loading: true,
    error: null,
    selectedAgent: null,
    runningCycle: false,
    lastCycleResult: null,
  });

  // ──────────────────────────────────────────────────────────────────────────
  // DATA FETCHING
  // ──────────────────────────────────────────────────────────────────────────

  const fetchAgents = useCallback(async () => {
    try {
      const [agentsRes, cyclesRes] = await Promise.allSettled([
        fetch(`${GZM_API}/agents`),
        fetch(`${GZM_API}/agents/cycles?limit=10`),
      ]);

      const agents = agentsRes.status === 'fulfilled' && agentsRes.value.ok
        ? await agentsRes.value.json() : [];
      const cycles = cyclesRes.status === 'fulfilled' && cyclesRes.value.ok
        ? await cyclesRes.value.json() : [];

      setState(prev => ({
        ...prev,
        agents: agents.agents || agents || [],
        recentCycles: cycles.cycles || cycles || [],
        loading: false,
        error: null,
      }));
    } catch (err) {
      setState(prev => ({ ...prev, loading: false, error: err instanceof Error ? err.message : 'Agent fetch failed' }));
    }
  }, []);

  const runAutonomousCycle = useCallback(async () => {
    setState(prev => ({ ...prev, runningCycle: true }));
    try {
      const res = await fetch(`${GZM_API}/aip/autonomous`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      setState(prev => ({
        ...prev,
        runningCycle: false,
        lastCycleResult: result,
        recentCycles: [result, ...prev.recentCycles].slice(0, 10),
      }));
      // Refresh agents after cycle
      fetchAgents();
    } catch (err) {
      setState(prev => ({ ...prev, runningCycle: false, error: err instanceof Error ? err.message : 'Cycle failed' }));
    }
  }, [fetchAgents]);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);
  useEffect(() => {
    const interval = setInterval(fetchAgents, 15_000);
    return () => clearInterval(interval);
  }, [fetchAgents]);

  // ──────────────────────────────────────────────────────────────────────────
  // COMPUTED
  // ──────────────────────────────────────────────────────────────────────────

  const totalTasksCompleted = state.agents.reduce((sum, a) => sum + (a.metrics?.tasks_completed_24h || 0), 0);
  const totalTokens = state.agents.reduce((sum, a) => sum + (a.metrics?.tokens_used_24h || 0), 0);
  const activeAgents = state.agents.filter(a => a.status === 'active' || a.status === 'processing').length;
  const avgSuccessRate = state.agents.length > 0
    ? state.agents.reduce((sum, a) => sum + (a.metrics?.success_rate || 0), 0) / state.agents.length
    : 0;

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <h1 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Multi-Agent System</h1>
            <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', margin: '2px 0 0' }}>
              8 Specialist Agents · Autonomous Reasoning · Tool Invocation
            </p>
          </div>
          <button
            onClick={runAutonomousCycle}
            disabled={state.runningCycle}
            style={{
              padding: '8px 16px', borderRadius: '6px', border: 'none',
              background: state.runningCycle ? 'var(--surface-0)' : 'var(--accent)',
              color: state.runningCycle ? 'var(--accent)' : 'var(--surface-0)',
              fontSize: '12px', fontWeight: 600, cursor: state.runningCycle ? 'wait' : 'pointer',
              fontFamily: 'var(--font-mono)', transition: 'all 150ms',
            }}
          >
            {state.runningCycle ? '⟳ RUNNING CYCLE...' : '▶ RUN AUTONOMOUS CYCLE'}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '24px' }}>
          {[
            { label: 'ACTIVE', value: `${activeAgents}/${state.agents.length}`, color: 'var(--green)' },
            { label: 'TASKS/24H', value: totalTasksCompleted.toLocaleString(), color: 'var(--accent)' },
            { label: 'SUCCESS', value: `${Math.round(avgSuccessRate * 100)}%`, color: avgSuccessRate >= 0.9 ? 'var(--green)' : 'var(--yellow)' },
            { label: 'TOKENS/24H', value: totalTokens > 1000 ? `${(totalTokens / 1000).toFixed(1)}K` : totalTokens.toString(), color: 'var(--text-primary)' },
            { label: 'CYCLES', value: state.recentCycles.length.toString(), color: 'var(--accent)' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: s.color }}>{s.value}</span>
              <span style={{ fontSize: '9px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>
        {state.loading && (
          <div style={{ textAlign: 'center', padding: '60px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent)' }}>
            INITIALIZING AGENT MESH...
          </div>
        )}

        {state.error && (
          <div style={{ padding: '16px', borderRadius: '8px', background: 'oklch(0.25 0.05 25)', border: '1px solid var(--red)', color: 'var(--red)', fontSize: '12px', fontFamily: 'var(--font-mono)', marginBottom: '16px' }}>
            AGENT ERROR: {state.error}
          </div>
        )}

        {/* Last Cycle Result Banner */}
        {state.lastCycleResult && (
          <div style={{
            padding: '12px 16px', borderRadius: '8px', marginBottom: '16px',
            background: 'oklch(0.22 0.04 145)', border: '1px solid var(--green)',
            display: 'flex', alignItems: 'center', gap: '16px',
          }}>
            <span style={{ color: 'var(--green)', fontWeight: 700, fontSize: '12px', fontFamily: 'var(--font-mono)' }}>✓ CYCLE COMPLETE</span>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              {state.lastCycleResult.execution_ms}ms · {state.lastCycleResult.gaps_detected} gaps · {state.lastCycleResult.convergence_events} convergence events · {state.lastCycleResult.isr_requirements_created} ISR tasks
            </span>
            {state.lastCycleResult.critical_regions?.length > 0 && (
              <span style={{ fontSize: '10px', color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>
                ⚠ {state.lastCycleResult.critical_regions.join(', ')}
              </span>
            )}
          </div>
        )}

        {/* Agent Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          {state.agents.map((agent, i) => {
            const cfg = STATUS_CONFIG[agent.status] || STATUS_CONFIG.idle;
            const icon = SPECIALIZATION_ICONS[agent.specialization] || '🤖';
            return (
              <div
                key={agent.id || i}
                onClick={() => setState(prev => ({ ...prev, selectedAgent: prev.selectedAgent?.id === agent.id ? null : agent }))}
                style={{
                  padding: '16px', borderRadius: '10px',
                  background: state.selectedAgent?.id === agent.id ? 'var(--accent-subtle)' : 'var(--surface-1)',
                  border: `1px solid ${state.selectedAgent?.id === agent.id ? 'var(--accent)' : 'var(--border-subtle)'}`,
                  cursor: 'pointer', transition: 'all 150ms',
                }}
              >
                {/* Agent header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '20px' }}>{icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{agent.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{agent.specialization}</div>
                  </div>
                  <span style={{
                    padding: '3px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: 700,
                    fontFamily: 'var(--font-mono)', color: cfg.color,
                    background: `color-mix(in oklch, ${cfg.color} 15%, transparent)`,
                    animation: cfg.animate ? 'pulse 1.5s infinite' : 'none',
                  }}>{cfg.label}</span>
                </div>

                {/* Description */}
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 10px', lineHeight: 1.4 }}>
                  {agent.description}
                </p>

                {/* Current task */}
                {agent.current_task && (
                  <div style={{
                    padding: '8px 10px', borderRadius: '6px', marginBottom: '10px',
                    background: 'var(--surface-0)', borderLeft: '3px solid var(--accent)',
                  }}>
                    <div style={{ fontSize: '10px', color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontWeight: 600, marginBottom: '2px' }}>CURRENT TASK</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-primary)' }}>{agent.current_task.description}</div>
                    {agent.current_task.tool_used && (
                      <div style={{ fontSize: '9px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>Tool: {agent.current_task.tool_used}</div>
                    )}
                  </div>
                )}

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{agent.metrics?.tasks_completed_24h || 0}</div>
                    <div style={{ fontSize: '8px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>TASKS/24H</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: (agent.metrics?.success_rate || 0) >= 0.9 ? 'var(--green)' : 'var(--yellow)', fontFamily: 'var(--font-mono)' }}>
                      {Math.round((agent.metrics?.success_rate || 0) * 100)}%
                    </div>
                    <div style={{ fontSize: '8px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>SUCCESS</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{agent.queue_depth || 0}</div>
                    <div style={{ fontSize: '8px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>QUEUED</div>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                  <span>{agent.model}</span>
                  <span>{agent.tools?.length || 0} tools</span>
                  <span>{agent.last_active ? new Date(agent.last_active).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Agent Detail */}
        {state.selectedAgent && (
          <div style={{ padding: '20px', borderRadius: '10px', background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 12px' }}>
              {state.selectedAgent.name} — Capabilities & Tools
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <h4 style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>CAPABILITIES</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {(state.selectedAgent.capabilities || []).map((cap, i) => (
                    <span key={i} style={{ fontSize: '11px', color: 'var(--text-secondary)', padding: '4px 8px', borderRadius: '4px', background: 'var(--surface-0)' }}>{cap}</span>
                  ))}
                </div>
              </div>
              <div>
                <h4 style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>TOOLS ({state.selectedAgent.tools?.length || 0})</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {(state.selectedAgent.tools || []).map((tool, i) => (
                    <span key={i} style={{ fontSize: '10px', color: 'var(--accent)', padding: '3px 6px', borderRadius: '3px', background: 'var(--accent-subtle)', fontFamily: 'var(--font-mono)' }}>{tool}</span>
                  ))}
                </div>
              </div>
            </div>
            {/* Extended metrics */}
            <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {[
                { label: 'Avg Execution', value: `${state.selectedAgent.metrics?.avg_execution_ms || 0}ms` },
                { label: 'Entities Processed', value: (state.selectedAgent.metrics?.entities_processed || 0).toString() },
                { label: 'Signals Generated', value: (state.selectedAgent.metrics?.signals_generated || 0).toString() },
                { label: 'Tokens Used', value: (state.selectedAgent.metrics?.tokens_used_24h || 0).toLocaleString() },
              ].map(m => (
                <div key={m.label} style={{ textAlign: 'center', padding: '8px', borderRadius: '6px', background: 'var(--surface-0)' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{m.value}</div>
                  <div style={{ fontSize: '8px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>{m.label.toUpperCase()}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Autonomous Cycles */}
        {state.recentCycles.length > 0 && (
          <div>
            <h3 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginBottom: '10px', letterSpacing: '0.04em' }}>RECENT AUTONOMOUS CYCLES</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {state.recentCycles.map((cycle, i) => (
                <div key={cycle.id || i} style={{
                  padding: '10px 14px', borderRadius: '6px',
                  background: 'var(--surface-1)', border: '1px solid var(--border-subtle)',
                  display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px', fontFamily: 'var(--font-mono)',
                }}>
                  <span style={{ color: 'var(--text-tertiary)', minWidth: '80px' }}>
                    {cycle.completed_at ? new Date(cycle.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>{cycle.execution_ms}ms</span>
                  <span style={{ color: 'var(--accent)' }}>{cycle.gaps_detected} gaps</span>
                  <span style={{ color: 'var(--green)' }}>{cycle.convergence_events} convergence</span>
                  <span style={{ color: 'var(--yellow)' }}>{cycle.isr_requirements_created} ISR</span>
                  {cycle.critical_regions?.length > 0 && (
                    <span style={{ color: 'var(--red)', marginLeft: 'auto' }}>⚠ {cycle.critical_regions.join(', ')}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
