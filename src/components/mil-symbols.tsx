'use client';

import { memo } from 'react';

// MIL-STD-2525D Symbol Renderer
// Renders standard NATO military symbology as SVG

export type Affiliation = 'friendly' | 'hostile' | 'neutral' | 'unknown' | 'pending';
export type Dimension = 'ground' | 'air' | 'sea' | 'subsurface' | 'space' | 'cyber';
export type Status = 'present' | 'planned' | 'anticipated' | 'suspected';

const AFFILIATION_COLORS: Record<Affiliation, { fill: string; stroke: string }> = {
  friendly: { fill: '#80e0ff', stroke: '#00a8e0' },
  hostile: { fill: '#ff8080', stroke: '#ff0000' },
  neutral: { fill: '#aaffaa', stroke: '#00c000' },
  unknown: { fill: '#ffff80', stroke: '#e0e000' },
  pending: { fill: '#ffff80', stroke: '#e0e000' },
};

const AFFILIATION_SHAPES: Record<Affiliation, string> = {
  friendly: 'M 25,5 L 95,5 L 95,75 L 25,75 Z',
  hostile: 'M 60,5 L 95,40 L 60,75 L 25,40 Z',
  neutral: 'M 25,5 L 95,5 L 95,75 L 25,75 Z',
  unknown: 'M 35,5 Q 25,5 25,15 L 25,65 Q 25,75 35,75 L 85,75 Q 95,75 95,65 L 95,15 Q 95,5 85,5 Z',
  pending: 'M 35,5 Q 25,5 25,15 L 25,65 Q 25,75 35,75 L 85,75 Q 95,75 95,65 L 95,15 Q 95,5 85,5 Z',
};

const DIMENSION_INDICATORS: Record<Dimension, { path: string; yOffset: number }> = {
  ground: { path: 'M 45,75 L 45,85 L 75,85 L 75,75', yOffset: 0 },
  air: { path: 'M 60,5 L 60,-5', yOffset: -10 },
  sea: { path: 'M 25,75 Q 40,85 60,75 Q 80,85 95,75', yOffset: 0 },
  subsurface: { path: 'M 25,75 L 25,85 L 95,85 L 95,75', yOffset: 0 },
  space: { path: 'M 50,5 L 60,-5 L 70,5', yOffset: -10 },
  cyber: { path: '', yOffset: 0 },
};

// Common military icon paths (simplified for SVG rendering)
const ENTITY_ICONS: Record<string, string> = {
  infantry: 'M 35,25 L 85,55 M 85,25 L 35,55',
  armor: 'M 40,40 A 20,15 0 1,1 80,40',
  artillery: 'M 60,30 A 5,5 0 1,1 60,30.01 M 60,25 L 60,55',
  aircraft: 'M 60,25 L 60,55 M 40,35 L 80,35 M 50,50 L 70,50',
  rotary_wing: 'M 60,25 L 60,55 M 40,35 L 80,35 M 50,55 L 70,55 M 55,25 L 60,20 L 65,25',
  naval: 'M 40,40 L 60,30 L 80,40 M 60,30 L 60,55',
  submarine: 'M 40,40 A 20,10 0 1,0 80,40 A 20,10 0 1,0 40,40',
  missile: 'M 60,25 L 60,55 M 55,45 L 60,55 L 65,45 M 55,25 L 65,25',
  radar: 'M 50,55 L 60,35 L 70,55 M 45,40 Q 60,20 75,40',
  signal: 'M 50,55 L 60,25 L 70,55 M 55,45 L 60,35 L 65,45',
  supply: 'M 40,30 L 80,30 L 80,55 L 40,55 Z',
  medical: 'M 55,30 L 65,30 L 65,37 L 72,37 L 72,47 L 65,47 L 65,55 L 55,55 L 55,47 L 48,47 L 48,37 L 55,37 Z',
  hq: 'M 25,40 L 50,40 M 50,20 L 50,60',
  uav: 'M 40,40 L 60,30 L 80,40 M 60,40 L 60,55 M 50,55 L 70,55',
  cyber_ops: 'M 45,30 L 75,30 L 75,55 L 45,55 Z M 50,38 L 60,45 L 70,38',
  sigint: 'M 60,55 L 60,35 M 50,35 Q 60,20 70,35 M 45,40 Q 60,15 75,40',
  elint: 'M 45,55 L 60,30 L 75,55 M 45,45 L 60,30 L 75,45',
  satellite: 'M 50,35 L 70,35 L 70,50 L 50,50 Z M 45,40 L 50,40 M 70,40 L 75,40 M 45,38 L 45,42 M 75,38 L 75,42',
  civilian: 'M 60,30 A 8,8 0 1,1 60,30.01 M 60,38 L 60,55 M 50,45 L 70,45',
  ied: 'M 60,25 L 60,55 M 50,30 L 70,30 M 50,50 L 70,50 M 45,35 L 55,35 M 65,35 L 75,35',
  observation: 'M 50,40 A 10,10 0 1,1 70,40 A 10,10 0 1,1 50,40 M 60,30 L 60,25 M 45,40 L 40,40',
  recon: 'M 50,40 A 10,10 0 1,1 70,40 A 10,10 0 1,1 50,40',
  jamming: 'M 45,30 L 75,55 M 45,55 L 75,30 M 45,42 L 75,42',
  aoa: 'M 40,55 L 60,25 L 80,55',
  default: 'M 55,35 L 65,35 L 65,50 L 55,50 Z',
};

const SIZE_INDICATORS: Record<string, { symbol: string; y: number }> = {
  team: { symbol: '●', y: 2 },
  squad: { symbol: '●●', y: 2 },
  section: { symbol: '●●●', y: 2 },
  platoon: { symbol: '|', y: 0 },
  company: { symbol: '|', y: 0 },
  battalion: { symbol: '||', y: 0 },
  regiment: { symbol: '|||', y: 0 },
  brigade: { symbol: 'X', y: 0 },
  division: { symbol: 'XX', y: 0 },
  corps: { symbol: 'XXX', y: 0 },
  army: { symbol: 'XXXX', y: 0 },
};

export interface MilSymbolProps {
  affiliation: Affiliation;
  dimension?: Dimension;
  entityType?: string;
  status?: Status;
  size?: string;
  label?: string;
  speed?: number;
  heading?: number;
  uniqueDesignation?: string;
  higherFormation?: string;
  width?: number;
  height?: number;
  className?: string;
  onClick?: () => void;
  animated?: boolean;
  showLabels?: boolean;
}

export const MilSymbol = memo(function MilSymbol({
  affiliation,
  dimension = 'ground',
  entityType = 'default',
  status = 'present',
  size,
  label,
  speed,
  heading,
  uniqueDesignation,
  higherFormation,
  width = 40,
  height = 40,
  className = '',
  onClick,
  animated = false,
  showLabels = false,
}: MilSymbolProps) {
  const colors = AFFILIATION_COLORS[affiliation];
  const framePath = AFFILIATION_SHAPES[affiliation];
  const dimIndicator = DIMENSION_INDICATORS[dimension];
  const iconPath = ENTITY_ICONS[entityType] || ENTITY_ICONS.default;
  const isDashed = status === 'planned' || status === 'anticipated' || status === 'suspected';

  const viewBox = '15 -10 90 100';

  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      className={`${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      role="img"
      aria-label={`${affiliation} ${dimension} ${entityType} ${status}`}
    >
      {/* Animated pulse for hostile/critical */}
      {animated && affiliation === 'hostile' && (
        <circle cx="60" cy="40" r="45" fill="none" stroke={colors.stroke} strokeWidth="1" opacity="0.3">
          <animate attributeName="r" from="40" to="55" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Frame (affiliation shape) */}
      <path
        d={framePath}
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth="3"
        strokeDasharray={isDashed ? '8,4' : 'none'}
        fillOpacity="0.6"
      />

      {/* Dimension indicator */}
      {dimIndicator.path && (
        <path
          d={dimIndicator.path}
          fill="none"
          stroke={colors.stroke}
          strokeWidth="2.5"
        />
      )}

      {/* Entity icon */}
      <path
        d={iconPath}
        fill="none"
        stroke="#000000"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Size indicator */}
      {size && SIZE_INDICATORS[size] && (
        <text
          x="60"
          y="2"
          textAnchor="middle"
          fontSize="12"
          fontWeight="bold"
          fill="#000000"
        >
          {SIZE_INDICATORS[size].symbol}
        </text>
      )}

      {/* Heading indicator (direction of movement) */}
      {heading !== undefined && (
        <line
          x1="60"
          y1="40"
          x2={60 + 30 * Math.sin((heading * Math.PI) / 180)}
          y2={40 - 30 * Math.cos((heading * Math.PI) / 180)}
          stroke={colors.stroke}
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
        />
      )}

      {/* Speed leader */}
      {speed !== undefined && heading !== undefined && (
        <line
          x1="60"
          y1="40"
          x2={60 + (speed / 10) * Math.sin((heading * Math.PI) / 180)}
          y2={40 - (speed / 10) * Math.cos((heading * Math.PI) / 180)}
          stroke={colors.stroke}
          strokeWidth="1"
          strokeDasharray="3,2"
          opacity="0.6"
        />
      )}

      {/* Labels */}
      {showLabels && (
        <>
          {uniqueDesignation && (
            <text x="60" y="88" textAnchor="middle" fontSize="9" fill="white" fontFamily="monospace">
              {uniqueDesignation}
            </text>
          )}
          {higherFormation && (
            <text x="100" y="25" textAnchor="start" fontSize="8" fill="white" fontFamily="monospace">
              {higherFormation}
            </text>
          )}
          {label && (
            <text x="60" y="97" textAnchor="middle" fontSize="8" fill="white" fontFamily="sans-serif">
              {label}
            </text>
          )}
          {speed !== undefined && (
            <text x="20" y="60" textAnchor="end" fontSize="7" fill="white" fontFamily="monospace">
              {speed}kn
            </text>
          )}
        </>
      )}

      {/* Arrow marker definition */}
      <defs>
        <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <polygon points="0 0, 6 3, 0 6" fill={colors.stroke} />
        </marker>
      </defs>
    </svg>
  );
});

// Utility: Convert track data to MilSymbol props
export function trackToSymbolProps(track: {
  type: string;
  affiliation?: string;
  domain?: string;
  speed?: number;
  heading?: number;
  designation?: string;
  status?: string;
}): Partial<MilSymbolProps> {
  const affiliationMap: Record<string, Affiliation> = {
    friend: 'friendly',
    foe: 'hostile',
    neutral: 'neutral',
    unknown: 'unknown',
    hostile: 'hostile',
    friendly: 'friendly',
  };

  const dimensionMap: Record<string, Dimension> = {
    aircraft: 'air',
    ship: 'sea',
    vessel: 'sea',
    submarine: 'subsurface',
    vehicle: 'ground',
    person: 'ground',
    satellite: 'space',
    cyber: 'cyber',
    uav: 'air',
    drone: 'air',
  };

  return {
    affiliation: affiliationMap[track.affiliation || 'unknown'] || 'unknown',
    dimension: dimensionMap[track.type || 'ground'] || 'ground',
    entityType: track.type || 'default',
    speed: track.speed,
    heading: track.heading,
    uniqueDesignation: track.designation,
    status: (track.status as Status) || 'present',
  };
}

// Batch renderer for map overlays
export function MilSymbolLayer({ tracks, onTrackClick, showLabels = false }: {
  tracks: Array<{ id: string; lat: number; lng: number; type: string; affiliation?: string; domain?: string; speed?: number; heading?: number; designation?: string; status?: string }>;
  onTrackClick?: (id: string) => void;
  showLabels?: boolean;
}) {
  return (
    <>
      {tracks.map((track) => {
        const symbolProps = trackToSymbolProps(track);
        return (
          <div
            key={track.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${track.lng}%`, top: `${track.lat}%` }}
          >
            <MilSymbol
              {...symbolProps}
              affiliation={symbolProps.affiliation || 'unknown'}
              width={32}
              height={32}
              onClick={() => onTrackClick?.(track.id)}
              animated={symbolProps.affiliation === 'hostile'}
              showLabels={showLabels}
            />
          </div>
        );
      })}
    </>
  );
}

export default MilSymbol;
