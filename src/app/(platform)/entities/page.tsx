'use client';

import { useState } from 'react';
import { gzmApi, type QueryResult } from '@/lib/api';

export default function EntitiesPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<QueryResult['results']>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const data = await gzmApi.query(query.trim());
    setResults(data?.results || []);
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-xl font-bold text-white mb-2">Entity Search</h1>
      <p className="text-[13px] text-[rgba(240,240,255,0.5)] mb-6">
        Search the knowledge graph across 78 vertex types and 13M+ entities
      </p>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search entity, country, threat actor, vessel..."
          className="flex-1 px-4 py-2.5 rounded-lg text-[13px] text-white placeholder:text-[rgba(240,240,255,0.3)] outline-none focus:ring-1 focus:ring-cyan-500/50"
          style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.08)' }}
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-5 py-2.5 rounded-lg text-[12px] font-bold uppercase tracking-wide text-[#0a0a0f] transition-opacity hover:opacity-85 disabled:opacity-50"
          style={{ background: '#22d3ee' }}
        >
          {loading ? '...' : 'Search'}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-1.5">
          {results.map((r, i) => (
            <div
              key={r.vertex_id || i}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[rgba(255,255,255,0.02)] transition-colors cursor-pointer"
              style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.04)' }}
            >
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(34,211,238,0.1)', color: '#22d3ee' }}>
                {r.vertex_type || '?'}
              </span>
              <span className="text-[13px] text-white font-medium truncate">{r.name || r.vertex_id}</span>
              {r.country && <span className="text-[11px] text-[rgba(240,240,255,0.4)] ml-auto">📍 {r.country}</span>}
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && !loading && query && (
        <p className="text-center text-[13px] text-[rgba(240,240,255,0.3)] py-12">No results. Try a different query.</p>
      )}
    </div>
  );
}
