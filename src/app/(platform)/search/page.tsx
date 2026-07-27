'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Globe, User, Mail, Phone, Wifi, Hash, Clock, ExternalLink, Shield, Filter, Download, Zap, ChevronRight } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface SearchResult {
  id: string;
  source: string;
  entity_type: string;
  title: string;
  description: string;
  confidence: number;
  relevance_score: number;
  timestamp: string;
  provenance: { reliability: string; source_grade: string };
  lat?: number;
  lon?: number;
  related_entities: string[];
}

interface SearchState {
  query: string;
  selector_type: 'auto' | 'email' | 'ip' | 'phone' | 'name' | 'entity_id' | 'location' | 'domain';
  results: SearchResult[];
  searching: boolean;
  backends_queried: string[];
  search_time_ms: number;
  total_count: number;
}

// =============================================================================
// SELECTOR TYPE DETECTION
// =============================================================================

function detectSelectorType(query: string): string {
  if (/^[\w.-]+@[\w.-]+\.[a-z]{2,}$/i.test(query)) return 'email';
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(query)) return 'ip';
  if (/^[+]?\d[\d\s()-]{7,}$/.test(query)) return 'phone';
  if (/^entity_|^trk_|^[a-f0-9]{24}$/.test(query)) return 'entity_id';
  if (/^\d+\.\d+,\s*-?\d+\.\d+$/.test(query)) return 'location';
  if (/^[\w.-]+\.[a-z]{2,}$/.test(query)) return 'domain';
  return 'name';
}

const SELECTOR_ICONS: Record<string, typeof Mail> = {
  email: Mail,
  ip: Wifi,
  phone: Phone,
  name: User,
  entity_id: Hash,
  location: Globe,
  domain: Globe,
  auto: Search,
};

// =============================================================================
// MOCK SEARCH
// =============================================================================

function mockSearch(query: string): SearchResult[] {
  if (!query.trim()) return [];
  return [
    { id: 'r1', source: 'tigergraph', entity_type: 'Person', title: `Entity match: "${query}"`, description: `Found in knowledge graph with 47 connections. Last activity 2h ago. PageRank: 0.0034 (top 2% of graph).`, confidence: 0.92, relevance_score: 0.95, timestamp: new Date().toISOString(), provenance: { reliability: 'A', source_grade: '1' }, related_entities: ['entity_002', 'entity_045', 'org_017'] },
    { id: 'r2', source: 'xkeyscore', entity_type: 'Selector', title: `XKEYSCORE hit: communications metadata`, description: `Selector matched in SIGINT metadata. 3 intercepts in last 72h from cell_survey collector. Geolocation: Zaporizhzhia oblast.`, confidence: 0.78, relevance_score: 0.88, timestamp: new Date(Date.now() - 3600000).toISOString(), provenance: { reliability: 'B', source_grade: '2' }, lat: 47.5, lon: 34.6, related_entities: ['emitter_001'] },
    { id: 'r3', source: 'graph_rag', entity_type: 'Document', title: `Related intelligence report`, description: `ICD 203 report from Jul 24 mentions this selector in context of military logistics movement. Confidence: moderate. Source: satellite + OSINT convergence.`, confidence: 0.65, relevance_score: 0.72, timestamp: new Date(Date.now() - 86400000).toISOString(), provenance: { reliability: 'B', source_grade: '3' }, related_entities: ['report_2024_07_24_001'] },
    { id: 'r4', source: 'telegram_collector', entity_type: 'Message', title: `OSINT mention in Telegram channel`, description: `Referenced in milblogger channel (142K subscribers). Context: troop movement discussion. Sentiment: hostile. Language: Russian (auto-translated).`, confidence: 0.55, relevance_score: 0.61, timestamp: new Date(Date.now() - 7200000).toISOString(), provenance: { reliability: 'C', source_grade: '3' }, related_entities: [] },
    { id: 'r5', source: 'sanctions_db', entity_type: 'Organization', title: `Sanctions list proximity (2nd degree)`, description: `Not directly sanctioned, but connected to OFAC SDN entity via shared ownership structure. Path length: 2 hops through Cyprus-registered shell company.`, confidence: 0.71, relevance_score: 0.58, timestamp: new Date(Date.now() - 172800000).toISOString(), provenance: { reliability: 'A', source_grade: '2' }, related_entities: ['org_sanctioned_001', 'org_shell_cy_014'] },
  ];
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function SearchPage() {
  const [state, setState] = useState<SearchState>({
    query: '', selector_type: 'auto', results: [], searching: false,
    backends_queried: [], search_time_ms: 0, total_count: 0,
  });
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cmd+K focus
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const executeSearch = async (query: string) => {
    if (!query.trim()) return;
    setState(prev => ({ ...prev, searching: true, query }));

    // Simulate API call
    await new Promise(r => setTimeout(r, 800));

    const results = mockSearch(query);
    const detectedType = detectSelectorType(query);

    setState({
      query,
      selector_type: detectedType as SearchState['selector_type'],
      results,
      searching: false,
      backends_queried: ['tigergraph', 'xkeyscore', 'graph_rag', 'telegram_collector', 'sanctions_db'],
      search_time_ms: 247,
      total_count: results.length,
    });

    setHistory(prev => [query, ...prev.filter(h => h !== query)].slice(0, 20));
  };

  const SelectorIcon = SELECTOR_ICONS[state.selector_type] || Search;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      {/* SEARCH BAR */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="relative">
          <SelectorIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search entities, selectors, locations, IPs, emails, phones... (Cmd+K)"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-12 pr-24 py-4 text-lg font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20"
            value={state.query}
            onChange={e => setState(prev => ({ ...prev, query: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && executeSearch(state.query)}
          />
          <button
            onClick={() => executeSearch(state.query)}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-bold transition-colors"
          >
            SEARCH
          </button>
        </div>

        {/* Detected type badge */}
        {state.query && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[10px] font-mono text-zinc-500">Detected:</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
              {detectSelectorType(state.query).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* SEARCH METADATA */}
      {state.results.length > 0 && (
        <div className="max-w-4xl mx-auto mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs font-mono text-zinc-500">
            <span>{state.total_count} results</span>
            <span>{state.search_time_ms}ms</span>
            <span>{state.backends_queried.length} backends</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-zinc-400 hover:bg-zinc-700">
              <Download className="w-3 h-3" /> JSON
            </button>
            <button className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-zinc-400 hover:bg-zinc-700">
              <Download className="w-3 h-3" /> STIX
            </button>
          </div>
        </div>
      )}

      {/* RESULTS */}
      <div className="max-w-4xl mx-auto">
        {state.searching && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full" />
            <span className="ml-3 text-sm text-zinc-400 font-mono">Searching {state.backends_queried.length || 5} backends...</span>
          </div>
        )}

        <AnimatePresence>
          {state.results.map((result, i) => (
            <motion.div
              key={result.id}
              className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-3 hover:border-zinc-700 transition-colors cursor-pointer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">{result.source}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">{result.entity_type}</span>
                  <h3 className="text-sm font-medium text-zinc-200">{result.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    {(result.confidence * 100).toFixed(0)}% conf
                  </span>
                  <span className="text-[9px] font-mono" title="NATO Admiralty Code">
                    <Shield className="w-3 h-3 inline text-zinc-500" /> {result.provenance.reliability}{result.provenance.source_grade}
                  </span>
                </div>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed mb-2">{result.description}</p>
              <div className="flex items-center gap-3 text-[9px] font-mono text-zinc-600">
                <span><Clock className="w-3 h-3 inline" /> {new Date(result.timestamp).toLocaleString()}</span>
                {result.related_entities.length > 0 && (
                  <span className="flex items-center gap-0.5">
                    <ChevronRight className="w-3 h-3" />{result.related_entities.length} related
                  </span>
                )}
                {result.lat && <span><Globe className="w-3 h-3 inline" /> {result.lat.toFixed(2)}, {result.lon?.toFixed(2)}</span>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty state */}
        {!state.searching && state.results.length === 0 && !state.query && (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-zinc-500 mb-2">Federated Intelligence Search</h2>
            <p className="text-sm text-zinc-600 max-w-md mx-auto">
              Search across TigerGraph knowledge graph, XKEYSCORE selector store,
              Graph RAG, OSINT collectors, and sanctions databases simultaneously.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {['Viktor Bout', '192.168.1.1', '+7 495 123 4567', 'entity_test_vehicle_001', 'Crimean Bridge'].map(example => (
                <button
                  key={example}
                  onClick={() => { setState(prev => ({ ...prev, query: example })); executeSearch(example); }}
                  className="text-[10px] font-mono px-2.5 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SEARCH HISTORY */}
      {history.length > 0 && (
        <div className="max-w-4xl mx-auto mt-8 pt-6 border-t border-zinc-800">
          <span className="text-[10px] font-mono text-zinc-500 mb-2 block">RECENT SEARCHES</span>
          <div className="flex flex-wrap gap-1.5">
            {history.slice(0, 10).map(h => (
              <button
                key={h}
                onClick={() => { setState(prev => ({ ...prev, query: h })); executeSearch(h); }}
                className="text-[9px] font-mono px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
              >
                <Clock className="w-2.5 h-2.5 inline mr-1" />{h}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
