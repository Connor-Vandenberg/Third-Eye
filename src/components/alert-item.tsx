'use client';

import { IntBadge } from './int-badge';
import { PRIORITY_LABELS } from '@/lib/constants';
import type { Alert } from '@/lib/types';

export function AlertItem({ alert, onClick }: { alert: Alert; onClick?: () => void }) {
  const priority = PRIORITY_LABELS[alert.priority] || PRIORITY_LABELS[3];
  return (
    <div onClick={onClick} style={{ display: 'grid', gridTemplateColumns: 'auto auto 1fr auto', gap: '10px', alignItems: 'center', padding: '8px 12px', borderRadius: '6px', cursor: onClick ? 'pointer' : 'default', transition: 'background var(--duration-fast) var(--ease-out)' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', fontFeatureSettings: "'tnum' 1", minWidth: '60px' }}>{new Date(alert.timestamp).toLocaleTimeString('en-GB', { hour12: false })}</span>
      <IntBadge discipline={alert.source_int} size="xs" />
      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alert.message}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '3px', color: priority.color, background: priority.bg }}>{priority.label}</span>
    </div>
  );
}
