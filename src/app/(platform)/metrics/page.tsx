'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Brain, Zap, Target, Shield, Globe, Clock,
  TrendingUp, TrendingDown, BarChart3, Layers, Radio,
  Eye, Crosshair, Satellite, Server, Cpu, Database,
  AlertTriangle, CheckCircle, ArrowUpRight, RefreshCw,
  Download, Calendar, Filter, Maximize2
} from 'lucide-react';
import { MetricCard } from '@/components/metric-card';

// Simulated WebSocket data for demo
const MOCK_METRICS = {
  novelSignalsDetected: { value: 47, prev: 35, sparkline: [12, 18, 22, 31, 28, 35, 41, 47] },
  convergenceEvents: { value: 1283, prev: 1150, sparkline: [890, 920, 980, 1050, 1100, 1150, 1220, 1283] },
  predictionAccuracy: { value: 87.3, prev: 84.1, sparkline: [82, 83, 84, 84.5, 85, 86, 87, 87.3] },
  meanDetectionTime: { value: 23.4, prev: 31.2, sparkline: [45, 42, 38, 35, 31, 28, 25, 23.4] },
  entitiesTracked: { value: 14923847, prev: 14891203, sparkline: [14.2, 14.4, 14.5, 14.6, 14.7, 14.8, 14.9, 14.92] },
  collectorsActive: { value: 206, prev: 198, sparkline: [180, 185, 190, 192, 195, 198, 202, 206] },
  enginesRunning: { value: 125, prev: 125, sparkline: [125, 125, 125, 125, 125, 125, 125, 125] },
  graphEdges: { value: 4400000, prev: 4350000, sparkline: [4.1, 4.15, 4.2, 4.25, 4.3, 4.35, 4.38, 4.4] },
  pipelineCycleTime: { value: 51, prev: 58, sparkline: [72, 68, 65, 62, 58, 55, 53, 51] },
  falsePositiveRate: { value: 3.2, prev: 4.8, sparkline: [8, 7, 6.5, 5.8, 5.2, 4.8, 3.8, 3.2] },
  sourcesCovered: { value: 75, prev: 72, sparkline: [60, 62, 65, 68, 70, 72, 74, 75] },
  alertsGenerated: { value: 12, prev: 8, sparkline: [3, 5, 4, 6, 7, 8, 10, 12] },
  meshPeers: { value: 3, prev: 2, sparkline: [1, 1, 1, 2, 2, 2, 3, 3] },
  taskingsIssued: { value: 8, prev: 5, sparkline: [2, 3, 3, 4, 5, 5, 7, 8] },
  brierScore: { value: 0.142, prev: 0.168, sparkline: [0.21, 0.19, 0.18, 0.17, 0.168, 0.155, 0.148, 0.142] },
  selfPlayCycles: { value: 847, prev: 720, sparkline: [400, 480, 540, 600, 660, 720, 780, 847] },
};

const DOMAIN_COVERAGE = [
  { domain: 'OSINT', collectors: 165, active: 142, signals: 890, color: '#3b82f6' },
  { domain: 'GEOINT', collectors: 5, active: 4, signals: 45, color: '#10b981' },
  { domain: 'SIGINT', collectors: 8, active: 3, signals: 28, color: '#8b5cf6' },
  { domain: 'CYBER', collectors: 12, active: 11, signals: 156, color: '#ef4444' },
  { domain: 'FININT', collectors: 16, active: 14, signals: 78, color: '#06b6d4' },
  { domain: 'HUMINT', collectors: 12, active: 8, signals: 34, color: '#f59e0b' },
  { domain: 'ELINT', collectors: 8, active: 2, signals: 12, color: '#a855f7' },
  { domain: 'MASINT', collectors: 3, active: 1, signals: 5, color: '#ec4899' },
  { domain: 'IMINT', collectors: 5, active: 3, signals: 22, color: '#14b8a6' },
  { domain: 'INFOPS', collectors: 12, active: 10, signals: 67, color: '#f97316' },
];

const RECENT_NOVEL_SIGNALS = [
  { id: 'ns-001', type: 'Vector Drift', source: 'GDELT + AIS Convergence', region: 'South China Sea', score: 0.89, timestamp: '2m ago', domain: 'OSINT' },
  { id: 'ns-002', type: 'Pattern Break', source: 'Telegram Channels (RU-MIL)', region: 'Kaliningrad', score: 0.76, timestamp: '8m ago', domain: 'INFOPS' },
  { id: 'ns-003', type: 'Anomalous Clustering', source: 'ADS-B Military Flights', region: 'Baltic Sea', score: 0.82, timestamp: '14m ago', domain: 'SIGINT' },
  { id: 'ns-004', type: 'Spectral Deviation', source: 'Sentinel-2 NDVI', region: 'Crimea', score: 0.71, timestamp: '23m ago', domain: 'GEOINT' },
  { id: 'ns-005', type: 'Financial Anomaly', source: 'OFAC + ICIJ Cross-ref', region: 'Dubai', score: 0.68, timestamp: '31m ago', domain: 'FININT' },
  { id: 'ns-006', type: 'Discourse Velocity', source: 'Chinese Social (Weibo)', region: 'Taiwan Strait', score: 0.84, timestamp: '42m ago', domain: 'INFOPS' },
];

const SYSTEM_HEALTH = [
  { name: 'TigerGraph Savanna', status: 'healthy', latency: '12ms', uptime: '99.97%' },
  { name: 'Pipeline (run_all_v3)', status: 'healthy', latency: '51s/cycle', uptime: '100%' },
  { name: 'System Interconnect', status: 'healthy', latency: '206/345 active', uptime: '99.8%' },
  { name: 'God\'s Eye System', status: 'healthy', latency: '< 1s', uptime: '100%' },
  { name: 'MCP Server (41 tools)', status: 'healthy', latency: '180ms avg', uptime: '100%' },
  { name: 'Nostr Mesh', status: 'degraded', latency: '340ms', uptime: '94.2%' },
  { name: 'Earth Engine', status: 'healthy', latency: '2.3s', uptime: '99.1%' },
  { name: 'Triton Inference', status: 'offline', latency: 'N/A', uptime: '0%' },
];

function DomainBar({ domain }: { domain: typeof DOMAIN_COVERAGE[0] }) {
  const coverage = (domain.active / domain.collectors) * 100;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] w-12 text-right font-medium" style={{ color: domain.color }}>{domain.domain}</span>
      <div className="flex-1 h-3 bg-zinc-800 rounded-full overflow-hidden relative">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: domain.color }}
          initial={{ width: 0 }}
          animate={{ width: `${coverage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-[8px] text-white font-medium">
          {domain.active}/{domain.collectors}
        </span>
      </div>
      <span className="text-[9px] text-zinc-500 w-10 text-right">{domain.signals} sig</span>
    </div>
  );
}

export default function MetricsPage() {
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d' | '30d'>('24h');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isLive, setIsLive] = useState(true);

  // Simulate live updates
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, 5000);
    return () => clearInterval(interval);
  }, [isLive]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Impact & Metrics Dashboard</h1>
              <p className="text-xs text-zinc-500">System performance, intelligence value, and operational impact</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Time Range Selector */}
            <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-lg p-0.5">
              {(['1h', '6h', '24h', '7d', '30d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-colors ${
                    timeRange === range ? 'bg-cyan-500/20 text-cyan-400' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            {/* Live Toggle */}
            <button
              onClick={() => setIsLive(!isLive)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isLive ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-zinc-900 border-zinc-700 text-zinc-400'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
              {isLive ? 'LIVE' : 'PAUSED'}
            </button>

            <button className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Row 1: Key Intelligence Metrics */}
        <section>
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-medium mb-3 flex items-center gap-2">
            <Brain className="w-3.5 h-3.5" /> Intelligence Value
          </h2>
          <div className="grid grid-cols-4 gap-4">
            <MetricCard
              title="Novel Signals Detected"
              value={MOCK_METRICS.novelSignalsDetected.value}
              previousValue={MOCK_METRICS.novelSignalsDetected.prev}
              icon={<Zap className="w-4 h-4 text-yellow-400" />}
              color="#f59e0b"
              sparklineData={MOCK_METRICS.novelSignalsDetected.sparkline.map(v => ({ value: v }))}
              deltaLabel="vs yesterday"
              subtitle="THE DARPA metric"
              pulse
              size="lg"
            />
            <MetricCard
              title="Prediction Accuracy"
              value={MOCK_METRICS.predictionAccuracy.value}
              previousValue={MOCK_METRICS.predictionAccuracy.prev}
              format="percent"
              icon={<Target className="w-4 h-4 text-emerald-400" />}
              color="#10b981"
              sparklineData={MOCK_METRICS.predictionAccuracy.sparkline.map(v => ({ value: v }))}
              target={90}
              deltaLabel="vs last week"
              subtitle="Target: 90% (DARPA milestone)"
              size="lg"
            />
            <MetricCard
              title="Mean Detection Time"
              value={MOCK_METRICS.meanDetectionTime.value}
              previousValue={MOCK_METRICS.meanDetectionTime.prev}
              format="duration"
              unit="seconds"
              icon={<Clock className="w-4 h-4 text-blue-400" />}
              color="#3b82f6"
              sparklineData={MOCK_METRICS.meanDetectionTime.sparkline.map(v => ({ value: v }))}
              threshold={{ warning: 60, critical: 120, direction: 'above' }}
              deltaLabel="improvement"
              subtitle="Sensor-to-insight latency"
              size="lg"
            />
            <MetricCard
              title="Brier Score"
              value={MOCK_METRICS.brierScore.value}
              previousValue={MOCK_METRICS.brierScore.prev}
              icon={<Activity className="w-4 h-4 text-purple-400" />}
              color="#8b5cf6"
              sparklineData={MOCK_METRICS.brierScore.sparkline.map(v => ({ value: v }))}
              threshold={{ warning: 0.2, critical: 0.3, direction: 'above' }}
              deltaLabel="lower = better"
              subtitle="Calibration quality (0 = perfect)"
              size="lg"
            />
          </div>
        </section>

        {/* Row 2: Operational Metrics */}
        <section>
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-medium mb-3 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5" /> Operational Tempo
          </h2>
          <div className="grid grid-cols-5 gap-3">
            <MetricCard
              title="Convergence Events"
              value={MOCK_METRICS.convergenceEvents.value}
              previousValue={MOCK_METRICS.convergenceEvents.prev}
              format="compact"
              icon={<Layers className="w-3.5 h-3.5 text-cyan-400" />}
              color="#06b6d4"
              sparklineData={MOCK_METRICS.convergenceEvents.sparkline.map(v => ({ value: v }))}
              size="sm"
            />
            <MetricCard
              title="Entities Tracked"
              value={MOCK_METRICS.entitiesTracked.value}
              format="compact"
              icon={<Globe className="w-3.5 h-3.5 text-blue-400" />}
              color="#3b82f6"
              sparklineData={MOCK_METRICS.entitiesTracked.sparkline.map(v => ({ value: v * 1000000 }))}
              size="sm"
              subtitle="14.9M vertices"
            />
            <MetricCard
              title="Alerts Generated"
              value={MOCK_METRICS.alertsGenerated.value}
              previousValue={MOCK_METRICS.alertsGenerated.prev}
              icon={<AlertTriangle className="w-3.5 h-3.5 text-orange-400" />}
              color="#f97316"
              sparklineData={MOCK_METRICS.alertsGenerated.sparkline.map(v => ({ value: v }))}
              size="sm"
            />
            <MetricCard
              title="Taskings Issued"
              value={MOCK_METRICS.taskingsIssued.value}
              previousValue={MOCK_METRICS.taskingsIssued.prev}
              icon={<Crosshair className="w-3.5 h-3.5 text-red-400" />}
              color="#ef4444"
              sparklineData={MOCK_METRICS.taskingsIssued.sparkline.map(v => ({ value: v }))}
              size="sm"
              subtitle="Autonomous ISR"
            />
            <MetricCard
              title="Self-Play Cycles"
              value={MOCK_METRICS.selfPlayCycles.value}
              previousValue={MOCK_METRICS.selfPlayCycles.prev}
              icon={<Brain className="w-3.5 h-3.5 text-violet-400" />}
              color="#7c3aed"
              sparklineData={MOCK_METRICS.selfPlayCycles.sparkline.map(v => ({ value: v }))}
              size="sm"
              subtitle="R-Zero learning"
            />
          </div>
        </section>

        {/* Row 3: Two columns */}
        <div className="grid grid-cols-3 gap-6">
          {/* Recent Novel Signals */}
          <div className="col-span-2">
            <h2 className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-medium mb-3 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" /> Recent Novel Signals
            </h2>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="divide-y divide-zinc-800">
                {RECENT_NOVEL_SIGNALS.map((signal) => (
                  <motion.div
                    key={signal.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="px-4 py-3 flex items-center gap-4 hover:bg-zinc-800/30 transition-colors cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{signal.type}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">{signal.domain}</span>
                      </div>
                      <p className="text-xs text-zinc-500 truncate">{signal.source}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-zinc-500" />
                        <span className="text-xs text-zinc-400">{signal.region}</span>
                      </div>
                      <span className="text-[10px] text-zinc-600">{signal.timestamp}</span>
                    </div>
                    <div className="flex-shrink-0">
                      <div className={`text-sm font-bold font-mono ${signal.score >= 0.8 ? 'text-red-400' : signal.score >= 0.6 ? 'text-yellow-400' : 'text-zinc-400'}`}>
                        {(signal.score * 100).toFixed(0)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Domain Coverage */}
          <div>
            <h2 className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-medium mb-3 flex items-center gap-2">
              <Radio className="w-3.5 h-3.5" /> Domain Coverage
            </h2>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-2.5">
              {DOMAIN_COVERAGE.map((domain) => (
                <DomainBar key={domain.domain} domain={domain} />
              ))}
              <div className="pt-2 border-t border-zinc-800 mt-3">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-zinc-500">Total Active</span>
                  <span className="text-white font-medium">{DOMAIN_COVERAGE.reduce((a, d) => a + d.active, 0)} / {DOMAIN_COVERAGE.reduce((a, d) => a + d.collectors, 0)} collectors</span>
                </div>
                <div className="flex items-center justify-between text-[10px] mt-1">
                  <span className="text-zinc-500">Total Signals/hr</span>
                  <span className="text-white font-medium">{DOMAIN_COVERAGE.reduce((a, d) => a + d.signals, 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 4: System Health + Pipeline Metrics */}
        <div className="grid grid-cols-2 gap-6">
          {/* System Health */}
          <div>
            <h2 className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-medium mb-3 flex items-center gap-2">
              <Server className="w-3.5 h-3.5" /> System Health
            </h2>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="divide-y divide-zinc-800">
                {SYSTEM_HEALTH.map((system) => (
                  <div key={system.name} className="px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        system.status === 'healthy' ? 'bg-emerald-400' : system.status === 'degraded' ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'
                      }`} />
                      <span className="text-xs text-zinc-300">{system.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] text-zinc-500 font-mono">{system.latency}</span>
                      <span className={`text-[10px] font-mono ${system.uptime === '100%' ? 'text-emerald-400' : system.uptime === '0%' ? 'text-red-400' : 'text-yellow-400'}`}>
                        {system.uptime}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pipeline Performance */}
          <div>
            <h2 className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-medium mb-3 flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5" /> Pipeline Performance
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                title="Cycle Time"
                value={MOCK_METRICS.pipelineCycleTime.value}
                previousValue={MOCK_METRICS.pipelineCycleTime.prev}
                format="duration"
                icon={<RefreshCw className="w-3.5 h-3.5 text-blue-400" />}
                color="#3b82f6"
                sparklineData={MOCK_METRICS.pipelineCycleTime.sparkline.map(v => ({ value: v }))}
                threshold={{ warning: 60, critical: 120, direction: 'above' }}
                size="sm"
                subtitle="Target: < 60s"
              />
              <MetricCard
                title="False Positive Rate"
                value={MOCK_METRICS.falsePositiveRate.value}
                previousValue={MOCK_METRICS.falsePositiveRate.prev}
                format="percent"
                icon={<Shield className="w-3.5 h-3.5 text-emerald-400" />}
                color="#10b981"
                sparklineData={MOCK_METRICS.falsePositiveRate.sparkline.map(v => ({ value: v }))}
                threshold={{ warning: 5, critical: 10, direction: 'above' }}
                size="sm"
                subtitle="50% reduction target"
              />
              <MetricCard
                title="Collectors Active"
                value={MOCK_METRICS.collectorsActive.value}
                previousValue={MOCK_METRICS.collectorsActive.prev}
                icon={<Database className="w-3.5 h-3.5 text-cyan-400" />}
                color="#06b6d4"
                sparklineData={MOCK_METRICS.collectorsActive.sparkline.map(v => ({ value: v }))}
                target={345}
                size="sm"
              />
              <MetricCard
                title="Engines Running"
                value={MOCK_METRICS.enginesRunning.value}
                icon={<Brain className="w-3.5 h-3.5 text-violet-400" />}
                color="#7c3aed"
                sparklineData={MOCK_METRICS.enginesRunning.sparkline.map(v => ({ value: v }))}
                size="sm"
                subtitle="125/125 (100%)"
              />
            </div>
          </div>
        </div>

        {/* Row 5: Competitive Positioning Banner */}
        <section className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-900 border border-zinc-700/50 rounded-xl p-6">
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-medium mb-4 flex items-center gap-2">
            <Target className="w-3.5 h-3.5" /> Competitive Positioning (vs $270B+ Incumbents)
          </h2>
          <div className="grid grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">$750</div>
              <div className="text-[10px] text-zinc-500 mt-1">Per Node Cost</div>
              <div className="text-[9px] text-zinc-600">vs Maven $100M+</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">10</div>
              <div className="text-[10px] text-zinc-500 mt-1">INT Domains</div>
              <div className="text-[9px] text-zinc-600">vs Palantir 3-4</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">571V</div>
              <div className="text-[10px] text-zinc-500 mt-1">Schema Types</div>
              <div className="text-[9px] text-zinc-600">vs Lattice flat model</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">0</div>
              <div className="text-[10px] text-zinc-500 mt-1">Human Labels Needed</div>
              <div className="text-[9px] text-zinc-600">vs Maven 100+ analysts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">14.9M</div>
              <div className="text-[10px] text-zinc-500 mt-1">Live Vertices</div>
              <div className="text-[9px] text-zinc-600">Largest SBIR-eligible TKG</div>
            </div>
          </div>
        </section>

        {/* Footer: Last Updated */}
        <div className="flex items-center justify-between text-[10px] text-zinc-600 pt-2">
          <span>GZM Impact Dashboard v1.0 | Pipeline v3.5.6 | God's Eye v1.5.0</span>
          <span>Last refresh: {lastRefresh.toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}
