import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { Request, Response, NextFunction } from 'express';
import { Logger } from '../logger';

interface SentryConfig {
  dsn: string;
  environment: string;
  enabled: boolean;
  sampleRate: number;
  tracesSampleRate: number;
  profilesSampleRate: number;
  debug: boolean;
}

export class SentryMonitoring {
  private static instance: SentryMonitoring;
  private config: SentryConfig;
  private initialized = false;

  private constructor() {
    this.config = {
      dsn: process.env.SENTRY_DSN || '',
      environment: process.env.NODE_ENV || 'development',
      enabled: !!process.env.SENTRY_DSN && process.env.NODE_ENV === 'production',
      sampleRate: parseFloat(process.env.SENTRY_SAMPLE_RATE || '1.0'),
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
      profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),
      debug: process.env.SENTRY_DEBUG === 'true',
    };
  }

  static getInstance(): SentryMonitoring {
    if (!SentryMonitoring.instance) {
      SentryMonitoring.instance = new SentryMonitoring();
    }
    return SentryMonitoring.instance;
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
        profilesSampleRate: this.config.profilesSampleRate,
        integrations: [
          // Using the new API for integrations
          nodeProfilingIntegration(),
        ],
        beforeSend(event, hint) {
          // Filter out sensitive data
          if (event.request) {
            // Remove authentication headers
            if (event.request.headers) {
              delete event.request.headers['authorization'];
              delete event.request.headers['cookie'];
              delete event.request.headers['x-api-key'];
            }
            // Remove sensitive query params
            if (event.request.query_string && typeof event.request.query_string === 'string') {
              event.request.query_string = event.request.query_string.replace(
                /api_key=[^&]*/g,
                'api_key=REDACTED'
              );
            }
          }

          // Add custom context
          event.tags = {
            ...event.tags,
            app_version: process.env.APP_VERSION || '1.0.0',
            node_version: process.version,
          };

          return event;
        },
      });

      this.initialized = true;
      Logger.info('Sentry monitoring initialized', {
        environment: this.config.environment,
        sampleRate: this.config.sampleRate,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error('Failed to initialize Sentry', { error: errorMessage });
    }
  }

  // Express middleware for request tracking
  requestHandler() {
    return Sentry.expressIntegration();
  }

  // Express middleware for tracing
  tracingHandler() {
    return Sentry.expressIntegration();
  }

  // Express error handler (should be before other error middleware)
  errorHandler() {
    return Sentry.expressErrorHandler({
      shouldHandleError(error: any) {
        // Capture all errors except expected ones
        if (error.status === 404 || error.status === 401) {
          return false;
        }
        return true;
      },
    });
  }

  // Manual error capture with context
  captureError(error: Error, context?: Record<string, any>) {
    if (!this.initialized) {
      return;
    }

    Sentry.withScope((scope: any) => {
      if (context) {
        scope.setContext('additional_context', context);
      }
      Sentry.captureException(error);
    });
  }

  // Capture message with severity
  captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>) {
    if (!this.initialized) {
      return;
    }

    Sentry.withScope((scope: any) => {
      if (context) {
        scope.setContext('message_context', context);
      }
      Sentry.captureMessage(message, level);
    });
  }

  // Set user context for better error tracking
  setUserContext(user: { id: string; email?: string; username?: string }) {
    if (!this.initialized) {
      return;
    }

    Sentry.setUser(user);
  }

  // Clear user context (e.g., on logout)
  clearUserContext() {
    if (!this.initialized) {
      return;
    }

    Sentry.setUser(null);
  }

  // Add breadcrumb for better debugging
  addBreadcrumb(breadcrumb: {
    message: string;
    category?: string;
    level?: Sentry.SeverityLevel;
    data?: Record<string, any>;
  }) {
    if (!this.initialized) {
      return;
    }

    Sentry.addBreadcrumb({
      ...breadcrumb,
      timestamp: Date.now() / 1000,
    });
  }

  // Start a transaction for performance monitoring
  startTransaction(name: string, op: string) {
    if (!this.initialized) {
      return null;
    }

    return Sentry.startSpan({
      name,
      op,
    }, () => {
      // Transaction body would go here
      return null;
    });
  }

  // Middleware to add request ID to Sentry context
  requestContextMiddleware() {
    return (req: Request & { requestId?: string }, res: Response, next: NextFunction) => {
      if (this.initialized && req.requestId) {
        Sentry.withScope((scope: any) => {
          scope.setTag('request_id', req.requestId);
          scope.setContext('request', {
            method: req.method,
            url: req.url,
            ip: req.ip,
            user_agent: req.get('user-agent'),
          });
        });
      }
      next();
    };
  }
}

export const sentryMonitoring = SentryMonitoring.getInstance();