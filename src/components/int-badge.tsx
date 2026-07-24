'use client';

import { INT_DISCIPLINES } from '@/lib/constants';

type Discipline = keyof typeof INT_DISCIPLINES;

export function IntBadge({ discipline, size = 'sm' }: { discipline: Discipline | string; size?: 'xs' | 'sm' }) {
  const config = INT_DISCIPLINES[discipline as Discipline] || {
    color: 'var(--text-secondary)',
    bg: 'var(--surface-3)',
    label: discipline,
  };

  const fontSize = size === 'xs' ? '9px' : '10px';
  const padding = size === 'xs' ? '1px 5px' : '2px 7px';

  return (
    <span
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize,
        fontWeight: 700,
        padding,
        borderRadius: '3px',
        letterSpacing: '0.04em',
        color: config.color,
        background: config.bg,
        display: 'inline-flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
      }}
    >
      {config.label}
    </span>
  );
}
