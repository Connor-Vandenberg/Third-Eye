import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Gray Zone Monitor',
  description: 'Terms governing your use of the Gray Zone Monitor platform.',
};

export default function TermsOfServicePage() {
  return (
    <main id="main-content" className="legal-page">
      <article aria-labelledby="terms-heading">
        <h1 id="terms-heading">Terms of Service</h1>
        <p className="legal-meta">
          <strong>Last Updated:</strong> July 24, 2026 |
          <strong> Effective:</strong> July 24, 2026
        </p>

        <section aria-labelledby="acceptance-heading">
          <h2 id="acceptance-heading">1. Acceptance of Terms</h2>
          <p>
            By accessing or using Gray Zone Monitor (&ldquo;GZM,&rdquo; the &ldquo;Service&rdquo;),
            you agree to be bound by these Terms of Service and our Privacy Policy. If you do not
            agree, do not use the Service. If you are using the Service on behalf of an organization,
            you represent that you have authority to bind that entity.
          </p>
        </section>

        <section aria-labelledby="service-heading">
          <h2 id="service-heading">2. Service Description</h2>
          <p>
            GZM is a web-based open-source intelligence (OSINT) platform that enables authorized
            users to collect, analyze, and visualize publicly available information for legitimate
            security, research, and intelligence purposes. The Service aggregates data from public
            sources and provides graph-based relationship analysis, geographic visualization,
            temporal analysis, and automated intelligence collection.
          </p>
        </section>

        <section aria-labelledby="account-heading">
          <h2 id="account-heading">3. Account Terms</h2>
          <ul>
            <li>You must be at least 18 years old to use the Service</li>
            <li>One account per person; credential sharing is prohibited</li>
            <li>You must provide accurate registration information</li>
            <li>You are responsible for all activity under your account</li>
            <li>Notify us immediately of any unauthorized access</li>
          </ul>
        </section>

        <section aria-labelledby="aup-heading">
          <h2 id="aup-heading">4. Acceptable Use Policy</h2>
          <h3>Permitted Uses</h3>
          <ul>
            <li>Legitimate security research and threat intelligence</li>
            <li>Corporate due diligence, compliance, and KYC/AML</li>
            <li>Journalism and academic research</li>
            <li>Authorized government and law enforcement intelligence activities</li>
            <li>Corporate security and insider threat assessment</li>
            <li>Personal and organizational security assessment</li>
          </ul>
          <h3>Prohibited Uses</h3>
          <p>You must NOT use the Service to:</p>
          <ol>
            <li>Harass, stalk, or intimidate any individual</li>
            <li>Publish private information to endanger someone (doxxing)</li>
            <li>Conduct unauthorized surveillance without legal authority</li>
            <li>Bypass access controls, hack systems, or use social engineering</li>
            <li>Create or distribute malware</li>
            <li>Discriminate based on protected characteristics</li>
            <li>Violate any applicable law in your jurisdiction</li>
            <li>Resell raw data without authorization</li>
            <li>Exceed API rate limits or conduct automated bulk extraction</li>
            <li>Investigate, profile, or target persons under 18</li>
            <li>Impersonate law enforcement or government authorities</li>
            <li>Interfere with Service operation (DDoS, reverse engineering)</li>
            <li>Provide access to sanctioned persons or countries</li>
            <li>Engage in blackmail or extortion using gathered intelligence</li>
          </ol>
          <p>
            Violation may result in immediate suspension without notice. Severe violations
            will be reported to law enforcement.
          </p>
        </section>

        <section aria-labelledby="osint-heading">
          <h2 id="osint-heading">5. OSINT Data & Publicly Available Information</h2>
          <p>
            The Service processes publicly available information (&ldquo;OSINT Data&rdquo;) from
            sources including government records, media publications, corporate filings, court
            records, sanctions lists, and other open sources.
          </p>
          <p>
            <strong>No warranty on data.</strong> OSINT Data is provided &ldquo;as-is.&rdquo;
            We do not guarantee accuracy, completeness, or timeliness. Intelligence analysis
            inherently involves uncertainty. Confidence levels are analytical guidance, not
            factual guarantees.
          </p>
          <p>
            <strong>Your responsibility.</strong> You are solely responsible for: verifying
            information before acting on it; complying with applicable laws; ensuring your use
            meets your organization&apos;s policies; any decisions made based on intelligence from
            the Service.
          </p>
        </section>

        <section aria-labelledby="ip-heading">
          <h2 id="ip-heading">6. Intellectual Property</h2>
          <ul>
            <li><strong>GZM owns:</strong> The platform, algorithms, proprietary analysis methods, UI/UX, and documentation</li>
            <li><strong>You own:</strong> Your queries, annotations, custom collections, and uploaded content</li>
            <li><strong>You license to us:</strong> A non-exclusive right to process your content to provide the Service</li>
            <li><strong>Neither party owns:</strong> Publicly available intelligence data</li>
          </ul>
        </section>

        <section aria-labelledby="liability-heading">
          <h2 id="liability-heading">7. Limitation of Liability</h2>
          <p>
            THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE.&rdquo; TO THE
            MAXIMUM EXTENT PERMITTED BY LAW, GZM SHALL NOT BE LIABLE FOR: DATA ACCURACY,
            ACTIONS TAKEN BASED ON INTELLIGENCE, THIRD-PARTY DATA SUBJECT CLAIMS, SERVICE
            INTERRUPTIONS, OR DATA LOSS.
          </p>
          <p>
            MAXIMUM LIABILITY IS CAPPED AT FEES PAID IN THE PRIOR 12 MONTHS. IN NO EVENT SHALL
            GZM BE LIABLE FOR CONSEQUENTIAL, INCIDENTAL, OR PUNITIVE DAMAGES.
          </p>
        </section>

        <section aria-labelledby="indemnification-heading">
          <h2 id="indemnification-heading">8. Indemnification</h2>
          <p>
            You agree to indemnify and hold GZM harmless from any claims arising from: your
            violation of these Terms, your violation of law, your use of intelligence data,
            or third-party claims related to your actions on the platform.
          </p>
        </section>

        <section aria-labelledby="termination-heading">
          <h2 id="termination-heading">9. Termination</h2>
          <p>
            Either party may terminate with 30 days&apos; written notice. GZM may terminate
            immediately for Acceptable Use Policy violations. Upon termination, your data is
            available for export for 30 days, then permanently deleted.
          </p>
        </section>

        <section aria-labelledby="government-heading">
          <h2 id="government-heading">10. Government Users</h2>
          <p>
            If you are a U.S. government entity: The Service constitutes &ldquo;commercial
            computer software&rdquo; under FAR 12.212 and DFARS 227.7202. Use, reproduction,
            and disclosure are governed by the terms of this Agreement.
            We comply with Section 508 of the Rehabilitation Act. Our Accessibility Conformance
            Report is available at <a href="/legal/accessibility">/legal/accessibility</a>.
          </p>
        </section>

        <section aria-labelledby="governing-heading">
          <h2 id="governing-heading">11. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the State of Kansas, United States.
            Venue for disputes: Crawford County, Kansas, or the United States District Court
            for the District of Kansas.
          </p>
        </section>

        <section aria-labelledby="contact-heading">
          <h2 id="contact-heading">12. Contact</h2>
          <address>
            Gray Zone Monitor<br />
            Email: <a href="mailto:legal@grayzonemonitor.com">legal@grayzonemonitor.com</a><br />
            Pittsburg, KS 66762, United States
          </address>
        </section>
      </article>
    </main>
  );
}
