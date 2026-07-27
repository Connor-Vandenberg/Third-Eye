'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Activity, TrendingDown, RefreshCw, AlertTriangle, Zap } from 'lucide-react';

// CONFIDENCE DECAY VISUALIZATION
// Shows Weibull temporal decay on entities in real-time
// Entities that haven't been refreshed VISUALLY FADE
// Fresh intel GLOWS. This communicates temporal freshness without reading timestamps.

export interface DecayingEntity {
  id: string;
  name: string;
  type: string;
  domain: string;
  convergenceScore: number;
  lastUpdated: string; // ISO timestamp
  decayHalfLifeHours: number; // Weibull half-life for this source type
  sourceCount: number;
  currentDecayFactor: number; // 0-1, computed from time since lastUpdated
}

interface ConfidenceDecayVizProps {
  entities: DecayingEntity[];
  currentTime?: Date;
  showDecayCurve?: boolean;
  sortBy?: 'freshest' | 'stalest' | 'highest_score' | 'fastest_decay';
  onRefreshRequest?: (entityId: string) => void;
  onEntityClick?: (entityId: string) => void;
  className?: string;
}

// Weibull decay function: f(t) = exp(-(t/lambda)^k)
// For intelligence: k=1.5 (slightly super-exponential, faster initial decay)
function computeDecay(hoursElapsed: number, halfLifeHours: number, k: number = 1.5): number {
  const lambda = halfLifeHours / Math.pow(Math.log(2), 1 / k);
  return Math.exp(-Math.pow(hoursElapsed / lambda, k));
}

// Standard half-lives by source type (from your edge_routes_v4.py)
const SOURCE_HALF_LIVES: Record<string, number> = {
  'ADS-B': 6,
  'AIS': 12,
  'GDELT': 24,
  'Telegram': 48,
  'ACLED': 72,
  'Satellite': 168,
  'OSINT_General': 48,
  'Sanctions': 2160,
  'Financial': 168,
  'Cyber_IOC': 168,
  'Dark_Web': 72,
  'Radio_Intercept': 24,
  'Face_Recognition': 720,
  'Prediction': 336,
};

function DecayBar({ entity, onRefresh, onClick }: { entity: DecayingEntity; onRefresh?: () => void; onClick?: () => void }) {
  const decayPercent = entity.currentDecayFactor * 100;
  const isStale = decayPercent < 30;
  const isCritical = decayPercent < 10;
  const isFresh = decayPercent > 80;

  // Color based on freshness
  const getColor = () => {
    if (isFresh) return '#10b981';
    if (decayPercent > 60) return '#06b6d4';
    if (decayPercent > 40) return '#fbbf24';
    if (decayPercent > 20) return '#f97316';
    return '#ef4444';
  };

  const color = getColor();
  const hoursAgo = ((Date.now() - new Date(entity.lastUpdated).getTime()) / 3600000).toFixed(1);

  return (
    <motion.div
      className="group relative"
      style={{ opacity: 0.3 + entity.currentDecayFactor * 0.7 }} // Entities literally fade as they decay
      whileHover={{ opacity: 1 }} // Full brightness on hover always
      onClick={onClick}
    >
      <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-all cursor-pointer ${
        isCritical ? 'border-red-500/30 bg-red-500/5' : isStale ? 'border-yellow-500/20 bg-yellow-500/5' : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-700'
      }`}>
        {/* Freshness indicator (glow for fresh, dim for stale) */}
        <div className="relative">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          {isFresh && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ backgroundColor: color }}
              animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </div>

        {/* Entity info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-zinc-200 font-medium truncate">{entity.name}</span>
            <span className="text-[8px] px-1 py-0.5 rounded bg-zinc-800 text-zinc-500">{entity.type}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[9px] text-zinc-500">{entity.domain}</span>
            <span className="text-[9px] text-zinc-600">• {hoursAgo}h ago</span>
            <span className="text-[9px] text-zinc-600">• {entity.sourceCount} sources</span>
          </div>
        </div>

        {/* Decay bar */}
        <div className="w-20 flex flex-col items-end">
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: color }}
              initial={{ width: '100%' }}
              animate={{ width: `${decayPercent}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className="text-[8px] font-mono mt-0.5" style={{ color }}>{decayPercent.toFixed(0)}%</span>
        </div>

        {/* Convergence score */}
        <div className="text-right">
          <span className={`text-xs font-bold font-mono ${entity.convergenceScore >= 80 ? 'text-red-400' : entity.convergenceScore >= 60 ? 'text-yellow-400' : 'text-zinc-400'}`}>
            {entity.convergenceScore}
          </span>
        </div>

        {/* Refresh button (visible on hover) */}
        {onRefresh && (
          <button
            onClick={(e) => { e.stopPropagation(); onRefresh(); }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-cyan-400 transition-all"
            title="Request fresh collection"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

function DecayCurve({ halfLife, currentAge, width = 200, height = 40 }: {
  halfLife: number;
  currentAge: number;
  width?: number;
  height?: number;
}) {
  const points = Array.from({ length: 50 }, (_, i) => {
    const t = (i / 49) * halfLife * 3;
    const decay = computeDecay(t, halfLife);
    return { x: (t / (halfLife * 3)) * width, y: (1 - decay) * height };
  });

  const currentX = Math.min((currentAge / (halfLife * 3)) * width, width);
  const currentY = (1 - computeDecay(currentAge, halfLife)) * height;

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      {/* Half-life marker */}
      <line
        x1={(halfLife / (halfLife * 3)) * width} y1={0}
        x2={(halfLife / (halfLife * 3)) * width} y2={height}
        stroke="#fbbf24" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.5"
      />

      {/* Decay curve */}
      <path d={pathD} fill="none" stroke="#06b6d4" strokeWidth="1.5" opacity="0.8" />

      {/* Current position */}
      <circle cx={currentX} cy={currentY} r="3" fill="#ef4444" stroke="white" strokeWidth="1" />

      {/* Labels */}
      <text x={(halfLife / (halfLife * 3)) * width} y={height + 10} textAnchor="middle" fontSize="7" fill="#fbbf2480">t½</text>
    </svg>
  );
}

export function ConfidenceDecayViz({
  entities,
  currentTime = new Date(),
  showDecayCurve = false,
  sortBy = 'stalest',
  onRefreshRequest,
  onEntityClick,
  className = '',
}: ConfidenceDecayVizProps) {
  // Compute decay for all entities
  const processedEntities = useMemo(() => {
    return entities.map(entity => {
      const hoursElapsed = (currentTime.getTime() - new Date(entity.lastUpdated).getTime()) / 3600000;
      const decayFactor = computeDecay(hoursElapsed, entity.decayHalfLifeHours);
      return { ...entity, currentDecayFactor: decayFactor, hoursElapsed };
    }).sort((a, b) => {
      switch (sortBy) {
        case 'freshest': return b.currentDecayFactor - a.currentDecayFactor;
        case 'stalest': return a.currentDecayFactor - b.currentDecayFactor;
        case 'highest_score': return b.convergenceScore - a.convergenceScore;
        case 'fastest_decay': return a.decayHalfLifeHours - b.decayHalfLifeHours;
        default: return 0;
      }
    });
  }, [entities, currentTime, sortBy]);

  const staleCount = processedEntities.filter(e => e.currentDecayFactor < 0.3).length;
  const freshCount = processedEntities.filter(e => e.currentDecayFactor > 0.8).length;
  const avgDecay = processedEntities.reduce((a, e) => a + e.currentDecayFactor, 0) / processedEntities.length;

  return (
    <div className={`bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white">Temporal Confidence Decay</h3>
            <span className="text-[8px] text-zinc-500">(Weibull k=1.5)</span>
          </div>
          <div className="flex items-center gap-3 text-[9px]">
            <span className="text-emerald-400">{freshCount} fresh</span>
            <span className="text-yellow-400">{processedEntities.length - freshCount - staleCount} aging</span>
            <span className="text-red-400">{staleCount} stale</span>
          </div>
        </div>

        {/* Overall freshness bar */}
        <div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-red-500"
            style={{ width: `${avgDecay * 100}%` }}
            transition={{ duration: 1 }}
          />
        </div>
        <div className="flex items-center justify-between mt-1 text-[8px] text-zinc-600">
          <span>Average freshness: {(avgDecay * 100).toFixed(0)}%</span>
          <span>Half-life range: 6h (ADS-B) to 2160h (Sanctions)</span>
        </div>
      </div>

      {/* Entity list with decay */}
      <div className="p-3 space-y-1 max-h-[400px] overflow-y-auto">
        {processedEntities.map((entity) => (
          <DecayBar
            key={entity.id}
            entity={entity}
            onRefresh={onRefreshRequest ? () => onRefreshRequest(entity.id) : undefined}
            onClick={() => onEntityClick?.(entity.id)}
          />
        ))}
      </div>

      {/* Source half-life reference */}
      <div className="px-4 py-2.5 border-t border-zinc-800 bg-zinc-900/30">
        <h4 className="text-[9px] text-zinc-500 uppercase tracking-wider font-medium mb-1.5">Decay Half-Lives by Source</h4>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(SOURCE_HALF_LIVES).slice(0, 10).map(([source, hours]) => (
            <span key={source} className="text-[8px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
              {source}: <span className="text-cyan-400 font-mono">{hours}h</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ConfidenceDecayViz;
