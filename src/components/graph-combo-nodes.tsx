'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Network, ChevronRight, ChevronDown, Maximize2, Minimize2,
  Search, Filter, Eye, EyeOff, Layers, Target, Users,
  Globe, Shield, Zap, Activity
} from 'lucide-react';

// GRAPH COMBO NODES + FOREGROUNDING
// Cambridge Intelligence pattern: group related entities into expandable clusters
// Without this, 14.9M vertices = unusable white noise
// With this: analysts can navigate complex networks intuitively

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  domain: string;
  convergenceScore?: number;
  group?: string; // Combo group this node belongs to
  x?: number;
  y?: number;
  size?: number;
  color?: string;
  metadata?: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  weight: number;
  color?: string;
  label?: string;
}

export interface ComboGroup {
  id: string;
  label: string;
  type: string;
  nodeCount: number;
  expanded: boolean;
  color: string;
  convergenceScore?: number;
  childGroups?: string[];
}

interface GraphComboNodesProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  combos: ComboGroup[];
  selectedNodeId?: string | null;
  onNodeSelect: (nodeId: string | null) => void;
  onComboToggle: (comboId: string) => void;
  onComboExpand: (comboId: string) => void;
  onComboCollapse: (comboId: string) => void;
  foregroundDepth?: number; // How many hops to keep visible when selecting
  showLabels?: boolean;
  layout?: 'force' | 'hierarchical' | 'radial' | 'sequential';
  className?: string;
}

const TYPE_COLORS: Record<string, string> = {
  Person: '#ec4899',
  Organization: '#8b5cf6',
  Location: '#10b981',
  Vessel: '#06b6d4',
  Aircraft: '#f59e0b',
  ThreatActor: '#ef4444',
  Financial: '#3b82f6',
  CyberAsset: '#a855f7',
  Military: '#ef4444',
  Default: '#6b7280',
};

function ComboNode({ combo, isSelected, onToggle, onClick }: {
  combo: ComboGroup;
  isSelected: boolean;
  onToggle: () => void;
  onClick: () => void;
}) {
  return (
    <motion.div
      layout
      onClick={onClick}
      className={`relative cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-white/30' : ''
      }`}
      whileHover={{ scale: 1.05 }}
    >
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl border-2"
        style={{
          borderColor: combo.color,
          backgroundColor: `${combo.color}10`,
        }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className="p-0.5 rounded hover:bg-white/10"
        >
          {combo.expanded ? (
            <ChevronDown className="w-3.5 h-3.5" style={{ color: combo.color }} />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" style={{ color: combo.color }} />
          )}
        </button>

        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${combo.color}30` }}>
          <span className="text-[9px] font-bold" style={{ color: combo.color }}>{combo.nodeCount}</span>
        </div>

        <div>
          <span className="text-[10px] font-medium text-white block">{combo.label}</span>
          <span className="text-[8px] text-zinc-500">{combo.type} • {combo.nodeCount} entities</span>
        </div>

        {combo.convergenceScore && (
          <span className={`text-[9px] font-bold font-mono ml-auto ${
            combo.convergenceScore >= 80 ? 'text-red-400' : combo.convergenceScore >= 60 ? 'text-yellow-400' : 'text-zinc-500'
          }`}>
            {combo.convergenceScore}
          </span>
        )}
      </div>
    </motion.div>
  );
}

function GraphNodeComponent({ node, isSelected, isForeground, isBackground, onClick }: {
  node: GraphNode;
  isSelected: boolean;
  isForeground: boolean;
  isBackground: boolean;
  onClick: () => void;
}) {
  const color = node.color || TYPE_COLORS[node.type] || TYPE_COLORS.Default;
  const size = node.size || (node.convergenceScore ? 8 + node.convergenceScore * 0.2 : 12);

  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{
        left: node.x || 0,
        top: node.y || 0,
        transform: 'translate(-50%, -50%)',
        // FOREGROUNDING: Background entities fade to 10% opacity
        opacity: isBackground ? 0.1 : isForeground || isSelected ? 1 : 0.6,
        // Selected node gets glow
        filter: isSelected ? `drop-shadow(0 0 8px ${color})` : 'none',
        transition: 'opacity 0.3s ease, filter 0.3s ease',
      }}
      onClick={onClick}
      whileHover={{ scale: 1.3 }}
    >
      <div
        className={`rounded-full border-2 flex items-center justify-center ${
          isSelected ? 'ring-2 ring-white/50' : ''
        }`}
        style={{
          width: size,
          height: size,
          borderColor: color,
          backgroundColor: `${color}30`,
        }}
      >
        {size > 16 && (
          <span className="text-[6px] font-bold" style={{ color }}>
            {node.label.slice(0, 2)}
          </span>
        )}
      </div>

      {/* Label (only when not background) */}
      {!isBackground && size > 14 && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap">
          <span className="text-[7px] text-zinc-400 bg-zinc-900/80 px-1 rounded">{node.label}</span>
        </div>
      )}
    </motion.div>
  );
}

export function GraphComboNodes({
  nodes,
  edges,
  combos,
  selectedNodeId,
  onNodeSelect,
  onComboToggle,
  onComboExpand,
  onComboCollapse,
  foregroundDepth = 2,
  showLabels = true,
  layout = 'force',
  className = '',
}: GraphComboNodesProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Compute which nodes are in the foreground (within N hops of selected)
  const foregroundNodeIds = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();

    const visited = new Set<string>([selectedNodeId]);
    let frontier = [selectedNodeId];

    for (let depth = 0; depth < foregroundDepth; depth++) {
      const nextFrontier: string[] = [];
      frontier.forEach(nodeId => {
        edges.forEach(edge => {
          if (edge.source === nodeId && !visited.has(edge.target)) {
            visited.add(edge.target);
            nextFrontier.push(edge.target);
          }
          if (edge.target === nodeId && !visited.has(edge.source)) {
            visited.add(edge.source);
            nextFrontier.push(edge.source);
          }
        });
      });
      frontier = nextFrontier;
    }

    return visited;
  }, [selectedNodeId, edges, foregroundDepth]);

  // Visible nodes (expanded combos show children, collapsed show combo node)
  const visibleNodes = useMemo(() => {
    const expandedComboIds = new Set(combos.filter(c => c.expanded).map(c => c.id));
    return nodes.filter(node => {
      if (!node.group) return true; // Ungrouped nodes always visible
      return expandedComboIds.has(node.group); // Grouped nodes only if combo expanded
    });
  }, [nodes, combos]);

  // Visible edges (only between visible nodes)
  const visibleEdges = useMemo(() => {
    const visibleIds = new Set(visibleNodes.map(n => n.id));
    return edges.filter(e => visibleIds.has(e.source) && visibleIds.has(e.target));
  }, [edges, visibleNodes]);

  const filteredNodes = useMemo(() => {
    if (!searchQuery) return visibleNodes;
    const q = searchQuery.toLowerCase();
    return visibleNodes.filter(n => n.label.toLowerCase().includes(q) || n.type.toLowerCase().includes(q));
  }, [visibleNodes, searchQuery]);

  return (
    <div className={`flex flex-col bg-zinc-950 ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-zinc-800 px-4 py-2 flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entities..."
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-8 pr-3 py-1.5 text-[10px] text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[9px] text-zinc-500">{visibleNodes.length} nodes</span>
          <span className="text-[9px] text-zinc-600">•</span>
          <span className="text-[9px] text-zinc-500">{visibleEdges.length} edges</span>
          <span className="text-[9px] text-zinc-600">•</span>
          <span className="text-[9px] text-zinc-500">{combos.length} groups</span>
        </div>

        {selectedNodeId && (
          <button
            onClick={() => onNodeSelect(null)}
            className="text-[9px] text-cyan-400 hover:text-cyan-300 px-2 py-1 rounded bg-cyan-500/10"
          >
            Clear Selection (Esc)
          </button>
        )}
      </div>

      <div className="flex flex-1">
        {/* Left: Combo list */}
        <div className="w-64 border-r border-zinc-800 p-3 space-y-1.5 overflow-y-auto">
          <h3 className="text-[9px] uppercase tracking-wider text-zinc-500 font-medium mb-2">Entity Groups ({combos.length})</h3>
          {combos.map(combo => (
            <ComboNode
              key={combo.id}
              combo={combo}
              isSelected={false}
              onToggle={() => onComboToggle(combo.id)}
              onClick={() => combo.expanded ? onComboCollapse(combo.id) : onComboExpand(combo.id)}
            />
          ))}
        </div>

        {/* Center: Graph canvas */}
        <div className="flex-1 relative overflow-hidden bg-zinc-950">
          {/* Edges */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {visibleEdges.map(edge => {
              const sourceNode = visibleNodes.find(n => n.id === edge.source);
              const targetNode = visibleNodes.find(n => n.id === edge.target);
              if (!sourceNode?.x || !targetNode?.x) return null;

              const isFg = !selectedNodeId || (foregroundNodeIds.has(edge.source) && foregroundNodeIds.has(edge.target));

              return (
                <line
                  key={edge.id}
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke={edge.color || '#3f3f46'}
                  strokeWidth={1 + edge.weight}
                  opacity={isFg ? 0.6 : 0.05}
                  strokeLinecap="round"
                />
              );
            })}
          </svg>

          {/* Nodes */}
          {filteredNodes.map(node => (
            <GraphNodeComponent
              key={node.id}
              node={node}
              isSelected={node.id === selectedNodeId}
              isForeground={!selectedNodeId || foregroundNodeIds.has(node.id)}
              isBackground={!!selectedNodeId && !foregroundNodeIds.has(node.id)}
              onClick={() => onNodeSelect(node.id === selectedNodeId ? null : node.id)}
            />
          ))}

          {/* Empty state */}
          {visibleNodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Network className="w-12 h-12 text-zinc-800 mx-auto" />
                <p className="text-sm text-zinc-600 mt-2">Expand a group to view entities</p>
              </div>
            </div>
          )}

          {/* Foregrounding legend */}
          {selectedNodeId && (
            <div className="absolute bottom-3 left-3 bg-zinc-900/90 border border-zinc-800 rounded-lg px-3 py-2">
              <span className="text-[9px] text-zinc-400">
                Showing {foregroundDepth}-hop neighborhood of selected entity. All others faded.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GraphComboNodes;
