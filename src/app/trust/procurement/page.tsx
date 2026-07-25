import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Procurement Pack | Gray Zone Monitor',
  description: 'Buyer-facing accessibility, privacy, and security materials for procurement review.',
};

export default function ProcurementPackPage() {
  return (
    <main id="main-content" className="legal-page">
      <article aria-labelledby="procurement-heading">
        <h1 id="procurement-heading">Procurement Pack</h1>
        <p>
          This page indexes the buyer-facing materials typically requested during enterprise,
          public-sector, and government procurement reviews.
        </p>

        <ul>
          <li>Accessibility Statement</li>
          <li>Accessibility User Guide</li>
          <li>VPAT / ACR (when published)</li>
          <li>Privacy Policy</li>
          <li>Terms of Service</li>
          <li>Cookie Policy</li>
          <li>Security Overview</li>
          <li>Subprocessors</li>
          <li>DPA / SCC package (on request or by contract path)</li>
        </ul>

        <p>
          For procurement requests, contact
          <a href="mailto:legal@grayzonemonitor.com"> legal@grayzonemonitor.com</a>.
        </p>
      </article>
    </main>
  );
}
