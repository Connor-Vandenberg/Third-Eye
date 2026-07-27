'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Radio, Satellite, Anchor, Plane, Shield, Zap,
  Target, Eye, Activity, Clock, ChevronRight, Link2,
  AlertTriangle, Brain, Network, Filter
} from 'lucide-react';

// SWIMLANE COP: Multi-INT fusion visible at a glance
// Each INT domain gets its own horizontal swimlane
// Cross-domain correlation lines connect related events
// Corvus.Head pattern: single screen shows all sources simultaneously

export interface SwimlaneEvent {
  id: string;
  domain: string;
  timestamp: string;
  label: string;
  severity: number;
  convergenceScore?: number;
  entities: string[];
  source: string;
  correlationGroup?: string; // Events in same group are correlated across domains
}

interface SwimlaneCOPProps {
  events: SwimlaneEvent[];
  timeRange: { start: Date; end: Date };
  onEventClick?: (event: SwimlaneEvent) => void;
  onCorrelationClick?: (group: string) => void;
  showCorrelations?: boolean;
  className?: string;
}

const DOMAIN_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  OSINT: { icon: Globe, color: '#3b82f6', label: 'OSINT' },
  SIGINT: { icon: Radio, color: '#8b5cf6', label: 'SIGINT' },
  GEOINT: { icon: Satellite, color: '#10b981', label: 'GEOINT' },
  CYBER: { icon: Shield, color: '#ef4444', label: 'CYBER' },
  FININT: { icon: Target, color: '#06b6d4', label: 'FININT' },
  HUMINT: { icon: Eye, color: '#f59e0b', label: 'HUMINT' },
  MASINT: { icon: Activity, color: '#ec4899', label: 'MASINT' },
  ELINT: { icon: Network, color: '#a855f7', label: 'ELINT' },
  IMINT: { icon: Plane, color: '#14b8a6', label: 'IMINT' },
  INFOPS: { icon: Brain, color: '#f97316', label: 'INFO-OPS' },
};

function EventDot({ event, position, onClick }: { event: SwimlaneEvent; position: number; onClick: () => void }) {
  const severity = event.severity;
  const size = 6 + severity * 8;
  const config = DOMAIN_CONFIG[event.domain];

  return (
    <motion.button
      onClick={onClick}
      className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-10"
      style={{ left: `${position}%`, top: '50%' }}
      whileHover={{ scale: 1.5 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
    >
      <div
        className="rounded-full border-2"
        style={{
          width: size,
          height: size,
          backgroundColor: `${config?.color}40`,
          borderColor: config?.color,
        }}
      />
      {severity >= 0.8 && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: config?.color }}
          animate={{ scale: [1, 2, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity">
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 shadow-xl whitespace-nowrap">
          <p className="text-[9px] text-white font-medium">{event.label}</p>
          <div className="flex items-center gap-2 mt-0.5 text-[8px] text-zinc-500">
            <span>{event.source}</span>
            {event.convergenceScore && <span>CS:{event.convergenceScore}</span>}
          </div>
        </div>
      </div>
    </motion.button>
  );
}

export function SwimlaneCOP({ events, timeRange, onEventClick, onCorrelationClick, showCorrelations = true, className = '' }: SwimlaneCOPProps) {
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set(Object.keys(DOMAIN_CONFIG)));

  const rangeMs = timeRange.end.getTime() - timeRange.start.getTime();

  // Group events by domain
  const domainEvents = useMemo(() => {
    const grouped: Record<string, SwimlaneEvent[]> = {};
    Object.keys(DOMAIN_CONFIG).forEach(d => { grouped[d] = []; });
    events.forEach(e => {
      if (grouped[e.domain]) grouped[e.domain].push(e);
    });
    return grouped;
  }, [events]);

  // Find correlation groups
  const correlationGroups = useMemo(() => {
    const groups: Record<string, SwimlaneEvent[]> = {};
    events.forEach(e => {
      if (e.correlationGroup) {
        if (!groups[e.correlationGroup]) groups[e.correlationGroup] = [];
        groups[e.correlationGroup].push(e);
      }
    });
    return groups;
  }, [events]);

  const getTimePosition = (timestamp: string) => {
    const t = new Date(timestamp).getTime();
    return ((t - timeRange.start.getTime()) / rangeMs) * 100;
  };

  const activeDomains = Object.entries(DOMAIN_CONFIG).filter(([key]) => selectedDomains.has(key));
  const laneHeight = Math.max(40, Math.min(60, 500 / activeDomains.length));

  return (
    <div className={`bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-white">Multi-INT Swimlane COP</h3>
          <span className="text-[9px] text-zinc-500">{events.length} events across {activeDomains.length} domains</span>
        </div>
        <div className="flex items-center gap-1">
          {Object.entries(DOMAIN_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => {
                const next = new Set(selectedDomains);
                if (next.has(key)) next.delete(key); else next.add(key);
                setSelectedDomains(next);
              }}
              className={`w-5 h-5 rounded flex items-center justify-center transition-opacity ${selectedDomains.has(key) ? 'opacity-100' : 'opacity-20'}`}
              title={config.label}
            >
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: config.color }} />
            </button>
          ))}
        </div>
      </div>

      {/* Swimlanes */}
      <div className="relative">
        {/* Time axis */}
        <div className="absolute top-0 left-20 right-0 h-5 flex items-center border-b border-zinc-800/50 z-20 bg-zinc-950">
          {Array.from({ length: 7 }, (_, i) => {
            const t = new Date(timeRange.start.getTime() + (i / 6) * rangeMs);
            return (
              <span key={i} className="absolute text-[7px] text-zinc-600 font-mono" style={{ left: `${(i / 6) * 100}%` }}>
                {t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            );
          })}
        </div>

        <div className="pt-5">
          {activeDomains.map(([domain, config], laneIndex) => {
            const Icon = config.icon;
            const laneEvents = domainEvents[domain] || [];

            return (
              <div key={domain} className="flex border-b border-zinc-800/30" style={{ height: laneHeight }}>
                {/* Domain label */}
                <div className="w-20 flex items-center gap-1.5 px-2 border-r border-zinc-800/50 flex-shrink-0">
                  <Icon className="w-3 h-3" style={{ color: config.color }} />
                  <span className="text-[8px] font-medium" style={{ color: config.color }}>{config.label}</span>
                </div>

                {/* Event track */}
                <div className="flex-1 relative">
                  {/* Background grid */}
                  {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="absolute top-0 bottom-0 w-px bg-zinc-800/20" style={{ left: `${(i / 6) * 100}%` }} />
                  ))}

                  {/* Events */}
                  {laneEvents.map(event => (
                    <EventDot
                      key={event.id}
                      event={event}
                      position={getTimePosition(event.timestamp)}
                      onClick={() => onEventClick?.(event)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Cross-domain correlation lines */}
        {showCorrelations && (
          <svg className="absolute inset-0 pointer-events-none" style={{ top: 20, left: 80 }}>
            {Object.entries(correlationGroups).map(([groupId, groupEvents]) => {
              if (groupEvents.length < 2) return null;
              const isHighlighted = hoveredGroup === groupId;

              return groupEvents.slice(1).map((event, i) => {
                const prev = groupEvents[i];
                const x1 = getTimePosition(prev.timestamp);
                const x2 = getTimePosition(event.timestamp);
                const domainKeys = activeDomains.map(([k]) => k);
                const y1 = (domainKeys.indexOf(prev.domain) + 0.5) * laneHeight;
                const y2 = (domainKeys.indexOf(event.domain) + 0.5) * laneHeight;

                if (y1 < 0 || y2 < 0) return null;

                return (
                  <line
                    key={`${groupId}-${i}`}
                    x1={`${x1}%`} y1={y1}
                    x2={`${x2}%`} y2={y2}
                    stroke={isHighlighted ? '#fbbf24' : '#fbbf2440'}
                    strokeWidth={isHighlighted ? 2 : 1}
                    strokeDasharray="4,4"
                    onMouseEnter={() => setHoveredGroup(groupId)}
                    onMouseLeave={() => setHoveredGroup(null)}
                    className="pointer-events-auto cursor-pointer"
                  />
                );
              });
            })}
          </svg>
        )}
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-t border-zinc-800 flex items-center justify-between text-[8px] text-zinc-500">
        <span>Dot size = severity | Dashed lines = cross-domain correlation | Pulse = critical</span>
        <span>{Object.keys(correlationGroups).length} correlation groups detected</span>
      </div>
    </div>
  );
}

export default SwimlaneCOP;
