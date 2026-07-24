'use client';

import { useEffect, useState } from 'react';
import { gzmApi, type GZMAlert } from '@/lib/api';

const DOMAIN_FILTERS = ['all', 'conflict', 'sanctions', 'cyber', 'economic', 'military', 'maritime'] as const;
type DomainFilter = typeof DOMAIN_FILTERS[number];

export default function IntelPage() {
  const [items, setItems] = useState<GZMAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [domain, setDomain] = useState<DomainFilter>('all');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await gzmApi.alerts(200);
      if (data) setItems(data.alerts || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = domain === 'all'
    ? items
    : items.filter(item => {
        const vt = (item.vertex_type || item.source || '').toLowerCase();
        return vt.includes(domain);
      });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-[20px] font-bold text-white tracking-tight mb-1">Intelligence Feed</h1>
      <p className="text-[12px] mb-5" style={{ color: 'rgba(240,240,255,0.45)' }}>
        Aggregated signals from GDELT, POLECAT, ACLED, RSS, prediction markets, and 140+ sources
      </p>

      {/* Domain Filter Tabs */}
      <div className="flex gap-1 mb-5 flex-wrap">
        {DOMAIN_FILTERS.map(d => (
          <button
            key={d}
            onClick={() => setDomain(d)}
            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${
              domain === d ? 'text-cyan-400' : 'text-[rgba(240,240,255,0.35)] hover:text-[rgba(240,240,255,0.6)]'
            }`}
            style={{
              background: domain === d ? 'rgba(34,211,238,0.08)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${domain === d ? 'rgba(34,211,238,0.2)' : 'rgba(255,255,255,0.04)'}`,
            }}
          >
            {d}
          </button>
        ))}
      </div>

      {loading && <div className="text-[12px] animate-pulse py-12 text-center" style={{ color: 'rgba(240,240,255,0.35)' }}>Loading intelligence feed...</div>}

      <div className="space-y-2">
        {filtered.map((item, i) => (
          <div
            key={item.vertex_id || i}
            className="flex items-start gap-3 px-4 py-3 rounded-lg hover:bg-[rgba(255,255,255,0.02)] transition-colors"
            style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.04)' }}
          >
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-white truncate mb-1">
                {item.name || item.entity_name || item.vertex_id || 'Signal'}
              </div>
              <div className="flex items-center gap-3 text-[10px]" style={{ color: 'rgba(240,240,255,0.4)' }}>
                {item.vertex_type && (
                  <span className="font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    {item.vertex_type}
                  </span>
                )}
                {item.country && <span>\u{1F4CD} {item.country}</span>}
                {item.source && <span>via {item.source}</span>}
              </div>
            </div>
            {item.score != null && (
              <span className="text-[10px] font-mono tabular-nums flex-shrink-0" style={{ color: item.score > 0.7 ? '#ef4444' : item.score > 0.4 ? '#f59e0b' : '#10b981' }}>
                {(item.score * 100).toFixed(0)}%
              </span>
            )}
          </div>
        ))}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-[12px]" style={{ color: 'rgba(240,240,255,0.3)' }}>
          No intelligence signals for this domain filter
        </div>
      )}
    </div>
  );
}
