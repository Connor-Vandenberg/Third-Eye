'use client';

import { useEffect, useState } from 'react';

/**
 * Tactical HUD Overlay
 * Top bar showing system status, UTC time, active collectors, signal rate.
 * Styled for dark ops center displays (no white backgrounds).
 */

interface TacticalHUDProps {
  connected: boolean;
  signalsPerMinute: number;
  activeCollectors?: number;
  lastUpdate: string | null;
}

export function TacticalHUD({ connected, signalsPerMinute, activeCollectors = 330, lastUpdate }: TacticalHUDProps) {
  const [utcTime, setUtcTime] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setUtcTime(new Date().toISOString().slice(11, 19) + 'Z');
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-40 h-12 bg-black/90 backdrop-blur-sm border-b border-gray-800 flex items-center px-4 gap-6">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <span className="text-cyan-400 font-bold text-sm tracking-wider">GZM</span>
        <span className="text-[9px] text-gray-600 uppercase">Gray Zone Monitor</span>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-800" />

      {/* UTC Time */}
      <div className="flex items-center gap-1">
        <span className="text-[9px] text-gray-500 uppercase">UTC</span>
        <span className="text-xs text-white font-mono tabular-nums">{utcTime}</span>
      </div>

      {/* Connection Status */}
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`} />
        <span className={`text-[10px] ${connected ? 'text-green-400' : 'text-red-400'}`}>
          {connected ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>

      {/* Signal Rate */}
      <div className="flex items-center gap-1">
        <span className="text-[9px] text-gray-500">SIG/MIN</span>
        <span className="text-xs text-cyan-400 font-mono tabular-nums">{signalsPerMinute}</span>
      </div>

      {/* Active Collectors */}
      <div className="flex items-center gap-1">
        <span className="text-[9px] text-gray-500">COLLECTORS</span>
        <span className="text-xs text-purple-400 font-mono tabular-nums">{activeCollectors}</span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Last Update */}
      {lastUpdate && (
        <div className="text-[9px] text-gray-600 font-mono">
          LAST: {new Date(lastUpdate).toISOString().slice(11, 19)}Z
        </div>
      )}

      {/* DARPA Badge */}
      <div className="flex items-center gap-1 px-2 py-0.5 rounded border border-gray-800">
        <span className="text-[8px] text-gray-500 uppercase">DARPA SBIR</span>
        <span className="text-[8px] text-amber-500 font-mono">DPA26BZ04</span>
      </div>
    </div>
  );
}
