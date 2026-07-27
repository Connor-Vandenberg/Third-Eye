'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, SkipBack, SkipForward, FastForward, Rewind,
  Calendar, Clock, ChevronLeft, ChevronRight, Maximize2,
  Minimize2, Layers, Eye, Filter, Download, RotateCcw
} from 'lucide-react';

export interface TemporalEvent {
  id: string;
  timestamp: string;
  type: string;
  label: string;
  lat?: number;
  lng?: number;
  severity?: number;
  domain?: string;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface TemporalPlaybackProps {
  events: TemporalEvent[];
  timeRange: TimeRange;
  currentTime: Date;
  onTimeChange: (time: Date) => void;
  onRangeChange: (range: TimeRange) => void;
  onPlay: () => void;
  onPause: () => void;
  onSpeedChange: (speed: number) => void;
  isPlaying: boolean;
  speed: number;
  showDensity?: boolean;
  showEventMarkers?: boolean;
  height?: number;
  className?: string;
}

const SPEED_OPTIONS = [0.25, 0.5, 1, 2, 4, 8, 16, 32];

const PRESET_RANGES = [
  { label: '1H', hours: 1 },
  { label: '6H', hours: 6 },
  { label: '24H', hours: 24 },
  { label: '3D', hours: 72 },
  { label: '7D', hours: 168 },
  { label: '30D', hours: 720 },
  { label: '90D', hours: 2160 },
];

function DensityHistogram({ events, timeRange, width, height, currentTime }: {
  events: TemporalEvent[];
  timeRange: TimeRange;
  width: number;
  height: number;
  currentTime: Date;
}) {
  const bucketCount = Math.min(100, Math.max(20, Math.floor(width / 8)));
  const rangeMs = timeRange.end.getTime() - timeRange.start.getTime();
  const bucketMs = rangeMs / bucketCount;

  const buckets = Array(bucketCount).fill(0);
  const severityBuckets = Array(bucketCount).fill(0);

  events.forEach(event => {
    const eventTime = new Date(event.timestamp).getTime();
    const bucketIndex = Math.floor((eventTime - timeRange.start.getTime()) / bucketMs);
    if (bucketIndex >= 0 && bucketIndex < bucketCount) {
      buckets[bucketIndex]++;
      severityBuckets[bucketIndex] = Math.max(severityBuckets[bucketIndex], event.severity || 0.5);
    }
  });

  const maxCount = Math.max(...buckets, 1);
  const barWidth = width / bucketCount;
  const currentPos = ((currentTime.getTime() - timeRange.start.getTime()) / rangeMs) * width;

  return (
    <svg width={width} height={height} className="overflow-visible">
      {/* Density bars */}
      {buckets.map((count, i) => {
        const barHeight = (count / maxCount) * (height - 4);
        const severity = severityBuckets[i];
        const color = severity >= 0.8 ? '#ef4444' : severity >= 0.6 ? '#f59e0b' : severity >= 0.4 ? '#3b82f6' : '#6b7280';
        const opacity = count > 0 ? 0.3 + (count / maxCount) * 0.7 : 0.05;

        return (
          <rect
            key={i}
            x={i * barWidth + 0.5}
            y={height - barHeight - 2}
            width={Math.max(barWidth - 1, 1)}
            height={barHeight}
            fill={color}
            opacity={opacity}
            rx="1"
          />
        );
      })}

      {/* Current time indicator */}
      <line x1={currentPos} y1={0} x2={currentPos} y2={height} stroke="#ffffff" strokeWidth="1.5" opacity="0.9" />
      <circle cx={currentPos} cy={2} r="3" fill="#ffffff" />
    </svg>
  );
}

function EventMarkers({ events, timeRange, width, height }: {
  events: TemporalEvent[];
  timeRange: TimeRange;
  width: number;
  height: number;
}) {
  const rangeMs = timeRange.end.getTime() - timeRange.start.getTime();
  const DOMAIN_COLORS: Record<string, string> = {
    OSINT: '#3b82f6', SIGINT: '#8b5cf6', GEOINT: '#10b981', CYBER: '#ef4444',
    FININT: '#06b6d4', HUMINT: '#f59e0b', MASINT: '#ec4899', INFOPS: '#f97316',
  };

  return (
    <svg width={width} height={height} className="overflow-visible">
      {events.slice(0, 200).map((event) => {
        const x = ((new Date(event.timestamp).getTime() - timeRange.start.getTime()) / rangeMs) * width;
        if (x < 0 || x > width) return null;
        const color = DOMAIN_COLORS[event.domain || 'OSINT'] || '#6b7280';
        return (
          <g key={event.id}>
            <line x1={x} y1={0} x2={x} y2={height} stroke={color} strokeWidth="1" opacity="0.4" />
            <circle cx={x} cy={height / 2} r="2" fill={color} opacity="0.8" />
          </g>
        );
      })}
    </svg>
  );
}

export function TemporalPlayback({
  events,
  timeRange,
  currentTime,
  onTimeChange,
  onRangeChange,
  onPlay,
  onPause,
  onSpeedChange,
  isPlaying,
  speed,
  showDensity = true,
  showEventMarkers = true,
  height = 80,
  className = '',
}: TemporalPlaybackProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [hoverTime, setHoverTime] = useState<Date | null>(null);
  const [hoverX, setHoverX] = useState(0);

  const rangeMs = timeRange.end.getTime() - timeRange.start.getTime();
  const progress = ((currentTime.getTime() - timeRange.start.getTime()) / rangeMs) * 100;

  const handleTrackClick = useCallback((e: React.MouseEvent) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const newTime = new Date(timeRange.start.getTime() + x * rangeMs);
    onTimeChange(newTime);
  }, [timeRange, rangeMs, onTimeChange]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    setHoverX(e.clientX - rect.left);
    setHoverTime(new Date(timeRange.start.getTime() + x * rangeMs));

    if (isDragging) {
      const newTime = new Date(timeRange.start.getTime() + x * rangeMs);
      onTimeChange(newTime);
    }
  }, [timeRange, rangeMs, isDragging, onTimeChange]);

  const stepForward = useCallback(() => {
    const stepMs = rangeMs * 0.01;
    onTimeChange(new Date(Math.min(currentTime.getTime() + stepMs, timeRange.end.getTime())));
  }, [currentTime, rangeMs, timeRange, onTimeChange]);

  const stepBackward = useCallback(() => {
    const stepMs = rangeMs * 0.01;
    onTimeChange(new Date(Math.max(currentTime.getTime() - stepMs, timeRange.start.getTime())));
  }, [currentTime, rangeMs, timeRange, onTimeChange]);

  const setPresetRange = useCallback((hours: number) => {
    const end = new Date();
    const start = new Date(end.getTime() - hours * 3600000);
    onRangeChange({ start, end });
  }, [onRangeChange]);

  const formatTime = (date: Date) => {
    if (rangeMs < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    if (rangeMs < 604800000) return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case ' ': e.preventDefault(); isPlaying ? onPause() : onPlay(); break;
        case 'ArrowRight': e.preventDefault(); stepForward(); break;
        case 'ArrowLeft': e.preventDefault(); stepBackward(); break;
        case ']': e.preventDefault(); onSpeedChange(Math.min(speed * 2, 32)); break;
        case '[': e.preventDefault(); onSpeedChange(Math.max(speed / 2, 0.25)); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isPlaying, speed, onPlay, onPause, onSpeedChange, stepForward, stepBackward]);

  return (
    <div className={`bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-800 ${className}`}>
      {/* Expanded density view */}
      {isExpanded && showDensity && (
        <div className="px-4 pt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] text-zinc-500 uppercase tracking-wider">Event Density</span>
            <span className="text-[9px] text-zinc-500">{events.length.toLocaleString()} events in range</span>
          </div>
          <div className="h-12 bg-zinc-800/30 rounded-lg overflow-hidden">
            {trackRef.current && (
              <DensityHistogram events={events} timeRange={timeRange} width={trackRef.current.clientWidth || 800} height={48} currentTime={currentTime} />
            )}
          </div>
        </div>
      )}

      {/* Main playback bar */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-3">
          {/* Transport Controls */}
          <div className="flex items-center gap-0.5">
            <button onClick={() => onTimeChange(timeRange.start)} className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors" title="Go to start">
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button onClick={stepBackward} className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors" title="Step back (Left arrow)">
              <Rewind className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={isPlaying ? onPause : onPlay}
              className={`p-2 rounded-lg border transition-colors ${
                isPlaying ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400' : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white'
              }`}
              title="Play/Pause (Space)"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button onClick={stepForward} className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors" title="Step forward (Right arrow)">
              <FastForward className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onTimeChange(timeRange.end)} className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors" title="Go to end">
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Speed Control */}
          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-zinc-300 hover:text-white transition-colors min-w-[42px] text-center"
              title="Speed ([ / ] to change)"
            >
              {speed}x
            </button>
            <AnimatePresence>
              {showSpeedMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-0 mb-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-1 z-50"
                >
                  {SPEED_OPTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => { onSpeedChange(s); setShowSpeedMenu(false); }}
                      className={`block w-full px-3 py-1 text-[10px] rounded text-left transition-colors ${
                        speed === s ? 'bg-cyan-500/20 text-cyan-400' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Current Time Display */}
          <div className="text-xs font-mono text-white bg-zinc-800/50 px-2.5 py-1 rounded border border-zinc-700/50 min-w-[160px] text-center">
            {formatTime(currentTime)}
          </div>

          {/* Timeline Track */}
          <div
            ref={trackRef}
            className="flex-1 relative cursor-crosshair group"
            style={{ height: `${height - 40}px` }}
            onClick={handleTrackClick}
            onMouseMove={handleMouseMove}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => { setIsDragging(false); setHoverTime(null); }}
          >
            {/* Track background */}
            <div className="absolute inset-0 bg-zinc-800/50 rounded-lg overflow-hidden">
              {/* Event markers */}
              {showEventMarkers && trackRef.current && (
                <EventMarkers events={events} timeRange={timeRange} width={trackRef.current.clientWidth} height={height - 40} />
              )}

              {/* Progress fill */}
              <motion.div
                className="absolute top-0 left-0 bottom-0 bg-cyan-500/10 border-r-2 border-cyan-400"
                style={{ width: `${progress}%` }}
                transition={{ duration: isDragging ? 0 : 0.1 }}
              />
            </div>

            {/* Hover tooltip */}
            {hoverTime && (
              <div
                className="absolute bottom-full mb-2 transform -translate-x-1/2 pointer-events-none z-50"
                style={{ left: hoverX }}
              >
                <div className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 shadow-lg">
                  <span className="text-[9px] font-mono text-white whitespace-nowrap">{formatTime(hoverTime)}</span>
                </div>
              </div>
            )}

            {/* Playhead */}
            <motion.div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10"
              style={{ left: `${progress}%` }}
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-md" />
            </motion.div>
          </div>

          {/* Range Presets */}
          <div className="flex items-center gap-0.5">
            {PRESET_RANGES.map((preset) => (
              <button
                key={preset.label}
                onClick={() => setPresetRange(preset.hours)}
                className="px-1.5 py-1 text-[9px] font-medium rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Expand */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Time range labels */}
        <div className="flex items-center justify-between mt-1 px-[140px] text-[8px] text-zinc-600 font-mono">
          <span>{formatTime(timeRange.start)}</span>
          <span>{formatTime(timeRange.end)}</span>
        </div>
      </div>
    </div>
  );
}

export default TemporalPlayback;
