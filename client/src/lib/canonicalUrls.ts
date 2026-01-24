/**
 * Canonical URL Mapping for SEO Migration
 *
 * Maps legacy WordPress URLs to their canonical (new) equivalents.
 * This prevents duplicate content penalties when both old and new URLs
 * are indexed by search engines.
 *
 * DO NOT REMOVE until 90+ days after migration when legacy routes are removed.
 */

const SITE_URL = 'https://thejohnsonbros.com';

/**
 * Maps legacy WordPress paths to canonical paths
 * Legacy paths should NOT have trailing slashes in the keys
 */
export const LEGACY_TO_CANONICAL: Record<string, string> = {
  // About/Contact
  '/about-us': '/about',
  '/about-us/about-me': '/about',
  '/about-us/our-team': '/about',
  '/about-us/location': '/contact',
  '/about-us/get-quote': '/ai-booking',

  // Booking
  '/book-service': '/ai-booking',
  '/booking': '/ai-booking',
  '/zeke': '/ai-booking',

  // Blog
  '/category/blog': '/blog',
  '/check-in/blog-grid': '/blog',

  // Plumbing Services
  '/plumbing': '/services/general-plumbing',
  '/service': '/services/general-plumbing',
  '/service-2': '/services/general-plumbing',
  '/plumbing/toilet-repair-install-quincy-ma': '/services/general-plumbing',
  '/plumbing/symmons-shower-valve-installation-repair-quincy-ma': '/services/general-plumbing',
  '/plumbing/dishwasher-installation-quincy': '/services/general-plumbing',
  '/plumbing/shower-tub-repair-installation': '/services/general-plumbing',
  '/plumbing/faucet-repair-installation-quincy-ma': '/services/general-plumbing',
  '/plumbing/garbage-disposal-repair-installation-quincy-ma': '/services/general-plumbing',
  '/plumbing/plumbing-inspection-quincy-ma': '/services/general-plumbing',
  '/plumbing/streamlabs-massachusetts-installer': '/services/general-plumbing',
  '/plumbing/repiping-services-quincy-ma': '/services/pipe-repair',

  // Heating Services
  '/heating': '/services/heating',
  '/heating/water-heater-replacement-services-quincy-ma': '/services/water-heater',
  '/heating/tankless-water-heater-installation-quincy-ma': '/services/water-heater',
  '/heating/tankless-boiler-quincy-ma': '/services/heating',
  '/heating/furnace-replacement-quincy-ma': '/services/heating',
  '/heating/furnace-repair-quincy-ma-reliable-heating-services-near-you': '/services/heating',
  '/heating/heat-pump-installation-quincy-ma': '/services/heating',
  '/heating/viessmann-boiler-repair-quincy-ma-reliable-heating-services': '/services/heating',

  // Drain Cleaning
  '/drain-cleaning-quincy-ma': '/services/drain-cleaning',
  '/drain-cleaning-quincy-ma/toilet-clog': '/services/drain-cleaning',
  '/drain-cleaning-quincy-ma/tub-shower-drain-clog': '/services/drain-cleaning',
  '/drain-cleaning-quincy-ma/drain-camera-inspection-quincy-ma': '/services/drain-cleaning',
  '/drain-cleaning-quincy-ma/unclog-bathroom-sink-quincy-ma': '/services/drain-cleaning',
  '/main-drain-clog-quincy-ma': '/services/drain-cleaning',
  '/bathroom-drain-clog-quincy': '/services/drain-cleaning',
  '/kitchen-drain-clog-quincy-ma': '/services/drain-cleaning',

  // Emergency Plumbing
  '/emergency-plumbing-quincy-ma': '/services/emergency-plumbing',
  '/emergency-plumbing-quincy-ma/gas-leak-quincy': '/services/emergency-plumbing',
  '/emergency-plumbing-quincy-ma/frozen-pipes': '/services/emergency-plumbing',
  '/emergency-plumbing-quincy-ma/no-hot-water': '/services/emergency-plumbing',
  '/emergency-plumbing-quincy-ma/no-heat': '/services/emergency-plumbing',
  '/emergency-plumbing-quincy-ma/drain-clog-emergencies': '/services/emergency-plumbing',

  // New Construction
  '/new-construction': '/services/new-construction',
  '/new-construction/residential-new-construction': '/services/new-construction',
  '/new-construction/commercial-new-construction': '/services/new-construction',

  // Service Areas (Abington legacy long-form URLs)
  '/service-areas/plumber-in-abington-ma-trusted-local-plumbing-drain-cleaning-services': '/service-areas/abington',
  '/service-areas/plumber-in-abington-ma-trusted-local-plumbing-drain-cleaning-services/drain-cleaning-abington-ma': '/service-areas/abington',
  '/service-areas/plumber-in-abington-ma-trusted-local-plumbing-drain-cleaning-services/abington-emergency-plumbing': '/service-areas/abington',
  '/service-areas/plumber-in-abington-ma-trusted-local-plumbing-drain-cleaning-services/abington-plumber': '/service-areas/abington',

  // Membership
  '/plumbing-membership-program-quincy-ma': '/family-discount',

  // Reviews
  '/yelp': '/reviews',

  // Other
  '/privacy': '/about',
  '/terms-of-service': '/about',
  '/career': '/about',
  '/open-job-positions': '/about',
  '/newsletter': '/',
};

/**
 * Get the canonical URL for a given path
 * @param path - The current URL path (with or without trailing slash)
 * @returns The full canonical URL
 */
export function getCanonicalUrl(path: string): string {
  // Normalize path: remove trailing slash for lookup
  const normalizedPath = path.endsWith('/') && path !== '/'
    ? path.slice(0, -1)
    : path;

  // Check if this is a legacy URL that needs canonical redirect
  const canonicalPath = LEGACY_TO_CANONICAL[normalizedPath] || normalizedPath;

  return `${SITE_URL}${canonicalPath}`;
}

/**
 * Check if a path is a legacy WordPress URL
 */
export function isLegacyUrl(path: string): boolean {
  const normalizedPath = path.endsWith('/') && path !== '/'
    ? path.slice(0, -1)
    : path;
  return normalizedPath in LEGACY_TO_CANONICAL;
}

/**
 * Get just the canonical path (without domain)
 */
export function getCanonicalPath(path: string): string {
  const normalizedPath = path.endsWith('/') && path !== '/'
    ? path.slice(0, -1)
    : path;
  return LEGACY_TO_CANONICAL[normalizedPath] || normalizedPath;
}
