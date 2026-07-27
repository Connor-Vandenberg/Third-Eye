'use client';

import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Trash2, Save, Share2, Download, Undo2, Redo2,
  Sticky, Link2, Type, Image, FileText, Users, Globe,
  Target, Shield, Anchor, Plane, Lock, Unlock, Clock,
  ChevronRight, Maximize2, Minimize2, Layers
} from 'lucide-react';

// INVESTIGATION CANVAS
// Analyst-curated free-form workspace (NOT system-generated)
// Drag entities, create groups, draw connections, annotate
// Paliscope + Nexus investigation pattern

export interface CanvasItem {
  id: string;
  type: 'entity' | 'note' | 'image' | 'group' | 'link' | 'evidence';
  x: number;
  y: number;
  width?: number;
  height?: number;
  content: any;
  style?: { color?: string; fontSize?: number; borderStyle?: string };
  locked?: boolean;
  zIndex?: number;
}

export interface CanvasConnection {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
  color?: string;
  style?: 'solid' | 'dashed' | 'dotted';
  weight?: number;
  bidirectional?: boolean;
}

export interface CanvasGroup {
  id: string;
  label: string;
  itemIds: string[];
  color: string;
  collapsed?: boolean;
}

export interface InvestigationState {
  id: string;
  title: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  lastModified: string;
  items: CanvasItem[];
  connections: CanvasConnection[];
  groups: CanvasGroup[];
  classification?: string;
  caseId?: string;
  tags: string[];
}

interface InvestigationCanvasProps {
  state: InvestigationState;
  onStateChange: (state: InvestigationState) => void;
  onSave?: (state: InvestigationState) => void;
  onShare?: (state: InvestigationState) => void;
  onExport?: (format: 'png' | 'svg' | 'pdf' | 'json') => void;
  readOnly?: boolean;
  className?: string;
}

const TOOLS = [
  { id: 'select', icon: Target, label: 'Select (V)', shortcut: 'v' },
  { id: 'entity', icon: Users, label: 'Add Entity', shortcut: 'e' },
  { id: 'note', icon: Sticky, label: 'Add Note', shortcut: 'n' },
  { id: 'link', icon: Link2, label: 'Draw Connection', shortcut: 'l' },
  { id: 'group', icon: Layers, label: 'Create Group', shortcut: 'g' },
  { id: 'text', icon: Type, label: 'Add Text', shortcut: 't' },
  { id: 'evidence', icon: FileText, label: 'Add Evidence', shortcut: 'f' },
];

function CanvasEntity({ item, isSelected, isDragging, onSelect, onDragStart }: {
  item: CanvasItem;
  isSelected: boolean;
  isDragging: boolean;
  onSelect: () => void;
  onDragStart: (e: React.MouseEvent) => void;
}) {
  const entity = item.content;
  const scoreColor = entity.convergenceScore >= 80 ? '#ef4444' : entity.convergenceScore >= 60 ? '#f59e0b' : '#6b7280';

  return (
    <motion.div
      className={`absolute cursor-move select-none ${isSelected ? 'ring-2 ring-cyan-500/50' : ''}`}
      style={{ left: item.x, top: item.y, zIndex: item.zIndex || 1 }}
      onMouseDown={(e) => { onSelect(); onDragStart(e); }}
      whileHover={{ scale: 1.02 }}
      animate={{ scale: isDragging ? 1.05 : 1 }}
    >
      <div className="bg-zinc-900/90 border border-zinc-700 rounded-lg px-3 py-2 min-w-[140px] backdrop-blur shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ backgroundColor: item.style?.color || '#3b82f6' }}>
            {entity.name?.slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-white font-medium block truncate">{entity.name}</span>
            <span className="text-[8px] text-zinc-500">{entity.type}</span>
          </div>
          {entity.convergenceScore && (
            <span className="text-[9px] font-mono font-bold" style={{ color: scoreColor }}>{entity.convergenceScore}</span>
          )}
        </div>
        {item.locked && <Lock className="absolute top-1 right-1 w-2.5 h-2.5 text-yellow-500" />}
      </div>
    </motion.div>
  );
}

function CanvasNote({ item, isSelected, onSelect, onDragStart }: {
  item: CanvasItem;
  isSelected: boolean;
  onSelect: () => void;
  onDragStart: (e: React.MouseEvent) => void;
}) {
  return (
    <motion.div
      className={`absolute cursor-move select-none ${isSelected ? 'ring-2 ring-cyan-500/50' : ''}`}
      style={{ left: item.x, top: item.y, zIndex: item.zIndex || 1 }}
      onMouseDown={(e) => { onSelect(); onDragStart(e); }}
    >
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 min-w-[120px] max-w-[200px] shadow-lg">
        <p className="text-[10px] text-yellow-200 whitespace-pre-wrap">{item.content.text}</p>
        <div className="flex items-center gap-1 mt-1.5 text-[8px] text-yellow-500/60">
          <Clock className="w-2.5 h-2.5" />
          <span>{item.content.author} • {item.content.timestamp}</span>
        </div>
      </div>
    </motion.div>
  );
}

export function InvestigationCanvas({ state, onStateChange, onSave, onShare, onExport, readOnly = false, className = '' }: InvestigationCanvasProps) {
  const [activeTool, setActiveTool] = useState('select');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [draggingItem, setDraggingItem] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback((itemId: string, e: React.MouseEvent) => {
    if (readOnly) return;
    const item = state.items.find(i => i.id === itemId);
    if (!item || item.locked) return;
    setDraggingItem(itemId);
    setDragOffset({ x: e.clientX - item.x, y: e.clientY - item.y });
  }, [state.items, readOnly]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggingItem) return;
    const newItems = state.items.map(item => {
      if (item.id === draggingItem) {
        return { ...item, x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y };
      }
      return item;
    });
    onStateChange({ ...state, items: newItems, lastModified: new Date().toISOString() });
  }, [draggingItem, dragOffset, state, onStateChange]);

  const handleMouseUp = useCallback(() => {
    setDraggingItem(null);
  }, []);

  const addItem = useCallback((type: string, x: number = 200, y: number = 200) => {
    const newItem: CanvasItem = {
      id: `item-${Date.now()}`,
      type: type as any,
      x, y,
      content: type === 'note' ? { text: 'New note...', author: 'Analyst', timestamp: 'now' } :
               type === 'entity' ? { name: 'New Entity', type: 'Unknown', convergenceScore: 0 } :
               { text: 'New item' },
      zIndex: state.items.length + 1,
    };
    onStateChange({ ...state, items: [...state.items, newItem], lastModified: new Date().toISOString() });
  }, [state, onStateChange]);

  const deleteSelected = useCallback(() => {
    const newItems = state.items.filter(i => !selectedItems.has(i.id));
    const newConnections = state.connections.filter(c => !selectedItems.has(c.sourceId) && !selectedItems.has(c.targetId));
    onStateChange({ ...state, items: newItems, connections: newConnections, lastModified: new Date().toISOString() });
    setSelectedItems(new Set());
  }, [state, selectedItems, onStateChange]);

  return (
    <div className={`flex flex-col bg-zinc-950 ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-zinc-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {TOOLS.map(tool => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`p-2 rounded-lg transition-colors ${activeTool === tool.id ? 'bg-cyan-500/20 text-cyan-400' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
              title={`${tool.label} (${tool.shortcut})`}
            >
              <tool.icon className="w-4 h-4" />
            </button>
          ))}
          <div className="w-px h-6 bg-zinc-700 mx-2" />
          <button onClick={() => addItem('entity')} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800" title="Quick add entity">
            <Plus className="w-4 h-4" />
          </button>
          <button onClick={deleteSelected} disabled={selectedItems.size === 0} className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 disabled:opacity-30" title="Delete selected">
            <Trash2 className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800" title="Undo">
            <Undo2 className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800" title="Redo">
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[9px] text-zinc-500">{state.items.length} items • {state.connections.length} connections</span>
          {state.classification && (
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-bold">{state.classification}</span>
          )}
          <button onClick={() => onSave?.(state)} className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-300 hover:text-white">
            <Save className="w-3 h-3 inline mr-1" />Save
          </button>
          <button onClick={() => onShare?.(state)} className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-300 hover:text-white">
            <Share2 className="w-3 h-3 inline mr-1" />Share
          </button>
          <button onClick={() => onExport?.('png')} className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-300 hover:text-white">
            <Download className="w-3 h-3 inline mr-1" />Export
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-hidden bg-zinc-950 cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={(e) => {
          if (activeTool === 'entity') addItem('entity', e.clientX - 100, e.clientY - 100);
          else if (activeTool === 'note') addItem('note', e.clientX - 100, e.clientY - 100);
        }}
        style={{ backgroundImage: 'radial-gradient(circle, #27272a 1px, transparent 1px)', backgroundSize: '20px 20px' }}
      >
        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {state.connections.map(conn => {
            const source = state.items.find(i => i.id === conn.sourceId);
            const target = state.items.find(i => i.id === conn.targetId);
            if (!source || !target) return null;
            return (
              <g key={conn.id}>
                <line
                  x1={source.x + 70} y1={source.y + 20}
                  x2={target.x + 70} y2={target.y + 20}
                  stroke={conn.color || '#6b7280'}
                  strokeWidth={1 + (conn.weight || 0) * 2}
                  strokeDasharray={conn.style === 'dashed' ? '6,4' : conn.style === 'dotted' ? '2,4' : 'none'}
                  markerEnd={!conn.bidirectional ? 'url(#arrowhead)' : undefined}
                />
                {conn.label && (
                  <text
                    x={(source.x + target.x) / 2 + 70}
                    y={(source.y + target.y) / 2 + 15}
                    textAnchor="middle"
                    fontSize="8"
                    fill="#9ca3af"
                  >
                    {conn.label}
                  </text>
                )}
              </g>
            );
          })}
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#6b7280" />
            </marker>
          </defs>
        </svg>

        {/* Canvas items */}
        {state.items.map(item => {
          const isSelected = selectedItems.has(item.id);
          switch (item.type) {
            case 'entity':
              return <CanvasEntity key={item.id} item={item} isSelected={isSelected} isDragging={draggingItem === item.id} onSelect={() => setSelectedItems(new Set([item.id]))} onDragStart={(e) => handleDragStart(item.id, e)} />;
            case 'note':
              return <CanvasNote key={item.id} item={item} isSelected={isSelected} onSelect={() => setSelectedItems(new Set([item.id]))} onDragStart={(e) => handleDragStart(item.id, e)} />;
            default:
              return null;
          }
        })}

        {/* Empty state */}
        {state.items.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Layers className="w-12 h-12 text-zinc-800 mx-auto" />
              <p className="text-sm text-zinc-600 mt-3">Investigation Canvas</p>
              <p className="text-[10px] text-zinc-700 mt-1">Click to place entities, notes, and evidence. Drag to arrange. Draw connections between items.</p>
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="border-t border-zinc-800 px-4 py-1.5 flex items-center justify-between text-[8px] text-zinc-600">
        <span>Case: {state.caseId || 'Unsaved'} | Created: {new Date(state.createdAt).toLocaleString()} | Modified: {new Date(state.lastModified).toLocaleString()}</span>
        <span>Tool: {activeTool} | Zoom: {(zoom * 100).toFixed(0)}% | {selectedItems.size} selected</span>
      </div>
    </div>
  );
}

export default InvestigationCanvas;
