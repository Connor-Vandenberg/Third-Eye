import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Gray Zone Monitor',
  description: 'How Gray Zone Monitor collects, uses, and protects your data.',
};

export default function PrivacyPolicyPage() {
  return (
    <main id="main-content" className="legal-page">
      <article aria-labelledby="privacy-heading">
        <h1 id="privacy-heading">Privacy Policy</h1>
        <p className="legal-meta">
          <strong>Last Updated:</strong> July 24, 2026 |
          <strong> Effective:</strong> July 24, 2026
        </p>

        <nav aria-label="Table of contents" className="legal-toc">
          <h2>Contents</h2>
          <ol>
            <li><a href="#identity">Who We Are</a></li>
            <li><a href="#scope">Scope & Applicability</a></li>
            <li><a href="#user-data">Data We Collect (Platform Users)</a></li>
            <li><a href="#intel-data">Data We Process (Intelligence Subjects)</a></li>
            <li><a href="#how-we-use">How We Use Data</a></li>
            <li><a href="#sharing">Data Sharing</a></li>
            <li><a href="#user-rights">Your Rights (Platform Users)</a></li>
            <li><a href="#subject-rights">Third-Party Subject Rights</a></li>
            <li><a href="#security">Data Security</a></li>
            <li><a href="#retention">Data Retention</a></li>
            <li><a href="#international">International Transfers</a></li>
            <li><a href="#cookies">Cookies & Tracking</a></li>
            <li><a href="#children">Children's Privacy</a></li>
            <li><a href="#changes">Changes to This Policy</a></li>
            <li><a href="#contact">Contact Us</a></li>
          </ol>
        </nav>

        <section id="identity" aria-labelledby="identity-heading">
          <h2 id="identity-heading">1. Who We Are</h2>
          <p>
            Gray Zone Monitor (&ldquo;GZM,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;) is operated by
            Connor M Vandenberg, a sole proprietorship registered in Kansas, United States.
          </p>
          <p>Contact: <a href="mailto:privacy@grayzonemonitor.com">privacy@grayzonemonitor.com</a></p>
        </section>

        <section id="scope" aria-labelledby="scope-heading">
          <h2 id="scope-heading">2. Scope & Applicability</h2>
          <p>
            This Privacy Policy applies to: (a) users of the GZM platform who create accounts and
            use our services (&ldquo;Platform Users&rdquo;), and (b) individuals and organizations whose
            publicly available information may be processed through the platform
            (&ldquo;Intelligence Subjects&rdquo; or &ldquo;Third-Party Data Subjects&rdquo;).
          </p>
          <p>
            We distinguish between &ldquo;User Data&rdquo; (information you provide to us to use
            the platform) and &ldquo;Intelligence Data&rdquo; (publicly available information about
            third parties processed through our analytical capabilities).
          </p>
        </section>

        <section id="user-data" aria-labelledby="user-data-heading">
          <h2 id="user-data-heading">3. Data We Collect (Platform Users)</h2>
          <dl>
            <dt>Account Information</dt>
            <dd>Name, email address, organization, role. Collected for account creation and service delivery.</dd>
            <dt>Payment Data</dt>
            <dd>Processed by our payment provider (Stripe). We do not store full card numbers.</dd>
            <dt>Usage Data</dt>
            <dd>Login times, features accessed, queries executed, alerts configured. Used to improve the service.</dd>
            <dt>Technical Data</dt>
            <dd>IP address, browser type, device information, access logs. Used for security and troubleshooting.</dd>
            <dt>Communications</dt>
            <dd>Support requests, feedback, and correspondence with us.</dd>
          </dl>
        </section>

        <section id="intel-data" aria-labelledby="intel-data-heading">
          <h2 id="intel-data-heading">4. Data We Process (Intelligence Subjects)</h2>
          <p>
            GZM processes publicly available information about individuals and organizations for
            the purpose of open-source intelligence (OSINT) analysis. This information is collected
            from public records, government databases, media sources, academic publications,
            sanctions lists, corporate filings, and other openly accessible sources.
          </p>
          <p>
            <strong>GZM does not</strong> access private communications, bypass access controls,
            use social engineering, or employ deception to obtain information.
          </p>
          <dl>
            <dt>Public Identity Information</dt>
            <dd>Names, roles, organizational affiliations as publicly documented.</dd>
            <dt>Organizational Data</dt>
            <dd>Company registrations, government records, sanctions listings, court filings.</dd>
            <dt>Public Geolocation</dt>
            <dd>Publicly reported facility locations, addresses of registered entities.</dd>
            <dt>Network/Relationship Data</dt>
            <dd>Publicly documented connections between entities (corporate filings, media reports, government disclosures).</dd>
          </dl>
          <p>
            <strong>Lawful Basis (GDPR Art. 6(1)(f)):</strong> Legitimate interest in security
            intelligence analysis. We conduct and document balancing tests for all processing
            of personal data about intelligence subjects.
          </p>
        </section>

        <section id="how-we-use" aria-labelledby="how-we-use-heading">
          <h2 id="how-we-use-heading">5. How We Use Data</h2>
          <ul>
            <li>Operating and improving the GZM platform</li>
            <li>Constructing and maintaining the intelligence knowledge graph</li>
            <li>Detecting threats and analyzing geopolitical patterns</li>
            <li>Authenticating and authorizing platform users</li>
            <li>Complying with legal obligations</li>
            <li>Communicating with users about the service</li>
            <li>Security monitoring and fraud prevention</li>
          </ul>
        </section>

        <section id="sharing" aria-labelledby="sharing-heading">
          <h2 id="sharing-heading">6. Data Sharing</h2>
          <p><strong>We never sell personal data.</strong></p>
          <p>We may share data with:</p>
          <ul>
            <li><strong>Service providers:</strong> Hosting (AWS/Cloudflare), payment processing (Stripe), authentication (Clerk)</li>
            <li><strong>Legal requirements:</strong> When compelled by court order, subpoena, or applicable law</li>
            <li><strong>Platform users:</strong> Intelligence data is accessible to authorized platform users (this is the service)</li>
          </ul>
        </section>

        <section id="user-rights" aria-labelledby="user-rights-heading">
          <h2 id="user-rights-heading">7. Your Rights (Platform Users)</h2>
          <p>Depending on your jurisdiction, you may have the following rights:</p>
          <ul>
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Correction:</strong> Request correction of inaccurate data</li>
            <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
            <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
            <li><strong>Opt-out:</strong> Opt out of non-essential data processing</li>
            <li><strong>Restrict:</strong> Request restriction of processing</li>
            <li><strong>Object:</strong> Object to processing based on legitimate interest</li>
            <li><strong>Withdraw consent:</strong> Withdraw previously given consent at any time</li>
          </ul>
          <p>
            Exercise your rights via your account settings, or by contacting
            <a href="mailto:privacy@grayzonemonitor.com">privacy@grayzonemonitor.com</a>.
            We respond within 30 days (GDPR) or 45 days (US state laws).
          </p>
        </section>

        <section id="subject-rights" aria-labelledby="subject-rights-heading">
          <h2 id="subject-rights-heading">8. Third-Party Subject Rights</h2>
          <p>
            If you believe your personal information appears in GZM&apos;s intelligence database and you
            wish to exercise your privacy rights, contact
            <a href="mailto:privacy@grayzonemonitor.com">privacy@grayzonemonitor.com</a> with:
          </p>
          <ul>
            <li>Proof of identity (we must verify you are the data subject)</li>
            <li>Description of what information you believe we hold</li>
            <li>Which right you wish to exercise</li>
          </ul>
          <p>We will respond within 30 days. We may decline requests where:</p>
          <ul>
            <li>Processing is necessary for public interest or security research</li>
            <li>Deletion would undermine legitimate security intelligence purposes</li>
            <li>The information is derived from sources that remain publicly available</li>
            <li>Legal obligations require retention</li>
          </ul>
        </section>

        <section id="security" aria-labelledby="security-heading">
          <h2 id="security-heading">9. Data Security</h2>
          <ul>
            <li>Encryption at rest and in transit (TLS 1.3+)</li>
            <li>Role-based access controls</li>
            <li>Multi-factor authentication for all accounts</li>
            <li>Regular security assessments and penetration testing</li>
            <li>Incident response procedures with 72-hour breach notification (GDPR)</li>
            <li>Zero-trust architecture aligned with DoD standards</li>
          </ul>
        </section>

        <section id="retention" aria-labelledby="retention-heading">
          <h2 id="retention-heading">10. Data Retention</h2>
          <dl>
            <dt>User accounts</dt>
            <dd>Duration of active account + 30 days after deletion request</dd>
            <dt>Usage logs</dt>
            <dd>90 days</dd>
            <dt>Intelligence data</dt>
            <dd>Retained while relevant; subject to automated decay (staleness scoring) and removal when no longer current</dd>
            <dt>Payment records</dt>
            <dd>7 years (legal requirement)</dd>
            <dt>Security logs</dt>
            <dd>1 year</dd>
          </dl>
        </section>

        <section id="international" aria-labelledby="international-heading">
          <h2 id="international-heading">11. International Transfers</h2>
          <p>
            Data is processed and stored in the United States. For EU/EEA users, transfers are
            protected by Standard Contractual Clauses (SCCs) or equivalent safeguards as required
            by GDPR Chapter V.
          </p>
        </section>

        <section id="cookies" aria-labelledby="cookies-heading">
          <h2 id="cookies-heading">12. Cookies & Tracking</h2>
          <dl>
            <dt>Essential cookies</dt>
            <dd>Session management, authentication, security tokens. Always active.</dd>
            <dt>Analytics cookies</dt>
            <dd>Platform usage patterns. Only with explicit consent for EU users.</dd>
            <dt>Functional cookies</dt>
            <dd>User preferences and customizations. Only with consent.</dd>
          </dl>
          <p>
            We honor the <strong>Global Privacy Control (GPC)</strong> signal. If your browser
            sends GPC, all non-essential cookies are blocked by default.
          </p>
          <p>
            We do not use third-party advertising cookies or sell data to advertisers.
          </p>
        </section>

        <section id="children" aria-labelledby="children-heading">
          <h2 id="children-heading">13. Children&apos;s Privacy</h2>
          <p>
            GZM is not directed at individuals under 18. We do not knowingly collect personal
            data from minors. If we discover that we have collected data from a person under 18,
            we will delete it immediately.
          </p>
        </section>

        <section id="changes" aria-labelledby="changes-heading">
          <h2 id="changes-heading">14. Changes to This Policy</h2>
          <p>
            We will provide 30 days&apos; notice before making material changes to this policy.
            Notice will be provided via email to registered users and a prominent banner on
            the platform. The date of last update is displayed at the top of this page.
          </p>
        </section>

        <section id="contact" aria-labelledby="contact-heading">
          <h2 id="contact-heading">15. Contact Us</h2>
          <p>
            For privacy inquiries, data subject requests, or questions about this policy:
          </p>
          <address>
            Privacy Contact: Connor Vandenberg<br />
            Email: <a href="mailto:privacy@grayzonemonitor.com">privacy@grayzonemonitor.com</a><br />
            Gray Zone Monitor<br />
            Pittsburg, KS 66762, United States
          </address>
        </section>
      </article>
    </main>
  );
}
