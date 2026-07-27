'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, LineChart, PieChart, Map, Table2, Activity,
  Plus, Trash2, Move, Settings, Download, Share2, Save,
  Filter, Layers, Database, ChevronDown, ChevronRight,
  Globe, Target, Zap, Clock, TrendingUp, ArrowUpDown,
  Maximize2, Grid3X3, LayoutGrid, Sparkles
} from 'lucide-react';

type ChartType = 'bar' | 'line' | 'scatter' | 'pie' | 'map' | 'table' | 'metric' | 'timeline' | 'heatmap' | 'radar';
type AggregationType = 'count' | 'sum' | 'avg' | 'min' | 'max' | 'distinct';

interface DataSource {
  id: string;
  name: string;
  type: 'vertex' | 'edge' | 'signal' | 'metric';
  fields: string[];
  description: string;
  color: string;
}

interface AnalysisWidget {
  id: string;
  type: ChartType;
  title: string;
  dataSource: string;
  xField?: string;
  yField?: string;
  groupBy?: string;
  aggregation?: AggregationType;
  filters?: Array<{ field: string; operator: string; value: string }>;
  color?: string;
  width: 1 | 2 | 3;
  height: 1 | 2;
}

const CHART_TYPES: Array<{ type: ChartType; icon: any; label: string; description: string }> = [
  { type: 'bar', icon: BarChart3, label: 'Bar Chart', description: 'Compare values across categories' },
  { type: 'line', icon: LineChart, label: 'Line Chart', description: 'Track trends over time' },
  { type: 'scatter', icon: Activity, label: 'Scatter Plot', description: 'Correlate two variables' },
  { type: 'pie', icon: PieChart, label: 'Pie/Donut', description: 'Show composition' },
  { type: 'map', icon: Map, label: 'Geospatial', description: 'Plot on map' },
  { type: 'table', icon: Table2, label: 'Data Table', description: 'Raw tabular data' },
  { type: 'metric', icon: TrendingUp, label: 'Metric Card', description: 'Single KPI value' },
  { type: 'timeline', icon: Clock, label: 'Timeline', description: 'Temporal event view' },
  { type: 'heatmap', icon: Grid3X3, label: 'Heat Map', description: 'Density visualization' },
  { type: 'radar', icon: Target, label: 'Radar Chart', description: 'Multi-axis comparison' },
];

const DATA_SOURCES: DataSource[] = [
  { id: 'ds-conflicts', name: 'Conflict Events', type: 'vertex', fields: ['event_type', 'fatalities', 'country', 'admin1', 'timestamp', 'source_count', 'convergence_score'], description: 'ACLED-style conflict events (4.89M)', color: '#ef4444' },
  { id: 'ds-entities', name: 'Tracked Entities', type: 'vertex', fields: ['entity_type', 'name', 'country', 'risk_score', 'convergence_score', 'first_seen', 'last_updated', 'domain'], description: 'All entity vertices (14.9M)', color: '#3b82f6' },
  { id: 'ds-signals', name: 'Novel Signals', type: 'signal', fields: ['signal_type', 'drift_magnitude', 'source_domains', 'convergence_score', 'timestamp', 'region', 'confidence'], description: 'Detected novel signals (8.4K)', color: '#fbbf24' },
  { id: 'ds-predictions', name: 'Predictions', type: 'vertex', fields: ['event_type', 'probability', 'timeframe', 'model', 'brier_score', 'country', 'validated'], description: 'Forecast events (28.4K)', color: '#8b5cf6' },
  { id: 'ds-maritime', name: 'Maritime Tracks', type: 'vertex', fields: ['vessel_type', 'flag_state', 'speed', 'heading', 'lat', 'lng', 'dark_period', 'cargo_type'], description: 'Vessel tracks (847K)', color: '#06b6d4' },
  { id: 'ds-aviation', name: 'Aviation Tracks', type: 'vertex', fields: ['aircraft_type', 'callsign', 'altitude', 'speed', 'military_flag', 'country', 'route'], description: 'Aircraft tracks (264K)', color: '#f59e0b' },
  { id: 'ds-cyber', name: 'Cyber Indicators', type: 'vertex', fields: ['indicator_type', 'risk_score', 'malware_family', 'country', 'first_seen', 'last_seen', 'source'], description: 'IOCs (2.84M)', color: '#a855f7' },
  { id: 'ds-instability', name: 'Country Instability', type: 'metric', fields: ['country', 'cii_score', 'political_violence', 'economic_stress', 'social_fragmentation', 'military_activity', 'info_ops', 'infrastructure'], description: 'CII v2.0 scores (195 countries)', color: '#10b981' },
  { id: 'ds-sanctions', name: 'Sanctioned Entities', type: 'vertex', fields: ['entity_type', 'programs', 'country', 'listing_date', 'source', 'aliases_count', 'network_degree'], description: 'OFAC/EU/UN sanctions (34.8K)', color: '#f97316' },
  { id: 'ds-convergence', name: 'Convergence Events', type: 'signal', fields: ['source_count', 'domain_count', 'score', 'region', 'timestamp', 'rule_type', 'entities_involved'], description: 'Multi-source agreements (1.28K/day)', color: '#ec4899' },
];

const MOCK_WIDGETS: AnalysisWidget[] = [
  { id: 'w-1', type: 'line', title: 'Novel Signals Over Time', dataSource: 'ds-signals', xField: 'timestamp', yField: 'drift_magnitude', groupBy: 'signal_type', aggregation: 'count', width: 2, height: 1, color: '#fbbf24' },
  { id: 'w-2', type: 'bar', title: 'Conflicts by Region', dataSource: 'ds-conflicts', xField: 'country', yField: 'fatalities', aggregation: 'sum', width: 1, height: 1, color: '#ef4444' },
  { id: 'w-3', type: 'metric', title: 'Prediction Accuracy', dataSource: 'ds-predictions', yField: 'brier_score', aggregation: 'avg', width: 1, height: 1, color: '#8b5cf6' },
  { id: 'w-4', type: 'radar', title: 'Sudan Instability Profile', dataSource: 'ds-instability', width: 1, height: 1, color: '#10b981' },
  { id: 'w-5', type: 'heatmap', title: 'Convergence Density (24h)', dataSource: 'ds-convergence', xField: 'timestamp', yField: 'region', aggregation: 'count', width: 2, height: 1, color: '#ec4899' },
];

function WidgetPlaceholder({ widget }: { widget: AnalysisWidget }) {
  const chartConfig = CHART_TYPES.find(c => c.type === widget.type);
  const Icon = chartConfig?.icon || BarChart3;
  const source = DATA_SOURCES.find(s => s.id === widget.dataSource);

  return (
    <div className={`bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors h-full flex flex-col`}>
      {/* Widget Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color: widget.color || '#6b7280' }} />
          <span className="text-xs font-medium text-white">{widget.title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors">
            <Settings className="w-3 h-3" />
          </button>
          <button className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors">
            <Maximize2 className="w-3 h-3" />
          </button>
          <button className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition-colors">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className="flex-1 flex items-center justify-center bg-zinc-800/30 rounded-lg border border-zinc-800/50 min-h-[100px]">
        <div className="text-center">
          <Icon className="w-8 h-8 text-zinc-700 mx-auto" />
          <p className="text-[9px] text-zinc-600 mt-2">{chartConfig?.label}</p>
          {source && (
            <p className="text-[8px] text-zinc-700 mt-0.5">Source: {source.name}</p>
          )}
          {widget.xField && <p className="text-[8px] text-zinc-700">X: {widget.xField} | Y: {widget.yField} | Agg: {widget.aggregation}</p>}
        </div>
      </div>

      {/* Widget Footer */}
      <div className="flex items-center justify-between mt-2 text-[9px] text-zinc-600">
        <span>{source?.name}</span>
        <span>{widget.aggregation ? `${widget.aggregation}(${widget.yField || '*'})` : ''}</span>
      </div>
    </div>
  );
}

export default function AnalysisBuilderPage() {
  const [widgets, setWidgets] = useState(MOCK_WIDGETS);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [selectedChartType, setSelectedChartType] = useState<ChartType | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [layout, setLayout] = useState<'grid' | 'freeform'>('grid');

  const addWidget = useCallback(() => {
    if (!selectedChartType || !selectedSource) return;
    const source = DATA_SOURCES.find(s => s.id === selectedSource);
    const newWidget: AnalysisWidget = {
      id: `w-${Date.now()}`,
      type: selectedChartType,
      title: `New ${CHART_TYPES.find(c => c.type === selectedChartType)?.label || 'Chart'}`,
      dataSource: selectedSource,
      xField: source?.fields[0],
      yField: source?.fields[1],
      aggregation: 'count',
      width: 1,
      height: 1,
      color: source?.color,
    };
    setWidgets(prev => [...prev, newWidget]);
    setShowAddPanel(false);
    setSelectedChartType(null);
    setSelectedSource(null);
  }, [selectedChartType, selectedSource]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Analysis Builder</h1>
              <p className="text-xs text-zinc-500">Drag-and-drop intelligence visualization • 10 chart types • 10 data sources • Real-time updates</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddPanel(!showAddPanel)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-medium hover:bg-cyan-500/30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Widget
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs font-medium hover:text-white transition-colors">
              <Save className="w-3.5 h-3.5" /> Save
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs font-medium hover:text-white transition-colors">
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs font-medium hover:text-white transition-colors">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
        </div>
      </div>

      {/* Add Widget Panel */}
      <AnimatePresence>
        {showAddPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-zinc-800 bg-zinc-900/50"
          >
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Step 1: Choose Chart Type */}
                <div>
                  <h3 className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-medium mb-3">1. Choose Visualization</h3>
                  <div className="grid grid-cols-5 gap-2">
                    {CHART_TYPES.map((chart) => (
                      <button
                        key={chart.type}
                        onClick={() => setSelectedChartType(chart.type)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all ${
                          selectedChartType === chart.type
                            ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                            : 'bg-zinc-800/30 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                        }`}
                      >
                        <chart.icon className="w-5 h-5" />
                        <span className="text-[9px] font-medium">{chart.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 2: Choose Data Source */}
                <div>
                  <h3 className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-medium mb-3">2. Choose Data Source</h3>
                  <div className="grid grid-cols-2 gap-1.5 max-h-[200px] overflow-y-auto">
                    {DATA_SOURCES.map((source) => (
                      <button
                        key={source.id}
                        onClick={() => setSelectedSource(source.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all ${
                          selectedSource === source.id
                            ? 'bg-cyan-500/10 border-cyan-500/30'
                            : 'bg-zinc-800/30 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: source.color }} />
                        <div className="min-w-0">
                          <span className="text-[10px] text-zinc-300 font-medium block truncate">{source.name}</span>
                          <span className="text-[8px] text-zinc-500 block truncate">{source.description}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Add Button */}
                  <button
                    onClick={addWidget}
                    disabled={!selectedChartType || !selectedSource}
                    className="mt-3 w-full px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-medium hover:bg-cyan-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Add to Canvas
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Widget Canvas */}
      <div className="p-6">
        <div className="grid grid-cols-3 gap-4 auto-rows-[200px]">
          {widgets.map((widget) => (
            <div
              key={widget.id}
              className={`${
                widget.width === 3 ? 'col-span-3' : widget.width === 2 ? 'col-span-2' : 'col-span-1'
              } ${widget.height === 2 ? 'row-span-2' : 'row-span-1'}`}
            >
              <WidgetPlaceholder widget={widget} />
            </div>
          ))}

          {/* Empty slot (add widget) */}
          <button
            onClick={() => setShowAddPanel(true)}
            className="col-span-1 border-2 border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-zinc-600 transition-colors group"
          >
            <Plus className="w-8 h-8 text-zinc-700 group-hover:text-zinc-500" />
            <span className="text-[10px] text-zinc-600 group-hover:text-zinc-400">Add Widget</span>
          </button>
        </div>

        {/* Available Fields Reference */}
        <div className="mt-8">
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-medium mb-3 flex items-center gap-2">
            <Database className="w-3.5 h-3.5" /> Available Data Sources & Fields
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {DATA_SOURCES.map((source) => (
              <div key={source.id} className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: source.color }} />
                  <span className="text-xs text-zinc-300 font-medium">{source.name}</span>
                  <span className="text-[8px] text-zinc-600 uppercase">{source.type}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {source.fields.map((field) => (
                    <span key={field} className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">{field}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
