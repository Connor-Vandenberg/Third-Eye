'use client';

import { useState, useCallback } from 'react';
import { gzmApi, type QueryResult } from '@/lib/api';

export default function GraphPage() {
  const [query, setQuery] = useState('');
  const [nodes, setNodes] = useState<QueryResult['results']>([]);
  const [loading, setLoading] = useState(false);

  const explore = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    const data = await gzmApi.query(query.trim(), 30);
    if (data?.results) setNodes(prev => [...prev, ...data.results]);
    setLoading(false);
  }, [query]);

  return (
    <div className="flex flex-col h-[calc(100vh-40px)]">
      {/* Search bar */}
      <div className="flex items-center gap-3 px-5 py-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && explore()}
          placeholder="Explore: entity, threat actor, country..."
          className="flex-1 px-4 py-2 rounded-lg text-[12px] text-white placeholder:text-[rgba(240,240,255,0.25)] outline-none focus:ring-1 focus:ring-cyan-500/40"
          style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.06)' }}
        />
        <button onClick={explore} disabled={loading} className="px-4 py-2 rounded-lg text-[11px] font-bold" style={{ background: '#22d3ee', color: '#0a0a0f' }}>
          Explore
        </button>
        <button onClick={() => setNodes([])} className="px-3 py-2 rounded-lg text-[11px]" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(240,240,255,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
          Reset
        </button>
        <span className="text-[10px] font-mono tabular-nums" style={{ color: 'rgba(240,240,255,0.3)' }}>
          {nodes.length} nodes
        </span>
      </div>

      {/* Graph Canvas Area */}
      <div className="flex-1 relative" style={{ background: '#0a0a0f' }}>
        {nodes.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ color: 'rgba(240,240,255,0.25)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-4 opacity-30">
              <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
              <line x1="12" y1="2" x2="12" y2="9"/><line x1="12" y1="15" x2="12" y2="22"/>
              <line x1="2" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="22" y2="12"/>
            </svg>
            <p className="text-[13px]">Search an entity to explore the knowledge graph</p>
            <p className="text-[10px] mt-1 opacity-50">78 vertex types \u00b7 55 edge types \u00b7 10 installed algorithms</p>
            <p className="text-[10px] mt-3 opacity-40">Next: npm install @xyflow/react for React Flow visualization</p>
          </div>
        ) : (
          /* Placeholder grid showing discovered nodes */
          <div className="p-5 grid grid-cols-4 gap-2 overflow-y-auto h-full">
            {nodes.map((n, i) => (
              <div
                key={n.vertex_id || i}
                className="p-3 rounded-lg text-center hover:scale-105 transition-transform cursor-pointer"
                style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.04)' }}
              >
                <div className="text-[10px] font-mono mb-1" style={{ color: '#22d3ee' }}>{n.vertex_type || '?'}</div>
                <div className="text-[11px] text-white font-medium truncate">{n.name || n.vertex_id}</div>
                {n.country && <div className="text-[9px] mt-1" style={{ color: 'rgba(240,240,255,0.3)' }}>{n.country}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
