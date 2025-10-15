// Structured logging utility
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
 * Convenience helper for logging errors with proper type normalization
 */
export function logError(message: string, error: unknown, context?: LogContext) {
  const normalized = normalizeError(error);
  Logger.error(message, {
    ...context,
    error: normalized.message,
    stack: normalized.stack,
  });
}