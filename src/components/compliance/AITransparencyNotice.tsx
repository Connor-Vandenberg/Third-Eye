'use client';

/**
 * AI Transparency Notice
 *
 * Covers EU AI Act Article 50 style disclosure needs:
 * - user is interacting with an AI system
 * - output may be AI-generated or AI-assisted
 * - analyst review disclaimer for high-consequence use
 *
 * This is not just EU fluff. It is good product hygiene.
 */

interface AITransparencyNoticeProps {
  mode?: 'chat' | 'summary' | 'report' | 'recommendation';
  compact?: boolean;
}

const MODE_COPY: Record<string, { title: string; body: string }> = {
  chat: {
    title: 'AI interaction notice',
    body: 'You are interacting with an AI system. Responses may be inaccurate, incomplete, or outdated and should be reviewed by a human analyst before operational use.',
  },
  summary: {
    title: 'AI-generated summary',
    body: 'This summary was generated or assisted by AI from available data sources. Verify important claims before making operational, legal, or procurement decisions.',
  },
  report: {
    title: 'AI-assisted report',
    body: 'This report contains AI-generated or AI-assisted content. It is intended to support analyst workflows, not replace expert review.',
  },
  recommendation: {
    title: 'AI-generated recommendation',
    body: 'This recommendation was generated with AI assistance. Validate assumptions, sources, and outputs before acting on it.',
  },
};

export function AITransparencyNotice({
  mode = 'summary',
  compact = false,
}: AITransparencyNoticeProps) {
  const copy = MODE_COPY[mode] ?? MODE_COPY.summary;

  if (compact) {
    return (
      <div
        role="note"
        aria-label={copy.title}
        className="ai-transparency-notice ai-transparency-notice-compact"
      >
        <strong>AI:</strong> {copy.body}
      </div>
    );
  }

  return (
    <aside
      role="note"
      aria-labelledby="ai-transparency-title"
      className="ai-transparency-notice"
    >
      <h3 id="ai-transparency-title">{copy.title}</h3>
      <p>{copy.body}</p>
    </aside>
  );
}
