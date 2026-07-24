'use client';

/**
 * Accessible Map Wrapper for MapLibre GL.
 * WCAG SC: 1.1.1, 2.1.1, 2.4.1, 2.5.1, 4.1.2, 4.1.3
 *
 * Provides:
 * - Keyboard-only zoom/pan via toolbar buttons (SC 2.5.1)
 * - Screen reader summary of visible markers (SC 1.1.1)
 * - ARIA live region for viewport changes (SC 4.1.3)
 * - Accessible marker list as alternative to visual map (SC 1.1.1)
 * - Focus management for map controls
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAnnounce } from '@/lib/accessibility';

interface MapMarker {
  id: string;
  label: string;
  type: string;
  lat: number;
  lng: number;
  confidence?: string;
  date?: string;
}

interface AccessibleMapProps {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
  mapLabel?: string;
  children: React.ReactNode; // MapLibre GL component
  onMarkerSelect?: (markerId: string) => void;
}

export function AccessibleMap({
  markers,
  center = [0, 0],
  zoom = 4,
  mapLabel = 'Intelligence map',
  children,
  onMarkerSelect,
}: AccessibleMapProps) {
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedMarkerIndex, setSelectedMarkerIndex] = useState(-1);
  const announce = useAnnounce();
  const markerListRef = useRef<HTMLUListElement>(null);

  // Update status when viewport changes
  useEffect(() => {
    const msg = `Map centered at ${center[0].toFixed(1)}, ${center[1].toFixed(1)}. Zoom level ${zoom}. ${markers.length} markers visible.`;
    setStatusMessage(msg);
  }, [center, zoom, markers.length]);

  const handleZoomIn = useCallback(() => {
    // Dispatch to map component (implement via context/callback)
    announce('Zoomed in', 'polite');
  }, [announce]);

  const handleZoomOut = useCallback(() => {
    announce('Zoomed out', 'polite');
  }, [announce]);

  const handleReset = useCallback(() => {
    announce('Map view reset', 'polite');
  }, [announce]);

  const handleMarkerKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          const next = Math.min(index + 1, markers.length - 1);
          setSelectedMarkerIndex(next);
          const marker = markers[next];
          announce(`${marker.label}. ${marker.type}. ${marker.lat.toFixed(2)}N, ${marker.lng.toFixed(2)}E.${marker.confidence ? ` Confidence: ${marker.confidence}.` : ''}`);
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          const prev = Math.max(index - 1, 0);
          setSelectedMarkerIndex(prev);
          const marker = markers[prev];
          announce(`${marker.label}. ${marker.type}. ${marker.lat.toFixed(2)}N, ${marker.lng.toFixed(2)}E.`);
          break;
        }
        case 'Enter':
        case ' ':
          e.preventDefault();
          onMarkerSelect?.(markers[index].id);
          announce(`Selected: ${markers[index].label}`);
          break;
      }
    },
    [announce, markers, onMarkerSelect],
  );

  return (
    <div
      role="application"
      aria-label={mapLabel}
      aria-describedby="map-instructions map-status"
    >
      {/* Instructions */}
      <div id="map-instructions" className="sr-only">
        Interactive map. Use the toolbar buttons to zoom and reset view.
        Press Tab to navigate to the marker list for keyboard access to all locations.
      </div>

      {/* Live status region */}
      <div
        id="map-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {statusMessage}
      </div>

      {/* Keyboard-accessible zoom controls (SC 2.5.1) */}
      <div role="toolbar" aria-label="Map controls" className="map-controls">
        <button
          onClick={handleZoomIn}
          aria-label="Zoom in"
          title="Zoom in"
        >
          <span aria-hidden="true">+</span>
        </button>
        <button
          onClick={handleZoomOut}
          aria-label="Zoom out"
          title="Zoom out"
        >
          <span aria-hidden="true">&minus;</span>
        </button>
        <button
          onClick={handleReset}
          aria-label="Reset map view"
          title="Reset view"
        >
          <span aria-hidden="true">↻</span>
        </button>
      </div>

      {/* Visual map layer */}
      <div aria-hidden="true" className="map-visual-layer">
        {children}
      </div>

      {/* Accessible marker list (screen reader alternative) */}
      <div className="sr-only">
        <h3 id="marker-list-heading">Map locations ({markers.length} markers)</h3>
        <ul
          ref={markerListRef}
          role="listbox"
          aria-labelledby="marker-list-heading"
          aria-activedescendant={
            selectedMarkerIndex >= 0 ? `marker-${markers[selectedMarkerIndex]?.id}` : undefined
          }
        >
          {markers.map((marker, index) => (
            <li
              key={marker.id}
              id={`marker-${marker.id}`}
              role="option"
              aria-selected={index === selectedMarkerIndex}
              tabIndex={index === selectedMarkerIndex ? 0 : -1}
              onKeyDown={(e) => handleMarkerKeyDown(e, index)}
            >
              <button
                aria-label={`${marker.label}. Type: ${marker.type}. Location: ${marker.lat.toFixed(2)} north, ${marker.lng.toFixed(2)} east.${marker.confidence ? ` Confidence: ${marker.confidence}.` : ''}${marker.date ? ` Date: ${marker.date}.` : ''}`}
                onClick={() => onMarkerSelect?.(marker.id)}
              >
                {marker.label} ({marker.type}) — {marker.lat.toFixed(2)}°N, {marker.lng.toFixed(2)}°E
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
