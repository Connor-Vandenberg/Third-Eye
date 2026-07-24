'use client';

import { useEffect, useRef, useState } from 'react';

const DARK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const MOCK_ENTITIES = [
  { id: 'ent-1', name: 'MV CASPIAN STAR', type: 'vessel', threat: 0.87, lat: 34.052, lon: -118.244, convergence: 0.91 },
  { id: 'ent-2', name: 'SUSPECTED ARMS DEPOT', type: 'facility', threat: 0.72, lat: 34.08, lon: -118.19, convergence: 0.67 },
  { id: 'ent-3', name: 'RF EMITTER UNKNOWN', type: 'emitter', threat: 0.55, lat: 34.06, lon: -118.28, convergence: 0.45 },
  { id: 'ent-4', name: 'DARK VESSEL 2', type: 'vessel', threat: 0.63, lat: 33.95, lon: -118.40, convergence: 0.58 },
  { id: 'ent-5', name: 'SHELL CORP OFFICE', type: 'organization', threat: 0.44, lat: 34.10, lon: -118.15, convergence: 0.33 },
];

const MOCK_PLATFORMS = [
  { id: 'raven-01', name: 'RAVEN-01', lat: 34.055, lon: -118.24, heading: 45, status: 'tasked' },
  { id: 'raven-02', name: 'RAVEN-02', lat: 34.12, lon: -118.30, heading: 180, status: 'active' },
  { id: 'rover-01', name: 'ROVER-01', lat: 34.06, lon: -118.25, heading: 90, status: 'tasked' },
];

const ISR_GAPS = [
  { id: 'gap-1', lat: 34.03, lon: -118.35, label: 'ISR-REQ-0448' },
  { id: 'gap-2', lat: 34.11, lon: -118.22, label: 'ISR-REQ-0449' },
];

export default function GlobePage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<typeof MOCK_ENTITIES[0] | null>(null);
  const [layers, setLayers] = useState({ entities: true, platforms: true, earthquakes: true, heatmap: false, gaps: true });

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const initMap = async () => {
      const maplibregl = (await import('maplibre-gl')).default;
      await import('maplibre-gl/dist/maplibre-gl.css');

      const map = new maplibregl.Map({
        container: mapContainer.current!,
        style: DARK_STYLE,
        center: [-118.25, 34.05],
        zoom: 10,
        pitch: 30,
        bearing: -15,
        attributionControl: false,
      });

      map.addControl(new maplibregl.NavigationControl(), 'bottom-right');
      map.addControl(new maplibregl.ScaleControl(), 'bottom-left');

      map.on('load', () => {
        // USGS Earthquake layer (LIVE DATA)
        map.addSource('earthquakes', {
          type: 'geojson',
          data: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson',
        });

        map.addLayer({
          id: 'earthquake-heat',
          type: 'heatmap',
          source: 'earthquakes',
          maxzoom: 9,
          paint: {
            'heatmap-weight': ['interpolate', ['linear'], ['get', 'mag'], 0, 0, 6, 1],
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
            'heatmap-color': [
              'interpolate', ['linear'], ['heatmap-density'],
              0, 'rgba(0,0,0,0)',
              0.2, 'rgba(103,0,13,0.3)',
              0.4, 'rgba(203,24,29,0.4)',
              0.6, 'rgba(241,105,19,0.5)',
              0.8, 'rgba(253,187,48,0.6)',
              1, 'rgba(255,255,178,0.7)',
            ],
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 9, 20],
            'heatmap-opacity': 0.6,
          },
        });

        map.addLayer({
          id: 'earthquake-point',
          type: 'circle',
          source: 'earthquakes',
          minzoom: 7,
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['get', 'mag'], 1, 3, 6, 12],
            'circle-color': ['interpolate', ['linear'], ['get', 'mag'], 1, '#fed976', 3, '#fd8d3c', 5, '#e31a1c'],
            'circle-opacity': 0.7,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#333',
          },
        });

        // Entity markers
        const entityGeoJSON = {
          type: 'FeatureCollection' as const,
          features: MOCK_ENTITIES.map((e) => ({
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [e.lon, e.lat] },
            properties: { id: e.id, name: e.name, type: e.type, threat: e.threat, convergence: e.convergence },
          })),
        };

        map.addSource('entities', { type: 'geojson', data: entityGeoJSON });

        map.addLayer({
          id: 'entity-markers',
          type: 'circle',
          source: 'entities',
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['get', 'threat'], 0.3, 6, 0.9, 14],
            'circle-color': ['interpolate', ['linear'], ['get', 'threat'], 0.3, '#4ade80', 0.6, '#fbbf24', 0.8, '#ef4444'],
            'circle-stroke-width': 2,
            'circle-stroke-color': ['interpolate', ['linear'], ['get', 'threat'], 0.3, '#22c55e', 0.6, '#f59e0b', 0.8, '#dc2626'],
            'circle-opacity': 0.85,
          },
        });

        map.addLayer({
          id: 'entity-labels',
          type: 'symbol',
          source: 'entities',
          layout: {
            'text-field': ['get', 'name'],
            'text-size': 11,
            'text-offset': [0, 1.5],
            'text-anchor': 'top',
            'text-font': ['Open Sans Regular'],
          },
          paint: {
            'text-color': '#e2e8f0',
            'text-halo-color': '#0f172a',
            'text-halo-width': 1.5,
          },
        });

        // Convergence zones (dashed circles approximated as polygons)
        const convergenceGeoJSON = {
          type: 'FeatureCollection' as const,
          features: MOCK_ENTITIES.filter((e) => e.convergence > 0.6).map((e) => {
            const points = 64;
            const radius = e.convergence * 0.015;
            const coords = Array.from({ length: points + 1 }, (_, i) => {
              const angle = (i / points) * 2 * Math.PI;
              return [e.lon + radius * Math.cos(angle), e.lat + radius * Math.sin(angle)];
            });
            return {
              type: 'Feature' as const,
              geometry: { type: 'Polygon' as const, coordinates: [coords] },
              properties: { convergence: e.convergence, name: e.name },
            };
          }),
        };

        map.addSource('convergence-zones', { type: 'geojson', data: convergenceGeoJSON });

        map.addLayer({
          id: 'convergence-fill',
          type: 'fill',
          source: 'convergence-zones',
          paint: {
            'fill-color': ['interpolate', ['linear'], ['get', 'convergence'], 0.5, 'rgba(251,191,36,0.05)', 0.9, 'rgba(239,68,68,0.1)'],
          },
        });

        map.addLayer({
          id: 'convergence-border',
          type: 'line',
          source: 'convergence-zones',
          paint: {
            'line-color': ['interpolate', ['linear'], ['get', 'convergence'], 0.5, '#fbbf24', 0.9, '#ef4444'],
            'line-width': 1.5,
            'line-dasharray': [4, 4],
            'line-opacity': 0.7,
          },
        });

        // Platform markers
        const platformGeoJSON = {
          type: 'FeatureCollection' as const,
          features: MOCK_PLATFORMS.map((p) => ({
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [p.lon, p.lat] },
            properties: { id: p.id, name: p.name, heading: p.heading, status: p.status },
          })),
        };

        map.addSource('platforms', { type: 'geojson', data: platformGeoJSON });

        map.addLayer({
          id: 'platform-markers',
          type: 'circle',
          source: 'platforms',
          paint: {
            'circle-radius': 8,
            'circle-color': '#4ade80',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#166534',
          },
        });

        map.addLayer({
          id: 'platform-labels',
          type: 'symbol',
          source: 'platforms',
          layout: {
            'text-field': ['get', 'name'],
            'text-size': 10,
            'text-offset': [0, -1.5],
            'text-anchor': 'bottom',
            'text-font': ['Open Sans Regular'],
          },
          paint: { 'text-color': '#4ade80', 'text-halo-color': '#0f172a', 'text-halo-width': 1 },
        });

        // ISR Gap markers
        const gapGeoJSON = {
          type: 'FeatureCollection' as const,
          features: ISR_GAPS.map((g) => ({
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [g.lon, g.lat] },
            properties: { id: g.id, label: g.label },
          })),
        };

        map.addSource('isr-gaps', { type: 'geojson', data: gapGeoJSON });

        map.addLayer({
          id: 'isr-gap-markers',
          type: 'circle',
          source: 'isr-gaps',
          paint: {
            'circle-radius': 12,
            'circle-color': 'rgba(251,191,36,0.15)',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fbbf24',
            'circle-stroke-opacity': 0.8,
          },
        });

        map.addLayer({
          id: 'isr-gap-labels',
          type: 'symbol',
          source: 'isr-gaps',
          layout: {
            'text-field': '?',
            'text-size': 14,
            'text-font': ['Open Sans Bold'],
          },
          paint: { 'text-color': '#fbbf24' },
        });

        // Click interactions
        map.on('click', 'entity-markers', (e: any) => {
          if (e.features?.[0]) {
            const props = e.features[0].properties;
            const entity = MOCK_ENTITIES.find((ent) => ent.id === props.id);
            setSelectedEntity(entity || null);
          }
        });

        map.on('mouseenter', 'entity-markers', () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', 'entity-markers', () => { map.getCanvas().style.cursor = ''; });

        setMapLoaded(true);
      });

      mapRef.current = map;
    };

    initMap();

    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {/* Layer Controls */}
      <div style={{
        position: 'absolute', top: 12, left: 12, background: 'oklch(12% 0.012 250 / 0.92)',
        borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px',
        border: '1px solid var(--border-subtle)', backdropFilter: 'blur(8px)',
      }}>
        <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>Layers</div>
        {Object.entries(layers).map(([key, val]) => (
          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input type="checkbox" checked={val} onChange={() => setLayers((l) => ({ ...l, [key]: !l[key as keyof typeof l] }))} />
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </label>
        ))}
      </div>

      {/* Legend */}
      <div style={{
        position: 'absolute', top: 12, right: 12, background: 'oklch(12% 0.012 250 / 0.92)',
        borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px',
        border: '1px solid var(--border-subtle)',
      }}>
        <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>Legend</div>
        <LegendItem color="#ef4444" label="Threat (High)" />
        <LegendItem color="#fbbf24" label="Threat (Medium)" />
        <LegendItem color="#4ade80" label="Platform (Active)" />
        <LegendItem color="#fbbf24" label="ISR Gap (Pending)" dashed />
        <LegendItem color="#fd8d3c" label="Seismic Activity" />
      </div>

      {/* Entity Popup */}
      {selectedEntity && (
        <div style={{
          position: 'absolute', bottom: 16, right: 16, width: '300px',
          background: 'var(--surface-1)', border: '1px solid var(--border-default)',
          borderRadius: '10px', padding: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>{selectedEntity.type}</span>
            <button onClick={() => setSelectedEntity(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }}>&times;</button>
          </div>
          <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>{selectedEntity.name}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>{selectedEntity.id}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <MiniScore label="Threat" value={selectedEntity.threat} color={selectedEntity.threat >= 0.8 ? 'var(--red)' : 'var(--amber)'} />
            <MiniScore label="Convergence" value={selectedEntity.convergence} color={selectedEntity.convergence >= 0.8 ? 'var(--red)' : 'var(--amber)'} />
          </div>
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
            <ActionBtn label="Dossier" />
            <ActionBtn label="Task Drone" />
            <ActionBtn label="Track" />
          </div>
        </div>
      )}

      {/* Coordinates */}
      <div style={{
        position: 'absolute', bottom: 8, left: 8, fontFamily: 'var(--font-mono)',
        fontSize: '11px', color: 'var(--text-muted)', background: 'oklch(10% 0.012 250 / 0.8)',
        padding: '4px 8px', borderRadius: '4px',
      }}>
        {mapLoaded ? 'LIVE | Entities: 5 | Platforms: 3 | ISR Gaps: 2 | Seismic: USGS Real-Time' : 'Loading map...'}
      </div>
    </div>
  );
}

function LegendItem({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: dashed ? 'transparent' : color, border: dashed ? `2px dashed ${color}` : 'none' }} />
      {label}
    </div>
  );
}

function MiniScore({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: '6px', padding: '8px 10px' }}>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color }}>{value.toFixed(2)}</div>
    </div>
  );
}

function ActionBtn({ label }: { label: string }) {
  return (
    <button style={{
      flex: 1, padding: '6px 0', fontSize: '11px', fontWeight: 600,
      background: 'var(--surface-3)', border: '1px solid var(--border-default)',
      borderRadius: '5px', color: 'var(--text-secondary)', cursor: 'pointer',
    }}>{label}</button>
  );
}
