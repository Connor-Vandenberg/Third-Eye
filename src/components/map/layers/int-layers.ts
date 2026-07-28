/**
 * 10-INT Domain Layer Definitions
 * Each intelligence domain gets a distinct visual layer on deck.gl.
 * All layers accept SignalEvent[] data filtered by int_domain.
 */

import { ScatterplotLayer, ArcLayer, IconLayer, PathLayer, TextLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import type { SignalEvent } from '@/lib/gzm-client';

export type IntDomain =
  | 'OSINT'
  | 'GEOINT'
  | 'SIGINT'
  | 'MASINT'
  | 'HUMINT'
  | 'CYBER'
  | 'INFO-OPS'
  | 'ELINT'
  | 'IMINT'
  | 'FINANCIAL';

export interface IntLayerConfig {
  domain: IntDomain;
  label: string;
  color: [number, number, number];
  icon: string;
  description: string;
}

export const INT_LAYER_CONFIGS: IntLayerConfig[] = [
  { domain: 'OSINT', label: 'Open Source', color: [66, 135, 245], icon: '🌐', description: 'GDELT, ACLED, news, social media' },
  { domain: 'GEOINT', label: 'Geospatial', color: [255, 152, 0], icon: '🛰️', description: 'VIIRS nightfire, SAR, satellite imagery' },
  { domain: 'SIGINT', label: 'Signals', color: [156, 39, 176], icon: '📡', description: 'SDR intercepts, emitter tracking' },
  { domain: 'MASINT', label: 'Measurement', color: [244, 67, 54], icon: '🔬', description: 'Seismic, thermal, chemical, nuclear' },
  { domain: 'HUMINT', label: 'Human', color: [76, 175, 80], icon: '🕵️', description: 'Agent reports, ground truth' },
  { domain: 'CYBER', label: 'Cyber', color: [0, 229, 255], icon: '💻', description: 'GreyNoise, OTX, attack vectors' },
  { domain: 'INFO-OPS', label: 'Information Ops', color: [255, 235, 59], icon: '📢', description: 'CIB detection, propaganda tracking' },
  { domain: 'ELINT', label: 'Electronic', color: [233, 30, 99], icon: '⚡', description: 'Radar emissions, passive intercepts' },
  { domain: 'IMINT', label: 'Imagery', color: [121, 85, 72], icon: '📷', description: 'Change detection, object recognition' },
  { domain: 'FINANCIAL', label: 'Financial', color: [255, 193, 7], icon: '💰', description: 'Sanctions evasion, illicit flows' },
];

export function createIntLayer(domain: IntDomain, events: SignalEvent[], visible: boolean) {
  const config = INT_LAYER_CONFIGS.find(c => c.domain === domain)!;
  const filtered = events.filter(e => e.int_domain === domain);

  switch (domain) {
    case 'OSINT':
    case 'HUMINT':
    case 'IMINT':
      return new ScatterplotLayer({
        id: `int-${domain}`,
        data: filtered,
        visible,
        pickable: true,
        opacity: 0.8,
        stroked: true,
        filled: true,
        radiusScale: 1,
        radiusMinPixels: 4,
        radiusMaxPixels: 20,
        getPosition: (d: SignalEvent) => [d.lng, d.lat],
        getRadius: (d: SignalEvent) => d.confidence * 1000,
        getFillColor: [...config.color, 200] as [number, number, number, number],
        getLineColor: [255, 255, 255, 100] as [number, number, number, number],
        getLineWidth: 1,
      });

    case 'SIGINT':
    case 'ELINT':
    case 'CYBER':
      return new ArcLayer({
        id: `int-${domain}`,
        data: filtered.filter((_, i) => i < filtered.length - 1).map((e, i) => ({
          source: e,
          target: filtered[i + 1] || e,
        })),
        visible,
        pickable: true,
        getSourcePosition: (d: any) => [d.source.lng, d.source.lat],
        getTargetPosition: (d: any) => [d.target.lng, d.target.lat],
        getSourceColor: [...config.color, 255] as [number, number, number, number],
        getTargetColor: [...config.color, 100] as [number, number, number, number],
        getWidth: 2,
        greatCircle: true,
      });

    case 'MASINT':
    case 'GEOINT':
      return new HeatmapLayer({
        id: `int-${domain}`,
        data: filtered,
        visible,
        getPosition: (d: SignalEvent) => [d.lng, d.lat],
        getWeight: (d: SignalEvent) => d.convergence_score,
        radiusPixels: 40,
        intensity: 1.5,
        threshold: 0.1,
        colorRange: [
          [config.color[0], config.color[1], config.color[2], 0],
          [config.color[0], config.color[1], config.color[2], 128],
          [config.color[0], config.color[1], config.color[2], 255],
        ],
      });

    case 'INFO-OPS':
    case 'FINANCIAL':
    default:
      return new ScatterplotLayer({
        id: `int-${domain}`,
        data: filtered,
        visible,
        pickable: true,
        opacity: 0.7,
        filled: true,
        radiusMinPixels: 6,
        radiusMaxPixels: 24,
        getPosition: (d: SignalEvent) => [d.lng, d.lat],
        getRadius: (d: SignalEvent) => d.convergence_score * 2000,
        getFillColor: [...config.color, 180] as [number, number, number, number],
      });
  }
}
