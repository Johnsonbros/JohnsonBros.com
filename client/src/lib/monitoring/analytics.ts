import { sentryClient } from './sentry';

// Extend Window for analytics globals
declare global {
  interface Window {
    gtag?: ((...args: any[]) => void) | undefined;
    dataLayer?: any[] | undefined;
  }
}

interface EventProperties {
  [key: string]: string | number | boolean | undefined;
}

interface UserProperties {
  user_id?: string;
  user_type?: 'customer' | 'admin' | 'tech' | 'guest';
  subscription_tier?: string;
  customer_value?: number;
  service_area?: string;
  [key: string]: string | number | boolean | undefined;
}

interface ConversionEvent {
  transaction_id: string;
  value: number;
  currency?: string;
  items?: Array<{
    item_id: string;
    item_name: string;
    price: number;
    quantity: number;
  }>;
}

class GoogleAnalytics {
  private static instance: GoogleAnalytics;
  private initialized = false;
  private measurementId: string;
  private debugMode = false;
  private userProperties: UserProperties = {};
  private sessionStartTime: number = Date.now();

  private constructor() {
    this.measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID || '';
    this.debugMode = import.meta.env.VITE_GA_DEBUG === 'true';
  }

  static getInstance(): GoogleAnalytics {
    if (!GoogleAnalytics.instance) {
      GoogleAnalytics.instance = new GoogleAnalytics();
    }
    return GoogleAnalytics.instance;
  }

  initialize() {
    if (this.initialized || !this.measurementId) {
      return;
    }

    // Load Google Analytics script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
    document.head.appendChild(script);

    // Initialize dataLayer and gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer?.push(arguments);
    };

    // Configure GA4
    window.gtag('js', new Date());
    window.gtag('config', this.measurementId, {
      debug_mode: this.debugMode,
      send_page_view: false, // We'll send page views manually for better control
      custom_map: {
        dimension1: 'user_type',
        dimension2: 'subscription_tier',
        dimension3: 'service_area',
        dimension4: 'booking_type',
        dimension5: 'referral_source'
      }
    });

    // Set initial user properties
    this.setUserProperties(this.userProperties);

    this.initialized = true;
    console.log('[Analytics] Google Analytics 4 initialized');
    
    // Track initial page view
    this.trackPageView();
  }

  // Set user properties for better segmentation
  setUserProperties(properties: UserProperties) {
    this.userProperties = { ...this.userProperties, ...properties };
    
    if (this.initialized && window.gtag) {
      window.gtag('set', 'user_properties', this.userProperties);
    }
  }

  // Track page views
  trackPageView(pagePath?: string, pageTitle?: string) {
    if (!this.initialized || !window.gtag) return;

    const params: any = {
      page_path: pagePath || window.location.pathname,
      page_title: pageTitle || document.title,
      page_location: window.location.href,
      send_to: this.measurementId
    };

    window.gtag('event', 'page_view', params);

    if (this.debugMode) {
      console.log('[Analytics] Page view tracked:', params);
    }
  }

  // Track custom events
  trackEvent(eventName: string, properties?: EventProperties) {
    if (!this.initialized || !window.gtag) return;

    window.gtag('event', eventName, {
      ...properties,
      send_to: this.measurementId
    });

    if (this.debugMode) {
      console.log('[Analytics] Event tracked:', eventName, properties);
    }

    // Also add as Sentry breadcrumb for debugging
    sentryClient.addBreadcrumb({
      message: `Analytics Event: ${eventName}`,
      category: 'analytics',
      level: 'info',
      data: properties
    });
  }

  // Track booking events (key conversion)
  trackBooking(bookingData: {
    bookingId: string;
    serviceType: string;
    value: number;
    bookingType: 'ai' | 'traditional' | 'express';
    timePreference?: string;
    customerId?: string;
    variantId?: string;
    testId?: string;
  }) {
    this.trackEvent('booking_completed', {
      transaction_id: bookingData.bookingId,
      value: bookingData.value,
      currency: 'USD',
      service_type: bookingData.serviceType,
      booking_type: bookingData.bookingType,
      time_preference: bookingData.timePreference,
      customer_id: bookingData.customerId,
      ab_test_id: bookingData.testId,
      ab_variant_id: bookingData.variantId
    });

    // Track enhanced e-commerce conversion
    if (window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: bookingData.bookingId,
        value: bookingData.value,
        currency: 'USD',
        items: [{
          item_id: bookingData.serviceType,
          item_name: bookingData.serviceType,
          price: bookingData.value,
          quantity: 1,
          item_category: 'service'
        }]
      });
    }

    // Track conversion funnel step
    this.trackFunnelStep('booking', 'completed', {
      booking_type: bookingData.bookingType,
      value: bookingData.value,
      ab_test_id: bookingData.testId,
      ab_variant_id: bookingData.variantId
    });
  }

  // Track maintenance plan signups
  trackPlanSignup(planData: {
    planId: string;
    planName: string;
    planTier: string;
    monthlyValue: number;
    customerId?: string;
    variantId?: string;
    testId?: string;
  }) {
    this.trackEvent('plan_signup', {
      plan_id: planData.planId,
      plan_name: planData.planName,
      plan_tier: planData.planTier,
      value: planData.monthlyValue * 12, // Annual value
      currency: 'USD',
      customer_id: planData.customerId,
      ab_test_id: planData.testId,
      ab_variant_id: planData.variantId
    });

    // Track as conversion goal
    if (window.gtag) {
      window.gtag('event', 'conversion', {
        send_to: `${this.measurementId}/plan_signup`,
        value: planData.monthlyValue * 12,
        currency: 'USD'
      });
    }
  }

  // Track upsell conversions
  trackUpsell(upsellData: {
    offerId: string;
    offerName: string;
    value: number;
    originalService?: string;
  }) {
    this.trackEvent('upsell_accepted', {
      offer_id: upsellData.offerId,
      offer_name: upsellData.offerName,
      value: upsellData.value,
      currency: 'USD',
      original_service: upsellData.originalService
    });
  }

  // Track conversion funnel steps
  trackFunnelStep(funnel: string, step: string, properties?: EventProperties) {
    this.trackEvent(`${funnel}_funnel_${step}`, {
      funnel_name: funnel,
      funnel_step: step,
      ...properties
    });
  }

  // Track form interactions
  trackFormInteraction(formName: string, action: 'start' | 'abandon' | 'complete', fieldName?: string) {
    this.trackEvent('form_interaction', {
      form_name: formName,
      action,
      field_name: fieldName
    });
  }

  // Track search events
  trackSearch(searchTerm: string, resultsCount?: number, searchType?: string) {
    this.trackEvent('search', {
      search_term: searchTerm,
      results_count: resultsCount,
      search_type: searchType || 'general'
    });
  }

  // Track engagement metrics
  trackEngagement(engagementType: 'scroll' | 'time_on_page' | 'interaction', value?: number) {
    const sessionDuration = Math.round((Date.now() - this.sessionStartTime) / 1000);
    
    this.trackEvent('user_engagement', {
      engagement_type: engagementType,
      value: value || sessionDuration,
      page_path: window.location.pathname
    });
  }

  // Track errors (integrated with Sentry)
  trackError(error: Error, context?: Record<string, any>) {
    this.trackEvent('error', {
      error_message: error.message,
      error_stack: error.stack?.substring(0, 500), // Limit stack trace length
      page_path: window.location.pathname,
      ...context
    });
  }

  // Track timing metrics (performance)
  trackTiming(category: string, variable: string, value: number, label?: string) {
    if (!this.initialized || !window.gtag) return;

    window.gtag('event', 'timing_complete', {
      event_category: category,
      event_label: label,
      value,
      name: variable
    });
  }

  // Enhanced ecommerce tracking
  trackEcommerceEvent(action: string, data: ConversionEvent) {
    if (!this.initialized || !window.gtag) return;

    window.gtag('event', action, {
      ...data,
      send_to: this.measurementId
    });
  }

  // Track social interactions
  trackSocial(network: string, action: string, target?: string) {
    this.trackEvent('social_interaction', {
      social_network: network,
      social_action: action,
      social_target: target || window.location.href
    });
  }

  // Track video interactions
  trackVideo(action: 'play' | 'pause' | 'complete' | 'progress', videoTitle: string, progress?: number) {
    this.trackEvent('video_interaction', {
      video_action: action,
      video_title: videoTitle,
      video_progress: progress
    });
  }

  // Track file downloads
  trackDownload(fileName: string, fileType: string) {
    this.trackEvent('file_download', {
      file_name: fileName,
      file_type: fileType
    });
  }

  // Track outbound links
  trackOutboundLink(url: string, linkText?: string) {
    this.trackEvent('outbound_link', {
      link_url: url,
      link_text: linkText,
      link_domain: new URL(url).hostname
    });
  }

  // Custom dimension tracking for AI vs Traditional booking
  trackBookingMethod(method: 'ai' | 'traditional') {
    this.setUserProperties({
      last_booking_method: method
    });
    
    this.trackEvent('booking_method_selected', {
      method
    });
  }

  // Track scroll depth
  trackScrollDepth(depth: number) {
    this.trackEvent('scroll_depth', {
      percent_scrolled: depth,
      page_path: window.location.pathname
    });
  }

  // Get client ID for server-side tracking
  getClientId(): Promise<string | null> {
    return new Promise((resolve) => {
      if (!this.initialized || !window.gtag) {
        resolve(null);
        return;
      }

      window.gtag('get', this.measurementId, 'client_id', (clientId: string) => {
        resolve(clientId);
      });
    });
  }
}

export const analytics = GoogleAnalytics.getInstance();

// Helper function to track Web Vitals in GA4
export function trackWebVitalsInGA(metric: { name: string; value: number; rating: string }) {
  analytics.trackTiming('Web Vitals', metric.name, Math.round(metric.value), metric.rating);
  
  // Also track as custom event for better reporting
  analytics.trackEvent('web_vitals', {
    metric_name: metric.name,
    metric_value: Math.round(metric.value),
    metric_rating: metric.rating
  });
}