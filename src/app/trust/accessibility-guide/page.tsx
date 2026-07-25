import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Accessibility User Guide | Gray Zone Monitor',
  description: 'How to use Gray Zone Monitor with keyboard, screen readers, and other accessibility features.',
};

export default function AccessibilityGuidePage() {
  return (
    <main id="main-content" className="legal-page">
      <article aria-labelledby="guide-heading">
        <h1 id="guide-heading">Accessibility User Guide</h1>
        <p>
          This guide explains how to use Gray Zone Monitor with keyboard navigation,
          screen readers, zoom, reduced motion preferences, and alternative interaction patterns.
        </p>

        <section>
          <h2>Keyboard Navigation</h2>
          <ul>
            <li><strong>Tab / Shift+Tab:</strong> Move between interactive elements</li>
            <li><strong>Enter / Space:</strong> Activate selected controls</li>
            <li><strong>Escape:</strong> Close dialogs, tooltips, and overlays</li>
            <li><strong>Arrow keys:</strong> Navigate graph nodes, map marker lists, menus, and roving widgets</li>
            <li><strong>Home / End:</strong> Jump to first/last item in supported widgets</li>
          </ul>
        </section>

        <section>
          <h2>Graph View</h2>
          <p>
            The graph uses a dual-layer accessibility model. Sighted users interact with the visual graph.
            Screen reader and keyboard users can navigate a semantic tree representation of entities and connections.
          </p>
        </section>

        <section>
          <h2>Map View</h2>
          <p>
            The map includes keyboard-operable zoom controls and an accessible marker list as a non-visual alternative.
          </p>
        </section>

        <section>
          <h2>Visual Adjustments</h2>
          <ul>
            <li>Content supports browser zoom and text scaling</li>
            <li>Reduced motion preferences are respected</li>
            <li>Dark theme contrast is designed for WCAG AA minimums</li>
          </ul>
        </section>

        <section>
          <h2>Need Help?</h2>
          <p>
            Contact <a href="mailto:accessibility@grayzonemonitor.com">accessibility@grayzonemonitor.com</a>
            for support or accommodation requests.
          </p>
        </section>
      </article>
    </main>
  );
}
