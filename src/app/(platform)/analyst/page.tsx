'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Brain, Globe, Target, Zap, Shield, Eye, Layers,
  Sparkles, Clock, ChevronRight, Copy, RotateCcw, Plus,
  Settings, Maximize2, Minimize2, Database, Activity,
  Network, MapPin, Radio, AlertTriangle, FileText, Code,
  BarChart3, TrendingUp, Crosshair
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: string;
  toolsUsed?: string[];
  sources?: Array<{ name: string; reliability: string; count: number }>;
  entities?: Array<{ id: string; name: string; type: string; score: number }>;
  confidence?: number;
  reasoning?: string[];
  visualizations?: Array<{ type: 'chart' | 'map' | 'table' | 'graph'; data: any }>;
  isStreaming?: boolean;
}

interface ConversationSession {
  id: string;
  title: string;
  messageCount: number;
  lastMessage: string;
  timestamp: string;
}

const EXAMPLE_QUERIES = [
  { icon: Globe, label: 'What\'s the current instability index for Sudan?', category: 'analysis' },
  { icon: Target, label: 'Show me all convergence events in the South China Sea (last 24h)', category: 'query' },
  { icon: Zap, label: 'What novel signals have we detected in the Baltic this week?', category: 'signals' },
  { icon: Network, label: 'Map the relationship network around Wagner Group PMC', category: 'graph' },
  { icon: Crosshair, label: 'Task a satellite pass over Kaliningrad Oblast', category: 'action' },
  { icon: TrendingUp, label: 'Predict: What\'s the probability of escalation in Taiwan Strait (14-day)?', category: 'prediction' },
  { icon: Shield, label: 'Run sanctions cascade analysis on Entity X', category: 'analysis' },
  { icon: Radio, label: 'What ADS-B anomalies have we seen near Crimea today?', category: 'query' },
];

const AVAILABLE_TOOLS = [
  { name: 'graph_query', description: 'Query TigerGraph (571V/943E schema)', icon: Database },
  { name: 'convergence_score', description: 'Calculate multi-source convergence', icon: Target },
  { name: 'entity_expand', description: 'Expand entity relationships (2-hop)', icon: Network },
  { name: 'predict_escalation', description: 'ST-GNN + TabICL forecasting', icon: TrendingUp },
  { name: 'novel_signal_detect', description: 'Vector drift baseline analysis', icon: Zap },
  { name: 'task_satellite', description: 'Issue satellite collection request', icon: Crosshair },
  { name: 'generate_report', description: 'ICD 203 compliant intelligence report', icon: FileText },
  { name: 'sanctions_cascade', description: 'Multi-hop sanctions network analysis', icon: AlertTriangle },
  { name: 'route_analysis', description: 'Chokepoint and commodity flow analysis', icon: MapPin },
  { name: 'instability_index', description: 'Country Instability Index v2.0', icon: BarChart3 },
];

// Mock streaming response
const MOCK_RESPONSES: Record<string, Message> = {
  default: {
    id: 'resp-1',
    role: 'assistant',
    content: 'Based on the TigerGraph knowledge graph (14.9M vertices), here\'s what I found:\n\n**Sudan Instability Index: 87.4/100 (CRITICAL)**\n\nThe Country Instability Index v2.0 shows Sudan at critical levels across 5/6 domains:\n\n- Political Violence: 94.2 (ACLED reports 847 events in 30 days)\n- Economic Stress: 82.1 (currency collapse, FRED indicators)\n- Social Fragmentation: 89.7 (displacement data from IOM DTM)\n- Military Activity: 91.3 (ADS-B shows 340% increase in military flights)\n- Information Operations: 76.4 (Telegram discourse velocity spike)\n- Infrastructure: 68.9 (VIIRS blackout detection, 12 new dark zones)\n\n**Convergence Score: 0.91** (12 independent sources confirm escalation pattern)\n\n**Prediction (ST-GNN + TabICL):** 78% probability of major escalation event within 14 days. Pattern matches pre-Khartoum offensive signature from Apr 2023.',
    timestamp: new Date().toISOString(),
    toolsUsed: ['instability_index', 'graph_query', 'convergence_score', 'predict_escalation'],
    sources: [
      { name: 'ACLED', reliability: 'A', count: 847 },
      { name: 'GDELT', reliability: 'B', count: 2340 },
      { name: 'ADS-B Exchange', reliability: 'A', count: 156 },
      { name: 'IOM DTM', reliability: 'A', count: 45 },
      { name: 'VIIRS', reliability: 'A', count: 12 },
      { name: 'Telegram OSINT', reliability: 'C', count: 890 },
    ],
    entities: [
      { id: 'e-001', name: 'Sudan Armed Forces (SAF)', type: 'Organization', score: 94 },
      { id: 'e-002', name: 'Rapid Support Forces (RSF)', type: 'Organization', score: 91 },
      { id: 'e-003', name: 'Khartoum', type: 'Location', score: 87 },
      { id: 'e-004', name: 'Port Sudan', type: 'Location', score: 72 },
    ],
    confidence: 91,
    reasoning: [
      'Queried CII v2.0 for Sudan (graph traversal: Country -> events -> indicators)',
      'Calculated convergence across 12 independent sources (IOWA D-S fusion)',
      'Ran ST-GNN prediction on temporal subgraph (30-day window)',
      'Cross-referenced with TabICL in-context patterns from historical conflicts',
      'Validated against prediction market data (Metaculus: 72% agreement)',
    ],
  },
};

function ToolBadge({ tool }: { tool: string }) {
  const toolInfo = AVAILABLE_TOOLS.find(t => t.name === tool);
  const Icon = toolInfo?.icon || Code;
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700/50 text-[9px] text-zinc-400">
      <Icon className="w-2.5 h-2.5" />
      {tool}
    </span>
  );
}

function EntityChip({ entity }: { entity: { id: string; name: string; type: string; score: number } }) {
  const scoreColor = entity.score >= 80 ? 'text-red-400' : entity.score >= 60 ? 'text-yellow-400' : 'text-zinc-400';
  return (
    <button className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-800/50 border border-zinc-700/30 hover:border-cyan-500/30 transition-colors group">
      <span className="text-xs text-zinc-300 group-hover:text-white">{entity.name}</span>
      <span className={`text-[9px] font-mono font-bold ${scoreColor}`}>{entity.score}</span>
      <ChevronRight className="w-3 h-3 text-zinc-600 group-hover:text-cyan-400" />
    </button>
  );
}

export default function AnalystPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [showReasoning, setShowReasoning] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [fullscreen, setFullscreen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const handleSubmit = useCallback(async (query?: string) => {
    const text = query || input.trim();
    if (!text) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    // Simulate tool execution steps
    const toolMessage: Message = {
      id: `tool-${Date.now()}`,
      role: 'tool',
      content: 'Executing: graph_query → convergence_score → predict_escalation...',
      timestamp: new Date().toISOString(),
      toolsUsed: ['graph_query', 'convergence_score', 'predict_escalation', 'instability_index'],
    };

    setTimeout(() => {
      setMessages(prev => [...prev, toolMessage]);
    }, 500);

    // Simulate response
    setTimeout(() => {
      const response: Message = {
        ...MOCK_RESPONSES.default,
        id: `resp-${Date.now()}`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, response]);
      setIsProcessing(false);
    }, 2500);
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={`flex flex-col bg-zinc-950 text-white ${fullscreen ? 'fixed inset-0 z-50' : 'min-h-screen'}`}>
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/30 flex items-center justify-center">
            <Brain className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold flex items-center gap-2">
              GZM Intelligence Analyst
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 font-normal">AIP EQUIVALENT</span>
            </h1>
            <p className="text-[10px] text-zinc-500">Ontology-augmented reasoning over 571V/943E temporal knowledge graph • 41 MCP tools • 6-step reasoning</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTools(!showTools)}
            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium border transition-colors ${
              showTools ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-300'
            }`}
          >
            <Code className="w-3.5 h-3.5 inline mr-1" />Tools ({AVAILABLE_TOOLS.length})
          </button>
          <button onClick={() => setFullscreen(!fullscreen)} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400">
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Tools Panel (collapsible) */}
      <AnimatePresence>
        {showTools && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden border-b border-zinc-800 bg-zinc-900/30"
          >
            <div className="p-4">
              <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-2">Available Intelligence Tools (Ontology-Augmented)</h3>
              <div className="grid grid-cols-5 gap-2">
                {AVAILABLE_TOOLS.map((tool) => (
                  <div key={tool.name} className="flex items-center gap-2 bg-zinc-800/40 rounded-lg px-2.5 py-2 border border-zinc-700/30">
                    <tool.icon className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] text-zinc-300 font-medium block truncate">{tool.name}</span>
                      <span className="text-[8px] text-zinc-500 block truncate">{tool.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-16">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/20 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-violet-400" />
            </div>
            <h2 className="text-lg font-semibold mb-1">GZM Intelligence Analyst</h2>
            <p className="text-sm text-zinc-500 mb-6 text-center max-w-md">
              Ask any intelligence question. I query a 14.9M vertex temporal knowledge graph with 41 tools, 6-step reasoning, and ontology-augmented generation.
            </p>
            <div className="grid grid-cols-2 gap-2 max-w-2xl w-full">
              {EXAMPLE_QUERIES.map((query, i) => (
                <button
                  key={i}
                  onClick={() => handleSubmit(query.label)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:border-zinc-600 text-left transition-colors group"
                >
                  <query.icon className="w-4 h-4 text-zinc-500 group-hover:text-cyan-400 flex-shrink-0 transition-colors" />
                  <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">{query.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
          >
            {message.role !== 'user' && (
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                message.role === 'tool' ? 'bg-zinc-800 border border-zinc-700' : 'bg-violet-500/20 border border-violet-500/30'
              }`}>
                {message.role === 'tool' ? <Code className="w-3.5 h-3.5 text-zinc-400" /> : <Brain className="w-3.5 h-3.5 text-violet-400" />}
              </div>
            )}

            <div className={`max-w-3xl ${message.role === 'user' ? 'bg-cyan-500/10 border border-cyan-500/20 rounded-2xl rounded-tr-md px-4 py-2.5' : message.role === 'tool' ? 'bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2' : 'flex-1'}`}>
              {message.role === 'tool' && message.toolsUsed && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Activity className="w-3 h-3 text-zinc-500 animate-pulse" />
                  {message.toolsUsed.map((tool) => <ToolBadge key={tool} tool={tool} />)}
                </div>
              )}

              {message.role !== 'tool' && (
                <div className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </div>
              )}

              {/* Assistant metadata */}
              {message.role === 'assistant' && (
                <div className="mt-4 space-y-3">
                  {/* Tools Used */}
                  {message.toolsUsed && message.toolsUsed.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] text-zinc-500 uppercase tracking-wider">Tools:</span>
                      {message.toolsUsed.map((tool) => <ToolBadge key={tool} tool={tool} />)}
                    </div>
                  )}

                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
                      <span className="text-[9px] text-zinc-500 uppercase tracking-wider">Sources ({message.sources.length})</span>
                      <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                        {message.sources.map((source, i) => (
                          <div key={i} className="flex items-center justify-between text-[10px]">
                            <span className="text-zinc-300">{source.name}</span>
                            <div className="flex items-center gap-1">
                              <span className="text-emerald-400 font-mono">{source.reliability}</span>
                              <span className="text-zinc-500">{source.count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Entities */}
                  {message.entities && message.entities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {message.entities.map((entity) => <EntityChip key={entity.id} entity={entity} />)}
                    </div>
                  )}

                  {/* Reasoning Chain (collapsible) */}
                  {message.reasoning && (
                    <div>
                      <button
                        onClick={() => setShowReasoning(showReasoning === message.id ? null : message.id)}
                        className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors"
                      >
                        <ChevronRight className={`w-3 h-3 transition-transform ${showReasoning === message.id ? 'rotate-90' : ''}`} />
                        Reasoning chain ({message.reasoning.length} steps)
                      </button>
                      <AnimatePresence>
                        {showReasoning === message.id && (
                          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                            <div className="mt-2 space-y-1 pl-4 border-l border-zinc-800">
                              {message.reasoning.map((step, i) => (
                                <div key={i} className="flex items-start gap-2 text-[10px] text-zinc-500">
                                  <span className="text-zinc-600 font-mono">{i + 1}.</span>
                                  <span>{step}</span>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Confidence */}
                  {message.confidence && (
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                      <Shield className="w-3 h-3" />
                      <span>Confidence: <span className="text-white font-medium">{message.confidence}%</span></span>
                      <span>•</span>
                      <Clock className="w-3 h-3" />
                      <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {isProcessing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
              <Brain className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs">Reasoning over knowledge graph...</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-zinc-800 px-6 py-4 flex-shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask an intelligence question... (queries 14.9M vertex graph with 41 tools)"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 resize-none"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            <button
              onClick={() => handleSubmit()}
              disabled={!input.trim() || isProcessing}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4 text-violet-400" />
            </button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[9px] text-zinc-600">Ontology-Augmented Generation • Schema context injected • Multi-step tool execution • NATO STANAG 2022 confidence scoring</span>
            <span className="text-[9px] text-zinc-600">Enter to send, Shift+Enter for newline</span>
          </div>
        </div>
      </div>
    </div>
  );
}
