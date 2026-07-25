import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Subprocessors | Gray Zone Monitor',
  description: 'Public list of subprocessors used by Gray Zone Monitor.',
};

const SUBPROCESSORS = [
  {
    name: 'Cloudflare',
    service: 'DNS, CDN, edge security, traffic filtering',
    region: 'Global / United States',
    personalData: 'Potentially yes',
    required: 'Essential',
    added: '2026-07-24',
  },
  {
    name: 'Vercel',
    service: 'Frontend hosting and deployment',
    region: 'United States',
    personalData: 'Potentially yes',
    required: 'Essential',
    added: '2026-07-24',
  },
  {
    name: 'Clerk',
    service: 'Authentication, session management, MFA',
    region: 'United States',
    personalData: 'Yes',
    required: 'Essential',
    added: '2026-07-24',
  },
  {
    name: 'Stripe',
    service: 'Billing and payment processing',
    region: 'United States / EU depending on routing',
    personalData: 'Yes',
    required: 'Essential',
    added: '2026-07-24',
  },
  {
    name: 'TigerGraph',
    service: 'Graph database infrastructure',
    region: 'Cloud region dependent',
    personalData: 'Potentially yes',
    required: 'Essential',
    added: '2026-07-24',
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
        <p>
          We will update this page when subprocessors are added or materially changed.
          Enterprise customers may request notice via contract.
        </p>

        <table>
          <caption>Current subprocessors</caption>
          <thead>
            <tr>
              <th scope="col">Vendor</th>
              <th scope="col">Service</th>
              <th scope="col">Region</th>
              <th scope="col">Personal Data</th>
              <th scope="col">Required</th>
              <th scope="col">Added</th>
            </tr>
          </thead>
          <tbody>
            {SUBPROCESSORS.map((s) => (
              <tr key={s.name}>
                <td>{s.name}</td>
                <td>{s.service}</td>
                <td>{s.region}</td>
                <td>{s.personalData}</td>
                <td>{s.required}</td>
                <td>{s.added}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </main>
  );
}
