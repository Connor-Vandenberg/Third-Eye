'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cursor, PenTool, MapPin, Circle, Square, Type,
  Trash2, Undo2, MessageSquare, Flag, AlertTriangle,
  Target, Shield, Eye, Users, Lock, Send, X
} from 'lucide-react';

// This component overlays ON TOP of any map/COP view to provide
// real-time multi-user collaboration (Palantir Gaia equivalent)

export interface RemoteCursor {
  userId: string;
  userName: string;
  color: string;
  x: number;
  y: number;
  view: string;
  selectedEntity?: string;
  lastUpdate: number;
}

export interface MapAnnotation {
  id: string;
  type: 'marker' | 'circle' | 'rectangle' | 'line' | 'text' | 'threat_zone' | 'route';
  author: string;
  authorColor: string;
  position: { x: number; y: number };
  endPosition?: { x: number; y: number };
  radius?: number;
  content?: string;
  priority: 'critical' | 'high' | 'normal' | 'info';
  timestamp: string;
  acknowledged: string[];
  locked?: boolean;
  classification?: string;
  visible: boolean;
}

export interface QuickMessage {
  id: string;
  author: string;
  authorColor: string;
  content: string;
  position: { x: number; y: number };
  timestamp: string;
  ttl: number; // seconds until auto-fade
}

interface COPCollaborationOverlayProps {
  cursors: RemoteCursor[];
  annotations: MapAnnotation[];
  quickMessages: QuickMessage[];
  currentUserId: string;
  currentUserColor: string;
  onCursorMove: (x: number, y: number) => void;
  onAnnotationAdd: (annotation: Omit<MapAnnotation, 'id' | 'timestamp' | 'acknowledged'>) => void;
  onAnnotationDelete: (id: string) => void;
  onAnnotationAcknowledge: (id: string) => void;
  onQuickMessage: (content: string, position: { x: number; y: number }) => void;
  onEntitySelect: (entityId: string) => void;
  isDrawing?: boolean;
  activeTool?: 'cursor' | 'marker' | 'circle' | 'text' | 'threat_zone' | 'line';
  onToolChange?: (tool: string) => void;
  className?: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f59e0b',
  normal: '#3b82f6',
  info: '#6b7280',
};

const ANNOTATION_PRESETS = [
  { type: 'threat_zone', icon: AlertTriangle, label: 'Threat Zone', priority: 'critical' as const },
  { type: 'marker', icon: MapPin, label: 'Point of Interest', priority: 'normal' as const },
  { type: 'marker', icon: Target, label: 'Target', priority: 'high' as const },
  { type: 'marker', icon: Shield, label: 'Friendly Force', priority: 'info' as const },
  { type: 'marker', icon: Flag, label: 'Objective', priority: 'high' as const },
  { type: 'text', icon: Type, label: 'Text Note', priority: 'normal' as const },
];

function RemoteCursorOverlay({ cursor }: { cursor: RemoteCursor }) {
  const age = Date.now() - cursor.lastUpdate;
  if (age > 30000) return null; // Hide stale cursors (30s)

  const opacity = age > 10000 ? 0.4 : 1;

  return (
    <motion.div
      className="absolute pointer-events-none z-30"
      style={{ left: cursor.x, top: cursor.y }}
      animate={{ left: cursor.x, top: cursor.y }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
    >
      <div style={{ opacity }}>
        {/* Cursor SVG */}
        <svg width="16" height="20" viewBox="0 0 16 20" className="drop-shadow-lg" style={{ transform: 'rotate(-15deg)' }}>
          <path d="M0 0 L0 16 L4 12 L8 20 L10 19 L6 11 L12 11 Z" fill={cursor.color} stroke="white" strokeWidth="0.5" />
        </svg>
        {/* Name label */}
        <div
          className="absolute top-4 left-4 px-1.5 py-0.5 rounded text-[8px] font-medium text-white whitespace-nowrap shadow-lg"
          style={{ backgroundColor: cursor.color }}
        >
          {cursor.userName}
        </div>
        {/* Selected entity indicator */}
        {cursor.selectedEntity && (
          <div className="absolute top-8 left-4 px-1.5 py-0.5 rounded text-[7px] text-white/80 whitespace-nowrap" style={{ backgroundColor: `${cursor.color}80` }}>
            ▶ {cursor.selectedEntity}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function AnnotationOverlay({ annotation, onAcknowledge, onDelete, currentUserId }: {
  annotation: MapAnnotation;
  onAcknowledge: () => void;
  onDelete: () => void;
  currentUserId: string;
}) {
  if (!annotation.visible) return null;
  const priorityColor = PRIORITY_COLORS[annotation.priority];
  const isOwn = annotation.author === currentUserId;

  return (
    <div
      className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2 group"
      style={{ left: annotation.position.x, top: annotation.position.y }}
    >
      {/* Annotation marker */}
      {annotation.type === 'threat_zone' ? (
        <motion.div
          className="w-16 h-16 rounded-full border-2 border-dashed"
          style={{ borderColor: priorityColor, backgroundColor: `${priorityColor}10` }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      ) : annotation.type === 'circle' ? (
        <div
          className="rounded-full border-2"
          style={{ width: (annotation.radius || 30) * 2, height: (annotation.radius || 30) * 2, borderColor: priorityColor, backgroundColor: `${priorityColor}10` }}
        />
      ) : (
        <motion.div
          className="w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer"
          style={{ borderColor: priorityColor, backgroundColor: `${priorityColor}20` }}
          whileHover={{ scale: 1.3 }}
        >
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: priorityColor }} />
        </motion.div>
      )}

      {/* Content tooltip on hover */}
      <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        <div className="bg-zinc-900/95 backdrop-blur border border-zinc-700 rounded-lg px-3 py-2 shadow-xl min-w-[150px] max-w-[250px]">
          {annotation.classification && (
            <div className="text-[7px] font-bold text-yellow-400 tracking-widest mb-1">{annotation.classification}</div>
          )}
          {annotation.content && <p className="text-[10px] text-zinc-200">{annotation.content}</p>}
          <div className="flex items-center gap-2 mt-1.5 text-[8px] text-zinc-500">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: annotation.authorColor }} />
            <span>{annotation.author}</span>
            <span>•</span>
            <span>{new Date(annotation.timestamp).toLocaleTimeString()}</span>
          </div>
          {annotation.acknowledged.length > 0 && (
            <div className="text-[8px] text-emerald-400 mt-1">
              ✓ Ack: {annotation.acknowledged.join(', ')}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons (visible on hover) */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5 z-50">
        {!annotation.acknowledged.includes(currentUserId) && (
          <button onClick={onAcknowledge} className="p-1 rounded bg-zinc-800 border border-zinc-700 text-emerald-400 hover:bg-emerald-500/20" title="Acknowledge">
            <Eye className="w-2.5 h-2.5" />
          </button>
        )}
        {isOwn && (
          <button onClick={onDelete} className="p-1 rounded bg-zinc-800 border border-zinc-700 text-red-400 hover:bg-red-500/20" title="Delete">
            <Trash2 className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function QuickMessageBubble({ message }: { message: QuickMessage }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), message.ttl * 1000);
    return () => clearTimeout(timer);
  }, [message.ttl]);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.5 }}
      className="absolute z-40 transform -translate-x-1/2"
      style={{ left: message.position.x, top: message.position.y - 30 }}
    >
      <div className="bg-zinc-900/90 backdrop-blur border rounded-lg px-2.5 py-1.5 shadow-xl max-w-[200px]" style={{ borderColor: `${message.authorColor}40` }}>
        <p className="text-[10px] text-white">{message.content}</p>
        <span className="text-[7px]" style={{ color: message.authorColor }}>{message.author}</span>
      </div>
    </motion.div>
  );
}

export function COPCollaborationOverlay({
  cursors,
  annotations,
  quickMessages,
  currentUserId,
  currentUserColor,
  onCursorMove,
  onAnnotationAdd,
  onAnnotationDelete,
  onAnnotationAcknowledge,
  onQuickMessage,
  onEntitySelect,
  activeTool = 'cursor',
  onToolChange,
  className = '',
}: COPCollaborationOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [showToolbar, setShowToolbar] = useState(true);
  const [quickMsgInput, setQuickMsgInput] = useState('');
  const [showQuickMsg, setShowQuickMsg] = useState(false);
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null);

  // Track mouse movement for cursor sync
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    onCursorMove(e.clientX - rect.left, e.clientY - rect.top);
  }, [onCursorMove]);

  // Handle clicks based on active tool
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'cursor') return;

    setClickPosition({ x, y });

    if (activeTool === 'marker') {
      onAnnotationAdd({
        type: 'marker',
        author: currentUserId,
        authorColor: currentUserColor,
        position: { x, y },
        priority: 'normal',
        visible: true,
      });
    } else if (activeTool === 'threat_zone') {
      onAnnotationAdd({
        type: 'threat_zone',
        author: currentUserId,
        authorColor: currentUserColor,
        position: { x, y },
        radius: 40,
        priority: 'critical',
        content: 'Threat Zone',
        visible: true,
      });
    } else if (activeTool === 'text') {
      setShowQuickMsg(true);
    }
  }, [activeTool, currentUserId, currentUserColor, onAnnotationAdd]);

  const handleQuickMsgSend = () => {
    if (!quickMsgInput.trim() || !clickPosition) return;
    if (activeTool === 'text') {
      onAnnotationAdd({
        type: 'text',
        author: currentUserId,
        authorColor: currentUserColor,
        position: clickPosition,
        content: quickMsgInput,
        priority: 'normal',
        visible: true,
      });
    } else {
      onQuickMessage(quickMsgInput, clickPosition);
    }
    setQuickMsgInput('');
    setShowQuickMsg(false);
  };

  return (
    <div
      ref={overlayRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 100 }}
    >
      {/* Interaction layer (only captures when drawing) */}
      <div
        className={`absolute inset-0 ${activeTool !== 'cursor' ? 'pointer-events-auto cursor-crosshair' : ''}`}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      />

      {/* Remote cursors */}
      {cursors.filter(c => c.userId !== currentUserId).map((cursor) => (
        <RemoteCursorOverlay key={cursor.userId} cursor={cursor} />
      ))}

      {/* Annotations */}
      {annotations.map((annotation) => (
        <AnnotationOverlay
          key={annotation.id}
          annotation={annotation}
          onAcknowledge={() => onAnnotationAcknowledge(annotation.id)}
          onDelete={() => onAnnotationDelete(annotation.id)}
          currentUserId={currentUserId}
        />
      ))}

      {/* Quick messages */}
      <AnimatePresence>
        {quickMessages.map((msg) => (
          <QuickMessageBubble key={msg.id} message={msg} />
        ))}
      </AnimatePresence>

      {/* Quick message input */}
      <AnimatePresence>
        {showQuickMsg && clickPosition && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute z-50 pointer-events-auto"
            style={{ left: clickPosition.x, top: clickPosition.y }}
          >
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 shadow-xl flex gap-1">
              <input
                type="text"
                value={quickMsgInput}
                onChange={(e) => setQuickMsgInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuickMsgSend()}
                placeholder="Type annotation..."
                className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-[10px] text-white w-36 focus:outline-none"
                autoFocus
              />
              <button onClick={handleQuickMsgSend} className="p-1 rounded bg-cyan-500/20 text-cyan-400">
                <Send className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setShowQuickMsg(false)} className="p-1 rounded hover:bg-zinc-800 text-zinc-400">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drawing toolbar */}
      {showToolbar && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto z-40">
          <div className="bg-zinc-900/90 backdrop-blur border border-zinc-700 rounded-xl px-2 py-1.5 flex items-center gap-1 shadow-xl">
            <button
              onClick={() => onToolChange?.('cursor')}
              className={`p-2 rounded-lg transition-colors ${activeTool === 'cursor' ? 'bg-cyan-500/20 text-cyan-400' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
              title="Select (V)"
            >
              <Cursor className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-zinc-700 mx-1" />
            {ANNOTATION_PRESETS.map((preset, i) => (
              <button
                key={i}
                onClick={() => onToolChange?.(preset.type)}
                className={`p-2 rounded-lg transition-colors ${activeTool === preset.type ? 'bg-cyan-500/20 text-cyan-400' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                title={preset.label}
              >
                <preset.icon className="w-4 h-4" />
              </button>
            ))}
            <div className="w-px h-6 bg-zinc-700 mx-1" />
            <button className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors" title="Undo">
              <Undo2 className="w-4 h-4" />
            </button>
            {/* Online users indicator */}
            <div className="flex items-center gap-1 ml-2 pl-2 border-l border-zinc-700">
              <Users className="w-3.5 h-3.5 text-zinc-500" />
              <div className="flex -space-x-1">
                {cursors.slice(0, 4).map((c) => (
                  <div key={c.userId} className="w-4 h-4 rounded-full border border-zinc-900 text-[6px] font-bold text-white flex items-center justify-center" style={{ backgroundColor: c.color }}>
                    {c.userName[0]}
                  </div>
                ))}
              </div>
              <span className="text-[9px] text-zinc-500">{cursors.length + 1}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default COPCollaborationOverlay;
