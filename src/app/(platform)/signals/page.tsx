'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Radio, TrendingUp, Filter, Download, Eye, Clock, Layers, AlertTriangle, Activity, Globe, BarChart3 } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface NovelSignal {
  signal_id: string;
  novelty_score: number;
  novelty_type: 'statistical_anomaly' | 'cross_domain_convergence' | 'temporal_pattern_break' | 'vector_drift' | 'emergent_cluster';
  explanation: string;
  source_collector: string;
  sources_involved: string[];
  aoi_id: string;
  aoi_name: string;
  lat: number;
  lon: number;
  severity: number;
  timestamp: string;
  raw_classification: string;
  matched_rules: number;
  total_rules_checked: number;
  embedding_distance: number;
  baseline_deviation_sigma: number;
}

interface ConvergenceSignal {
  signal_id: string;
  signal_type: string;
  severity: number;
  lat: number;
  lon: number;
  sources: string[];
  source_count: number;
  convergence_score: number;
  independence_score: number;
  timestamp: string;
  aoi_id: string;
}

interface SignalStats {
  total_signals_24h: number;
  novel_signals_24h: number;
  novel_rate_pct: number;
  avg_novelty_score: number;
  top_aoi: string;
  top_novelty_type: string;
  signals_per_hour: number;
  active_rules: number;
  rules_that_matched: number;
  baseline_age_hours: number;
}

// =============================================================================
// NOVELTY TYPE METADATA
// =============================================================================

const NOVELTY_TYPES: Record<string, { label: string; color: string; description: string }> = {
  statistical_anomaly: { label: 'Statistical Anomaly', color: '#ef4444', description: 'Value exceeds 3 sigma from rolling baseline' },
  cross_domain_convergence: { label: 'Cross-Domain Convergence', color: '#8b5cf6', description: 'Signals from 3+ INT domains converge on same entity/location without matching any known pattern' },
  temporal_pattern_break: { label: 'Temporal Pattern Break', color: '#f59e0b', description: 'Entity behavior deviates from learned pattern-of-life' },
  vector_drift: { label: 'Vector Drift', color: '#06b6d4', description: 'Embedding distance from nearest baseline centroid exceeds threshold' },
  emergent_cluster: { label: 'Emergent Cluster', color: '#10b981', description: 'New cluster forming in embedding space with no historical precedent' },
};

// =============================================================================
// MOCK DATA
// =============================================================================

function generateMockSignals(): { novel: NovelSignal[]; convergence: ConvergenceSignal[]; stats: SignalStats } {
  const novel: NovelSignal[] = [
    {
      signal_id: 'ns_001', novelty_score: 0.94, novelty_type: 'cross_domain_convergence',
      explanation: 'Satellite imagery shows new excavation at Natanz + SIGINT detects increased centrifuge motor RF signatures + OSINT reports IAEA inspector denial. No existing rule covers this 3-way pattern.',
      source_collector: 'convergence_engine', sources_involved: ['satellite_change_detection', 'sdr_radio_collector', 'rss_iaea_monitor'],
      aoi_id: 'natanz', aoi_name: 'Natanz Nuclear', lat: 33.7, lon: 51.7, severity: 0.92,
      timestamp: new Date(Date.now() - 1800000).toISOString(), raw_classification: 'signal/unclassified',
      matched_rules: 0, total_rules_checked: 62, embedding_distance: 0.847, baseline_deviation_sigma: 4.2,
    },
    {
      signal_id: 'ns_002', novelty_score: 0.87, novelty_type: 'temporal_pattern_break',
      explanation: 'Kaliningrad military rail traffic increased 400% vs 90-day baseline on a Tuesday (historically peaks Thursdays). Coincides with Baltic Fleet exercises not matching any announced schedule.',
      source_collector: 'satellite_change_detection', sources_involved: ['earth_engine', 'telegram_collector', 'opensky'],
      aoi_id: 'kaliningrad', aoi_name: 'Kaliningrad', lat: 54.7, lon: 20.5, severity: 0.78,
      timestamp: new Date(Date.now() - 7200000).toISOString(), raw_classification: 'signal/military_logistics',
      matched_rules: 2, total_rules_checked: 62, embedding_distance: 0.623, baseline_deviation_sigma: 3.8,
    },
    {
      signal_id: 'ns_003', novelty_score: 0.81, novelty_type: 'vector_drift',
      explanation: 'New communication pattern detected on 2.4GHz near Zaporizhzhia NPP. Modulation signature does not match any known military, civilian, or IoT protocol in our training corpus. Possible novel C2 link.',
      source_collector: 'sdr_radio_collector', sources_involved: ['sdr_radio_collector', 'cell_survey'],
      aoi_id: 'zaporizhzhia', aoi_name: 'Zaporizhzhia NPP', lat: 47.5, lon: 34.6, severity: 0.85,
      timestamp: new Date(Date.now() - 3600000).toISOString(), raw_classification: 'signal/rf_unknown',
      matched_rules: 0, total_rules_checked: 62, embedding_distance: 0.912, baseline_deviation_sigma: 5.1,
    },
    {
      signal_id: 'ns_004', novelty_score: 0.76, novelty_type: 'emergent_cluster',
      explanation: 'Cluster of 7 new social media accounts posting coordinated content about Suwalki Gap from IP ranges in St. Petersburg. Account creation timestamps within 4-hour window. No CIB rule matched because coordination method is novel (image steganography in profile photos).',
      source_collector: 'cib_detection_engine', sources_involved: ['telegram_collector', 'twitter_collector', 'cib_detection_engine'],
      aoi_id: 'suwalki', aoi_name: 'Suwalki Gap', lat: 54.1, lon: 23.0, severity: 0.71,
      timestamp: new Date(Date.now() - 14400000).toISOString(), raw_classification: 'signal/info_ops_suspected',
      matched_rules: 1, total_rules_checked: 62, embedding_distance: 0.734, baseline_deviation_sigma: 3.2,
    },
    {
      signal_id: 'ns_005', novelty_score: 0.73, novelty_type: 'statistical_anomaly',
      explanation: 'AIS transponder dropout rate in Bab-el-Mandeb increased from baseline 2% to 18% in 6 hours. Not correlated with weather, Houthi attacks, or known exercises. 14 vessels simultaneously dark.',
      source_collector: 'ais_collector', sources_involved: ['ais_collector', 'ioda_prediction_engine'],
      aoi_id: 'bab_el_mandeb', aoi_name: 'Bab-el-Mandeb', lat: 12.5, lon: 43.3, severity: 0.82,
      timestamp: new Date(Date.now() - 10800000).toISOString(), raw_classification: 'signal/maritime_anomaly',
      matched_rules: 3, total_rules_checked: 62, embedding_distance: 0.556, baseline_deviation_sigma: 4.7,
    },
  ];

  const convergence: ConvergenceSignal[] = [
    { signal_id: 'cv_001', signal_type: 'SATELLITE_SIGINT_OSINT', severity: 0.91, lat: 47.5, lon: 34.6, sources: ['satellite', 'sigint', 'osint'], source_count: 3, convergence_score: 0.88, independence_score: 0.95, timestamp: new Date().toISOString(), aoi_id: 'zaporizhzhia' },
    { signal_id: 'cv_002', signal_type: 'MILITARY_BUILDUP', severity: 0.85, lat: 54.7, lon: 20.5, sources: ['satellite', 'osint'], source_count: 2, convergence_score: 0.79, independence_score: 0.87, timestamp: new Date().toISOString(), aoi_id: 'kaliningrad' },
    { signal_id: 'cv_003', signal_type: 'MARITIME_ANOMALY', severity: 0.78, lat: 12.5, lon: 43.3, sources: ['ais', 'ioda'], source_count: 2, convergence_score: 0.82, independence_score: 0.91, timestamp: new Date().toISOString(), aoi_id: 'bab_el_mandeb' },
  ];

  const stats: SignalStats = {
    total_signals_24h: 1847,
    novel_signals_24h: 7,
    novel_rate_pct: 0.38,
    avg_novelty_score: 0.82,
    top_aoi: 'Zaporizhzhia NPP',
    top_novelty_type: 'cross_domain_convergence',
    signals_per_hour: 77,
    active_rules: 62,
    rules_that_matched: 1840,
    baseline_age_hours: 2160,
  };

  return { novel, convergence, stats };
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function SignalsPage() {
  const [data, setData] = useState(generateMockSignals);
  const [selectedSignal, setSelectedSignal] = useState<NovelSignal | null>(null);
  const [filterAOI, setFilterAOI] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    const interval = setInterval(() => setData(generateMockSignals()), 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredNovel = data.novel.filter(s => {
    if (filterAOI !== 'all' && s.aoi_id !== filterAOI) return false;
    if (filterType !== 'all' && s.novelty_type !== filterType) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-purple-400" />
            Novel Signal Explorer
          </h1>
          <p className="text-sm text-zinc-400 mt-1">The Art of Novel Signals: detecting what no rule anticipates</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 border border-zinc-700 text-xs font-mono hover:bg-zinc-700">
            <Download className="w-3 h-3" /> EXPORT STIX 2.1
          </button>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Signals (24h)', value: data.stats.total_signals_24h.toLocaleString(), icon: Activity, color: 'text-blue-400' },
          { label: 'Novel (24h)', value: data.stats.novel_signals_24h.toString(), icon: Zap, color: 'text-purple-400' },
          { label: 'Novel Rate', value: `${data.stats.novel_rate_pct}%`, icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Avg Novelty', value: `${(data.stats.avg_novelty_score * 100).toFixed(0)}%`, icon: BarChart3, color: 'text-orange-400' },
          { label: 'Active Rules', value: data.stats.active_rules.toString(), icon: Filter, color: 'text-cyan-400' },
          { label: 'Baseline Age', value: `${Math.round(data.stats.baseline_age_hours / 24)}d`, icon: Clock, color: 'text-zinc-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
              <span className="text-[10px] font-mono text-zinc-500 uppercase">{stat.label}</span>
            </div>
            <span className="text-xl font-bold font-mono">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-zinc-500" />
          <select value={filterAOI} onChange={e => setFilterAOI(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs font-mono text-zinc-300">
            <option value="all">All AOIs</option>
            <option value="natanz">Natanz</option>
            <option value="kaliningrad">Kaliningrad</option>
            <option value="zaporizhzhia">Zaporizhzhia</option>
            <option value="suwalki">Suwalki Gap</option>
            <option value="bab_el_mandeb">Bab-el-Mandeb</option>
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-zinc-500" />
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs font-mono text-zinc-300">
            <option value="all">All Types</option>
            {Object.entries(NOVELTY_TYPES).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>
        <span className="text-[10px] font-mono text-zinc-500 ml-auto">{filteredNovel.length} signals shown</span>
      </div>

      {/* MAIN CONTENT: Signal cards */}
      <div className="grid grid-cols-1 gap-3">
        <AnimatePresence>
          {filteredNovel.map((signal, i) => {
            const typeInfo = NOVELTY_TYPES[signal.novelty_type];
            return (
              <motion.div
                key={signal.signal_id}
                className={`bg-zinc-900 border rounded-lg p-4 cursor-pointer hover:bg-zinc-800/80 transition-colors ${
                  selectedSignal?.signal_id === signal.signal_id ? 'border-purple-500/50' : 'border-zinc-800'
                }`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedSignal(selectedSignal?.signal_id === signal.signal_id ? null : signal)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: typeInfo.color }} />
                    <span className="text-xs font-bold" style={{ color: typeInfo.color }}>{typeInfo.label}</span>
                    <span className="text-[9px] font-mono text-zinc-500">{signal.signal_id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                      NOVELTY: {(signal.novelty_score * 100).toFixed(0)}%
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300">
                      SEV: {(signal.severity * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Explanation */}
                <p className="text-sm text-zinc-300 leading-relaxed mb-3">{signal.explanation}</p>

                {/* Metadata row */}
                <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-500">
                  <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{signal.aoi_name}</span>
                  <span className="flex items-center gap-1"><Radio className="w-3 h-3" />{signal.sources_involved.length} sources</span>
                  <span className="flex items-center gap-1"><Filter className="w-3 h-3" />{signal.matched_rules}/{signal.total_rules_checked} rules matched</span>
                  <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{signal.baseline_deviation_sigma.toFixed(1)} sigma</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(signal.timestamp).toLocaleTimeString()}</span>
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {selectedSignal?.signal_id === signal.signal_id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 pt-3 border-t border-zinc-800"
                    >
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <span className="text-[9px] font-mono text-zinc-500 block mb-1">SOURCES INVOLVED</span>
                          <div className="flex flex-wrap gap-1">
                            {signal.sources_involved.map(s => (
                              <span key={s} className="text-[8px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">{s}</span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-[9px] font-mono text-zinc-500 block mb-1">WHY IT'S NOVEL</span>
                          <p className="text-[10px] text-zinc-400">{typeInfo.description}</p>
                        </div>
                        <div>
                          <span className="text-[9px] font-mono text-zinc-500 block mb-1">METRICS</span>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[9px] font-mono">
                              <span className="text-zinc-500">Embedding dist:</span>
                              <span className="text-zinc-300">{signal.embedding_distance.toFixed(3)}</span>
                            </div>
                            <div className="flex justify-between text-[9px] font-mono">
                              <span className="text-zinc-500">Baseline dev:</span>
                              <span className="text-zinc-300">{signal.baseline_deviation_sigma.toFixed(1)} sigma</span>
                            </div>
                            <div className="flex justify-between text-[9px] font-mono">
                              <span className="text-zinc-500">Raw class:</span>
                              <span className="text-zinc-300">{signal.raw_classification}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button className="text-[9px] px-3 py-1.5 rounded bg-purple-600/30 text-purple-300 hover:bg-purple-600/50 font-mono">INVESTIGATE</button>
                        <button className="text-[9px] px-3 py-1.5 rounded bg-blue-600/30 text-blue-300 hover:bg-blue-600/50 font-mono">TASK COLLECTION</button>
                        <button className="text-[9px] px-3 py-1.5 rounded bg-orange-600/30 text-orange-300 hover:bg-orange-600/50 font-mono">CREATE RULE</button>
                        <button className="text-[9px] px-3 py-1.5 rounded bg-zinc-700/50 text-zinc-300 hover:bg-zinc-600/50 font-mono">FALSE POSITIVE</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* DARPA FRAMING */}
      <div className="mt-8 bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Eye className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold text-purple-300">DARPA DPA26BZ04-DV015: Art of Novel Signals</span>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          Novel signal = vector drift in learned baseline across multi-INT. The system maintains 62 classification rules + a 90-day rolling spectral/behavioral baseline.
          When collected data doesn't match ANY rule AND deviates &gt;3 sigma from baseline, it's flagged as novel. Cross-domain convergence (3+ INT domains agreeing on an anomaly)
          produces the highest novelty scores. Zero human labeling required. The system discovers what it doesn't know it should look for.
        </p>
      </div>
    </div>
  );
}
