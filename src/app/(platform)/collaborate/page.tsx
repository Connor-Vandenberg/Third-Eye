'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Cursor, MessageSquare, MapPin, PenTool, Eye,
  Lock, Unlock, Share2, Bell, CheckCircle, Circle,
  ChevronRight, Send, Paperclip, AtSign, Hash, Star,
  Radio, Globe, Shield, Zap, Target, Clock
} from 'lucide-react';

interface Operator {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  status: 'active' | 'idle' | 'away';
  currentView: string;
  cursorPosition?: { x: number; y: number };
  selectedEntity?: string;
  lastAction: string;
}

interface Annotation {
  id: string;
  type: 'marker' | 'area' | 'line' | 'text' | 'threat_assessment';
  author: string;
  authorColor: string;
  content: string;
  position: { lat: number; lng: number };
  timestamp: string;
  priority: 'critical' | 'high' | 'normal';
  acknowledged: string[];
}

interface ChatMessage {
  id: string;
  author: string;
  authorColor: string;
  content: string;
  timestamp: string;
  type: 'message' | 'system' | 'alert' | 'entity_share';
  entityRef?: { id: string; name: string; type: string };
  reactions?: Array<{ emoji: string; users: string[] }>;
}

interface EntityLock {
  entityId: string;
  entityName: string;
  lockedBy: string;
  lockedByColor: string;
  lockedAt: string;
  reason: string;
}

const MOCK_OPERATORS: Operator[] = [
  { id: 'op-1', name: 'CPT Rodriguez', role: 'Intelligence Analyst', avatar: 'CR', color: '#3b82f6', status: 'active', currentView: '/cop', lastAction: 'Annotated Crimea AOI' },
  { id: 'op-2', name: 'SGT Kim', role: 'SIGINT Operator', avatar: 'SK', color: '#10b981', status: 'active', currentView: '/signals', selectedEntity: 'Kaliningrad Military Flights', lastAction: 'Tasked ADS-B collection' },
  { id: 'op-3', name: 'MAJ Okonkwo', role: 'Fusion Lead', avatar: 'MO', color: '#f59e0b', status: 'active', currentView: '/globe', lastAction: 'Confirmed convergence spike' },
  { id: 'op-4', name: 'SPC Vasquez', role: 'GEOINT Analyst', avatar: 'SV', color: '#8b5cf6', status: 'idle', currentView: '/satellites', lastAction: '3m ago: Reviewed Sentinel pass' },
  { id: 'op-5', name: 'LT Chen', role: 'Cyber Operator', avatar: 'LC', color: '#ef4444', status: 'away', currentView: '/entities', lastAction: '12m ago: BGP analysis complete' },
];

const MOCK_ANNOTATIONS: Annotation[] = [
  { id: 'ann-1', type: 'threat_assessment', author: 'CPT Rodriguez', authorColor: '#3b82f6', content: 'ASSESSED: Russian naval buildup exceeds exercise parameters. Recommend WATCHCON 2.', position: { lat: 45.3, lng: 34.5 }, timestamp: '5m ago', priority: 'critical', acknowledged: ['MAJ Okonkwo'] },
  { id: 'ann-2', type: 'marker', author: 'SGT Kim', authorColor: '#10b981', content: 'New SIGINT intercept: encrypted burst transmission 4.2GHz', position: { lat: 54.7, lng: 20.5 }, timestamp: '12m ago', priority: 'high', acknowledged: [] },
  { id: 'ann-3', type: 'area', author: 'MAJ Okonkwo', authorColor: '#f59e0b', content: 'Convergence zone: 4+ independent sources agree on military mobilization', position: { lat: 23.5, lng: 120.2 }, timestamp: '18m ago', priority: 'critical', acknowledged: ['CPT Rodriguez', 'SGT Kim'] },
];

const MOCK_CHAT: ChatMessage[] = [
  { id: 'msg-1', author: 'MAJ Okonkwo', authorColor: '#f59e0b', content: 'Convergence spike in SCS just hit 82. Multiple AIS dark zones forming.', timestamp: '2m ago', type: 'alert' },
  { id: 'msg-2', author: 'CPT Rodriguez', authorColor: '#3b82f6', content: 'Correlates with my Crimea assessment. Pattern matches pre-2022 signature.', timestamp: '1m ago', type: 'message' },
  { id: 'msg-3', author: 'SGT Kim', authorColor: '#10b981', content: 'Tasking additional ADS-B coverage for Kaliningrad corridor', timestamp: '45s ago', type: 'message', entityRef: { id: 'e-kal', name: 'Kaliningrad Military Flights', type: 'Track Collection' } },
  { id: 'msg-4', author: 'System', authorColor: '#6b7280', content: 'Novel signal detected: vector drift 2.3σ in Baltic maritime baseline', timestamp: '30s ago', type: 'system' },
  { id: 'msg-5', author: 'MAJ Okonkwo', authorColor: '#f59e0b', content: 'Recommend we brief the J2 on combined SCS + Baltic activity. This looks coordinated.', timestamp: '15s ago', type: 'message', reactions: [{ emoji: '👍', users: ['CPT Rodriguez', 'SGT Kim'] }] },
];

const MOCK_LOCKS: EntityLock[] = [
  { entityId: 'e-001', entityName: 'Wagner Group PMC', lockedBy: 'CPT Rodriguez', lockedByColor: '#3b82f6', lockedAt: '8m ago', reason: 'Updating relationship network' },
  { entityId: 'e-002', entityName: 'Sudan Instability Index', lockedBy: 'MAJ Okonkwo', lockedByColor: '#f59e0b', lockedAt: '3m ago', reason: 'Verifying prediction outputs' },
];

function OperatorPresence({ operator }: { operator: Operator }) {
  const statusColor = operator.status === 'active' ? '#10b981' : operator.status === 'idle' ? '#fbbf24' : '#6b7280';
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-800/50 transition-colors">
      <div className="relative">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: operator.color }}>
          {operator.avatar}
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-zinc-900" style={{ backgroundColor: statusColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-200 font-medium">{operator.name}</span>
          <span className="text-[8px] text-zinc-500">{operator.role}</span>
        </div>
        <div className="flex items-center gap-1 text-[9px] text-zinc-500">
          <Eye className="w-2.5 h-2.5" />
          <span>{operator.currentView}</span>
          {operator.selectedEntity && <span className="text-zinc-400">• {operator.selectedEntity}</span>}
        </div>
      </div>
    </div>
  );
}

export default function CollaboratePage() {
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState(MOCK_CHAT);
  const [activeTab, setActiveTab] = useState<'presence' | 'annotations' | 'locks'>('presence');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      author: 'You',
      authorColor: '#06b6d4',
      content: chatInput,
      timestamp: 'now',
      type: 'message',
    };
    setMessages(prev => [...prev, newMsg]);
    setChatInput('');
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-white">
      {/* Left Panel: Presence & Annotations */}
      <div className="w-80 border-r border-zinc-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <h1 className="text-sm font-bold">Real-Time Collaboration</h1>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">{MOCK_OPERATORS.filter(o => o.status === 'active').length} online</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800">
          {(['presence', 'annotations', 'locks'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-3 py-2 text-[10px] uppercase tracking-wider font-medium border-b-2 transition-colors ${
                activeTab === tab ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'presence' && (
            <div className="p-2 space-y-0.5">
              {MOCK_OPERATORS.map((op) => <OperatorPresence key={op.id} operator={op} />)}

              {/* Session Info */}
              <div className="mt-4 mx-3 p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                <h4 className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-2">Session Info</h4>
                <div className="space-y-1.5 text-[10px]">
                  <div className="flex justify-between"><span className="text-zinc-500">Session ID</span><span className="text-zinc-300 font-mono">GZM-OPS-2026-07-26</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Protocol</span><span className="text-zinc-300">WebSocket + Nostr (fallback)</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Encryption</span><span className="text-emerald-400">E2E (AES-256-GCM)</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Recording</span><span className="text-yellow-400">● Active</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">RBAC Level</span><span className="text-zinc-300">SECRET//NOFORN</span></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'annotations' && (
            <div className="p-3 space-y-2">
              {MOCK_ANNOTATIONS.map((ann) => (
                <div key={ann.id} className={`p-3 rounded-lg border ${
                  ann.priority === 'critical' ? 'bg-red-500/5 border-red-500/20' : ann.priority === 'high' ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-zinc-900/50 border-zinc-800'
                }`}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ann.authorColor }} />
                    <span className="text-[10px] text-zinc-300 font-medium">{ann.author}</span>
                    <span className="text-[8px] text-zinc-600">{ann.timestamp}</span>
                    <span className={`text-[8px] px-1 rounded uppercase ${ann.priority === 'critical' ? 'bg-red-500/20 text-red-400' : ann.priority === 'high' ? 'bg-yellow-500/20 text-yellow-400' : 'text-zinc-500'}`}>
                      {ann.priority}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-300 mt-1.5">{ann.content}</p>
                  {ann.acknowledged.length > 0 && (
                    <div className="flex items-center gap-1 mt-2 text-[9px] text-zinc-500">
                      <CheckCircle className="w-2.5 h-2.5 text-emerald-500" />
                      <span>Ack: {ann.acknowledged.join(', ')}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'locks' && (
            <div className="p-3 space-y-2">
              {MOCK_LOCKS.map((lock) => (
                <div key={lock.entityId} className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-xs text-white font-medium">{lock.entityName}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 text-[10px]">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: lock.lockedByColor }} />
                    <span className="text-zinc-400">{lock.lockedBy}</span>
                    <span className="text-zinc-600">• {lock.lockedAt}</span>
                  </div>
                  <p className="text-[9px] text-zinc-500 mt-1">{lock.reason}</p>
                </div>
              ))}
              {MOCK_LOCKS.length === 0 && (
                <p className="text-[10px] text-zinc-500 text-center py-8">No entities currently locked</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main: Collaborative Map View (placeholder) */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 relative bg-zinc-900/30 flex items-center justify-center">
          {/* Cursor overlays */}
          <motion.div
            className="absolute z-20"
            style={{ left: '35%', top: '40%' }}
            animate={{ x: [0, 10, -5, 0], y: [0, -5, 10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Cursor className="w-4 h-4 text-blue-400" style={{ transform: 'rotate(-20deg)' }} />
            <span className="text-[8px] bg-blue-500 text-white px-1 rounded mt-0.5 inline-block">CPT Rodriguez</span>
          </motion.div>
          <motion.div
            className="absolute z-20"
            style={{ left: '60%', top: '55%' }}
            animate={{ x: [0, -8, 5, 0], y: [0, 8, -3, 0] }}
            transition={{ duration: 5, repeat: Infinity, delay: 1 }}
          >
            <Cursor className="w-4 h-4 text-yellow-400" style={{ transform: 'rotate(10deg)' }} />
            <span className="text-[8px] bg-yellow-500 text-white px-1 rounded mt-0.5 inline-block">MAJ Okonkwo</span>
          </motion.div>

          {/* Center message */}
          <div className="text-center z-10">
            <Globe className="w-16 h-16 text-zinc-800 mx-auto" />
            <p className="text-sm text-zinc-600 mt-3">Shared COP View</p>
            <p className="text-[10px] text-zinc-700">Real-time cursor sync • Shared annotations • Entity locking • Session recording</p>
            <p className="text-[10px] text-zinc-700 mt-1">Integration: api/collaboration.py WebSocket (presence, cursors, annotations, markup, chat)</p>
          </div>
        </div>
      </div>

      {/* Right Panel: Chat */}
      <div className="w-80 border-l border-zinc-800 flex flex-col">
        <div className="p-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-medium text-zinc-300">Ops Chat</span>
            <span className="text-[9px] text-zinc-500">(encrypted)</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`${msg.type === 'system' ? 'text-center' : ''}`}>
              {msg.type === 'system' ? (
                <div className="flex items-center gap-2 justify-center">
                  <div className="h-px flex-1 bg-zinc-800" />
                  <span className="text-[9px] text-zinc-500 flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 text-yellow-500" />{msg.content}
                  </span>
                  <div className="h-px flex-1 bg-zinc-800" />
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ backgroundColor: msg.authorColor }}>
                      {msg.author.split(' ').map(w => w[0]).join('')}
                    </div>
                    <span className="text-[10px] font-medium" style={{ color: msg.authorColor }}>{msg.author}</span>
                    <span className="text-[8px] text-zinc-600">{msg.timestamp}</span>
                  </div>
                  <p className={`text-xs text-zinc-300 mt-1 ml-6 ${msg.type === 'alert' ? 'text-yellow-300' : ''}`}>
                    {msg.type === 'alert' && <AlertTriangle className="w-3 h-3 text-yellow-400 inline mr-1" />}
                    {msg.content}
                  </p>
                  {msg.entityRef && (
                    <div className="ml-6 mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800/50 border border-zinc-700/30">
                      <Target className="w-2.5 h-2.5 text-cyan-400" />
                      <span className="text-[9px] text-cyan-400">{msg.entityRef.name}</span>
                    </div>
                  )}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className="ml-6 mt-1 flex gap-1">
                      {msg.reactions.map((r, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700/30">
                          {r.emoji} {r.users.length}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-zinc-800">
          <div className="relative">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Message ops channel..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 pr-10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50"
            />
            <button
              onClick={handleSendMessage}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-cyan-400 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-[9px] text-zinc-600">
            <span>E2E encrypted</span>
            <span>•</span>
            <span>Session recorded</span>
            <span>•</span>
            <span>@ to mention, # to tag entity</span>
          </div>
        </div>
      </div>
    </div>
  );
}
