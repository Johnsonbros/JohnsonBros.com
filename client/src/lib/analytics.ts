/**
 * Conditional Analytics Loading
 *
 * Only loads Google Analytics when user has given consent.
 * Provides stub functions when consent is not given.
 */

import { hasAnalyticsConsent } from '@/hooks/useCookieConsent';

// Google Analytics Measurement ID
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';

// Track whether GA has been initialized
let gaInitialized = false;

// Window extension is declared in monitoring/analytics.ts
// Use optional chaining to handle undefined cases

/**
 * Load Google Analytics script dynamically
 */
function loadGAScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Don't load if no measurement ID
    if (!GA_MEASUREMENT_ID) {
      console.warn('[Analytics] No GA_MEASUREMENT_ID configured');
      resolve();
      return;
    }

    // Don't load twice
    if (gaInitialized) {
      resolve();
      return;
    }

    // Check if script already exists
    if (document.querySelector(`script[src*="googletagmanager.com/gtag"]`)) {
      gaInitialized = true;
      resolve();
      return;
    }

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: any[]) {
      window.dataLayer?.push(args);
    };
    window.gtag('js', new Date());

    // Create and load script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;

    script.onload = () => {
      window.gtag?.('config', GA_MEASUREMENT_ID, {
        // Anonymize IP by default
        anonymize_ip: true,
        // Don't send page views automatically - we'll control this
        send_page_view: false,
      });
      gaInitialized = true;
      resolve();
    };

    script.onerror = (error) => {
      console.error('[Analytics] Failed to load GA script:', error);
      reject(error);
    };

    document.head.appendChild(script);
  });
}

/**
 * Initialize analytics based on consent
 */
export function initAnalytics(): void {
  // Check consent
  if (!hasAnalyticsConsent()) {
    console.log('[Analytics] Analytics consent not given, skipping initialization');
    return;
  }

  // Load GA script
  loadGAScript()
    .then(() => {
      console.log('[Analytics] Google Analytics initialized');
      // Send initial page view
      trackPageView(window.location.pathname);
    })
    .catch((error) => {
      console.error('[Analytics] Failed to initialize:', error);
    });
}

/**
 * Track page view
 */
export function trackPageView(path: string, title?: string): void {
  if (!hasAnalyticsConsent() || !gaInitialized) {
    return;
  }

  window.gtag?.('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
    page_location: window.location.href,
  });
}

/**
 * Track custom event
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, unknown>
): void {
  if (!hasAnalyticsConsent() || !gaInitialized) {
    return;
  }

  window.gtag?.('event', eventName, params);
}

/**
 * Track conversion event
 */
export function trackConversion(
  conversionLabel: string,
  value?: number,
  currency?: string
): void {
  if (!hasAnalyticsConsent() || !gaInitialized) {
    return;
  }

  window.gtag?.('event', 'conversion', {
    send_to: `${GA_MEASUREMENT_ID}/${conversionLabel}`,
    value,
    currency: currency || 'USD',
  });
}

/**
 * Track booking-related events
 */
export function trackBookingEvent(
  action: 'started' | 'step_completed' | 'submitted' | 'confirmed' | 'abandoned',
  params?: {
    serviceType?: string;
    step?: string;
    value?: number;
  }
): void {
  trackEvent(`booking_${action}`, {
    event_category: 'Booking',
    event_label: params?.serviceType,
    step: params?.step,
    value: params?.value,
  });
}

/**
 * Track chat interactions
 */
export function trackChatEvent(
  action: 'opened' | 'message_sent' | 'closed',
  params?: {
    messageCount?: number;
    duration?: number;
  }
): void {
  trackEvent(`chat_${action}`, {
    event_category: 'Chat',
    message_count: params?.messageCount,
    duration: params?.duration,
  });
}

/**
 * Track phone call clicks
 */
export function trackPhoneClick(source: string): void {
  trackEvent('phone_click', {
    event_category: 'Contact',
    event_label: source,
  });
}

/**
 * Set user properties (for logged-in users)
 */
export function setUserProperties(properties: Record<string, unknown>): void {
  if (!hasAnalyticsConsent() || !gaInitialized) {
    return;
  }

  window.gtag?.('set', 'user_properties', properties);
}

/**
 * Listen for consent updates and initialize/disable analytics accordingly
 */
export function setupConsentListener(): void {
  window.addEventListener('consentUpdated', (event: Event) => {
    const customEvent = event as CustomEvent<{ analytics: boolean }>;
    const { analytics } = customEvent.detail;

    if (analytics && !gaInitialized) {
      // User just gave consent - initialize analytics
      initAnalytics();
    } else if (!analytics && gaInitialized) {
      // User withdrew consent - we can't unload the script, but we can
      // stop sending events (hasAnalyticsConsent checks will fail)
      console.log('[Analytics] Analytics consent withdrawn');
    }
  });
}

/**
 * Initialize analytics system
 * Call this once when the app loads
 */
export function bootstrapAnalytics(): void {
  // Set up listener for consent changes
  setupConsentListener();

  // Initialize if we already have consent
  if (hasAnalyticsConsent()) {
    initAnalytics();
  }
}
