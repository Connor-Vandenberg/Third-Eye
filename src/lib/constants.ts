export const NAV_ITEMS = [
  { id: 'globe', label: 'Globe', icon: 'globe', path: '/', shortcut: 'G' },
  { id: 'intel', label: 'Intel Feed', icon: 'radio', path: '/intel', shortcut: 'I' },
  { id: 'entities', label: 'Entities', icon: 'users', path: '/entities', shortcut: 'E' },
  { id: 'graph', label: 'Graph', icon: 'git-branch', path: '/graph', shortcut: 'X' },
  { id: 'timeline', label: 'Timeline', icon: 'clock', path: '/timeline', shortcut: 'T' },
  { id: 'platforms', label: 'Platforms', icon: 'satellite', path: '/platforms', shortcut: 'P' },
  { id: 'reports', label: 'Reports', icon: 'file-text', path: '/reports', shortcut: 'R' },
] as const;

export const NAV_BOTTOM = [
  { id: 'alerts', label: 'Alerts', icon: 'bell', path: '/alerts', shortcut: 'A' },
  { id: 'settings', label: 'Settings', icon: 'settings', path: '/settings', shortcut: '' },
] as const;

export const INT_DISCIPLINES = {
  OSINT: { color: 'var(--osint)', bg: 'var(--accent-subtle)', label: 'OSINT' },
  SIGINT: { color: 'var(--sigint)', bg: 'var(--purple-subtle)', label: 'SIGINT' },
  IMINT: { color: 'var(--imint)', bg: 'var(--green-subtle)', label: 'IMINT' },
  HUMINT: { color: 'var(--humint)', bg: 'var(--amber-subtle)', label: 'HUMINT' },
  MASINT: { color: 'var(--masint)', bg: 'var(--blue-subtle)', label: 'MASINT' },
  FININT: { color: 'var(--finint)', bg: 'var(--amber-subtle)', label: 'FININT' },
  GEOINT: { color: 'var(--geoint)', bg: 'var(--blue-subtle)', label: 'GEOINT' },
} as const;

export const PLATFORM_DOMAINS = {
  aerial: { color: 'var(--domain-aerial)', label: 'Aerial' },
  maritime: { color: 'var(--domain-maritime)', label: 'Maritime' },
  ground: { color: 'var(--domain-ground)', label: 'Ground' },
  space: { color: 'var(--domain-space)', label: 'Space' },
  cyber: { color: 'var(--domain-cyber)', label: 'Cyber' },
} as const;

export const PRIORITY_LABELS: Record<number, { label: string; color: string; bg: string }> = {
  0: { label: 'P0', color: 'var(--red)', bg: 'var(--red-subtle)' },
  1: { label: 'P1', color: 'var(--amber)', bg: 'var(--amber-subtle)' },
  2: { label: 'P2', color: 'var(--text-secondary)', bg: 'var(--surface-3)' },
  3: { label: 'P3', color: 'var(--text-tertiary)', bg: 'var(--surface-2)' },
  4: { label: 'P4', color: 'var(--text-muted)', bg: 'var(--surface-2)' },
};
