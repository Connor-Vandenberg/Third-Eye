/**
 * MIL-STD-2525D Symbol Mapping
 * Maps entity types to military standard symbology.
 * Returns SVG data URIs for use as deck.gl IconLayer icons.
 *
 * Categories:
 * - Friendly (blue rectangle)
 * - Hostile (red diamond)
 * - Neutral (green square)
 * - Unknown (yellow quatrefoil)
 *
 * Entity types mapped to SIDC (Symbol Identification Coding):
 * - Ground units, air tracks, maritime vessels, space objects
 * - Infrastructure, equipment, activities
 */

export type Affiliation = 'friendly' | 'hostile' | 'neutral' | 'unknown';
export type Dimension = 'ground' | 'air' | 'sea' | 'space' | 'cyber';

interface SymbolConfig {
  fill: string;
  stroke: string;
  shape: 'rectangle' | 'diamond' | 'square' | 'quatrefoil';
  icon: string;
}

const AFFILIATION_STYLES: Record<Affiliation, { fill: string; stroke: string; shape: string }> = {
  friendly: { fill: '#80b4ff', stroke: '#0050a0', shape: 'rectangle' },
  hostile: { fill: '#ff8080', stroke: '#c80000', shape: 'diamond' },
  neutral: { fill: '#80ff80', stroke: '#008000', shape: 'square' },
  unknown: { fill: '#ffff80', stroke: '#c8c800', shape: 'quatrefoil' },
};

const DIMENSION_ICONS: Record<Dimension, string> = {
  ground: 'G',
  air: 'A',
  sea: 'S',
  space: '\u2605',
  cyber: 'C',
};

// Generate SVG data URI for a military symbol
export function generateMilSymbol(
  affiliation: Affiliation,
  dimension: Dimension,
  size = 32
): string {
  const style = AFFILIATION_STYLES[affiliation];
  const icon = DIMENSION_ICONS[dimension];
  const half = size / 2;

  let shapeSvg: string;
  switch (style.shape) {
    case 'rectangle':
      shapeSvg = `<rect x="4" y="8" width="${size - 8}" height="${size - 16}" rx="2" fill="${style.fill}" stroke="${style.stroke}" stroke-width="2"/>`;
      break;
    case 'diamond':
      shapeSvg = `<polygon points="${half},2 ${size - 4},${half} ${half},${size - 2} 4,${half}" fill="${style.fill}" stroke="${style.stroke}" stroke-width="2"/>`;
      break;
    case 'square':
      shapeSvg = `<rect x="4" y="4" width="${size - 8}" height="${size - 8}" fill="${style.fill}" stroke="${style.stroke}" stroke-width="2"/>`;
      break;
    case 'quatrefoil':
      shapeSvg = `<circle cx="${half}" cy="${half}" r="${half - 4}" fill="${style.fill}" stroke="${style.stroke}" stroke-width="2"/>`;
      break;
    default:
      shapeSvg = `<circle cx="${half}" cy="${half}" r="${half - 4}" fill="${style.fill}" stroke="${style.stroke}" stroke-width="2"/>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${shapeSvg}
    <text x="${half}" y="${half + 4}" text-anchor="middle" font-size="12" font-family="monospace" font-weight="bold" fill="${style.stroke}">${icon}</text>
  </svg>`;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// Map GZM entity types to military affiliations
export function entityToAffiliation(entityType: string): Affiliation {
  const hostile = ['threat', 'adversary', 'hostile', 'enemy', 'target', 'drone_threat', 'emitter_hostile'];
  const friendly = ['own', 'friendly', 'allied', 'isr_asset', 'sensor'];
  const neutral = ['civilian', 'commercial', 'neutral', 'infrastructure'];

  const lower = entityType.toLowerCase();
  if (hostile.some(h => lower.includes(h))) return 'hostile';
  if (friendly.some(f => lower.includes(f))) return 'friendly';
  if (neutral.some(n => lower.includes(n))) return 'neutral';
  return 'unknown';
}

// Map GZM INT domains to dimensions
export function intDomainToDimension(domain: string): Dimension {
  switch (domain) {
    case 'SIGINT':
    case 'ELINT':
      return 'air';
    case 'GEOINT':
    case 'IMINT':
      return 'space';
    case 'CYBER':
    case 'INFO-OPS':
      return 'cyber';
    case 'MASINT':
    case 'HUMINT':
    case 'FINANCIAL':
    case 'OSINT':
    default:
      return 'ground';
  }
}

// Pre-generate all symbol combinations for IconLayer atlas
export function generateSymbolAtlas(): Record<string, string> {
  const atlas: Record<string, string> = {};
  const affiliations: Affiliation[] = ['friendly', 'hostile', 'neutral', 'unknown'];
  const dimensions: Dimension[] = ['ground', 'air', 'sea', 'space', 'cyber'];

  for (const aff of affiliations) {
    for (const dim of dimensions) {
      atlas[`${aff}-${dim}`] = generateMilSymbol(aff, dim);
    }
  }

  return atlas;
}
