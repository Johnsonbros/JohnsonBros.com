/**
 * SEO Redirect Validation Tests
 *
 * Tests for redirect mapping logic, pattern matching,
 * and validation functions.
 */

import { describe, it, beforeAll } from 'vitest';
import { expect } from 'vitest';
import { getRedirectMap, seoRedirectMiddleware } from '../../src/seoRedirects';
import {
  getAllRedirectTestCases,
  getPatternTestCases,
} from '../../src/seo/validateRedirects';

describe('SEO Redirect Mapping', () => {
  let redirectMap: Record<string, string>;

  beforeAll(() => {
    redirectMap = getRedirectMap();
  });

  describe('Static Redirects', () => {
    it('should have homepage variations redirecting to /', () => {
      expect(redirectMap['/index.html']).toBe('/');
      expect(redirectMap['/index.php']).toBe('/');
      expect(redirectMap['/home']).toBe('/');
    });

    it('should have about page variations', () => {
      expect(redirectMap['/about-us']).toBe('/about');
      expect(redirectMap['/company']).toBe('/about');
      expect(redirectMap['/our-story']).toBe('/about');
    });

    it('should have contact page variations', () => {
      expect(redirectMap['/contact-us']).toBe('/contact');
      expect(redirectMap['/get-in-touch']).toBe('/contact');
      expect(redirectMap['/free-estimate']).toBe('/contact');
    });

    it('should have drain cleaning service variations', () => {
      expect(redirectMap['/drain-cleaning']).toBe('/services/drain-cleaning');
      expect(redirectMap['/drain-cleaning-service']).toBe('/services/drain-cleaning');
      expect(redirectMap['/clogged-drain']).toBe('/services/drain-cleaning');
      expect(redirectMap['/sewer-cleaning']).toBe('/services/drain-cleaning');
    });

    it('should have emergency plumbing variations', () => {
      expect(redirectMap['/emergency-plumber']).toBe('/services/emergency-plumbing');
      expect(redirectMap['/24-hour-plumber']).toBe('/services/emergency-plumbing');
      expect(redirectMap['/urgent-plumbing']).toBe('/services/emergency-plumbing');
    });

    it('should have water heater variations', () => {
      expect(redirectMap['/water-heater']).toBe('/services/water-heater');
      expect(redirectMap['/water-heater-repair']).toBe('/services/water-heater');
      expect(redirectMap['/tankless-water-heater']).toBe('/services/water-heater');
    });

    it('should have service area variations', () => {
      expect(redirectMap['/areas-we-serve']).toBe('/service-areas');
      expect(redirectMap['/service-area']).toBe('/service-areas');
      expect(redirectMap['/locations']).toBe('/service-areas');
    });

    it('should have city-specific plumber variations', () => {
      expect(redirectMap['/quincy-plumber']).toBe('/service-areas/quincy');
      expect(redirectMap['/plumber-quincy-ma']).toBe('/service-areas/quincy');
      expect(redirectMap['/braintree-plumber']).toBe('/service-areas/braintree');
      expect(redirectMap['/weymouth-plumber']).toBe('/service-areas/weymouth');
    });

    it('should have review page variations', () => {
      expect(redirectMap['/testimonials']).toBe('/reviews');
      expect(redirectMap['/customer-reviews']).toBe('/reviews');
      expect(redirectMap['/google-reviews']).toBe('/reviews');
    });

    it('should have blog variations', () => {
      expect(redirectMap['/news']).toBe('/blog');
      expect(redirectMap['/articles']).toBe('/blog');
      expect(redirectMap['/plumbing-tips']).toBe('/blog');
    });

    it('should have WordPress admin redirects', () => {
      expect(redirectMap['/wp-admin']).toBe('/admin/login');
      expect(redirectMap['/wp-login.php']).toBe('/admin/login');
    });
  });

  describe('Pattern Test Cases', () => {
    const patternCases = getPatternTestCases();

    it('should have service-area pattern test cases', () => {
      const serviceAreaCases = patternCases.filter(c => c.source.includes('/service-area/'));
      expect(serviceAreaCases.length).toBeGreaterThan(0);

      // Check specific cases
      const quincyCase = serviceAreaCases.find(c => c.source.includes('quincy'));
      expect(quincyCase?.expectedTarget).toBe('/service-areas/quincy');

      const braintreeCase = serviceAreaCases.find(c => c.source.includes('braintree'));
      expect(braintreeCase?.expectedTarget).toBe('/service-areas/braintree');
    });

    it('should have blog pattern test cases', () => {
      const blogCases = patternCases.filter(c => c.source.includes('/blog/'));
      expect(blogCases.length).toBeGreaterThan(0);

      // Blog posts should maintain slug without trailing slash
      const plumbingTipsCase = blogCases.find(c => c.source.includes('plumbing-tips'));
      expect(plumbingTipsCase?.expectedTarget).toBe('/blog/plumbing-tips');
    });

    it('should have category pattern test cases redirecting to /blog', () => {
      const categoryCases = patternCases.filter(c => c.source.includes('/category/'));
      expect(categoryCases.length).toBeGreaterThan(0);
      categoryCases.forEach(c => {
        expect(c.expectedTarget).toBe('/blog');
      });
    });

    it('should have tag pattern test cases redirecting to /blog', () => {
      const tagCases = patternCases.filter(c => c.source.includes('/tag/'));
      expect(tagCases.length).toBeGreaterThan(0);
      tagCases.forEach(c => {
        expect(c.expectedTarget).toBe('/blog');
      });
    });

    it('should have year/month archive pattern test cases', () => {
      const archiveCases = patternCases.filter(c => /^\/\d{4}\/\d{2}/.test(c.source));
      expect(archiveCases.length).toBeGreaterThan(0);
      archiveCases.forEach(c => {
        expect(c.expectedTarget).toBe('/blog');
      });
    });

    it('should have city+service pattern test cases', () => {
      const cityServiceCases = patternCases.filter(c =>
        c.source.match(/^\/[a-z]+-(?:drain-cleaning|plumber|water-heater)/)
      );
      expect(cityServiceCases.length).toBeGreaterThan(0);

      // Should redirect to service area
      cityServiceCases.forEach(c => {
        expect(c.expectedTarget).toMatch(/^\/service-areas\/[a-z]+$/);
      });
    });

    it('should have author pattern test cases redirecting to /about', () => {
      const authorCases = patternCases.filter(c => c.source.includes('/author/'));
      expect(authorCases.length).toBeGreaterThan(0);
      authorCases.forEach(c => {
        expect(c.expectedTarget).toBe('/about');
      });
    });

    it('should have trailing slash normalization test cases', () => {
      const trailingSlashCases = patternCases.filter(c =>
        c.source.endsWith('/') && !c.source.includes('service-area') && !c.source.includes('blog/')
      );
      expect(trailingSlashCases.length).toBeGreaterThan(0);

      // Trailing slash should be removed
      trailingSlashCases.forEach(c => {
        expect(c.expectedTarget).not.toMatch(/\/$/);
      });
    });
  });

  describe('All Test Cases Coverage', () => {
    const allCases = getAllRedirectTestCases();

    it('should have significant number of test cases', () => {
      // We expect at least 50+ redirect mappings
      expect(allCases.length).toBeGreaterThan(50);
    });

    it('should not have duplicate sources', () => {
      const sources = allCases.map(c => c.source.toLowerCase());
      const uniqueSources = new Set(sources);
      expect(uniqueSources.size).toBe(sources.length);
    });

    it('should have valid target URLs', () => {
      allCases.forEach(c => {
        // Target should start with /
        expect(c.expectedTarget).toMatch(/^\//);
        // Target should not have trailing slash (except root)
        if (c.expectedTarget !== '/') {
          expect(c.expectedTarget).not.toMatch(/\/$/);
        }
      });
    });
  });

  describe('Middleware Behavior', () => {
    it('should export seoRedirectMiddleware function', () => {
      expect(typeof seoRedirectMiddleware).toBe('function');
    });
  });
});

describe('API Routes Protection', () => {
  it('should not redirect API routes', () => {
    const redirectMap = getRedirectMap();

    // Check that no redirect source starts with /api/
    const apiRedirects = Object.keys(redirectMap).filter(k => k.startsWith('/api/'));
    expect(apiRedirects).toHaveLength(0);
  });

  it('pattern test cases should not include API routes', () => {
    const patternCases = getPatternTestCases();
    const apiCases = patternCases.filter(c => c.source.startsWith('/api/'));
    expect(apiCases).toHaveLength(0);
  });
});

describe('Static Assets Protection', () => {
  it('should not have static asset paths in redirect map', () => {
    const redirectMap = getRedirectMap();

    const assetExtensions = ['.js', '.css', '.png', '.jpg', '.svg', '.ico', '.woff'];
    const assetRedirects = Object.keys(redirectMap).filter(k =>
      assetExtensions.some(ext => k.endsWith(ext))
    );

    expect(assetRedirects).toHaveLength(0);
  });
});

describe('Trailing Slash Normalization', () => {
  it('static redirects should handle both with and without trailing slash', () => {
    const redirectMap = getRedirectMap();

    // Check that we handle common variations
    const aboutRedirect = redirectMap['/about-us'] || redirectMap['/about-us/'];
    expect(aboutRedirect).toBe('/about');

    const contactRedirect = redirectMap['/contact-us'] || redirectMap['/contact-us/'];
    expect(contactRedirect).toBe('/contact');
  });

  it('target URLs should not have trailing slashes (except root)', () => {
    const redirectMap = getRedirectMap();

    Object.values(redirectMap).forEach(target => {
      if (target !== '/') {
        expect(target).not.toMatch(/\/$/);
      }
    });
  });
});
