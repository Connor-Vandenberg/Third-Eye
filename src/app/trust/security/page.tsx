import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security Overview | Gray Zone Monitor',
  description: 'Public security overview for Gray Zone Monitor.',
};

export default function SecurityOverviewPage() {
  return (
    <main id="main-content" className="legal-page">
      <article aria-labelledby="security-heading">
        <h1 id="security-heading">Security Overview</h1>
        <p>
          Gray Zone Monitor follows a defense-oriented security posture with layered controls
          across infrastructure, application, identity, monitoring, and deployment.
        </p>

        <section>
          <h2>Core Controls</h2>
          <ul>
            <li>Encryption in transit via TLS</li>
            <li>Role-based access control and authentication hardening</li>
            <li>Multi-factor authentication through identity provider</li>
            <li>Security headers, CSP, origin protections, and bot blocking</li>
            <li>Rate limiting, abuse detection, and input sanitization</li>
            <li>Private vulnerability reporting channel via security.txt</li>
            <li>Auditability through logging, DSAR trails, and compliance endpoints</li>
          </ul>
        </section>

        <section>
          <h2>Incident Reporting</h2>
          <p>
            Report vulnerabilities to <a href="mailto:security@grayzonemonitor.com">security@grayzonemonitor.com</a>.
            We support coordinated disclosure.
          </p>
        </section>
      </article>
    </main>
  );
}
