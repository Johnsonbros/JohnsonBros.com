/**
 * Service Area Adjacency Map
 *
 * Defines geographically accurate neighboring towns for internal linking.
 * Only includes towns that have pages in /service-areas/
 */

export interface NearbyTown {
  name: string;
  slug: string;
}

// All valid service area slugs (towns with pages)
export const VALID_SERVICE_AREAS = [
  'abington', 'braintree', 'canton', 'cohasset', 'duxbury',
  'east-bridgewater', 'halifax', 'hanover', 'hanson', 'hingham',
  'holbrook', 'hull', 'kingston', 'marshfield', 'milton',
  'norwell', 'pembroke', 'plymouth', 'quincy', 'randolph',
  'rockland', 'scituate', 'stoughton', 'weymouth', 'whitman'
] as const;

export type ServiceAreaSlug = typeof VALID_SERVICE_AREAS[number];

// Geographic adjacency map - only links to pages that exist
export const SERVICE_AREA_NEIGHBORS: Record<ServiceAreaSlug, string[]> = {
  quincy: ['Braintree', 'Weymouth', 'Milton', 'Randolph', 'Hull', 'Hingham'],
  milton: ['Quincy', 'Braintree', 'Randolph', 'Canton', 'Weymouth', 'Stoughton'],
  braintree: ['Quincy', 'Weymouth', 'Randolph', 'Holbrook', 'Milton', 'Hingham'],
  randolph: ['Quincy', 'Braintree', 'Holbrook', 'Stoughton', 'Canton', 'Milton'],
  weymouth: ['Quincy', 'Braintree', 'Hingham', 'Rockland', 'Abington', 'Holbrook'],
  holbrook: ['Braintree', 'Randolph', 'Abington', 'Weymouth', 'Rockland', 'Stoughton'],
  stoughton: ['Canton', 'Randolph', 'Holbrook', 'Abington', 'Whitman', 'Braintree'],
  canton: ['Milton', 'Randolph', 'Stoughton', 'Holbrook', 'Braintree', 'Norwell'],
  abington: ['Weymouth', 'Rockland', 'Whitman', 'Holbrook', 'Hanson', 'Braintree'],
  rockland: ['Weymouth', 'Abington', 'Hanover', 'Norwell', 'Hingham', 'Whitman'],
  hingham: ['Weymouth', 'Cohasset', 'Hull', 'Scituate', 'Norwell', 'Rockland'],
  hull: ['Hingham', 'Cohasset', 'Quincy', 'Weymouth', 'Scituate', 'Marshfield'],
  cohasset: ['Hingham', 'Scituate', 'Hull', 'Norwell', 'Marshfield', 'Weymouth'],
  scituate: ['Cohasset', 'Hingham', 'Marshfield', 'Norwell', 'Hull', 'Duxbury'],
  norwell: ['Hingham', 'Rockland', 'Hanover', 'Scituate', 'Marshfield', 'Pembroke'],
  hanover: ['Rockland', 'Norwell', 'Pembroke', 'Hanson', 'Whitman', 'Marshfield'],
  whitman: ['Abington', 'Rockland', 'Hanson', 'Halifax', 'East Bridgewater', 'Hanover'],
  hanson: ['Whitman', 'Halifax', 'Pembroke', 'Hanover', 'Rockland', 'East Bridgewater'],
  halifax: ['Whitman', 'Hanson', 'Pembroke', 'Kingston', 'East Bridgewater', 'Duxbury'],
  'east-bridgewater': ['Whitman', 'Hanson', 'Halifax', 'Rockland', 'Abington', 'Kingston'],
  pembroke: ['Hanson', 'Marshfield', 'Duxbury', 'Kingston', 'Halifax', 'Hanover'],
  marshfield: ['Scituate', 'Norwell', 'Pembroke', 'Duxbury', 'Hanover', 'Cohasset'],
  duxbury: ['Marshfield', 'Kingston', 'Plymouth', 'Pembroke', 'Scituate', 'Halifax'],
  kingston: ['Duxbury', 'Plymouth', 'Halifax', 'Pembroke', 'Marshfield', 'Hanson'],
  plymouth: ['Kingston', 'Duxbury', 'Marshfield', 'Pembroke', 'Halifax', 'Scituate'],
};

/**
 * Get nearby towns for a service area
 * @param slug The service area slug (e.g., 'quincy', 'east-bridgewater')
 * @returns Array of nearby town objects with name and slug
 */
export function getNearbyTowns(slug: ServiceAreaSlug): NearbyTown[] {
  const neighbors = SERVICE_AREA_NEIGHBORS[slug] || [];
  return neighbors.map(name => ({
    name,
    slug: name.toLowerCase().replace(/ /g, '-'),
  }));
}

/**
 * Component-ready array for mapping
 * @param slug The service area slug
 * @returns Array of town names for use in JSX mapping
 */
export function getNearbyTownNames(slug: ServiceAreaSlug): string[] {
  return SERVICE_AREA_NEIGHBORS[slug] || [];
}
