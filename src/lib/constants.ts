/**
 * GZM Navigation & Configuration Constants
 *
 * The Python backend runs on :8000 and provides:
 * - /aip/* (70+ tools, multi-step reasoning)
 * - /collab/* (WebSocket collaboration)
 * - /provenance/* (data lineage)
 * - /actions/* (writeback/real-world actions)
 * - /regen/* (intelligence briefs)
 * - /cases/* (case management)
 * - /mesh/* (P2P mesh network)
 * - /agents/* (multi-agent system)
 */

export const GZM_BACKEND_URL = process.env.NEXT_PUBLIC_GZM_BACKEND_URL || 'http://localhost:8000';
export const GZM_WS_URL = process.env.NEXT_PUBLIC_GZM_WS_URL || 'ws://localhost:8000';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  shortcut: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/', icon: 'grid', shortcut: 'G' },
  { id: 'intel', label: 'Intelligence', path: '/intel', icon: 'radio', shortcut: 'I' },
  { id: 'briefs', label: 'Briefs', path: '/briefs', icon: 'file-text', shortcut: 'B' },
  { id: 'cases', label: 'Cases', path: '/cases', icon: 'briefcase', shortcut: 'C' },
  { id: 'entities', label: 'Entities', path: '/entities', icon: 'users', shortcut: 'E' },
  { id: 'graph', label: 'Graph', path: '/graph', icon: 'share-2', shortcut: 'X' },
  { id: 'timeline', label: 'Timeline', path: '/timeline', icon: 'clock', shortcut: 'T' },
  { id: 'platforms', label: 'Platforms', path: '/platforms', icon: 'satellite', shortcut: 'P' },
  { id: 'mesh', label: 'Mesh', path: '/mesh', icon: 'network', shortcut: 'M' },
  { id: 'agents', label: 'Agents', path: '/agents', icon: 'bot', shortcut: 'N' },
];

export const NAV_BOTTOM: NavItem[] = [
  { id: 'reports', label: 'Reports', path: '/reports', icon: 'file-bar-chart', shortcut: 'R' },
  { id: 'alerts', label: 'Alerts', path: '/alerts', icon: 'bell', shortcut: 'A' },
];
