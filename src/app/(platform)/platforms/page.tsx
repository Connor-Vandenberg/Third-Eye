export default function PlatformsPage() {
  return (
    <div style={{ padding: 'var(--space-6)' }}>
      <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
        Connected Platforms
      </h1>
      <p style={{ color: 'var(--text-secondary)' }}>
        Multi-domain platform status: aerial (drones), space (satellites), ground (UGVs/sensors),
        maritime (USVs/AIS). Live telemetry, mission assignments, and ISR task queue.
      </p>
    </div>
  );
}
