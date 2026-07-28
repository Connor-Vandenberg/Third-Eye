/**
 * Relationship Arcs Layer
 * Visualizes knowledge graph edges as arcs on the map.
 * Each arc connects two entities that have a relationship in TigerGraph.
 *
 * Arc width = relationship weight
 * Arc color = relationship type (financial=gold, communication=cyan, etc.)
 * Great circle arcs for accurate geographic representation.
 */

import { ArcLayer } from '@deck.gl/layers';

export interface RelationshipArc {
  sourceId: string;
  targetId: string;
  sourceLat: number;
  sourceLng: number;
  targetLat: number;
  targetLng: number;
  type: string;
  weight: number;
}

const RELATIONSHIP_COLORS: Record<string, [number, number, number]> = {
  financial_transfer: [255, 193, 7],
  communication: [0, 229, 255],
  co_location: [76, 175, 80],
  command_control: [244, 67, 54],
  supply_chain: [255, 152, 0],
  intelligence_report: [156, 39, 176],
  social_network: [66, 135, 245],
  sanctions_evasion: [233, 30, 99],
  weapons_transfer: [244, 67, 54],
  propaganda: [255, 235, 59],
  cyber_attack: [0, 229, 255],
  maritime_route: [33, 150, 243],
  default: [150, 150, 150],
};

export function createRelationshipArcsLayer(
  data: RelationshipArc[],
  visible = true,
  selectedEntityId?: string
) {
  // Filter to show only arcs connected to selected entity, or all if none selected
  const filtered = selectedEntityId
    ? data.filter(d => d.sourceId === selectedEntityId || d.targetId === selectedEntityId)
    : data;

  return new ArcLayer({
    id: 'gzm-relationship-arcs',
    data: filtered,
    visible,
    pickable: true,
    autoHighlight: true,
    highlightColor: [255, 255, 255, 100],
    getSourcePosition: (d: RelationshipArc) => [d.sourceLng, d.sourceLat],
    getTargetPosition: (d: RelationshipArc) => [d.targetLng, d.targetLat],
    getSourceColor: (d: RelationshipArc) => [
      ...(RELATIONSHIP_COLORS[d.type] || RELATIONSHIP_COLORS.default),
      220,
    ] as [number, number, number, number],
    getTargetColor: (d: RelationshipArc) => [
      ...(RELATIONSHIP_COLORS[d.type] || RELATIONSHIP_COLORS.default),
      80,
    ] as [number, number, number, number],
    getWidth: (d: RelationshipArc) => 1 + d.weight * 4,
    widthMinPixels: 1,
    widthMaxPixels: 8,
    greatCircle: true,
    numSegments: 50,
    getHeight: 0.3,
    getTilt: 0,
  });
}
