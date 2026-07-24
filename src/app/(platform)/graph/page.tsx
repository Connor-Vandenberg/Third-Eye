'use client';

import { useState, useCallback } from 'react';

interface GraphNode {
  id: string;
  label: string;
  type: string;
  threat: number;
  x: number;
  y: number;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  weight: number;
}

const INITIAL_NODES: GraphNode[] = [
  { id: '1', label: 'MV CASPIAN STAR', type: 'vessel', threat: 0.87, x: 400, y: 300 },
  { id: '2', label: 'Al-Rashid Trading FZE', type: 'organization', threat: 0.72, x: 250, y: 150 },
  { id: '3', label: 'Bandar Abbas Port', type: 'facility', threat: 0.55, x: 600, y: 200 },
  { id: '4', label: 'IRAN_SANCTIONS_LIST', type: 'sanctions', threat: 0.90, x: 150, y: 350 },
  { id: '5', label: 'Dubai Shell Corp', type: 'organization', threat: 0.65, x: 350, y: 500 },
  { id: '6', label: 'HF Transmission 8.291MHz', type: 'signal', threat: 0.60, x: 550, y: 420 },
  { id: '7', label: 'Captain Ahmadi', type: 'person', threat: 0.48, x: 650, y: 350 },
  { id: '8', label: 'Wire Transfer $2.3M', type: 'transaction', threat: 0.70, x: 200, y: 480 },
];

const INITIAL_EDGES: GraphEdge[] = [
  { id: 'e1', source: '1', target: '2', label: 'OWNED_BY', weight: 0.9 },
  { id: 'e2', source: '1', target: '3', label: 'DESTINED_FOR', weight: 0.7 },
  { id: 'e3', source: '2', target: '4', label: 'SANCTIONED', weight: 0.95 },
  { id: 'e4', source: '2', target: '5', label: 'SUBSIDIARY_OF', weight: 0.8 },
  { id: 'e5', source: '5', target: '8', label: 'INITIATED', weight: 0.75 },
  { id: 'e6', source: '8', target: '3', label: 'RECEIVED_BY', weight: 0.7 },
  { id: 'e7', source: '1', target: '6', label: 'EMITTED', weight: 0.6 },
  { id: 'e8', source: '1', target: '7', label: 'CREWED_BY', weight: 0.5 },
  { id: 'e9', source: '7', target: '4', label: 'ASSOCIATED_WITH', weight: 0.4 },
];

const TYPE_COLORS: Record<string, string> = {
  vessel: '#3b82f6',
  organization: '#8b5cf6',
  facility: '#f59e0b',
  sanctions: '#ef4444',
  signal: '#06b6d4',
  person: '#10b981',
  transaction: '#f97316',
};

export default function GraphPage() {
  const [nodes] = useState(INITIAL_NODES);
  const [edges] = useState(INITIAL_EDGES);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [layout, setLayout] = useState<'force' | 'hierarchical' | 'radial'>('force');

  const filteredNodes = searchQuery
    ? nodes.filter((n) => n.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : nodes;

  const getNodeRadius = (node: GraphNode) => 16 + node.threat * 20;

  return (
    <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '1fr 280px' }}>
      {/* Canvas */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--surface-0)' }}>
        {/* Controls */}
        <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10, display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search entities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'var(--surface-2)', border: '1px solid var(--border-default)',
              borderRadius: '6px', padding: '8px 12px', fontSize: '13px',
              color: 'var(--text-primary)', width: '200px', outline: 'none',
            }}
          />
          {(['force', 'hierarchical', 'radial'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLayout(l)}
              style={{
                padding: '6px 10px', fontSize: '11px', borderRadius: '4px',
                border: '1px solid', cursor: 'pointer', fontFamily: 'var(--font-mono)',
                borderColor: layout === l ? 'var(--accent)' : 'var(--border-default)',
                background: layout === l ? 'var(--accent-subtle)' : 'var(--surface-2)',
                color: layout === l ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >{l}</button>
          ))}
        </div>

        {/* SVG Graph */}
        <svg width="100%" height="100%" viewBox="0 0 800 600" style={{ cursor: 'grab' }}>
          {/* Edges */}
          {edges.map((edge) => {
            const source = nodes.find((n) => n.id === edge.source);
            const target = nodes.find((n) => n.id === edge.target);
            if (!source || !target) return null;
            return (
              <g key={edge.id}>
                <line
                  x1={source.x} y1={source.y} x2={target.x} y2={target.y}
                  stroke="oklch(40% 0.01 250)" strokeWidth={1 + edge.weight}
                  strokeOpacity={0.5}
                />
                <text
                  x={(source.x + target.x) / 2} y={(source.y + target.y) / 2 - 6}
                  fill="oklch(50% 0.01 250)" fontSize="9" textAnchor="middle"
                  fontFamily="var(--font-mono)"
                >{edge.label}</text>
              </g>
            );
          })}

          {/* Nodes */}
          {filteredNodes.map((node) => {
            const r = getNodeRadius(node);
            const isSelected = selectedNode?.id === node.id;
            return (
              <g key={node.id} onClick={() => setSelectedNode(node)} style={{ cursor: 'pointer' }}>
                <circle
                  cx={node.x} cy={node.y} r={r}
                  fill={TYPE_COLORS[node.type] || '#6b7280'}
                  fillOpacity={0.2}
                  stroke={TYPE_COLORS[node.type] || '#6b7280'}
                  strokeWidth={isSelected ? 3 : 1.5}
                  strokeOpacity={isSelected ? 1 : 0.7}
                />
                <text
                  x={node.x} y={node.y + r + 14}
                  fill="var(--text-secondary)" fontSize="10" textAnchor="middle"
                  fontWeight={isSelected ? 600 : 400}
                >{node.label}</text>
                {node.threat >= 0.7 && (
                  <text x={node.x} y={node.y + 4} fill="white" fontSize="10" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight={700}>
                    {node.threat.toFixed(2)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Stats */}
        <div style={{
          position: 'absolute', bottom: 12, left: 12, fontFamily: 'var(--font-mono)',
          fontSize: '11px', color: 'var(--text-muted)', background: 'oklch(10% 0.012 250 / 0.9)',
          padding: '4px 10px', borderRadius: '4px',
        }}>
          {nodes.length} nodes | {edges.length} edges | Layout: {layout}
        </div>
      </div>

      {/* Detail Panel */}
      <div style={{ borderLeft: '1px solid var(--border-subtle)', padding: '16px', overflow: 'auto', background: 'var(--surface-1)' }}>
        {selectedNode ? (
          <div>
            <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: TYPE_COLORS[selectedNode.type] || 'var(--text-muted)', marginBottom: '4px' }}>
              {selectedNode.type}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>{selectedNode.label}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px' }}>Node ID: {selectedNode.id}</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              <div style={{ background: 'var(--surface-2)', padding: '10px', borderRadius: '6px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Threat</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700, color: selectedNode.threat >= 0.7 ? 'var(--red)' : 'var(--amber)' }}>{selectedNode.threat.toFixed(2)}</div>
              </div>
              <div style={{ background: 'var(--surface-2)', padding: '10px', borderRadius: '6px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Connections</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>{edges.filter((e) => e.source === selectedNode.id || e.target === selectedNode.id).length}</div>
              </div>
            </div>

            <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '8px' }}>Relationships</div>
            {edges.filter((e) => e.source === selectedNode.id || e.target === selectedNode.id).map((e) => {
              const other = nodes.find((n) => n.id === (e.source === selectedNode.id ? e.target : e.source));
              return (
                <div key={e.id} style={{ padding: '8px 10px', background: 'var(--surface-2)', borderRadius: '5px', marginBottom: '4px', fontSize: '12px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--accent)' }}>{e.label}</span>
                  <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{other?.label || 'Unknown'}</div>
                </div>
              );
            })}

            <div style={{ marginTop: '16px', display: 'flex', gap: '6px' }}>
              <button style={{ flex: 1, padding: '8px', fontSize: '11px', fontWeight: 600, background: 'var(--accent-subtle)', border: '1px solid var(--accent)', borderRadius: '5px', color: 'var(--accent)', cursor: 'pointer' }}>Expand 1-Hop</button>
              <button style={{ flex: 1, padding: '8px', fontSize: '11px', fontWeight: 600, background: 'var(--surface-3)', border: '1px solid var(--border-default)', borderRadius: '5px', color: 'var(--text-secondary)', cursor: 'pointer' }}>Find Paths</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
            Click a node to inspect its relationships and expand the graph.
          </div>
        )}
      </div>
    </div>
  );
}
