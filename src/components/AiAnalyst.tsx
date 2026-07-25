'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Send,
  Sparkles,
  X,
  Bot,
  User,
  AlertTriangle,
  Shield,
  ChevronDown,
  Loader2,
  Trash2,
  Zap,
  Activity,
} from 'lucide-react';
import {
  queryIntelligence,
  generateBrief,
  runAutonomousCycle,
  getHealth,
  type AIPQueryResponse,
  type IntelligenceBrief,
  type HealthStatus,
} from '@/lib/gzm-aip-client';

/* ═══════════════════════════════════════════════════════════════
   GZM AI INTELLIGENCE ANALYST — Connected to /aip/query
   Multi-step reasoning, 70+ tools, graph-backed intelligence
   ═══════════════════════════════════════════════════════════════ */

interface ChatMessage {
  id: string;
  role: 'user' | 'analyst';
  content: string;
  timestamp: string;
  isError?: boolean;
  metadata?: {
    confidence?: number;
    model?: string;
    tokens?: number;
    entities_found?: number;
    connections_found?: number;
    follow_ups?: string[];
    intent?: string;
  };
}

interface AiAnalystProps {
  data?: Record<string, unknown>;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function renderMarkdown(text: string): string {
  return text
    .replace(/### (.+)/g, '<h4 class="text-[11px] font-bold text-[var(--gold-primary)] mt-3 mb-1 tracking-wider uppercase font-mono">$1</h4>')
    .replace(/## (.+)/g, '<h3 class="text-[12px] font-bold text-[var(--gold-primary)] mt-3 mb-1.5 tracking-wider uppercase font-mono border-b border-[var(--border-secondary)] pb-1">$1</h3>')
    .replace(/# (.+)/g, '<h2 class="text-[13px] font-bold text-[var(--gold-primary)] mt-3 mb-1.5 tracking-wider uppercase font-mono">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-[var(--text-heading)] font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-[var(--text-secondary)] italic">$1</em>')
    .replace(/^- (.+)/gm, '<div class="flex items-start gap-1.5 ml-1 my-0.5"><span class="text-[var(--gold-dim)] mt-[3px] text-[8px]">\u25C6</span><span>$1</span></div>')
    .replace(/\n/g, '<br />');
}

export default function AiAnalyst({ data }: AiAnalystProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [health, setHealth] = useState<HealthStatus | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check GZM backend health on mount
  useEffect(() => {
    getHealth().then(setHealth).catch(() => setHealth(null));
    const interval = setInterval(() => {
      getHealth().then(setHealth).catch(() => setHealth(null));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  const handleSend = useCallback(async () => {
    const query = inputText.trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response: AIPQueryResponse = await queryIntelligence({
        query,
        include_raw: false,
      });

      const analystMsg: ChatMessage = {
        id: generateId(),
        role: 'analyst',
        content: response.narrative,
        timestamp: response.timestamp || new Date().toISOString(),
        metadata: {
          confidence: response.confidence,
          model: response.model_used,
          tokens: response.tokens_used,
          entities_found: response.entities_found,
          connections_found: response.connections_found,
          follow_ups: response.follow_up_suggestions,
          intent: response.intent,
        },
      };
      setMessages((prev) => [...prev, analystMsg]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      const errorMsg: ChatMessage = {
        id: generateId(),
        role: 'analyst',
        content: `\u26A0 GZM INTELLIGENCE ENGINE ERROR\n\n${message}\n\nEnsure the backend is running: uvicorn api.app:app --port 8000`,
        timestamp: new Date().toISOString(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading]);

  const handleBriefing = useCallback(async () => {
    if (isLoading) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: '\uD83D\uDCCB Generate autonomous intelligence briefing',
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const brief: IntelligenceBrief = await generateBrief();

      let content = brief.narrative;
      if (brief.gaps_identified?.length) {
        content += '\n\n## INTELLIGENCE GAPS\n' + brief.gaps_identified.map((g) => `- ${g}`).join('\n');
      }
      if (brief.recommended_actions?.length) {
        content += '\n\n## RECOMMENDED ACTIONS\n' + brief.recommended_actions.map((a) => `- ${a}`).join('\n');
      }

      const analystMsg: ChatMessage = {
        id: generateId(),
        role: 'analyst',
        content,
        timestamp: brief.generated_at || new Date().toISOString(),
        metadata: {
          confidence: brief.confidence,
          entities_found: brief.entities_involved?.length || 0,
        },
      };
      setMessages((prev) => [...prev, analystMsg]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Briefing generation failed';
      const errorMsg: ChatMessage = {
        id: generateId(),
        role: 'analyst',
        content: `\u26A0 BRIEFING ERROR\n\n${message}`,
        timestamp: new Date().toISOString(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const handleAutonomous = useCallback(async () => {
    if (isLoading) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: '\u26A1 Run autonomous reasoning cycle',
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const result = await runAutonomousCycle();

      let content = `## AUTONOMOUS CYCLE COMPLETE\n\n`;
      content += `- **Gaps detected:** ${result.gaps_detected}\n`;
      content += `- **Convergence events:** ${result.convergence_events}\n`;
      content += `- **ISR requirements created:** ${result.isr_requirements_created}\n`;
      content += `- **Execution time:** ${result.execution_ms.toFixed(0)}ms\n`;
      if (result.critical_regions?.length) {
        content += `\n## CRITICAL REGIONS\n` + result.critical_regions.map((r) => `- ${r}`).join('\n');
      }
      if (result.top_gaps?.length) {
        content += `\n## TOP PRIORITY GAPS\n` + result.top_gaps.map((g) => `- **${g.entity}** (priority: ${g.priority.toFixed(2)})`).join('\n');
      }

      const analystMsg: ChatMessage = {
        id: generateId(),
        role: 'analyst',
        content,
        timestamp: result.timestamp || new Date().toISOString(),
      };
      setMessages((prev) => [...prev, analystMsg]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Autonomous cycle failed';
      setMessages((prev) => [...prev, {
        id: generateId(),
        role: 'analyst',
        content: `\u26A0 AUTONOMOUS CYCLE ERROR\n\n${message}`,
        timestamp: new Date().toISOString(),
        isError: true,
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const clearMessages = useCallback(() => setMessages([]), []);

  const isConnected = health?.status === 'operational';
  const toolCount = health?.tools_registered || 0;

  /* \u2500\u2500 Floating Trigger Button \u2500\u2500 */
  const triggerButton = (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 2, type: 'spring', stiffness: 200, damping: 15 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setIsOpen(true)}
      className="fixed bottom-[90px] right-5 md:bottom-8 md:right-8 z-[500] w-14 h-14 rounded-full flex items-center justify-center cursor-pointer border-0 bg-[linear-gradient(135deg,rgba(212,175,55,0.2)_0%,rgba(212,175,55,0.08)_100%)] border border-[rgba(212,175,55,0.4)] shadow-[0_0_30px_rgba(212,175,55,0.2),0_0_60px_rgba(212,175,55,0.1),0_4px_20px_rgba(0,0,0,0.5)]"
      aria-label="Open GZM Intelligence Engine"
    >
      <Brain className="w-6 h-6 text-[var(--gold-primary)]" />
      <div className="absolute inset-0 rounded-full animate-glow-pulse" />
      {isConnected && (
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[var(--alert-green)] border-2 border-[var(--bg-primary)]" />
      )}
    </motion.button>
  );

  return (
    <>
      <AnimatePresence>{!isOpen && triggerButton}</AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[600] md:hidden"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="fixed bottom-0 right-0 md:bottom-6 md:right-6 z-[700] w-full md:w-[440px] h-[85vh] md:h-[680px] md:max-h-[85vh] flex flex-col md:rounded-2xl overflow-hidden bg-[linear-gradient(180deg,rgba(8,10,20,0.96)_0%,rgba(6,6,12,0.98)_100%)] border border-[rgba(212,175,55,0.2)] shadow-[0_0_60px_rgba(0,0,0,0.8),0_0_30px_rgba(212,175,55,0.08),0_1px_0_rgba(212,175,55,0.1)_inset] backdrop-blur-[40px]"
            >
              {/* Header */}
              <div className="relative flex items-center justify-between px-4 py-3 shrink-0 bg-[linear-gradient(90deg,rgba(212,175,55,0.06)_0%,transparent_50%,rgba(0,229,255,0.04)_100%)] border-b border-[rgba(212,175,55,0.15)]">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <Shield className="w-4.5 h-4.5 text-[var(--gold-primary)]" />
                    <div className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[var(--alert-green)] animate-thirdeye-pulse' : 'bg-[var(--alert-red)]'}`} />
                  </div>
                  <div className="flex flex-col">
                    <span className="hud-text text-[11px] text-[var(--text-heading)]">GZM INTELLIGENCE ENGINE</span>
                    <span className="text-[7px] font-mono tracking-[0.2em] text-[var(--text-muted)]">
                      {isConnected ? `${toolCount} TOOLS \u2022 CONNECTED` : 'DISCONNECTED \u2022 START BACKEND'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {messages.length > 0 && (
                    <button onClick={clearMessages} className="p-1.5 rounded-lg hover:bg-[var(--hover-accent)] transition-colors group" title="Clear">
                      <Trash2 className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--alert-red)]" />
                    </button>
                  )}
                  <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-[var(--hover-accent)] transition-colors group" title="Close">
                    <X className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)]" />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto styled-scrollbar px-4 py-3 space-y-3">
                {messages.length === 0 && !isLoading && (
                  <div className="h-full flex flex-col items-center justify-center text-center px-6 gap-5">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[linear-gradient(135deg,rgba(212,175,55,0.1)_0%,rgba(0,229,255,0.05)_100%)] border border-[rgba(212,175,55,0.2)]">
                        <Brain className="w-7 h-7 text-[var(--gold-primary)]" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="hud-text text-[12px] text-[var(--text-heading)]">GZM INTELLIGENCE ENGINE</h3>
                      <p className="text-[10px] font-mono text-[var(--text-muted)] leading-relaxed max-w-[280px]">
                        Multi-step reasoning with 70+ tools. Connected to 14.9M vertices, 152 collectors, 89 engines. Ask anything.
                      </p>
                    </div>
                    <div className="w-full space-y-1.5">
                      <span className="hud-label block text-center mb-2 text-[7px]">SUGGESTED QUERIES</span>
                      {[
                        'What are the most connected threat actors?',
                        'Show me high-severity signals from the last 24 hours',
                        'Assess country risk for Iran',
                        'Find entities near the Strait of Hormuz',
                        'What intelligence gaps need collection?',
                      ].map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => { setInputText(prompt); setTimeout(() => inputRef.current?.focus(), 50); }}
                          className="w-full text-left px-3 py-2 rounded-lg text-[10px] font-mono text-[var(--text-secondary)] transition-all hover:text-[var(--text-primary)] hover:bg-[var(--hover-accent)] border border-[rgba(212,175,55,0.08)]"
                        >
                          <span className="text-[var(--gold-dim)] mr-1.5">\u203A</span>{prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg) => (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] rounded-xl px-3.5 py-2.5 border ${
                      msg.role === 'user'
                        ? 'rounded-br-sm bg-[linear-gradient(135deg,rgba(0,229,255,0.12)_0%,rgba(0,229,255,0.06)_100%)] border-[rgba(0,229,255,0.2)]'
                        : msg.isError
                        ? 'rounded-bl-sm bg-[linear-gradient(135deg,rgba(255,61,61,0.1)_0%,rgba(255,61,61,0.05)_100%)] border-[rgba(255,61,61,0.2)]'
                        : 'rounded-bl-sm bg-[linear-gradient(135deg,rgba(212,175,55,0.08)_0%,rgba(212,175,55,0.03)_100%)] border-[rgba(212,175,55,0.12)]'
                    }`}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        {msg.role === 'user' ? <User className="w-3 h-3 text-[var(--cyan-primary)]" /> : msg.isError ? <AlertTriangle className="w-3 h-3 text-[var(--alert-red)]" /> : <Bot className="w-3 h-3 text-[var(--gold-primary)]" />}
                        <span className={`text-[8px] font-mono tracking-[0.15em] uppercase ${msg.role === 'user' ? 'text-[var(--cyan-primary)]' : msg.isError ? 'text-[var(--alert-red)]' : 'text-[var(--gold-primary)]'}`}>
                          {msg.role === 'user' ? 'OPERATOR' : 'GZM ENGINE'}
                        </span>
                        <span className="text-[7px] font-mono text-[var(--text-muted)] ml-auto">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {msg.role === 'analyst' && !msg.isError ? (
                        <div className="text-[11px] font-mono text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                      ) : (
                        <p className="text-[11px] font-mono text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                      )}

                      {/* Metadata bar */}
                      {msg.metadata && (
                        <div className="flex flex-wrap items-center gap-2 mt-2 pt-1.5 border-t border-[rgba(212,175,55,0.08)]">
                          {msg.metadata.confidence !== undefined && (
                            <span className="text-[8px] font-mono text-[var(--text-muted)]">{Math.round(msg.metadata.confidence * 100)}% conf</span>
                          )}
                          {msg.metadata.entities_found !== undefined && msg.metadata.entities_found > 0 && (
                            <span className="text-[8px] font-mono text-[var(--text-muted)]">{msg.metadata.entities_found} entities</span>
                          )}
                          {msg.metadata.connections_found !== undefined && msg.metadata.connections_found > 0 && (
                            <span className="text-[8px] font-mono text-[var(--text-muted)]">{msg.metadata.connections_found} connections</span>
                          )}
                          {msg.metadata.model && (
                            <span className="text-[8px] font-mono text-[var(--text-muted)]">{msg.metadata.model}</span>
                          )}
                          {msg.metadata.tokens !== undefined && msg.metadata.tokens > 0 && (
                            <span className="text-[8px] font-mono text-[var(--text-muted)]">{msg.metadata.tokens} tok</span>
                          )}
                        </div>
                      )}

                      {/* Follow-up suggestions */}
                      {msg.metadata?.follow_ups && msg.metadata.follow_ups.length > 0 && (
                        <div className="mt-2 pt-1.5 border-t border-[rgba(212,175,55,0.08)] space-y-1">
                          {msg.metadata.follow_ups.map((fu, i) => (
                            <button key={i} onClick={() => { setInputText(fu); setTimeout(() => inputRef.current?.focus(), 50); }}
                              className="block w-full text-left text-[9px] font-mono text-[var(--cyan-primary)] hover:text-[var(--text-primary)] transition-colors">
                              \u203A {fu}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {isLoading && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                    <div className="rounded-xl rounded-bl-sm px-4 py-3 flex items-center gap-2.5 bg-[linear-gradient(135deg,rgba(212,175,55,0.08)_0%,rgba(212,175,55,0.03)_100%)] border border-[rgba(212,175,55,0.12)]">
                      <Loader2 className="w-3.5 h-3.5 text-[var(--gold-primary)] animate-spin" />
                      <span className="text-[9px] font-mono tracking-[0.15em] text-[var(--gold-primary)] uppercase">Multi-step reasoning...</span>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="shrink-0 px-3 py-2.5 border-t border-[rgba(212,175,55,0.1)] bg-[rgba(6,6,12,0.8)]">
                <div className="flex gap-2 mb-2">
                  <button onClick={handleBriefing} disabled={isLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-mono tracking-[0.1em] uppercase transition-all disabled:opacity-40 bg-[rgba(212,175,55,0.08)] border border-[rgba(212,175,55,0.2)] text-[var(--gold-primary)]">
                    <Sparkles className="w-3 h-3" />BRIEFING
                  </button>
                  <button onClick={handleAutonomous} disabled={isLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-mono tracking-[0.1em] uppercase transition-all disabled:opacity-40 bg-[rgba(0,229,255,0.08)] border border-[rgba(0,229,255,0.2)] text-[var(--cyan-primary)]">
                    <Zap className="w-3 h-3" />AUTO CYCLE
                  </button>
                  <div className="flex-1" />
                  <span className="flex items-center text-[7px] font-mono text-[var(--text-muted)] tracking-wider">
                    <Activity className={`w-2.5 h-2.5 mr-1 ${isConnected ? 'text-[var(--alert-green)]' : 'text-[var(--alert-red)]'}`} />
                    {isConnected ? 'LIVE' : 'OFFLINE'}
                  </span>
                </div>

                <div className="flex gap-2 items-end">
                  <div className="flex-1 rounded-xl overflow-hidden bg-[var(--bg-tertiary)] border border-[rgba(212,175,55,0.1)]">
                    <textarea ref={inputRef} value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={handleKeyDown}
                      placeholder="Query the intelligence engine..." rows={1} disabled={isLoading}
                      className="w-full bg-transparent px-3 py-2.5 text-[11px] font-mono text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none resize-none max-h-[120px] min-h-[36px]"
                      onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 120) + 'px'; }}
                    />
                  </div>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSend} disabled={!inputText.trim() || isLoading}
                    className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 border ${
                      inputText.trim() && !isLoading
                        ? 'bg-[linear-gradient(135deg,rgba(0,229,255,0.2)_0%,rgba(0,229,255,0.1)_100%)] border-[rgba(0,229,255,0.3)]'
                        : 'bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)]'
                    }`}>
                    <Send className={`w-3.5 h-3.5 ${inputText.trim() && !isLoading ? 'text-[var(--cyan-primary)]' : 'text-[var(--text-muted)]'}`} />
                  </motion.button>
                </div>

                <div className="flex items-center justify-between mt-1.5 px-1">
                  <span className="text-[7px] font-mono text-[var(--text-muted)] tracking-wider">
                    {toolCount} TOOLS \u2022 {messages.filter((m) => m.role === 'user').length} QUERIES
                  </span>
                  <span className="text-[7px] font-mono text-[var(--text-muted)] tracking-wider">
                    14.9M VERTICES \u2022 360V/645E
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
