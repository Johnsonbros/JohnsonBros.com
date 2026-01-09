import * as Sentry from '@sentry/react';

interface SentryConfig {
  dsn: string;
  environment: string;
  enabled: boolean;
  sampleRate: number;
  tracesSampleRate: number;
  debug: boolean;
}

/**
 * Builds the tracePropagationTargets array for Sentry distributed tracing.
 * Supports: localhost, current host (Replit dev/prod), thejohnsonbros.com domain,
 * relative paths, and optional API origin.
 */
function buildTracePropagationTargets(): (string | RegExp)[] {
  const targets: (string | RegExp)[] = [];
  const isDebug = import.meta.env.VITE_SENTRY_DEBUG === 'true';

  // 1. Always include localhost for local development
  targets.push('localhost');

  // 2. Include current hostname (covers Replit dev/prod URLs automatically)
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const currentHost = window.location.hostname;
    if (currentHost !== 'localhost') {
      targets.push(currentHost);
    }
  }

  // 3. Include relative paths (same-origin API calls like /api/...)
  targets.push(/^\//);

  // 4. Include thejohnsonbros.com domain and all subdomains (HTTPS only)
  // Matches: https://thejohnsonbros.com, https://www.thejohnsonbros.com,
  //          https://api.thejohnsonbros.com, etc.
  const appDomain = import.meta.env.VITE_PUBLIC_APP_DOMAIN || 'thejohnsonbros.com';
  // Escape dots for regex and create pattern for root domain + subdomains
  const escapedDomain = appDomain.replace(/\./g, '\\.');
  const domainRegex = new RegExp(`^https:\\/\\/([a-zA-Z0-9-]+\\.)?${escapedDomain}(\\/|$)`);
  targets.push(domainRegex);

  // 5. Include optional API origin if configured
  const apiOrigin = import.meta.env.VITE_API_ORIGIN;
  if (apiOrigin) {
    // If it's a full URL, escape it for regex matching
    const escapedOrigin = apiOrigin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    targets.push(new RegExp(`^${escapedOrigin}`));
  }

  // Debug logging in development when VITE_SENTRY_DEBUG is enabled
  if (isDebug && import.meta.env.MODE === 'development') {
    console.log('[Sentry] Computed tracePropagationTargets:', targets.map(t => 
      t instanceof RegExp ? t.toString() : t
    ));
  }

  return targets;
}

class SentryClient {
  private static instance: SentryClient;
  private config: SentryConfig;
  private initialized = false;

  private constructor() {
    this.config = {
      dsn: import.meta.env.VITE_SENTRY_DSN || '',
      environment: import.meta.env.MODE || 'development',
      enabled: !!import.meta.env.VITE_SENTRY_DSN && import.meta.env.MODE === 'production',
      sampleRate: parseFloat(import.meta.env.VITE_SENTRY_SAMPLE_RATE || '1.0'),
      tracesSampleRate: parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || '0.1'),
      debug: import.meta.env.VITE_SENTRY_DEBUG === 'true',
    };
  }

  static getInstance(): SentryClient {
    if (!SentryClient.instance) {
      SentryClient.instance = new SentryClient();
    }
    return SentryClient.instance;
  }

  initialize() {
    if (this.initialized || !this.config.enabled) {
      return;
    }

    try {
      Sentry.init({
        dsn: this.config.dsn,
        environment: this.config.environment,
        debug: this.config.debug,
        sampleRate: this.config.sampleRate,
        tracesSampleRate: this.config.tracesSampleRate,
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.captureConsoleIntegration({
            levels: ['error', 'warn'],
          }),
        ],
        // Set tracePropagationTargets dynamically based on environment
        tracePropagationTargets: buildTracePropagationTargets(),
        beforeSend(event, hint) {
          // Filter out sensitive data
          if (event.request) {
            // Remove sensitive headers
            if (event.request.headers) {
              delete event.request.headers['authorization'];
              delete event.request.headers['cookie'];
            }
            // Remove sensitive cookies
            if (event.request.cookies) {
              delete event.request.cookies['session'];
            }
          }

          // Don't send events in development unless explicitly enabled
          if (import.meta.env.MODE === 'development' && !import.meta.env.VITE_SENTRY_DEBUG) {
            return null;
          }

          // Add custom context
          event.tags = {
            ...event.tags,
            app_version: import.meta.env.VITE_APP_VERSION || '1.0.0',
            browser: navigator.userAgent,
          };

          return event;
        },
        // Performance Monitoring
        tracesSampler: (samplingContext) => {
          // Increase sample rate for important transactions
          if (samplingContext.transactionContext.name === 'booking-flow') {
            return 1.0; // 100% sampling for booking flow
          }
          if (samplingContext.transactionContext.name === 'admin-dashboard') {
            return 0.5; // 50% sampling for admin dashboard
          }
          // Default sample rate for everything else
          return 0.1;
        },
      });

      this.initialized = true;
      console.log('[Sentry] Monitoring initialized');
    } catch (error) {
      console.error('[Sentry] Failed to initialize:', error);
    }
  }

  // Set user context for better error tracking
  setUserContext(user: { id: string; email?: string; username?: string; role?: string }) {
    if (!this.initialized) return;
    Sentry.setUser(user);
  }

  // Clear user context (e.g., on logout)
  clearUserContext() {
    if (!this.initialized) return;
    Sentry.setUser(null);
  }

  // Capture error with context
  captureError(error: Error, context?: Record<string, any>) {
    if (!this.initialized) return;

    Sentry.withScope((scope: any) => {
      if (context) {
        scope.setContext('error_context', context);
      }
      Sentry.captureException(error);
    });
  }

  // Capture message with severity
  captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>) {
    if (!this.initialized) return;

    Sentry.withScope((scope: any) => {
      if (context) {
        scope.setContext('message_context', context);
      }
      Sentry.captureMessage(message, level);
    });
  }

  // Add breadcrumb for debugging
  addBreadcrumb(breadcrumb: {
    message: string;
    category?: string;
    level?: Sentry.SeverityLevel;
    data?: Record<string, any>;
  }) {
    if (!this.initialized) return;

    Sentry.addBreadcrumb({
      ...breadcrumb,
      timestamp: Date.now() / 1000,
    });
  }

  // Start a performance transaction
  startTransaction(name: string, op: string = 'navigation') {
    if (!this.initialized) return null;

    return Sentry.startSpan({
      name,
      op,
    }, () => {
      // Transaction body would go here
      return null;
    });
  }

  // Create a profiler component for React components
  createProfiler(name: string) {
    // withProfiler was removed in v8, return a no-op wrapper
    return (Component: any) => Component;
  }
}

export const sentryClient = SentryClient.getInstance();

// React Error Boundary with Sentry
export const SentryErrorBoundary = Sentry.ErrorBoundary;