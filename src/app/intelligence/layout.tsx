import '@/styles/tactical-theme.css';

/**
 * Intelligence Map Layout
 * Full-screen, no navigation chrome. Just the map.
 * Imports tactical dark theme CSS.
 */

export default function IntelligenceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-screen h-screen overflow-hidden bg-black">
      {children}
    </div>
  );
}
