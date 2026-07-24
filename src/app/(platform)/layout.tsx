import Sidebar from '@/components/Sidebar';

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen" style={{ background: '#07090f' }}>
      <Sidebar />
      {/* Main content area offset by sidebar width */}
      <main className="flex-1 ml-56">
        {/* Global status bar */}
        <header
          className="sticky top-0 z-40 flex items-center justify-between h-10 px-5 border-b"
          style={{ background: 'rgba(10,10,15,0.95)', borderColor: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)' }}
        >
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono text-[rgba(240,240,255,0.4)]">
              {new Date().toISOString().replace('T', ' ').substring(0, 19)} Z
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold">● FEEDS ACTIVE</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-[rgba(240,240,255,0.3)]">146+ collectors</span>
            <span className="text-[10px] text-[rgba(240,240,255,0.3)]">89+ engines</span>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
