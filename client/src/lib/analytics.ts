/**
 * Analytics & Tracking
 *
 * Loads Google Tag Manager (GTM), Google Analytics 4 (GA4), and Meta Pixel.
 * GTM is the preferred method - configure GA4 and Meta Pixel as tags within GTM.
 *
 * Environment Variables:
 * - VITE_GTM_ID: Google Tag Manager container ID (GTM-XXXXXXX) - RECOMMENDED
 * - VITE_GA_MEASUREMENT_ID: GA4 measurement ID (G-XXXXXXX) - fallback
 * - VITE_META_PIXEL_ID: Meta Pixel ID - fallback
 */

// Tracking IDs from environment
const GTM_ID = import.meta.env.VITE_GTM_ID || '';
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';
const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || '';

// Track initialization state
let gtmInitialized = false;
let gaInitialized = false;
let metaPixelInitialized = false;

// Note: Window.dataLayer and Window.gtag are declared in monitoring/analytics.ts
declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & {
      callMethod?: (...args: unknown[]) => void;
      queue: unknown[];
      loaded: boolean;
      version: string;
      push: (...args: unknown[]) => void;
    };
    _fbq?: unknown;
  }
}

/**
 * Load Google Tag Manager (preferred method)
 * GTM can manage GA4, Meta Pixel, and all other tags centrally
 */
function loadGTM(): Promise<void> {
  return new Promise((resolve) => {
    // Check for valid GTM ID
    if (!GTM_ID || GTM_ID === 'GTM-XXXXXXX') {
      resolve();
      return;
    }

    // Don't load twice
    if (gtmInitialized) {
      resolve();
      return;
    }

    // Check if script already exists
    if (document.querySelector(`script[src*="googletagmanager.com/gtm.js"]`)) {
      gtmInitialized = true;
      resolve();
      return;
    }

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      'gtm.start': new Date().getTime(),
      event: 'gtm.js'
    });

    // Create and load GTM script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;

    script.onload = () => {
      // Add noscript iframe for users with JS disabled
      const noscript = document.createElement('noscript');
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.googletagmanager.com/ns.html?id=${GTM_ID}`;
      iframe.height = '0';
      iframe.width = '0';
      iframe.style.display = 'none';
      iframe.style.visibility = 'hidden';
      noscript.appendChild(iframe);
      document.body.insertBefore(noscript, document.body.firstChild);

      gtmInitialized = true;
      console.log(`[Analytics] GTM loaded: ${GTM_ID}`);
      resolve();
    };

    script.onerror = () => {
      console.error('[Analytics] Failed to load GTM');
      resolve();
    };

    document.head.appendChild(script);
  });
}

/**
 * Load Google Analytics 4 script directly (fallback if no GTM)
 */
function loadGAScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Skip if GTM is handling this or no measurement ID
    if (gtmInitialized) {
      console.log('[Analytics] GA4 managed by GTM');
      resolve();
      return;
    }

    // Check for valid GA measurement ID
    if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') {
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

    // Initialize dataLayer and gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };
    window.gtag('js', new Date());

    // Create and load script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;

    script.onload = () => {
      window.gtag?.('config', GA_MEASUREMENT_ID, {
        send_page_view: true,
      });
      gaInitialized = true;
      console.log(`[Analytics] GA4 loaded: ${GA_MEASUREMENT_ID}`);
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
 * Load Meta (Facebook) Pixel directly (fallback if no GTM)
 */
function loadMetaPixel(): Promise<void> {
  return new Promise((resolve) => {
    // Skip if GTM is handling this
    if (gtmInitialized) {
      console.log('[Analytics] Meta Pixel managed by GTM');
      resolve();
      return;
    }

    // Check for valid Pixel ID
    if (!META_PIXEL_ID || META_PIXEL_ID === 'XXXXXXXXXXXXXXXX') {
      resolve();
      return;
    }

    // Don't load twice
    if (metaPixelInitialized) {
      resolve();
      return;
    }

    // Check if script already exists
    if (document.querySelector(`script[src*="connect.facebook.net"]`)) {
      metaPixelInitialized = true;
      resolve();
      return;
    }

    // Initialize fbq function
    type FbqFunction = ((...args: unknown[]) => void) & {
      callMethod?: (...args: unknown[]) => void;
      queue: unknown[];
      loaded: boolean;
      version: string;
      push: (...args: unknown[]) => void;
    };

    const fbqFn: FbqFunction = Object.assign(
      function fbq(...args: unknown[]) {
        if (fbqFn.callMethod) {
          fbqFn.callMethod.apply(fbqFn, args);
        } else {
          fbqFn.queue.push(args);
        }
      },
      {
        queue: [] as unknown[],
        loaded: true,
        version: '2.0',
        push: function(...args: unknown[]) {
          fbqFn.queue.push(args);
        }
      }
    );

    if (!window._fbq) window._fbq = fbqFn;
    window.fbq = fbqFn;

    // Load pixel script
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';

    script.onload = () => {
      window.fbq?.('init', META_PIXEL_ID);
      window.fbq?.('track', 'PageView');
      metaPixelInitialized = true;
      console.log(`[Analytics] Meta Pixel loaded: ${META_PIXEL_ID}`);
      resolve();
    };

    script.onerror = () => {
      console.error('[Analytics] Failed to load Meta Pixel');
      resolve();
    };

    document.head.appendChild(script);
  });
}

/**
 * Initialize all analytics - loads automatically
 */
export function initAnalytics(): void {
  // Try GTM first (manages everything)
  loadGTM()
    .then(() => {
      if (gtmInitialized) {
        console.log('[Analytics] GTM initialized - managing all tags');
        trackPageView(window.location.pathname);
        return;
      }

      // Fallback: Load individual scripts if no GTM
      return Promise.all([
        loadGAScript(),
        loadMetaPixel()
      ]);
    })
    .then(() => {
      console.log('[Analytics] Analytics initialized');
      trackPageView(window.location.pathname);
    })
    .catch((error) => {
      console.error('[Analytics] Failed to initialize:', error);
    });
}

/**
 * Track page view across all platforms
 */
export function trackPageView(path: string, title?: string): void {
  const pageTitle = title || document.title;

  // Send to GA4
  if ((gaInitialized || gtmInitialized) && window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: pageTitle,
      page_location: window.location.href,
    });
  }

  // Send to GTM dataLayer
  if (gtmInitialized && window.dataLayer) {
    window.dataLayer.push({
      event: 'page_view',
      page_path: path,
      page_title: pageTitle,
      page_location: window.location.href,
    });
  }

  // Send to Meta Pixel
  if ((metaPixelInitialized || gtmInitialized) && window.fbq) {
    window.fbq('track', 'PageView');
  }
}

/**
 * Track custom event across all platforms
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, unknown>
): void {
  // Send to GA4 via gtag
  if ((gaInitialized || gtmInitialized) && window.gtag) {
    window.gtag('event', eventName, params);
  }

  // Send to GTM dataLayer
  if (gtmInitialized && window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...params,
    });
  }

  // Send to Meta Pixel
  if ((metaPixelInitialized || gtmInitialized) && window.fbq) {
    const metaEventMap: Record<string, string> = {
      generate_lead: 'Lead',
      contact: 'Contact',
      phone_click: 'Contact',
      booking_started: 'InitiateCheckout',
      booking_submitted: 'Purchase',
      booking_confirmed: 'Purchase',
      form_submit: 'SubmitApplication',
      page_view: 'PageView',
    };

    const metaEvent = metaEventMap[eventName] || eventName;
    window.fbq('trackCustom', metaEvent, params);
  }
}

/**
 * Track conversion event
 */
export function trackConversion(
  conversionLabel: string,
  value?: number,
  currency?: string
): void {
  if (!gaInitialized && !gtmInitialized) return;

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
  if (!gaInitialized && !gtmInitialized) return;
  window.gtag?.('set', 'user_properties', properties);
}

/**
 * Initialize analytics system - call once when app loads
 */
export function bootstrapAnalytics(): void {
  initAnalytics();
}

/**
 * Get tracking status (for debugging)
 */
export function getTrackingStatus(): {
  gtm: boolean;
  ga4: boolean;
  metaPixel: boolean;
} {
  return {
    gtm: gtmInitialized,
    ga4: gaInitialized,
    metaPixel: metaPixelInitialized,
  };
}
