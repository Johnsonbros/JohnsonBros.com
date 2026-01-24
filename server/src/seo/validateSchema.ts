/**
 * SEO Schema Markup Validation Script
 *
 * Validates JSON-LD structured data on all pages:
 * - LocalBusiness: name, address, telephone, url
 * - Service: serviceType, provider, areaServed
 * - FAQPage: mainEntity with Question/Answer pairs
 * - BreadcrumbList: itemListElement array
 *
 * Run: npm run seo:schema
 */

import { Logger } from '../logger';

export interface SchemaValidationResult {
  url: string;
  schemas: SchemaCheckResult[];
  passed: boolean;
  errors: string[];
}

export interface SchemaCheckResult {
  type: string;
  found: boolean;
  valid: boolean;
  errors: string[];
  data?: Record<string, unknown>;
}

export interface SchemaValidationReport {
  timestamp: string;
  baseUrl: string;
  totalPages: number;
  totalSchemas: number;
  passed: number;
  failed: number;
  results: SchemaValidationResult[];
}

/**
 * Page-to-schema requirements mapping
 */
interface PageSchemaRequirement {
  path: string;
  pattern?: RegExp;
  requiredSchemas: string[];
}

const PAGE_SCHEMA_REQUIREMENTS: PageSchemaRequirement[] = [
  // Homepage
  {
    path: '/',
    requiredSchemas: ['Organization', 'LocalBusiness', 'FAQPage'],
  },
  // Service pages
  {
    path: '/services/',
    pattern: /^\/services\/[a-z-]+$/,
    requiredSchemas: ['Service', 'BreadcrumbList'],
  },
  // Service area pages
  {
    path: '/service-areas/',
    pattern: /^\/service-areas\/[a-z-]+$/,
    requiredSchemas: ['LocalBusiness', 'BreadcrumbList'],
  },
  // Reviews page
  {
    path: '/reviews',
    requiredSchemas: ['LocalBusiness', 'AggregateRating'],
  },
];

/**
 * Required fields for each schema type
 */
const SCHEMA_REQUIRED_FIELDS: Record<string, string[]> = {
  LocalBusiness: ['name', 'address', 'telephone', 'url'],
  Organization: ['name', 'url'],
  Service: ['serviceType', 'provider', 'areaServed'],
  FAQPage: ['mainEntity'],
  BreadcrumbList: ['itemListElement'],
  AggregateRating: ['ratingValue', 'reviewCount'],
};

/**
 * Extract JSON-LD scripts from HTML
 */
export function extractJsonLd(html: string): Array<Record<string, unknown>> {
  const schemas: Array<Record<string, unknown>> = [];
  const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const jsonContent = match[1].trim();
      const parsed = JSON.parse(jsonContent);

      // Handle both single objects and arrays
      if (Array.isArray(parsed)) {
        schemas.push(...parsed);
      } else {
        schemas.push(parsed);
      }
    } catch (error) {
      Logger.warn('Failed to parse JSON-LD', { error: String(error) });
    }
  }

  return schemas;
}

/**
 * Get the type(s) from a schema object
 */
function getSchemaTypes(schema: Record<string, unknown>): string[] {
  const type = schema['@type'];
  if (!type) return [];
  if (Array.isArray(type)) return type as string[];
  return [type as string];
}

/**
 * Validate required fields for a schema type
 */
function validateSchemaFields(
  schema: Record<string, unknown>,
  schemaType: string
): { valid: boolean; errors: string[] } {
  const requiredFields = SCHEMA_REQUIRED_FIELDS[schemaType] || [];
  const errors: string[] = [];

  for (const field of requiredFields) {
    if (!(field in schema) || schema[field] === null || schema[field] === undefined) {
      errors.push(`Missing required field: ${field}`);
    } else if (typeof schema[field] === 'string' && (schema[field] as string).trim() === '') {
      errors.push(`Empty required field: ${field}`);
    }
  }

  // Special validation for FAQPage
  if (schemaType === 'FAQPage' && schema.mainEntity) {
    const mainEntity = schema.mainEntity as Array<Record<string, unknown>>;
    if (!Array.isArray(mainEntity) || mainEntity.length === 0) {
      errors.push('FAQPage.mainEntity must be a non-empty array');
    } else {
      // Check each Q&A pair
      for (let i = 0; i < mainEntity.length; i++) {
        const qa = mainEntity[i];
        if (!qa || typeof qa !== 'object') {
          errors.push(`FAQPage.mainEntity[${i}] is not a valid object`);
          continue;
        }
        const types = getSchemaTypes(qa);
        if (!types.includes('Question')) {
          errors.push(`FAQPage.mainEntity[${i}] must be type Question`);
        }
        if (!qa.name || !qa.acceptedAnswer) {
          errors.push(`FAQPage.mainEntity[${i}] missing name or acceptedAnswer`);
        }
      }
    }
  }

  // Special validation for BreadcrumbList
  if (schemaType === 'BreadcrumbList' && schema.itemListElement) {
    const items = schema.itemListElement as Array<Record<string, unknown>>;
    if (!Array.isArray(items) || items.length === 0) {
      errors.push('BreadcrumbList.itemListElement must be a non-empty array');
    } else {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item || typeof item !== 'object') {
          errors.push(`BreadcrumbList.itemListElement[${i}] is not a valid object`);
          continue;
        }
        if (!item.position || !item.name) {
          errors.push(`BreadcrumbList.itemListElement[${i}] missing position or name`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Check if a schema matches a required type (handles @type arrays and Plumber subtype)
 */
function schemaMatchesType(schema: Record<string, unknown>, requiredType: string): boolean {
  const types = getSchemaTypes(schema);

  // Direct match
  if (types.includes(requiredType)) return true;

  // Plumber is a subtype of LocalBusiness
  if (requiredType === 'LocalBusiness' && types.includes('Plumber')) return true;

  // Organization/LocalBusiness overlap
  if (requiredType === 'Organization' && (types.includes('LocalBusiness') || types.includes('Plumber'))) {
    return true;
  }

  return false;
}

/**
 * Validate schemas on a single page
 */
export async function validatePageSchema(
  baseUrl: string,
  path: string,
  requiredSchemas: string[]
): Promise<SchemaValidationResult> {
  const url = `${baseUrl}${path}`;
  const result: SchemaValidationResult = {
    url,
    schemas: [],
    passed: true,
    errors: [],
  };

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SEO-Validation-Bot/1.0',
      },
    });

    if (!response.ok) {
      result.passed = false;
      result.errors.push(`HTTP ${response.status}: ${response.statusText}`);
      return result;
    }

    const html = await response.text();
    const schemas = extractJsonLd(html);

    // Check each required schema type
    for (const requiredType of requiredSchemas) {
      const matchingSchema = schemas.find(s => schemaMatchesType(s, requiredType));

      const checkResult: SchemaCheckResult = {
        type: requiredType,
        found: !!matchingSchema,
        valid: false,
        errors: [],
      };

      if (!matchingSchema) {
        checkResult.errors.push(`Schema type ${requiredType} not found`);
        result.passed = false;
      } else {
        const validation = validateSchemaFields(matchingSchema, requiredType);
        checkResult.valid = validation.valid;
        checkResult.errors = validation.errors;
        checkResult.data = matchingSchema;

        if (!validation.valid) {
          result.passed = false;
        }
      }

      result.schemas.push(checkResult);
    }

    if (!result.passed) {
      result.errors = result.schemas.flatMap(s => s.errors);
    }
  } catch (error) {
    result.passed = false;
    result.errors.push(error instanceof Error ? error.message : String(error));
  }

  return result;
}

/**
 * Get all pages requiring schema validation with their URLs
 */
export async function getPagesToValidate(baseUrl: string): Promise<Array<{ path: string; requiredSchemas: string[] }>> {
  const pages: Array<{ path: string; requiredSchemas: string[] }> = [];

  // Add static pages
  for (const req of PAGE_SCHEMA_REQUIREMENTS) {
    if (!req.pattern) {
      pages.push({ path: req.path, requiredSchemas: req.requiredSchemas });
    }
  }

  // Add service pages
  const services = [
    'general-plumbing',
    'new-construction',
    'gas-heat',
    'drain-cleaning',
    'emergency-plumbing',
    'water-heater',
    'pipe-repair',
    'heating',
  ];

  const serviceReq = PAGE_SCHEMA_REQUIREMENTS.find(r => r.path === '/services/');
  if (serviceReq) {
    for (const service of services) {
      pages.push({
        path: `/services/${service}`,
        requiredSchemas: serviceReq.requiredSchemas,
      });
    }
  }

  // Add service area pages
  const serviceAreas = [
    'quincy',
    'abington',
    'braintree',
    'weymouth',
    'hingham',
    'plymouth',
    'marshfield',
    'rockland',
    'hanover',
    'scituate',
    'cohasset',
    'hull',
  ];

  const areaReq = PAGE_SCHEMA_REQUIREMENTS.find(r => r.path === '/service-areas/');
  if (areaReq) {
    for (const area of serviceAreas) {
      pages.push({
        path: `/service-areas/${area}`,
        requiredSchemas: areaReq.requiredSchemas,
      });
    }
  }

  return pages;
}

/**
 * Run schema validation on all pages
 */
export async function validateAllSchemas(
  baseUrl: string = 'https://thejohnsonbros.com'
): Promise<SchemaValidationReport> {
  const results: SchemaValidationResult[] = [];

  Logger.info('Starting schema validation', { baseUrl });

  const pages = await getPagesToValidate(baseUrl);
  let totalSchemas = 0;

  for (const page of pages) {
    const result = await validatePageSchema(baseUrl, page.path, page.requiredSchemas);
    results.push(result);
    totalSchemas += page.requiredSchemas.length;

    if (!result.passed) {
      Logger.warn(`Schema validation failed: ${page.path}`, {
        errors: result.errors,
      });
    }
  }

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  const report: SchemaValidationReport = {
    timestamp: new Date().toISOString(),
    baseUrl,
    totalPages: results.length,
    totalSchemas,
    passed,
    failed,
    results,
  };

  Logger.info('Schema validation complete', {
    totalPages: report.totalPages,
    passed,
    failed,
  });

  return report;
}

/**
 * Export schema requirements for testing
 */
export function getSchemaRequirements(): typeof PAGE_SCHEMA_REQUIREMENTS {
  return PAGE_SCHEMA_REQUIREMENTS;
}

export function getRequiredFields(): typeof SCHEMA_REQUIRED_FIELDS {
  return SCHEMA_REQUIRED_FIELDS;
}

// CLI execution
if (import.meta.url.endsWith(process.argv[1]?.replace(/^file:\/\//, '') || '')) {
  const baseUrl = process.env.BASE_URL || 'https://thejohnsonbros.com';

  validateAllSchemas(baseUrl)
    .then(report => {
      console.log(JSON.stringify(report, null, 2));

      if (report.failed > 0) {
        console.error(`\n${report.failed} page(s) failed schema validation`);
        process.exit(1);
      }

      console.log(`\nAll ${report.passed} pages passed schema validation`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Schema validation failed:', error);
      process.exit(1);
    });
}
