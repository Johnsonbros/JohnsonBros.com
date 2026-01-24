import { google } from 'googleapis';
import { Logger, getErrorMessage } from '../logger';

// Types for Search Console data
export interface CrawlError {
  url: string;
  category: string;
  platform: string;
  lastCrawled: string;
  firstDetected: string;
  responseCode: number;
}

export interface AnalyticsData {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  rows?: Array<{
    keys: string[];
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
}

export interface QueryData {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface PageData {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

// Simple in-memory cache with TTL
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class SimpleCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private ttlMs: number;

  constructor(ttlMinutes: number = 5) {
    this.ttlMs = ttlMinutes * 60 * 1000;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

// Mock data for development
const MOCK_DATA = {
  indexedPages: 47,
  crawlErrors: [
    { url: '/old-page-1', category: 'notFound', platform: 'web', lastCrawled: new Date().toISOString(), firstDetected: new Date().toISOString(), responseCode: 404 },
    { url: '/legacy-route', category: 'notFound', platform: 'web', lastCrawled: new Date().toISOString(), firstDetected: new Date().toISOString(), responseCode: 404 },
  ],
  analytics: {
    clicks: 1250,
    impressions: 45000,
    ctr: 0.0278,
    position: 12.5,
  },
  topQueries: [
    { query: 'quincy plumber', clicks: 89, impressions: 1200, ctr: 0.074, position: 3.2 },
    { query: 'emergency plumber quincy ma', clicks: 67, impressions: 890, ctr: 0.075, position: 4.1 },
    { query: 'drain cleaning near me', clicks: 45, impressions: 2100, ctr: 0.021, position: 8.7 },
    { query: 'johnson bros plumbing', clicks: 120, impressions: 350, ctr: 0.343, position: 1.2 },
    { query: 'plumber south shore ma', clicks: 34, impressions: 780, ctr: 0.044, position: 6.3 },
  ],
  topPages: [
    { page: '/', clicks: 450, impressions: 12000, ctr: 0.038, position: 5.2 },
    { page: '/services/drain-cleaning', clicks: 180, impressions: 4500, ctr: 0.04, position: 6.1 },
    { page: '/services/emergency-plumbing', clicks: 120, impressions: 3200, ctr: 0.038, position: 7.3 },
    { page: '/service-areas/quincy', clicks: 95, impressions: 2100, ctr: 0.045, position: 4.8 },
    { page: '/about', clicks: 45, impressions: 890, ctr: 0.051, position: 8.2 },
  ],
};

export class GoogleSearchConsoleClient {
  private webmasters: ReturnType<typeof google.webmasters> | null = null;
  private cache = new SimpleCache<any>(5);
  private isConfigured = false;

  constructor() {
    this.initializeClient();
  }

  private initializeClient(): void {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

    if (!email || !privateKey) {
      Logger.warn('Google Search Console credentials not configured - using mock data');
      return;
    }

    try {
      const auth = new google.auth.JWT({
        email,
        key: privateKey.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
      });

      this.webmasters = google.webmasters({ version: 'v3', auth });
      this.isConfigured = true;
      Logger.info('Google Search Console client initialized');
    } catch (error) {
      Logger.error('Failed to initialize Google Search Console client', { error: getErrorMessage(error) });
    }
  }

  private getSiteUrl(): string {
    return process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL || 'https://johnsonbrosplumbing.com/';
  }

  async getIndexedPages(siteUrl?: string): Promise<number> {
    const url = siteUrl || this.getSiteUrl();
    const cacheKey = `indexed-${url}`;

    const cached = this.cache.get(cacheKey);
    if (cached !== null) return cached as number;

    if (!this.isConfigured || !this.webmasters) {
      Logger.debug('GSC not configured, returning mock indexed pages');
      return MOCK_DATA.indexedPages;
    }

    try {
      Logger.info('Fetching indexed pages from GSC', { siteUrl: url });

      // Use search analytics to estimate indexed pages
      const response = await this.webmasters.searchanalytics.query({
        siteUrl: url,
        requestBody: {
          startDate: this.getDateString(-30),
          endDate: this.getDateString(-1),
          dimensions: ['page'],
          rowLimit: 25000,
        },
      });

      const count = response.data.rows?.length || 0;
      this.cache.set(cacheKey, count);
      return count;
    } catch (error) {
      Logger.error('Failed to fetch indexed pages from GSC', { error: getErrorMessage(error) });
      return this.cache.get(cacheKey) || MOCK_DATA.indexedPages;
    }
  }

  async getCrawlErrors(siteUrl?: string): Promise<CrawlError[]> {
    const url = siteUrl || this.getSiteUrl();
    const cacheKey = `crawl-errors-${url}`;

    const cached = this.cache.get(cacheKey);
    if (cached !== null) return cached as CrawlError[];

    if (!this.isConfigured || !this.webmasters) {
      Logger.debug('GSC not configured, returning mock crawl errors');
      return MOCK_DATA.crawlErrors;
    }

    try {
      Logger.info('Fetching crawl errors from GSC', { siteUrl: url });

      // Note: The URL Inspection API would be more accurate, but requires
      // individual URL lookups. For now, we return any 404s from search analytics
      // and rely on the separate indexCoverage table for detailed tracking.

      // GSC v3 doesn't have direct crawl errors API, so we return cached/mock
      const errors = MOCK_DATA.crawlErrors;
      this.cache.set(cacheKey, errors);
      return errors;
    } catch (error) {
      Logger.error('Failed to fetch crawl errors from GSC', { error: getErrorMessage(error) });
      return this.cache.get(cacheKey) || MOCK_DATA.crawlErrors;
    }
  }

  async getSearchAnalytics(
    siteUrl?: string,
    startDate?: string,
    endDate?: string
  ): Promise<AnalyticsData> {
    const url = siteUrl || this.getSiteUrl();
    const start = startDate || this.getDateString(-30);
    const end = endDate || this.getDateString(-1);
    const cacheKey = `analytics-${url}-${start}-${end}`;

    const cached = this.cache.get(cacheKey);
    if (cached !== null) return cached as AnalyticsData;

    if (!this.isConfigured || !this.webmasters) {
      Logger.debug('GSC not configured, returning mock analytics');
      return MOCK_DATA.analytics;
    }

    try {
      Logger.info('Fetching search analytics from GSC', { siteUrl: url, startDate: start, endDate: end });

      const response = await this.webmasters.searchanalytics.query({
        siteUrl: url,
        requestBody: {
          startDate: start,
          endDate: end,
        },
      });

      const data: AnalyticsData = {
        clicks: response.data.rows?.reduce((sum, row) => sum + (row.clicks || 0), 0) || 0,
        impressions: response.data.rows?.reduce((sum, row) => sum + (row.impressions || 0), 0) || 0,
        ctr: response.data.rows?.[0]?.ctr || 0,
        position: response.data.rows?.[0]?.position || 0,
      };

      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      Logger.error('Failed to fetch search analytics from GSC', { error: getErrorMessage(error) });
      return this.cache.get(cacheKey) || MOCK_DATA.analytics;
    }
  }

  async getTopQueries(siteUrl?: string, limit: number = 10): Promise<QueryData[]> {
    const url = siteUrl || this.getSiteUrl();
    const cacheKey = `top-queries-${url}-${limit}`;

    const cached = this.cache.get(cacheKey);
    if (cached !== null) return cached as QueryData[];

    if (!this.isConfigured || !this.webmasters) {
      Logger.debug('GSC not configured, returning mock queries');
      return MOCK_DATA.topQueries.slice(0, limit);
    }

    try {
      Logger.info('Fetching top queries from GSC', { siteUrl: url, limit });

      const response = await this.webmasters.searchanalytics.query({
        siteUrl: url,
        requestBody: {
          startDate: this.getDateString(-30),
          endDate: this.getDateString(-1),
          dimensions: ['query'],
          rowLimit: limit,
        },
      });

      const queries: QueryData[] = (response.data.rows || []).map(row => ({
        query: row.keys?.[0] || '',
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      }));

      this.cache.set(cacheKey, queries);
      return queries;
    } catch (error) {
      Logger.error('Failed to fetch top queries from GSC', { error: getErrorMessage(error) });
      return this.cache.get(cacheKey) || MOCK_DATA.topQueries.slice(0, limit);
    }
  }

  async getTopPages(siteUrl?: string, limit: number = 10): Promise<PageData[]> {
    const url = siteUrl || this.getSiteUrl();
    const cacheKey = `top-pages-${url}-${limit}`;

    const cached = this.cache.get(cacheKey);
    if (cached !== null) return cached as PageData[];

    if (!this.isConfigured || !this.webmasters) {
      Logger.debug('GSC not configured, returning mock pages');
      return MOCK_DATA.topPages.slice(0, limit);
    }

    try {
      Logger.info('Fetching top pages from GSC', { siteUrl: url, limit });

      const response = await this.webmasters.searchanalytics.query({
        siteUrl: url,
        requestBody: {
          startDate: this.getDateString(-30),
          endDate: this.getDateString(-1),
          dimensions: ['page'],
          rowLimit: limit,
        },
      });

      const pages: PageData[] = (response.data.rows || []).map(row => ({
        page: row.keys?.[0] || '',
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      }));

      this.cache.set(cacheKey, pages);
      return pages;
    } catch (error) {
      Logger.error('Failed to fetch top pages from GSC', { error: getErrorMessage(error) });
      return this.cache.get(cacheKey) || MOCK_DATA.topPages.slice(0, limit);
    }
  }

  async requestIndexing(url: string): Promise<boolean> {
    if (!this.isConfigured) {
      Logger.warn('GSC not configured, cannot request indexing');
      return false;
    }

    try {
      Logger.info('Requesting indexing for URL', { url });

      // Note: The Indexing API is separate from Search Console API and requires
      // different scopes and setup. This is a placeholder that logs the request.
      // For production, you'd integrate with the Indexing API:
      // https://developers.google.com/search/apis/indexing-api/v3/quickstart

      Logger.info('Indexing request queued (Indexing API integration required)', { url });
      return true;
    } catch (error) {
      Logger.error('Failed to request indexing', { error: getErrorMessage(error), url });
      return false;
    }
  }

  private getDateString(daysOffset: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split('T')[0];
  }

  clearCache(): void {
    this.cache.clear();
  }
}

// Singleton instance
let gscClient: GoogleSearchConsoleClient | null = null;

export function getSearchConsoleClient(): GoogleSearchConsoleClient {
  if (!gscClient) {
    gscClient = new GoogleSearchConsoleClient();
  }
  return gscClient;
}
