/**
 * SEO Sitemap Validation Script
 *
 * Validates sitemap.xml structure and all URLs:
 * - XML structure validity
 * - Each URL returns 200 (not 404, not redirect)
 * - Each page has valid <title> tag
 * - Each page has <link rel="canonical"> matching URL
 * - No duplicate URLs
 * - lastmod dates are ISO format
 *
 * Run: npm run seo:sitemap
 */

import { parseStringPromise } from 'xml2js';
import { Logger } from '../logger';

export interface SitemapURLResult {
  url: string;
  statusCode: number | null;
  hasTitle: boolean;
  titleContent: string | null;
  hasCanonical: boolean;
  canonicalUrl: string | null;
  canonicalMatches: boolean;
  lastmod: string | null;
  lastmodValid: boolean;
  changefreq: string | null;
  priority: string | null;
  passed: boolean;
  errors: string[];
}

export interface SitemapValidationReport {
  timestamp: string;
  baseUrl: string;
  sitemapUrl: string;
  xmlValid: boolean;
  totalUrls: number;
  duplicateUrls: number;
  passed: number;
  failed: number;
  urlsByType: {
    homepage: number;
    services: number;
    serviceAreas: number;
    serviceLandings: number;
    campaignLandings: number;
    staticPages: number;
    blogPosts: number;
  };
  results: SitemapURLResult[];
  errors: string[];
}

/**
 * Expected URL counts
 */
const EXPECTED_COUNTS = {
  homepage: 1,
  services: 8,
  serviceAreas: 12,
  serviceLandings: 5,
  campaignLandings: 3,
  staticPages: 6, // blog, contact, referral, ai-booking, about, reviews, service-areas index
};

/**
 * Parse sitemap XML and extract URLs
 */
export async function parseSitemap(xml: string): Promise<Array<{
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}>> {
  try {
    const result = await parseStringPromise(xml);

    if (!result.urlset || !result.urlset.url) {
      throw new Error('Invalid sitemap structure: missing urlset or url elements');
    }

    return result.urlset.url.map((url: Record<string, string[]>) => ({
      loc: url.loc?.[0] || '',
      lastmod: url.lastmod?.[0],
      changefreq: url.changefreq?.[0],
      priority: url.priority?.[0],
    }));
  } catch (error) {
    throw new Error(`Failed to parse sitemap XML: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Validate ISO 8601 date format
 */
function isValidISODate(dateString: string): boolean {
  // Accept YYYY-MM-DD or full ISO datetime
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;
  if (!isoDateRegex.test(dateString)) return false;

  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Extract title from HTML
 */
function extractTitle(html: string): string | null {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : null;
}

/**
 * Extract canonical URL from HTML
 */
function extractCanonical(html: string): string | null {
  // Match <link rel="canonical" href="..."> in various formats
  const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i)
    || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["'][^>]*>/i);
  return canonicalMatch ? canonicalMatch[1] : null;
}

/**
 * Categorize URL by type
 */
function categorizeUrl(url: string): keyof typeof EXPECTED_COUNTS | 'blogPosts' | 'unknown' {
  const path = new URL(url).pathname;

  if (path === '/') return 'homepage';
  if (path.match(/^\/services\/[a-z-]+$/)) return 'services';
  if (path.match(/^\/service-areas\/[a-z-]+$/)) return 'serviceAreas';
  if (path === '/service-areas') return 'staticPages';
  if (path.match(/^\/service\/[a-z-]+-landing$/)) return 'serviceLandings';
  if (path.match(/^\/landing\/[a-z-]+$/)) return 'campaignLandings';
  if (path.match(/^\/blog\/[a-z0-9-]+$/)) return 'blogPosts';
  if (['/blog', '/contact', '/referral', '/ai-booking', '/about', '/reviews'].includes(path)) {
    return 'staticPages';
  }

  return 'unknown';
}

/**
 * Validate a single sitemap URL
 */
async function validateSitemapUrl(
  urlEntry: { loc: string; lastmod?: string; changefreq?: string; priority?: string }
): Promise<SitemapURLResult> {
  const result: SitemapURLResult = {
    url: urlEntry.loc,
    statusCode: null,
    hasTitle: false,
    titleContent: null,
    hasCanonical: false,
    canonicalUrl: null,
    canonicalMatches: false,
    lastmod: urlEntry.lastmod || null,
    lastmodValid: urlEntry.lastmod ? isValidISODate(urlEntry.lastmod) : true,
    changefreq: urlEntry.changefreq || null,
    priority: urlEntry.priority || null,
    passed: true,
    errors: [],
  };

  try {
    const response = await fetch(urlEntry.loc, {
      redirect: 'manual',
      headers: {
        'User-Agent': 'SEO-Validation-Bot/1.0',
      },
    });

    result.statusCode = response.status;

    // Check for redirects (should not happen for sitemap URLs)
    if (response.status >= 300 && response.status < 400) {
      result.passed = false;
      result.errors.push(`URL redirects (${response.status}), sitemap should contain final URLs`);
      return result;
    }

    // Check for 200 status
    if (response.status !== 200) {
      result.passed = false;
      result.errors.push(`URL returns ${response.status}, expected 200`);
      return result;
    }

    const html = await response.text();

    // Check for title tag
    result.titleContent = extractTitle(html);
    result.hasTitle = !!result.titleContent;
    if (!result.hasTitle) {
      result.passed = false;
      result.errors.push('Missing <title> tag');
    } else if (result.titleContent && result.titleContent.length < 10) {
      result.errors.push(`Title too short: "${result.titleContent}"`);
    }

    // Check for canonical tag
    result.canonicalUrl = extractCanonical(html);
    result.hasCanonical = !!result.canonicalUrl;

    if (!result.hasCanonical || !result.canonicalUrl) {
      result.passed = false;
      result.errors.push('Missing <link rel="canonical"> tag');
    } else {
      // Normalize URLs for comparison (remove trailing slashes)
      const normalizedCanonical = result.canonicalUrl.replace(/\/$/, '');
      const normalizedUrl = urlEntry.loc.replace(/\/$/, '');
      result.canonicalMatches = normalizedCanonical === normalizedUrl;

      if (!result.canonicalMatches) {
        result.passed = false;
        result.errors.push(`Canonical mismatch: page=${urlEntry.loc}, canonical=${result.canonicalUrl}`);
      }
    }

    // Check lastmod format
    if (urlEntry.lastmod && !result.lastmodValid) {
      result.errors.push(`Invalid lastmod format: ${urlEntry.lastmod}`);
    }
  } catch (error) {
    result.passed = false;
    result.errors.push(error instanceof Error ? error.message : String(error));
  }

  return result;
}

/**
 * Find duplicate URLs in sitemap
 */
function findDuplicates(urls: string[]): string[] {
  const seen = new Set<string>();
  const duplicates: string[] = [];

  for (const url of urls) {
    const normalized = url.replace(/\/$/, '').toLowerCase();
    if (seen.has(normalized)) {
      duplicates.push(url);
    }
    seen.add(normalized);
  }

  return duplicates;
}

/**
 * Run sitemap validation
 */
export async function validateSitemap(
  baseUrl: string = 'https://thejohnsonbros.com'
): Promise<SitemapValidationReport> {
  const sitemapUrl = `${baseUrl}/sitemap.xml`;
  const report: SitemapValidationReport = {
    timestamp: new Date().toISOString(),
    baseUrl,
    sitemapUrl,
    xmlValid: false,
    totalUrls: 0,
    duplicateUrls: 0,
    passed: 0,
    failed: 0,
    urlsByType: {
      homepage: 0,
      services: 0,
      serviceAreas: 0,
      serviceLandings: 0,
      campaignLandings: 0,
      staticPages: 0,
      blogPosts: 0,
    },
    results: [],
    errors: [],
  };

  Logger.info('Starting sitemap validation', { sitemapUrl });

  try {
    // Fetch sitemap
    const response = await fetch(sitemapUrl, {
      headers: {
        'User-Agent': 'SEO-Validation-Bot/1.0',
      },
    });

    if (!response.ok) {
      report.errors.push(`Failed to fetch sitemap: HTTP ${response.status}`);
      return report;
    }

    const xml = await response.text();

    // Parse sitemap
    let urls: Array<{ loc: string; lastmod?: string; changefreq?: string; priority?: string }>;
    try {
      urls = await parseSitemap(xml);
      report.xmlValid = true;
    } catch (error) {
      report.errors.push(error instanceof Error ? error.message : String(error));
      return report;
    }

    report.totalUrls = urls.length;

    // Check for duplicates
    const urlStrings = urls.map(u => u.loc);
    const duplicates = findDuplicates(urlStrings);
    report.duplicateUrls = duplicates.length;

    if (duplicates.length > 0) {
      report.errors.push(`Found ${duplicates.length} duplicate URLs: ${duplicates.join(', ')}`);
    }

    // Categorize URLs
    for (const url of urls) {
      const category = categorizeUrl(url.loc);
      if (category !== 'unknown' && category in report.urlsByType) {
        report.urlsByType[category as keyof typeof report.urlsByType]++;
      }
    }

    // Validate each URL
    for (const urlEntry of urls) {
      const result = await validateSitemapUrl(urlEntry);
      report.results.push(result);

      if (result.passed) {
        report.passed++;
      } else {
        report.failed++;
        Logger.warn(`Sitemap URL validation failed: ${urlEntry.loc}`, {
          errors: result.errors,
        });
      }
    }

    // Check expected counts
    Logger.info('URL counts by type', report.urlsByType);
  } catch (error) {
    report.errors.push(error instanceof Error ? error.message : String(error));
  }

  Logger.info('Sitemap validation complete', {
    totalUrls: report.totalUrls,
    passed: report.passed,
    failed: report.failed,
    duplicates: report.duplicateUrls,
  });

  return report;
}

/**
 * Get expected URL counts for reference
 */
export function getExpectedCounts(): typeof EXPECTED_COUNTS {
  return EXPECTED_COUNTS;
}

// CLI execution
if (import.meta.url.endsWith(process.argv[1]?.replace(/^file:\/\//, '') || '')) {
  const baseUrl = process.env.BASE_URL || 'https://thejohnsonbros.com';

  validateSitemap(baseUrl)
    .then(report => {
      console.log(JSON.stringify(report, null, 2));

      const hasFailures = report.failed > 0 || report.errors.length > 0 || report.duplicateUrls > 0;

      if (hasFailures) {
        console.error('\nSitemap validation issues:');
        if (report.failed > 0) {
          console.error(`  - ${report.failed} URL(s) failed validation`);
        }
        if (report.duplicateUrls > 0) {
          console.error(`  - ${report.duplicateUrls} duplicate URL(s) found`);
        }
        if (report.errors.length > 0) {
          console.error(`  - ${report.errors.length} error(s): ${report.errors.join(', ')}`);
        }
        process.exit(1);
      }

      console.log(`\nSitemap validation passed: ${report.totalUrls} URLs validated`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Sitemap validation failed:', error);
      process.exit(1);
    });
}
