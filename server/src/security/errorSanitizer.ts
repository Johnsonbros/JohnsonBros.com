/**
 * Error Sanitizer Middleware
 *
 * Sanitizes error responses for production to prevent information leakage.
 * Never exposes stack traces, internal paths, or database details to clients.
 */

import crypto from 'crypto';
import type { ErrorRequestHandler, Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { fromError as fromZodError } from 'zod-validation-error';

// Sanitized error response structure
export interface SanitizedError {
  success: false;
  error: {
    message: string;
    code: string;
    requestId: string;
    field?: string; // For validation errors
  };
}

// Internal error details for logging
interface InternalErrorDetails {
  message: string;
  stack?: string;
  code?: string;
  name: string;
  originalError?: unknown;
  sqlState?: string;
  constraint?: string;
}

// Error code mappings
const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  BAD_REQUEST: 'BAD_REQUEST',
} as const;

// PostgreSQL error codes
const PG_ERROR_CODES = {
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  NOT_NULL_VIOLATION: '23502',
  CHECK_VIOLATION: '23514',
  CONNECTION_ERROR: '08000',
  CONNECTION_REFUSED: '08006',
} as const;

// User-friendly messages for known error types
const ERROR_MESSAGES: Record<string, string> = {
  // HTTP Status based
  '400': 'Invalid request. Please check your input and try again.',
  '401': 'Authentication required. Please log in to continue.',
  '403': "You don't have permission to access this resource.",
  '404': 'The requested resource was not found.',
  '409': 'This record already exists or conflicts with existing data.',
  '429': 'Too many requests. Please wait a moment and try again.',
  '500': 'An unexpected error occurred. Our team has been notified.',
  '502': 'Service temporarily unavailable. Please try again shortly.',
  '503': 'Service temporarily unavailable. Please try again shortly.',

  // PostgreSQL errors
  [PG_ERROR_CODES.UNIQUE_VIOLATION]: 'This record already exists.',
  [PG_ERROR_CODES.FOREIGN_KEY_VIOLATION]: 'Referenced record not found.',
  [PG_ERROR_CODES.NOT_NULL_VIOLATION]: 'Required field is missing.',
  [PG_ERROR_CODES.CHECK_VIOLATION]: 'Invalid value provided.',
  [PG_ERROR_CODES.CONNECTION_ERROR]: 'Service temporarily unavailable. Please try again.',
  [PG_ERROR_CODES.CONNECTION_REFUSED]: 'Service temporarily unavailable. Please try again.',

  // Custom errors
  CSRF_INVALID: 'Security validation failed. Please refresh the page and try again.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  INVALID_TOKEN: 'Invalid or expired token. Please try again.',
};

// Patterns to detect sensitive information
const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /api[_-]?key/i,
  /token/i,
  /auth/i,
  /credential/i,
  /\.env/i,
  /node_modules/i,
  /\/home\//i,
  /\/var\//i,
  /\/usr\//i,
  /C:\\Users/i,
  /DATABASE_URL/i,
  /POSTGRES/i,
];

// Check if a string contains sensitive information
function containsSensitiveInfo(str: string): boolean {
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(str));
}

// Extract error details safely
function extractErrorDetails(error: unknown): InternalErrorDetails {
  if (error instanceof Error) {
    const pgError = error as Error & { code?: string; sqlState?: string; constraint?: string };
    return {
      message: error.message,
      stack: error.stack,
      code: pgError.code,
      name: error.name,
      sqlState: pgError.sqlState,
      constraint: pgError.constraint,
    };
  }

  if (typeof error === 'string') {
    return { message: error, name: 'StringError' };
  }

  if (typeof error === 'object' && error !== null) {
    const obj = error as Record<string, unknown>;
    return {
      message: String(obj.message || 'Unknown error'),
      name: String(obj.name || 'UnknownError'),
      code: obj.code as string | undefined,
    };
  }

  return { message: 'Unknown error', name: 'UnknownError' };
}

// Get HTTP status from error
function getStatusCode(error: unknown): number {
  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>;
    if (typeof err.status === 'number') return err.status;
    if (typeof err.statusCode === 'number') return err.statusCode;

    // Zod validation errors should be 400
    if (error instanceof ZodError) return 400;

    // PostgreSQL errors
    const pgError = error as { code?: string; sqlState?: string };
    if (pgError.code === PG_ERROR_CODES.UNIQUE_VIOLATION) return 409;
    if (pgError.code === PG_ERROR_CODES.FOREIGN_KEY_VIOLATION) return 400;
    if (pgError.code === PG_ERROR_CODES.NOT_NULL_VIOLATION) return 400;
    if (pgError.code === PG_ERROR_CODES.CONNECTION_ERROR ||
        pgError.code === PG_ERROR_CODES.CONNECTION_REFUSED) return 503;
  }

  return 500;
}

// Get error code for response
function getErrorCode(error: unknown, status: number): string {
  // Zod validation errors
  if (error instanceof ZodError) return ERROR_CODES.VALIDATION_ERROR;

  // PostgreSQL errors
  if (error && typeof error === 'object') {
    const pgError = error as { code?: string };
    if (pgError.code === PG_ERROR_CODES.UNIQUE_VIOLATION) return ERROR_CODES.CONFLICT;
    if (pgError.code?.startsWith('08')) return ERROR_CODES.SERVICE_UNAVAILABLE;
    if (pgError.code?.startsWith('23')) return ERROR_CODES.VALIDATION_ERROR;
  }

  // HTTP status based
  switch (status) {
    case 400: return ERROR_CODES.BAD_REQUEST;
    case 401: return ERROR_CODES.AUTHENTICATION_REQUIRED;
    case 403: return ERROR_CODES.FORBIDDEN;
    case 404: return ERROR_CODES.NOT_FOUND;
    case 409: return ERROR_CODES.CONFLICT;
    case 429: return ERROR_CODES.RATE_LIMITED;
    case 503: return ERROR_CODES.SERVICE_UNAVAILABLE;
    default: return ERROR_CODES.INTERNAL_ERROR;
  }
}

// Get user-friendly message
function getUserFriendlyMessage(error: unknown, status: number, requestId: string): string {
  // Zod validation errors - provide specific field information
  if (error instanceof ZodError) {
    const validationError = fromZodError(error, {
      prefix: null,
      maxIssuesInMessage: 3,
    });
    return validationError.message || 'Invalid input provided.';
  }

  // PostgreSQL errors
  if (error && typeof error === 'object') {
    const pgError = error as { code?: string };
    const pgMessage = ERROR_MESSAGES[pgError.code || ''];
    if (pgMessage) return pgMessage;
  }

  // Check for custom message that's safe to expose
  if (error instanceof Error) {
    const safeMessage = error.message;
    // Only expose message if it doesn't contain sensitive info
    if (!containsSensitiveInfo(safeMessage) && safeMessage.length < 200) {
      // Check if this looks like a user-friendly message
      if (!safeMessage.includes('\n') && !safeMessage.includes('at ')) {
        return safeMessage;
      }
    }
  }

  // Status-based messages
  const statusMessage = ERROR_MESSAGES[String(status)];
  if (statusMessage) {
    // For 500 errors, include request ID for support
    if (status >= 500) {
      return `${statusMessage} Reference: ${requestId}`;
    }
    return statusMessage;
  }

  return `An unexpected error occurred. Reference: ${requestId}`;
}

// Get first failed field for validation errors
function getFailedField(error: unknown): string | undefined {
  if (error instanceof ZodError && error.errors.length > 0) {
    const firstError = error.errors[0];
    if (firstError.path.length > 0) {
      return String(firstError.path[0]);
    }
  }
  return undefined;
}

/**
 * Sanitize an error for client response
 */
export function sanitizeError(error: unknown, requestId: string): SanitizedError {
  const status = getStatusCode(error);
  const code = getErrorCode(error, status);
  const message = getUserFriendlyMessage(error, status, requestId);
  const field = getFailedField(error);

  return {
    success: false,
    error: {
      message,
      code,
      requestId,
      ...(field && { field }),
    },
  };
}

/**
 * Error sanitizer middleware
 *
 * Must be registered as the last middleware in the chain.
 * Catches all errors and returns sanitized responses.
 */
export function errorSanitizerMiddleware(): ErrorRequestHandler {
  return (error: unknown, req: Request, res: Response, _next: NextFunction) => {
    const isProduction = process.env.NODE_ENV === 'production';

    // Generate or use existing request ID
    const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();

    // Extract error details for logging
    const errorDetails = extractErrorDetails(error);
    const status = getStatusCode(error);

    // Always log the full error internally
    console.error('[ERROR]', {
      timestamp: new Date().toISOString(),
      requestId,
      method: req.method,
      path: req.path,
      status,
      ip: req.ip,
      userAgent: req.get('user-agent')?.substring(0, 100),
      userId: (req as Request & { user?: { id: string } }).user?.id,
      error: {
        name: errorDetails.name,
        message: errorDetails.message,
        code: errorDetails.code,
        // Only log stack in development or for 500 errors
        ...((!isProduction || status >= 500) && { stack: errorDetails.stack }),
        ...(errorDetails.sqlState && { sqlState: errorDetails.sqlState }),
        ...(errorDetails.constraint && { constraint: errorDetails.constraint }),
      },
    });

    // Don't expose anything in production
    if (isProduction) {
      const sanitized = sanitizeError(error, requestId);
      return res.status(status).json(sanitized);
    }

    // In development, include more details for debugging
    const sanitized = sanitizeError(error, requestId);
    return res.status(status).json({
      ...sanitized,
      // Development-only debug info
      _debug: {
        originalMessage: errorDetails.message,
        stack: errorDetails.stack?.split('\n').slice(0, 10),
        code: errorDetails.code,
      },
    });
  };
}

/**
 * Utility to create a safe error with specific status code
 */
export function createSafeError(message: string, statusCode: number = 400): Error & { status: number } {
  const error = new Error(message) as Error & { status: number };
  error.status = statusCode;
  return error;
}
