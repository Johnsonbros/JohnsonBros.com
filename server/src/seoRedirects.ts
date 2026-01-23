/**
 * SEO Migration Redirect Middleware
 *
 * Handles 301 redirects from old URL patterns to new URL structure.
 * Critical for preserving SEO equity during website migration.
 *
 * @see SEO_MIGRATION_STRATEGY.md for full documentation
 */

import { Request, Response, NextFunction } from 'express';
import { Logger } from './logger';

const logger = new Logger({ component: 'seo-redirects' });

/**
 * Static URL redirect mappings
 * Maps old WordPress URLs to new React app URLs
 */
const STATIC_REDIRECTS: Record<string, string> = {
  // Homepage variations
  '/index.html': '/',
  '/index.php': '/',
  '/home': '/',
  '/home/': '/',

  // About page variations
  '/about-us': '/about',
  '/about-us/': '/about',
  '/company': '/about',
  '/company/': '/about',
  '/our-story': '/about',
  '/our-team': '/about',

  // Contact variations
  '/contact-us': '/contact',
  '/contact-us/': '/contact',
  '/get-in-touch': '/contact',
  '/get-quote': '/contact',
  '/free-estimate': '/contact',

  // Service index page
  '/services': '/services/general-plumbing',
  '/services/': '/services/general-plumbing',
  '/plumbing-services': '/services/general-plumbing',
  '/our-services': '/services/general-plumbing',

  // Drain cleaning variations
  '/drain-cleaning': '/services/drain-cleaning',
  '/drain-cleaning/': '/services/drain-cleaning',
  '/drain-cleaning-service': '/services/drain-cleaning',
  '/clogged-drain': '/services/drain-cleaning',
  '/sewer-cleaning': '/services/drain-cleaning',
  '/hydro-jetting': '/services/drain-cleaning',

  // Emergency plumbing variations
  '/emergency-plumber': '/services/emergency-plumbing',
  '/emergency-plumber/': '/services/emergency-plumbing',
  '/emergency-plumbing': '/services/emergency-plumbing',
  '/24-hour-plumber': '/services/emergency-plumbing',
  '/24-7-plumber': '/services/emergency-plumbing',
  '/after-hours-plumber': '/services/emergency-plumbing',
  '/urgent-plumbing': '/services/emergency-plumbing',

  // Water heater variations
  '/water-heater': '/services/water-heater',
  '/water-heater/': '/services/water-heater',
  '/water-heater-repair': '/services/water-heater',
  '/water-heater-installation': '/services/water-heater',
  '/water-heater-replacement': '/services/water-heater',
  '/tankless-water-heater': '/services/water-heater',
  '/hot-water-heater': '/services/water-heater',

  // Pipe repair variations
  '/pipe-repair': '/services/pipe-repair',
  '/pipe-repair/': '/services/pipe-repair',
  '/pipe-replacement': '/services/pipe-repair',
  '/burst-pipe-repair': '/services/pipe-repair',
  '/leaky-pipe': '/services/pipe-repair',
  '/repiping': '/services/pipe-repair',

  // Gas heat variations
  '/gas-plumber': '/services/gas-heat',
  '/gas-plumber/': '/services/gas-heat',
  '/gas-line-repair': '/services/gas-heat',
  '/gas-line-installation': '/services/gas-heat',
  '/gas-fitting': '/services/gas-heat',
  '/heating-services': '/services/heating',
  '/boiler-repair': '/services/gas-heat',

  // New construction variations
  '/new-construction': '/services/new-construction',
  '/new-construction/': '/services/new-construction',
  '/construction-plumbing': '/services/new-construction',
  '/commercial-plumbing': '/services/new-construction',
  '/rough-in-plumbing': '/services/new-construction',

  // Service area index
  '/areas-we-serve': '/service-areas',
  '/areas-we-serve/': '/service-areas',
  '/service-area': '/service-areas',
  '/locations': '/service-areas',
  '/coverage-area': '/service-areas',
  '/where-we-work': '/service-areas',

  // Quincy variations (primary market)
  '/quincy-plumber': '/service-areas/quincy',
  '/plumber-quincy': '/service-areas/quincy',
  '/plumber-quincy-ma': '/service-areas/quincy',
  '/quincy-ma-plumber': '/service-areas/quincy',
  '/plumbing-quincy': '/service-areas/quincy',

  // Braintree variations
  '/braintree-plumber': '/service-areas/braintree',
  '/plumber-braintree': '/service-areas/braintree',
  '/plumber-braintree-ma': '/service-areas/braintree',

  // Weymouth variations
  '/weymouth-plumber': '/service-areas/weymouth',
  '/plumber-weymouth': '/service-areas/weymouth',
  '/plumber-weymouth-ma': '/service-areas/weymouth',

  // Hingham variations
  '/hingham-plumber': '/service-areas/hingham',
  '/plumber-hingham': '/service-areas/hingham',
  '/plumber-hingham-ma': '/service-areas/hingham',

  // Abington variations
  '/abington-plumber': '/service-areas/abington',
  '/plumber-abington': '/service-areas/abington',
  '/plumber-abington-ma': '/service-areas/abington',

  // Review/testimonial variations
  '/testimonials': '/reviews',
  '/testimonials/': '/reviews',
  '/customer-reviews': '/reviews',
  '/google-reviews': '/reviews',
  '/what-customers-say': '/reviews',

  // Referral variations
  '/refer-a-friend': '/referral',
  '/refer-a-friend/': '/referral',
  '/referral-program': '/referral',
  '/customer-referral': '/referral',

  // Blog variations
  '/news': '/blog',
  '/news/': '/blog',
  '/articles': '/blog',
  '/plumbing-tips': '/blog',
  '/plumbing-blog': '/blog',

  // WordPress specific patterns
  '/wp-admin': '/admin/login',
  '/wp-login.php': '/admin/login',
  '/feed': '/blog',
  '/feed/': '/blog',
};

/**
 * Pattern-based redirects for dynamic URLs
 */
interface PatternRedirect {
  pattern: RegExp;
  replacement: string | ((match: RegExpMatchArray) => string);
}

const PATTERN_REDIRECTS: PatternRedirect[] = [
  // WordPress service-area pattern: /service-area/city/ -> /service-areas/city
  {
    pattern: /^\/service-area\/([a-z-]+)\/?$/i,
    replacement: (_match) => `/service-areas/${_match[1].toLowerCase()}`,
  },

  // WordPress services pattern: /services/service-name/ -> /services/service-name
  {
    pattern: /^\/services\/([a-z-]+)\/$/i,
    replacement: (_match) => `/services/${_match[1].toLowerCase()}`,
  },

  // Blog post pattern: preserve slug
  {
    pattern: /^\/blog\/([a-z0-9-]+)\/$/i,
    replacement: (_match) => `/blog/${_match[1]}`,
  },

  // Category pattern: /category/plumbing-tips/ -> /blog
  {
    pattern: /^\/category\/[a-z-]+\/?$/i,
    replacement: '/blog',
  },

  // Tag pattern: /tag/emergency/ -> /blog
  {
    pattern: /^\/tag\/[a-z-]+\/?$/i,
    replacement: '/blog',
  },

  // Author pattern: /author/johnson-bros/ -> /about
  {
    pattern: /^\/author\/[a-z-]+\/?$/i,
    replacement: '/about',
  },

  // Year/month archive pattern: /2024/01/ -> /blog
  {
    pattern: /^\/\d{4}\/\d{2}\/?$/i,
    replacement: '/blog',
  },

  // City + service pattern: /quincy-drain-cleaning/ -> /service-areas/quincy
  {
    pattern: /^\/([a-z]+)-(drain-cleaning|plumber|plumbing|water-heater|emergency)\/?$/i,
    replacement: (_match) => `/service-areas/${_match[1].toLowerCase()}`,
  },

  // WordPress page with trailing slash
  {
    pattern: /^(\/[a-z0-9-]+)\/$/i,
    replacement: (_match) => _match[1],
  },
];

/**
 * Middleware to handle SEO redirects
 * Implements 301 (permanent) redirects for all known URL patterns
 */
export function seoRedirectMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Normalize path: lowercase and remove trailing slash (except for root)
  let path = req.path.toLowerCase();

  // Skip API routes, admin routes, and static assets
  if (
    path.startsWith('/api/') ||
    path.startsWith('/admin/') ||
    path.startsWith('/assets/') ||
    path.startsWith('/_next/') ||
    path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/i)
  ) {
    next();
    return;
  }

  // Check static redirects first (most common)
  const pathWithoutTrailingSlash = path.replace(/\/$/, '') || '/';
  const pathWithTrailingSlash = path.endsWith('/') ? path : `${path}/`;

  // Try exact match
  if (STATIC_REDIRECTS[pathWithoutTrailingSlash]) {
    const targetUrl = STATIC_REDIRECTS[pathWithoutTrailingSlash];
    logger.info(`301 Redirect: ${req.originalUrl} -> ${targetUrl}`);
    res.redirect(301, targetUrl);
    return;
  }

  // Try with trailing slash
  if (STATIC_REDIRECTS[pathWithTrailingSlash]) {
    const targetUrl = STATIC_REDIRECTS[pathWithTrailingSlash];
    logger.info(`301 Redirect: ${req.originalUrl} -> ${targetUrl}`);
    res.redirect(301, targetUrl);
    return;
  }

  // Check pattern-based redirects
  for (const redirect of PATTERN_REDIRECTS) {
    const match = path.match(redirect.pattern);
    if (match) {
      const targetUrl = typeof redirect.replacement === 'function'
        ? redirect.replacement(match)
        : redirect.replacement;

      logger.info(`301 Redirect (pattern): ${req.originalUrl} -> ${targetUrl}`);
      res.redirect(301, targetUrl);
      return;
    }
  }

  // Remove trailing slash for consistency (except root)
  if (path !== '/' && path.endsWith('/')) {
    const cleanPath = path.slice(0, -1);
    // Preserve query string
    const queryString = req.originalUrl.includes('?')
      ? req.originalUrl.substring(req.originalUrl.indexOf('?'))
      : '';

    logger.debug(`Removing trailing slash: ${path} -> ${cleanPath}`);
    res.redirect(301, `${cleanPath}${queryString}`);
    return;
  }

  next();
}

/**
 * Export redirect map for sitemap generation
 * These URLs should be included in sitemap with redirects noted
 */
export function getRedirectMap(): Record<string, string> {
  return { ...STATIC_REDIRECTS };
}

/**
 * Validate that all target URLs exist in the application
 * Call during startup to catch configuration errors
 */
export function validateRedirects(validPaths: string[]): string[] {
  const errors: string[] = [];
  const validPathSet = new Set(validPaths.map(p => p.toLowerCase()));

  for (const [source, target] of Object.entries(STATIC_REDIRECTS)) {
    const normalizedTarget = target.toLowerCase();

    // Skip validation for dynamic routes (contain parameters)
    if (normalizedTarget.includes(':')) continue;

    if (!validPathSet.has(normalizedTarget)) {
      errors.push(`Redirect target not found: ${source} -> ${target}`);
    }
  }

  return errors;
}

export default seoRedirectMiddleware;
