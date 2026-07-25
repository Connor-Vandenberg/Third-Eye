'use client';

/**
 * EU AI Act Article 50 Transparency Notices.
 *
 * Applies from 2 Aug 2026 for EU users interacting with AI systems.
 * Requirements addressed:
 * - Inform users when they interact with AI
 * - Label AI-generated content
 * - Add machine/human review context
 *
 * This is a pragmatic UI layer, not the full legal program.
 */

import { ReactNode } from 'react';

export function AIInteractionBanner({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <div
      role="note"
      aria-label="AI interaction disclosure"
      className={`ai-transparency-banner ${compact ? 'ai-transparency-banner-compact' : ''}`}
    >
      <strong>AI disclosure:</strong> You are interacting with an AI-assisted system.
      Outputs may be incomplete or wrong and should be analyst-reviewed before operational use.
    </div>
  );
}

export function AIGeneratedLabel({
  children,
  type = 'summary',
}: {
  children: ReactNode;
  type?: 'summary' | 'report' | 'recommendation' | 'analysis';
}) {
  return (
    <section
      aria-labelledby="ai-generated-heading"
      className="ai-generated-block"
    >
      <div className="ai-generated-meta">
        <span className="ai-generated-chip">AI-generated {type}</span>
        <span className="ai-generated-subtext">
          Analyst verification recommended
        </span>
      </div>
      <div>{children}</div>
    </section>
  );
}

export function AIReviewDisclaimer() {
  return (
    <p className="ai-review-disclaimer">
      This content was generated or assisted by AI. Do not treat it as conclusive intelligence,
      legal advice, or operational direction without human review.
    </p>
  );
}
