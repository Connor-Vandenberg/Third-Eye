'use client';

import { useEffect, useState } from 'react';
import { gzmApi, type GZMAlert } from '@/lib/api';

const DOMAINS = ['sanctions', 'conflict', 'cyber', 'economic', 'other'] as const;
const DOMAIN_COLORS: Record<string, string> = {
  sanctions: '#ef4444',
  conflict: '#f59e0b',
  cyber: '#a855f7',
  economic: '#10b981',
  other: '#6b7280',
};

export default function TimelinePage() {
  const [alerts, setAlerts] = useState<GZMAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await gzmApi.alerts(200);
      if (data) setAlerts(data.alerts || []);
      setLoading(false);
    };
    load();
  }, []);

  // Bucket alerts into domain lanes
  const lanes = DOMAINS.map(domain => {
    const items = alerts.filter(a => {
      const vt = (a.vertex_type || a.source || '').toLowerCase();
      if (domain === 'sanctions') return vt.includes('sanction') || vt.includes('sdn') || vt.includes('pep');
      if (domain === 'conflict') return vt.includes('conflict') || vt.includes('acled') || vt.includes('event');
      if (domain === 'cyber') return vt.includes('cyber') || vt.includes('threat') || vt.includes('convergence');
      if (domain === 'economic') return vt.includes('market') || vt.includes('economic') || vt.includes('gpr');
      return true;
    });
    return { domain, items, color: DOMAIN_COLORS[domain] };
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-[20px] font-bold text-white tracking-tight mb-1">Temporal Analysis</h1>
      <p className="text-[12px] mb-6" style={{ color: 'rgba(240,240,255,0.45)' }}>
        Cross-domain signal timeline \u00b7 5 intelligence lanes \u00b7 Temporal decay visualization
      </p>

      {loading && <div className="text-[12px] animate-pulse py-12 text-center" style={{ color: 'rgba(240,240,255,0.35)' }}>Loading temporal data...</div>}

      {!loading && (
        <div className="space-y-4">
          {lanes.map(({ domain, items, color }) => (
            <div key={domain}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color }}>{domain}</span>
                <span className="text-[9px] font-mono tabular-nums" style={{ color: 'rgba(240,240,255,0.25)' }}>
                  {items.length} signals
                </span>
              </div>
              <div
                className="relative h-12 rounded-lg overflow-hidden"
                style={{ background: `${color}08`, border: `1px solid ${color}20` }}
              >
                {/* Signal dots distributed across the lane */}
                {items.slice(0, 50).map((item, i) => (
                  <div
                    key={item.vertex_id || i}
                    className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full hover:scale-150 transition-transform cursor-pointer"
                    style={{
                      left: `${(i / Math.max(items.length, 1)) * 95 + 2}%`,
                      background: color,
                      opacity: 0.6 + (item.score || 0.3) * 0.4,
                    }}
                    title={`${item.name || item.vertex_id} (${item.country || '?'})`}
                  />
                ))}
                {items.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-[10px]" style={{ color: `${color}60` }}>
                    No signals in this domain
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 text-[10px]" style={{ color: 'rgba(240,240,255,0.2)' }}>
        Next: D3.js temporal visualization with date range selector, zoom/pan, and event detail on hover
      </div>
    </div>
  );
}
