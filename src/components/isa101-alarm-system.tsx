'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, Bell, BellOff, X, ChevronRight, Clock,
  Eye, Volume2, VolumeX, Filter, Archive, CheckCircle,
  Shield, Zap, Target, Settings
} from 'lucide-react';

// ISA-101 / ISA-18.2 COMPLIANT ALARM MANAGEMENT SYSTEM
// 4-level hierarchy: Critical -> High -> Medium -> Low
// Prevents alarm fatigue. Only CRITICAL gets full-screen takeover.
// Everything else uses progressive notification without interrupting workflow.

export type AlarmLevel = 1 | 2 | 3 | 4;
export type AlarmState = 'active' | 'acknowledged' | 'shelved' | 'suppressed' | 'cleared';

export interface ISA101Alarm {
  id: string;
  level: AlarmLevel;
  state: AlarmState;
  type: string;
  title: string;
  description: string;
  source: string;
  domain: string;
  convergenceScore: number;
  timestamp: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  shelvedUntil?: string;
  autoEscalateAt?: string;
  relatedAlarms?: string[];
  suggestedActions?: string[];
}

interface ISA101AlarmSystemProps {
  alarms: ISA101Alarm[];
  onAcknowledge: (id: string) => void;
  onShelve: (id: string, durationMinutes: number) => void;
  onSuppress: (id: string) => void;
  onClear: (id: string) => void;
  onAction: (id: string, action: string) => void;
  soundEnabled?: boolean;
  maxBannerAlarms?: number;
  floodThreshold?: number; // Group if more than this many in 30s
  className?: string;
}

// ISA-101 Color Philosophy:
// Gray = normal (NOT black, prevents eye fatigue)
// Red = requires IMMEDIATE action (Level 1 only)
// Amber/Yellow = awareness, action needed but not immediate (Level 2)
// Cyan = informational deviation (Level 3)
// NO green for healthy. Green means GO/PROCEED per ISA-101.

const ALARM_LEVEL_CONFIG: Record<AlarmLevel, {
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
  sound: boolean;
  persistent: boolean;
  autoAckSeconds: number | null;
  description: string;
}> = {
  1: {
    color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.3)',
    label: 'CRITICAL', sound: true, persistent: true, autoAckSeconds: null,
    description: 'Immediate action required. Full-screen takeover. Convergence > 90 + confirmed novel signal.'
  },
  2: {
    color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.06)', borderColor: 'rgba(245, 158, 11, 0.25)',
    label: 'HIGH', sound: true, persistent: false, autoAckSeconds: 60,
    description: 'Awareness required. Top-banner slide-in. Does NOT interrupt workflow. Convergence 70-90.'
  },
  3: {
    color: '#06b6d4', bgColor: 'rgba(6, 182, 212, 0.05)', borderColor: 'rgba(6, 182, 212, 0.2)',
    label: 'MEDIUM', sound: false, persistent: false, autoAckSeconds: 30,
    description: 'Informational. Badge counter + alert feed entry. Convergence 40-70.'
  },
  4: {
    color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.04)', borderColor: 'rgba(107, 114, 128, 0.15)',
    label: 'LOW', sound: false, persistent: false, autoAckSeconds: 10,
    description: 'Log only. Visible in alert history. Convergence < 40.'
  },
};

// Alarm flood detection (ISA-18.2)
function detectFlood(alarms: ISA101Alarm[], thresholdCount: number, windowMs: number = 30000): boolean {
  const now = Date.now();
  const recentCount = alarms.filter(a => now - new Date(a.timestamp).getTime() < windowMs && a.state === 'active').length;
  return recentCount >= thresholdCount;
}

// Level 2: Top banner notification
function BannerAlarm({ alarm, onAcknowledge, onShelve }: {
  alarm: ISA101Alarm;
  onAcknowledge: () => void;
  onShelve: () => void;
}) {
  const config = ALARM_LEVEL_CONFIG[alarm.level];

  return (
    <motion.div
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -60, opacity: 0 }}
      transition={{ type: 'spring', damping: 25 }}
      className="flex items-center gap-3 px-4 py-2.5 rounded-lg border shadow-lg"
      style={{ backgroundColor: config.bgColor, borderColor: config.borderColor }}
    >
      <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: config.color }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold tracking-wider" style={{ color: config.color }}>{config.label}</span>
          <span className="text-xs font-medium text-white truncate">{alarm.title}</span>
        </div>
        <p className="text-[10px] text-zinc-400 truncate">{alarm.description}</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className="text-[9px] font-mono text-zinc-500">{alarm.domain} CS:{alarm.convergenceScore}</span>
        <button onClick={onAcknowledge} className="p-1.5 rounded hover:bg-white/10 transition-colors" style={{ color: config.color }} title="Acknowledge">
          <CheckCircle className="w-4 h-4" />
        </button>
        <button onClick={onShelve} className="p-1.5 rounded hover:bg-white/10 text-zinc-400 transition-colors" title="Shelve 15min">
          <Archive className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// Level 3: Compact feed entry
function FeedAlarm({ alarm, onAcknowledge }: { alarm: ISA101Alarm; onAcknowledge: () => void }) {
  const config = ALARM_LEVEL_CONFIG[alarm.level];
  const age = Math.round((Date.now() - new Date(alarm.timestamp).getTime()) / 60000);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded border transition-colors hover:bg-zinc-800/30" style={{ borderColor: `${config.color}15` }}>
      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: config.color }} />
      <span className="text-[10px] text-zinc-300 flex-1 truncate">{alarm.title}</span>
      <span className="text-[8px] text-zinc-500 font-mono">{age}m</span>
      <button onClick={onAcknowledge} className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-zinc-700">
        <CheckCircle className="w-3 h-3 text-zinc-500" />
      </button>
    </div>
  );
}

// Flood mode: grouped alarms
function FloodNotification({ count, alarms, onAcknowledgeAll }: {
  count: number;
  alarms: ISA101Alarm[];
  onAcknowledgeAll: () => void;
}) {
  const domains = [...new Set(alarms.map(a => a.domain))];

  return (
    <motion.div
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -60, opacity: 0 }}
      className="flex items-center gap-3 px-4 py-3 rounded-lg border border-red-500/20 bg-red-500/5"
    >
      <div className="relative">
        <Bell className="w-5 h-5 text-red-400" />
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[7px] font-bold text-white flex items-center justify-center">{count}</span>
      </div>
      <div className="flex-1">
        <span className="text-xs font-bold text-red-400">ALARM FLOOD DETECTED</span>
        <p className="text-[10px] text-zinc-400">{count} alarms in 30s across {domains.join(', ')}. Grouped for review.</p>
      </div>
      <button onClick={onAcknowledgeAll} className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-medium hover:bg-red-500/30">
        ACK ALL
      </button>
    </motion.div>
  );
}

export function ISA101AlarmSystem({
  alarms,
  onAcknowledge,
  onShelve,
  onSuppress,
  onClear,
  onAction,
  soundEnabled = true,
  maxBannerAlarms = 3,
  floodThreshold = 5,
  className = '',
}: ISA101AlarmSystemProps) {
  const [muted, setMuted] = useState(!soundEnabled);
  const [showFeed, setShowFeed] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const activeAlarms = alarms.filter(a => a.state === 'active');
  const level1 = activeAlarms.filter(a => a.level === 1);
  const level2 = activeAlarms.filter(a => a.level === 2);
  const level3 = activeAlarms.filter(a => a.level === 3);
  const level4 = activeAlarms.filter(a => a.level === 4);
  const isFlood = detectFlood(alarms, floodThreshold);
  const totalActive = activeAlarms.length;

  // Auto-acknowledge based on level timeout
  useEffect(() => {
    const interval = setInterval(() => {
      activeAlarms.forEach(alarm => {
        const config = ALARM_LEVEL_CONFIG[alarm.level];
        if (config.autoAckSeconds) {
          const age = (Date.now() - new Date(alarm.timestamp).getTime()) / 1000;
          if (age > config.autoAckSeconds) {
            onAcknowledge(alarm.id);
          }
        }
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [activeAlarms, onAcknowledge]);

  // Sound for Level 1 and 2
  useEffect(() => {
    if (muted) return;
    const newAlarms = activeAlarms.filter(a => {
      const age = Date.now() - new Date(a.timestamp).getTime();
      return age < 2000 && ALARM_LEVEL_CONFIG[a.level].sound;
    });

    if (newAlarms.length > 0) {
      try {
        if (!audioContextRef.current) audioContextRef.current = new AudioContext();
        const ctx = audioContextRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const isLevel1 = newAlarms.some(a => a.level === 1);
        osc.frequency.setValueAtTime(isLevel1 ? 880 : 660, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } catch (e) { /* Audio not available */ }
    }
  }, [activeAlarms.length, muted]);

  return (
    <div className={`${className}`}>
      {/* Level 2 Banner Area (slides in from top, doesn't block workflow) */}
      <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[100] w-full max-w-2xl px-4 space-y-1.5">
        <AnimatePresence>
          {isFlood ? (
            <FloodNotification
              key="flood"
              count={totalActive}
              alarms={activeAlarms}
              onAcknowledgeAll={() => activeAlarms.forEach(a => onAcknowledge(a.id))}
            />
          ) : (
            level2.slice(0, maxBannerAlarms).map(alarm => (
              <BannerAlarm
                key={alarm.id}
                alarm={alarm}
                onAcknowledge={() => onAcknowledge(alarm.id)}
                onShelve={() => onShelve(alarm.id, 15)}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Level 3+4 Badge (bottom-right corner, non-intrusive) */}
      {(level3.length + level4.length) > 0 && (
        <div className="fixed bottom-4 right-4 z-[90]">
          <button
            onClick={() => setShowFeed(!showFeed)}
            className="relative p-3 rounded-xl bg-zinc-900 border border-zinc-700 shadow-xl hover:border-zinc-600 transition-colors"
          >
            <Bell className="w-5 h-5 text-zinc-400" />
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-cyan-500 text-[8px] font-bold text-white flex items-center justify-center">
              {level3.length + level4.length}
            </span>
          </button>

          {/* Feed dropdown */}
          <AnimatePresence>
            {showFeed && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-14 right-0 w-80 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden"
              >
                <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
                  <span className="text-[10px] font-medium text-zinc-300">Notifications</span>
                  <button onClick={() => setMuted(!muted)} className="p-1 rounded hover:bg-zinc-800">
                    {muted ? <VolumeX className="w-3.5 h-3.5 text-zinc-500" /> : <Volume2 className="w-3.5 h-3.5 text-zinc-400" />}
                  </button>
                </div>
                <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
                  {[...level3, ...level4].map(alarm => (
                    <FeedAlarm key={alarm.id} alarm={alarm} onAcknowledge={() => onAcknowledge(alarm.id)} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* NOTE: Level 1 (CRITICAL) uses the existing AlertTakeover component */}
      {/* It should ONLY fire when: convergenceScore > 90 AND type === 'NOVEL_SIGNAL' AND confirmed */}
      {/* Everything else goes through this ISA-101 system */}
    </div>
  );
}

export default ISA101AlarmSystem;
