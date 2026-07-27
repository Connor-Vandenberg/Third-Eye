'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio, Wifi, WifiOff, Globe, Server, Shield, Zap,
  ArrowUpDown, Clock, RefreshCw, Upload, Download,
  Network, Activity, AlertTriangle, CheckCircle, Lock,
  Eye, Database, Brain, Crosshair, Satellite, Signal,
  ChevronRight, Settings, Maximize2
} from 'lucide-react';
import { DDILIndicator, type DDILState, type ConnectionMode } from '@/components/ddil-indicator';

// Mock mesh topology data
const MOCK_DDIL_STATE: DDILState = {
  mode: 'MESH_ONLY' as ConnectionMode,
  peers: [
    { id: 'node-alpha', name: 'ALPHA (Primary)', latencyMs: 12, lastSeen: '2s ago', syncStatus: 'synced', role: 'primary' },
    { id: 'node-bravo', name: 'BRAVO (Relay)', latencyMs: 45, lastSeen: '5s ago', syncStatus: 'synced', role: 'relay' },
    { id: 'node-charlie', name: 'CHARLIE (Edge)', latencyMs: 180, lastSeen: '12s ago', syncStatus: 'syncing', role: 'edge' },
  ],
  uplinkStatus: 'denied',
  meshProtocol: 'nostr',
  bandwidth: 128,
  maxBandwidth: 512,
  syncQueue: [
    { type: 'Novel Signals', count: 12, priority: 'high', oldestAge: '3m' },
    { type: 'Entity Updates', count: 847, priority: 'medium', oldestAge: '8m' },
    { type: 'Telemetry', count: 2340, priority: 'low', oldestAge: '15m' },
    { type: 'Model Weights', count: 3, priority: 'medium', oldestAge: '1h' },
  ],
  totalQueuedEvents: 3202,
  lastUplinkSync: '47m ago',
  encryptionStatus: 'active',
  nostrRelays: 3,
  graphSyncPercent: 78,
  localVertices: 2847293,
  localEdges: 891204,
  capabilities: {
    graphQuery: true,
    convergenceScoring: true,
    prediction: true,
    llmChat: false,
    satelliteTasking: false,
    droneControl: true,
    meshBroadcast: true,
    localCollection: true,
  },
};

interface MeshNode {
  id: string;
  name: string;
  type: 'gateway' | 'relay' | 'edge' | 'sensor';
  status: 'online' | 'degraded' | 'offline';
  lat: number;
  lng: number;
  hardware: string;
  collectors: number;
  vertices: number;
  lastHeartbeat: string;
  bandwidth: number;
  batteryPercent?: number;
  temperature?: number;
  connections: string[];
  role: string;
}

interface MeshLink {
  source: string;
  target: string;
  protocol: 'nostr' | 'lorawan' | 'wifi-mesh' | 'hf-radio' | 'satellite';
  latency: number;
  bandwidth: number;
  encrypted: boolean;
  status: 'active' | 'degraded' | 'down';
}

const MESH_NODES: MeshNode[] = [
  {
    id: 'gw-01', name: 'GATEWAY-01', type: 'gateway', status: 'online',
    lat: 38.9, lng: -77.0, hardware: 'Jetson AGX Orin 64GB', collectors: 206,
    vertices: 14923847, lastHeartbeat: '1s', bandwidth: 1000, connections: ['relay-01', 'relay-02'],
    role: 'Primary Gateway (Cloud Uplink)'
  },
  {
    id: 'relay-01', name: 'RELAY-ALPHA', type: 'relay', status: 'online',
    lat: 39.1, lng: -76.8, hardware: 'Jetson Orin NX 16GB', collectors: 45,
    vertices: 2847293, lastHeartbeat: '3s', bandwidth: 512, connections: ['gw-01', 'edge-01', 'edge-02'],
    role: 'Mesh Relay (Nostr)'
  },
  {
    id: 'relay-02', name: 'RELAY-BRAVO', type: 'relay', status: 'degraded',
    lat: 38.7, lng: -77.2, hardware: 'Jetson Orin NX 8GB', collectors: 32,
    vertices: 1204857, lastHeartbeat: '8s', bandwidth: 256, batteryPercent: 34, temperature: 72,
    connections: ['gw-01', 'edge-03', 'sensor-01'],
    role: 'Mesh Relay (LoRaWAN backup)'
  },
  {
    id: 'edge-01', name: 'EDGE-SIGINT', type: 'edge', status: 'online',
    lat: 39.3, lng: -76.6, hardware: 'Jetson Orin Nano Super', collectors: 8,
    vertices: 45032, lastHeartbeat: '2s', bandwidth: 128, batteryPercent: 87,
    connections: ['relay-01'],
    role: 'SIGINT Collection (SDR + ADS-B)'
  },
  {
    id: 'edge-02', name: 'EDGE-MARITIME', type: 'edge', status: 'online',
    lat: 38.8, lng: -76.4, hardware: 'Jetson Orin Nano Super', collectors: 6,
    vertices: 28947, lastHeartbeat: '4s', bandwidth: 128, batteryPercent: 92,
    connections: ['relay-01'],
    role: 'Maritime Collection (AIS + RF)'
  },
  {
    id: 'edge-03', name: 'EDGE-GEOINT', type: 'edge', status: 'online',
    lat: 38.5, lng: -77.3, hardware: 'Jetson Orin Nano Super', collectors: 3,
    vertices: 12405, lastHeartbeat: '6s', bandwidth: 64, batteryPercent: 65, temperature: 68,
    connections: ['relay-02'],
    role: 'GEOINT (Sentinel-2 processing)'
  },
  {
    id: 'sensor-01', name: 'SENSOR-RF', type: 'sensor', status: 'online',
    lat: 38.6, lng: -77.1, hardware: 'ESP32-S3 + RTL-SDR', collectors: 2,
    vertices: 0, lastHeartbeat: '1s', bandwidth: 9.6, batteryPercent: 78,
    connections: ['relay-02'],
    role: 'RF Sensor (WiFi Probe + BLE)'
  },
];

const MESH_LINKS: MeshLink[] = [
  { source: 'gw-01', target: 'relay-01', protocol: 'nostr', latency: 12, bandwidth: 512, encrypted: true, status: 'active' },
  { source: 'gw-01', target: 'relay-02', protocol: 'nostr', latency: 23, bandwidth: 256, encrypted: true, status: 'degraded' },
  { source: 'relay-01', target: 'edge-01', protocol: 'wifi-mesh', latency: 5, bandwidth: 300, encrypted: true, status: 'active' },
  { source: 'relay-01', target: 'edge-02', protocol: 'wifi-mesh', latency: 8, bandwidth: 200, encrypted: true, status: 'active' },
  { source: 'relay-02', target: 'edge-03', protocol: 'lorawan', latency: 45, bandwidth: 50, encrypted: true, status: 'active' },
  { source: 'relay-02', target: 'sensor-01', protocol: 'lorawan', latency: 30, bandwidth: 9.6, encrypted: true, status: 'active' },
];

const NOSTR_EVENTS = [
  { kind: 30078, content: 'Novel Signal: Vector drift detected (SCS)', relay: 'wss://relay.gzm.local', timestamp: '2s ago' },
  { kind: 30079, content: 'Entity update batch (847 vertices)', relay: 'wss://relay.gzm.local', timestamp: '5s ago' },
  { kind: 30080, content: 'Convergence event: 4-source agreement (Baltic)', relay: 'wss://relay.gzm.local', timestamp: '12s ago' },
  { kind: 30081, content: 'CBBA task allocation: drone-02 -> AOI Crimea', relay: 'wss://relay.gzm.local', timestamp: '18s ago' },
  { kind: 30082, content: 'Self-play cycle #847 complete (reward: 0.73)', relay: 'wss://relay.gzm.local', timestamp: '25s ago' },
  { kind: 30083, content: 'Heartbeat: all nodes reporting healthy', relay: 'wss://relay.gzm.local', timestamp: '30s ago' },
  { kind: 30084, content: 'Model weight sync: tabicl_v2.3 (3.2MB)', relay: 'wss://relay.gzm.local', timestamp: '1m ago' },
  { kind: 30085, content: 'Graph partition sync: 78% complete', relay: 'wss://relay.gzm.local', timestamp: '2m ago' },
];

const NODE_TYPE_COLORS: Record<string, string> = {
  gateway: '#10b981',
  relay: '#3b82f6',
  edge: '#f59e0b',
  sensor: '#8b5cf6',
};

function NodeCard({ node }: { node: MeshNode }) {
  const typeColor = NODE_TYPE_COLORS[node.type];
  const statusColor = node.status === 'online' ? '#10b981' : node.status === 'degraded' ? '#fbbf24' : '#ef4444';

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Server className="w-5 h-5" style={{ color: typeColor }} />
            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-zinc-900" style={{ backgroundColor: statusColor }} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white">{node.name}</h3>
            <span className="text-[9px] uppercase tracking-wider" style={{ color: typeColor }}>{node.type}</span>
          </div>
        </div>
        <span className="text-[9px] font-mono text-zinc-500">{node.lastHeartbeat}</span>
      </div>

      <p className="text-[10px] text-zinc-500 mt-2">{node.role}</p>

      <div className="grid grid-cols-2 gap-2 mt-3">
        <div className="text-[10px]">
          <span className="text-zinc-500">Hardware</span>
          <span className="block text-zinc-300 truncate">{node.hardware}</span>
        </div>
        <div className="text-[10px]">
          <span className="text-zinc-500">Collectors</span>
          <span className="block text-zinc-300">{node.collectors} active</span>
        </div>
        <div className="text-[10px]">
          <span className="text-zinc-500">Local Graph</span>
          <span className="block text-zinc-300">{node.vertices > 1000000 ? `${(node.vertices / 1000000).toFixed(1)}M` : `${(node.vertices / 1000).toFixed(1)}K`}</span>
        </div>
        <div className="text-[10px]">
          <span className="text-zinc-500">Bandwidth</span>
          <span className="block text-zinc-300">{node.bandwidth} Kbps</span>
        </div>
      </div>

      {/* Battery + Temperature */}
      {(node.batteryPercent !== undefined || node.temperature !== undefined) && (
        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-zinc-800">
          {node.batteryPercent !== undefined && (
            <div className="flex items-center gap-1">
              <div className={`w-4 h-2 rounded-sm border ${node.batteryPercent > 50 ? 'border-emerald-500' : node.batteryPercent > 20 ? 'border-yellow-500' : 'border-red-500'}`}>
                <div className="h-full rounded-sm" style={{ width: `${node.batteryPercent}%`, backgroundColor: node.batteryPercent > 50 ? '#10b981' : node.batteryPercent > 20 ? '#fbbf24' : '#ef4444' }} />
              </div>
              <span className="text-[9px] text-zinc-500">{node.batteryPercent}%</span>
            </div>
          )}
          {node.temperature !== undefined && (
            <span className={`text-[9px] ${node.temperature > 70 ? 'text-yellow-400' : 'text-zinc-500'}`}>
              {node.temperature}°C
            </span>
          )}
        </div>
      )}

      {/* Connections */}
      <div className="mt-2 pt-2 border-t border-zinc-800">
        <span className="text-[9px] text-zinc-500">Connected to: </span>
        <span className="text-[9px] text-zinc-400">{node.connections.join(', ')}</span>
      </div>
    </div>
  );
}

function TopologyVisualization({ nodes, links }: { nodes: MeshNode[]; links: MeshLink[] }) {
  // Simple force-directed layout (positions hardcoded for demo)
  const positions: Record<string, { x: number; y: number }> = {
    'gw-01': { x: 50, y: 15 },
    'relay-01': { x: 30, y: 40 },
    'relay-02': { x: 70, y: 40 },
    'edge-01': { x: 15, y: 65 },
    'edge-02': { x: 40, y: 65 },
    'edge-03': { x: 60, y: 65 },
    'sensor-01': { x: 80, y: 65 },
  };

  return (
    <div className="relative w-full h-64 bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden">
      <svg className="absolute inset-0 w-full h-full">
        {/* Links */}
        {links.map((link) => {
          const src = positions[link.source];
          const tgt = positions[link.target];
          if (!src || !tgt) return null;
          const linkColor = link.status === 'active' ? '#3b82f6' : link.status === 'degraded' ? '#fbbf24' : '#ef4444';
          return (
            <g key={`${link.source}-${link.target}`}>
              <motion.line
                x1={`${src.x}%`} y1={`${src.y}%`}
                x2={`${tgt.x}%`} y2={`${tgt.y}%`}
                stroke={linkColor}
                strokeWidth="2"
                strokeDasharray={link.status === 'degraded' ? '5,5' : 'none'}
                opacity="0.6"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1 }}
              />
              {/* Data flow animation */}
              <circle r="3" fill={linkColor} opacity="0.8">
                <animateMotion
                  dur={`${3 + link.latency / 20}s`}
                  repeatCount="indefinite"
                  path={`M ${src.x * 4},${src.y * 2.56} L ${tgt.x * 4},${tgt.y * 2.56}`}
                />
              </circle>
              {/* Protocol label */}
              <text
                x={`${(src.x + tgt.x) / 2}%`}
                y={`${(src.y + tgt.y) / 2 - 2}%`}
                textAnchor="middle"
                fill="#71717a"
                fontSize="8"
              >
                {link.protocol} ({link.latency}ms)
              </text>
            </g>
          );
        })}
      </svg>

      {/* Nodes */}
      {nodes.map((node) => {
        const pos = positions[node.id];
        if (!pos) return null;
        const typeColor = NODE_TYPE_COLORS[node.type];
        const statusColor = node.status === 'online' ? '#10b981' : node.status === 'degraded' ? '#fbbf24' : '#ef4444';

        return (
          <div
            key={node.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          >
            <motion.div
              className="relative w-10 h-10 rounded-xl border-2 flex items-center justify-center cursor-pointer"
              style={{ borderColor: typeColor, backgroundColor: `${typeColor}15` }}
              whileHover={{ scale: 1.2 }}
            >
              <Server className="w-4 h-4" style={{ color: typeColor }} />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-zinc-950" style={{ backgroundColor: statusColor }} />
            </motion.div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap">
              <span className="text-[8px] text-zinc-400 font-medium">{node.name}</span>
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="absolute bottom-2 right-2 bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-lg px-2 py-1.5">
        <div className="flex items-center gap-3">
          {Object.entries(NODE_TYPE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
              <span className="text-[8px] text-zinc-500 uppercase">{type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MeshPage() {
  const [ddilState, setDdilState] = useState<DDILState>(MOCK_DDIL_STATE);
  const [selectedNode, setSelectedNode] = useState<MeshNode | null>(null);
  const [showEventLog, setShowEventLog] = useState(true);

  // Simulate mode cycling for demo
  const cycleMode = () => {
    const modes: ConnectionMode[] = ['FULL', 'DEGRADED', 'MESH_ONLY', 'OFFLINE'];
    const currentIndex = modes.indexOf(ddilState.mode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setDdilState(prev => ({
      ...prev,
      mode: nextMode,
      capabilities: {
        ...prev.capabilities,
        llmChat: nextMode === 'FULL',
        satelliteTasking: nextMode === 'FULL' || nextMode === 'DEGRADED',
        droneControl: nextMode !== 'OFFLINE',
      },
    }));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* DDIL Banner */}
      <DDILIndicator state={ddilState} expanded={false} />

      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 flex items-center justify-center">
              <Network className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Mesh Network & DDIL Operations</h1>
              <p className="text-xs text-zinc-500">Peer topology, sync status, protocol routing, and degraded-mode operations</p>
            </div>
          </div>
          <button
            onClick={cycleMode}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            Simulate Mode Change
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Topology Visualization */}
        <section>
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-medium mb-3 flex items-center gap-2">
            <Network className="w-3.5 h-3.5" /> Mesh Topology
          </h2>
          <TopologyVisualization nodes={MESH_NODES} links={MESH_LINKS} />
        </section>

        {/* Two columns: Nodes + Event Log */}
        <div className="grid grid-cols-3 gap-6">
          {/* Node Grid */}
          <div className="col-span-2">
            <h2 className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-medium mb-3 flex items-center gap-2">
              <Server className="w-3.5 h-3.5" /> Mesh Nodes ({MESH_NODES.length})
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {MESH_NODES.map((node) => (
                <NodeCard key={node.id} node={node} />
              ))}
            </div>
          </div>

          {/* Nostr Event Log */}
          <div>
            <h2 className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-medium mb-3 flex items-center gap-2">
              <Radio className="w-3.5 h-3.5" /> Nostr Event Stream
            </h2>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="divide-y divide-zinc-800/50">
                {NOSTR_EVENTS.map((event, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="px-3 py-2.5 hover:bg-zinc-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-zinc-800 text-zinc-400">NIP-{event.kind - 30000}</span>
                      <span className="text-[9px] text-zinc-500">{event.timestamp}</span>
                    </div>
                    <p className="text-[10px] text-zinc-300 mt-1">{event.content}</p>
                  </motion.div>
                ))}
              </div>
              <div className="px-3 py-2 border-t border-zinc-800 bg-zinc-900/50">
                <span className="text-[9px] text-zinc-500">Custom kinds 30078-30086 • NIP-01 protocol • Encrypted (AES-256-GCM)</span>
              </div>
            </div>

            {/* Link Status */}
            <div className="mt-4">
              <h2 className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-medium mb-3 flex items-center gap-2">
                <ArrowUpDown className="w-3.5 h-3.5" /> Link Status
              </h2>
              <div className="space-y-1.5">
                {MESH_LINKS.map((link) => (
                  <div key={`${link.source}-${link.target}`} className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${link.status === 'active' ? 'bg-emerald-400' : link.status === 'degraded' ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'}`} />
                    <span className="text-[10px] text-zinc-300 flex-1">{link.source} → {link.target}</span>
                    <span className="text-[8px] font-mono text-zinc-500 uppercase">{link.protocol}</span>
                    <span className="text-[9px] font-mono text-zinc-400">{link.latency}ms</span>
                    {link.encrypted && <Lock className="w-2.5 h-2.5 text-emerald-500" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Zarf Air-Gap Deployment Info */}
        <section className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-medium mb-3 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" /> Air-Gap Deployment (Zarf)
          </h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-emerald-400">IL5/IL6</div>
              <div className="text-[10px] text-zinc-500 mt-1">Classification Level</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-cyan-400">Zarf v0.32</div>
              <div className="text-[10px] text-zinc-500 mt-1">Package Format</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-400">K3s + Triton</div>
              <div className="text-[10px] text-zinc-500 mt-1">Runtime Stack</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-400">7 Models</div>
              <div className="text-[10px] text-zinc-500 mt-1">Bundled (ONNX/TRT)</div>
            </div>
          </div>
          <p className="text-[10px] text-zinc-500 mt-3 text-center">
            Full system operates with zero internet connectivity. All 125+ engines, 206+ collectors, and inference models run locally on $750 Jetson hardware.
            Model updates via Mender OTA when connectivity permits. Graph syncs via Nostr mesh protocol.
          </p>
        </section>
      </div>
    </div>
  );
}
