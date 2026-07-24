'use client';

export function ConfidenceBar({ value, width = 60 }: { value: number; width?: number }) {
  const v = Math.max(0, Math.min(1, value));
  const color = v >= 0.8 ? 'var(--green)' : v >= 0.5 ? 'var(--amber)' : 'var(--red)';

  return (
    <div style={{ width: `${width}px`, height: '4px', background: 'var(--surface-3)', borderRadius: '2px', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${v * 100}%`, background: color, borderRadius: '2px', transition: 'width var(--duration-normal) var(--ease-out)' }} />
    </div>
  );
}
