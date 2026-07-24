export default function IntelPage() {
  return (
    <div style={{ padding: 'var(--space-6)' }}>
      <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
        Intelligence Feed
      </h1>
      <p style={{ color: 'var(--text-secondary)' }}>
        Real-time multi-INT intelligence stream. WebSocket-connected live feed with domain filtering,
        priority sorting, and entity linking.
      </p>
    </div>
  );
}
