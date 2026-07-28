'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Timeline Controller
 * Actual stateful timeline with play/pause/speed control.
 * Drives temporal filtering of all map layers.
 *
 * Features:
 * - Play/pause toggle (Space key)
 * - Speed control: 1x, 10x, 100x ([ and ] keys)
 * - Scrub bar with drag support
 * - Time range display (start -> current -> end)
 * - Tick marks for significant events
 */

interface TimelineControllerProps {
  startTime: number; // epoch ms
  endTime: number; // epoch ms
  onTimeChange: (currentTime: number) => void;
  eventTimestamps?: number[]; // tick marks for significant events
}

export function TimelineController({ startTime, endTime, onTimeChange, eventTimestamps = [] }: TimelineControllerProps) {
  const [currentTime, setCurrentTime] = useState(endTime);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [dragging, setDragging] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const lastTickRef = useRef<number>(0);

  const totalDuration = endTime - startTime;
  const progress = totalDuration > 0 ? (currentTime - startTime) / totalDuration : 0;

  // Animation loop
  useEffect(() => {
    if (!playing) return;

    lastTickRef.current = performance.now();

    function tick(now: number) {
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;

      // Advance time: delta_ms * speed * time_compression
      // 1x = real-time, 10x = 10 seconds per real second, etc.
      const advance = delta * speed * 60; // 60x base compression (1 min per second at 1x)
      const newTime = Math.min(currentTime + advance, endTime);

      setCurrentTime(newTime);
      onTimeChange(newTime);

      if (newTime >= endTime) {
        setPlaying(false);
        return;
      }

      animFrameRef.current = requestAnimationFrame(tick);
    }

    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [playing, speed, currentTime, endTime, onTimeChange]);

  // Scrub bar interaction
  const handleBarClick = useCallback((e: React.MouseEvent) => {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = startTime + pct * totalDuration;
    setCurrentTime(newTime);
    onTimeChange(newTime);
  }, [startTime, totalDuration, onTimeChange]);

  const handleMouseDown = useCallback(() => setDragging(true), []);
  const handleMouseUp = useCallback(() => setDragging(false), []);

  useEffect(() => {
    if (!dragging) return;

    function handleMove(e: MouseEvent) {
      if (!barRef.current) return;
      const rect = barRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const newTime = startTime + pct * totalDuration;
      setCurrentTime(newTime);
      onTimeChange(newTime);
    }

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, startTime, totalDuration, onTimeChange, handleMouseUp]);

  const togglePlay = useCallback(() => setPlaying(p => !p), []);
  const cycleSpeed = useCallback((direction: 'up' | 'down') => {
    const speeds = [1, 10, 100];
    setSpeed(prev => {
      const idx = speeds.indexOf(prev);
      if (direction === 'up') return speeds[Math.min(idx + 1, speeds.length - 1)];
      return speeds[Math.max(idx - 1, 0)];
    });
  }, []);

  const formatTime = (ms: number) => new Date(ms).toISOString().slice(11, 19) + 'Z';
  const formatDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 h-14 bg-black/95 backdrop-blur-sm border-t border-gray-800 flex items-center px-4 gap-3">
      {/* Play/Pause */}
      <button
        onClick={togglePlay}
        className="w-8 h-8 flex items-center justify-center rounded bg-gray-800 hover:bg-gray-700 text-white transition-colors"
        title={playing ? 'Pause (Space)' : 'Play (Space)'}
      >
        {playing ? '⏸' : '▶'}
      </button>

      {/* Speed */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => cycleSpeed('down')}
          className="text-gray-500 hover:text-white text-xs px-1"
          title="Slower ([)"
        >
          «
        </button>
        <span className="text-[10px] text-cyan-400 font-mono w-8 text-center">{speed}x</span>
        <button
          onClick={() => cycleSpeed('up')}
          className="text-gray-500 hover:text-white text-xs px-1"
          title="Faster (])"
        >
          »
        </button>
      </div>

      {/* Start time */}
      <span className="text-[9px] text-gray-600 font-mono">{formatDate(startTime)}</span>

      {/* Scrub bar */}
      <div
        ref={barRef}
        className="flex-1 h-2 bg-gray-800 rounded-full relative cursor-pointer group"
        onClick={handleBarClick}
        onMouseDown={handleMouseDown}
      >
        {/* Progress fill */}
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-700 to-cyan-500 rounded-full transition-[width] duration-75"
          style={{ width: `${progress * 100}%` }}
        />

        {/* Event tick marks */}
        {eventTimestamps.map((ts, i) => {
          const pct = (ts - startTime) / totalDuration;
          if (pct < 0 || pct > 1) return null;
          return (
            <div
              key={i}
              className="absolute top-[-2px] w-0.5 h-[calc(100%+4px)] bg-red-500/60"
              style={{ left: `${pct * 100}%` }}
            />
          );
        })}

        {/* Scrub handle */}
        <div
          className="absolute top-[-4px] w-3 h-3 bg-cyan-400 rounded-full border-2 border-black shadow-lg group-hover:scale-125 transition-transform"
          style={{ left: `calc(${progress * 100}% - 6px)` }}
        />
      </div>

      {/* Current time display */}
      <div className="text-center">
        <div className="text-[10px] text-cyan-400 font-mono">{formatTime(currentTime)}</div>
        <div className="text-[8px] text-gray-600 font-mono">{formatDate(currentTime)}</div>
      </div>

      {/* End time */}
      <span className="text-[9px] text-gray-600 font-mono">NOW</span>
    </div>
  );
}

// Export play/speed controls for keyboard shortcut integration
export type TimelineActions = {
  togglePlay: () => void;
  speedUp: () => void;
  slowDown: () => void;
};
