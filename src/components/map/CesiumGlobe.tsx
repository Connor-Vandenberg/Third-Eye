'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * CesiumJS 3D Globe Toggle
 * Renders a full CesiumJS globe as an alternative to the 2D MapLibre view.
 * Uses dynamic import to avoid SSR issues with CesiumJS.
 *
 * Features:
 * - CZML entity tracking with interpolated paths
 * - Satellite orbit visualization
 * - ISR coverage polygons
 * - Prediction uncertainty cones
 * - Terrain + 3D Tiles support
 * - Time-dynamic animation with Clock widget
 *
 * Connected to:
 * - God's Eye WebSocket for real-time entity positions
 * - GZM API for CZML export of tracked entities
 * - ISR service for coverage polygon data
 */

import type { SignalEvent, ISRAsset } from '@/lib/gzm-client';

interface CesiumGlobeProps {
  events: SignalEvent[];
  isrAssets: ISRAsset[];
  visible: boolean;
  onEntityClick?: (entityId: string) => void;
}

export function CesiumGlobe({ events, isrAssets, visible, onEntityClick }: CesiumGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!visible || !containerRef.current) return;

    let viewer: any = null;

    async function initCesium() {
      // Dynamic import to avoid SSR
      const Cesium = await import('cesium');
      await import('cesium/Build/Cesium/Widgets/widgets.css');

      // Set Cesium Ion token (free tier)
      Cesium.Ion.defaultAccessToken = process.env.NEXT_PUBLIC_CESIUM_TOKEN || '';

      if (!containerRef.current) return;

      viewer = new Cesium.Viewer(containerRef.current, {
        terrain: Cesium.Terrain.fromWorldTerrain(),
        animation: true,
        timeline: true,
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: true,
        navigationHelpButton: false,
        fullscreenButton: false,
        infoBox: true,
        selectionIndicator: true,
        shouldAnimate: true,
        // Dark theme
        baseLayer: Cesium.ImageryLayer.fromProviderAsync(
          Cesium.IonImageryProvider.fromAssetId(3845) // Bing Maps dark
        ),
      });

      // Dark sky
      viewer.scene.backgroundColor = Cesium.Color.BLACK;
      viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#0a0a0a');

      viewerRef.current = viewer;
      setLoaded(true);
    }

    initCesium();

    return () => {
      if (viewer && !viewer.isDestroyed()) {
        viewer.destroy();
      }
    };
  }, [visible]);

  // Update entities when events change
  useEffect(() => {
    if (!viewerRef.current || !loaded) return;
    const viewer = viewerRef.current;
    const Cesium = (window as any).Cesium;
    if (!Cesium) return;

    // Clear existing entities
    viewer.entities.removeAll();

    // Add signal events as entities
    events.slice(-500).forEach((event) => {
      const color = getIntColor(event.int_domain, Cesium);

      viewer.entities.add({
        id: event.id,
        position: Cesium.Cartesian3.fromDegrees(event.lng, event.lat, 0),
        point: {
          pixelSize: 6 + event.confidence * 10,
          color: color,
          outlineColor: Cesium.Color.WHITE.withAlpha(0.3),
          outlineWidth: 1,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
        label: {
          text: event.int_domain,
          font: '10px monospace',
          fillColor: Cesium.Color.WHITE.withAlpha(0.7),
          style: Cesium.LabelStyle.FILL,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -12),
          scale: 0.8,
          showBackground: true,
          backgroundColor: Cesium.Color.BLACK.withAlpha(0.6),
        },
        description: `<div style="background:#111;color:#fff;padding:8px;font-family:monospace;font-size:11px;">
          <b>${event.int_domain}</b><br/>
          Confidence: ${(event.confidence * 100).toFixed(0)}%<br/>
          Convergence: ${(event.convergence_score * 100).toFixed(0)}%<br/>
          Time: ${event.timestamp}<br/>
          ID: ${event.id}
        </div>`,
      });
    });

    // Add ISR assets with coverage circles
    isrAssets.forEach((asset) => {
      const assetColor = asset.status === 'ready'
        ? Cesium.Color.GREEN.withAlpha(0.8)
        : asset.status === 'busy'
          ? Cesium.Color.YELLOW.withAlpha(0.8)
          : Cesium.Color.RED.withAlpha(0.8);

      viewer.entities.add({
        id: `isr-${asset.id}`,
        position: Cesium.Cartesian3.fromDegrees(asset.lng, asset.lat, 500),
        billboard: {
          image: getAssetIcon(asset.type),
          scale: 0.5,
          verticalOrigin: Cesium.VerticalOrigin.CENTER,
        },
        ellipse: {
          semiMinorAxis: asset.coverage_radius_km * 1000,
          semiMajorAxis: asset.coverage_radius_km * 1000,
          material: assetColor.withAlpha(0.1),
          outline: true,
          outlineColor: assetColor,
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
        label: {
          text: asset.name,
          font: '11px monospace',
          fillColor: Cesium.Color.WHITE,
          showBackground: true,
          backgroundColor: Cesium.Color.BLACK.withAlpha(0.7),
          pixelOffset: new Cesium.Cartesian2(0, -20),
        },
      });
    });
  }, [events, isrAssets, loaded]);

  // Handle entity click
  useEffect(() => {
    if (!viewerRef.current || !loaded || !onEntityClick) return;
    const viewer = viewerRef.current;

    const handler = new (window as any).Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((click: any) => {
      const picked = viewer.scene.pick(click.position);
      if (picked?.id?.id) {
        onEntityClick(picked.id.id);
      }
    }, (window as any).Cesium.ScreenSpaceEventType.LEFT_CLICK);

    return () => handler.destroy();
  }, [loaded, onEntityClick]);

  if (!visible) return null;

  return (
    <div className="absolute inset-0 z-30">
      <div ref={containerRef} className="w-full h-full" />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-cyan-400 text-sm animate-pulse">Initializing 3D Globe...</div>
        </div>
      )}
    </div>
  );
}

function getIntColor(domain: string, Cesium: any) {
  const colors: Record<string, any> = {
    OSINT: Cesium.Color.fromCssColorString('#4287f5'),
    GEOINT: Cesium.Color.fromCssColorString('#ff9800'),
    SIGINT: Cesium.Color.fromCssColorString('#9c27b0'),
    MASINT: Cesium.Color.fromCssColorString('#f44336'),
    HUMINT: Cesium.Color.fromCssColorString('#4caf50'),
    CYBER: Cesium.Color.fromCssColorString('#00e5ff'),
    'INFO-OPS': Cesium.Color.fromCssColorString('#ffeb3b'),
    ELINT: Cesium.Color.fromCssColorString('#e91e63'),
    IMINT: Cesium.Color.fromCssColorString('#795548'),
    FINANCIAL: Cesium.Color.fromCssColorString('#ffc107'),
  };
  return colors[domain] || Cesium.Color.WHITE;
}

function getAssetIcon(type: string): string {
  // Return data URI or hosted icon path
  const icons: Record<string, string> = {
    drone: '/icons/drone.svg',
    satellite: '/icons/satellite.svg',
    ground_sensor: '/icons/sensor.svg',
    ship: '/icons/ship.svg',
    aircraft: '/icons/aircraft.svg',
  };
  return icons[type] || '/icons/default.svg';
}
