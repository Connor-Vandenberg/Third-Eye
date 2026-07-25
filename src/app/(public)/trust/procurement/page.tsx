import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Procurement Pack',
  description: 'Accessibility, privacy, and security procurement documents for Gray Zone Monitor buyers.',
};

export default function ProcurementPage() {
  return (
    <main id="main-content" className="legal-page">
      <article aria-labelledby="procurement-heading">
        <h1 id="procurement-heading">Procurement Pack</h1>
        <p>
          This page summarizes the documents typically requested by enterprise, nonprofit,
          and government buyers during vendor review.
        </p>

        <ul>
          <li>Accessibility Statement</li>
          <li>Accessibility User Guide</li>
          <li>Privacy Policy</li>
          <li>Terms of Service</li>
          <li>Data Processing Addendum</li>
          <li>Subprocessor List</li>
          <li>security.txt</li>
          <li>AI Transparency Notice</li>
        </ul>

        <p>
          A product-specific VPAT / Accessibility Conformance Report should be published here
          once completed after formal testing of the production frontend.
        </p>
      </article>
    </main>
  );
}
