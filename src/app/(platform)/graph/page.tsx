export default function GraphPage() {
  return (
    <div style={{ padding: 'var(--space-6)' }}>
      <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
        Graph Explorer
      </h1>
      <p style={{ color: 'var(--text-secondary)' }}>
        Interactive knowledge graph visualization. React Flow canvas with entity nodes,
        relationship edges, expand-on-click, path finding, and community detection overlays.
      </p>
    </div>
  );
}
