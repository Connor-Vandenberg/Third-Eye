'use client';

import { useState, useEffect } from 'react';

interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'idle' | 'learning' | 'error';
  specialization: string;
  tasks_completed: number;
  accuracy: number;
  last_action: string;
  last_action_time: string;
  current_aoi: string | null;
  model_version: string;
}

const AGENT_ICONS: Record<string, string> = {
  collector: '\ud83d\udd0d', analyst: '\ud83e\udde0', predictor: '\ud83d\udd2e', allocator: '\ud83c\udfaf', fusion: '\ud83e\uddec', defender: '\ud83d\udee1\ufe0f', learner: '\ud83c\udf93', coordinator: '\ud83d\udce1',
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 10000);
    return () => clearInterval(interval);
  }, []);

  async function fetchAgents() {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/agents/status`);
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents || []);
      } else {
        setAgents(generateDemoAgents());
      }
    } catch {
      setAgents(generateDemoAgents());
    } finally {
      setLoading(false);
    }
  }

  function generateDemoAgents(): Agent[] {
    return [
      { id: 'agent_vlm', name: 'VLM Encoder', type: 'collector', status: 'active', specialization: 'CLIP 512-dim signal encoding', tasks_completed: 14892, accuracy: 0.97, last_action: 'Encoded 32 signals (batch)', last_action_time: new Date(Date.now() - 2000).toISOString(), current_aoi: 'all', model_version: 'clip-vit-l14' },
      { id: 'agent_baseline', name: 'Baseline Monitor', type: 'analyst', status: 'active', specialization: 'IDK-S streaming anomaly detection', tasks_completed: 8341, accuracy: 0.89, last_action: 'Flagged anomaly in ukraine_east (z=4.2)', last_action_time: new Date(Date.now() - 5000).toISOString(), current_aoi: 'ukraine_east', model_version: 'idk-s-v1' },
      { id: 'agent_predictor', name: 'Escalation Predictor', type: 'predictor', status: 'active', specialization: 'ST-GNN temporal graph prediction', tasks_completed: 234, accuracy: 0.82, last_action: 'Predicted escalation P=0.82 for ukraine_east (48h)', last_action_time: new Date(Date.now() - 60000).toISOString(), current_aoi: 'ukraine_east', model_version: 'stgnn-v2' },
      { id: 'agent_cib', name: 'Info-Ops Detector', type: 'defender', status: 'active', specialization: 'HDBSCAN CIB clustering + AI text detection', tasks_completed: 567, accuracy: 0.91, last_action: 'Detected 340-account IO campaign (taiwan_strait)', last_action_time: new Date(Date.now() - 3600000).toISOString(), current_aoi: 'taiwan_strait', model_version: 'minilm-l12' },
      { id: 'agent_allocator', name: 'CBBA Allocator', type: 'allocator', status: 'active', specialization: 'Decentralized task allocation to platforms', tasks_completed: 89, accuracy: 0.95, last_action: 'Allocated 3 tasks: 2 drones + 1 satellite', last_action_time: new Date(Date.now() - 30000).toISOString(), current_aoi: null, model_version: 'cbba-v1' },
      { id: 'agent_fusion', name: 'Sensor Fusionist', type: 'fusion', status: 'active', specialization: 'EKF + Dempster-Shafer multi-INT fusion', tasks_completed: 3421, accuracy: 0.93, last_action: 'Fused track: 3 sensors -> confidence 0.94', last_action_time: new Date(Date.now() - 8000).toISOString(), current_aoi: 'all', model_version: 'ekf-ds-v1' },
      { id: 'agent_selfplay', name: 'Self-Play Learner', type: 'learner', status: 'learning', specialization: 'R-Zero Challenger/Solver co-evolution', tasks_completed: 4200, accuracy: 0.74, last_action: 'Round 210: accuracy=0.74, difficulty=0.62', last_action_time: new Date(Date.now() - 120000).toISOString(), current_aoi: null, model_version: 'r-zero-v1' },
      { id: 'agent_coordinator', name: 'Cognitive Orchestrator', type: 'coordinator', status: 'active', specialization: 'Event-driven pipeline orchestration', tasks_completed: 52341, accuracy: 0.99, last_action: 'Processed 147 events this minute', last_action_time: new Date(Date.now() - 1000).toISOString(), current_aoi: 'all', model_version: 'orchestrator-v1' },
    ];
  }

  const activeCount = agents.filter(a => a.status === 'active').length;
  const totalTasks = agents.reduce((sum, a) => sum + a.tasks_completed, 0);
  const avgAccuracy = agents.reduce((sum, a) => sum + a.accuracy, 0) / Math.max(agents.length, 1);

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'var(--font-mono, monospace)' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text, #e2e8f0)', margin: 0 }}>Multi-Agent Dashboard</h1>
        <p style={{ color: 'var(--color-text-dim, #94a3b8)', fontSize: '14px', margin: '4px 0 0' }}>8 Specialized AI Agents | Autonomous Cognitive Loop</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border, #334155)', background: 'var(--color-surface, #1e293b)' }}>
          <div style={{ fontSize: '11px', color: 'var(--color-text-dim)', marginBottom: '4px' }}>AGENTS ACTIVE</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#22c55e' }}>{activeCount}/{agents.length}</div>
        </div>
        <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border, #334155)', background: 'var(--color-surface, #1e293b)' }}>
          <div style={{ fontSize: '11px', color: 'var(--color-text-dim)', marginBottom: '4px' }}>TOTAL TASKS COMPLETED</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text, #e2e8f0)' }}>{totalTasks.toLocaleString()}</div>
        </div>
        <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border, #334155)', background: 'var(--color-surface, #1e293b)' }}>
          <div style={{ fontSize: '11px', color: 'var(--color-text-dim)', marginBottom: '4px' }}>AVG ACCURACY</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: avgAccuracy > 0.9 ? '#22c55e' : '#f59e0b' }}>{(avgAccuracy * 100).toFixed(1)}%</div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '12px' }}>
        {agents.map(agent => (
          <div key={agent.id} style={{ padding: '20px', borderRadius: '8px', border: '1px solid var(--color-border, #334155)', background: 'var(--color-surface, #1e293b)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '28px' }}>{AGENT_ICONS[agent.type] || '\ud83e\udd16'}</span>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text, #e2e8f0)' }}>{agent.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-dim)' }}>{agent.specialization}</div>
                </div>
              </div>
              <span style={{ padding: '3px 10px', borderRadius: '4px', background: agent.status === 'active' ? '#22c55e20' : agent.status === 'learning' ? '#8b5cf620' : '#f59e0b20', color: agent.status === 'active' ? '#22c55e' : agent.status === 'learning' ? '#8b5cf6' : '#f59e0b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>{agent.status}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'center' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-dim)' }}>Last: {agent.last_action}</div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--color-text-dim)' }}>
                <span>Tasks: <strong style={{ color: 'var(--color-text)' }}>{agent.tasks_completed.toLocaleString()}</strong></span>
                <span>Acc: <strong style={{ color: agent.accuracy > 0.9 ? '#22c55e' : '#f59e0b' }}>{(agent.accuracy * 100).toFixed(0)}%</strong></span>
                <span>Model: <strong style={{ color: 'var(--color-text)' }}>{agent.model_version}</strong></span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
