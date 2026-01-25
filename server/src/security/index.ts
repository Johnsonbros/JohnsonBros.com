/**
 * Security Module Index
 *
 * Barrel export for all security-related modules and unified initialization.
 */

import type { Express, RequestHandler, ErrorRequestHandler } from 'express';
import { corsMiddleware, corsConfig, checkOrigin, getAllowedOrigins } from './cors';
import { securityHeadersMiddleware, generateNonce, getCSPNonce } from './helmet';
import { errorSanitizerMiddleware, sanitizeError, createSafeError } from './errorSanitizer';
import {
  auditMiddleware,
  logAuditEvent,
  logAuditEventAsync,
  logAuthEvent,
  logAuthorizationFailure,
  logRateLimitExceeded,
  logAdminAction,
  logDataAccess,
  logPrivacyEvent,
} from './auditLog';

// Re-export everything
export {
  // CORS
  corsMiddleware,
  corsConfig,
  checkOrigin,
  getAllowedOrigins,
  // Helmet
  securityHeadersMiddleware,
  generateNonce,
  getCSPNonce,
  // Error Sanitizer
  errorSanitizerMiddleware,
  sanitizeError,
  createSafeError,
  // Audit Log
  auditMiddleware,
  logAuditEvent,
  logAuditEventAsync,
  logAuthEvent,
  logAuthorizationFailure,
  logRateLimitExceeded,
  logAdminAction,
  logDataAccess,
  logPrivacyEvent,
};

// Re-export types
export type { SanitizedError } from './errorSanitizer';
export type { AuditAction, AuditEvent } from './auditLog';

/**
 * Initialize all security middleware on an Express app
 *
 * This function applies security middleware in the correct order:
 * 1. Security headers (helmet) - Sets security headers on all responses
 * 2. CORS - Validates origin and handles preflight requests
 * 3. Audit middleware - Logs security-relevant events
 *
 * NOTE: Error sanitizer should be added AFTER all routes as the final error handler.
 *
 * @param app - Express application instance
 */
export function initSecurity(app: Express): void {
  const isProduction = process.env.NODE_ENV === 'production';

  // Log security initialization
  console.log('[SECURITY] Initializing security middleware', {
    environment: isProduction ? 'production' : 'development',
    allowedOrigins: getAllowedOrigins(),
  });

  // 1. Security headers (helmet) - must be first to set headers on all responses
  app.use(securityHeadersMiddleware());

  // 2. CORS - validates origin and handles preflight
  app.use(corsMiddleware());

  // 3. Audit middleware - logs security events
  app.use(auditMiddleware());

  console.log('[SECURITY] Security middleware initialized successfully');
}

/**
 * Get the error sanitizer middleware
 *
 * This should be added as the LAST middleware after all routes:
 * ```
 * app.use(getErrorHandler());
 * ```
 */
export function getErrorHandler(): ErrorRequestHandler {
  return errorSanitizerMiddleware();
}

/**
 * Security configuration summary for logging/debugging
 */
export function getSecurityConfig(): {
  corsOrigins: string[];
  cspEnabled: boolean;
  hstsEnabled: boolean;
  auditEnabled: boolean;
} {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    corsOrigins: getAllowedOrigins(),
    cspEnabled: isProduction, // CSP is only enabled in production
    hstsEnabled: isProduction, // HSTS is only enabled in production
    auditEnabled: true, // Audit logging is always enabled
  };
}
