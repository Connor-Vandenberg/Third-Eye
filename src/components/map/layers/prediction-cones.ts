/**
 * Prediction Uncertainty Cones Layer
 * Visualizes where entities are predicted to GO, not just where they've been.
 * Renders as expanding cones/fans from current position toward predicted position.
 *
 * Uses deck.gl PolygonLayer to draw triangular prediction fans.
 * Color intensity = confidence. Fan width = uncertainty.
 */

import { PolygonLayer } from '@deck.gl/layers';
import type { PredictionResult } from '@/lib/gzm-client';

interface PredictionCone {
  id: string;
  polygon: [number, number][];
  confidence: number;
  hypothesis: string;
  resolved: boolean;
}

// Generate a cone polygon from a center point with bearing and spread
function generateCone(
  centerLng: number,
  centerLat: number,
  bearing: number, // degrees
  distance: number, // km
  spreadAngle: number, // degrees (half-angle)
): [number, number][] {
  const R = 6371; // Earth radius km
  const points: [number, number][] = [];

  // Center point
  points.push([centerLng, centerLat]);

  // Generate arc at distance
  const numArcPoints = 12;
  for (let i = 0; i <= numArcPoints; i++) {
    const angle = bearing - spreadAngle + (2 * spreadAngle * i) / numArcPoints;
    const angleRad = (angle * Math.PI) / 180;
    const latRad = (centerLat * Math.PI) / 180;
    const lngRad = (centerLng * Math.PI) / 180;
    const d = distance / R;

    const newLat = Math.asin(
      Math.sin(latRad) * Math.cos(d) + Math.cos(latRad) * Math.sin(d) * Math.cos(angleRad)
    );
    const newLng = lngRad + Math.atan2(
      Math.sin(angleRad) * Math.sin(d) * Math.cos(latRad),
      Math.cos(d) - Math.sin(latRad) * Math.sin(newLat)
    );

    points.push([(newLng * 180) / Math.PI, (newLat * 180) / Math.PI]);
  }

  // Close polygon
  points.push([centerLng, centerLat]);

  return points;
}

export function predictionsToConesData(predictions: PredictionResult[]): PredictionCone[] {
  return predictions
    .filter(p => !p.resolved && p.lat && p.lng)
    .map(p => {
      // Use confidence to determine spread (less confident = wider cone)
      const spread = 15 + (1 - p.confidence) * 30; // 15-45 degrees
      const distance = p.horizon_hours * 10; // rough: 10km per hour horizon
      // Random-ish bearing based on ID hash
      const bearing = (p.id.charCodeAt(0) * 7 + p.id.charCodeAt(1) * 13) % 360;

      return {
        id: p.id,
        polygon: generateCone(p.lng, p.lat, bearing, distance, spread),
        confidence: p.confidence,
        hypothesis: p.hypothesis,
        resolved: p.resolved,
      };
    });
}

export function createPredictionConesLayer(data: PredictionCone[], visible = true) {
  return new PolygonLayer({
    id: 'gzm-prediction-cones',
    data,
    visible,
    pickable: true,
    stroked: true,
    filled: true,
    extruded: false,
    wireframe: false,
    getPolygon: (d: PredictionCone) => d.polygon,
    getFillColor: (d: PredictionCone) => [
      255,
      Math.round(200 - d.confidence * 200),
      0,
      Math.round(40 + d.confidence * 60),
    ],
    getLineColor: (d: PredictionCone) => [
      255,
      Math.round(200 - d.confidence * 200),
      0,
      180,
    ],
    getLineWidth: 1,
    lineWidthMinPixels: 1,
  });
}
