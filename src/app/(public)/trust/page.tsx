import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trust Center',
  description: 'Gray Zone Monitor trust center: accessibility, privacy, subprocessors, DPA, AI transparency, and procurement documents.',
};

export default function TrustCenterPage() {
  return (
    <main id="main-content" className="legal-page">
      <article aria-labelledby="trust-heading">
        <h1 id="trust-heading">Trust Center</h1>
        <p>
          This is the public compliance and procurement hub for Gray Zone Monitor.
          If you are evaluating GZM for enterprise, government, nonprofit, or international use,
          start here.
        </p>

        <section>
          <h2>Core Documents</h2>
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
          <h2>Accessibility & Procurement</h2>
          <ul>
            <li><a href="/trust/accessibility-guide">Accessibility User Guide</a></li>
            <li><a href="/trust/support-accessibility">Support Accessibility Information</a></li>
            <li><a href="/trust/procurement">Procurement Pack</a></li>
          </ul>
        </section>

        <section>
          <h2>Privacy & Data Processing</h2>
          <ul>
            <li><a href="/trust/dpa">Data Processing Addendum (DPA)</a></li>
            <li><a href="/trust/subprocessors">Subprocessors</a></li>
          </ul>
        </section>

        <section>
          <h2>Security</h2>
          <ul>
            <li><a href="/.well-known/security.txt">security.txt</a></li>
          </ul>
        </section>
      </article>
    </main>
  );
}
