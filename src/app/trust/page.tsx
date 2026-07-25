import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trust Center | Gray Zone Monitor',
  description: 'Security, privacy, accessibility, subprocessors, AI transparency, and procurement documentation for Gray Zone Monitor.',
};

export default function TrustCenterPage() {
  return (
    <main id="main-content" className="legal-page">
      <article aria-labelledby="trust-heading">
        <h1 id="trust-heading">Trust Center</h1>
        <p>
          This is the public compliance and procurement hub for Gray Zone Monitor.
          It centralizes accessibility, privacy, security, AI transparency, subprocessors,
          and buyer-facing documentation.
        </p>

        <section>
          <h2>Policies & Legal</h2>
          <ul>
            <li><a href="/legal/privacy">Privacy Policy</a></li>
            <li><a href="/legal/terms">Terms of Service</a></li>
            <li><a href="/legal/accessibility">Accessibility Statement</a></li>
            <li><a href="/legal/do-not-sell">Do Not Sell or Share</a></li>
            <li><a href="/trust/cookies">Cookie Policy</a></li>
            <li><a href="/trust/ai-transparency">AI Transparency</a></li>
          </ul>
        </section>

        <section>
          <h2>Security & Operations</h2>
          <ul>
            <li><a href="/trust/security">Security Overview</a></li>
            <li><a href="/trust/subprocessors">Subprocessors</a></li>
            <li><a href="/.well-known/security.txt">security.txt</a></li>
          </ul>
        </section>

        <section>
          <h2>Accessibility & Support</h2>
          <ul>
            <li><a href="/trust/accessibility-guide">Accessibility User Guide</a></li>
            <li><a href="/trust/keyboard-guide">Keyboard Navigation Guide</a></li>
          </ul>
        </section>

        <section>
          <h2>Contracts & Procurement</h2>
          <ul>
            <li><a href="/trust/dpa">Data Processing Addendum (DPA)</a></li>
            <li><a href="/trust/scc">Standard Contractual Clauses (SCC) Info</a></li>
            <li><a href="/trust/procurement">Procurement Pack</a></li>
          </ul>
        </section>
      </article>
    </main>
  );
}
