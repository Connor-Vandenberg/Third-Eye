'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, X, Bell, Shield, Zap, Target, Globe,
  Clock, MapPin, Radio, Eye, ChevronRight, Volume2, VolumeX,
  ExternalLink, Crosshair, FileText
} from 'lucide-react';

export interface CriticalAlert {
  id: string;
  type: 'NOVEL_SIGNAL' | 'CONVERGENCE_SPIKE' | 'PREDICTION_THRESHOLD' | 'ENTITY_CRITICAL' | 'MESH_BREACH' | 'PATTERN_BREAK';
  severity: 'CRITICAL' | 'HIGH';
  title: string;
  description: string;
  source: string;
  domain: string;
  confidence: number;
  convergenceScore: number;
  location?: { lat: number; lng: number; label: string };
  entities: Array<{ id: string; name: string; type: string }>;
  signals: Array<{ type: string; value: number; source: string }>;
  timestamp: string;
  expiresIn?: number;
  requiresAck: boolean;
  suggestedActions: Array<{
    label: string;
    type: 'investigate' | 'task' | 'alert' | 'dismiss';
    priority: number;
  }>;
  relatedAlerts?: string[];
}

interface AlertTakeoverProps {
  alert: CriticalAlert | null;
  onAcknowledge: (id: string) => void;
  onDismiss: (id: string) => void;
  onAction: (alertId: string, action: string) => void;
  onNavigateEntity: (entityId: string) => void;
  soundEnabled?: boolean;
  autoDismissMs?: number;
  className?: string;
}

const ALERT_TYPE_CONFIG: Record<string, { icon: any; color: string; pulseColor: string; label: string }> = {
  NOVEL_SIGNAL: { icon: Zap, color: '#f59e0b', pulseColor: 'rgba(245, 158, 11, 0.3)', label: 'NOVEL SIGNAL DETECTED' },
  CONVERGENCE_SPIKE: { icon: Target, color: '#ef4444', pulseColor: 'rgba(239, 68, 68, 0.3)', label: 'CONVERGENCE SPIKE' },
  PREDICTION_THRESHOLD: { icon: Eye, color: '#8b5cf6', pulseColor: 'rgba(139, 92, 246, 0.3)', label: 'PREDICTION THRESHOLD EXCEEDED' },
  ENTITY_CRITICAL: { icon: Shield, color: '#ef4444', pulseColor: 'rgba(239, 68, 68, 0.3)', label: 'ENTITY CRITICAL STATE' },
  MESH_BREACH: { icon: Radio, color: '#f97316', pulseColor: 'rgba(249, 115, 22, 0.3)', label: 'MESH SECURITY BREACH' },
  PATTERN_BREAK: { icon: AlertTriangle, color: '#fbbf24', pulseColor: 'rgba(251, 191, 36, 0.3)', label: 'PATTERN DEVIATION' },
};

export function AlertTakeover({
  alert,
  onAcknowledge,
  onDismiss,
  onAction,
  onNavigateEntity,
  soundEnabled = true,
  autoDismissMs = 30000,
  className = '',
}: AlertTakeoverProps) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [muted, setMuted] = useState(!soundEnabled);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (alert && !alert.requiresAck && autoDismissMs > 0) {
      setCountdown(Math.ceil(autoDismissMs / 1000));
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            onDismiss(alert.id);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      timerRef.current = interval;
      return () => clearInterval(interval);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [alert, autoDismissMs, onDismiss]);

  useEffect(() => {
    if (alert && !muted) {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(660, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      } catch (e) { /* Audio not available */ }
    }
  }, [alert, muted]);

  useEffect(() => {
    setAcknowledged(false);
  }, [alert?.id]);

  const handleAcknowledge = useCallback(() => {
    if (!alert) return;
    setAcknowledged(true);
    onAcknowledge(alert.id);
    setTimeout(() => onDismiss(alert.id), 1500);
  }, [alert, onAcknowledge, onDismiss]);

  if (!alert) return null;

  const config = ALERT_TYPE_CONFIG[alert.type] || ALERT_TYPE_CONFIG.NOVEL_SIGNAL;
  const AlertIcon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className={`fixed inset-0 z-[9999] flex items-center justify-center ${className}`}
      >
        {/* Pulsing background overlay */}
        <motion.div
          className="absolute inset-0"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
          animate={{ backgroundColor: ['rgba(0,0,0,0.85)', config.pulseColor, 'rgba(0,0,0,0.85)'] }}
          transition={{ duration: 2, repeat: acknowledged ? 0 : Infinity, ease: 'easeInOut' }}
        />

        {/* Scanning lines effect */}
        <motion.div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${config.color}10 2px, ${config.color}10 4px)`,
          }}
          animate={{ backgroundPosition: ['0px 0px', '0px 100px'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />

        {/* Alert Card */}
        <motion.div
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 50 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="relative w-full max-w-2xl mx-4 bg-zinc-900/95 backdrop-blur-2xl border rounded-2xl overflow-hidden shadow-2xl"
          style={{ borderColor: `${config.color}50` }}
        >
          {/* Top glow bar */}
          <motion.div
            className="h-1 w-full"
            style={{ backgroundColor: config.color }}
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />

          {/* Header */}
          <div className="p-6 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: acknowledged ? 0 : 3 }}
                >
                  <AlertIcon className="w-8 h-8" style={{ color: config.color }} />
                </motion.div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold tracking-[0.25em] uppercase" style={{ color: config.color }}>
                      {config.label}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">
                      {alert.severity}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1">{alert.title}</h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setMuted(!muted)} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
                  {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                {!alert.requiresAck && (
                  <button onClick={() => onDismiss(alert.id)} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-4">
            <p className="text-sm text-zinc-300 leading-relaxed">{alert.description}</p>

            {/* Metadata Grid */}
            <div className="grid grid-cols-4 gap-3 mt-4">
              <div className="bg-zinc-800/50 rounded-lg p-2.5 text-center">
                <span className="text-[9px] uppercase tracking-wider text-zinc-500 block">Confidence</span>
                <span className="text-lg font-bold text-white">{alert.confidence}%</span>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-2.5 text-center">
                <span className="text-[9px] uppercase tracking-wider text-zinc-500 block">Convergence</span>
                <span className="text-lg font-bold" style={{ color: config.color }}>{alert.convergenceScore}</span>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-2.5 text-center">
                <span className="text-[9px] uppercase tracking-wider text-zinc-500 block">Domain</span>
                <span className="text-sm font-medium text-white">{alert.domain}</span>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-2.5 text-center">
                <span className="text-[9px] uppercase tracking-wider text-zinc-500 block">Source</span>
                <span className="text-sm font-medium text-white truncate">{alert.source}</span>
              </div>
            </div>

            {/* Location */}
            {alert.location && (
              <div className="flex items-center gap-2 mt-3 text-xs text-zinc-400">
                <MapPin className="w-3.5 h-3.5" />
                <span>{alert.location.label} ({alert.location.lat.toFixed(4)}, {alert.location.lng.toFixed(4)})</span>
              </div>
            )}

            {/* Related Entities */}
            {alert.entities.length > 0 && (
              <div className="mt-4">
                <h4 className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-2">Related Entities</h4>
                <div className="flex flex-wrap gap-1.5">
                  {alert.entities.map((entity) => (
                    <button
                      key={entity.id}
                      onClick={() => onNavigateEntity(entity.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/30 text-xs text-zinc-300 hover:text-white transition-colors group"
                    >
                      <span>{entity.name}</span>
                      <span className="text-[8px] text-zinc-500">({entity.type})</span>
                      <ChevronRight className="w-3 h-3 text-zinc-600 group-hover:text-cyan-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Contributing Signals */}
            {alert.signals.length > 0 && (
              <div className="mt-4">
                <h4 className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-2">Contributing Signals</h4>
                <div className="grid grid-cols-3 gap-1.5">
                  {alert.signals.slice(0, 6).map((signal, i) => (
                    <div key={i} className="flex items-center justify-between bg-zinc-800/40 rounded px-2 py-1">
                      <span className="text-[9px] text-zinc-400 truncate">{signal.type}</span>
                      <span className="text-[10px] font-mono text-white ml-1">{signal.value.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 pt-2 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-[10px] text-zinc-500">{new Date(alert.timestamp).toLocaleString()}</span>
                {countdown !== null && (
                  <span className="text-[10px] text-zinc-400 font-mono">Auto-dismiss in {countdown}s</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {alert.suggestedActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => onAction(alert.id, action.type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      action.type === 'investigate'
                        ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30'
                        : action.type === 'task'
                        ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border border-zinc-700'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}

                {alert.requiresAck && !acknowledged && (
                  <motion.button
                    onClick={handleAcknowledge}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold transition-colors border"
                    style={{ backgroundColor: `${config.color}20`, color: config.color, borderColor: `${config.color}50` }}
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    ACKNOWLEDGE
                  </motion.button>
                )}

                {acknowledged && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    ACKNOWLEDGED
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default AlertTakeover;
