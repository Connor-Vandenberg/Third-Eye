'use client';

import { useState, useCallback } from 'react';
import { gzmApi, type BriefingResponse } from '@/lib/api';

const COUNTRIES = [
  'Russia', 'China', 'Iran', 'North Korea', 'Ukraine', 'Syria',
  'Sudan', 'Yemen', 'Afghanistan', 'Somalia', 'Myanmar', 'Venezuela',
  'Pakistan', 'Turkey', 'Iraq', 'Libya', 'Mali', 'Nigeria', 'Ethiopia',
];

const THREAT_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f59e0b',
  ELEVATED: '#eab308',
  MODERATE: '#3b82f6',
  LOW: '#10b981',
};

export default function ReportsPage() {
  const [selectedCountry, setSelectedCountry] = useState('');
  const [briefing, setBriefing] = useState<BriefingResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const generateBriefing = useCallback(async (country: string) => {
    if (!country) return;
    setSelectedCountry(country);
    setLoading(true);
    const data = await gzmApi.briefing(country);
    if (data) setBriefing(data);
    setLoading(false);
  }, []);

  const threatColor = THREAT_COLORS[briefing?.threat_level || ''] || '#6b7280';

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-[20px] font-bold text-white tracking-tight mb-1">Intelligence Reports</h1>
      <p className="text-[12px] mb-6" style={{ color: 'rgba(240,240,255,0.45)' }}>
        Country briefings \u00b7 Convergence reports \u00b7 Situation analysis \u00b7 5-domain scoring
      </p>

      {/* Country Grid */}
      <div className="mb-6">
        <div className="text-[9px] uppercase tracking-wide mb-3" style={{ color: 'rgba(240,240,255,0.3)' }}>Select country for intelligence briefing</div>
        <div className="flex flex-wrap gap-2">
          {COUNTRIES.map(country => (
            <button
              key={country}
              onClick={() => generateBriefing(country)}
              className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                selectedCountry === country ? 'text-white' : 'text-[rgba(240,240,255,0.5)] hover:text-white'
              }`}
              style={{
                background: selectedCountry === country ? 'rgba(34,211,238,0.1)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${selectedCountry === country ? 'rgba(34,211,238,0.3)' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              {country}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="text-[12px] animate-pulse py-8" style={{ color: 'rgba(240,240,255,0.35)' }}>Generating intelligence briefing for {selectedCountry}...</div>}

      {/* Briefing Display */}
      {briefing && !loading && (
        <div className="rounded-lg p-6" style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-[18px] font-bold text-white">{briefing.country}</h2>
              <div className="text-[10px] mt-1" style={{ color: 'rgba(240,240,255,0.4)' }}>Intelligence Briefing</div>
            </div>
            <div className="text-right">
              <div className="text-[9px] uppercase tracking-wide mb-1" style={{ color: 'rgba(240,240,255,0.3)' }}>Threat Level</div>
              <div className="text-[20px] font-bold" style={{ color: threatColor }}>{briefing.threat_level}</div>
              <div className="text-[24px] font-bold tabular-nums" style={{ color: threatColor }}>{briefing.score?.toFixed(0)}/100</div>
            </div>
          </div>

          {/* Domain Breakdown */}
          {briefing.domains && Object.keys(briefing.domains).length > 0 && (
            <div className="mb-5">
              <div className="text-[9px] uppercase tracking-wide mb-3" style={{ color: 'rgba(240,240,255,0.3)', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                Domain Analysis
              </div>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(briefing.domains).map(([domain, data]) => (
                  <div key={domain} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="text-[10px] font-bold uppercase mb-1" style={{ color: '#22d3ee' }}>{domain}</div>
                    {typeof data === 'object' && data && (
                      <div className="text-[10px] space-y-0.5" style={{ color: 'rgba(240,240,255,0.5)' }}>
                        {(data as Record<string, unknown>).count != null && <div>Count: {String((data as Record<string, unknown>).count)}</div>}
                        {(data as Record<string, unknown>).entities != null && <div>Entities: {String((data as Record<string, unknown>).entities)}</div>}
                        {(data as Record<string, unknown>).summary && <div className="mt-1 text-[9px]">{String((data as Record<string, unknown>).summary)}</div>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {briefing.recommendations?.length > 0 && (
            <div>
              <div className="text-[9px] uppercase tracking-wide mb-2" style={{ color: 'rgba(240,240,255,0.3)', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                Recommendations
              </div>
              <ul className="space-y-1.5">
                {briefing.recommendations.map((rec, i) => (
                  <li key={i} className="text-[11px] flex gap-2" style={{ color: 'rgba(240,240,255,0.6)' }}>
                    <span style={{ color: '#22d3ee' }}>\u2022</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Top Entities */}
          {briefing.top_entities?.length && briefing.top_entities.length > 0 && (
            <div className="mt-5">
              <div className="text-[9px] uppercase tracking-wide mb-2" style={{ color: 'rgba(240,240,255,0.3)', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                Key Entities
              </div>
              <div className="space-y-1">
                {briefing.top_entities.map((ent, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] py-1">
                    <span className="text-white font-medium">{ent.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono" style={{ color: 'rgba(240,240,255,0.35)' }}>{ent.type}</span>
                      <span className="tabular-nums font-bold" style={{ color: ent.risk > 70 ? '#ef4444' : ent.risk > 40 ? '#f59e0b' : '#10b981' }}>
                        {ent.risk}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!briefing && !loading && (
        <div className="text-center py-16 text-[12px]" style={{ color: 'rgba(240,240,255,0.3)' }}>
          Select a country above to generate an intelligence briefing
        </div>
      )}
    </div>
  );
}
