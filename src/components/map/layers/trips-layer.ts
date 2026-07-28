/**
 * Temporal Trips Layer
 * Animated paths showing entity movement over time.
 * Uses deck.gl TripsLayer for GPU-accelerated trail rendering.
 *
 * Data format: Array of trips, each trip is an array of [lng, lat, timestamp]
 * The animation loops through time, showing where entities have been.
 */

import { TripsLayer } from '@deck.gl/geo-layers';
import type { SignalEvent } from '@/lib/gzm-client';

export interface TripData {
  id: string;
  path: [number, number, number][]; // [lng, lat, timestamp_seconds]
  int_domain: string;
}

// Convert signal events into trip format (group by entity ID)
export function eventsToTrips(events: SignalEvent[]): TripData[] {
  const grouped: Record<string, SignalEvent[]> = {};

  for (const event of events) {
    if (event.type === 'entity_move') {
      if (!grouped[event.id]) grouped[event.id] = [];
      grouped[event.id].push(event);
    }
  }

  return Object.entries(grouped)
    .filter(([_, evts]) => evts.length >= 2)
    .map(([id, evts]) => ({
      id,
      int_domain: evts[0].int_domain,
      path: evts
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map(e => [
          e.lng,
          e.lat,
          new Date(e.timestamp).getTime() / 1000, // seconds since epoch
        ] as [number, number, number]),
    }));
}

const INT_COLORS: Record<string, [number, number, number]> = {
  OSINT: [66, 135, 245],
  GEOINT: [255, 152, 0],
  SIGINT: [156, 39, 176],
  MASINT: [244, 67, 54],
  HUMINT: [76, 175, 80],
  CYBER: [0, 229, 255],
  'INFO-OPS': [255, 235, 59],
  ELINT: [233, 30, 99],
  IMINT: [121, 85, 72],
  FINANCIAL: [255, 193, 7],
};

export interface TripsLayerProps {
  trips: TripData[];
  currentTime: number; // seconds since epoch
  trailLength?: number; // seconds of trail to show
  visible?: boolean;
}

export function createTripsLayer(props: TripsLayerProps) {
  const { trips, currentTime, trailLength = 3600, visible = true } = props;

  return new TripsLayer({
    id: 'gzm-entity-trips',
    data: trips,
    visible,
    getPath: (d: TripData) => d.path,
    getTimestamps: (d: TripData) => d.path.map(p => p[2]),
    getColor: (d: TripData) => INT_COLORS[d.int_domain] || [255, 255, 255],
    opacity: 0.8,
    widthMinPixels: 2,
    widthMaxPixels: 6,
    jointRounded: true,
    capRounded: true,
    trailLength,
    currentTime,
    shadowEnabled: false,
  });
}
