// Structured logging utility with Sentry integration
import type { SeverityLevel } from '@sentry/node';

export interface LogContext {
  requestId?: string;
  upstream?: string;
  latency?: number;
  cacheHit?: boolean;
  error?: string;
  stack?: string;
  [key: string]: any;
}

/**
 * Normalize an unknown error to extract message and stack
 */
export function normalizeError(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
    };
  }

  if (typeof error === 'string') {
    return { message: error };
  }

  return { message: String(error) };
}

/**
 * Get error message from unknown error (for response bodies)
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return String(error);
}

/**
 * Get Sentry instance if available (lazy import to avoid circular deps)
 */
function getSentryModule() {
  try {
    const observability = require('./observability');
    return observability;
  } catch {
    return null;
  }
}

export class Logger {
  private static requestId = 0;

  static generateRequestId(): string {
    return `req_${Date.now()}_${++this.requestId}`;
  }

  static log(level: 'info' | 'warn' | 'error' | 'debug', message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
    };

    const output = JSON.stringify(logEntry);

    // Output to console
    switch (level) {
      case 'error':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'debug':
        if (process.env.NODE_ENV === 'development') {
          console.log(output);
        }
        break;
      default:
        console.log(output);
    }

    // Send to Sentry if enabled and it's an error or warning
    if ((level === 'error' || level === 'warn') && process.env.SENTRY_DSN) {
      this.captureToSentry(message, level, context);
    }
  }

  private static captureToSentry(message: string, level: 'error' | 'warn', context?: LogContext) {
    try {
      const sentry = getSentryModule();
      if (!sentry || !sentry.isSentryInitialized()) return;

      const sentryLevel: SeverityLevel = level === 'error' ? 'error' : 'warning';
      sentry.captureMessage(message, sentryLevel, context);
    } catch {
      // Silently fail - don't let Sentry failures break logging
    }
  }

  static info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  static warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  static error(message: string, context?: LogContext) {
    this.log('error', message, context);
  }

  static debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }
}

/**
 * Convenience helper for logging errors with proper type normalization and Sentry capture
 */
export function logError(message: string, error: unknown, context?: LogContext) {
  const normalized = normalizeError(error);

  // Log to console and Sentry
  Logger.error(message, {
    ...context,
    error: normalized.message,
    stack: normalized.stack,
  });

  // Also capture the Error object to Sentry for better stack traces
  if (process.env.SENTRY_DSN && error instanceof Error) {
    try {
      const sentry = getSentryModule();
      if (sentry && sentry.isSentryInitialized()) {
        sentry.captureException(error, { message, ...context });
      }
    } catch {
      // Silently fail - don't let Sentry failures break error logging
    }
  }
}