import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Accessibility Statement | Gray Zone Monitor',
  description: 'Our commitment to digital accessibility and WCAG 2.1 AA compliance.',
};

export default function AccessibilityStatementPage() {
  return (
    <main id="main-content" className="legal-page">
      <article aria-labelledby="a11y-heading">
        <h1 id="a11y-heading">Accessibility Statement</h1>
        <p className="legal-meta">
          <strong>Last Updated:</strong> July 24, 2026
        </p>

        <section aria-labelledby="commitment-heading">
          <h2 id="commitment-heading">Our Commitment</h2>
          <p>
            Gray Zone Monitor is committed to ensuring digital accessibility for people with
            disabilities. We are continually improving the user experience for everyone and
            applying the relevant accessibility standards to ensure we provide equal access
            to all users.
          </p>
        </section>

        <section aria-labelledby="conformance-heading">
          <h2 id="conformance-heading">Conformance Status</h2>
          <p>
            We aim to conform to the <strong>Web Content Accessibility Guidelines (WCAG) 2.1
            Level AA</strong>. WCAG 2.1 AA is the standard referenced by:
          </p>
          <ul>
            <li>Americans with Disabilities Act (ADA)</li>
            <li>Section 508 of the Rehabilitation Act (U.S. federal procurement)</li>
            <li>European Accessibility Act (EN 301 549)</li>
          </ul>
          <p>
            Our Accessibility Conformance Report (ACR/VPAT) is available upon request for
            procurement purposes. Contact <a href="mailto:accessibility@grayzonemonitor.com">
            accessibility@grayzonemonitor.com</a>.
          </p>
        </section>

        <section aria-labelledby="measures-heading">
          <h2 id="measures-heading">Accessibility Measures</h2>
          <p>Gray Zone Monitor takes the following measures to ensure accessibility:</p>
          <ul>
            <li>Accessibility is integrated into our development lifecycle from design through deployment</li>
            <li>Automated WCAG 2.1 AA testing runs on every code change via axe-core and Playwright</li>
            <li>Manual testing with screen readers (NVDA, VoiceOver) is performed for all major features</li>
            <li>Keyboard-only navigation is verified for all interactive components</li>
            <li>Color contrast ratios are validated against WCAG thresholds (4.5:1 text, 3:1 UI components)</li>
            <li>All data visualizations provide text alternatives and keyboard-navigable structures</li>
            <li>Real-time content updates use ARIA live regions to announce changes to assistive technology</li>
          </ul>
        </section>

        <section aria-labelledby="features-heading">
          <h2 id="features-heading">Accessibility Features</h2>
          <dl>
            <dt>Keyboard Navigation</dt>
            <dd>All functionality is accessible via keyboard. Graph visualizations support arrow-key navigation of entities and connections.</dd>
            <dt>Screen Reader Support</dt>
            <dd>Semantic HTML, ARIA landmarks, and live regions ensure screen reader compatibility. Complex visualizations provide text alternatives.</dd>
            <dt>Focus Management</dt>
            <dd>Visible focus indicators on all interactive elements. Modal dialogs trap focus appropriately.</dd>
            <dt>Color & Contrast</dt>
            <dd>Dark theme designed to meet WCAG contrast requirements. Information is never conveyed by color alone (icons, text labels, and patterns provide redundant encoding).</dd>
            <dt>Text Scaling</dt>
            <dd>Content reflows at 400% zoom without horizontal scrolling. Text can be resized to 200% without loss of functionality.</dd>
            <dt>Motion</dt>
            <dd>Animations respect the prefers-reduced-motion media query. No content flashes more than 3 times per second.</dd>
          </dl>
        </section>

        <section aria-labelledby="limitations-heading">
          <h2 id="limitations-heading">Known Limitations</h2>
          <p>
            While we strive for full WCAG 2.1 AA compliance, some complex visualizations present
            ongoing accessibility challenges:
          </p>
          <ul>
            <li>
              <strong>Network graph drag-to-rearrange:</strong> Repositioning nodes via drag is
              mouse-only. All other graph operations (navigation, selection, expansion) work via keyboard.
            </li>
            <li>
              <strong>Geographic map spatial exploration:</strong> While all map data is available in
              list/table form, the spatial relationship between markers is best conveyed visually.
              We provide text summaries of clustering and proximity.
            </li>
          </ul>
        </section>

        <section aria-labelledby="feedback-heading">
          <h2 id="feedback-heading">Feedback & Support</h2>
          <p>
            We welcome your feedback on the accessibility of Gray Zone Monitor. If you encounter
            barriers or need assistance:
          </p>
          <address>
            Email: <a href="mailto:accessibility@grayzonemonitor.com">accessibility@grayzonemonitor.com</a><br />
            Response time: Within 5 business days
          </address>
          <p>
            We take accessibility feedback seriously and will work to address reported barriers
            as quickly as possible.
          </p>
        </section>

        <section aria-labelledby="technical-heading">
          <h2 id="technical-heading">Technical Specifications</h2>
          <p>GZM relies on the following technologies for accessibility:</p>
          <ul>
            <li>HTML5 semantic elements</li>
            <li>WAI-ARIA 1.2</li>
            <li>CSS custom properties for theming</li>
            <li>JavaScript (React) for dynamic interactions</li>
          </ul>
          <p>These technologies are relied upon for conformance with WCAG 2.1 AA.</p>
          <h3>Compatible Assistive Technologies</h3>
          <ul>
            <li>NVDA (Windows) with Chrome and Firefox</li>
            <li>JAWS (Windows) with Chrome and Edge</li>
            <li>VoiceOver (macOS/iOS) with Safari</li>
            <li>TalkBack (Android) with Chrome</li>
          </ul>
        </section>

        <section aria-labelledby="assessment-heading">
          <h2 id="assessment-heading">Assessment Methods</h2>
          <p>GZM accessibility is assessed through:</p>
          <ul>
            <li><strong>Automated testing:</strong> axe-core (Deque Systems) integrated into CI/CD pipeline</li>
            <li><strong>Manual testing:</strong> Keyboard navigation, screen reader walkthrough, zoom/reflow testing</li>
            <li><strong>Standard referenced:</strong> WCAG 2.1 Level AA (W3C Recommendation, June 2018)</li>
          </ul>
        </section>
      </article>
    </main>
  );
}
