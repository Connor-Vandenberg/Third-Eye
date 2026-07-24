export default function IntelPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-xl font-bold text-white mb-2">Intelligence Feed</h1>
      <p className="text-[13px] text-[rgba(240,240,255,0.5)] mb-6">
        Aggregated intelligence from GDELT, RSS, POLECAT, and 140+ other collectors
      </p>
      <div
        className="flex items-center justify-center rounded-lg h-96"
        style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="text-center">
          <p className="text-[32px] mb-3">📡</p>
          <p className="text-[14px] text-[rgba(240,240,255,0.5)]">Multi-source intelligence feed</p>
          <p className="text-[11px] text-[rgba(240,240,255,0.3)] mt-1">Wire to /api/v1/stream/alerts (SSE) next session</p>
        </div>
      </div>
    </div>
  );
}
