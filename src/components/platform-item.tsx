'use client';

import { PLATFORM_DOMAINS } from '@/lib/constants';
import type { Platform } from '@/lib/types';

const STATUS_STYLES: Record<string, { bg: string; color: string }> = { active: { bg: 'var(--green-subtle)', color: 'var(--green)' }, tasked: { bg: 'var(--amber-subtle)', color: 'var(--amber)' }, idle: { bg: 'var(--surface-3)', color: 'var(--text-muted)' }, offline: { bg: 'var(--red-subtle)', color: 'var(--red)' } };
const DOMAIN_ICONS: Record<string, string> = { aerial: '\u2708', maritime: '\u2693', ground: '\u25A3', space: '\u263D', cyber: '\u26A1' };

export function PlatformItem({ platform, onClick, isActive }: { platform: Platform; onClick?: () => void; isActive?: boolean }) {
  const domainConfig = PLATFORM_DOMAINS[platform.domain] || { color: 'var(--text-secondary)', label: 'Unknown' };
  const statusStyle = STATUS_STYLES[platform.status] || STATUS_STYLES.idle;
  return (
    <div onClick={onClick} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', background: isActive ? 'var(--surface-3)' : 'transparent', transition: 'background var(--duration-fast) var(--ease-out)' }} onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--surface-2)'; }} onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>
      <span style={{ fontSize: '16px', color: domainConfig.color }}>{DOMAIN_ICONS[platform.domain] || '?'}</span>
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{platform.name}</div>
        {platform.sensors.length > 0 && <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{platform.sensors.join(' \u2022 ')}</div>}
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '3px', color: statusStyle.color, background: statusStyle.bg, textTransform: 'uppercase' }}>{platform.status}</span>
    </div>
  );
}
