/**
 * Analytics & Tracking
 *
 * Event tracking for Google Tag Manager.
 * GTM script is injected by Cloudflare Google Tag Gateway.
 * This file only handles pushing events to dataLayer.
 */

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
 * Initialize dataLayer for GTM events
 * Cloudflare injects GTM script - we just ensure dataLayer exists
 */
export function initAnalytics(): void {
  window.dataLayer = window.dataLayer || [];
  console.log('[Analytics] DataLayer initialized - GTM loaded via Cloudflare');
  trackPageView(window.location.pathname);
}

/**
 * Track page view
 */
export function trackPageView(path: string, title?: string): void {
  const pageTitle = title || document.title;

  // Push to dataLayer for GTM
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'page_view',
    page_path: path,
    page_title: pageTitle,
    page_location: window.location.href,
  });

  // GA4 via gtag (if GTM configures it)
  if (window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: pageTitle,
      page_location: window.location.href,
    });
  }

  // Meta Pixel (if configured in GTM)
  if (window.fbq) {
    window.fbq('track', 'PageView');
  }
}

/**
 * Track custom event
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, unknown>
): void {
  // Push to dataLayer for GTM
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...params,
  });

  // GA4 via gtag
  if (window.gtag) {
    window.gtag('event', eventName, params);
  }

  // Meta Pixel
  if (window.fbq) {
    const metaEventMap: Record<string, string> = {
      generate_lead: 'Lead',
      contact: 'Contact',
      phone_click: 'Contact',
      booking_started: 'InitiateCheckout',
      booking_submitted: 'Purchase',
      booking_confirmed: 'Purchase',
      form_submit: 'SubmitApplication',
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
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'conversion',
    conversion_label: conversionLabel,
    value,
    currency: currency || 'USD',
  });

  if (window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: conversionLabel,
      value,
      currency: currency || 'USD',
    });
  }
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
 * Set user properties
 */
export function setUserProperties(properties: Record<string, unknown>): void {
  if (window.gtag) {
    window.gtag('set', 'user_properties', properties);
  }
}

/**
 * Initialize analytics - call once when app loads
 */
export function bootstrapAnalytics(): void {
  initAnalytics();
}
