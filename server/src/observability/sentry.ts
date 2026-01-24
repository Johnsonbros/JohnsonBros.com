/**
 * Sentry Error Tracking Integration
 *
 * Provides comprehensive error tracking with:
 * - Automatic exception capture
 * - Request context enrichment
 * - Sensitive data filtering
 * - User context management
 * - Breadcrumb trails
 */

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { type Express, type Request, type Response, type NextFunction, type ErrorRequestHandler } from 'express';
import { Logger } from '../logger';

// Package version for release tracking
const packageVersion = process.env.npm_package_version || '1.0.0';
const ENV = process.env.NODE_ENV || 'development';

interface SentryUser {
  id: string;
  email?: string;
  username?: string;
}

interface BreadcrumbData {
  message: string;
  category?: string;
  level?: Sentry.SeverityLevel;
  data?: Record<string, unknown>;
}

// Sensitive field patterns to filter
const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /api[-_]?key/i,
  /auth/i,
  /bearer/i,
  /credential/i,
  /private/i,
];

/**
 * Check if a field name matches sensitive patterns
 */
function isSensitiveField(fieldName: string): boolean {
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(fieldName));
}

/**
 * Recursively filter sensitive data from objects
 */
function filterSensitiveData(obj: unknown, depth = 0): unknown {
  if (depth > 10) return '[MAX_DEPTH]';
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    // Check for potential secrets in strings (JWT tokens, API keys, etc.)
    if (obj.length > 50 && (obj.startsWith('ey') || obj.includes('sk_') || obj.includes('pk_'))) {
      return '[REDACTED]';
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => filterSensitiveData(item, depth + 1));
  }

  if (typeof obj === 'object') {
    const filtered: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (isSensitiveField(key)) {
        filtered[key] = '[REDACTED]';
      } else {
        filtered[key] = filterSensitiveData(value, depth + 1);
      }
    }
    return filtered;
  }

  return obj;
}

let initialized = false;

/**
 * Initialize Sentry for the Express application
 */
export function initSentry(app: Express): void {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    Logger.warn('Sentry DSN not configured, error tracking disabled');
    return;
  }

  if (initialized) {
    Logger.debug('Sentry already initialized');
    return;
  }

  const environment = process.env.SENTRY_ENVIRONMENT || ENV;
  const sampleRate = parseFloat(process.env.SENTRY_SAMPLE_RATE || '1.0');
  const tracesSampleRate = parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1');
  const profilesSampleRate = parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1');

  try {
    Sentry.init({
      dsn,
      environment,
      release: `johnsonbros@${packageVersion}`,
      sampleRate,
      tracesSampleRate,
      profilesSampleRate,

      // Debug mode only in development
      debug: ENV === 'development' && process.env.SENTRY_DEBUG === 'true',

      // Performance monitoring
      integrations: [
        nodeProfilingIntegration(),
      ],

      // Request tracking with intelligent sampling
      tracesSampler(context) {
        // Reduce noise from health checks and metrics
        if (context.transactionContext?.name?.includes('/health') ||
            context.transactionContext?.name?.includes('/metrics')) {
          return 0.01;
        }
        return tracesSampleRate;
      },

      beforeSend(event, hint) {
        // Filter sensitive request data
        if (event.request) {
          // Remove sensitive headers
          if (event.request.headers) {
            const headers = event.request.headers as Record<string, string>;
            delete headers['authorization'];
            delete headers['cookie'];
            delete headers['x-api-key'];
            delete headers['x-auth-token'];
            delete headers['x-csrf-token'];
          }

          // Filter query string
          if (event.request.query_string && typeof event.request.query_string === 'string') {
            event.request.query_string = event.request.query_string
              .replace(/api_key=[^&]*/gi, 'api_key=[REDACTED]')
              .replace(/token=[^&]*/gi, 'token=[REDACTED]')
              .replace(/secret=[^&]*/gi, 'secret=[REDACTED]')
              .replace(/password=[^&]*/gi, 'password=[REDACTED]');
          }

          // Filter request data/body
          if (event.request.data) {
            event.request.data = filterSensitiveData(event.request.data) as string;
          }
        }

        // Filter breadcrumb data
        if (event.breadcrumbs) {
          event.breadcrumbs = event.breadcrumbs.map(crumb => ({
            ...crumb,
            data: crumb.data ? filterSensitiveData(crumb.data) as Record<string, unknown> : undefined,
          }));
        }

        // Add standard tags and metadata
        event.tags = {
          ...event.tags,
          app_version: packageVersion,
          node_version: process.version,
          environment: environment,
        };

        // Add server context
        event.server_name = process.env.HOSTNAME || process.env.COMPUTERNAME || 'unknown';

        return event;
      },

      beforeSendTransaction(transaction) {
        // Filter sensitive data from transaction context
        if (transaction.contexts) {
          transaction.contexts = filterSensitiveData(transaction.contexts) as typeof transaction.contexts;
        }

        // Add standard transaction tags
        transaction.tags = {
          ...transaction.tags,
          app_version: packageVersion,
        };

        return transaction;
      },
    });

    // Capture startup information
    Sentry.withScope((scope) => {
      scope.setTag('startup', 'true');
      scope.setContext('environment', {
        node_version: process.version,
        app_version: packageVersion,
        environment: environment,
        platform: process.platform,
      });
      Sentry.captureMessage('Sentry initialized for application', 'info');
    });

    initialized = true;
    Logger.info('Sentry initialized', {
      environment,
      sampleRate,
      tracesSampleRate,
      profilesSampleRate,
      dsn: dsn.split('@')[0] + '@***',
    });
  } catch (error) {
    Logger.error('Failed to initialize Sentry', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}

/**
 * Capture an exception with optional context
 */
export function captureException(error: Error, context?: Record<string, unknown>): void {
  if (!initialized) {
    Logger.error('Untracked exception (Sentry not initialized)', {
      error: error.message,
      stack: error.stack,
      context,
    });
    return;
  }

  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('additional_context', filterSensitiveData(context) as Record<string, unknown>);
    }
    Sentry.captureException(error);
  });
}

/**
 * Capture a message with optional level and context
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, unknown>
): void {
  if (!initialized) {
    Logger.log(level === 'warning' ? 'warn' : level, message, context);
    return;
  }

  const sentryLevel: Sentry.SeverityLevel = level === 'warning' ? 'warning' : level;

  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('message_context', filterSensitiveData(context) as Record<string, unknown>);
    }
    Sentry.captureMessage(message, sentryLevel);
  });
}

/**
 * Set user context for error tracking
 */
export function setUser(user: SentryUser): void {
  if (!initialized) return;

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}

/**
 * Clear user context
 */
export function clearUser(): void {
  if (!initialized) return;
  Sentry.setUser(null);
}

/**
 * Add a breadcrumb for debugging context
 */
export function addBreadcrumb(breadcrumb: BreadcrumbData): void {
  if (!initialized) return;

  Sentry.addBreadcrumb({
    message: breadcrumb.message,
    category: breadcrumb.category,
    level: breadcrumb.level || 'info',
    data: breadcrumb.data ? filterSensitiveData(breadcrumb.data) as Record<string, unknown> : undefined,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Express error handler middleware for Sentry
 */
export function sentryErrorHandler(): ErrorRequestHandler {
  return (err: Error & { status?: number; statusCode?: number }, req: Request, res: Response, next: NextFunction) => {
    if (!initialized) {
      return next(err);
    }

    const status = err.status || err.statusCode || 500;

    // Don't report expected client errors to Sentry
    if (status === 404 || status === 401 || status === 403) {
      // Still log them locally for debugging
      Logger.warn(`Client error: ${status}`, {
        method: req.method,
        path: req.path,
        error: err.message,
      });
      return next(err);
    }

    Sentry.withScope((scope) => {
      // Add detailed request context
      const requestId = (req as any).requestId || (req as any).correlationId || generateRequestId();

      scope.setTag('request_id', requestId);
      scope.setTag('route', req.path);
      scope.setTag('method', req.method);
      scope.setTag('status_code', status);
      scope.setTag('error_type', err.name || 'Error');

      scope.setContext('request', {
        method: req.method,
        url: req.url,
        path: req.path,
        headers: filterSensitiveData(req.headers),
        query: filterSensitiveData(req.query),
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      // Add request body for POST/PUT errors (filtered)
      if (req.method === 'POST' || req.method === 'PUT') {
        scope.setContext('request_body', {
          data: filterSensitiveData((req as any).body),
        });
      }

      // Add user context if available
      if ((req as any).user) {
        const user = (req as any).user;
        scope.setUser({
          id: user.id,
          email: user.email,
          username: user.username || user.name,
        });
      }

      // Add error-specific context
      scope.setContext('error_details', {
        message: err.message,
        name: err.name,
        stack: err.stack,
      });

      Sentry.captureException(err);

      // Log locally as well
      Logger.error(`Error in ${req.method} ${req.path}`, {
        requestId,
        status,
        error: err.message,
        stack: err.stack,
      });
    });

    next(err);
  };
}

/**
 * Generate a request ID for tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Middleware to add request context to Sentry scope
 * This should be registered early to capture request context for all operations
 */
export function sentryRequestContext() {
  return (req: Request & { requestId?: string; correlationId?: string }, res: Response, next: NextFunction) => {
    if (!initialized) {
      return next();
    }

    const requestId = req.requestId || req.correlationId || generateRequestId();
    (req as any).sentryRequestId = requestId;

    Sentry.withScope((scope) => {
      scope.setTag('request_id', requestId);
      scope.setTag('path', req.path);
      scope.setTag('method', req.method);

      scope.setContext('request', {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString(),
      });

      // Add user context if available
      if ((req as any).user) {
        const user = (req as any).user;
        scope.setUser({
          id: user.id,
          email: user.email,
          username: user.username || user.name,
        });
      }

      // Track request in breadcrumbs
      Sentry.addBreadcrumb({
        category: 'http.request',
        message: `${req.method} ${req.path}`,
        level: 'info',
        data: {
          method: req.method,
          path: req.path,
          query: Object.keys(req.query).length > 0 ? Object.keys(req.query) : undefined,
        },
      });
    });

    // Track response completion
    res.on('finish', () => {
      Sentry.addBreadcrumb({
        category: 'http.response',
        message: `Response: ${res.statusCode}`,
        level: res.statusCode >= 400 ? 'warning' : 'info',
        data: {
          status_code: res.statusCode,
          content_length: res.get('content-length'),
        },
      });
    });

    next();
  };
}

/**
 * Check if Sentry is initialized
 */
export function isSentryInitialized(): boolean {
  return initialized;
}

/**
 * Wrap an async function to automatically capture errors to Sentry
 */
export function withSentryCapture<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options?: { tags?: Record<string, string>; context?: Record<string, unknown> }
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (initialized) {
        Sentry.withScope((scope) => {
          if (options?.tags) {
            Object.entries(options.tags).forEach(([key, value]) => {
              scope.setTag(key, value);
            });
          }
          if (options?.context) {
            scope.setContext('function_context', filterSensitiveData(options.context) as Record<string, unknown>);
          }
          Sentry.captureException(error);
        });
      }
      throw error;
    }
  };
}

/**
 * Manually record an operation timing to Sentry
 */
export function recordOperation(
  name: string,
  duration: number,
  success: boolean,
  metadata?: Record<string, unknown>
): void {
  if (!initialized) return;

  Sentry.addBreadcrumb({
    category: 'operation',
    message: name,
    level: success ? 'info' : 'warning',
    data: {
      duration_ms: duration,
      success,
      ...metadata,
    },
  });
}

/**
 * Record an external API call as a Sentry breadcrumb
 */
export function recordSentryExternalCall(
  service: string,
  method: string,
  url: string,
  statusCode: number,
  duration: number
): void {
  if (!initialized) return;

  Sentry.addBreadcrumb({
    category: 'external.api',
    message: `${method} ${service}`,
    level: statusCode >= 400 ? 'warning' : 'info',
    data: {
      service,
      method,
      url: filterSensitiveData(url),
      status_code: statusCode,
      duration_ms: duration,
    },
  });
}
