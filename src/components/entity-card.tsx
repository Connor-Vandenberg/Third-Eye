'use client';

import { IntBadge } from './int-badge';
import { ConfidenceBar } from './confidence-bar';
import type { Entity } from '@/lib/types';

export function EntityCard({ entity, onClick, compact = false }: { entity: Entity; onClick?: () => void; compact?: boolean }) {
  const threatColor = entity.threat_score >= 0.8 ? 'var(--red)' : entity.threat_score >= 0.5 ? 'var(--amber)' : 'var(--green)';

  if (compact) {
    return (
      <div onClick={onClick} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '6px', cursor: 'pointer', background: 'var(--surface-2)', transition: 'background var(--duration-fast) var(--ease-out)' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-3)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}>
        <div><div style={{ fontSize: '13px', fontWeight: 600 }}>{entity.name}</div><div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{entity.type}</div></div>
        <ConfidenceBar value={entity.confidence} width={48} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: threatColor }}>{entity.threat_score.toFixed(2)}</span>
      </div>
    );
  }

  return (
    <div onClick={onClick} style={{ background: 'var(--surface-2)', borderRadius: '8px', padding: '16px', cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>{entity.type}</div>
          <div style={{ fontSize: '16px', fontWeight: 700 }}>{entity.name}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{entity.id}</div>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color: threatColor }}>{entity.threat_score.toFixed(2)}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
        <ScoreBlock label="Threat" value={entity.threat_score} color={threatColor} />
        <ScoreBlock label="Confidence" value={entity.confidence} color={entity.confidence >= 0.7 ? 'var(--green)' : 'var(--amber)'} />
        <ScoreBlock label="Convergence" value={entity.convergence_score} color={entity.convergence_score >= 0.8 ? 'var(--red)' : 'var(--text-secondary)'} />
      </div>
      {entity.sources.length > 0 && (
        <div>
          <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '8px' }}>Intelligence Sources ({entity.sources.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {entity.sources.slice(0, 6).map((src, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: '8px', padding: '6px 8px', background: 'var(--surface-1)', borderRadius: '4px' }}>
                <IntBadge discipline={src.discipline} size="xs" />
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{src.detail}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>{src.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreBlock({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ padding: '8px 10px', background: 'var(--surface-1)', borderRadius: '5px' }}>
      <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color, fontFeatureSettings: "'tnum' 1" }}>{value.toFixed(2)}</div>
    </div>
  );
}
