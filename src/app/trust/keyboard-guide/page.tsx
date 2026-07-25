import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Keyboard Navigation Guide | Gray Zone Monitor',
  description: 'Keyboard shortcuts and navigation patterns for Gray Zone Monitor.',
};

export default function KeyboardGuidePage() {
  return (
    <main id="main-content" className="legal-page">
      <article aria-labelledby="keyboard-heading">
        <h1 id="keyboard-heading">Keyboard Navigation Guide</h1>
        <table>
          <caption>Keyboard commands</caption>
          <thead>
            <tr>
              <th scope="col">Key</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Tab / Shift+Tab</td><td>Move forward/backward through focusable controls</td></tr>
            <tr><td>Enter / Space</td><td>Activate the focused control</td></tr>
            <tr><td>Escape</td><td>Dismiss dialogs, tooltips, and overlays</td></tr>
            <tr><td>Arrow keys</td><td>Navigate lists, graph nodes, marker lists, and supported menus</td></tr>
            <tr><td>Home / End</td><td>Jump to first/last item in supported widgets</td></tr>
            <tr><td>F</td><td>Reserved in graph contexts for entity search where implemented</td></tr>
          </tbody>
        </table>
      </article>
    </main>
  );
}
