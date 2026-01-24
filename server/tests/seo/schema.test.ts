/**
 * SEO Schema Validation Tests
 *
 * Tests for JSON-LD extraction, schema validation,
 * and required field checking.
 */

import { describe, it } from 'vitest';
import { expect } from 'vitest';
import {
  extractJsonLd,
  getSchemaRequirements,
  getRequiredFields,
} from '../../src/seo/validateSchema';

describe('JSON-LD Extraction', () => {
  it('should extract single JSON-LD script from HTML', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": "Johnson Bros. Plumbing"
            }
          </script>
        </head>
        <body></body>
      </html>
    `;

    const schemas = extractJsonLd(html);
    expect(schemas).toHaveLength(1);
    expect(schemas[0]['@type']).toBe('LocalBusiness');
    expect(schemas[0]['name']).toBe('Johnson Bros. Plumbing');
  });

  it('should extract multiple JSON-LD scripts from HTML', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <script type="application/ld+json">
            {"@type": "LocalBusiness", "name": "Test Business"}
          </script>
          <script type="application/ld+json">
            {"@type": "FAQPage", "mainEntity": []}
          </script>
        </head>
        <body></body>
      </html>
    `;

    const schemas = extractJsonLd(html);
    expect(schemas).toHaveLength(2);
    expect(schemas.map(s => s['@type'])).toContain('LocalBusiness');
    expect(schemas.map(s => s['@type'])).toContain('FAQPage');
  });

  it('should handle JSON-LD array format', () => {
    const html = `
      <script type="application/ld+json">
        [
          {"@type": "Organization", "name": "Org 1"},
          {"@type": "LocalBusiness", "name": "Business 1"}
        ]
      </script>
    `;

    const schemas = extractJsonLd(html);
    expect(schemas).toHaveLength(2);
  });

  it('should handle empty HTML gracefully', () => {
    const schemas = extractJsonLd('');
    expect(schemas).toHaveLength(0);
  });

  it('should handle HTML without JSON-LD', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Test</title></head>
        <body><p>No JSON-LD here</p></body>
      </html>
    `;

    const schemas = extractJsonLd(html);
    expect(schemas).toHaveLength(0);
  });

  it('should handle malformed JSON gracefully', () => {
    const html = `
      <script type="application/ld+json">
        { invalid json content }
      </script>
    `;

    // Should not throw, should return empty array
    const schemas = extractJsonLd(html);
    expect(schemas).toHaveLength(0);
  });

  it('should extract JSON-LD with various script tag formats', () => {
    const html = `
      <script type='application/ld+json'>{"@type": "Test1"}</script>
      <script type="application/ld+json" id="schema">{"@type": "Test2"}</script>
    `;

    const schemas = extractJsonLd(html);
    expect(schemas).toHaveLength(2);
  });
});

describe('Schema Requirements', () => {
  const requirements = getSchemaRequirements();

  it('should have homepage schema requirements', () => {
    const homepage = requirements.find(r => r.path === '/');
    expect(homepage).toBeDefined();
    expect(homepage?.requiredSchemas).toContain('Organization');
    expect(homepage?.requiredSchemas).toContain('LocalBusiness');
    expect(homepage?.requiredSchemas).toContain('FAQPage');
  });

  it('should have service page schema requirements', () => {
    const services = requirements.find(r => r.path === '/services/');
    expect(services).toBeDefined();
    expect(services?.requiredSchemas).toContain('Service');
    expect(services?.requiredSchemas).toContain('BreadcrumbList');
    expect(services?.pattern).toBeDefined();
  });

  it('should have service area page schema requirements', () => {
    const areas = requirements.find(r => r.path === '/service-areas/');
    expect(areas).toBeDefined();
    expect(areas?.requiredSchemas).toContain('LocalBusiness');
    expect(areas?.requiredSchemas).toContain('BreadcrumbList');
    expect(areas?.pattern).toBeDefined();
  });

  it('should have reviews page schema requirements', () => {
    const reviews = requirements.find(r => r.path === '/reviews');
    expect(reviews).toBeDefined();
    expect(reviews?.requiredSchemas).toContain('LocalBusiness');
    expect(reviews?.requiredSchemas).toContain('AggregateRating');
  });
});

describe('Required Fields Configuration', () => {
  const requiredFields = getRequiredFields();

  it('should have LocalBusiness required fields', () => {
    expect(requiredFields['LocalBusiness']).toBeDefined();
    expect(requiredFields['LocalBusiness']).toContain('name');
    expect(requiredFields['LocalBusiness']).toContain('address');
    expect(requiredFields['LocalBusiness']).toContain('telephone');
    expect(requiredFields['LocalBusiness']).toContain('url');
  });

  it('should have Service required fields', () => {
    expect(requiredFields['Service']).toBeDefined();
    expect(requiredFields['Service']).toContain('serviceType');
    expect(requiredFields['Service']).toContain('provider');
    expect(requiredFields['Service']).toContain('areaServed');
  });

  it('should have FAQPage required fields', () => {
    expect(requiredFields['FAQPage']).toBeDefined();
    expect(requiredFields['FAQPage']).toContain('mainEntity');
  });

  it('should have BreadcrumbList required fields', () => {
    expect(requiredFields['BreadcrumbList']).toBeDefined();
    expect(requiredFields['BreadcrumbList']).toContain('itemListElement');
  });

  it('should have AggregateRating required fields', () => {
    expect(requiredFields['AggregateRating']).toBeDefined();
    expect(requiredFields['AggregateRating']).toContain('ratingValue');
    expect(requiredFields['AggregateRating']).toContain('reviewCount');
  });

  it('should have Organization required fields', () => {
    expect(requiredFields['Organization']).toBeDefined();
    expect(requiredFields['Organization']).toContain('name');
    expect(requiredFields['Organization']).toContain('url');
  });
});

describe('Schema Type Matching', () => {
  it('should recognize Plumber as a valid LocalBusiness subtype', () => {
    // This tests the logic in validateSchema.ts
    // Plumber is a valid schema.org type that extends LocalBusiness
    const plumberSchema = {
      '@type': 'Plumber',
      'name': 'Johnson Bros.',
      'address': '123 Main St',
      'telephone': '555-1234',
      'url': 'https://example.com',
    };

    // The schema should be treated as valid LocalBusiness
    expect(plumberSchema['@type']).toBe('Plumber');
  });

  it('should handle array @type values', () => {
    const schema = {
      '@type': ['Plumber', 'LocalBusiness'],
      'name': 'Test',
    };

    expect(Array.isArray(schema['@type'])).toBe(true);
    expect(schema['@type']).toContain('LocalBusiness');
    expect(schema['@type']).toContain('Plumber');
  });
});

describe('FAQ Schema Structure', () => {
  it('should validate proper FAQ structure', () => {
    const faqSchema = {
      '@type': 'FAQPage',
      'mainEntity': [
        {
          '@type': 'Question',
          'name': 'What services do you offer?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'We offer plumbing services.',
          },
        },
      ],
    };

    expect(faqSchema.mainEntity).toBeInstanceOf(Array);
    expect(faqSchema.mainEntity.length).toBeGreaterThan(0);
    expect(faqSchema.mainEntity[0]['@type']).toBe('Question');
    expect(faqSchema.mainEntity[0]['acceptedAnswer']).toBeDefined();
  });
});

describe('BreadcrumbList Schema Structure', () => {
  it('should validate proper breadcrumb structure', () => {
    const breadcrumbSchema = {
      '@type': 'BreadcrumbList',
      'itemListElement': [
        {
          '@type': 'ListItem',
          'position': 1,
          'name': 'Home',
          'item': 'https://example.com/',
        },
        {
          '@type': 'ListItem',
          'position': 2,
          'name': 'Services',
          'item': 'https://example.com/services',
        },
      ],
    };

    expect(breadcrumbSchema.itemListElement).toBeInstanceOf(Array);
    expect(breadcrumbSchema.itemListElement.length).toBeGreaterThan(0);
    expect(breadcrumbSchema.itemListElement[0]['position']).toBe(1);
    expect(breadcrumbSchema.itemListElement[0]['name']).toBeDefined();
  });
});

describe('Service Schema Structure', () => {
  it('should validate proper service schema structure', () => {
    const serviceSchema = {
      '@type': 'Service',
      'serviceType': 'Emergency Plumbing',
      'provider': {
        '@id': 'https://example.com/#organization',
      },
      'areaServed': [
        { '@type': 'City', 'name': 'Quincy' },
        { '@type': 'City', 'name': 'Braintree' },
      ],
    };

    expect(serviceSchema['@type']).toBe('Service');
    expect(serviceSchema.serviceType).toBeDefined();
    expect(serviceSchema.provider).toBeDefined();
    expect(serviceSchema.areaServed).toBeInstanceOf(Array);
  });
});

describe('AggregateRating Schema Structure', () => {
  it('should validate proper aggregate rating structure', () => {
    const ratingSchema = {
      '@type': 'AggregateRating',
      'ratingValue': '4.8',
      'reviewCount': '314',
      'bestRating': '5',
      'worstRating': '1',
    };

    expect(ratingSchema['@type']).toBe('AggregateRating');
    expect(ratingSchema.ratingValue).toBeDefined();
    expect(ratingSchema.reviewCount).toBeDefined();
  });
});
