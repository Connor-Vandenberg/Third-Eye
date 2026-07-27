'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi, WifiOff, Radio, Globe, Zap, Server, Users,
  ArrowUpDown, Clock, Shield, AlertTriangle, CheckCircle,
  Signal, Upload, Download, RefreshCw
} from 'lucide-react';

export type ConnectionMode = 'FULL' | 'DEGRADED' | 'MESH_ONLY' | 'OFFLINE';

interface PeerNode {
  id: string;
  name: string;
  latencyMs: number;
  lastSeen: string;
  syncStatus: 'synced' | 'syncing' | 'stale';
  role: 'primary' | 'relay' | 'edge';
}

interface SyncQueueItem {
  type: string;
  count: number;
  priority: 'high' | 'medium' | 'low';
  oldestAge: string;
}

export interface DDILState {
  mode: ConnectionMode;
  peers: PeerNode[];
  uplinkStatus: 'connected' | 'intermittent' | 'denied';
  meshProtocol: 'nostr' | 'p2p' | 'lorawan' | 'hf-radio';
  bandwidth: number;
  maxBandwidth: number;
  syncQueue: SyncQueueItem[];
  totalQueuedEvents: number;
  lastUplinkSync: string;
  encryptionStatus: 'active' | 'degraded' | 'none';
  nostrRelays: number;
  graphSyncPercent: number;
  localVertices: number;
  localEdges: number;
  capabilities: {
    graphQuery: boolean;
    convergenceScoring: boolean;
    prediction: boolean;
    llmChat: boolean;
    satelliteTasking: boolean;
    droneControl: boolean;
    meshBroadcast: boolean;
    localCollection: boolean;
  };
}

interface DDILIndicatorProps {
  state: DDILState;
  expanded?: boolean;
  onToggleExpand?: () => void;
  position?: 'top' | 'bottom';
  className?: string;
}

const MODE_CONFIG: Record<ConnectionMode, { label: string; color: string; bgColor: string; icon: any; description: string }> = {
  FULL: {
    label: 'FULL CONNECTIVITY',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    icon: Globe,
    description: 'All services operational. Cloud sync active.',
  },
  DEGRADED: {
    label: 'DEGRADED LINK',
    color: '#fbbf24',
    bgColor: 'rgba(251, 191, 36, 0.1)',
    icon: Signal,
    description: 'Intermittent uplink. Priority traffic only. Local cache active.',
  },
  MESH_ONLY: {
    label: 'MESH ONLY',
    color: '#f97316',
    bgColor: 'rgba(249, 115, 22, 0.1)',
    icon: Radio,
    description: 'No uplink. Peer mesh active. Local graph operations only.',
  },
  OFFLINE: {
    label: 'OFFLINE / AIR-GAP',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    icon: WifiOff,
    description: 'Fully disconnected. All operations local. Zarf deployment active.',
  },
};

function CapabilityBadge({ name, available }: { name: string; available: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium ${
      available
        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        : 'bg-zinc-800/50 text-zinc-600 border border-zinc-700/30 line-through'
    }`}>
      {available ? <CheckCircle className="w-2.5 h-2.5" /> : <AlertTriangle className="w-2.5 h-2.5" />}
      <span>{name}</span>
    </div>
  );
}

function PeerIndicator({ peer }: { peer: PeerNode }) {
  const latencyColor = peer.latencyMs < 50 ? '#10b981' : peer.latencyMs < 200 ? '#fbbf24' : '#ef4444';
  const syncColor = peer.syncStatus === 'synced' ? '#10b981' : peer.syncStatus === 'syncing' ? '#3b82f6' : '#ef4444';

  return (
    <div className="flex items-center gap-2 bg-zinc-800/40 rounded px-2 py-1.5">
      <div className="relative">
        <Server className="w-3.5 h-3.5 text-zinc-400" />
        <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: syncColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-zinc-300 truncate">{peer.name}</span>
          <span className="text-[8px] px-1 py-0.5 rounded bg-zinc-700/50 text-zinc-500 uppercase">{peer.role}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] font-mono" style={{ color: latencyColor }}>{peer.latencyMs}ms</span>
        {peer.syncStatus === 'syncing' && <RefreshCw className="w-2.5 h-2.5 text-blue-400 animate-spin" />}
      </div>
    </div>
  );
}

export function DDILIndicator({ state, expanded = false, onToggleExpand, position = 'top', className = '' }: DDILIndicatorProps) {
  const config = MODE_CONFIG[state.mode];
  const ModeIcon = config.icon;
  const [isExpanded, setIsExpanded] = useState(expanded);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    onToggleExpand?.();
  };

  return (
    <div className={`${className}`}>
      {/* Compact Banner */}
      <motion.button
        onClick={toggleExpand}
        className="w-full flex items-center justify-between px-4 py-2 border-b transition-colors"
        style={{ backgroundColor: config.bgColor, borderColor: `${config.color}30` }}
        whileHover={{ backgroundColor: `${config.color}15` }}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <ModeIcon className="w-4 h-4" style={{ color: config.color }} />
            {state.mode !== 'OFFLINE' && (
              <motion.div
                className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                style={{ backgroundColor: config.color }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </div>
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: config.color }}>
            {config.label}
          </span>
          {state.mode !== 'OFFLINE' && (
            <span className="text-[9px] text-zinc-500">
              {state.peers.length} peers • {state.bandwidth}/{state.maxBandwidth} Kbps
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {state.totalQueuedEvents > 0 && (
            <div className="flex items-center gap-1 bg-zinc-800/60 rounded px-2 py-0.5">
              <Upload className="w-3 h-3 text-zinc-400" />
              <span className="text-[9px] font-mono text-zinc-300">{state.totalQueuedEvents} queued</span>
            </div>
          )}
          {state.encryptionStatus === 'active' && (
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
          )}
          {state.graphSyncPercent < 100 && (
            <div className="flex items-center gap-1">
              <RefreshCw className="w-3 h-3 text-blue-400 animate-spin" />
              <span className="text-[9px] text-blue-400">{state.graphSyncPercent}%</span>
            </div>
          )}
        </div>
      </motion.button>

      {/* Expanded Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden border-b"
            style={{ borderColor: `${config.color}20`, backgroundColor: 'rgba(0,0,0,0.3)' }}
          >
            <div className="p-4 grid grid-cols-3 gap-4">
              {/* Column 1: Connection Status */}
              <div>
                <h4 className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-2">Network Status</h4>
                <p className="text-[10px] text-zinc-400 mb-3">{config.description}</p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-zinc-500">Protocol</span>
                    <span className="text-zinc-300 font-mono uppercase">{state.meshProtocol}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-zinc-500">Uplink</span>
                    <span className={state.uplinkStatus === 'connected' ? 'text-emerald-400' : state.uplinkStatus === 'intermittent' ? 'text-yellow-400' : 'text-red-400'}>
                      {state.uplinkStatus.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-zinc-500">Bandwidth</span>
                    <span className="text-zinc-300 font-mono">{state.bandwidth}/{state.maxBandwidth} Kbps</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-zinc-500">Nostr Relays</span>
                    <span className="text-zinc-300 font-mono">{state.nostrRelays}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-zinc-500">Last Uplink Sync</span>
                    <span className="text-zinc-300 font-mono">{state.lastUplinkSync}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-zinc-500">Local Graph</span>
                    <span className="text-zinc-300 font-mono">{state.localVertices.toLocaleString()}V / {state.localEdges.toLocaleString()}E</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-zinc-500">Encryption</span>
                    <span className={state.encryptionStatus === 'active' ? 'text-emerald-400' : 'text-red-400'}>
                      {state.encryptionStatus === 'active' ? 'AES-256-GCM' : state.encryptionStatus.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Column 2: Peers */}
              <div>
                <h4 className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-2">Mesh Peers ({state.peers.length})</h4>
                <div className="space-y-1.5 max-h-[180px] overflow-y-auto scrollbar-thin scrollbar-track-zinc-900 scrollbar-thumb-zinc-700">
                  {state.peers.map((peer) => (
                    <PeerIndicator key={peer.id} peer={peer} />
                  ))}
                  {state.peers.length === 0 && (
                    <div className="text-[10px] text-zinc-600 italic py-4 text-center">No peers discovered</div>
                  )}
                </div>
              </div>

              {/* Column 3: Capabilities & Sync Queue */}
              <div>
                <h4 className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-2">Capabilities</h4>
                <div className="grid grid-cols-2 gap-1 mb-3">
                  <CapabilityBadge name="Graph Query" available={state.capabilities.graphQuery} />
                  <CapabilityBadge name="Convergence" available={state.capabilities.convergenceScoring} />
                  <CapabilityBadge name="Prediction" available={state.capabilities.prediction} />
                  <CapabilityBadge name="LLM Chat" available={state.capabilities.llmChat} />
                  <CapabilityBadge name="Sat Tasking" available={state.capabilities.satelliteTasking} />
                  <CapabilityBadge name="Drone Ctrl" available={state.capabilities.droneControl} />
                  <CapabilityBadge name="Mesh Bcast" available={state.capabilities.meshBroadcast} />
                  <CapabilityBadge name="Collection" available={state.capabilities.localCollection} />
                </div>

                {state.syncQueue.length > 0 && (
                  <>
                    <h4 className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-2 mt-3">Sync Queue</h4>
                    <div className="space-y-1">
                      {state.syncQueue.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-[10px] bg-zinc-800/40 rounded px-2 py-1">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              item.priority === 'high' ? 'bg-red-400' : item.priority === 'medium' ? 'bg-yellow-400' : 'bg-zinc-500'
                            }`} />
                            <span className="text-zinc-300">{item.type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-zinc-400">{item.count}</span>
                            <span className="text-zinc-600">{item.oldestAge}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DDILIndicator;
