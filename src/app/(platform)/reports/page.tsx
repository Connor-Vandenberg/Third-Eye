export default function ReportsPage() {
  return (
    <div style={{ padding: 'var(--space-6)' }}>
      <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
        Reports
      </h1>
      <p style={{ color: 'var(--text-secondary)' }}>
        Generate intelligence reports: Country Briefings, Entity Dossiers, Situation Reports,
        ISR Collection Summaries. Export as PDF, STIX 2.1, or CSV.
      </p>
    </div>
  );
}
