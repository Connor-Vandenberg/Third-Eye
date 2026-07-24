/**
 * Legal pages layout — shared structure for Privacy, Terms, Accessibility.
 * Semantic, accessible, properly structured.
 */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="legal-layout">
      <nav aria-label="Legal pages" className="legal-nav">
        <ul>
          <li><a href="/legal/privacy">Privacy Policy</a></li>
          <li><a href="/legal/terms">Terms of Service</a></li>
          <li><a href="/legal/accessibility">Accessibility</a></li>
        </ul>
      </nav>
      {children}
    </div>
  );
}
