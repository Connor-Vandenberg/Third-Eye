import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Data Processing Addendum',
  description: 'Global Data Processing Addendum for Gray Zone Monitor customers and controllers.',
};

export default function DPAPage() {
  return (
    <main id="main-content" className="legal-page">
      <article aria-labelledby="dpa-heading">
        <h1 id="dpa-heading">Data Processing Addendum (DPA)</h1>
        <p className="legal-meta"><strong>Last Updated:</strong> July 24, 2026</p>

        <p>
          This Data Processing Addendum supplements the master services agreement,
          order form, or other customer agreement governing use of Gray Zone Monitor.
          It applies where Gray Zone Monitor processes personal data on behalf of a customer.
        </p>

        <section>
          <h2>1. Roles</h2>
          <p>
            Customer acts as controller or business for customer personal data provided to GZM.
            Gray Zone Monitor acts as processor or service provider solely to provide the contracted services.
          </p>
        </section>

        <section>
          <h2>2. Processing Scope</h2>
          <ul>
            <li>Account and user management</li>
            <li>Storage of customer-configured watchlists, annotations, and workflows</li>
            <li>Authentication, support, and service delivery</li>
            <li>Security monitoring and incident response</li>
          </ul>
        </section>

        <section>
          <h2>3. Security Measures</h2>
          <ul>
            <li>Encryption in transit and at rest</li>
            <li>Role-based access controls</li>
            <li>Environment isolation</li>
            <li>Security logging and incident handling</li>
            <li>Least-privilege administrative access</li>
          </ul>
        </section>

        <section>
          <h2>4. Subprocessors</h2>
          <p>
            Current subprocessors are listed at <a href="/trust/subprocessors">/trust/subprocessors</a>.
            Material updates will be reflected on that page.
          </p>
        </section>

        <section>
          <h2>5. Data Subject Rights Assistance</h2>
          <p>
            GZM will provide reasonable assistance to help customers respond to access,
            deletion, correction, restriction, portability, and objection requests where required by law.
          </p>
        </section>

        <section>
          <h2>6. International Transfers</h2>
          <p>
            Where personal data subject to GDPR, UK GDPR, or Swiss data protection law is transferred
            outside the originating jurisdiction, the parties will rely on applicable transfer mechanisms,
            including the European Commission Standard Contractual Clauses and, where needed, the UK addendum.
          </p>
        </section>

        <section>
          <h2>7. Breach Notification</h2>
          <p>
            GZM will notify customers without undue delay after becoming aware of a confirmed
            personal data breach affecting customer personal data.
          </p>
        </section>

        <section>
          <h2>8. Return or Deletion</h2>
          <p>
            Upon termination of the applicable services, customer personal data will be returned
            or deleted in accordance with the agreement, retention obligations, and documented operational limits.
          </p>
        </section>

        <section>
          <h2>Operational Note</h2>
          <p>
            This page is the public summary. The execution version of the DPA should be attached to customer contracts.
            If you need a signed form, contact <a href="mailto:privacy@grayzonemonitor.com">privacy@grayzonemonitor.com</a>.
          </p>
        </section>
      </article>
    </main>
  );
}
