'use client';

import { useState, useEffect } from 'react';

interface Case {
  id: string;
  title: string;
  status: 'open' | 'investigating' | 'tasked' | 'confirmed' | 'closed';
  priority: number;
  aoi_id: string;
  created_at: string;
  assigned_to: string;
  signals: number;
  tasks_dispatched: number;
  description: string;
  entities: string[];
  convergence_score: number;
}

const STATUS_COLORS: Record<string, string> = {
  open: '#3b82f6',
  investigating: '#f59e0b',
  tasked: '#8b5cf6',
  confirmed: '#22c55e',
  closed: '#6b7280',
};

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchCases();
    const interval = setInterval(fetchCases, 15000);
    return () => clearInterval(interval);
  }, []);

  async function fetchCases() {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/cases`);
      if (res.ok) {
        const data = await res.json();
        setCases(data.cases || []);
      } else {
        setCases(generateDemoCases());
      }
    } catch {
      setCases(generateDemoCases());
    } finally {
      setLoading(false);
    }
  }

  function generateDemoCases(): Case[] {
    return [
      { id: 'CASE-2026-0147', title: '58th CAA Staging Activity', status: 'tasked', priority: 1, aoi_id: 'ukraine_east', created_at: new Date(Date.now() - 7200000).toISOString(), assigned_to: 'AUTO', signals: 47, tasks_dispatched: 3, description: 'Multi-INT convergence indicating 58th Combined Arms Army repositioning near Kherson. Satellite tasking dispatched. Drone overflight queued.', entities: ['58th CAA', 'Kherson Oblast', 'T-90M', 'BMP-3'], convergence_score: 0.92 },
      { id: 'CASE-2026-0148', title: 'PLA Navy Strait Transit Preparation', status: 'investigating', priority: 2, aoi_id: 'taiwan_strait', created_at: new Date(Date.now() - 14400000).toISOString(), assigned_to: 'AUTO', signals: 23, tasks_dispatched: 1, description: 'AIS dark vessels + increased radio chatter on PLA Navy frequencies + satellite shows pier activity at Fujian bases.', entities: ['PLA Navy', 'Fujian', 'Type 055', 'Dongfeng'], convergence_score: 0.71 },
      { id: 'CASE-2026-0149', title: 'Iranian Internet Pre-Shutdown', status: 'open', priority: 1, aoi_id: 'iran', created_at: new Date(Date.now() - 3600000).toISOString(), assigned_to: 'PENDING', signals: 12, tasks_dispatched: 0, description: 'IODA prediction engine flagged imminent shutdown. BGP paths dropping, probe reachability declining. Historical pattern match: Sep 2022.', entities: ['TIC', 'AS12880', 'AS44244'], convergence_score: 0.78 },
      { id: 'CASE-2026-0145', title: 'Houthi Red Sea Mining Activity', status: 'confirmed', priority: 3, aoi_id: 'red_sea', created_at: new Date(Date.now() - 86400000).toISOString(), assigned_to: 'AUTO', signals: 8, tasks_dispatched: 2, description: 'Drone overflight confirmed small boat activity consistent with mine-laying near Bab el-Mandeb. Satellite shows supply movement from Hodeidah.', entities: ['Ansar Allah', 'Bab el-Mandeb', 'Hodeidah'], convergence_score: 0.88 },
      { id: 'CASE-2026-0143', title: 'Wagner Sahel Repositioning', status: 'closed', priority: 4, aoi_id: 'sahel_region', created_at: new Date(Date.now() - 172800000).toISOString(), assigned_to: 'AUTO', signals: 15, tasks_dispatched: 1, description: 'Confirmed: Wagner elements moved from Mali to Niger border region. Social media posts + satellite + SIGINT all corroborate.', entities: ['Wagner Group', 'Mali', 'Niger'], convergence_score: 0.95 },
    ];
  }

  const filteredCases = statusFilter === 'all' ? cases : cases.filter(c => c.status === statusFilter);

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'var(--font-mono, monospace)' }}>
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text, #e2e8f0)', margin: 0 }}>Case Management</h1>
          <p style={{ color: 'var(--color-text-dim, #94a3b8)', fontSize: '14px', margin: '4px 0 0' }}>Convergence-driven investigations | Auto-tasking enabled</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['all', 'open', 'investigating', 'tasked', 'confirmed', 'closed'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '6px 12px', borderRadius: '4px', border: statusFilter === s ? `1px solid ${STATUS_COLORS[s] || '#3b82f6'}` : '1px solid var(--color-border, #334155)', background: statusFilter === s ? `${STATUS_COLORS[s] || '#3b82f6'}20` : 'transparent', color: 'var(--color-text, #e2e8f0)', fontSize: '12px', cursor: 'pointer', textTransform: 'capitalize' }}>
              {s}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-dim)' }}>Loading cases...</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border, #334155)' }}>
              <th style={{ padding: '12px 8px', textAlign: 'left', color: 'var(--color-text-dim)', fontWeight: 500 }}>Case ID</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', color: 'var(--color-text-dim)', fontWeight: 500 }}>Title</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', color: 'var(--color-text-dim)', fontWeight: 500 }}>Status</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', color: 'var(--color-text-dim)', fontWeight: 500 }}>AOI</th>
              <th style={{ padding: '12px 8px', textAlign: 'right', color: 'var(--color-text-dim)', fontWeight: 500 }}>Signals</th>
              <th style={{ padding: '12px 8px', textAlign: 'right', color: 'var(--color-text-dim)', fontWeight: 500 }}>Tasks</th>
              <th style={{ padding: '12px 8px', textAlign: 'right', color: 'var(--color-text-dim)', fontWeight: 500 }}>Conv.</th>
            </tr>
          </thead>
          <tbody>
            {filteredCases.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--color-border, #334155)20', cursor: 'pointer' }}>
                <td style={{ padding: '12px 8px', color: 'var(--color-accent, #3b82f6)', fontWeight: 600 }}>{c.id}</td>
                <td style={{ padding: '12px 8px', color: 'var(--color-text, #e2e8f0)' }}>{c.title}</td>
                <td style={{ padding: '12px 8px' }}><span style={{ padding: '2px 8px', borderRadius: '4px', background: `${STATUS_COLORS[c.status]}20`, color: STATUS_COLORS[c.status], fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>{c.status}</span></td>
                <td style={{ padding: '12px 8px', color: 'var(--color-text-dim)' }}>{c.aoi_id.replace('_', ' ')}</td>
                <td style={{ padding: '12px 8px', textAlign: 'right', color: 'var(--color-text)' }}>{c.signals}</td>
                <td style={{ padding: '12px 8px', textAlign: 'right', color: 'var(--color-text)' }}>{c.tasks_dispatched}</td>
                <td style={{ padding: '12px 8px', textAlign: 'right', color: c.convergence_score > 0.8 ? 'var(--color-critical, #ef4444)' : c.convergence_score > 0.6 ? 'var(--color-high, #f97316)' : 'var(--color-text)' }}>{(c.convergence_score * 100).toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
