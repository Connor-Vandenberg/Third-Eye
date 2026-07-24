export default function GlobePage() {
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-3)' }}>
          Gray Zone Monitor
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)' }}>
          Multi-domain intelligence fusion. MapLibre GL globe renders here.
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-4)' }}>
          146+ collectors &bull; 89+ engines &bull; 1,340+ convergence signals
        </p>
      </div>
    </div>
  );
}
