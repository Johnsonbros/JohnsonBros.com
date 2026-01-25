// Central monitoring initialization
import { sentryClient } from './sentry';
import { webVitalsMonitor, sendToAnalytics } from './webVitals';
import { analytics } from './analytics';

export interface MonitoringConfig {
  enableSentry?: boolean;
  enableAnalytics?: boolean;
  enableWebVitals?: boolean;
  enableDebugMode?: boolean;
}

// Module-level flag to ensure single initialization
let monitoringInitialized = false;
let monitoringResult: {
  sentry: typeof sentryClient;
  analytics: typeof analytics;
  webVitals: typeof webVitalsMonitor;
} | null = null;

export function initializeMonitoring(config: MonitoringConfig = {}) {
  // SSR guard
  if (typeof window === 'undefined') {
    return { sentry: sentryClient, analytics, webVitals: webVitalsMonitor };
  }

  // Idempotent: return cached result if already initialized
  if (monitoringInitialized && monitoringResult) {
    if (import.meta.env.DEV) {
      console.log('[Monitoring] initializeMonitoring called again; skipping re-init');
    }
    return monitoringResult;
  }

  monitoringInitialized = true;

  const {
    enableSentry = !!import.meta.env.VITE_SENTRY_DSN,
    enableAnalytics = !!import.meta.env.VITE_GA_MEASUREMENT_ID,
    enableWebVitals = true,
    enableDebugMode = import.meta.env.DEV,
  } = config;

  // Initialize Sentry error tracking
  if (enableSentry) {
    sentryClient.initialize();
    console.log('[Monitoring] Sentry initialized');
  }

  // Initialize Google Analytics
  if (enableAnalytics) {
    analytics.initialize();
    console.log('[Monitoring] Google Analytics initialized');
  }

  // Initialize Web Vitals monitoring
  if (enableWebVitals) {
    webVitalsMonitor.initialize({
      reportCallback: (metrics) => {
        console.log('[Monitoring] Web Vitals Report:', metrics);
      },
      analyticsCallback: (metric) => {
        // Send to Google Analytics
        if (enableAnalytics) {
          sendToAnalytics(metric);
        }
      },
      enableSentryReporting: enableSentry,
    });
    console.log('[Monitoring] Web Vitals monitoring initialized');
  }

  // Set up global error handler
  if (enableSentry) {
    window.addEventListener('error', (event) => {
      sentryClient.captureError(event.error, {
        url: event.filename,
        line: event.lineno,
        column: event.colno,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      sentryClient.captureError(new Error(event.reason), {
        type: 'unhandledrejection',
      });
    });
  }

  // Track page views
  if (enableAnalytics) {
    // Track initial page view
    analytics.trackPageView();

    // Track route changes (for client-side routing)
    window.addEventListener('popstate', () => {
      analytics.trackPageView();
    });
  }

  // Expose monitoring tools in debug mode
  if (enableDebugMode && typeof window !== 'undefined') {
    (window as any).__monitoring = {
      sentry: sentryClient,
      analytics,
      webVitals: webVitalsMonitor,
      getMetrics: () => webVitalsMonitor.getMetrics(),
      getPerformanceScore: () => webVitalsMonitor.getPerformanceScore(),
    };
    console.log('[Monitoring] Debug mode enabled - monitoring tools available at window.__monitoring');
  }

  monitoringResult = {
    sentry: sentryClient,
    analytics,
    webVitals: webVitalsMonitor,
  };

  return monitoringResult;
}

// Export all monitoring utilities
export { sentryClient } from './sentry';
export { analytics } from './analytics';
export { webVitalsMonitor } from './webVitals';

// Helper to track conversions
export function trackConversion(type: string, data: any) {
  // Track in analytics
  analytics.trackEvent(`conversion_${type}`, data);
  
  // Add Sentry breadcrumb
  sentryClient.addBreadcrumb({
    message: `Conversion: ${type}`,
    category: 'conversion',
    level: 'info',
    data,
  });
}

// Helper to track user interactions
export function trackInteraction(action: string, label?: string, value?: number) {
  analytics.trackEvent('user_interaction', {
    action,
    label,
    value,
  });
}

// Helper to set user context across all monitoring tools
export function setMonitoringUserContext(user: {
  id: string;
  email?: string;
  username?: string;
  role?: string;
  subscriptionTier?: string;
}) {
  // Set in Sentry
  sentryClient.setUserContext(user);
  
  // Set in Analytics
  analytics.setUserProperties({
    user_id: user.id,
    user_type: user.role as any,
    subscription_tier: user.subscriptionTier,
  });
}

// Helper to clear user context (on logout)
export function clearMonitoringUserContext() {
  sentryClient.clearUserContext();
  analytics.setUserProperties({});
}