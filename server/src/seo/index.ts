/**
 * SEO Validation Suite
 *
 * Comprehensive pre-launch SEO validation tools:
 * - Redirect validation
 * - Schema markup validation
 * - Sitemap validation
 * - Performance measurement
 * - Aggregated report generation
 */

// Redirect validation
export {
  validateAllRedirects,
  getAllRedirectTestCases,
  getPatternTestCases,
  type RedirectValidationResult,
  type RedirectValidationReport,
} from './validateRedirects';

// Schema validation
export {
  validateAllSchemas,
  validatePageSchema,
  extractJsonLd,
  getPagesToValidate,
  getSchemaRequirements,
  getRequiredFields,
  type SchemaValidationResult,
  type SchemaCheckResult,
  type SchemaValidationReport,
} from './validateSchema';

// Sitemap validation
export {
  validateSitemap,
  parseSitemap,
  getExpectedCounts,
  type SitemapURLResult,
  type SitemapValidationReport,
} from './validateSitemap';

// Performance measurement
export {
  measurePerformance,
  getDefaultThresholds,
  getPagesToMeasure,
  type PerformanceThresholds,
  type PagePerformanceResult,
  type PerformanceReport,
} from './measurePerformance';

// Report generation
export {
  runAllValidations,
  generateHtmlReport,
  saveReport,
  type AggregatedReport,
} from './generateReport';
