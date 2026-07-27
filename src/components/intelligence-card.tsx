'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, AlertTriangle, Globe, Network, Brain, Target, Eye,
  ChevronRight, ExternalLink, Copy, Bell, Crosshair, FileText,
  Clock, TrendingUp, TrendingDown, Minus, Link2, Users, MapPin,
  Radio, Wifi, Satellite, Anchor, Plane, Server, DollarSign,
  Activity, Zap, Lock, Unlock, BarChart3, Layers
} from 'lucide-react';

// NATO Admiralty Code reliability ratings
const ADMIRALTY_RELIABILITY: Record<string, { label: string; color: string; description: string }> = {
  A: { label: 'A - Completely Reliable', color: '#10b981', description: 'No doubt regarding authenticity, trustworthiness, competency; history of complete reliability' },
  B: { label: 'B - Usually Reliable', color: '#34d399', description: 'Minor doubt; history of mostly valid information' },
  C: { label: 'C - Fairly Reliable', color: '#fbbf24', description: 'Doubt regarding reliability; provided valid information in the past' },
  D: { label: 'D - Not Usually Reliable', color: '#f97316', description: 'Significant doubt; provided valid information in the past' },
  E: { label: 'E - Unreliable', color: '#ef4444', description: 'Lacking in reliability; history of invalid information' },
  F: { label: 'F - Cannot Be Judged', color: '#6b7280', description: 'No basis exists for evaluating reliability' },
};

const ADMIRALTY_CREDIBILITY: Record<string, { label: string; color: string }> = {
  '1': { label: '1 - Confirmed', color: '#10b981' },
  '2': { label: '2 - Probably True', color: '#34d399' },
  '3': { label: '3 - Possibly True', color: '#fbbf24' },
  '4': { label: '4 - Doubtfully True', color: '#f97316' },
  '5': { label: '5 - Improbable', color: '#ef4444' },
  '6': { label: '6 - Cannot Be Judged', color: '#6b7280' },
};

const ENTITY_TYPE_ICONS: Record<string, any> = {
  Person: Users,
  Organization: Network,
  Location: MapPin,
  Vessel: Anchor,
  Aircraft: Plane,
  Infrastructure: Server,
  Financial: DollarSign,
  Signal: Radio,
  Satellite: Satellite,
  CyberAsset: Wifi,
  ThreatActor: Target,
  Default: Globe,
};

const DOMAIN_COLORS: Record<string, string> = {
  OSINT: '#3b82f6',
  SIGINT: '#8b5cf6',
  GEOINT: '#10b981',
  HUMINT: '#f59e0b',
  CYBER: '#ef4444',
  FININT: '#06b6d4',
  MASINT: '#ec4899',
  ELINT: '#a855f7',
  IMINT: '#14b8a6',
  INFOPS: '#f97316',
};

export interface IntelligenceCardEntity {
  id: string;
  name: string;
  type: string;
  aliases?: string[];
  convergenceScore: number;
  riskScore: number;
  confidence: number;
  admiraltyReliability: string;
  admiraltyCredibility: string;
  capcoMarking?: string;
  domains: string[];
  location?: { lat: number; lng: number; label: string };
  relationships: Array<{
    id: string;
    name: string;
    type: string;
    edgeType: string;
    weight: number;
  }>;
  timeline: Array<{
    timestamp: string;
    event: string;
    source: string;
    domain: string;
    significance: number;
  }>;
  signals: Array<{
    type: string;
    value: number;
    trend: 'up' | 'down' | 'stable';
    lastSeen: string;
  }>;
  sources: Array<{
    name: string;
    reliability: string;
    lastContribution: string;
    signalCount: number;
  }>;
  predictions?: Array<{
    event: string;
    probability: number;
    timeframe: string;
    model: string;
  }>;
  tags?: string[];
  firstSeen: string;
  lastUpdated: string;
  decayRate?: number;
  vertexType: string;
  graphDegree: number;
  clusterMembership?: string[];
}

interface IntelligenceCardProps {
  entity: IntelligenceCardEntity;
  compact?: boolean;
  onInvestigate?: (id: string) => void;
  onTask?: (id: string) => void;
  onAlert?: (id: string) => void;
  onExport?: (id: string, format: string) => void;
  onNavigate?: (id: string) => void;
  onRelationshipClick?: (id: string) => void;
  isSelected?: boolean;
  showPredictions?: boolean;
  showTimeline?: boolean;
  showRelationships?: boolean;
  className?: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#ef4444';
  if (score >= 60) return '#f97316';
  if (score >= 40) return '#fbbf24';
  if (score >= 20) return '#34d399';
  return '#6b7280';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 40) return 'MODERATE';
  if (score >= 20) return 'LOW';
  return 'MINIMAL';
}

function formatTimestamp(ts: string): string {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

function ScoreRing({ score, size = 64, strokeWidth = 6, label }: { score: number; size?: number; strokeWidth?: number; label?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold" style={{ color }}>{score}</span>
        {label && <span className="text-[9px] text-zinc-500 uppercase tracking-wider">{label}</span>}
      </div>
    </div>
  );
}

function MiniSparkline({ data, color, width = 60, height = 20 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IntelligenceCard({
  entity,
  compact = false,
  onInvestigate,
  onTask,
  onAlert,
  onExport,
  onNavigate,
  onRelationshipClick,
  isSelected = false,
  showPredictions = true,
  showTimeline = true,
  showRelationships = true,
  className = '',
}: IntelligenceCardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'relationships' | 'signals' | 'predictions'>('overview');
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [copied, setCopied] = useState(false);

  const EntityIcon = ENTITY_TYPE_ICONS[entity.type] || ENTITY_TYPE_ICONS.Default;
  const scoreColor = getScoreColor(entity.convergenceScore);
  const riskColor = getScoreColor(entity.riskScore);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(entity.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [entity.id]);

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
    if (trend === 'up') return <TrendingUp className="w-3 h-3 text-red-400" />;
    if (trend === 'down') return <TrendingDown className="w-3 h-3 text-green-400" />;
    return <Minus className="w-3 h-3 text-zinc-500" />;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`relative bg-zinc-900/80 backdrop-blur-xl border rounded-xl overflow-hidden transition-all duration-300 ${
        isSelected ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/10' : 'border-zinc-700/50 hover:border-zinc-600/50'
      } ${className}`}
    >
      {/* CAPCO Marking Banner */}
      {entity.capcoMarking && (
        <div className="bg-yellow-600/20 border-b border-yellow-600/30 px-3 py-0.5 text-center">
          <span className="text-[10px] font-mono font-bold text-yellow-400 tracking-widest">
            {entity.capcoMarking}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-start gap-3">
          {/* Score Ring */}
          <ScoreRing score={entity.convergenceScore} size={56} label="CONV" />

          {/* Entity Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <EntityIcon className="w-4 h-4 text-zinc-400 flex-shrink-0" />
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
                {entity.vertexType}
              </span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wider`} style={{ backgroundColor: `${scoreColor}20`, color: scoreColor }}>
                {getScoreLabel(entity.convergenceScore)}
              </span>
            </div>
            <h3 className="text-base font-semibold text-white truncate mt-0.5" title={entity.name}>
              {entity.name}
            </h3>
            {entity.aliases && entity.aliases.length > 0 && (
              <p className="text-xs text-zinc-500 truncate">
                aka: {entity.aliases.slice(0, 3).join(', ')}{entity.aliases.length > 3 ? ` +${entity.aliases.length - 3}` : ''}
              </p>
            )}
          </div>

          {/* Risk Score */}
          <ScoreRing score={entity.riskScore} size={44} strokeWidth={4} label="RISK" />
        </div>

        {/* Domain Tags */}
        <div className="flex flex-wrap gap-1 mt-2">
          {entity.domains.map((domain) => (
            <span
              key={domain}
              className="text-[9px] px-1.5 py-0.5 rounded-full font-medium tracking-wider"
              style={{ backgroundColor: `${DOMAIN_COLORS[domain] || '#6b7280'}20`, color: DOMAIN_COLORS[domain] || '#6b7280' }}
            >
              {domain}
            </span>
          ))}
        </div>

        {/* Admiralty Rating + Confidence */}
        <div className="flex items-center gap-3 mt-2 text-[10px]">
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3" style={{ color: ADMIRALTY_RELIABILITY[entity.admiraltyReliability]?.color }} />
            <span style={{ color: ADMIRALTY_RELIABILITY[entity.admiraltyReliability]?.color }}>
              {entity.admiraltyReliability}{entity.admiraltyCredibility}
            </span>
          </div>
          <div className="flex items-center gap-1 text-zinc-500">
            <Activity className="w-3 h-3" />
            <span>{entity.confidence}% confidence</span>
          </div>
          <div className="flex items-center gap-1 text-zinc-500">
            <Link2 className="w-3 h-3" />
            <span>degree {entity.graphDegree}</span>
          </div>
          <div className="flex items-center gap-1 text-zinc-500">
            <Clock className="w-3 h-3" />
            <span>{formatTimestamp(entity.lastUpdated)}</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      {isExpanded && (
        <div className="border-t border-zinc-800 px-4">
          <div className="flex gap-0.5 -mb-px">
            {(['overview', 'timeline', 'relationships', 'signals', 'predictions'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 text-[10px] uppercase tracking-wider font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-cyan-500 text-cyan-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content */}
      {isExpanded && (
        <div className="p-4 pt-3 border-t border-zinc-800 min-h-[120px]">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Signals Summary */}
                <div className="grid grid-cols-2 gap-2">
                  {entity.signals.slice(0, 6).map((signal, i) => (
                    <div key={i} className="flex items-center justify-between bg-zinc-800/50 rounded px-2 py-1.5">
                      <span className="text-[10px] text-zinc-400 truncate">{signal.type}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-mono font-medium text-white">{signal.value.toFixed(1)}</span>
                        <TrendIcon trend={signal.trend} />
                      </div>
                    </div>
                  ))}
                </div>
                {/* Sources */}
                <div className="mt-3">
                  <h4 className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-1.5">Contributing Sources ({entity.sources.length})</h4>
                  <div className="space-y-1">
                    {entity.sources.slice(0, 4).map((source, i) => (
                      <div key={i} className="flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ADMIRALTY_RELIABILITY[source.reliability]?.color || '#6b7280' }} />
                          <span className="text-zinc-300">{source.name}</span>
                        </div>
                        <span className="text-zinc-500">{source.signalCount} signals</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'timeline' && showTimeline && (
              <motion.div key="timeline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-track-zinc-900 scrollbar-thumb-zinc-700">
                  {entity.timeline.map((event, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full mt-1" style={{ backgroundColor: DOMAIN_COLORS[event.domain] || '#6b7280' }} />
                        {i < entity.timeline.length - 1 && <div className="w-px h-full bg-zinc-800 mt-1" />}
                      </div>
                      <div className="flex-1 pb-2">
                        <p className="text-xs text-zinc-200">{event.event}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-zinc-500">{formatTimestamp(event.timestamp)}</span>
                          <span className="text-[9px] px-1 rounded" style={{ backgroundColor: `${DOMAIN_COLORS[event.domain]}20`, color: DOMAIN_COLORS[event.domain] }}>{event.domain}</span>
                          <span className="text-[9px] text-zinc-600">{event.source}</span>
                        </div>
                      </div>
                      <div className="text-[9px] text-zinc-500">sig: {event.significance}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'relationships' && showRelationships && (
              <motion.div key="relationships" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-track-zinc-900 scrollbar-thumb-zinc-700">
                  {entity.relationships.map((rel, i) => (
                    <button
                      key={i}
                      onClick={() => onRelationshipClick?.(rel.id)}
                      className="w-full flex items-center gap-2 bg-zinc-800/40 hover:bg-zinc-800/80 rounded px-2 py-1.5 transition-colors group"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                      <span className="text-xs text-zinc-300 flex-1 text-left truncate">{rel.name}</span>
                      <span className="text-[9px] text-zinc-500 bg-zinc-700/50 px-1.5 py-0.5 rounded">{rel.edgeType}</span>
                      <span className="text-[9px] font-mono text-zinc-500">{(rel.weight * 100).toFixed(0)}%</span>
                      <ChevronRight className="w-3 h-3 text-zinc-600 group-hover:text-cyan-400 transition-colors" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'signals' && (
              <motion.div key="signals" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-track-zinc-900 scrollbar-thumb-zinc-700">
                  {entity.signals.map((signal, i) => (
                    <div key={i} className="flex items-center justify-between bg-zinc-800/40 rounded px-2 py-1.5">
                      <div className="flex items-center gap-2">
                        <Zap className="w-3 h-3 text-yellow-500" />
                        <span className="text-xs text-zinc-300">{signal.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MiniSparkline data={[signal.value * 0.7, signal.value * 0.8, signal.value * 0.9, signal.value, signal.value * 1.1]} color={getScoreColor(signal.value * 10)} />
                        <span className="text-xs font-mono font-medium text-white">{signal.value.toFixed(2)}</span>
                        <TrendIcon trend={signal.trend} />
                        <span className="text-[9px] text-zinc-500">{formatTimestamp(signal.lastSeen)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'predictions' && showPredictions && entity.predictions && (
              <motion.div key="predictions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="space-y-2">
                  {entity.predictions.map((pred, i) => (
                    <div key={i} className="bg-zinc-800/40 border border-zinc-700/30 rounded-lg p-2.5">
                      <div className="flex items-start justify-between">
                        <p className="text-xs text-zinc-200 flex-1">{pred.event}</p>
                        <span className={`text-sm font-bold ml-2 ${pred.probability >= 0.7 ? 'text-red-400' : pred.probability >= 0.4 ? 'text-yellow-400' : 'text-green-400'}`}>
                          {(pred.probability * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-zinc-500">{pred.timeframe}</span>
                        <span className="text-[9px] text-zinc-600">•</span>
                        <span className="text-[9px] text-zinc-500">{pred.model}</span>
                      </div>
                      <div className="mt-1.5 h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: pred.probability >= 0.7 ? '#ef4444' : pred.probability >= 0.4 ? '#fbbf24' : '#10b981' }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pred.probability * 100}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Action Bar */}
      <div className="border-t border-zinc-800 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button onClick={() => onInvestigate?.(entity.id)} className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-cyan-400 transition-colors" title="Investigate">
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onTask?.(entity.id)} className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-orange-400 transition-colors" title="Task Collection">
            <Crosshair className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onAlert?.(entity.id)} className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-yellow-400 transition-colors" title="Set Alert">
            <Bell className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onExport?.(entity.id, 'stix')} className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-green-400 transition-colors" title="Export STIX 2.1">
            <FileText className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleCopy} className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors" title="Copy ID">
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
          <button
            onClick={() => onNavigate?.(entity.id)}
            className="flex items-center gap-1 text-[10px] text-cyan-500 hover:text-cyan-400 transition-colors"
          >
            Open <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Decay Indicator */}
      {entity.decayRate !== undefined && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: entity.decayRate > 0.5 ? '#ef4444' : entity.decayRate > 0.2 ? '#fbbf24' : '#10b981' }} title={`Decay rate: ${(entity.decayRate * 100).toFixed(1)}%/hr`} />
        </div>
      )}
    </motion.div>
  );
}

export default IntelligenceCard;
