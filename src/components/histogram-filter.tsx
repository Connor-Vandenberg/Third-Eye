'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Filter, X, ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';

export interface HistogramBucket {
  min: number;
  max: number;
  count: number;
  label?: string;
}

export interface HistogramFilterConfig {
  id: string;
  label: string;
  accessor: string;
  type: 'numeric' | 'categorical' | 'temporal';
  color?: string;
  unit?: string;
  bucketCount?: number;
}

interface RangeSelection {
  min: number;
  max: number;
}

interface CategoricalSelection {
  values: string[];
}

export interface HistogramFilterProps {
  data: any[];
  filters: HistogramFilterConfig[];
  onFilterChange: (filterId: string, selection: RangeSelection | CategoricalSelection | null) => void;
  activeFilters: Record<string, RangeSelection | CategoricalSelection | null>;
  collapsed?: boolean;
  className?: string;
}

function NumericHistogram({ data, config, selection, onSelect, onClear }: {
  data: any[];
  config: HistogramFilterConfig;
  selection: RangeSelection | null;
  onSelect: (range: RangeSelection) => void;
  onClear: () => void;
}) {
  const color = config.color || '#3b82f6';
  const bucketCount = config.bucketCount || 20;

  const { buckets, min, max } = useMemo(() => {
    const values = data.map(d => d[config.accessor]).filter(v => v != null && !isNaN(v)) as number[];
    if (values.length === 0) return { buckets: [], min: 0, max: 0 };

    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;
    const bucketSize = range / bucketCount;

    const bkts: HistogramBucket[] = Array.from({ length: bucketCount }, (_, i) => ({
      min: minVal + i * bucketSize,
      max: minVal + (i + 1) * bucketSize,
      count: 0,
    }));

    values.forEach(v => {
      const idx = Math.min(Math.floor((v - minVal) / bucketSize), bucketCount - 1);
      bkts[idx].count++;
    });

    return { buckets: bkts, min: minVal, max: maxVal };
  }, [data, config.accessor, bucketCount]);

  const maxCount = Math.max(...buckets.map(b => b.count), 1);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);

  const handleMouseDown = (i: number) => {
    setDragStart(i);
    setDragEnd(i);
  };

  const handleMouseEnter = (i: number) => {
    if (dragStart !== null) setDragEnd(i);
  };

  const handleMouseUp = () => {
    if (dragStart !== null && dragEnd !== null) {
      const startIdx = Math.min(dragStart, dragEnd);
      const endIdx = Math.max(dragStart, dragEnd);
      onSelect({ min: buckets[startIdx].min, max: buckets[endIdx].max });
    }
    setDragStart(null);
    setDragEnd(null);
  };

  const isInSelection = (i: number) => {
    if (dragStart !== null && dragEnd !== null) {
      return i >= Math.min(dragStart, dragEnd) && i <= Math.max(dragStart, dragEnd);
    }
    if (selection) {
      return buckets[i].max > selection.min && buckets[i].min < selection.max;
    }
    return false;
  };

  return (
    <div>
      {/* Histogram bars */}
      <div
        className="flex items-end gap-px h-12 cursor-crosshair select-none"
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { if (dragStart !== null) handleMouseUp(); }}
      >
        {buckets.map((bucket, i) => {
          const height = (bucket.count / maxCount) * 100;
          const selected = isInSelection(i);
          return (
            <div
              key={i}
              className="flex-1 relative group"
              style={{ height: '100%' }}
              onMouseDown={() => handleMouseDown(i)}
              onMouseEnter={() => handleMouseEnter(i)}
            >
              <div
                className="absolute bottom-0 left-0 right-0 rounded-t-sm transition-all"
                style={{
                  height: `${height}%`,
                  backgroundColor: selected ? color : `${color}40`,
                  opacity: selected ? 1 : 0.6,
                }}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity">
                <div className="bg-zinc-800 border border-zinc-700 rounded px-1.5 py-0.5 whitespace-nowrap">
                  <span className="text-[8px] text-zinc-300">{bucket.count} items ({bucket.min.toFixed(1)}-{bucket.max.toFixed(1)})</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Range labels */}
      <div className="flex items-center justify-between mt-1 text-[8px] text-zinc-600 font-mono">
        <span>{min.toFixed(1)}{config.unit || ''}</span>
        {selection && (
          <span className="text-cyan-400">
            {selection.min.toFixed(1)} - {selection.max.toFixed(1)}
            <button onClick={onClear} className="ml-1 text-zinc-500 hover:text-white"><X className="w-2.5 h-2.5 inline" /></button>
          </span>
        )}
        <span>{max.toFixed(1)}{config.unit || ''}</span>
      </div>
    </div>
  );
}

function CategoricalHistogram({ data, config, selection, onSelect, onClear }: {
  data: any[];
  config: HistogramFilterConfig;
  selection: CategoricalSelection | null;
  onSelect: (sel: CategoricalSelection) => void;
  onClear: () => void;
}) {
  const color = config.color || '#3b82f6';

  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(d => {
      const val = d[config.accessor];
      if (val != null) counts[String(val)] = (counts[String(val)] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([value, count]) => ({ value, count }));
  }, [data, config.accessor]);

  const maxCount = Math.max(...categories.map(c => c.count), 1);
  const isSelected = (value: string) => selection?.values.includes(value) ?? false;

  const toggleCategory = (value: string) => {
    if (!selection) {
      onSelect({ values: [value] });
    } else {
      const newValues = isSelected(value)
        ? selection.values.filter(v => v !== value)
        : [...selection.values, value];
      if (newValues.length === 0) onClear();
      else onSelect({ values: newValues });
    }
  };

  return (
    <div className="space-y-0.5">
      {categories.map(({ value, count }) => {
        const width = (count / maxCount) * 100;
        const selected = isSelected(value);
        return (
          <button
            key={value}
            onClick={() => toggleCategory(value)}
            className={`w-full flex items-center gap-2 px-1 py-0.5 rounded text-left transition-colors ${
              selected ? 'bg-cyan-500/10' : 'hover:bg-zinc-800/50'
            }`}
          >
            <span className={`text-[9px] flex-1 truncate ${selected ? 'text-cyan-400 font-medium' : 'text-zinc-400'}`}>{value}</span>
            <div className="w-16 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: selected ? color : `${color}60` }} />
            </div>
            <span className="text-[8px] text-zinc-500 font-mono w-6 text-right">{count}</span>
          </button>
        );
      })}
    </div>
  );
}

export function HistogramFilter({
  data,
  filters,
  onFilterChange,
  activeFilters,
  collapsed: initialCollapsed = false,
  className = '',
}: HistogramFilterProps) {
  const [collapsedPanels, setCollapsedPanels] = useState<Set<string>>(new Set());
  const activeCount = Object.values(activeFilters).filter(v => v !== null).length;

  const togglePanel = (id: string) => {
    setCollapsedPanels(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const clearAll = () => {
    filters.forEach(f => onFilterChange(f.id, null));
  };

  return (
    <div className={`bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-[10px] font-medium text-zinc-300 uppercase tracking-wider">Filters</span>
          {activeCount > 0 && (
            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-medium">{activeCount}</span>
          )}
        </div>
        {activeCount > 0 && (
          <button onClick={clearAll} className="text-[9px] text-zinc-500 hover:text-white flex items-center gap-1 transition-colors">
            <RotateCcw className="w-2.5 h-2.5" /> Clear
          </button>
        )}
      </div>

      {/* Filter panels */}
      <div className="divide-y divide-zinc-800/50">
        {filters.map((config) => {
          const isCollapsed = collapsedPanels.has(config.id);
          const hasActiveFilter = activeFilters[config.id] != null;

          return (
            <div key={config.id} className="px-3 py-2">
              <button
                onClick={() => togglePanel(config.id)}
                className="w-full flex items-center justify-between mb-1.5"
              >
                <div className="flex items-center gap-1.5">
                  {isCollapsed ? <ChevronRight className="w-3 h-3 text-zinc-600" /> : <ChevronDown className="w-3 h-3 text-zinc-600" />}
                  <span className={`text-[10px] font-medium ${hasActiveFilter ? 'text-cyan-400' : 'text-zinc-400'}`}>{config.label}</span>
                </div>
                {hasActiveFilter && (
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                )}
              </button>

              {!isCollapsed && (
                <div className="pl-4">
                  {config.type === 'numeric' || config.type === 'temporal' ? (
                    <NumericHistogram
                      data={data}
                      config={config}
                      selection={activeFilters[config.id] as RangeSelection | null}
                      onSelect={(range) => onFilterChange(config.id, range)}
                      onClear={() => onFilterChange(config.id, null)}
                    />
                  ) : (
                    <CategoricalHistogram
                      data={data}
                      config={config}
                      selection={activeFilters[config.id] as CategoricalSelection | null}
                      onSelect={(sel) => onFilterChange(config.id, sel)}
                      onClear={() => onFilterChange(config.id, null)}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default HistogramFilter;
