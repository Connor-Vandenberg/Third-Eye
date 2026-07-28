'use client';

import { useState, useEffect } from 'react';
import { fetchEntityDetail, type EntityDetail } from '@/lib/gzm-client';

/**
 * Entity Detail Panel
 * Shows full entity profile when clicked on map.
 * Includes: name, type, confidence, timeline, relationships (mini graph),
 * associated signals, and action buttons.
 *
 * Connected to: GZM API /api/entities/{id}
 */

interface EntityDetailPanelProps {
  entityId: string | null;
  onClose: () => void;
  onTaskISR: (lat: number, lng: number) => void;
}

export function EntityDetailPanel({ entityId, onClose, onTaskISR }: EntityDetailPanelProps) {
  const [entity, setEntity] = useState<EntityDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!entityId) {
      setEntity(null);
      return;
    }

    setLoading(true);
    setError(null);
    fetchEntityDetail(entityId)
      .then(setEntity)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [entityId]);

  if (!entityId) return null;

  return (
    <div className="fixed right-2 top-16 z-50 w-80 max-h-[80vh] overflow-y-auto bg-black/95 backdrop-blur-sm border border-gray-700 rounded-lg">
      {/* Header */}
      <div className="sticky top-0 px-4 py-3 border-b border-gray-800 bg-black/95 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">Entity Details</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
      </div>

      {loading && (
        <div className="p-4 text-center text-gray-500 text-xs">Loading...</div>
      )}

      {error && (
        <div className="p-4 text-center text-red-400 text-xs">{error}</div>
      )}

      {entity && (
        <div className="p-4 space-y-4">
          {/* Identity */}
          <div>
            <div className="text-white font-medium text-sm">{entity.name}</div>
            <div className="text-gray-500 text-[10px] uppercase">{entity.type}</div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-900 rounded px-2 py-1.5">
              <div className="text-[9px] text-gray-500">CONFIDENCE</div>
              <div className="text-sm text-white font-mono">{(entity.confidence * 100).toFixed(0)}%</div>
            </div>
            <div className="bg-gray-900 rounded px-2 py-1.5">
              <div className="text-[9px] text-gray-500">INT DOMAINS</div>
              <div className="text-sm text-white font-mono">{entity.int_domains.length}</div>
            </div>
            <div className="bg-gray-900 rounded px-2 py-1.5">
              <div className="text-[9px] text-gray-500">FIRST SEEN</div>
              <div className="text-[10px] text-white font-mono">{new Date(entity.first_seen).toLocaleDateString()}</div>
            </div>
            <div className="bg-gray-900 rounded px-2 py-1.5">
              <div className="text-[9px] text-gray-500">LAST SEEN</div>
              <div className="text-[10px] text-white font-mono">{new Date(entity.last_seen).toLocaleDateString()}</div>
            </div>
          </div>

          {/* INT Domains */}
          <div>
            <div className="text-[9px] text-gray-500 uppercase mb-1">Active Domains</div>
            <div className="flex flex-wrap gap-1">
              {entity.int_domains.map(domain => (
                <span
                  key={domain}
                  className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-gray-800 text-gray-300"
                >
                  {domain}
                </span>
              ))}
            </div>
          </div>

          {/* Mini Relationship Graph */}
          <div>
            <div className="text-[9px] text-gray-500 uppercase mb-1">Relationships ({entity.relationships.length})</div>
            <div className="max-h-28 overflow-y-auto space-y-1">
              {entity.relationships.slice(0, 10).map((rel, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px]">
                  <span className="text-cyan-400">→</span>
                  <span className="text-white flex-1 truncate">{rel.target}</span>
                  <span className="text-gray-600">{rel.type}</span>
                  <span className="text-gray-400 font-mono">{rel.weight.toFixed(2)}</span>
                </div>
              ))}
              {entity.relationships.length > 10 && (
                <div className="text-[9px] text-gray-600 italic">+{entity.relationships.length - 10} more</div>
              )}
            </div>
          </div>

          {/* Recent Signals */}
          <div>
            <div className="text-[9px] text-gray-500 uppercase mb-1">Recent Signals ({entity.signals.length})</div>
            <div className="max-h-24 overflow-y-auto space-y-1">
              {entity.signals.slice(0, 5).map((sig, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px] bg-gray-900 rounded px-2 py-1">
                  <span className="text-gray-400 font-mono">{new Date(sig.timestamp).toLocaleTimeString()}</span>
                  <span className="text-white">{sig.int_domain}</span>
                  <span className="text-gray-500 ml-auto">{(sig.confidence * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t border-gray-800">
            <button
              onClick={() => onTaskISR(entity.lat, entity.lng)}
              className="flex-1 py-1.5 text-[10px] font-medium bg-cyan-600 hover:bg-cyan-500 text-white rounded transition-colors"
            >
              🛸 Task ISR
            </button>
            <button className="flex-1 py-1.5 text-[10px] font-medium bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors">
              📊 Report
            </button>
            <button className="flex-1 py-1.5 text-[10px] font-medium bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors">
              📤 STIX
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
