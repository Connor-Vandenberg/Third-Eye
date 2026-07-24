export default function EntityDossierPage({ params }: { params: { id: string } }) {
  return (
    <div style={{ padding: 'var(--space-6)' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)' }}>
        ENTITY DOSSIER
      </p>
      <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
        {params.id}
      </h1>
      <p style={{ color: 'var(--text-secondary)' }}>
        Full multi-INT dossier with threat score, confidence, convergence signals,
        intelligence sources, connection graph, timeline, and collection history.
      </p>
    </div>
  );
}
