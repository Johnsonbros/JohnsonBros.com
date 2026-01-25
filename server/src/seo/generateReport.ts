/**
 * SEO Report Generator
 *
 * Aggregates all validation results and generates an HTML report:
 * - Redirect validation summary
 * - Schema validation summary
 * - Sitemap validation summary
 * - Performance metrics summary
 * - Overall launch readiness status
 *
 * Run: npm run seo:report
 */

import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { validateAllRedirects, RedirectValidationReport } from './validateRedirects';
import { validateAllSchemas, SchemaValidationReport } from './validateSchema';
import { validateSitemap, SitemapValidationReport } from './validateSitemap';
import { measurePerformance, PerformanceReport } from './measurePerformance';
import { Logger } from '../logger';

export interface AggregatedReport {
  timestamp: string;
  baseUrl: string;
  overallStatus: 'READY' | 'WARNINGS' | 'NOT_READY';
  summary: {
    redirects: { passed: number; failed: number; total: number; status: 'pass' | 'warn' | 'fail' };
    schema: { passed: number; failed: number; total: number; status: 'pass' | 'warn' | 'fail' };
    sitemap: { passed: number; failed: number; total: number; duplicates: number; status: 'pass' | 'warn' | 'fail' };
    performance: { passed: number; failed: number; total: number; status: 'pass' | 'warn' | 'fail' };
  };
  redirectReport: RedirectValidationReport | null;
  schemaReport: SchemaValidationReport | null;
  sitemapReport: SitemapValidationReport | null;
  performanceReport: PerformanceReport | null;
  errors: string[];
}

/**
 * Run all validations and aggregate results
 */
export async function runAllValidations(
  baseUrl: string = 'https://thejohnsonbros.com',
  options: {
    skipRedirects?: boolean;
    skipSchema?: boolean;
    skipSitemap?: boolean;
    skipPerformance?: boolean;
  } = {}
): Promise<AggregatedReport> {
  const report: AggregatedReport = {
    timestamp: new Date().toISOString(),
    baseUrl,
    overallStatus: 'READY',
    summary: {
      redirects: { passed: 0, failed: 0, total: 0, status: 'pass' },
      schema: { passed: 0, failed: 0, total: 0, status: 'pass' },
      sitemap: { passed: 0, failed: 0, total: 0, duplicates: 0, status: 'pass' },
      performance: { passed: 0, failed: 0, total: 0, status: 'pass' },
    },
    redirectReport: null,
    schemaReport: null,
    sitemapReport: null,
    performanceReport: null,
    errors: [],
  };

  Logger.info('Starting full SEO validation suite', { baseUrl });

  // Run redirect validation
  if (!options.skipRedirects) {
    try {
      Logger.info('Running redirect validation...');
      report.redirectReport = await validateAllRedirects(baseUrl);
      report.summary.redirects = {
        passed: report.redirectReport.passed,
        failed: report.redirectReport.failed,
        total: report.redirectReport.totalRedirects,
        status: report.redirectReport.failed === 0 ? 'pass' : 'fail',
      };
    } catch (error) {
      report.errors.push(`Redirect validation failed: ${error instanceof Error ? error.message : String(error)}`);
      report.summary.redirects.status = 'fail';
    }
  }

  // Run schema validation
  if (!options.skipSchema) {
    try {
      Logger.info('Running schema validation...');
      report.schemaReport = await validateAllSchemas(baseUrl);
      report.summary.schema = {
        passed: report.schemaReport.passed,
        failed: report.schemaReport.failed,
        total: report.schemaReport.totalPages,
        status: report.schemaReport.failed === 0 ? 'pass' : 'fail',
      };
    } catch (error) {
      report.errors.push(`Schema validation failed: ${error instanceof Error ? error.message : String(error)}`);
      report.summary.schema.status = 'fail';
    }
  }

  // Run sitemap validation
  if (!options.skipSitemap) {
    try {
      Logger.info('Running sitemap validation...');
      report.sitemapReport = await validateSitemap(baseUrl);
      report.summary.sitemap = {
        passed: report.sitemapReport.passed,
        failed: report.sitemapReport.failed,
        total: report.sitemapReport.totalUrls,
        duplicates: report.sitemapReport.duplicateUrls,
        status: report.sitemapReport.failed === 0 && report.sitemapReport.duplicateUrls === 0 ? 'pass' : 'fail',
      };
    } catch (error) {
      report.errors.push(`Sitemap validation failed: ${error instanceof Error ? error.message : String(error)}`);
      report.summary.sitemap.status = 'fail';
    }
  }

  // Run performance measurement
  if (!options.skipPerformance) {
    try {
      Logger.info('Running performance measurement...');
      report.performanceReport = await measurePerformance(baseUrl);
      const perfStatus = report.performanceReport.failed === 0
        ? 'pass'
        : report.performanceReport.passed > 0
          ? 'warn'
          : 'fail';
      report.summary.performance = {
        passed: report.performanceReport.passed,
        failed: report.performanceReport.failed,
        total: report.performanceReport.totalPages,
        status: perfStatus,
      };
    } catch (error) {
      report.errors.push(`Performance measurement failed: ${error instanceof Error ? error.message : String(error)}`);
      report.summary.performance.status = 'fail';
    }
  }

  // Determine overall status
  const hasCriticalFailures =
    report.summary.redirects.status === 'fail' ||
    report.summary.sitemap.status === 'fail';

  const hasWarnings =
    report.summary.schema.status === 'fail' ||
    report.summary.performance.status === 'warn' ||
    report.errors.length > 0;

  if (hasCriticalFailures) {
    report.overallStatus = 'NOT_READY';
  } else if (hasWarnings) {
    report.overallStatus = 'WARNINGS';
  } else {
    report.overallStatus = 'READY';
  }

  Logger.info('SEO validation suite complete', {
    overallStatus: report.overallStatus,
    summary: report.summary,
  });

  return report;
}

/**
 * Generate HTML report
 */
export function generateHtmlReport(report: AggregatedReport): string {
  const statusIcon = (status: 'pass' | 'warn' | 'fail'): string => {
    switch (status) {
      case 'pass': return '<span class="status-icon pass">&#x2705;</span>';
      case 'warn': return '<span class="status-icon warn">&#x26A0;&#xFE0F;</span>';
      case 'fail': return '<span class="status-icon fail">&#x274C;</span>';
    }
  };

  const overallStatusClass = report.overallStatus === 'READY'
    ? 'ready'
    : report.overallStatus === 'WARNINGS'
      ? 'warnings'
      : 'not-ready';

  const overallStatusText = report.overallStatus === 'READY'
    ? 'READY FOR LAUNCH'
    : report.overallStatus === 'WARNINGS'
      ? 'LAUNCH WITH CAUTION'
      : 'NOT READY FOR LAUNCH';

  const formatDate = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'short',
    });
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SEO Validation Report - ${formatDate(report.timestamp)}</title>
  <style>
    :root {
      --color-pass: #22c55e;
      --color-warn: #f59e0b;
      --color-fail: #ef4444;
      --color-bg: #f8fafc;
      --color-card: #ffffff;
      --color-text: #1e293b;
      --color-muted: #64748b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--color-bg);
      color: var(--color-text);
      line-height: 1.6;
      padding: 2rem;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    header {
      text-align: center;
      margin-bottom: 2rem;
    }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    .timestamp { color: var(--color-muted); }
    .overall-status {
      display: inline-block;
      padding: 1rem 2rem;
      border-radius: 0.5rem;
      font-size: 1.5rem;
      font-weight: bold;
      margin: 1rem 0;
    }
    .overall-status.ready { background: var(--color-pass); color: white; }
    .overall-status.warnings { background: var(--color-warn); color: white; }
    .overall-status.not-ready { background: var(--color-fail); color: white; }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .summary-card {
      background: var(--color-card);
      border-radius: 0.5rem;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .summary-card h3 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    .status-icon { font-size: 1.25rem; }
    .metric { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e2e8f0; }
    .metric:last-child { border-bottom: none; }
    .metric-label { color: var(--color-muted); }
    .metric-value { font-weight: 600; }
    .metric-value.pass { color: var(--color-pass); }
    .metric-value.fail { color: var(--color-fail); }
    .details-section {
      background: var(--color-card);
      border-radius: 0.5rem;
      padding: 1.5rem;
      margin-bottom: 1rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .details-section h3 { margin-bottom: 1rem; }
    .error-list { list-style: none; }
    .error-list li {
      padding: 0.5rem;
      background: #fef2f2;
      border-left: 3px solid var(--color-fail);
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }
    table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f1f5f9; font-weight: 600; }
    tr.fail { background: #fef2f2; }
    .url { font-family: monospace; font-size: 0.8rem; word-break: break-all; }
    footer {
      text-align: center;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
      color: var(--color-muted);
      font-size: 0.875rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>SEO Validation Report</h1>
      <p class="timestamp">${formatDate(report.timestamp)}</p>
      <p class="timestamp">Base URL: ${report.baseUrl}</p>
      <div class="overall-status ${overallStatusClass}">${overallStatusText}</div>
    </header>

    <div class="summary-grid">
      <div class="summary-card">
        <h3>${statusIcon(report.summary.redirects.status)} Redirects</h3>
        <div class="metric">
          <span class="metric-label">Passed</span>
          <span class="metric-value pass">${report.summary.redirects.passed}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Failed</span>
          <span class="metric-value ${report.summary.redirects.failed > 0 ? 'fail' : ''}">${report.summary.redirects.failed}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Total</span>
          <span class="metric-value">${report.summary.redirects.total}</span>
        </div>
      </div>

      <div class="summary-card">
        <h3>${statusIcon(report.summary.schema.status)} Schema Markup</h3>
        <div class="metric">
          <span class="metric-label">Pages Valid</span>
          <span class="metric-value pass">${report.summary.schema.passed}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Pages Invalid</span>
          <span class="metric-value ${report.summary.schema.failed > 0 ? 'fail' : ''}">${report.summary.schema.failed}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Total Pages</span>
          <span class="metric-value">${report.summary.schema.total}</span>
        </div>
      </div>

      <div class="summary-card">
        <h3>${statusIcon(report.summary.sitemap.status)} Sitemap</h3>
        <div class="metric">
          <span class="metric-label">URLs Valid</span>
          <span class="metric-value pass">${report.summary.sitemap.passed}</span>
        </div>
        <div class="metric">
          <span class="metric-label">URLs Invalid</span>
          <span class="metric-value ${report.summary.sitemap.failed > 0 ? 'fail' : ''}">${report.summary.sitemap.failed}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Duplicates</span>
          <span class="metric-value ${report.summary.sitemap.duplicates > 0 ? 'fail' : ''}">${report.summary.sitemap.duplicates}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Total URLs</span>
          <span class="metric-value">${report.summary.sitemap.total}</span>
        </div>
      </div>

      <div class="summary-card">
        <h3>${statusIcon(report.summary.performance.status)} Performance</h3>
        <div class="metric">
          <span class="metric-label">Above Threshold</span>
          <span class="metric-value pass">${report.summary.performance.passed}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Below Threshold</span>
          <span class="metric-value ${report.summary.performance.failed > 0 ? 'fail' : ''}">${report.summary.performance.failed}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Total Pages</span>
          <span class="metric-value">${report.summary.performance.total}</span>
        </div>
      </div>
    </div>

    ${report.errors.length > 0 ? `
    <div class="details-section">
      <h3>Errors</h3>
      <ul class="error-list">
        ${report.errors.map(e => `<li>${e}</li>`).join('')}
      </ul>
    </div>
    ` : ''}

    ${report.redirectReport && report.redirectReport.failed > 0 ? `
    <div class="details-section">
      <h3>Failed Redirects</h3>
      <table>
        <thead>
          <tr>
            <th>Source URL</th>
            <th>Expected Target</th>
            <th>Actual</th>
            <th>Status</th>
            <th>Error</th>
          </tr>
        </thead>
        <tbody>
          ${report.redirectReport.results.filter(r => !r.passed).map(r => `
          <tr class="fail">
            <td class="url">${r.source}</td>
            <td class="url">${r.expectedTarget}</td>
            <td class="url">${r.actualTarget || '-'}</td>
            <td>${r.statusCode || '-'}</td>
            <td>${r.error || '-'}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    ${report.schemaReport && report.schemaReport.failed > 0 ? `
    <div class="details-section">
      <h3>Schema Validation Failures</h3>
      <table>
        <thead>
          <tr>
            <th>URL</th>
            <th>Errors</th>
          </tr>
        </thead>
        <tbody>
          ${report.schemaReport.results.filter(r => !r.passed).map(r => `
          <tr class="fail">
            <td class="url">${r.url}</td>
            <td>${r.errors.join('; ')}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    ${report.performanceReport ? `
    <div class="details-section">
      <h3>Performance Metrics</h3>
      <table>
        <thead>
          <tr>
            <th>URL</th>
            <th>Perf Score</th>
            <th>SEO Score</th>
            <th>LCP</th>
            <th>TBT</th>
            <th>CLS</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${report.performanceReport.results.map(r => `
          <tr class="${r.passed ? '' : 'fail'}">
            <td class="url">${new URL(r.url).pathname}</td>
            <td>${r.scores.performance ?? '-'}</td>
            <td>${r.scores.seo ?? '-'}</td>
            <td>${r.metrics.lcp ? Math.round(r.metrics.lcp) + 'ms' : '-'}</td>
            <td>${r.metrics.tbt ? Math.round(r.metrics.tbt) + 'ms' : '-'}</td>
            <td>${r.metrics.cls?.toFixed(3) ?? '-'}</td>
            <td>${r.passed ? 'Pass' : 'Fail'}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    <footer>
      <p>Generated by Johnson Bros. SEO Validation Suite</p>
    </footer>
  </div>
</body>
</html>`;
}

/**
 * Save report to file
 */
export async function saveReport(
  report: AggregatedReport,
  outputPath: string
): Promise<void> {
  const html = generateHtmlReport(report);

  try {
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, html);
    Logger.info(`Report saved to ${outputPath}`);
  } catch (error) {
    Logger.error('Failed to save report', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// CLI execution
if (import.meta.url.endsWith(process.argv[1]?.replace(/^file:\/\//, '') || '')) {
  const baseUrl = process.env.BASE_URL || 'https://thejohnsonbros.com';
  const outputPath = join(process.cwd(), 'seo-report.html');

  // Parse CLI args for skipping validations
  const args = process.argv.slice(2);
  const options = {
    skipRedirects: args.includes('--skip-redirects'),
    skipSchema: args.includes('--skip-schema'),
    skipSitemap: args.includes('--skip-sitemap'),
    skipPerformance: args.includes('--skip-performance'),
  };

  runAllValidations(baseUrl, options)
    .then(async report => {
      // Print JSON summary
      console.log(JSON.stringify({
        timestamp: report.timestamp,
        overallStatus: report.overallStatus,
        summary: report.summary,
        errors: report.errors,
      }, null, 2));

      // Save HTML report
      await saveReport(report, outputPath);
      console.log(`\nHTML report saved to: ${outputPath}`);

      // Exit with appropriate code
      if (report.overallStatus === 'NOT_READY') {
        process.exit(1);
      } else if (report.overallStatus === 'WARNINGS') {
        console.warn('\nWarning: Some validations had issues');
        process.exit(0);
      }

      console.log('\nAll validations passed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Report generation failed:', error);
      process.exit(1);
    });
}
