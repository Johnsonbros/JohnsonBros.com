import { google, Auth } from 'googleapis';
import { Logger, getErrorMessage } from '../logger';

// My Business API v4 base URL for operations not in googleapis
const MY_BUSINESS_API_BASE = 'https://mybusiness.googleapis.com/v4';

// Types for GMB data
export interface GmbLocation {
  name: string; // locations/{locationId}
  title: string;
  address: string;
  phoneNumber: string;
  websiteUrl: string;
}

export interface GmbReviewData {
  reviewId: string;
  reviewer: {
    displayName: string;
    profilePhotoUrl?: string;
  };
  starRating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE';
  comment?: string;
  createTime: string;
  updateTime: string;
  reviewReply?: {
    comment: string;
    updateTime: string;
  };
}

export interface GmbPostData {
  name?: string; // locations/{locationId}/localPosts/{postId}
  languageCode?: string;
  summary: string;
  callToAction?: {
    actionType: 'BOOK' | 'ORDER' | 'SHOP' | 'LEARN_MORE' | 'SIGN_UP' | 'CALL';
    url?: string;
  };
  media?: Array<{
    mediaFormat: 'PHOTO' | 'VIDEO';
    sourceUrl: string;
  }>;
  topicType?: 'STANDARD' | 'EVENT' | 'OFFER';
  event?: {
    title: string;
    schedule: {
      startDate: { year: number; month: number; day: number };
      endDate: { year: number; month: number; day: number };
    };
  };
  offer?: {
    couponCode?: string;
    redeemOnlineUrl?: string;
    termsConditions?: string;
  };
}

export interface MediaUploadResult {
  mediaKey: string;
  googleUrl: string;
}

// Simple in-memory cache
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
  location: {
    name: 'locations/12345678901234567890',
    title: 'Johnson Bros Plumbing & Drain Cleaning',
    address: '123 Main St, Quincy, MA 02169',
    phoneNumber: '+16175551234',
    websiteUrl: 'https://johnsonbrosplumbing.com',
  },
  reviews: [
    {
      reviewId: 'review-1',
      reviewer: { displayName: 'John D.', profilePhotoUrl: undefined },
      starRating: 'FIVE' as const,
      comment: 'Excellent service! Fixed my drain quickly and professionally. Highly recommend!',
      createTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updateTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      reviewId: 'review-2',
      reviewer: { displayName: 'Sarah M.' },
      starRating: 'FOUR' as const,
      comment: 'Good work, arrived on time. A bit pricey but quality service.',
      createTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updateTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      reviewId: 'review-3',
      reviewer: { displayName: 'Mike R.' },
      starRating: 'FIVE' as const,
      comment: 'The team was fantastic. They explained everything and cleaned up after themselves.',
      createTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updateTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      reviewReply: {
        comment: 'Thank you so much Mike! We appreciate your kind words and look forward to serving you again.',
        updateTime: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      },
    },
  ],
  posts: [
    {
      name: 'locations/12345/localPosts/post-1',
      summary: 'Spring special! 20% off drain cleaning services this month.',
      topicType: 'OFFER' as const,
      createTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

export class GoogleMyBusinessClient {
  private auth: Auth.JWT | null = null;
  private accountId: string | null = null;
  private locationId: string | null = null;
  private cache = new SimpleCache<any>(5);
  private isConfigured = false;

  constructor() {
    this.initializeClient();
  }

  private async initializeClient(): Promise<void> {
    const email = process.env.GMB_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GMB_SERVICE_ACCOUNT_PRIVATE_KEY;
    this.accountId = process.env.GMB_ACCOUNT_ID || null;
    this.locationId = process.env.GMB_LOCATION_ID || null;

    if (!email || !privateKey) {
      Logger.warn('Google My Business credentials not configured - using mock data');
      return;
    }

    try {
      this.auth = new google.auth.JWT({
        email,
        key: privateKey.replace(/\\n/g, '\n'),
        scopes: [
          'https://www.googleapis.com/auth/business.manage',
        ],
      });

      // Note: The My Business API requires OAuth2 with user consent for most operations
      // Service accounts can only be used with domain-wide delegation
      // For production, you'll need OAuth2 flow or proper domain delegation setup

      this.isConfigured = true;
      Logger.info('Google My Business client initialized');
    } catch (error) {
      Logger.error('Failed to initialize Google My Business client', { error: getErrorMessage(error) });
    }
  }

  /**
   * Make an authenticated request to the My Business API v4
   */
  private async makeApiRequest<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    endpoint: string,
    body?: any
  ): Promise<T> {
    if (!this.auth) {
      throw new Error('GMB auth not initialized');
    }

    const token = await this.auth.getAccessToken();
    if (!token.token) {
      throw new Error('Failed to get access token');
    }

    const url = `${MY_BUSINESS_API_BASE}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${token.token}`,
        'Content-Type': 'application/json',
      },
    };

    if (body && (method === 'POST' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GMB API error (${response.status}): ${errorText}`);
    }

    // Handle empty responses (e.g., DELETE)
    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    return JSON.parse(text) as T;
  }

  private getLocationPath(): string {
    if (this.accountId && this.locationId) {
      return `accounts/${this.accountId}/locations/${this.locationId}`;
    }
    return MOCK_DATA.location.name;
  }

  // ============================================
  // LOCATION METHODS
  // ============================================

  async getLocation(): Promise<GmbLocation> {
    const cacheKey = 'location';
    const cached = this.cache.get(cacheKey);
    if (cached) return cached as GmbLocation;

    if (!this.isConfigured) {
      Logger.debug('GMB not configured, returning mock location');
      return MOCK_DATA.location;
    }

    try {
      Logger.info('Fetching GMB location');

      const response = await this.makeApiRequest<{
        name?: string;
        title?: string;
        storefrontAddress?: any;
        phoneNumbers?: { primaryPhone?: string };
        websiteUri?: string;
      }>('GET', `/${this.getLocationPath()}`);

      const location: GmbLocation = {
        name: response.name || '',
        title: response.title || '',
        address: this.formatAddress(response.storefrontAddress),
        phoneNumber: response.phoneNumbers?.primaryPhone || '',
        websiteUrl: response.websiteUri || '',
      };

      this.cache.set(cacheKey, location);
      return location;
    } catch (error) {
      Logger.error('Failed to fetch GMB location', { error: getErrorMessage(error) });
      return MOCK_DATA.location;
    }
  }

  private formatAddress(address: any): string {
    if (!address) return '';
    const parts = [
      address.addressLines?.join(', '),
      address.locality,
      address.administrativeArea,
      address.postalCode,
    ].filter(Boolean);
    return parts.join(', ');
  }

  // ============================================
  // REVIEW METHODS
  // ============================================

  async getReviews(pageSize: number = 50): Promise<GmbReviewData[]> {
    const cacheKey = `reviews-${pageSize}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached as GmbReviewData[];

    if (!this.isConfigured) {
      Logger.debug('GMB not configured, returning mock reviews');
      return MOCK_DATA.reviews;
    }

    try {
      Logger.info('Fetching GMB reviews', { pageSize });

      const response = await this.makeApiRequest<{ reviews?: any[] }>(
        'GET',
        `/${this.getLocationPath()}/reviews?pageSize=${pageSize}`
      );

      const reviews: GmbReviewData[] = (response.reviews || []).map((review: any) => ({
        reviewId: review.reviewId,
        reviewer: {
          displayName: review.reviewer?.displayName || 'Anonymous',
          profilePhotoUrl: review.reviewer?.profilePhotoUrl,
        },
        starRating: review.starRating,
        comment: review.comment,
        createTime: review.createTime,
        updateTime: review.updateTime,
        reviewReply: review.reviewReply ? {
          comment: review.reviewReply.comment,
          updateTime: review.reviewReply.updateTime,
        } : undefined,
      }));

      this.cache.set(cacheKey, reviews);
      return reviews;
    } catch (error) {
      Logger.error('Failed to fetch GMB reviews', { error: getErrorMessage(error) });
      return MOCK_DATA.reviews;
    }
  }

  async replyToReview(reviewId: string, replyText: string): Promise<boolean> {
    if (!this.isConfigured) {
      Logger.warn('GMB not configured, cannot reply to review');
      return false;
    }

    try {
      Logger.info('Replying to GMB review', { reviewId });

      await this.makeApiRequest(
        'PATCH',
        `/${this.getLocationPath()}/reviews/${reviewId}/reply`,
        { comment: replyText }
      );

      // Clear cache to refresh reviews
      this.cache.clear();

      Logger.info('Successfully replied to GMB review', { reviewId });
      return true;
    } catch (error) {
      Logger.error('Failed to reply to GMB review', { error: getErrorMessage(error), reviewId });
      return false;
    }
  }

  async deleteReviewReply(reviewId: string): Promise<boolean> {
    if (!this.isConfigured) {
      Logger.warn('GMB not configured, cannot delete reply');
      return false;
    }

    try {
      Logger.info('Deleting GMB review reply', { reviewId });

      await this.makeApiRequest(
        'DELETE',
        `/${this.getLocationPath()}/reviews/${reviewId}/reply`
      );

      this.cache.clear();

      Logger.info('Successfully deleted GMB review reply', { reviewId });
      return true;
    } catch (error) {
      Logger.error('Failed to delete GMB review reply', { error: getErrorMessage(error), reviewId });
      return false;
    }
  }

  // ============================================
  // POST METHODS
  // ============================================

  async getPosts(pageSize: number = 20): Promise<any[]> {
    const cacheKey = `posts-${pageSize}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached as any[];

    if (!this.isConfigured) {
      Logger.debug('GMB not configured, returning mock posts');
      return MOCK_DATA.posts;
    }

    try {
      Logger.info('Fetching GMB posts', { pageSize });

      const response = await this.makeApiRequest<{ localPosts?: any[] }>(
        'GET',
        `/${this.getLocationPath()}/localPosts?pageSize=${pageSize}`
      );

      const posts = response.localPosts || [];
      this.cache.set(cacheKey, posts);
      return posts;
    } catch (error) {
      Logger.error('Failed to fetch GMB posts', { error: getErrorMessage(error) });
      return MOCK_DATA.posts;
    }
  }

  async createPost(post: GmbPostData): Promise<{ success: boolean; postId?: string; error?: string }> {
    if (!this.isConfigured) {
      Logger.warn('GMB not configured, cannot create post');
      // For development, simulate success
      return {
        success: true,
        postId: `mock-post-${Date.now()}`,
      };
    }

    try {
      Logger.info('Creating GMB post', { topicType: post.topicType });

      const response = await this.makeApiRequest<{ name?: string }>(
        'POST',
        `/${this.getLocationPath()}/localPosts`,
        {
          languageCode: post.languageCode || 'en',
          summary: post.summary,
          callToAction: post.callToAction,
          media: post.media,
          topicType: post.topicType || 'STANDARD',
          event: post.event,
          offer: post.offer,
        }
      );

      this.cache.clear();

      const postId = response.name?.split('/').pop();
      Logger.info('Successfully created GMB post', { postId });

      return { success: true, postId };
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      Logger.error('Failed to create GMB post', { error: errorMsg });
      return { success: false, error: errorMsg };
    }
  }

  async deletePost(postId: string): Promise<boolean> {
    if (!this.isConfigured) {
      Logger.warn('GMB not configured, cannot delete post');
      return false;
    }

    try {
      Logger.info('Deleting GMB post', { postId });

      await this.makeApiRequest(
        'DELETE',
        `/${this.getLocationPath()}/localPosts/${postId}`
      );

      this.cache.clear();

      Logger.info('Successfully deleted GMB post', { postId });
      return true;
    } catch (error) {
      Logger.error('Failed to delete GMB post', { error: getErrorMessage(error), postId });
      return false;
    }
  }

  // ============================================
  // MEDIA/PHOTO METHODS
  // ============================================

  async uploadMedia(imageUrl: string, category: string = 'ADDITIONAL'): Promise<MediaUploadResult | null> {
    if (!this.isConfigured) {
      Logger.warn('GMB not configured, cannot upload media');
      // Return mock result for development
      return {
        mediaKey: `mock-media-${Date.now()}`,
        googleUrl: imageUrl,
      };
    }

    try {
      Logger.info('Uploading media to GMB', { category });

      const response = await this.makeApiRequest<{ name?: string; googleUrl?: string }>(
        'POST',
        `/${this.getLocationPath()}/media`,
        {
          mediaFormat: 'PHOTO',
          locationAssociation: {
            category,
          },
          sourceUrl: imageUrl,
        }
      );

      const mediaKey = response.name?.split('/').pop() || '';
      const googleUrl = response.googleUrl || imageUrl;

      Logger.info('Successfully uploaded media to GMB', { mediaKey });

      return { mediaKey, googleUrl };
    } catch (error) {
      Logger.error('Failed to upload media to GMB', { error: getErrorMessage(error) });
      return null;
    }
  }

  async deleteMedia(mediaKey: string): Promise<boolean> {
    if (!this.isConfigured) {
      Logger.warn('GMB not configured, cannot delete media');
      return false;
    }

    try {
      Logger.info('Deleting media from GMB', { mediaKey });

      await this.makeApiRequest(
        'DELETE',
        `/${this.getLocationPath()}/media/${mediaKey}`
      );

      Logger.info('Successfully deleted media from GMB', { mediaKey });
      return true;
    } catch (error) {
      Logger.error('Failed to delete media from GMB', { error: getErrorMessage(error), mediaKey });
      return false;
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  starRatingToNumber(rating: string): number {
    const map: Record<string, number> = {
      'ONE': 1,
      'TWO': 2,
      'THREE': 3,
      'FOUR': 4,
      'FIVE': 5,
    };
    return map[rating] || 0;
  }

  numberToStarRating(num: number): string {
    const map: Record<number, string> = {
      1: 'ONE',
      2: 'TWO',
      3: 'THREE',
      4: 'FOUR',
      5: 'FIVE',
    };
    return map[num] || 'FIVE';
  }

  isConfiguredForApi(): boolean {
    return this.isConfigured;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

// Singleton instance
let gmbClient: GoogleMyBusinessClient | null = null;

export function getGmbClient(): GoogleMyBusinessClient {
  if (!gmbClient) {
    gmbClient = new GoogleMyBusinessClient();
  }
  return gmbClient;
}
