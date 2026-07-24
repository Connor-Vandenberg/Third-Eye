'use client';

import { useState, useEffect } from 'react';
import { IntBadge } from '@/components/int-badge';
import { ConfidenceBar } from '@/components/confidence-bar';
import { api } from '@/lib/api';

interface DossierData {
  name: string;
  type: string;
  id: string;
  risk_score: number;
  confidence: number;
  convergence: number;
  last_observed: string;
  location?: { lat: number; lon: number };
  description?: string;
  identifiers: Record<string, string>;
  sources: Array<{ discipline: string; detail: string; timestamp: string; confidence: number }>;
  connections: Array<{ target: string; relationship: string; weight: number }>;
  timeline: Array<{ timestamp: string; event: string; domain: string; severity: number }>;
  collection_history: Array<{ platform: string; sensor: string; timestamp: string; result: string }>;
}

// Fallback mock for demo (when backend is not running)
const MOCK_DOSSIER: DossierData = {
  name: 'MV CASPIAN STAR',
  type: 'Maritime Vessel',
  id: 'GZM-ENT-4471',
  risk_score: 0.87,
  confidence: 0.64,
  convergence: 0.91,
  last_observed: '2026-07-24T14:22:00Z',
  location: { lat: 34.052, lon: -118.244 },
  description: 'Bulk carrier flagged Panama, beneficial ownership traced through 2-hop shell company chain to OFAC SDN designated entity. AIS transponder dark since 14:22Z. Multiple convergence signals indicate potential sanctions evasion operation.',
  identifiers: { IMO: '9432871', MMSI: '256712000', Flag: 'Panama', Callsign: 'H3RC', Built: '2008', DWT: '45,200', Type: 'Bulk Carrier' },
  sources: [
    { discipline: 'OSINT', detail: 'AIS transponder went dark at 14:22Z near 34.05N, 118.24W. Last reported speed 8.2kts, heading 215.', timestamp: '4.2h ago', confidence: 0.95 },
    { discipline: 'SIGINT', detail: 'HF burst transmission detected at 8.291MHz, duration 2.3s. Pattern consistent with encrypted maritime comms. Bearing from coastal SIGINT station places source within 5nm of last AIS position.', timestamp: '2.1h ago', confidence: 0.72 },
    { discipline: 'MASINT', detail: 'ICEYE-X31 SAR pass detected vessel-sized radar return at 34.048N, 118.239W. Cross-section consistent with bulk carrier class. No AIS correlation = dark vessel confirmed.', timestamp: '1.8h ago', confidence: 0.85 },
    { discipline: 'OSINT', detail: 'Beneficial ownership chain: CASPIAN STAR -> Caspian Maritime Holdings (Malta) -> Al-Rashid Trading FZE (Dubai) -> IRGC-linked entity on OFAC SDN List.', timestamp: '12d ago', confidence: 0.82 },
    { discipline: 'FININT', detail: 'Wire transfer $2.3M from Al-Rashid Trading FZE to Bandar Abbas port agent (identified via leaked banking records). Timing correlates with vessel departure from Sevastopol.', timestamp: '3d ago', confidence: 0.75 },
    { discipline: 'IMINT', detail: 'RAVEN-01 tasked for visual confirmation. Currently en route to last known position. ETA: 8 minutes. Sensor: EO/IR gimbal, 4K resolution.', timestamp: 'PENDING', confidence: 0.0 },
  ],
  connections: [
    { target: 'Al-Rashid Trading FZE', relationship: 'OWNED_BY', weight: 0.9 },
    { target: 'Bandar Abbas Port', relationship: 'DESTINED_FOR', weight: 0.7 },
    { target: 'IRGC Quds Force Network', relationship: 'LINKED_TO (2-hop)', weight: 0.6 },
    { target: 'Captain Mohammad Ahmadi', relationship: 'CREWED_BY', weight: 0.5 },
    { target: 'Dubai Shell Corporation', relationship: 'FINANCED_BY', weight: 0.75 },
    { target: 'HF Transmission 8.291MHz', relationship: 'EMITTED', weight: 0.6 },
    { target: 'OFAC SDN List', relationship: 'SANCTIONED (via ownership)', weight: 0.95 },
  ],
  timeline: [
    { timestamp: '2026-07-23T18:00:00Z', event: 'Departed Sevastopol without filed manifest', domain: 'maritime', severity: 0.65 },
    { timestamp: '2026-07-24T08:00:00Z', event: 'Unusual bulk cargo booking at Bandar Abbas', domain: 'economic', severity: 0.4 },
    { timestamp: '2026-07-24T14:22:00Z', event: 'AIS transponder goes DARK', domain: 'maritime', severity: 0.9 },
    { timestamp: '2026-07-24T16:00:00Z', event: 'SIGINT: HF burst transmission detected', domain: 'conflict', severity: 0.7 },
    { timestamp: '2026-07-24T17:30:00Z', event: 'OFAC ownership chain confirmed', domain: 'sanctions', severity: 0.85 },
    { timestamp: '2026-07-24T17:58:00Z', event: 'CBBA: RAVEN-01 assigned ISR task', domain: 'maritime', severity: 0.8 },
    { timestamp: '2026-07-24T18:03:00Z', event: 'Convergence threshold crossed: 0.91', domain: 'maritime', severity: 0.91 },
  ],
  collection_history: [
    { platform: 'ICEYE-X31', sensor: 'SAR 25cm', timestamp: '2026-07-24T16:15:00Z', result: 'CONFIRMED: Vessel-sized return at expected position' },
    { platform: 'RAVEN-01', sensor: 'EO/IR', timestamp: '2026-07-24T18:05:00Z', result: 'IN PROGRESS: Visual sweep initiated' },
    { platform: 'AIS-RX-COASTAL', sensor: 'AIS Receiver', timestamp: '2026-07-24T14:22:00Z', result: 'NEGATIVE: Transponder signal lost' },
  ],
};

export default function EntityDossierPage({ params }: { params: { id: string } }) {
  const [dossier, setDossier] = useState<DossierData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'intel' | 'connections' | 'timeline' | 'collection'>('overview');

  useEffect(() => {
    const fetchDossier = async () => {
      try {
        const data = await api.dossier(decodeURIComponent(params.id));
        setDossier(data);
      } catch {
        // Fallback to mock for demo
        setDossier(MOCK_DOSSIER);
      } finally {
        setLoading(false);
      }
    };
    fetchDossier();
  }, [params.id]);

  if (loading) return <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Loading dossier...</div>;
  if (!dossier) return <div style={{ padding: '40px', color: 'var(--red)' }}>Entity not found</div>;

  const threatColor = dossier.risk_score >= 0.8 ? 'var(--red)' : dossier.risk_score >= 0.5 ? 'var(--amber)' : 'var(--green)';

  const TABS = ['overview', 'intel', 'connections', 'timeline', 'collection'] as const;

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>{dossier.type}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '4px' }}>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>{dossier.name}</h1>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: 700, color: threatColor }}>{dossier.risk_score.toFixed(2)}</span>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{dossier.id}</div>
      </div>

      {/* Score Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <ScoreCard label="Threat Score" value={dossier.risk_score} color={threatColor} />
        <ScoreCard label="Confidence" value={dossier.confidence} color={dossier.confidence >= 0.7 ? 'var(--green)' : 'var(--amber)'} />
        <ScoreCard label="Convergence" value={dossier.convergence} color={dossier.convergence >= 0.8 ? 'var(--red)' : 'var(--amber)'} />
        <ScoreCard label="INT Sources" value={dossier.sources.length} color="var(--accent)" isCount />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '8px 16px', fontSize: '12px', fontWeight: 600, borderRadius: '6px 6px 0 0',
            background: activeTab === tab ? 'var(--surface-2)' : 'transparent',
            color: activeTab === tab ? 'var(--accent)' : 'var(--text-muted)',
            border: 'none', cursor: 'pointer', textTransform: 'capitalize',
          }}>{tab}</button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          <div>
            {dossier.description && <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>{dossier.description}</p>}
            <SectionTitle>Identifiers</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {Object.entries(dossier.identifiers).map(([key, val]) => (
                <div key={key} style={{ padding: '8px 12px', background: 'var(--surface-2)', borderRadius: '5px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{key}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 500 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <SectionTitle>Quick Actions</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <ActionButton label="Task Drone (RAVEN-01)" accent />
              <ActionButton label="Task Satellite (ICEYE)" />
              <ActionButton label="Generate Report" />
              <ActionButton label="Export STIX 2.1" />
              <ActionButton label="Track Entity" />
              <ActionButton label="Add to Watchlist" />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'intel' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {dossier.sources.map((src, i) => (
            <div key={i} style={{ padding: '14px 16px', background: 'var(--surface-2)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <IntBadge discipline={src.discipline as any} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>{src.timestamp}</span>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ConfidenceBar value={src.confidence} width={40} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>{src.confidence.toFixed(2)}</span>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{src.detail}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'connections' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {dossier.connections.map((conn, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--surface-2)', borderRadius: '6px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 600, color: 'var(--accent)', padding: '2px 8px', background: 'var(--accent-subtle)', borderRadius: '3px' }}>{conn.relationship}</span>
              <span style={{ fontSize: '13px', fontWeight: 500 }}>{conn.target}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>{conn.weight.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'timeline' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {dossier.timeline.map((event, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: 'auto auto 1fr auto', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '6px', background: i % 2 === 0 ? 'var(--surface-2)' : 'transparent' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', minWidth: '100px' }}>{new Date(event.timestamp).toLocaleString('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}</span>
              <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: `var(--${event.domain === 'maritime' ? 'blue' : event.domain === 'sanctions' ? 'purple' : event.domain === 'conflict' ? 'red' : event.domain === 'economic' ? 'amber' : 'accent'})`, minWidth: '70px' }}>{event.domain}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{event.event}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: event.severity >= 0.8 ? 'var(--red)' : 'var(--amber)' }}>{event.severity.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'collection' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <SectionTitle>Collection History</SectionTitle>
          {dossier.collection_history.map((ch, i) => (
            <div key={i} style={{ padding: '12px 16px', background: 'var(--surface-2)', borderRadius: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: 'var(--domain-aerial)' }}>{ch.platform}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(ch.timestamp).toLocaleTimeString('en-GB', { hour12: false })}</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Sensor: {ch.sensor}</div>
              <div style={{ fontSize: '12px', color: ch.result.startsWith('CONFIRMED') ? 'var(--green)' : ch.result.startsWith('NEGATIVE') ? 'var(--red)' : 'var(--amber)' }}>{ch.result}</div>
            </div>
          ))}
          <SectionTitle>Active ISR Requirements</SectionTitle>
          <div style={{ padding: '14px 16px', background: 'var(--amber-subtle)', borderRadius: '6px', border: '1px dashed var(--amber)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: 'var(--amber)', marginBottom: '4px' }}>ISR-REQ-0447 (ACTIVE)</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Visual confirmation of vessel at last known position. Assigned: RAVEN-01. Status: EN ROUTE.</div>
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreCard({ label, value, color, isCount }: { label: string; value: number; color: string; isCount?: boolean }) {
  return (
    <div style={{ padding: '14px 16px', background: 'var(--surface-2)', borderRadius: '8px' }}>
      <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '28px', fontWeight: 700, color }}>{isCount ? value : value.toFixed(2)}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '10px', marginTop: '16px' }}>{children}</div>;
}

function ActionButton({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <button style={{
      padding: '10px 16px', fontSize: '12px', fontWeight: 600, borderRadius: '6px', cursor: 'pointer', textAlign: 'left',
      background: accent ? 'var(--accent-subtle)' : 'var(--surface-2)',
      border: `1px solid ${accent ? 'var(--accent)' : 'var(--border-default)'}`,
      color: accent ? 'var(--accent)' : 'var(--text-secondary)',
    }}>{label}</button>
  );
}
