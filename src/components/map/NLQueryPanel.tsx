'use client';

import { useState } from 'react';
import { queryGEOINT } from '@/lib/gzm-client';

/**
 * Natural Language Query Panel
 * Allows analysts to ask questions in plain English.
 * Routes to GZM GEOINT NL engine (nl_chat_gsql_engine).
 *
 * Examples:
 * - "Show me all SAR detections in the Black Sea from last 48 hours"
 * - "What entities have convergence score above 0.8?"
 * - "Find dark vessels near Crimea"
 * - "Which emitters were active near 35.2N, 33.9E?"
 */

interface NLQueryPanelProps {
  visible: boolean;
  onClose: () => void;
  onResult?: (result: any) => void;
}

export function NLQueryPanel({ visible, onClose, onResult }: NLQueryPanelProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sessionId] = useState(() => crypto.randomUUID());

  if (!visible) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await queryGEOINT(query, sessionId);
      setResults(prev => [...prev, { query, result, timestamp: new Date().toISOString() }]);
      onResult?.(result);
      setQuery('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-12 left-60 right-4 z-50 max-h-80 bg-black/95 backdrop-blur-sm border border-gray-700 rounded-lg flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 text-sm">⌘</span>
          <span className="text-xs text-gray-300 font-medium">Intelligence Query</span>
          <span className="text-[9px] text-gray-600">(NL → GSQL → TigerGraph)</span>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white text-xs">✕</button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-48">
        {results.map((r, i) => (
          <div key={i} className="space-y-1">
            <div className="text-[10px] text-cyan-400 font-mono"> {r.query}</div>
            <div className="text-[10px] text-gray-400 bg-gray-900 rounded p-2 font-mono whitespace-pre-wrap">
              {typeof r.result === 'string' ? r.result : JSON.stringify(r.result, null, 2).slice(0, 500)}
            </div>
          </div>
        ))}
        {error && <div className="text-[10px] text-red-400">{error}</div>}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-2 border-t border-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Ask: 'Show SAR detections in Black Sea last 48h'..."
            className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-600"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-3 py-1.5 text-xs bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded transition-colors"
          >
            {loading ? '...' : 'Query'}
          </button>
        </div>
        <div className="mt-1 flex gap-2">
          {['Dark vessels near Crimea', 'Convergence > 0.8', 'SIGINT last 6h'].map(example => (
            <button
              key={example}
              type="button"
              onClick={() => setQuery(example)}
              className="text-[9px] text-gray-600 hover:text-gray-400 transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}
