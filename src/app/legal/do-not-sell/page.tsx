import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Do Not Sell or Share My Personal Information | Gray Zone Monitor',
  description: 'Exercise your right to opt-out of the sale or sharing of your personal information under the CCPA.',
};

/**
 * CCPA "Do Not Sell or Share My Personal Information" Page.
 * Required by CCPA §1798.120, CPRA amendments, CPPA Regulation §7013.
 *
 * Requirements:
 * - Clear link on homepage/footer ("Do Not Sell or Share My Personal Information")
 * - Must work WITHOUT requiring login/account
 * - Must honor Global Privacy Control (GPC) signal
 * - Must fulfill within 15 business days
 * - Cannot ask user to opt back in for 12 months
 * - Must be equally easy as opt-in
 */
export default function DoNotSellPage() {
  return (
    <main id="main-content" className="legal-page">
      <article aria-labelledby="dns-heading">
        <h1 id="dns-heading">Do Not Sell or Share My Personal Information</h1>

        <section aria-labelledby="dns-statement-heading">
          <h2 id="dns-statement-heading">Our Statement</h2>
          <p>
            <strong>Gray Zone Monitor does not sell your personal information.</strong>
          </p>
          <p>
            We do not sell, rent, or trade personal information to third parties for monetary
            or other valuable consideration. We do not share personal information with third
            parties for cross-context behavioral advertising.
          </p>
          <p>
            Under the California Consumer Privacy Act (CCPA/CPRA), &ldquo;sale&rdquo; and
            &ldquo;sharing&rdquo; have broad legal definitions that can include certain types of
            data transfers. To be fully transparent: GZM transfers data only to service
            providers who process data on our behalf under contract (hosting, payment
            processing, authentication). These are &ldquo;service provider&rdquo; relationships,
            not &ldquo;sales&rdquo; or &ldquo;sharing&rdquo; under the CCPA.
          </p>
        </section>

        <section aria-labelledby="dns-gpc-heading">
          <h2 id="dns-gpc-heading">Global Privacy Control (GPC)</h2>
          <p>
            We honor the <strong>Global Privacy Control</strong> signal. If your browser sends a
            GPC signal, we treat it as a valid opt-out request for the sale and sharing of
            personal information. No further action is needed on your part.
          </p>
          <p>
            To enable GPC, use a supported browser (Firefox, Brave, DuckDuckGo) or install a
            GPC-compatible extension.
          </p>
        </section>

        <section aria-labelledby="dns-exercise-heading">
          <h2 id="dns-exercise-heading">Exercise Your Right to Opt-Out</h2>
          <p>
            Even though we do not sell or share personal information, you have the right to
            submit an opt-out request at any time. We will confirm receipt and process your
            request within 15 business days.
          </p>
          <p>
            <strong>No account required.</strong> You do not need to be a registered user to
            submit this request.
          </p>
          <p>To submit an opt-out request:</p>
          <ul>
            <li>
              Email: <a href="mailto:privacy@grayzonemonitor.com?subject=Do Not Sell Request">
              privacy@grayzonemonitor.com</a> with subject &ldquo;Do Not Sell Request&rdquo;
            </li>
            <li>Use our <a href="/privacy/preferences">Privacy Preferences</a> page</li>
          </ul>
        </section>

        <section aria-labelledby="dns-rights-heading">
          <h2 id="dns-rights-heading">Your Rights</h2>
          <ul>
            <li>We will not discriminate against you for exercising this right</li>
            <li>We will not ask you to opt back in for at least 12 months</li>
            <li>We will confirm your request within 15 business days</li>
            <li>Authorized agents may submit requests on your behalf with proper documentation</li>
          </ul>
        </section>

        <section aria-labelledby="dns-contact-heading">
          <h2 id="dns-contact-heading">Contact</h2>
          <p>
            Questions about this page or your opt-out rights:
            <a href="mailto:privacy@grayzonemonitor.com">privacy@grayzonemonitor.com</a>
          </p>
        </section>
      </article>
    </main>
  );
}
