'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { NAV_ITEMS, NAV_CATEGORIES } from '@/components/nav-config';
import { DDILIndicator, type DDILState, type ConnectionMode } from '@/components/ddil-indicator';
import { ISA101AlarmSystem, type ISA101Alarm } from '@/components/isa101-alarm-system';
import { AlertTakeover, type CriticalAlert } from '@/components/alert-takeover';
import { TemporalPlayback } from '@/components/temporal-playback';
import { useGZMShortcuts, ShortcutHint } from '@/hooks/use-keyboard-shortcuts';
import { useGZMWebSocket } from '@/hooks/use-gzm-websocket';
import {
  ChevronLeft, ChevronRight, Search, Command, Bell,
  Settings, User, Moon, Sun, Wifi, WifiOff, Zap,
  Activity, Clock, Shield, Globe, HelpCircle
} from 'lucide-react';

// Global DDIL state (would come from WebSocket in production)
const INITIAL_DDIL_STATE: DDILState = {
  mode: 'FULL' as ConnectionMode,
  peers: [],
  uplinkStatus: 'connected',
  meshProtocol: 'nostr',
  bandwidth: 1000,
  maxBandwidth: 1000,
  syncQueue: [],
  totalQueuedEvents: 0,
  lastUplinkSync: 'now',
  encryptionStatus: 'active',
  nostrRelays: 5,
  graphSyncPercent: 100,
  localVertices: 14923847,
  localEdges: 4400000,
  capabilities: {
    graphQuery: true,
    convergenceScoring: true,
    prediction: true,
    llmChat: true,
    satelliteTasking: true,
    droneControl: true,
    meshBroadcast: true,
    localCollection: true,
  },
};

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className={`flex flex-col border-r border-zinc-800 bg-zinc-950 transition-all duration-300 ${collapsed ? 'w-16' : 'w-56'}`}>
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-zinc-800">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500/30 to-blue-500/30 border border-cyan-500/40 flex items-center justify-center">
              <Globe className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block leading-tight">THIRD EYE</span>
              <span className="text-[7px] text-zinc-500 uppercase tracking-[0.15em]">Gray Zone Monitor</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500/30 to-blue-500/30 border border-cyan-500/40 flex items-center justify-center mx-auto">
            <Globe className="w-4 h-4 text-cyan-400" />
          </div>
        )}
        <button onClick={onToggle} className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors">
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-4 scrollbar-thin scrollbar-track-zinc-950 scrollbar-thumb-zinc-800">
        {NAV_CATEGORIES.map(category => {
          const categoryItems = NAV_ITEMS.filter(item => item.category === category);
          return (
            <div key={category}>
              {!collapsed && (
                <span className="text-[8px] uppercase tracking-[0.2em] text-zinc-600 font-medium px-2 mb-1 block">{category}</span>
              )}
              <div className="space-y-0.5">
                {categoryItems.map(item => {
                  const Icon = item.icon;
                  const isActive = pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => router.push(item.path)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-all group relative ${
                        isActive
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent'
                      }`}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-cyan-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                      {!collapsed && (
                        <>
                          <span className="text-[11px] font-medium truncate">{item.label}</span>
                          {item.isNew && (
                            <span className="text-[7px] px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-bold ml-auto">NEW</span>
                          )}
                        </>
                      )}
                      {collapsed && item.isNew && (
                        <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom: System Status */}
      <div className="border-t border-zinc-800 p-2">
        {!collapsed ? (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 px-2 py-1 text-[9px]">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-zinc-500">Pipeline v3.5.6</span>
              <span className="text-emerald-400 ml-auto">14/14</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1 text-[9px]">
              <Activity className="w-3 h-3 text-zinc-600" />
              <span className="text-zinc-500">14.9M vertices</span>
              <span className="text-zinc-400 ml-auto">51s/cycle</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1 text-[9px]">
              <Shield className="w-3 h-3 text-zinc-600" />
              <span className="text-zinc-500">God's Eye v1.5.0</span>
              <span className="text-emerald-400 ml-auto">✓</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Pipeline healthy" />
          </div>
        )}
      </div>
    </div>
  );
}

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const filteredItems = NAV_ITEMS.filter(item =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[20vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
          <Search className="w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Navigate to page, search entities, run command..."
            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
            autoFocus
          />
          <kbd className="text-[8px] px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400">esc</kbd>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2">
          {filteredItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => { router.push(item.path); onClose(); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800 text-left transition-colors"
              >
                <Icon className="w-4 h-4 text-zinc-500" />
                <div className="flex-1">
                  <span className="text-xs text-zinc-200">{item.label}</span>
                  <span className="text-[9px] text-zinc-600 ml-2">{item.category}</span>
                </div>
                {item.isNew && <span className="text-[7px] px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-400">NEW</span>}
              </button>
            );
          })}
          {filteredItems.length === 0 && (
            <p className="text-xs text-zinc-500 text-center py-4">No results for "{query}"</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [ddilState, setDdilState] = useState<DDILState>(INITIAL_DDIL_STATE);
  const [alarms, setAlarms] = useState<ISA101Alarm[]>([]);
  const [criticalAlert, setCriticalAlert] = useState<CriticalAlert | null>(null);
  const [showTemporalPlayback, setShowTemporalPlayback] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(new Date());
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // WebSocket connection
  const { state: wsState, novelSignals, alerts: wsAlerts, metrics, pipelineStatus } = useGZMWebSocket();

  // Keyboard shortcuts (wired to everything)
  useGZMShortcuts({
    navigate: (path) => router.push(path),
    togglePlay: () => setIsPlaying(!isPlaying),
    toggleFullscreen: () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(),
    openSearch: () => setCommandPaletteOpen(true),
    clearSelection: () => { setCommandPaletteOpen(false); setCriticalAlert(null); },
    acknowledgeAlert: () => {
      if (alarms.length > 0) {
        const topAlarm = alarms.find(a => a.state === 'active');
        if (topAlarm) handleAcknowledgeAlarm(topAlarm.id);
      }
    },
  });

  // Process WebSocket alerts into ISA-101 system
  useEffect(() => {
    wsAlerts.forEach(wsAlert => {
      const payload = wsAlert.payload;
      if (payload?.convergenceScore >= 90 && payload?.type === 'NOVEL_SIGNAL') {
        // Level 1: Full screen takeover
        setCriticalAlert({
          id: payload.id || `alert-${Date.now()}`,
          type: 'NOVEL_SIGNAL',
          severity: 'CRITICAL',
          title: payload.title || 'Novel Signal Detected',
          description: payload.description || '',
          source: payload.source || 'Unknown',
          domain: payload.domain || 'MULTI-INT',
          confidence: payload.confidence || 90,
          convergenceScore: payload.convergenceScore || 90,
          timestamp: payload.timestamp || new Date().toISOString(),
          requiresAck: true,
          entities: payload.entities || [],
          signals: payload.signals || [],
          suggestedActions: [
            { label: 'Investigate', type: 'investigate', priority: 1 },
            { label: 'Task Collection', type: 'task', priority: 2 },
          ],
        });
      } else {
        // Level 2-4: ISA-101 system
        const level = payload?.convergenceScore >= 70 ? 2 : payload?.convergenceScore >= 40 ? 3 : 4;
        setAlarms(prev => [{
          id: payload?.id || `alarm-${Date.now()}`,
          level: level as 1 | 2 | 3 | 4,
          state: 'active',
          type: payload?.type || 'CONVERGENCE',
          title: payload?.title || 'New Alert',
          description: payload?.description || '',
          source: payload?.source || '',
          domain: payload?.domain || '',
          convergenceScore: payload?.convergenceScore || 0,
          timestamp: new Date().toISOString(),
        }, ...prev].slice(0, 100));
      }
    });
  }, [wsAlerts]);

  const handleAcknowledgeAlarm = useCallback((id: string) => {
    setAlarms(prev => prev.map(a => a.id === id ? { ...a, state: 'acknowledged' as const, acknowledgedAt: new Date().toISOString() } : a));
  }, []);

  const handleShelveAlarm = useCallback((id: string, minutes: number) => {
    setAlarms(prev => prev.map(a => a.id === id ? { ...a, state: 'shelved' as const, shelvedUntil: new Date(Date.now() + minutes * 60000).toISOString() } : a));
  }, []);

  // Temporal playback auto-advance
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setPlaybackTime(prev => new Date(prev.getTime() + 1000 * playbackSpeed));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed]);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* DDIL Indicator (top banner, always visible) */}
        <DDILIndicator state={ddilState} />

        {/* Top Bar */}
        <div className="h-10 border-b border-zinc-800 flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Breadcrumb */}
            <span className="text-[10px] text-zinc-500">
              {NAV_ITEMS.find(i => i.path === pathname)?.category || ''}
            </span>
            <ChevronRight className="w-3 h-3 text-zinc-700" />
            <span className="text-[11px] text-zinc-300 font-medium">
              {NAV_ITEMS.find(i => i.path === pathname)?.label || 'Dashboard'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Connection status */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-900 border border-zinc-800">
              {wsState.connected ? <Wifi className="w-3 h-3 text-emerald-400" /> : <WifiOff className="w-3 h-3 text-red-400" />}
              <span className="text-[9px] text-zinc-500">{wsState.mode}</span>
              {wsState.latencyMs > 0 && <span className="text-[8px] text-zinc-600 font-mono">{wsState.latencyMs}ms</span>}
            </div>

            {/* Command palette trigger */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="text-[10px]">Search</span>
              <ShortcutHint shortcut="ctrl+k" />
            </button>

            {/* Temporal playback toggle */}
            <button
              onClick={() => setShowTemporalPlayback(!showTemporalPlayback)}
              className={`p-1.5 rounded-lg border transition-colors ${showTemporalPlayback ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'}`}
              title="Toggle temporal playback"
            >
              <Clock className="w-3.5 h-3.5" />
            </button>

            {/* Novel signals counter */}
            {novelSignals.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-yellow-500/10 border border-yellow-500/20">
                <Zap className="w-3 h-3 text-yellow-400" />
                <span className="text-[9px] font-bold text-yellow-400">{novelSignals.length}</span>
              </div>
            )}

            {/* Help */}
            <button className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors" title="Keyboard shortcuts (?)">
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>

        {/* Temporal Playback Bar (bottom, toggleable) */}
        <AnimatePresence>
          {showTemporalPlayback && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden flex-shrink-0">
              <TemporalPlayback
                events={[]}
                timeRange={{ start: new Date(Date.now() - 86400000), end: new Date() }}
                currentTime={playbackTime}
                onTimeChange={setPlaybackTime}
                onRangeChange={() => {}}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onSpeedChange={setPlaybackSpeed}
                isPlaying={isPlaying}
                speed={playbackSpeed}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Global Overlays */}

      {/* ISA-101 Alarm System (Level 2-4: banners + badge) */}
      <ISA101AlarmSystem
        alarms={alarms}
        onAcknowledge={handleAcknowledgeAlarm}
        onShelve={handleShelveAlarm}
        onSuppress={(id) => setAlarms(prev => prev.map(a => a.id === id ? { ...a, state: 'suppressed' as const } : a))}
        onClear={(id) => setAlarms(prev => prev.map(a => a.id === id ? { ...a, state: 'cleared' as const } : a))}
        onAction={() => {}}
      />

      {/* Level 1 Critical Alert Takeover (ONLY for CS > 90 + confirmed novel signal) */}
      <AlertTakeover
        alert={criticalAlert}
        onAcknowledge={(id) => { setCriticalAlert(null); }}
        onDismiss={(id) => setCriticalAlert(null)}
        onAction={(id, action) => { console.log('Alert action:', action); setCriticalAlert(null); }}
        onNavigateEntity={(entityId) => { router.push(`/entities?id=${entityId}`); setCriticalAlert(null); }}
      />

      {/* Command Palette */}
      <AnimatePresence>
        {commandPaletteOpen && <CommandPalette open={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
