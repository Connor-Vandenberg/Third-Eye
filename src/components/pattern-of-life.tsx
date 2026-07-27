'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle, Activity, Calendar, Eye, ChevronRight, Zap } from 'lucide-react';

// PATTERN OF LIFE ANALYSIS
// Shows entity activity over time as daily/weekly pattern
// Highlights DEVIATIONS from established behavior
// "This vessel usually docks at Port A on Tuesdays. This Tuesday it went to Port B. Flag."

export interface ActivityEvent {
  timestamp: string;
  type: string;
  location?: string;
  value?: number;
  isAnomaly?: boolean;
  anomalyReason?: string;
}

export interface PatternProfile {
  entityId: string;
  entityName: string;
  entityType: string;
  observationPeriod: { start: string; end: string };
  totalEvents: number;
  events: ActivityEvent[];
  baselinePattern: number[][]; // 7 days x 24 hours grid of expected activity
  currentPattern: number[][]; // 7 days x 24 hours of actual recent activity
  deviations: Array<{
    day: number;
    hour: number;
    expected: number;
    actual: number;
    severity: number;
    description: string;
  }>;
  routineLocations: Array<{ name: string; frequency: number; lastSeen: string }>;
  unusualLocations: Array<{ name: string; timestamp: string; deviation: string }>;
}

interface PatternOfLifeProps {
  profile: PatternProfile;
  onDeviationClick?: (deviation: any) => void;
  onTaskCollection?: (entityId: string) => void;
  className?: string;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function HeatmapCell({ baseline, actual, isDeviation, severity, onClick }: {
  baseline: number;
  actual: number;
  isDeviation: boolean;
  severity: number;
  onClick?: () => void;
}) {
  const intensity = actual / Math.max(baseline, 1);
  const baseColor = isDeviation
    ? severity >= 0.8 ? 'rgba(239, 68, 68,' : severity >= 0.5 ? 'rgba(249, 115, 22,' : 'rgba(251, 191, 36,'
    : 'rgba(6, 182, 212,';

  const opacity = Math.min(actual / 10, 0.9);

  return (
    <div
      className={`w-full h-full rounded-sm cursor-pointer transition-all hover:ring-1 hover:ring-white/30 ${isDeviation ? 'ring-1 ring-red-500/50' : ''}`}
      style={{ backgroundColor: `${baseColor}${opacity.toFixed(2)})` }}
      onClick={onClick}
      title={`Expected: ${baseline.toFixed(1)} | Actual: ${actual.toFixed(1)}${isDeviation ? ' ⚠️ DEVIATION' : ''}`}
    />
  );
}

export function PatternOfLife({ profile, onDeviationClick, onTaskCollection, className = '' }: PatternOfLifeProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showLocations, setShowLocations] = useState(false);

  const deviationMap = useMemo(() => {
    const map: Record<string, typeof profile.deviations[0]> = {};
    profile.deviations.forEach(d => {
      map[`${d.day}-${d.hour}`] = d;
    });
    return map;
  }, [profile.deviations]);

  const totalDeviations = profile.deviations.length;
  const criticalDeviations = profile.deviations.filter(d => d.severity >= 0.8).length;

  return (
    <div className={`bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <div>
              <h3 className="text-xs font-bold text-white">Pattern of Life: {profile.entityName}</h3>
              <p className="text-[9px] text-zinc-500">{profile.entityType} • {profile.totalEvents.toLocaleString()} events observed</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {criticalDeviations > 0 && (
              <span className="text-[9px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />{criticalDeviations} critical deviations
              </span>
            )}
            <span className="text-[9px] text-zinc-500">{totalDeviations} total anomalies</span>
          </div>
        </div>
      </div>

      {/* Activity Heatmap: 7 days x 24 hours */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[9px] uppercase tracking-wider text-zinc-500 font-medium">Weekly Activity Pattern (Baseline vs Actual)</h4>
          <div className="flex items-center gap-3 text-[8px]">
            <div className="flex items-center gap-1"><div className="w-3 h-2 rounded-sm bg-cyan-500/60" /><span className="text-zinc-500">Normal</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-2 rounded-sm bg-red-500/60" /><span className="text-zinc-500">Deviation</span></div>
          </div>
        </div>

        {/* Hour labels */}
        <div className="flex ml-8">
          {HOURS.filter((_, i) => i % 3 === 0).map(h => (
            <span key={h} className="text-[7px] text-zinc-600 font-mono" style={{ width: `${100 / 8}%` }}>{String(h).padStart(2, '0')}</span>
          ))}
        </div>

        {/* Grid */}
        <div className="space-y-0.5">
          {DAYS.map((day, dayIndex) => (
            <div key={day} className="flex items-center gap-1">
              <span className="text-[8px] text-zinc-500 w-7 text-right">{day}</span>
              <div className="flex-1 grid grid-cols-24 gap-px" style={{ gridTemplateColumns: 'repeat(24, 1fr)' }}>
                {HOURS.map(hour => {
                  const baseline = profile.baselinePattern[dayIndex]?.[hour] || 0;
                  const actual = profile.currentPattern[dayIndex]?.[hour] || 0;
                  const deviationKey = `${dayIndex}-${hour}`;
                  const deviation = deviationMap[deviationKey];

                  return (
                    <div key={hour} className="aspect-square">
                      <HeatmapCell
                        baseline={baseline}
                        actual={actual}
                        isDeviation={!!deviation}
                        severity={deviation?.severity || 0}
                        onClick={() => deviation && onDeviationClick?.(deviation)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Deviations list */}
      {profile.deviations.length > 0 && (
        <div className="px-4 py-3 border-t border-zinc-800">
          <h4 className="text-[9px] uppercase tracking-wider text-zinc-500 font-medium mb-2">Detected Deviations</h4>
          <div className="space-y-1 max-h-[120px] overflow-y-auto">
            {profile.deviations.sort((a, b) => b.severity - a.severity).slice(0, 8).map((dev, i) => (
              <div key={i} className={`flex items-center gap-2 px-2 py-1 rounded text-[9px] ${dev.severity >= 0.8 ? 'bg-red-500/5 border border-red-500/20' : 'bg-zinc-800/30'}`}>
                <AlertTriangle className="w-3 h-3 flex-shrink-0" style={{ color: dev.severity >= 0.8 ? '#ef4444' : dev.severity >= 0.5 ? '#f97316' : '#fbbf24' }} />
                <span className="text-zinc-300 flex-1">{dev.description}</span>
                <span className="text-zinc-500">{DAYS[dev.day]} {String(dev.hour).padStart(2, '0')}:00</span>
                <span className="font-mono text-red-400">{(dev.severity * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locations */}
      <div className="px-4 py-3 border-t border-zinc-800">
        <button onClick={() => setShowLocations(!showLocations)} className="w-full flex items-center justify-between text-[9px] text-zinc-500 hover:text-zinc-300">
          <span>Routine Locations ({profile.routineLocations.length}) • Unusual ({profile.unusualLocations.length})</span>
          <ChevronRight className={`w-3 h-3 transition-transform ${showLocations ? 'rotate-90' : ''}`} />
        </button>
        {showLocations && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div>
              <span className="text-[8px] text-zinc-600 uppercase">Routine</span>
              {profile.routineLocations.slice(0, 5).map((loc, i) => (
                <div key={i} className="flex items-center justify-between text-[9px] mt-0.5">
                  <span className="text-zinc-400">{loc.name}</span>
                  <span className="text-zinc-500 font-mono">{(loc.frequency * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
            <div>
              <span className="text-[8px] text-red-400/60 uppercase">Unusual</span>
              {profile.unusualLocations.slice(0, 5).map((loc, i) => (
                <div key={i} className="flex items-center justify-between text-[9px] mt-0.5">
                  <span className="text-red-400">{loc.name}</span>
                  <span className="text-zinc-500">{loc.deviation}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action */}
      {onTaskCollection && (
        <div className="px-4 py-2 border-t border-zinc-800">
          <button
            onClick={() => onTaskCollection(profile.entityId)}
            className="w-full px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-medium hover:bg-cyan-500/20 transition-colors"
          >
            <Eye className="w-3 h-3 inline mr-1" /> Task Enhanced Collection on This Entity
          </button>
        </div>
      )}
    </div>
  );
}

export default PatternOfLife;
