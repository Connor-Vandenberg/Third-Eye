import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Transparency | Gray Zone Monitor',
  description: 'How Gray Zone Monitor discloses AI-assisted interactions and generated outputs.',
};

export default function AITransparencyPage() {
  return (
    <main id="main-content" className="legal-page">
      <article aria-labelledby="ai-heading">
        <h1 id="ai-heading">AI Transparency</h1>
        <p>
          Gray Zone Monitor includes AI-assisted features for synthesis, summarization,
          prioritization, and analytical support. AI features can help accelerate analysis,
          but may still be incomplete, misleading, or incorrect.
        </p>

        <section>
          <h2>How We Disclose AI Use</h2>
          <ul>
            <li>Users are informed when interacting directly with AI-assisted systems</li>
            <li>AI-generated or AI-assisted outputs are labeled in the interface</li>
            <li>High-consequence outputs should be analyst-reviewed before action</li>
          </ul>
        </section>

        <section>
          <h2>Operational Limitations</h2>
          <p>
            AI outputs are assistance, not authority. They do not replace source validation,
            policy review, legal review, or human operational judgment.
          </p>
        </section>
      </article>
    </main>
  );
}
