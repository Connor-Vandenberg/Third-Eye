'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, Eye, Edit3, Trash2, Link2, Shield, Crosshair,
  Bell, FileText, Brain, Zap, Target, Radio, Globe,
  Users, Lock, Unlock, ChevronDown, Filter, Download,
  RefreshCw, CheckCircle, AlertTriangle, Activity
} from 'lucide-react';

export type ActionType =
  | 'created' | 'updated' | 'deleted' | 'merged'
  | 'relationship_added' | 'relationship_removed'
  | 'alert_triggered' | 'alert_acknowledged'
  | 'tasking_issued' | 'tasking_completed' | 'tasking_failed'
  | 'prediction_generated' | 'prediction_validated'
  | 'convergence_fired' | 'convergence_resolved'
  | 'report_generated' | 'report_shared'
  | 'locked' | 'unlocked'
  | 'annotation_added' | 'annotation_resolved'
  | 'score_changed' | 'classification_changed'
  | 'collection_triggered' | 'collection_completed'
  | 'self_play_update' | 'decay_applied'
  | 'exported' | 'imported' | 'viewed';

export interface ActionLogEntry {
  id: string;
  timestamp: string;
  action: ActionType;
  actor: { id: string; name: string; type: 'user' | 'system' | 'engine' | 'collector' | 'ai' };
  entityId: string;
  entityName: string;
  entityType: string;
  details: string;
  metadata?: Record<string, any>;
  previousValue?: any;
  newValue?: any;
  source?: string;
  confidence?: number;
  reversible?: boolean;
}

interface ActionLogTimelineProps {
  entries: ActionLogEntry[];
  entityId?: string;
  onEntryClick?: (entry: ActionLogEntry) => void;
  onRevert?: (entry: ActionLogEntry) => void;
  maxEntries?: number;
  showFilters?: boolean;
  groupByDate?: boolean;
  className?: string;
}

const ACTION_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  created: { icon: CheckCircle, color: '#10b981', label: 'Created' },
  updated: { icon: Edit3, color: '#3b82f6', label: 'Updated' },
  deleted: { icon: Trash2, color: '#ef4444', label: 'Deleted' },
  merged: { icon: Link2, color: '#8b5cf6', label: 'Merged' },
  relationship_added: { icon: Link2, color: '#06b6d4', label: 'Relationship Added' },
  relationship_removed: { icon: Link2, color: '#f97316', label: 'Relationship Removed' },
  alert_triggered: { icon: Bell, color: '#ef4444', label: 'Alert Triggered' },
  alert_acknowledged: { icon: CheckCircle, color: '#10b981', label: 'Alert Acknowledged' },
  tasking_issued: { icon: Crosshair, color: '#f59e0b', label: 'Tasking Issued' },
  tasking_completed: { icon: CheckCircle, color: '#10b981', label: 'Tasking Complete' },
  tasking_failed: { icon: AlertTriangle, color: '#ef4444', label: 'Tasking Failed' },
  prediction_generated: { icon: Brain, color: '#8b5cf6', label: 'Prediction Generated' },
  prediction_validated: { icon: Target, color: '#10b981', label: 'Prediction Validated' },
  convergence_fired: { icon: Zap, color: '#fbbf24', label: 'Convergence Fired' },
  convergence_resolved: { icon: CheckCircle, color: '#6b7280', label: 'Convergence Resolved' },
  report_generated: { icon: FileText, color: '#3b82f6', label: 'Report Generated' },
  report_shared: { icon: Users, color: '#06b6d4', label: 'Report Shared' },
  locked: { icon: Lock, color: '#f59e0b', label: 'Entity Locked' },
  unlocked: { icon: Unlock, color: '#6b7280', label: 'Entity Unlocked' },
  annotation_added: { icon: Edit3, color: '#06b6d4', label: 'Annotation Added' },
  annotation_resolved: { icon: CheckCircle, color: '#10b981', label: 'Annotation Resolved' },
  score_changed: { icon: Activity, color: '#f97316', label: 'Score Changed' },
  classification_changed: { icon: Shield, color: '#ef4444', label: 'Classification Changed' },
  collection_triggered: { icon: Radio, color: '#3b82f6', label: 'Collection Triggered' },
  collection_completed: { icon: CheckCircle, color: '#10b981', label: 'Collection Complete' },
  self_play_update: { icon: Brain, color: '#7c3aed', label: 'Self-Play Update' },
  decay_applied: { icon: Clock, color: '#6b7280', label: 'Decay Applied' },
  exported: { icon: Download, color: '#06b6d4', label: 'Exported' },
  imported: { icon: RefreshCw, color: '#3b82f6', label: 'Imported' },
  viewed: { icon: Eye, color: '#6b7280', label: 'Viewed' },
};

const ACTOR_TYPE_COLORS: Record<string, string> = {
  user: '#3b82f6',
  system: '#6b7280',
  engine: '#8b5cf6',
  collector: '#10b981',
  ai: '#f59e0b',
};

function formatRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function groupEntriesByDate(entries: ActionLogEntry[]): Record<string, ActionLogEntry[]> {
  const groups: Record<string, ActionLogEntry[]> = {};
  entries.forEach(entry => {
    const date = new Date(entry.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    if (!groups[date]) groups[date] = [];
    groups[date].push(entry);
  });
  return groups;
}

export function ActionLogTimeline({
  entries,
  entityId,
  onEntryClick,
  onRevert,
  maxEntries = 100,
  showFilters = true,
  groupByDate = true,
  className = '',
}: ActionLogTimelineProps) {
  const [actionFilter, setActionFilter] = useState<ActionType | 'all'>('all');
  const [actorFilter, setActorFilter] = useState<string | 'all'>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filteredEntries = useMemo(() => {
    let result = entries;
    if (entityId) result = result.filter(e => e.entityId === entityId);
    if (actionFilter !== 'all') result = result.filter(e => e.action === actionFilter);
    if (actorFilter !== 'all') result = result.filter(e => e.actor.type === actorFilter);
    return result.slice(0, maxEntries);
  }, [entries, entityId, actionFilter, actorFilter, maxEntries]);

  const groupedEntries = useMemo(() => {
    if (!groupByDate) return { 'All': filteredEntries };
    return groupEntriesByDate(filteredEntries);
  }, [filteredEntries, groupByDate]);

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className={`bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-zinc-400" />
          <h3 className="text-xs font-bold text-white">Action Log</h3>
          <span className="text-[9px] text-zinc-500">{filteredEntries.length} entries</span>
        </div>
        {showFilters && (
          <div className="flex items-center gap-2">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value as any)}
              className="bg-zinc-800 border border-zinc-700 rounded text-[9px] text-zinc-300 px-2 py-1 focus:outline-none"
            >
              <option value="all">All Actions</option>
              {Object.entries(ACTION_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            <select
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded text-[9px] text-zinc-300 px-2 py-1 focus:outline-none"
            >
              <option value="all">All Actors</option>
              <option value="user">Users</option>
              <option value="system">System</option>
              <option value="engine">Engines</option>
              <option value="collector">Collectors</option>
              <option value="ai">AI</option>
            </select>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="max-h-[500px] overflow-y-auto">
        {Object.entries(groupedEntries).map(([date, dateEntries]) => (
          <div key={date}>
            {groupByDate && (
              <div className="sticky top-0 z-10 px-4 py-1.5 bg-zinc-900/90 backdrop-blur border-b border-zinc-800/50">
                <span className="text-[9px] text-zinc-500 font-medium uppercase tracking-wider">{date}</span>
              </div>
            )}
            <div className="px-4">
              {dateEntries.map((entry, i) => {
                const config = ACTION_CONFIG[entry.action] || ACTION_CONFIG.updated;
                const Icon = config.icon;
                const isExpanded = expanded.has(entry.id);
                const actorColor = ACTOR_TYPE_COLORS[entry.actor.type] || '#6b7280';

                return (
                  <div key={entry.id} className="flex gap-3 py-2 group">
                    {/* Timeline line + icon */}
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center border" style={{ borderColor: `${config.color}40`, backgroundColor: `${config.color}10` }}>
                        <Icon className="w-3 h-3" style={{ color: config.color }} />
                      </div>
                      {i < dateEntries.length - 1 && <div className="w-px flex-1 bg-zinc-800 mt-1" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium" style={{ color: config.color }}>{config.label}</span>
                        <span className="text-[8px] px-1 py-0.5 rounded" style={{ backgroundColor: `${actorColor}15`, color: actorColor }}>
                          {entry.actor.type}
                        </span>
                        <span className="text-[9px] text-zinc-500">{formatRelativeTime(entry.timestamp)}</span>
                      </div>

                      <p className="text-[10px] text-zinc-300 mt-0.5">{entry.details}</p>

                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[8px] text-zinc-500">by {entry.actor.name}</span>
                        {entry.source && <span className="text-[8px] text-zinc-600">• {entry.source}</span>}
                        {entry.confidence && <span className="text-[8px] text-zinc-600">• conf: {entry.confidence}%</span>}
                      </div>

                      {/* Expandable metadata */}
                      {(entry.previousValue || entry.newValue || entry.metadata) && (
                        <button
                          onClick={() => toggleExpand(entry.id)}
                          className="text-[8px] text-zinc-500 hover:text-zinc-300 mt-1 flex items-center gap-0.5"
                        >
                          <ChevronDown className={`w-2.5 h-2.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          Details
                        </button>
                      )}

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-1.5 p-2 bg-zinc-800/30 rounded-lg border border-zinc-800 text-[9px] font-mono">
                              {entry.previousValue !== undefined && (
                                <div className="flex gap-2">
                                  <span className="text-red-400">- {JSON.stringify(entry.previousValue)}</span>
                                </div>
                              )}
                              {entry.newValue !== undefined && (
                                <div className="flex gap-2">
                                  <span className="text-emerald-400">+ {JSON.stringify(entry.newValue)}</span>
                                </div>
                              )}
                              {entry.metadata && Object.entries(entry.metadata).map(([k, v]) => (
                                <div key={k} className="text-zinc-400">{k}: {JSON.stringify(v)}</div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Actions */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-start gap-1">
                      {entry.reversible && onRevert && (
                        <button onClick={() => onRevert(entry)} className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-white" title="Revert">
                          <RefreshCw className="w-3 h-3" />
                        </button>
                      )}
                      <button onClick={() => onEntryClick?.(entry)} className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-white" title="View">
                        <Eye className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filteredEntries.length === 0 && (
          <div className="py-8 text-center text-zinc-500 text-xs">No actions recorded</div>
        )}
      </div>
    </div>
  );
}

export default ActionLogTimeline;
