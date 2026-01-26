/**
 * SEO Migration Redirects
 *
 * Server-side 301 redirects for old WordPress URLs to new React app URLs.
 * Critical for preserving SEO rankings and backlink equity during migration.
 *
 * See: documents/SEO_MIGRATION_STRATEGY.md for full mapping documentation.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Static redirect mapping from old WordPress URLs to new URLs
 * All redirects are permanent (301) to preserve SEO value
 */
const SEO_REDIRECTS: Record<string, string> = {
  // ============================================
  // HOMEPAGE VARIATIONS
  // ============================================
  '/index.html': '/',
  '/index.php': '/',
  '/home': '/',

  // ============================================
  // ABOUT PAGE VARIATIONS
  // ============================================
  '/about-us': '/about',
  '/about-us/': '/about',
  '/company': '/about',
  '/our-team': '/about',
  '/meet-the-team': '/about',

  // ============================================
  // CONTACT PAGE VARIATIONS
  // ============================================
  '/contact-us': '/contact',
  '/contact-us/': '/contact',
  '/get-in-touch': '/contact',
  '/request-service': '/contact',
  '/schedule-service': '/contact',

  // ============================================
  // SERVICE PAGES - WordPress patterns
  // ============================================
  '/services': '/services/general-plumbing',
  '/services/': '/services/general-plumbing',
  '/plumbing-services': '/services/general-plumbing',
  '/our-services': '/services/general-plumbing',

  // Drain Cleaning variations
  '/drain-cleaning': '/services/drain-cleaning',
  '/drain-cleaning/': '/services/drain-cleaning',
  '/drain-cleaning-service': '/services/drain-cleaning',
  '/clogged-drain': '/services/drain-cleaning',
  '/slow-drain': '/services/drain-cleaning',
  '/drain-unclogging': '/services/drain-cleaning',
  '/sewer-cleaning': '/services/drain-cleaning',

  // Emergency Plumbing variations
  '/emergency-plumber': '/services/emergency-plumbing',
  '/emergency-plumbing': '/services/emergency-plumbing',
  '/24-hour-plumber': '/services/emergency-plumbing',
  '/24-7-plumber': '/services/emergency-plumbing',
  '/emergency-service': '/services/emergency-plumbing',
  '/plumbing-emergency': '/services/emergency-plumbing',

  // Water Heater variations
  '/water-heater-repair': '/services/water-heater',
  '/water-heater-installation': '/services/water-heater',
  '/water-heater-replacement': '/services/water-heater',
  '/hot-water-heater': '/services/water-heater',
  '/tankless-water-heater': '/services/water-heater',
  '/water-heater-service': '/services/water-heater',
  '/no-hot-water': '/services/water-heater',

  // Pipe Repair variations
  '/pipe-repair': '/services/pipe-repair',
  '/pipe-replacement': '/services/pipe-repair',
  '/burst-pipe': '/services/pipe-repair',
  '/burst-pipe-repair': '/services/pipe-repair',
  '/leak-repair': '/services/pipe-repair',
  '/leak-detection': '/services/pipe-repair',
  '/frozen-pipes': '/services/pipe-repair',
  '/repiping': '/services/pipe-repair',

  // Gas/Heating variations
  '/gas-plumber': '/services/gas-heat',
  '/gas-line-repair': '/services/gas-heat',
  '/gas-line-installation': '/services/gas-heat',
  '/gas-plumbing': '/services/gas-heat',
  '/heating-services': '/services/heating',
  '/boiler-repair': '/services/heating',

  // New Construction variations
  '/new-construction-plumbing': '/services/new-construction',
  '/commercial-plumbing': '/services/new-construction',
  '/residential-plumbing': '/services/general-plumbing',

  // ============================================
  // SERVICE AREA PAGE VARIATIONS
  // ============================================
  '/areas-we-serve': '/service-areas',
  '/service-area': '/service-areas',
  '/service-areas/': '/service-areas',
  '/locations': '/service-areas',
  '/coverage-area': '/service-areas',

  // City-specific keyword patterns (plumber-city format)
  '/quincy-plumber': '/service-areas/quincy',
  '/plumber-quincy': '/service-areas/quincy',
  '/plumber-quincy-ma': '/service-areas/quincy',
  '/quincy-ma-plumber': '/service-areas/quincy',

  '/braintree-plumber': '/service-areas/braintree',
  '/plumber-braintree': '/service-areas/braintree',
  '/plumber-braintree-ma': '/service-areas/braintree',

  '/weymouth-plumber': '/service-areas/weymouth',
  '/plumber-weymouth': '/service-areas/weymouth',
  '/plumber-weymouth-ma': '/service-areas/weymouth',

  '/hingham-plumber': '/service-areas/hingham',
  '/plumber-hingham': '/service-areas/hingham',

  '/plymouth-plumber': '/service-areas/plymouth',
  '/plumber-plymouth': '/service-areas/plymouth',

  '/marshfield-plumber': '/service-areas/marshfield',
  '/plumber-marshfield': '/service-areas/marshfield',

  '/abington-plumber': '/service-areas/abington',
  '/plumber-abington': '/service-areas/abington',

  '/rockland-plumber': '/service-areas/rockland',
  '/plumber-rockland': '/service-areas/rockland',

  '/hanover-plumber': '/service-areas/hanover',
  '/plumber-hanover': '/service-areas/hanover',

  '/scituate-plumber': '/service-areas/scituate',
  '/plumber-scituate': '/service-areas/scituate',

  '/cohasset-plumber': '/service-areas/cohasset',
  '/plumber-cohasset': '/service-areas/cohasset',

  '/hull-plumber': '/service-areas/hull',
  '/plumber-hull': '/service-areas/hull',

  '/milton-plumber': '/service-areas/milton',
  '/plumber-milton': '/service-areas/milton',

  '/randolph-plumber': '/service-areas/randolph',
  '/plumber-randolph': '/service-areas/randolph',

  '/holbrook-plumber': '/service-areas/holbrook',
  '/plumber-holbrook': '/service-areas/holbrook',

  '/canton-plumber': '/service-areas/canton',
  '/plumber-canton': '/service-areas/canton',

  '/stoughton-plumber': '/service-areas/stoughton',
  '/plumber-stoughton': '/service-areas/stoughton',

  '/norwell-plumber': '/service-areas/norwell',
  '/plumber-norwell': '/service-areas/norwell',

  '/pembroke-plumber': '/service-areas/pembroke',
  '/plumber-pembroke': '/service-areas/pembroke',

  '/duxbury-plumber': '/service-areas/duxbury',
  '/plumber-duxbury': '/service-areas/duxbury',

  '/kingston-plumber': '/service-areas/kingston',
  '/plumber-kingston': '/service-areas/kingston',

  '/halifax-plumber': '/service-areas/halifax',
  '/plumber-halifax': '/service-areas/halifax',

  '/hanson-plumber': '/service-areas/hanson',
  '/plumber-hanson': '/service-areas/hanson',

  '/whitman-plumber': '/service-areas/whitman',
  '/plumber-whitman': '/service-areas/whitman',

  '/east-bridgewater-plumber': '/service-areas/east-bridgewater',
  '/plumber-east-bridgewater': '/service-areas/east-bridgewater',

  // ============================================
  // REVIEW & TESTIMONIAL VARIATIONS
  // ============================================
  '/testimonials': '/reviews',
  '/testimonials/': '/reviews',
  '/customer-reviews': '/reviews',
  '/our-reviews': '/reviews',
  '/feedback': '/reviews',

  // ============================================
  // REFERRAL PROGRAM VARIATIONS
  // ============================================
  '/refer-a-friend': '/referral',
  '/referral-program': '/referral',
  '/refer': '/referral',

  // ============================================
  // BLOG VARIATIONS
  // ============================================
  '/news': '/blog',
  '/articles': '/blog',
  '/tips': '/blog',
  '/plumbing-tips': '/blog',
  '/plumbing-blog': '/blog',

  // ============================================
  // MISC PAGE VARIATIONS
  // ============================================
  '/faq': '/#faq',
  '/faqs': '/#faq',
  '/frequently-asked-questions': '/#faq',
  '/pricing': '/#booking',
  '/rates': '/#booking',
  '/book-online': '/#booking',
  '/appointment': '/#booking',
  '/schedule': '/#booking',
  '/privacy': '/privacy-policy',
  '/terms': '/terms-of-service',
};

/**
 * Middleware to handle SEO redirects
 * Processes incoming URLs and redirects old patterns to new URLs
 */
export function seoRedirectMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Normalize path: lowercase, remove trailing slash (except for root)
  let path = req.path.toLowerCase();
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }

  // Check for direct redirect match
  const redirectTo = SEO_REDIRECTS[path];
  if (redirectTo) {
    // Log redirect for monitoring
    console.log(`[SEO Redirect] 301: ${req.path} -> ${redirectTo}`);
    res.redirect(301, redirectTo);
    return;
  }

  // Handle WordPress-style service area URLs: /service-area/{city} -> /service-areas/{city}
  const serviceAreaMatch = path.match(/^\/service-area\/([a-z-]+)$/);
  if (serviceAreaMatch) {
    const city = serviceAreaMatch[1];
    const redirectTo = `/service-areas/${city}`;
    console.log(`[SEO Redirect] 301: ${req.path} -> ${redirectTo}`);
    res.redirect(301, redirectTo);
    return;
  }

  // Handle WordPress blog post patterns: /blog/{slug}/ -> /blog/{slug}
  const blogPostMatch = path.match(/^\/blog\/([a-z0-9-]+)\/$/);
  if (blogPostMatch) {
    const slug = blogPostMatch[1];
    const redirectTo = `/blog/${slug}`;
    console.log(`[SEO Redirect] 301: ${req.path} -> ${redirectTo}`);
    res.redirect(301, redirectTo);
    return;
  }

  // Handle WordPress category patterns
  const categoryMatch = path.match(/^\/category\/([a-z-]+)$/);
  if (categoryMatch) {
    // Redirect category pages to blog
    console.log(`[SEO Redirect] 301: ${req.path} -> /blog`);
    res.redirect(301, '/blog');
    return;
  }

  // Handle WordPress tag patterns
  const tagMatch = path.match(/^\/tag\/([a-z-]+)$/);
  if (tagMatch) {
    // Redirect tag pages to blog
    console.log(`[SEO Redirect] 301: ${req.path} -> /blog`);
    res.redirect(301, '/blog');
    return;
  }

  // No redirect needed, continue to next middleware
  next();
}

/**
 * Get all redirect mappings for testing/verification
 */
export function getRedirectMap(): Record<string, string> {
  return { ...SEO_REDIRECTS };
}

/**
 * Get redirect count for monitoring
 */
export function getRedirectCount(): number {
  return Object.keys(SEO_REDIRECTS).length;
}
