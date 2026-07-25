import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Subprocessors',
  description: 'Current Gray Zone Monitor subprocessors and service providers.',
};

const SUBPROCESSORS = [
  {
    name: 'Cloudflare',
    purpose: 'DNS, CDN, security edge, traffic filtering',
    region: 'Global / US',
    personalData: 'May process IP addresses, request metadata, security telemetry',
  },
  {
    name: 'Vercel',
    purpose: 'Frontend hosting and deployment',
    region: 'US / global edge',
    personalData: 'May process request metadata and application logs',
  },
  {
    name: 'Clerk',
    purpose: 'Authentication and session management',
    region: 'US',
    personalData: 'User account and authentication data',
  },
  {
    name: 'Stripe',
    purpose: 'Billing and payment processing',
    region: 'US / global',
    personalData: 'Billing identity and payment-related records',
  },
];

export default function SubprocessorsPage() {
  return (
    <main id="main-content" className="legal-page">
      <article aria-labelledby="subprocessors-heading">
        <h1 id="subprocessors-heading">Subprocessors</h1>
        <p>
          This page lists third-party service providers that may process personal data on behalf of Gray Zone Monitor.
        </p>

        <table aria-label="Current subprocessors">
          <caption>Current subprocessors used by Gray Zone Monitor</caption>
          <thead>
            <tr>
              <th scope="col">Provider</th>
              <th scope="col">Purpose</th>
              <th scope="col">Region</th>
              <th scope="col">Data Categories</th>
            </tr>
          </thead>
          <tbody>
            {SUBPROCESSORS.map((s) => (
              <tr key={s.name}>
                <td>{s.name}</td>
                <td>{s.purpose}</td>
                <td>{s.region}</td>
                <td>{s.personalData}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </main>
  );
}
