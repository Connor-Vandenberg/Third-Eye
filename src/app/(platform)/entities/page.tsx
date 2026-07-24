export default function EntitiesPage() {
  return (
    <div style={{ padding: 'var(--space-6)' }}>
      <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
        Entities
      </h1>
      <p style={{ color: 'var(--text-secondary)' }}>
        Search and browse all tracked entities. Filter by type, threat level, confidence,
        and last observed time. Click any entity for full dossier.
      </p>
    </div>
  );
}
