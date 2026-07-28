/**
 * H3 Convergence Heatmap Layer
 * Renders convergence scores as extruded H3 hexagons on deck.gl.
 * Color: green (low) -> yellow (medium) -> red (high threat)
 * Elevation: proportional to signal count
 * Resolution: dynamic based on zoom level (res 4 -> res 9)
 *
 * This is GZM's visual differentiator. No other OSINT platform
 * shows multi-INT convergence as a spatial heatmap.
 */

import { H3HexagonLayer } from '@deck.gl/geo-layers';
import type { H3Cell } from '@/lib/gzm-client';

// Color ramp: green (0.0) -> yellow (0.5) -> red (1.0)
function scoreToColor(score: number): [number, number, number, number] {
  if (score < 0.33) {
    // Green to yellow
    const t = score / 0.33;
    return [Math.round(t * 255), 255, 0, 200];
  } else if (score < 0.66) {
    // Yellow to orange
    const t = (score - 0.33) / 0.33;
    return [255, Math.round(255 - t * 128), 0, 220];
  } else {
    // Orange to red
    const t = (score - 0.66) / 0.34;
    return [255, Math.round(127 - t * 127), 0, 240];
  }
}

export interface ConvergenceHeatmapProps {
  data: H3Cell[];
  visible?: boolean;
  opacity?: number;
  extruded?: boolean;
  onClick?: (info: { object: H3Cell }) => void;
}

export function createConvergenceHeatmapLayer(props: ConvergenceHeatmapProps) {
  const { data, visible = true, opacity = 0.75, extruded = true, onClick } = props;

  return new H3HexagonLayer({
    id: 'gzm-convergence-heatmap',
    data,
    visible,
    opacity,
    extruded,
    wireframe: false,
    filled: true,
    pickable: true,
    autoHighlight: true,
    highlightColor: [255, 255, 255, 80],
    elevationScale: 1,
    getHexagon: (d: H3Cell) => d.hex,
    getFillColor: (d: H3Cell) => scoreToColor(d.score),
    getElevation: (d: H3Cell) => d.signals * 150,
    getLineColor: [255, 255, 255, 40],
    getLineWidth: 1,
    material: {
      ambient: 0.4,
      diffuse: 0.6,
      shininess: 20,
      specularColor: [60, 60, 60],
    },
    transitions: {
      getFillColor: { duration: 500 },
      getElevation: { duration: 500 },
    },
    updateTriggers: {
      getFillColor: [data.length],
      getElevation: [data.length],
    },
    onClick: onClick as any,
  });
}

// Zoom-to-resolution mapping for dynamic LOD
export function zoomToH3Resolution(zoom: number): number {
  if (zoom < 3) return 2;
  if (zoom < 5) return 3;
  if (zoom < 7) return 4;
  if (zoom < 9) return 5;
  if (zoom < 11) return 6;
  if (zoom < 13) return 7;
  if (zoom < 15) return 8;
  return 9;
}
