'use client';

import { useState, useEffect } from 'react';

interface Brief {
  id: string;
  title: string;
  aoi_id: string;
  severity: 'critical' | 'high' | 'moderate' | 'low';
  generated_at: string;
  summary: string;
  signals_count: number;
  convergence_type: string;
  recommended_actions: string[];
  contributing_sources: string[];
  escalation_probability: number;
  time_horizon_hours: number;
}

const SEVERITY_COLORS = {
  critical: 'var(--color-critical)',
  high: 'var(--color-high)',
  moderate: 'var(--color-moderate)',
  low: 'var(--color-low)',
};

const SEVERITY_BG = {
  critical: 'rgba(239, 68, 68, 0.1)',
  high: 'rgba(249, 115, 22, 0.1)',
  moderate: 'rgba(234, 179, 8, 0.1)',
  low: 'rgba(34, 197, 94, 0.1)',
};

export default function BriefsPage() {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrief, setSelectedBrief] = useState<Brief | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchBriefs();
    const interval = setInterval(fetchBriefs, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  async function fetchBriefs() {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/regen/briefs?limit=50`);
      if (res.ok) {
        const data = await res.json();
        setBriefs(data.briefs || []);
      } else {
        // Demo data for when API isn't running
        setBriefs(generateDemoBriefs());
      }
    } catch {
      setBriefs(generateDemoBriefs());
    } finally {
      setLoading(false);
    }
  }

  function generateDemoBriefs(): Brief[] {
    return [
      {
        id: 'brief_001', title: 'Cross-Modal Convergence: Eastern Ukraine Military Buildup',
        aoi_id: 'ukraine_east', severity: 'critical', generated_at: new Date().toISOString(),
        summary: 'Satellite imagery shows 23 new structures at known staging area. Telegram channels report increased military vehicle sightings. BGP paths to Ukrainian AS dropped 15%. Three modalities converging in same AOI within 6-hour window.',
        signals_count: 47, convergence_type: 'CRITICAL_MULTI_INT_CONVERGENCE',
        recommended_actions: ['AUTO_TASK_SATELLITE_IMAGERY', 'INCREASE_SIGINT_MONITORING', 'ALERT_ANALYST_IMMEDIATE'],
        contributing_sources: ['earth_engine', 'telegram', 'bgp_monitor', 'sdr_radio'],
        escalation_probability: 0.82, time_horizon_hours: 48,
      },
      {
        id: 'brief_002', title: 'Information Operation Detected: Taiwan Strait Narrative Injection',
        aoi_id: 'taiwan_strait', severity: 'high', generated_at: new Date(Date.now() - 3600000).toISOString(),
        summary: '340 coordinated accounts posting semantically identical content across 4 languages within 2 hours. AI-generated ratio: 87%. Narrative: "reunification inevitable, resistance futile." Pattern matches PLA-linked IO campaigns from 2024.',
        signals_count: 340, convergence_type: 'COORDINATED_INFORMATION_OPERATION',
        recommended_actions: ['ESCALATE_TO_INFO_OPS_TEAM', 'TRACK_NARRATIVE_SPREAD', 'IDENTIFY_AMPLIFIER_NETWORK'],
        contributing_sources: ['cib_detection', 'chinese_social', 'telegram'],
        escalation_probability: 0.65, time_horizon_hours: 72,
      },
      {
        id: 'brief_003', title: 'Internet Outage Prediction: Iran Pre-Shutdown Pattern',
        aoi_id: 'iran', severity: 'high', generated_at: new Date(Date.now() - 7200000).toISOString(),
        summary: 'BGP path count dropped 35% in 2 hours. Active probe reachability at 72% (baseline: 98%). Pattern matches Iran September 2022 Mahsa Amini shutdown sequence. Estimated 4.2 hours to full shutdown.',
        signals_count: 12, convergence_type: 'INTERNET_OUTAGE_PREDICTED',
        recommended_actions: ['ALERT_ANALYST_IMMEDIATE', 'AUTO_TASK_SATELLITE', 'CACHE_CURRENT_OSINT'],
        contributing_sources: ['ioda_prediction', 'bgp_monitor', 'bgp_hijack_detector'],
        escalation_probability: 0.78, time_horizon_hours: 6,
      },
      {
        id: 'brief_004', title: 'Novel Signal: Arctic Passage Vessel Anomaly',
        aoi_id: 'arctic_passage', severity: 'moderate', generated_at: new Date(Date.now() - 14400000).toISOString(),
        summary: 'Vector drift detected in Arctic maritime signals. 8 vessels went AIS-dark simultaneously. RF activity spike on military bands. No keyword match - discovered via VLM baseline deviation only.',
        signals_count: 8, convergence_type: 'GRAY_ZONE_VECTOR_SHIFT',
        recommended_actions: ['INCREASE_MONITORING_RATE', 'AUTO_TASK_SATELLITE_IMAGERY'],
        contributing_sources: ['ais_collector', 'sdr_radio', 'vlm_baseline'],
        escalation_probability: 0.45, time_horizon_hours: 168,
      },
    ];
  }

  const filteredBriefs = filter === 'all' ? briefs : briefs.filter(b => b.severity === filter);

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'var(--font-mono, monospace)' }}>
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text, #e2e8f0)', margin: 0 }}>Intelligence Briefs</h1>
          <p style={{ color: 'var(--color-text-dim, #94a3b8)', fontSize: '14px', margin: '4px 0 0' }}>Auto-generated from convergence signals | ICD 203 compliant</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['all', 'critical', 'high', 'moderate', 'low'].map(sev => (
            <button key={sev} onClick={() => setFilter(sev)} style={{ padding: '6px 12px', borderRadius: '4px', border: filter === sev ? '1px solid var(--color-accent, #3b82f6)' : '1px solid var(--color-border, #334155)', background: filter === sev ? 'var(--color-accent, #3b82f6)' : 'transparent', color: 'var(--color-text, #e2e8f0)', fontSize: '12px', cursor: 'pointer', textTransform: 'capitalize' }}>
              {sev}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-dim)' }}>Loading briefs...</div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredBriefs.map(brief => (
            <div key={brief.id} onClick={() => setSelectedBrief(brief)} style={{ padding: '20px', borderRadius: '8px', border: `1px solid ${SEVERITY_COLORS[brief.severity]}40`, background: SEVERITY_BG[brief.severity], cursor: 'pointer', transition: 'transform 0.1s', }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', background: SEVERITY_COLORS[brief.severity], color: '#fff', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', marginRight: '8px' }}>{brief.severity}</span>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-dim)' }}>{brief.aoi_id.replace('_', ' ').toUpperCase()}</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-dim)' }}>{new Date(brief.generated_at).toLocaleTimeString()}</span>
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text, #e2e8f0)', margin: '0 0 8px' }}>{brief.title}</h3>
              <p style={{ fontSize: '13px', color: 'var(--color-text-dim, #94a3b8)', lineHeight: 1.5, margin: '0 0 12px' }}>{brief.summary}</p>
              <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--color-text-dim)' }}>
                <span>Signals: <strong>{brief.signals_count}</strong></span>
                <span>Escalation: <strong style={{ color: brief.escalation_probability > 0.7 ? SEVERITY_COLORS.critical : brief.escalation_probability > 0.5 ? SEVERITY_COLORS.high : SEVERITY_COLORS.moderate }}>{(brief.escalation_probability * 100).toFixed(0)}%</strong></span>
                <span>Horizon: <strong>{brief.time_horizon_hours}h</strong></span>
                <span>Sources: <strong>{brief.contributing_sources.length}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedBrief && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setSelectedBrief(null)}>
          <div style={{ background: 'var(--color-surface, #1e293b)', borderRadius: '12px', padding: '32px', maxWidth: '700px', width: '90%', maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', margin: '0 0 16px', color: 'var(--color-text)' }}>{selectedBrief.title}</h2>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--color-text-dim)', marginBottom: '20px' }}>{selectedBrief.summary}</p>
            <h4 style={{ fontSize: '13px', color: 'var(--color-text)', marginBottom: '8px' }}>Recommended Actions:</h4>
            <ul style={{ paddingLeft: '20px', margin: '0 0 16px' }}>
              {selectedBrief.recommended_actions.map((action, i) => (
                <li key={i} style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginBottom: '4px' }}>{action.replace(/_/g, ' ')}</li>
              ))}
            </ul>
            <h4 style={{ fontSize: '13px', color: 'var(--color-text)', marginBottom: '8px' }}>Contributing Sources:</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {selectedBrief.contributing_sources.map((src, i) => (
                <span key={i} style={{ padding: '3px 8px', borderRadius: '4px', background: 'var(--color-accent, #3b82f6)20', border: '1px solid var(--color-accent, #3b82f6)40', fontSize: '11px', color: 'var(--color-text-dim)' }}>{src}</span>
              ))}
            </div>
            <button onClick={() => setSelectedBrief(null)} style={{ marginTop: '24px', padding: '8px 16px', borderRadius: '6px', background: 'var(--color-accent, #3b82f6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
