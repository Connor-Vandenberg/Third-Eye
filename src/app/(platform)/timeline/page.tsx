'use client';

import { useState } from 'react';

interface TimelineEvent {
  id: string;
  timestamp: string;
  domain: 'conflict' | 'sanctions' | 'cyber' | 'economic' | 'maritime';
  title: string;
  severity: number;
  entity?: string;
}

const EVENTS: TimelineEvent[] = [
  { id: 't1', timestamp: '2026-07-24T18:05:00Z', domain: 'maritime', title: 'RAVEN-01 on station for visual confirm', severity: 0.7, entity: 'MV CASPIAN STAR' },
  { id: 't2', timestamp: '2026-07-24T17:58:00Z', domain: 'maritime', title: 'CBBA task allocation: ISR-REQ-0447', severity: 0.8, entity: 'MV CASPIAN STAR' },
  { id: 't3', timestamp: '2026-07-24T17:45:00Z', domain: 'conflict', title: 'HF radio burst anomaly in Black Sea grid', severity: 0.75 },
  { id: 't4', timestamp: '2026-07-24T17:30:00Z', domain: 'sanctions', title: 'OFAC SDN link confirmed via ownership chain', severity: 0.85, entity: 'MV CASPIAN STAR' },
  { id: 't5', timestamp: '2026-07-24T17:15:00Z', domain: 'economic', title: 'Wire $2.3M Dubai to Bandar Abbas', severity: 0.7, entity: 'Al-Rashid Trading FZE' },
  { id: 't6', timestamp: '2026-07-24T16:45:00Z', domain: 'maritime', title: 'AIS transponder goes dark', severity: 0.9, entity: 'MV CASPIAN STAR' },
  { id: 't7', timestamp: '2026-07-24T16:00:00Z', domain: 'cyber', title: 'Port network scan detected from Bandar Abbas', severity: 0.5 },
  { id: 't8', timestamp: '2026-07-24T14:30:00Z', domain: 'conflict', title: 'Military transport C-17A route deviation', severity: 0.6 },
  { id: 't9', timestamp: '2026-07-24T12:00:00Z', domain: 'sanctions', title: 'Shell company registration flagged in Dubai', severity: 0.55, entity: 'Dubai Shell Corp' },
  { id: 't10', timestamp: '2026-07-24T08:00:00Z', domain: 'economic', title: 'Unusual bulk cargo booking Bandar Abbas', severity: 0.4 },
  { id: 't11', timestamp: '2026-07-23T22:00:00Z', domain: 'maritime', title: 'Vessel departed Sevastopol without manifest', severity: 0.65, entity: 'MV CASPIAN STAR' },
  { id: 't12', timestamp: '2026-07-23T18:00:00Z', domain: 'cyber', title: 'Darknet forum post mentions Bandar Abbas shipment', severity: 0.45 },
];

const DOMAINS = ['conflict', 'sanctions', 'cyber', 'economic', 'maritime'] as const;
const DOMAIN_COLORS: Record<string, string> = {
  conflict: 'var(--red)',
  sanctions: 'var(--purple)',
  cyber: 'var(--accent)',
  economic: 'var(--amber)',
  maritime: 'var(--blue)',
};

export default function TimelinePage() {
  const [activeDomains, setActiveDomains] = useState<Set<string>>(new Set(DOMAINS));
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

  const toggleDomain = (d: string) => {
    const next = new Set(activeDomains);
    next.has(d) ? next.delete(d) : next.add(d);
    setActiveDomains(next);
  };

  const filtered = EVENTS.filter((e) => activeDomains.has(e.domain));

  const earliest = new Date('2026-07-23T08:00:00Z').getTime();
  const latest = new Date('2026-07-24T19:00:00Z').getTime();
  const range = latest - earliest;

  const getPosition = (ts: string) => ((new Date(ts).getTime() - earliest) / range) * 100;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 'var(--text-md)', fontWeight: 700 }}>Temporal Analysis</h1>
        <div style={{ display: 'flex', gap: '6px' }}>
          {DOMAINS.map((d) => (
            <button
              key={d}
              onClick={() => toggleDomain(d)}
              style={{
                padding: '4px 10px', fontSize: '10px', borderRadius: '4px', cursor: 'pointer',
                fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', textTransform: 'uppercase',
                border: '1px solid',
                borderColor: activeDomains.has(d) ? DOMAIN_COLORS[d] : 'var(--border-default)',
                background: activeDomains.has(d) ? 'var(--surface-3)' : 'transparent',
                color: activeDomains.has(d) ? DOMAIN_COLORS[d] : 'var(--text-muted)',
              }}
            >{d}</button>
          ))}
        </div>
      </div>

      {/* Swim Lanes */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        <div style={{ position: 'relative', minHeight: '100%' }}>
          {/* Time axis */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
            <span>Jul 23 08:00Z</span>
            <span>Jul 23 18:00Z</span>
            <span>Jul 24 04:00Z</span>
            <span>Jul 24 12:00Z</span>
            <span>Jul 24 19:00Z</span>
          </div>

          {/* Lanes */}
          {DOMAINS.filter((d) => activeDomains.has(d)).map((domain) => {
            const domainEvents = filtered.filter((e) => e.domain === domain);
            return (
              <div key={domain} style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', height: '44px' }}>
                <div style={{
                  width: '90px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase',
                  letterSpacing: '0.06em', color: DOMAIN_COLORS[domain], flexShrink: 0,
                }}>{domain}</div>
                <div style={{ flex: 1, position: 'relative', height: '100%', background: 'var(--surface-1)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                  {domainEvents.map((event) => {
                    const left = getPosition(event.timestamp);
                    const size = 8 + event.severity * 12;
                    return (
                      <div
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        title={event.title}
                        style={{
                          position: 'absolute',
                          left: `${left}%`,
                          top: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: `${size}px`,
                          height: `${size}px`,
                          borderRadius: '50%',
                          background: DOMAIN_COLORS[domain],
                          opacity: 0.7 + event.severity * 0.3,
                          cursor: 'pointer',
                          border: selectedEvent?.id === event.id ? '2px solid white' : 'none',
                          transition: 'transform 150ms cubic-bezier(0.16,1,0.3,1)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.4)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)')}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Detail */}
      {selectedEvent && (
        <div style={{
          padding: '16px 20px', borderTop: '1px solid var(--border-subtle)',
          background: 'var(--surface-1)', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '16px', alignItems: 'center',
        }}>
          <div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
              {new Date(selectedEvent.timestamp).toLocaleString('en-GB', { hour12: false })}
            </span>
            <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: DOMAIN_COLORS[selectedEvent.domain], marginTop: '2px' }}>
              {selectedEvent.domain}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>{selectedEvent.title}</div>
            {selectedEvent.entity && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Entity: {selectedEvent.entity}</div>}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, color: selectedEvent.severity >= 0.7 ? 'var(--red)' : 'var(--amber)' }}>
            {selectedEvent.severity.toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
}
