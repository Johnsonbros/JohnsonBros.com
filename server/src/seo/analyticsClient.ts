import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { Logger, getErrorMessage } from '../logger';

// Types for Analytics data
export interface TrafficData {
  organic: number;
  direct: number;
  referral: number;
  social: number;
  paid: number;
  other: number;
  total: number;
}

export interface LandingPageData {
  page: string;
  sessions: number;
  users: number;
  bounceRate: number;
  avgSessionDuration: number;
  isNew?: boolean;
}

export interface ConversionData {
  eventName: string;
  count: number;
  value: number;
}

export interface OrganicData {
  sessions: number;
  users: number;
  newUsers: number;
  bounceRate: number;
  avgSessionDuration: number;
  pageviews: number;
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
  realTimeUsers: 3,
  traffic: {
    organic: 450,
    direct: 280,
    referral: 120,
    social: 45,
    paid: 180,
    other: 25,
    total: 1100,
  },
  landingPages: [
    { page: '/', sessions: 450, users: 380, bounceRate: 0.42, avgSessionDuration: 125, isNew: false },
    { page: '/services/drain-cleaning', sessions: 180, users: 165, bounceRate: 0.38, avgSessionDuration: 98, isNew: false },
    { page: '/services/emergency-plumbing', sessions: 120, users: 105, bounceRate: 0.35, avgSessionDuration: 145, isNew: false },
    { page: '/service-areas/quincy', sessions: 95, users: 88, bounceRate: 0.45, avgSessionDuration: 85, isNew: true },
    { page: '/about', sessions: 45, users: 42, bounceRate: 0.55, avgSessionDuration: 65, isNew: false },
  ],
  conversions: [
    { eventName: 'contact_form_submit', count: 45, value: 4500 },
    { eventName: 'phone_click', count: 89, value: 0 },
    { eventName: 'booking_started', count: 67, value: 0 },
    { eventName: 'booking_completed', count: 34, value: 6800 },
  ],
  organic: {
    sessions: 450,
    users: 380,
    newUsers: 320,
    bounceRate: 0.42,
    avgSessionDuration: 125,
    pageviews: 890,
  },
};

export class GoogleAnalyticsClient {
  private analyticsClient: BetaAnalyticsDataClient | null = null;
  private propertyId: string | null = null;
  private cache = new SimpleCache<any>(5);
  private isConfigured = false;

  constructor() {
    this.initializeClient();
  }

  private initializeClient(): void {
    const propertyId = process.env.GA4_PROPERTY_ID;
    const email = process.env.GA4_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GA4_SERVICE_ACCOUNT_PRIVATE_KEY;

    if (!propertyId || !email || !privateKey) {
      Logger.warn('Google Analytics 4 credentials not configured - using mock data');
      return;
    }

    try {
      this.analyticsClient = new BetaAnalyticsDataClient({
        credentials: {
          client_email: email,
          private_key: privateKey.replace(/\\n/g, '\n'),
        },
      });

      this.propertyId = propertyId;
      this.isConfigured = true;
      Logger.info('Google Analytics 4 client initialized', { propertyId });
    } catch (error) {
      Logger.error('Failed to initialize Google Analytics 4 client', { error: getErrorMessage(error) });
    }
  }

  private getPropertyPath(): string {
    return `properties/${this.propertyId}`;
  }

  async getRealTimeUsers(): Promise<number> {
    const cacheKey = 'realtime-users';

    const cached = this.cache.get(cacheKey);
    if (cached !== null) return cached as number;

    if (!this.isConfigured || !this.analyticsClient || !this.propertyId) {
      Logger.debug('GA4 not configured, returning mock realtime users');
      return MOCK_DATA.realTimeUsers;
    }

    try {
      Logger.info('Fetching real-time users from GA4');

      const [response] = await this.analyticsClient.runRealtimeReport({
        property: this.getPropertyPath(),
        metrics: [{ name: 'activeUsers' }],
      });

      const count = parseInt(response.rows?.[0]?.metricValues?.[0]?.value || '0', 10);
      this.cache.set(cacheKey, count);
      return count;
    } catch (error) {
      Logger.error('Failed to fetch real-time users from GA4', { error: getErrorMessage(error) });
      return this.cache.get(cacheKey) || MOCK_DATA.realTimeUsers;
    }
  }

  async getTrafficBySource(startDate: string, endDate: string): Promise<TrafficData> {
    const cacheKey = `traffic-${startDate}-${endDate}`;

    const cached = this.cache.get(cacheKey);
    if (cached !== null) return cached as TrafficData;

    if (!this.isConfigured || !this.analyticsClient || !this.propertyId) {
      Logger.debug('GA4 not configured, returning mock traffic data');
      return MOCK_DATA.traffic;
    }

    try {
      Logger.info('Fetching traffic by source from GA4', { startDate, endDate });

      const [response] = await this.analyticsClient.runReport({
        property: this.getPropertyPath(),
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [{ name: 'sessions' }],
      });

      const traffic: TrafficData = {
        organic: 0,
        direct: 0,
        referral: 0,
        social: 0,
        paid: 0,
        other: 0,
        total: 0,
      };

      for (const row of response.rows || []) {
        const channel = row.dimensionValues?.[0]?.value?.toLowerCase() || '';
        const sessions = parseInt(row.metricValues?.[0]?.value || '0', 10);
        traffic.total += sessions;

        if (channel.includes('organic')) {
          traffic.organic += sessions;
        } else if (channel === 'direct') {
          traffic.direct += sessions;
        } else if (channel === 'referral') {
          traffic.referral += sessions;
        } else if (channel.includes('social')) {
          traffic.social += sessions;
        } else if (channel.includes('paid') || channel.includes('display')) {
          traffic.paid += sessions;
        } else {
          traffic.other += sessions;
        }
      }

      this.cache.set(cacheKey, traffic);
      return traffic;
    } catch (error) {
      Logger.error('Failed to fetch traffic from GA4', { error: getErrorMessage(error) });
      return this.cache.get(cacheKey) || MOCK_DATA.traffic;
    }
  }

  async getTopLandingPages(
    startDate: string,
    endDate: string,
    limit: number = 10
  ): Promise<LandingPageData[]> {
    const cacheKey = `landing-pages-${startDate}-${endDate}-${limit}`;

    const cached = this.cache.get(cacheKey);
    if (cached !== null) return cached as LandingPageData[];

    if (!this.isConfigured || !this.analyticsClient || !this.propertyId) {
      Logger.debug('GA4 not configured, returning mock landing pages');
      return MOCK_DATA.landingPages.slice(0, limit);
    }

    try {
      Logger.info('Fetching top landing pages from GA4', { startDate, endDate, limit });

      const [response] = await this.analyticsClient.runReport({
        property: this.getPropertyPath(),
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'landingPage' }],
        metrics: [
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
        ],
        limit,
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      });

      const pages: LandingPageData[] = (response.rows || []).map(row => ({
        page: row.dimensionValues?.[0]?.value || '',
        sessions: parseInt(row.metricValues?.[0]?.value || '0', 10),
        users: parseInt(row.metricValues?.[1]?.value || '0', 10),
        bounceRate: parseFloat(row.metricValues?.[2]?.value || '0'),
        avgSessionDuration: parseFloat(row.metricValues?.[3]?.value || '0'),
      }));

      this.cache.set(cacheKey, pages);
      return pages;
    } catch (error) {
      Logger.error('Failed to fetch landing pages from GA4', { error: getErrorMessage(error) });
      return this.cache.get(cacheKey) || MOCK_DATA.landingPages.slice(0, limit);
    }
  }

  async getConversionEvents(startDate: string, endDate: string): Promise<ConversionData[]> {
    const cacheKey = `conversions-${startDate}-${endDate}`;

    const cached = this.cache.get(cacheKey);
    if (cached !== null) return cached as ConversionData[];

    if (!this.isConfigured || !this.analyticsClient || !this.propertyId) {
      Logger.debug('GA4 not configured, returning mock conversions');
      return MOCK_DATA.conversions;
    }

    try {
      Logger.info('Fetching conversion events from GA4', { startDate, endDate });

      const [response] = await this.analyticsClient.runReport({
        property: this.getPropertyPath(),
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'eventName' }],
        metrics: [
          { name: 'eventCount' },
          { name: 'eventValue' },
        ],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            inListFilter: {
              values: [
                'contact_form_submit',
                'phone_click',
                'booking_started',
                'booking_completed',
                'generate_lead',
                'purchase',
              ],
            },
          },
        },
      });

      const conversions: ConversionData[] = (response.rows || []).map(row => ({
        eventName: row.dimensionValues?.[0]?.value || '',
        count: parseInt(row.metricValues?.[0]?.value || '0', 10),
        value: parseFloat(row.metricValues?.[1]?.value || '0'),
      }));

      this.cache.set(cacheKey, conversions);
      return conversions;
    } catch (error) {
      Logger.error('Failed to fetch conversions from GA4', { error: getErrorMessage(error) });
      return this.cache.get(cacheKey) || MOCK_DATA.conversions;
    }
  }

  async getOrganicTraffic(startDate: string, endDate: string): Promise<OrganicData> {
    const cacheKey = `organic-${startDate}-${endDate}`;

    const cached = this.cache.get(cacheKey);
    if (cached !== null) return cached as OrganicData;

    if (!this.isConfigured || !this.analyticsClient || !this.propertyId) {
      Logger.debug('GA4 not configured, returning mock organic data');
      return MOCK_DATA.organic;
    }

    try {
      Logger.info('Fetching organic traffic from GA4', { startDate, endDate });

      const [response] = await this.analyticsClient.runReport({
        property: this.getPropertyPath(),
        dateRanges: [{ startDate, endDate }],
        metrics: [
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'newUsers' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
          { name: 'screenPageViews' },
        ],
        dimensionFilter: {
          filter: {
            fieldName: 'sessionDefaultChannelGroup',
            stringFilter: {
              matchType: 'CONTAINS',
              value: 'Organic',
              caseSensitive: false,
            },
          },
        },
      });

      const row = response.rows?.[0];
      const organic: OrganicData = {
        sessions: parseInt(row?.metricValues?.[0]?.value || '0', 10),
        users: parseInt(row?.metricValues?.[1]?.value || '0', 10),
        newUsers: parseInt(row?.metricValues?.[2]?.value || '0', 10),
        bounceRate: parseFloat(row?.metricValues?.[3]?.value || '0'),
        avgSessionDuration: parseFloat(row?.metricValues?.[4]?.value || '0'),
        pageviews: parseInt(row?.metricValues?.[5]?.value || '0', 10),
      };

      this.cache.set(cacheKey, organic);
      return organic;
    } catch (error) {
      Logger.error('Failed to fetch organic traffic from GA4', { error: getErrorMessage(error) });
      return this.cache.get(cacheKey) || MOCK_DATA.organic;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}

// Singleton instance
let gaClient: GoogleAnalyticsClient | null = null;

export function getAnalyticsClient(): GoogleAnalyticsClient {
  if (!gaClient) {
    gaClient = new GoogleAnalyticsClient();
  }
  return gaClient;
}
