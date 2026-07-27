'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Plus, Trash2, Bell, BellOff, Download, Upload, Search, AlertTriangle, Clock, Target, Filter, Shield } from 'lucide-react';

interface WatchlistEntry {
  id: string;
  selector: string;
  selector_type: 'entity_id' | 'email' | 'ip' | 'phone' | 'name' | 'keyword' | 'domain' | 'imsi';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  category: string;
  description: string;
  enabled: boolean;
  hits: number;
  last_hit: string | null;
  created: string;
}

interface TipAlert {
  id: string;
  selector: string;
  matched_in: string;
  source_collector: string;
  timestamp: string;
  severity: string;
  snippet: string;
}

const SEVERITY_COLORS: Record<string, string> = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#f59e0b', LOW: '#3b82f6', INFO: '#6b7280' };
const SEVERITY_BG: Record<string, string> = { CRITICAL: 'bg-red-500/20', HIGH: 'bg-orange-500/20', MEDIUM: 'bg-yellow-500/20', LOW: 'bg-blue-500/20', INFO: 'bg-zinc-500/20' };

const MOCK_ENTRIES: WatchlistEntry[] = [
  { id: 'w1', selector: 'entity_test_vehicle_001', selector_type: 'entity_id', severity: 'CRITICAL', category: 'military', description: 'Tracked T-72 column near Zaporizhzhia', enabled: true, hits: 14, last_hit: new Date(Date.now() - 3600000).toISOString(), created: '2026-07-20T00:00:00Z' },
  { id: 'w2', selector: 'viktor.bout@proton.me', selector_type: 'email', severity: 'HIGH', category: 'arms_trafficking', description: 'Known arms dealer communication channel', enabled: true, hits: 3, last_hit: new Date(Date.now() - 86400000).toISOString(), created: '2026-07-15T00:00:00Z' },
  { id: 'w3', selector: '185.174.137.0/24', selector_type: 'ip', severity: 'MEDIUM', category: 'cyber', description: 'GRU Unit 74455 infrastructure range', enabled: true, hits: 47, last_hit: new Date(Date.now() - 7200000).toISOString(), created: '2026-07-01T00:00:00Z' },
  { id: 'w4', selector: '+7 495 539 2187', selector_type: 'phone', severity: 'HIGH', category: 'sigint', description: 'Kaliningrad military command post', enabled: true, hits: 8, last_hit: new Date(Date.now() - 14400000).toISOString(), created: '2026-07-10T00:00:00Z' },
  { id: 'w5', selector: 'convoy', selector_type: 'keyword', severity: 'LOW', category: 'osint', description: 'Track convoy mentions in Telegram milbloggers', enabled: true, hits: 234, last_hit: new Date(Date.now() - 1800000).toISOString(), created: '2026-06-15T00:00:00Z' },
  { id: 'w6', selector: '250-01-XXXXXX', selector_type: 'imsi', severity: 'CRITICAL', category: 'sigint', description: 'Suspected foreign agent device in Ukraine MCC', enabled: false, hits: 2, last_hit: new Date(Date.now() - 259200000).toISOString(), created: '2026-07-22T00:00:00Z' },
];

const MOCK_TIPS: TipAlert[] = [
  { id: 't1', selector: 'entity_test_vehicle_001', matched_in: 'satellite_change_detection', source_collector: 'satellite_change_detection', timestamp: new Date(Date.now() - 1800000).toISOString(), severity: 'CRITICAL', snippet: 'Movement detected: 3 vehicles matching signature at 47.51, 34.59' },
  { id: 't2', selector: '185.174.137.0/24', matched_in: 'bgp_monitor', source_collector: 'bgp_hijack_detector', timestamp: new Date(Date.now() - 3600000).toISOString(), severity: 'MEDIUM', snippet: 'New BGP announcement from AS 197068 advertising this prefix via non-standard path' },
  { id: 't3', selector: 'convoy', matched_in: 'telegram_collector', source_collector: 'telegram_collector', timestamp: new Date(Date.now() - 900000).toISOString(), severity: 'LOW', snippet: '"Large convoy spotted on M18 highway heading south from Melitopol"' },
];

export default function WatchlistPage() {
  const [entries, setEntries] = useState<WatchlistEntry[]>(MOCK_ENTRIES);
  const [tips] = useState<TipAlert[]>(MOCK_TIPS);
  const [showAdd, setShowAdd] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [newSelector, setNewSelector] = useState('');
  const [newSeverity, setNewSeverity] = useState<string>('MEDIUM');
  const [newDescription, setNewDescription] = useState('');

  const filteredEntries = entries.filter(e => filterSeverity === 'all' || e.severity === filterSeverity);

  const toggleEntry = (id: string) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, enabled: !e.enabled } : e));
  };

  const removeEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const addEntry = () => {
    if (!newSelector.trim()) return;
    const entry: WatchlistEntry = {
      id: `w_${Date.now()}`, selector: newSelector, selector_type: 'keyword',
      severity: newSeverity as WatchlistEntry['severity'], category: 'custom',
      description: newDescription || 'User-added selector', enabled: true,
      hits: 0, last_hit: null, created: new Date().toISOString(),
    };
    setEntries(prev => [entry, ...prev]);
    setNewSelector('');
    setNewDescription('');
    setShowAdd(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Eye className="w-6 h-6 text-red-400" />
            Watchlist
          </h1>
          <p className="text-sm text-zinc-400 mt-1">{entries.length} selectors monitored | {entries.filter(e => e.enabled).length} active</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-xs font-bold">
            <Plus className="w-3.5 h-3.5" /> ADD SELECTOR
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 border border-zinc-700 text-xs font-mono hover:bg-zinc-700">
            <Upload className="w-3 h-3" /> IMPORT
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 border border-zinc-700 text-xs font-mono hover:bg-zinc-700">
            <Download className="w-3 h-3" /> EXPORT
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* LEFT: Watchlist entries */}
        <div className="col-span-2">
          {/* Filter bar */}
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-3.5 h-3.5 text-zinc-500" />
            {['all', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => (
              <button key={sev} onClick={() => setFilterSeverity(sev)} className={`text-[10px] font-mono px-2 py-1 rounded border ${filterSeverity === sev ? 'border-purple-500 bg-purple-500/20 text-purple-300' : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
                {sev === 'all' ? 'ALL' : sev}
              </button>
            ))}
          </div>

          {/* Entries */}
          <div className="space-y-2">
            {filteredEntries.map(entry => (
              <div key={entry.id} className={`bg-zinc-900 border border-zinc-800 rounded-lg p-3 ${!entry.enabled ? 'opacity-50' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[entry.severity] }} />
                    <code className="text-sm font-mono text-zinc-200">{entry.selector}</code>
                    <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${SEVERITY_BG[entry.severity]}`} style={{ color: SEVERITY_COLORS[entry.severity] }}>
                      {entry.severity}
                    </span>
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">{entry.selector_type}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono text-zinc-500">{entry.hits} hits</span>
                    <button onClick={() => toggleEntry(entry.id)} className="p-1 rounded hover:bg-zinc-800" title={entry.enabled ? 'Disable' : 'Enable'}>
                      {entry.enabled ? <Bell className="w-3.5 h-3.5 text-emerald-400" /> : <BellOff className="w-3.5 h-3.5 text-zinc-600" />}
                    </button>
                    <button onClick={() => removeEntry(entry.id)} className="p-1 rounded hover:bg-zinc-800 text-zinc-600 hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mt-1 flex items-center gap-3 text-[9px] font-mono text-zinc-500">
                  <span>{entry.description}</span>
                  {entry.last_hit && <span><Clock className="w-3 h-3 inline" /> Last hit: {new Date(entry.last_hit).toLocaleString()}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Live tip feed */}
        <div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="px-3 py-2 border-b border-zinc-800 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              <span className="text-xs font-bold">LIVE TIPS</span>
              <span className="text-[9px] font-mono text-zinc-500 ml-auto">{tips.length} recent</span>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {tips.map(tip => (
                <div key={tip.id} className="px-3 py-2.5 border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[tip.severity] }} />
                    <code className="text-[10px] font-mono text-zinc-300">{tip.selector}</code>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-relaxed">{tip.snippet}</p>
                  <div className="mt-1 flex items-center gap-2 text-[8px] font-mono text-zinc-600">
                    <span>{tip.source_collector}</span>
                    <span>{new Date(tip.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ADD MODAL */}
      <AnimatePresence>
        {showAdd && (
          <motion.div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAdd(false)}>
            <motion.div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-[500px]" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-4">Add Selector to Watchlist</h2>
              <div className="space-y-3">
                <input placeholder="Selector (email, IP, name, entity ID, keyword...)" className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm font-mono" value={newSelector} onChange={e => setNewSelector(e.target.value)} />
                <select className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm font-mono" value={newSeverity} onChange={e => setNewSeverity(e.target.value)}>
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                  <option value="INFO">INFO</option>
                </select>
                <input placeholder="Description (optional)" className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm" value={newDescription} onChange={e => setNewDescription(e.target.value)} />
                <div className="flex gap-2 pt-2">
                  <button onClick={addEntry} className="flex-1 py-2 rounded bg-red-600 hover:bg-red-500 text-sm font-bold">ADD TO WATCHLIST</button>
                  <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded bg-zinc-800 border border-zinc-700 text-sm">Cancel</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
