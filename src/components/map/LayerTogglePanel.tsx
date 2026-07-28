'use client';

import { useState } from 'react';
import { INT_LAYER_CONFIGS, type IntDomain } from './layers/int-layers';

/**
 * Layer Toggle Panel
 * Left sidebar showing all 10 INT domains with toggle switches.
 * Each domain shows: icon, label, event count, on/off toggle.
 */

interface LayerTogglePanelProps {
  activeLayers: Set<IntDomain>;
  onToggle: (domain: IntDomain) => void;
  eventCounts: Record<IntDomain, number>;
  className?: string;
}

export function LayerTogglePanel({ activeLayers, onToggle, eventCounts, className = '' }: LayerTogglePanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed left-2 top-16 z-50 bg-black/80 border border-gray-700 rounded-lg p-2 text-white hover:bg-gray-800 transition-colors"
        title="Show layers"
      >
        <span className="text-lg">◧</span>
      </button>
    );
  }

  return (
    <div className={`fixed left-2 top-16 z-50 bg-black/90 backdrop-blur-sm border border-gray-700 rounded-lg p-3 w-56 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Intelligence Layers</h3>
        <button
          onClick={() => setCollapsed(true)}
          className="text-gray-500 hover:text-white text-sm"
        >
          ✕
        </button>
      </div>

      <div className="space-y-1">
        {INT_LAYER_CONFIGS.map(config => {
          const active = activeLayers.has(config.domain);
          const count = eventCounts[config.domain] || 0;

          return (
            <button
              key={config.domain}
              onClick={() => onToggle(config.domain)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-all ${
                active
                  ? 'bg-gray-800 border border-gray-600'
                  : 'bg-transparent border border-transparent hover:bg-gray-800/50'
              }`}
            >
              <span className="text-sm">{config.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: active
                        ? `rgb(${config.color.join(',')})`
                        : '#4a4a4a',
                    }}
                  />
                  <span className={`text-xs font-medium truncate ${active ? 'text-white' : 'text-gray-500'}`}>
                    {config.label}
                  </span>
                </div>
              </div>
              <span className={`text-[10px] tabular-nums ${active ? 'text-gray-400' : 'text-gray-600'}`}>
                {count > 999 ? `${(count / 1000).toFixed(1)}k` : count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 pt-2 border-t border-gray-800">
        <div className="flex gap-1">
          <button
            onClick={() => INT_LAYER_CONFIGS.forEach(c => !activeLayers.has(c.domain) && onToggle(c.domain))}
            className="flex-1 text-[10px] text-gray-500 hover:text-white py-1 rounded hover:bg-gray-800 transition-colors"
          >
            All On
          </button>
          <button
            onClick={() => INT_LAYER_CONFIGS.forEach(c => activeLayers.has(c.domain) && onToggle(c.domain))}
            className="flex-1 text-[10px] text-gray-500 hover:text-white py-1 rounded hover:bg-gray-800 transition-colors"
          >
            All Off
          </button>
        </div>
      </div>
    </div>
  );
}
