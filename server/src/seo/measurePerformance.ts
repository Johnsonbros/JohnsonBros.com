/**
 * SEO Performance Measurement Script
 *
 * Uses Lighthouse to measure Core Web Vitals:
 * - LCP (Largest Contentful Paint) < 2.5s
 * - TBT (Total Blocking Time) < 100ms
 * - CLS (Cumulative Layout Shift) < 0.1
 * - Performance score > 90
 * - SEO score > 95
 *
 * Run: npm run seo:perf
 */

import { spawn } from 'child_process';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { Logger } from '../logger';

export interface PerformanceThresholds {
  lcp: number; // ms
  tbt: number; // ms
  cls: number;
  performanceScore: number;
  seoScore: number;
}

export interface PagePerformanceResult {
  url: string;
  timestamp: string;
  metrics: {
    lcp: number | null; // ms
    tbt: number | null; // ms
    cls: number | null;
    fcp: number | null; // ms
    si: number | null; // ms (Speed Index)
    tti: number | null; // ms (Time to Interactive)
  };
  scores: {
    performance: number | null;
    seo: number | null;
    accessibility: number | null;
    bestPractices: number | null;
  };
  thresholdResults: {
    lcp: { passed: boolean; value: number | null; threshold: number };
    tbt: { passed: boolean; value: number | null; threshold: number };
    cls: { passed: boolean; value: number | null; threshold: number };
    performanceScore: { passed: boolean; value: number | null; threshold: number };
    seoScore: { passed: boolean; value: number | null; threshold: number };
  };
  passed: boolean;
  errors: string[];
}

export interface PerformanceReport {
  timestamp: string;
  baseUrl: string;
  thresholds: PerformanceThresholds;
  totalPages: number;
  passed: number;
  failed: number;
  results: PagePerformanceResult[];
  baselinePath: string | null;
}

/**
 * Default performance thresholds
 */
const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  lcp: 2500, // 2.5 seconds
  tbt: 100, // 100 ms
  cls: 0.1,
  performanceScore: 90,
  seoScore: 95,
};

/**
 * Pages to measure
 */
const PAGES_TO_MEASURE = [
  '/', // Homepage
  '/services/emergency-plumbing',
  '/service-areas/quincy',
  '/contact',
];

/**
 * Run Lighthouse via CLI for a single URL
 */
async function runLighthouse(url: string): Promise<{
  metrics: PagePerformanceResult['metrics'];
  scores: PagePerformanceResult['scores'];
  errors: string[];
}> {
  return new Promise((resolve) => {
    const result: {
      metrics: PagePerformanceResult['metrics'];
      scores: PagePerformanceResult['scores'];
      errors: string[];
    } = {
      metrics: {
        lcp: null,
        tbt: null,
        cls: null,
        fcp: null,
        si: null,
        tti: null,
      },
      scores: {
        performance: null,
        seo: null,
        accessibility: null,
        bestPractices: null,
      },
      errors: [],
    };

    // Use lighthouse CLI with JSON output
    const args = [
      'lighthouse',
      url,
      '--output=json',
      '--output-path=stdout',
      '--chrome-flags="--headless --no-sandbox --disable-gpu"',
      '--only-categories=performance,seo,accessibility,best-practices',
      '--quiet',
    ];

    const proc = spawn('npx', args, {
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        result.errors.push(`Lighthouse exited with code ${code}`);
        if (stderr) {
          result.errors.push(stderr.substring(0, 500));
        }
        resolve(result);
        return;
      }

      try {
        // Find the JSON in stdout (Lighthouse may output other text)
        const jsonStart = stdout.indexOf('{');
        const jsonEnd = stdout.lastIndexOf('}');
        if (jsonStart === -1 || jsonEnd === -1) {
          result.errors.push('No valid JSON in Lighthouse output');
          resolve(result);
          return;
        }

        const json = JSON.parse(stdout.substring(jsonStart, jsonEnd + 1));

        // Extract scores (0-1 scale, convert to 0-100)
        if (json.categories) {
          result.scores.performance = json.categories.performance?.score != null
            ? Math.round(json.categories.performance.score * 100)
            : null;
          result.scores.seo = json.categories.seo?.score != null
            ? Math.round(json.categories.seo.score * 100)
            : null;
          result.scores.accessibility = json.categories.accessibility?.score != null
            ? Math.round(json.categories.accessibility.score * 100)
            : null;
          result.scores.bestPractices = json.categories['best-practices']?.score != null
            ? Math.round(json.categories['best-practices'].score * 100)
            : null;
        }

        // Extract metrics from audits
        if (json.audits) {
          result.metrics.lcp = json.audits['largest-contentful-paint']?.numericValue ?? null;
          result.metrics.tbt = json.audits['total-blocking-time']?.numericValue ?? null;
          result.metrics.cls = json.audits['cumulative-layout-shift']?.numericValue ?? null;
          result.metrics.fcp = json.audits['first-contentful-paint']?.numericValue ?? null;
          result.metrics.si = json.audits['speed-index']?.numericValue ?? null;
          result.metrics.tti = json.audits['interactive']?.numericValue ?? null;
        }
      } catch (error) {
        result.errors.push(`Failed to parse Lighthouse output: ${error instanceof Error ? error.message : String(error)}`);
      }

      resolve(result);
    });

    proc.on('error', (error) => {
      result.errors.push(`Failed to spawn Lighthouse: ${error.message}`);
      resolve(result);
    });

    // Timeout after 2 minutes
    setTimeout(() => {
      proc.kill();
      result.errors.push('Lighthouse timed out after 2 minutes');
      resolve(result);
    }, 120000);
  });
}

/**
 * Check metrics against thresholds
 */
function checkThresholds(
  metrics: PagePerformanceResult['metrics'],
  scores: PagePerformanceResult['scores'],
  thresholds: PerformanceThresholds
): PagePerformanceResult['thresholdResults'] {
  return {
    lcp: {
      passed: metrics.lcp != null && metrics.lcp <= thresholds.lcp,
      value: metrics.lcp,
      threshold: thresholds.lcp,
    },
    tbt: {
      passed: metrics.tbt != null && metrics.tbt <= thresholds.tbt,
      value: metrics.tbt,
      threshold: thresholds.tbt,
    },
    cls: {
      passed: metrics.cls != null && metrics.cls <= thresholds.cls,
      value: metrics.cls,
      threshold: thresholds.cls,
    },
    performanceScore: {
      passed: scores.performance != null && scores.performance >= thresholds.performanceScore,
      value: scores.performance,
      threshold: thresholds.performanceScore,
    },
    seoScore: {
      passed: scores.seo != null && scores.seo >= thresholds.seoScore,
      value: scores.seo,
      threshold: thresholds.seoScore,
    },
  };
}

/**
 * Measure performance for a single page
 */
async function measurePage(
  baseUrl: string,
  path: string,
  thresholds: PerformanceThresholds
): Promise<PagePerformanceResult> {
  const url = `${baseUrl}${path}`;

  const result: PagePerformanceResult = {
    url,
    timestamp: new Date().toISOString(),
    metrics: {
      lcp: null,
      tbt: null,
      cls: null,
      fcp: null,
      si: null,
      tti: null,
    },
    scores: {
      performance: null,
      seo: null,
      accessibility: null,
      bestPractices: null,
    },
    thresholdResults: {
      lcp: { passed: false, value: null, threshold: thresholds.lcp },
      tbt: { passed: false, value: null, threshold: thresholds.tbt },
      cls: { passed: false, value: null, threshold: thresholds.cls },
      performanceScore: { passed: false, value: null, threshold: thresholds.performanceScore },
      seoScore: { passed: false, value: null, threshold: thresholds.seoScore },
    },
    passed: false,
    errors: [],
  };

  Logger.info(`Measuring performance: ${url}`);

  const lighthouseResult = await runLighthouse(url);

  result.metrics = lighthouseResult.metrics;
  result.scores = lighthouseResult.scores;
  result.errors = lighthouseResult.errors;

  if (result.errors.length === 0) {
    result.thresholdResults = checkThresholds(result.metrics, result.scores, thresholds);

    // Check if all thresholds passed
    result.passed = Object.values(result.thresholdResults).every(t => t.passed);
  }

  return result;
}

/**
 * Save baseline to JSON file
 */
async function saveBaseline(report: PerformanceReport, outputPath: string): Promise<void> {
  try {
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, JSON.stringify(report, null, 2));
    Logger.info(`Baseline saved to ${outputPath}`);
  } catch (error) {
    Logger.error('Failed to save baseline', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Load previous baseline for comparison
 */
async function loadBaseline(baselinePath: string): Promise<PerformanceReport | null> {
  try {
    const content = await readFile(baselinePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Run performance measurements on all pages
 */
export async function measurePerformance(
  baseUrl: string = 'https://thejohnsonbros.com',
  thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS,
  pages: string[] = PAGES_TO_MEASURE
): Promise<PerformanceReport> {
  const baselinePath = join(process.cwd(), 'server/src/seo/baseline-performance.json');

  const report: PerformanceReport = {
    timestamp: new Date().toISOString(),
    baseUrl,
    thresholds,
    totalPages: pages.length,
    passed: 0,
    failed: 0,
    results: [],
    baselinePath,
  };

  Logger.info('Starting performance measurement', {
    baseUrl,
    pages: pages.length,
    thresholds,
  });

  for (const page of pages) {
    const result = await measurePage(baseUrl, page, thresholds);
    report.results.push(result);

    if (result.passed) {
      report.passed++;
    } else {
      report.failed++;

      const failedThresholds = Object.entries(result.thresholdResults)
        .filter(([, v]) => !v.passed)
        .map(([k, v]) => `${k}: ${v.value} (threshold: ${v.threshold})`);

      Logger.warn(`Performance test failed: ${page}`, {
        failedThresholds,
        errors: result.errors,
      });
    }
  }

  // Save baseline
  await saveBaseline(report, baselinePath);

  Logger.info('Performance measurement complete', {
    totalPages: report.totalPages,
    passed: report.passed,
    failed: report.failed,
  });

  return report;
}

/**
 * Get default thresholds
 */
export function getDefaultThresholds(): PerformanceThresholds {
  return { ...DEFAULT_THRESHOLDS };
}

/**
 * Get pages to measure
 */
export function getPagesToMeasure(): string[] {
  return [...PAGES_TO_MEASURE];
}

// CLI execution
if (import.meta.url.endsWith(process.argv[1]?.replace(/^file:\/\//, '') || '')) {
  const baseUrl = process.env.BASE_URL || 'https://thejohnsonbros.com';

  measurePerformance(baseUrl)
    .then(report => {
      console.log(JSON.stringify(report, null, 2));

      if (report.failed > 0) {
        console.error(`\n${report.failed}/${report.totalPages} page(s) failed performance thresholds`);
        process.exit(1);
      }

      console.log(`\nAll ${report.passed} pages passed performance thresholds`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Performance measurement failed:', error);
      process.exit(1);
    });
}
