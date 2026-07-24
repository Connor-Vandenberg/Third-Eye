'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

const REPORT_TYPES = [
  { id: 'country', label: 'Country Briefing', description: 'Multi-domain intelligence briefing for a specific country', icon: '\uD83C\uDF0D' },
  { id: 'dossier', label: 'Entity Dossier', description: 'Full intelligence profile on a tracked entity', icon: '\uD83D\uDCC4' },
  { id: 'sitrep', label: 'Situation Report', description: 'Daily digest of convergence events and threat changes', icon: '\uD83D\uDCCB' },
  { id: 'isr', label: 'ISR Collection Summary', description: 'What was tasked, collected, and confirmed today', icon: '\uD83D\uDEF0\uFE0F' },
];

const COUNTRIES = ['Iran', 'Russia', 'China', 'North Korea', 'Syria', 'Yemen', 'Ukraine', 'Taiwan', 'Venezuela', 'Myanmar', 'Libya', 'Somalia', 'Lebanon', 'Pakistan', 'Afghanistan', 'Sudan', 'Ethiopia', 'Mali', 'Mozambique'];

export default function ReportsPage() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [country, setCountry] = useState('Iran');
  const [entityName, setEntityName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setGenerating(true);
    setError(null);
    setReport(null);

    try {
      if (selectedType === 'country') {
        const data = await api.briefing(country);
        setReport(data);
      } else if (selectedType === 'dossier') {
        const data = await api.dossier(entityName || 'MV CASPIAN STAR');
        setReport(data);
      } else {
        // Mock for sitrep and ISR summary
        setReport({ type: selectedType, generated_at: new Date().toISOString(), status: 'Report generation requires backend pipeline. Content would appear here.' });
      }
    } catch (e: any) {
      setError(e.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '320px 1fr', overflow: 'hidden' }}>
      {/* Left: Report Type Selection */}
      <div style={{ borderRight: '1px solid var(--border-subtle)', padding: '20px', overflow: 'auto' }}>
        <h1 style={{ fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: '16px' }}>Generate Report</h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
          {REPORT_TYPES.map((type) => (
            <div
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              style={{
                padding: '14px 16px', borderRadius: '8px', cursor: 'pointer',
                background: selectedType === type.id ? 'var(--accent-subtle)' : 'var(--surface-2)',
                border: `1px solid ${selectedType === type.id ? 'var(--accent)' : 'var(--border-subtle)'}`,
                transition: 'all 150ms',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>{type.icon}</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: selectedType === type.id ? 'var(--accent)' : 'var(--text-primary)' }}>{type.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{type.description}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Parameters */}
        {selectedType === 'country' && (
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Country</label>
            <select value={country} onChange={(e) => setCountry(e.target.value)} style={{ width: '100%', padding: '10px 12px', background: 'var(--surface-2)', border: '1px solid var(--border-default)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px' }}>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}

        {selectedType === 'dossier' && (
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Entity Name</label>
            <input value={entityName} onChange={(e) => setEntityName(e.target.value)} placeholder="MV CASPIAN STAR" style={{ width: '100%', padding: '10px 12px', background: 'var(--surface-2)', border: '1px solid var(--border-default)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }} />
          </div>
        )}

        {selectedType && (
          <button onClick={generate} disabled={generating} style={{ width: '100%', padding: '12px', marginTop: '16px', background: generating ? 'var(--surface-3)' : 'var(--accent)', border: 'none', borderRadius: '6px', color: generating ? 'var(--text-muted)' : 'var(--surface-0)', fontSize: '13px', fontWeight: 600, cursor: generating ? 'wait' : 'pointer' }}>
            {generating ? 'Generating...' : 'Generate Report'}
          </button>
        )}
      </div>

      {/* Right: Report Output */}
      <div style={{ padding: '24px', overflow: 'auto' }}>
        {!report && !error && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '14px' }}>
            Select a report type and click Generate
          </div>
        )}
        {error && <div style={{ padding: '20px', background: 'var(--red-subtle)', borderRadius: '8px', color: 'var(--red)', fontSize: '13px' }}>{error}</div>}
        {report && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Generated Report</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ padding: '8px 14px', fontSize: '11px', fontWeight: 600, background: 'var(--surface-2)', border: '1px solid var(--border-default)', borderRadius: '5px', color: 'var(--text-secondary)', cursor: 'pointer' }}>Export PDF</button>
                <button style={{ padding: '8px 14px', fontSize: '11px', fontWeight: 600, background: 'var(--surface-2)', border: '1px solid var(--border-default)', borderRadius: '5px', color: 'var(--text-secondary)', cursor: 'pointer' }}>Export STIX</button>
                <button style={{ padding: '8px 14px', fontSize: '11px', fontWeight: 600, background: 'var(--surface-2)', border: '1px solid var(--border-default)', borderRadius: '5px', color: 'var(--text-secondary)', cursor: 'pointer' }}>Copy</button>
              </div>
            </div>
            <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--surface-2)', padding: '20px', borderRadius: '8px', overflow: 'auto', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {JSON.stringify(report, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
