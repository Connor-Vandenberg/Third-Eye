export default function TimelinePage() {
  return (
    <div style={{ padding: 'var(--space-6)' }}>
      <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
        Timeline
      </h1>
      <p style={{ color: 'var(--text-secondary)' }}>
        Temporal analysis with 5-domain swim lanes (Conflict, Sanctions, Cyber, Economic, Maritime).
        Event dots with severity coloring, time-range scrubber, and playback controls.
      </p>
    </div>
  );
}
