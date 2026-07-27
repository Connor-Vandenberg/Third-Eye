// Third-Eye Navigation Configuration
// All 25 pages wired into the platform

import {
  Globe, BarChart3, Brain, Target, Zap, Shield, Eye,
  Radio, Network, Layers, Users, Activity, Clock,
  Map, Search, Bell, Crosshair, Satellite, FileText,
  Database, MessageSquare, Sparkles, Server, PenTool,
  BookOpen
} from 'lucide-react';

export interface NavItem {
  path: string;
  label: string;
  icon: any;
  category: string;
  badge?: string;
  isNew?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  // Intelligence
  { path: '/cop', label: 'Common Operating Picture', icon: Map, category: 'Intelligence' },
  { path: '/globe', label: '3D Intelligence Globe', icon: Globe, category: 'Intelligence', isNew: true },
  { path: '/signals', label: 'Novel Signal Explorer', icon: Zap, category: 'Intelligence' },
  { path: '/entities', label: 'Entity Database', icon: Users, category: 'Intelligence' },
  { path: '/graph', label: 'Knowledge Graph', icon: Network, category: 'Intelligence' },
  { path: '/timeline', label: 'Event Timeline', icon: Clock, category: 'Intelligence' },
  { path: '/intel', label: 'Intelligence Feed', icon: Eye, category: 'Intelligence' },

  // Analysis
  { path: '/analyst', label: 'AI Analyst (AIP)', icon: Brain, category: 'Analysis', isNew: true },
  { path: '/metrics', label: 'Impact & Metrics', icon: BarChart3, category: 'Analysis', isNew: true },
  { path: '/analysis-builder', label: 'Analysis Builder', icon: Sparkles, category: 'Analysis', isNew: true },
  { path: '/search', label: 'Federated Search', icon: Search, category: 'Analysis' },
  { path: '/briefs', label: 'Intelligence Briefs', icon: FileText, category: 'Analysis' },
  { path: '/reports', label: 'Report Generator', icon: BookOpen, category: 'Analysis' },

  // Operations
  { path: '/tasking', label: 'Autonomous Tasking', icon: Crosshair, category: 'Operations' },
  { path: '/lifecycle', label: 'Task Lifecycle', icon: Activity, category: 'Operations', isNew: true },
  { path: '/satellites', label: 'Satellite Control', icon: Satellite, category: 'Operations' },
  { path: '/platforms', label: 'Platform Fleet', icon: Radio, category: 'Operations' },
  { path: '/alerts', label: 'Alert Center', icon: Bell, category: 'Operations' },
  { path: '/watchlist', label: 'Watchlist Manager', icon: Target, category: 'Operations' },

  // System
  { path: '/learning', label: 'Self-Learning (R-Zero)', icon: Brain, category: 'System' },
  { path: '/mesh', label: 'Mesh & DDIL', icon: Server, category: 'System', isNew: true },
  { path: '/schema-explorer', label: 'Schema Registry', icon: Database, category: 'System', isNew: true },
  { path: '/collaborate', label: 'Collaboration', icon: MessageSquare, category: 'System', isNew: true },
  { path: '/cases', label: 'Case Manager', icon: Shield, category: 'System' },
  { path: '/agents', label: 'AI Agents', icon: Layers, category: 'System' },
];

export const NAV_CATEGORIES = ['Intelligence', 'Analysis', 'Operations', 'System'];

export default NAV_ITEMS;
