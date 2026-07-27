'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database, Search, Filter, Layers, ChevronRight, Copy,
  Globe, Network, Shield, Zap, Target, Radio, Anchor,
  Plane, Users, DollarSign, Server, Eye, Activity,
  BarChart3, GitBranch, Box, ArrowRight, Download
} from 'lucide-react';

interface VertexType {
  name: string;
  category: string;
  domain: string;
  attributes: number;
  instances: number;
  color: string;
  description: string;
  keyAttributes: string[];
}

interface EdgeType {
  name: string;
  sourceVertex: string;
  targetVertex: string;
  category: string;
  attributes: number;
  instances: number;
  directed: boolean;
  decayHours: number;
}

// Representative sample of the 571V/943E schema
const VERTEX_CATEGORIES: Record<string, { count: number; color: string; icon: any }> = {
  'Geopolitical': { count: 87, color: '#3b82f6', icon: Globe },
  'Military': { count: 64, color: '#ef4444', icon: Shield },
  'Financial': { count: 52, color: '#06b6d4', icon: DollarSign },
  'Cyber': { count: 48, color: '#8b5cf6', icon: Server },
  'Maritime': { count: 38, color: '#14b8a6', icon: Anchor },
  'Aviation': { count: 35, color: '#f59e0b', icon: Plane },
  'Person/Org': { count: 72, color: '#ec4899', icon: Users },
  'Infrastructure': { count: 44, color: '#6366f1', icon: Radio },
  'Signal': { count: 56, color: '#fbbf24', icon: Zap },
  'Prediction': { count: 31, color: '#f97316', icon: Target },
  'Temporal': { count: 28, color: '#10b981', icon: Activity },
  'Spatial': { count: 16, color: '#a855f7', icon: Network },
};

const SAMPLE_VERTICES: VertexType[] = [
  { name: 'Country', category: 'Geopolitical', domain: 'OSINT', attributes: 24, instances: 195, color: '#3b82f6', description: 'Sovereign state entity with political, economic, military indicators', keyAttributes: ['iso3', 'instability_index', 'sanctions_status', 'alliance_membership'] },
  { name: 'MilitaryUnit', category: 'Military', domain: 'SIGINT', attributes: 18, instances: 12847, color: '#ef4444', description: 'Armed forces unit from squad to army level', keyAttributes: ['orbat_designation', 'branch', 'equipment_type', 'last_known_location'] },
  { name: 'Vessel', category: 'Maritime', domain: 'GEOINT', attributes: 22, instances: 847293, color: '#14b8a6', description: 'Maritime vessel tracked via AIS/satellite', keyAttributes: ['mmsi', 'imo', 'flag_state', 'vessel_type', 'cargo_type'] },
  { name: 'Aircraft', category: 'Aviation', domain: 'SIGINT', attributes: 19, instances: 264831, color: '#f59e0b', description: 'Aircraft tracked via ADS-B/radar', keyAttributes: ['icao24', 'callsign', 'type_code', 'military_flag'] },
  { name: 'ThreatActor', category: 'Person/Org', domain: 'CYBER', attributes: 28, instances: 4521, color: '#ec4899', description: 'Known or suspected threat actor (state/non-state)', keyAttributes: ['aliases', 'attribution_confidence', 'ttps', 'target_sectors'] },
  { name: 'CyberIndicator', category: 'Cyber', domain: 'CYBER', attributes: 15, instances: 2847102, color: '#8b5cf6', description: 'IOC: IP, domain, hash, URL, email', keyAttributes: ['indicator_type', 'risk_score', 'first_seen', 'last_seen', 'malware_family'] },
  { name: 'SanctionedEntity', category: 'Financial', domain: 'FININT', attributes: 20, instances: 34892, color: '#06b6d4', description: 'OFAC/EU/UN sanctioned individual or organization', keyAttributes: ['sdn_type', 'programs', 'aliases', 'addresses', 'id_numbers'] },
  { name: 'ConflictEvent', category: 'Geopolitical', domain: 'OSINT', attributes: 16, instances: 4892347, color: '#3b82f6', description: 'ACLED-style conflict event', keyAttributes: ['event_type', 'fatalities', 'actors', 'admin1', 'source_count'] },
  { name: 'NovelSignal', category: 'Signal', domain: 'FUSION', attributes: 14, instances: 8472, color: '#fbbf24', description: 'Detected vector drift / pattern deviation', keyAttributes: ['signal_type', 'drift_magnitude', 'source_domains', 'convergence_score'] },
  { name: 'Prediction', category: 'Prediction', domain: 'PREDICTION', attributes: 12, instances: 28473, color: '#f97316', description: 'Forecasted future event with probability', keyAttributes: ['event_type', 'probability', 'timeframe', 'model', 'brier_score'] },
  { name: 'Satellite', category: 'Aviation', domain: 'GEOINT', attributes: 16, instances: 8942, color: '#f59e0b', description: 'Orbital object tracked via CelesTrak/SpaceTrack', keyAttributes: ['norad_id', 'intl_designator', 'orbit_type', 'country_owner'] },
  { name: 'BGPRoute', category: 'Cyber', domain: 'CYBER', attributes: 11, instances: 924817, color: '#8b5cf6', description: 'Border Gateway Protocol route announcement', keyAttributes: ['prefix', 'as_path', 'origin_as', 'hijack_flag'] },
  { name: 'FinancialTransaction', category: 'Financial', domain: 'FININT', attributes: 14, instances: 1284712, color: '#06b6d4', description: 'Suspicious or notable financial movement', keyAttributes: ['amount', 'currency', 'sender', 'receiver', 'swift_code'] },
  { name: 'RadioBroadcast', category: 'Signal', domain: 'SIGINT', attributes: 13, instances: 45821, color: '#fbbf24', description: 'Intercepted or monitored radio transmission', keyAttributes: ['frequency', 'mode', 'language', 'transcript', 'paralinguistic_features'] },
  { name: 'InfrastructureSite', category: 'Infrastructure', domain: 'GEOINT', attributes: 17, instances: 89472, color: '#6366f1', description: 'Critical infrastructure (energy, transport, comms)', keyAttributes: ['site_type', 'operator', 'capacity', 'vulnerability_score'] },
];

const SAMPLE_EDGES: EdgeType[] = [
  { name: 'OPERATES_IN', sourceVertex: 'ThreatActor', targetVertex: 'Country', category: 'Attribution', attributes: 4, instances: 12847, directed: true, decayHours: 720 },
  { name: 'ALLIED_WITH', sourceVertex: 'Country', targetVertex: 'Country', category: 'Geopolitical', attributes: 3, instances: 892, directed: false, decayHours: 2160 },
  { name: 'SANCTIONS_TARGET', sourceVertex: 'Country', targetVertex: 'SanctionedEntity', category: 'Financial', attributes: 5, instances: 34892, directed: true, decayHours: 2160 },
  { name: 'FLIES_OVER', sourceVertex: 'Aircraft', targetVertex: 'Country', category: 'Aviation', attributes: 3, instances: 4892347, directed: true, decayHours: 6 },
  { name: 'DOCKED_AT', sourceVertex: 'Vessel', targetVertex: 'InfrastructureSite', category: 'Maritime', attributes: 4, instances: 284721, directed: true, decayHours: 48 },
  { name: 'CONVERGES_WITH', sourceVertex: 'NovelSignal', targetVertex: 'NovelSignal', category: 'Fusion', attributes: 3, instances: 8472, directed: false, decayHours: 168 },
  { name: 'PREDICTS', sourceVertex: 'Prediction', targetVertex: 'ConflictEvent', category: 'Prediction', attributes: 5, instances: 28473, directed: true, decayHours: 336 },
  { name: 'TARGETS', sourceVertex: 'ThreatActor', targetVertex: 'InfrastructureSite', category: 'Cyber', attributes: 6, instances: 45821, directed: true, decayHours: 720 },
  { name: 'TRANSACTS_WITH', sourceVertex: 'SanctionedEntity', targetVertex: 'SanctionedEntity', category: 'Financial', attributes: 7, instances: 1284712, directed: true, decayHours: 168 },
  { name: 'EMITS_SIGNAL', sourceVertex: 'RadioBroadcast', targetVertex: 'NovelSignal', category: 'Signal', attributes: 3, instances: 12847, directed: true, decayHours: 24 },
];

export default function SchemaExplorerPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'vertices' | 'edges' | 'overview'>('overview');
  const [selectedVertex, setSelectedVertex] = useState<VertexType | null>(null);

  const filteredVertices = useMemo(() => {
    return SAMPLE_VERTICES.filter(v => {
      const matchesSearch = !searchQuery || v.name.toLowerCase().includes(searchQuery.toLowerCase()) || v.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || v.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const filteredEdges = useMemo(() => {
    return SAMPLE_EDGES.filter(e => {
      const matchesSearch = !searchQuery || e.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || e.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const totalVertexInstances = SAMPLE_VERTICES.reduce((a, v) => a + v.instances, 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center">
              <Database className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Schema Registry</h1>
              <p className="text-xs text-zinc-500">571 vertex types • 943 edge types • 14.9M live vertices • 4.4M edges • TigerGraph Savanna</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1">
              <Download className="w-3.5 h-3.5" /> Export GSQL
            </button>
          </div>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="border-b border-zinc-800 px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vertices, edges, attributes..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* Tab Selector */}
          <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-lg p-0.5">
            {(['overview', 'vertices', 'edges'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                  activeTab === tab ? 'bg-cyan-500/20 text-cyan-400' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Banner */}
            <div className="grid grid-cols-6 gap-4">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-emerald-400">571</div>
                <div className="text-[10px] text-zinc-500 mt-1">Vertex Types</div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-cyan-400">943</div>
                <div className="text-[10px] text-zinc-500 mt-1">Edge Types</div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">14.9M</div>
                <div className="text-[10px] text-zinc-500 mt-1">Live Vertices</div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">4.4M</div>
                <div className="text-[10px] text-zinc-500 mt-1">Live Edges</div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">12</div>
                <div className="text-[10px] text-zinc-500 mt-1">Schema Versions</div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-red-400">1,500+</div>
                <div className="text-[10px] text-zinc-500 mt-1">Signal Rules</div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div>
              <h2 className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-medium mb-3">Schema Categories</h2>
              <div className="grid grid-cols-4 gap-3">
                {Object.entries(VERTEX_CATEGORIES).map(([name, info]) => {
                  const Icon = info.icon;
                  return (
                    <button
                      key={name}
                      onClick={() => { setSelectedCategory(selectedCategory === name ? null : name); setActiveTab('vertices'); }}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        selectedCategory === name
                          ? 'bg-zinc-800/80 border-zinc-600'
                          : 'bg-zinc-900/30 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${info.color}15`, border: `1px solid ${info.color}30` }}>
                        <Icon className="w-4 h-4" style={{ color: info.color }} />
                      </div>
                      <div className="text-left">
                        <span className="text-xs text-zinc-300 font-medium block">{name}</span>
                        <span className="text-[10px] text-zinc-500">{info.count} types</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Schema Architecture */}
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-5">
              <h2 className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-medium mb-3">Architecture Notes</h2>
              <div className="grid grid-cols-2 gap-4 text-[10px] text-zinc-400">
                <div>
                  <p className="text-zinc-300 font-medium mb-1">Schema Generation</p>
                  <p>Auto-generated from ontology_schema.yaml via GSQL Generator v2.1. Extensions v3-v12 auto-discovered by schema_registry.py.</p>
                </div>
                <div>
                  <p className="text-zinc-300 font-medium mb-1">DDL Limitation</p>
                  <p>TigerGraph Savanna: schema changes ONLY via GraphStudio "Design Schema" UI. Code documents schema; actual DDL is manual click-by-click.</p>
                </div>
                <div>
                  <p className="text-zinc-300 font-medium mb-1">Temporal Decay</p>
                  <p>Every edge type has configurable decay (Weibull). ADS-B: 6h, Sanctions: 2160h, Cyber IOCs: 168h. Auto-materialized by gzm_decay_materialize query.</p>
                </div>
                <div>
                  <p className="text-zinc-300 font-medium mb-1">Algorithms Installed</p>
                  <p>10 custom: pagerank_pers, betweenness_cent, louvain, decay_materialize, convergence_signals, temporal_anomaly, country_risk_v2, sanctions_cascade, chokepoint_score, threat_actor_score</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vertices Tab */}
        {activeTab === 'vertices' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">{filteredVertices.length} of 571 vertex types shown</span>
              {selectedCategory && (
                <button onClick={() => setSelectedCategory(null)} className="text-[10px] text-cyan-400 hover:text-cyan-300">Clear filter</button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-2">
              {filteredVertices.map((vertex) => (
                <motion.div
                  key={vertex.name}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors cursor-pointer"
                  onClick={() => setSelectedVertex(selectedVertex?.name === vertex.name ? null : vertex)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-8 rounded-full" style={{ backgroundColor: vertex.color }} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white font-mono">{vertex.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${vertex.color}20`, color: vertex.color }}>{vertex.category}</span>
                        <span className="text-[9px] text-zinc-600">{vertex.domain}</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{vertex.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono text-zinc-300">{vertex.instances.toLocaleString()}</div>
                      <div className="text-[9px] text-zinc-500">{vertex.attributes} attrs</div>
                    </div>
                  </div>

                  {/* Expanded view */}
                  <AnimatePresence>
                    {selectedVertex?.name === vertex.name && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-3 border-t border-zinc-800">
                          <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-medium">Key Attributes</span>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {vertex.keyAttributes.map((attr) => (
                              <span key={attr} className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">{attr}</span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Edges Tab */}
        {activeTab === 'edges' && (
          <div className="space-y-3">
            <span className="text-xs text-zinc-500">{filteredEdges.length} of 943 edge types shown</span>
            <div className="grid grid-cols-1 gap-2">
              {filteredEdges.map((edge) => (
                <div key={edge.name} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">{edge.sourceVertex}</span>
                      <ArrowRight className="w-4 h-4 text-zinc-600" />
                      <span className="text-sm font-bold text-white font-mono">{edge.name}</span>
                      <ArrowRight className="w-4 h-4 text-zinc-600" />
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">{edge.targetVertex}</span>
                    </div>
                    <div className="flex items-center gap-4 text-[10px]">
                      <span className="text-zinc-500">{edge.instances.toLocaleString()} instances</span>
                      <span className="text-zinc-500">{edge.attributes} attrs</span>
                      <span className="text-zinc-500 font-mono">decay: {edge.decayHours}h</span>
                      <span className={`px-1.5 py-0.5 rounded ${edge.directed ? 'bg-blue-500/10 text-blue-400' : 'bg-zinc-700 text-zinc-400'}`}>
                        {edge.directed ? 'directed' : 'undirected'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
