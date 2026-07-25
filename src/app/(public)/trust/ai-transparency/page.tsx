import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Transparency',
  description: 'How Gray Zone Monitor uses AI and how AI-assisted outputs are disclosed.',
};

export default function AITransparencyPage() {
  return (
    <main id="main-content" className="legal-page">
      <article aria-labelledby="ai-heading">
        <h1 id="ai-heading">AI Transparency</h1>
        <p>
          Gray Zone Monitor uses AI-assisted capabilities to help analysts summarize information,
          generate narrative outputs, and support investigative workflows. These capabilities are
          intended to accelerate analysis, not replace expert judgment.
        </p>

        <section>
          <h2>What We Disclose</h2>
          <ul>
            <li>When a user is interacting directly with an AI system</li>
            <li>When content is AI-generated or AI-assisted</li>
            <li>That AI output may be inaccurate, incomplete, or stale</li>
            <li>That human analyst review is required before operational, legal, or procurement use</li>
          </ul>
        </section>

        <section>
          <h2>What AI Does Not Do</h2>
          <ul>
            <li>AI output is not a factual guarantee</li>
            <li>AI output is not legal advice</li>
            <li>AI output is not a substitute for source verification</li>
          </ul>
        </section>
      </article>
    </main>
  );
}
