import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'Gray Zone Monitor cookie categories, purposes, and retention summary.',
};

export default function CookiePolicyPage() {
  return (
    <main id="main-content" className="legal-page">
      <article aria-labelledby="cookies-heading">
        <h1 id="cookies-heading">Cookie Policy</h1>
        <p>
          Gray Zone Monitor uses cookies and similar technologies for essential functionality
          and, where permitted by user choice and applicable law, analytics, performance, and functional preferences.
        </p>

        <table aria-label="Cookie categories">
          <caption>Cookie categories and purposes</caption>
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col">Purpose</th>
              <th scope="col">Required</th>
              <th scope="col">Typical Retention</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Essential</td>
              <td>Authentication, session continuity, security</td>
              <td>Yes</td>
              <td>Session to 30 days</td>
            </tr>
            <tr>
              <td>Functional</td>
              <td>User preferences and interface settings</td>
              <td>No</td>
              <td>30 to 365 days</td>
            </tr>
            <tr>
              <td>Analytics</td>
              <td>Usage measurement and product improvement</td>
              <td>No</td>
              <td>Varies by implementation</td>
            </tr>
            <tr>
              <td>Performance</td>
              <td>Application performance and reliability diagnostics</td>
              <td>No</td>
              <td>Varies by implementation</td>
            </tr>
          </tbody>
        </table>

        <p>
          We honor the Global Privacy Control (GPC) signal where applicable.
          Manage preferences using the cookie controls available in the site interface.
        </p>
      </article>
    </main>
  );
}
