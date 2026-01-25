/**
 * SEO Redirect Validation Script
 *
 * Validates all redirect mappings to ensure:
 * - Response is 301 (permanent redirect)
 * - Location header points to correct new URL
 * - Target URL returns 200
 *
 * Run: npm run seo:redirects
 */

import { getRedirectMap } from '../seoRedirects';
import { Logger } from '../logger';

export interface RedirectValidationResult {
  source: string;
  expectedTarget: string;
  actualTarget: string | null;
  statusCode: number | null;
  targetStatusCode: number | null;
  passed: boolean;
  error?: string;
}

export interface RedirectValidationReport {
  timestamp: string;
  baseUrl: string;
  totalRedirects: number;
  passed: number;
  failed: number;
  results: RedirectValidationResult[];
}

/**
 * Pattern-based redirect test cases
 * These test the dynamic redirect patterns in seoRedirects.ts
 */
const PATTERN_TEST_CASES: Array<{ source: string; expectedTarget: string }> = [
  // WordPress service-area pattern
  { source: '/service-area/quincy/', expectedTarget: '/service-areas/quincy' },
  { source: '/service-area/braintree/', expectedTarget: '/service-areas/braintree' },

  // Blog post pattern with trailing slash
  { source: '/blog/plumbing-tips/', expectedTarget: '/blog/plumbing-tips' },

  // Category pattern
  { source: '/category/emergency/', expectedTarget: '/blog' },
  { source: '/category/plumbing-tips/', expectedTarget: '/blog' },

  // Tag pattern
  { source: '/tag/emergency/', expectedTarget: '/blog' },

  // Year/month archive pattern
  { source: '/2024/01/', expectedTarget: '/blog' },
  { source: '/2023/12/', expectedTarget: '/blog' },

  // City + service pattern
  { source: '/quincy-drain-cleaning/', expectedTarget: '/service-areas/quincy' },
  { source: '/braintree-plumber/', expectedTarget: '/service-areas/braintree' },
  { source: '/weymouth-water-heater/', expectedTarget: '/service-areas/weymouth' },

  // Author pattern
  { source: '/author/johnson-bros/', expectedTarget: '/about' },

  // Trailing slash normalization
  { source: '/about/', expectedTarget: '/about' },
  { source: '/contact/', expectedTarget: '/contact' },
];

/**
 * Validate a single redirect
 */
async function validateRedirect(
  baseUrl: string,
  source: string,
  expectedTarget: string
): Promise<RedirectValidationResult> {
  const result: RedirectValidationResult = {
    source,
    expectedTarget,
    actualTarget: null,
    statusCode: null,
    targetStatusCode: null,
    passed: false,
  };

  try {
    // Fetch with redirect: 'manual' to capture the redirect response
    const response = await fetch(`${baseUrl}${source}`, {
      redirect: 'manual',
      headers: {
        'User-Agent': 'SEO-Validation-Bot/1.0',
      },
    });

    result.statusCode = response.status;
    result.actualTarget = response.headers.get('location');

    // Check if it's a 301 redirect
    if (response.status !== 301) {
      result.error = `Expected 301 redirect, got ${response.status}`;
      return result;
    }

    // Check if location header matches expected target
    if (!result.actualTarget) {
      result.error = 'Missing Location header';
      return result;
    }

    // Normalize the actual target (may be absolute or relative)
    const normalizedActual = result.actualTarget.replace(baseUrl, '');
    if (normalizedActual !== expectedTarget) {
      result.error = `Location header mismatch: expected ${expectedTarget}, got ${normalizedActual}`;
      return result;
    }

    // Verify target URL returns 200
    const targetUrl = result.actualTarget.startsWith('http')
      ? result.actualTarget
      : `${baseUrl}${result.actualTarget}`;

    const targetResponse = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'SEO-Validation-Bot/1.0',
      },
    });

    result.targetStatusCode = targetResponse.status;

    if (targetResponse.status !== 200) {
      result.error = `Target URL returned ${targetResponse.status}, expected 200`;
      return result;
    }

    result.passed = true;
    return result;
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    return result;
  }
}

/**
 * Run all redirect validations
 */
export async function validateAllRedirects(
  baseUrl: string = 'https://thejohnsonbros.com'
): Promise<RedirectValidationReport> {
  const redirectMap = getRedirectMap();
  const results: RedirectValidationResult[] = [];

  Logger.info('Starting redirect validation', { baseUrl });

  // Validate static redirects
  for (const [source, target] of Object.entries(redirectMap)) {
    const result = await validateRedirect(baseUrl, source, target);
    results.push(result);

    if (!result.passed) {
      Logger.warn(`Redirect failed: ${source}`, {
        expected: target,
        actual: result.actualTarget,
        error: result.error
      });
    }
  }

  // Validate pattern-based redirects
  for (const testCase of PATTERN_TEST_CASES) {
    const result = await validateRedirect(baseUrl, testCase.source, testCase.expectedTarget);
    results.push(result);

    if (!result.passed) {
      Logger.warn(`Pattern redirect failed: ${testCase.source}`, {
        expected: testCase.expectedTarget,
        actual: result.actualTarget,
        error: result.error,
      });
    }
  }

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  const report: RedirectValidationReport = {
    timestamp: new Date().toISOString(),
    baseUrl,
    totalRedirects: results.length,
    passed,
    failed,
    results,
  };

  Logger.info('Redirect validation complete', {
    total: report.totalRedirects,
    passed,
    failed
  });

  return report;
}

/**
 * Get all redirect test cases (static + patterns)
 */
export function getAllRedirectTestCases(): Array<{ source: string; expectedTarget: string }> {
  const redirectMap = getRedirectMap();
  const staticCases = Object.entries(redirectMap).map(([source, target]) => ({
    source,
    expectedTarget: target,
  }));

  return [...staticCases, ...PATTERN_TEST_CASES];
}

/**
 * Get pattern-based test cases only
 */
export function getPatternTestCases(): typeof PATTERN_TEST_CASES {
  return PATTERN_TEST_CASES;
}

// CLI execution
if (import.meta.url.endsWith(process.argv[1]?.replace(/^file:\/\//, '') || '')) {
  const baseUrl = process.env.BASE_URL || 'https://thejohnsonbros.com';

  validateAllRedirects(baseUrl)
    .then(report => {
      console.log(JSON.stringify(report, null, 2));

      if (report.failed > 0) {
        console.error(`\n${report.failed} redirect(s) failed validation`);
        process.exit(1);
      }

      console.log(`\nAll ${report.passed} redirects passed validation`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Validation failed:', error);
      process.exit(1);
    });
}
