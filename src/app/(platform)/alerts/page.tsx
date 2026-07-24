export default function AlertsPage() {
  return (
    <div style={{ padding: 'var(--space-6)' }}>
      <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
        Alerts
      </h1>
      <p style={{ color: 'var(--text-secondary)' }}>
        Active convergence alerts, ISR requirement notifications, platform status changes.
        Priority-sorted with acknowledgement workflow and escalation chains.
      </p>
    </div>
  );
}
