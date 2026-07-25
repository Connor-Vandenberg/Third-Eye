import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support Accessibility Information',
  description: 'How Gray Zone Monitor support services accommodate accessibility needs.',
};

export default function SupportAccessibilityPage() {
  return (
    <main id="main-content" className="legal-page">
      <article aria-labelledby="support-heading">
        <h1 id="support-heading">Support Accessibility Information</h1>
        <p>
          Gray Zone Monitor support services are intended to accommodate the communication needs
          of individuals with disabilities.
        </p>

        <section>
          <h2>Support Channels</h2>
          <ul>
            <li>Email support for written communication</li>
            <li>Accessible web documentation</li>
            <li>Accessibility-specific support contact: <a href="mailto:accessibility@grayzonemonitor.com">accessibility@grayzonemonitor.com</a></li>
          </ul>
        </section>

        <section>
          <h2>Accessibility Information Available</h2>
          <ul>
            <li>Accessibility statement</li>
            <li>Accessibility user guide</li>
            <li>Information on compatibility features</li>
          </ul>
        </section>
      </article>
    </main>
  );
}
