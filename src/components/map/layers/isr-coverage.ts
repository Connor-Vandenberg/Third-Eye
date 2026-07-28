/**
 * ISR Coverage Polygons Layer
 * Shows the coverage footprint of ISR assets on the map.
 * Renders as semi-transparent circles/polygons showing what each
 * drone, satellite, or ground sensor can observe.
 *
 * Green = ready assets
 * Yellow = busy/collecting
 * Red = maintenance
 * Pulsing animation on active collection
 */

import { ScatterplotLayer, PolygonLayer } from '@deck.gl/layers';
import type { ISRAsset } from '@/lib/gzm-client';

export function createISRCoverageLayer(assets: ISRAsset[], visible = true) {
  return new ScatterplotLayer({
    id: 'gzm-isr-coverage',
    data: assets,
    visible,
    pickable: true,
    opacity: 0.15,
    stroked: true,
    filled: true,
    radiusScale: 1000, // km to meters
    getPosition: (d: ISRAsset) => [d.lng, d.lat],
    getRadius: (d: ISRAsset) => d.coverage_radius_km,
    getFillColor: (d: ISRAsset) => {
      switch (d.status) {
        case 'ready': return [76, 175, 80, 30];
        case 'busy': return [255, 193, 7, 40];
        case 'maintenance': return [244, 67, 54, 20];
        default: return [150, 150, 150, 20];
      }
    },
    getLineColor: (d: ISRAsset) => {
      switch (d.status) {
        case 'ready': return [76, 175, 80, 180];
        case 'busy': return [255, 193, 7, 200];
        case 'maintenance': return [244, 67, 54, 120];
        default: return [150, 150, 150, 100];
      }
    },
    getLineWidth: 2,
    lineWidthMinPixels: 1,
    lineWidthMaxPixels: 3,
  });
}

// ISR asset position markers (the assets themselves)
export function createISRAssetMarkersLayer(assets: ISRAsset[], visible = true) {
  return new ScatterplotLayer({
    id: 'gzm-isr-asset-markers',
    data: assets,
    visible,
    pickable: true,
    opacity: 1,
    stroked: true,
    filled: true,
    radiusMinPixels: 6,
    radiusMaxPixels: 12,
    getPosition: (d: ISRAsset) => [d.lng, d.lat],
    getRadius: 8,
    getFillColor: (d: ISRAsset) => {
      switch (d.status) {
        case 'ready': return [76, 175, 80, 255];
        case 'busy': return [255, 193, 7, 255];
        case 'maintenance': return [244, 67, 54, 255];
        default: return [150, 150, 150, 255];
      }
    },
    getLineColor: [255, 255, 255, 200],
    getLineWidth: 2,
  });
}
