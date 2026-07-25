import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Accessibility User Guide',
  description: 'How to use Gray Zone Monitor with keyboard, screen readers, zoom, and reduced motion settings.',
};

export default function AccessibilityGuidePage() {
  return (
    <main id="main-content" className="legal-page">
      <article aria-labelledby="guide-heading">
        <h1 id="guide-heading">Accessibility User Guide</h1>
        <p>
          This guide explains how to use Gray Zone Monitor with keyboard navigation,
          screen readers, zoom, contrast settings, and reduced motion preferences.
        </p>

        <section>
          <h2>Keyboard Navigation</h2>
          <ul>
            <li><strong>Tab / Shift+Tab:</strong> Move between interactive controls</li>
            <li><strong>Enter / Space:</strong> Activate focused controls</li>
            <li><strong>Escape:</strong> Close dialogs, tooltips, or overlays when supported</li>
            <li><strong>Arrow keys:</strong> Navigate graph and map alternatives where supported</li>
            <li><strong>Home / End:</strong> Jump to first or last item in composite widgets</li>
          </ul>
        </section>

        <section>
          <h2>Graph View</h2>
          <p>
            The graph view includes a semantic navigation layer for assistive technology.
            Screen reader and keyboard users can browse entities, expand connections,
            and review graph information in structured form.
          </p>
        </section>

        <section>
          <h2>Map View</h2>
          <p>
            The map view includes keyboard-accessible zoom controls and a marker list alternative
            so that location data remains available without pointer-based interaction.
          </p>
        </section>

        <section>
          <h2>Zoom and Reflow</h2>
          <p>
            GZM is designed to support browser zoom and content reflow. Users should be able
            to enlarge content without losing core functionality.
          </p>
        </section>

        <section>
          <h2>Reduced Motion</h2>
          <p>
            If your operating system or browser requests reduced motion, GZM minimizes animation
            and transitions where possible.
          </p>
        </section>
      </article>
    </main>
  );
}
