import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Standard Contractual Clauses | Gray Zone Monitor',
  description: 'Information on EU Standard Contractual Clauses and international data transfer support.',
};

export default function SCCPage() {
  return (
    <main id="main-content" className="legal-page">
      <article aria-labelledby="scc-heading">
        <h1 id="scc-heading">Standard Contractual Clauses (SCCs)</h1>
        <p>
          Where required for transfers of personal data from the EU/EEA, UK, or Switzerland
          to the United States or other third countries, Gray Zone Monitor supports contractual
          transfer mechanisms based on the European Commission&apos;s SCC framework.
        </p>

        <section>
          <h2>Typical Transfer Context</h2>
          <p>
            For most SaaS customer relationships, the relevant transfer structure is controller-to-processor.
          </p>
        </section>

        <section>
          <h2>What the SCC Package Includes</h2>
          <ul>
            <li>Parties and transfer roles</li>
            <li>Transfer description and categories of data</li>
            <li>Security measures annex</li>
            <li>Subprocessor annex</li>
            <li>International transfer support language</li>
          </ul>
        </section>
      </article>
    </main>
  );
}
