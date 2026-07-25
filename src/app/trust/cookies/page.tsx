import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy | Gray Zone Monitor',
  description: 'Cookie and tracking disclosures for Gray Zone Monitor.',
};

export default function CookiePolicyPage() {
  return (
    <main id="main-content" className="legal-page">
      <article aria-labelledby="cookie-heading">
        <h1 id="cookie-heading">Cookie Policy</h1>
        <p>
          This policy explains what cookies and similar technologies Gray Zone Monitor uses,
          what they do, and how you can control them.
        </p>

        <section>
          <h2>Categories</h2>
          <dl>
            <dt>Essential</dt>
            <dd>Required for login, session integrity, routing, fraud prevention, and core functionality.</dd>
            <dt>Functional</dt>
            <dd>Used to remember preferences and improve usability when enabled.</dd>
            <dt>Analytics</dt>
            <dd>Used to understand product usage and performance only where permitted.</dd>
            <dt>Performance</dt>
            <dd>Used to diagnose reliability issues and optimize service delivery.</dd>
          </dl>
        </section>

        <section>
          <h2>Cookie Inventory Structure</h2>
          <p>
            Our live cookie inventory should disclose: cookie name, provider, category, purpose,
            retention period, and whether the cookie is first-party or third-party.
          </p>
          <p>
            For EU/UK users, non-essential cookies require opt-in consent. For California users,
            opt-out rights and GPC support are honored where applicable.
          </p>
        </section>
      </article>
    </main>
  );
}
