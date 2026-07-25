import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Data Processing Addendum | Gray Zone Monitor',
  description: 'Global DPA overview for Gray Zone Monitor customers.',
};

export default function DPAPage() {
  return (
    <main id="main-content" className="legal-page">
      <article aria-labelledby="dpa-heading">
        <h1 id="dpa-heading">Data Processing Addendum (DPA)</h1>
        <p>
          Gray Zone Monitor offers a Data Processing Addendum for customers who require GDPR,
          UK GDPR, and cross-border transfer contractual coverage.
        </p>

        <section>
          <h2>What the DPA Covers</h2>
          <ul>
            <li>Controller / processor allocation</li>
            <li>Processing instructions and scope</li>
            <li>Security controls and confidentiality</li>
            <li>Subprocessor management</li>
            <li>Data subject rights assistance</li>
            <li>Deletion / return of data at termination</li>
            <li>Breach notification and cooperation</li>
            <li>International transfer mechanisms, including SCC references</li>
          </ul>
        </section>

        <section>
          <h2>Request the DPA</h2>
          <p>
            To request the current DPA package, contact
            <a href="mailto:legal@grayzonemonitor.com"> legal@grayzonemonitor.com</a>.
          </p>
        </section>
      </article>
    </main>
  );
}
