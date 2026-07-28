'use client';

/**
 * Right-Click Context Menu
 * Appears on right-click anywhere on the map.
 * Actions depend on what was clicked (entity, hex, empty space).
 *
 * Options:
 * - Track Entity (follow on map)
 * - Task ISR Collection
 * - Generate Report (ICD-203)
 * - Export STIX 2.1 Bundle
 * - Copy Coordinates
 * - Add to Watchlist
 * - Query GEOINT (NL)
 */

interface ContextMenuProps {
  x: number;
  y: number;
  visible: boolean;
  entityId?: string;
  lat: number;
  lng: number;
  onClose: () => void;
  onTrack: () => void;
  onTaskISR: () => void;
  onReport: () => void;
  onExportSTIX: () => void;
  onWatchlist: () => void;
  onQueryGEOINT: () => void;
}

export function ContextMenu({
  x, y, visible, entityId, lat, lng,
  onClose, onTrack, onTaskISR, onReport, onExportSTIX, onWatchlist, onQueryGEOINT,
}: ContextMenuProps) {
  if (!visible) return null;

  const items = [
    { label: 'Track Entity', icon: '🎯', action: onTrack, disabled: !entityId },
    { label: 'Task ISR Collection', icon: '🛸', action: onTaskISR },
    { label: 'Generate Report', icon: '📝', action: onReport },
    { label: 'Export STIX 2.1', icon: '📤', action: onExportSTIX, disabled: !entityId },
    { divider: true },
    { label: 'Add to Watchlist', icon: '👁️', action: onWatchlist, disabled: !entityId },
    { label: 'Query GEOINT Here', icon: '🛰️', action: onQueryGEOINT },
    { divider: true },
    { label: `Copy: ${lat.toFixed(4)}, ${lng.toFixed(4)}`, icon: '📋', action: () => navigator.clipboard.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`) },
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[60]" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />

      {/* Menu */}
      <div
        className="fixed z-[61] bg-black/95 backdrop-blur-sm border border-gray-700 rounded-lg py-1 min-w-48 shadow-xl"
        style={{ left: x, top: y }}
      >
        {items.map((item, i) => {
          if ('divider' in item && item.divider) {
            return <div key={i} className="h-px bg-gray-800 my-1" />;
          }

          const menuItem = item as { label: string; icon: string; action: () => void; disabled?: boolean };

          return (
            <button
              key={i}
              onClick={() => { menuItem.action(); onClose(); }}
              disabled={menuItem.disabled}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors ${
                menuItem.disabled
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="text-sm w-5 text-center">{menuItem.icon}</span>
              <span>{menuItem.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
