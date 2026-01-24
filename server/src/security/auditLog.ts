/**
 * Security Audit Logging
 *
 * Logs security-sensitive operations for compliance and monitoring.
 * Includes authentication events, authorization failures, admin actions,
 * data access, and rate limit violations.
 */

import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { db } from '../../db';
import { auditLogs } from '@shared/schema';

// Audit event types
export type AuditAction =
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'session_expired'
  | 'password_change'
  | 'password_reset_request'
  | 'password_reset_complete'
  | 'account_locked'
  | 'account_unlocked'
  | 'authorization_failure'
  | 'rate_limit_exceeded'
  | 'admin_user_create'
  | 'admin_user_update'
  | 'admin_user_delete'
  | 'admin_config_change'
  | 'data_export'
  | 'data_deletion_request'
  | 'data_deletion_complete'
  | 'customer_view'
  | 'customer_update'
  | 'booking_create'
  | 'booking_update'
  | 'consent_update'
  | 'mfa_enabled'
  | 'mfa_disabled'
  | 'api_key_created'
  | 'api_key_revoked'
  | 'suspicious_activity';

// Audit event structure
export interface AuditEvent {
  action: AuditAction;
  userId?: string | null;
  resource?: string | null;
  success: boolean;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}

// Routes that should be auto-audited
const AUTO_AUDIT_ROUTES: Array<{
  pattern: RegExp;
  action: AuditAction;
  extractResource?: (req: Request) => string | undefined;
}> = [
  {
    pattern: /^\/api\/admin\/auth\/login$/,
    action: 'login_success', // Will be changed to login_failure based on response
  },
  {
    pattern: /^\/api\/admin\/auth\/logout$/,
    action: 'logout',
  },
  {
    pattern: /^\/api\/admin\/users\/?$/,
    action: 'admin_user_create',
  },
  {
    pattern: /^\/api\/admin\/users\/[^/]+$/,
    action: 'admin_user_update',
    extractResource: (req) => req.params?.id || req.path.split('/').pop(),
  },
  {
    pattern: /^\/api\/compliance\/privacy\/export$/,
    action: 'data_export',
  },
  {
    pattern: /^\/api\/compliance\/privacy\/delete$/,
    action: 'data_deletion_request',
  },
];

/**
 * Log an audit event to the database
 *
 * This function is async but doesn't block - errors are logged but don't affect the request
 */
export async function logAuditEvent(event: AuditEvent): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      action: event.action,
      userId: event.userId || null,
      resource: event.resource || null,
      success: event.success,
      ip: event.ip || null,
      userAgent: event.userAgent || null,
      metadata: event.metadata || null,
    });
  } catch (error) {
    // Log to console but don't fail the request
    console.error('[AUDIT LOG ERROR]', {
      timestamp: new Date().toISOString(),
      event,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Log audit event without awaiting (fire and forget)
 * Use this in request handlers to avoid blocking
 */
export function logAuditEventAsync(event: AuditEvent): void {
  // Don't await - fire and forget
  logAuditEvent(event).catch((err) => {
    console.error('[AUDIT LOG ASYNC ERROR]', err);
  });
}

/**
 * Extract user ID from request
 */
function getUserId(req: Request): string | undefined {
  // Check various places where user ID might be stored
  const user = (req as Request & { user?: { id?: string | number } }).user;
  if (user?.id) return String(user.id);

  const session = (req as Request & { session?: { userId?: string | number } }).session;
  if (session?.userId) return String(session.userId);

  return undefined;
}

/**
 * Extract client IP address
 */
function getClientIP(req: Request): string | undefined {
  // Trust X-Forwarded-For if behind a proxy (trust proxy must be set)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    return ips?.trim();
  }
  return req.ip || req.socket?.remoteAddress;
}

/**
 * Middleware to automatically log certain routes
 */
export function auditMiddleware(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    // Check if this route should be auto-audited
    const matchedRoute = AUTO_AUDIT_ROUTES.find(route => route.pattern.test(req.path));

    if (!matchedRoute) {
      return next();
    }

    // Capture the original end function
    const originalEnd = res.end;

    // Override end to log after response is sent
    res.end = function(this: Response, ...args: Parameters<typeof originalEnd>) {
      // Restore original function
      res.end = originalEnd;

      // Determine success based on status code
      const success = res.statusCode >= 200 && res.statusCode < 400;

      // Determine action - for login, change based on success
      let action = matchedRoute.action;
      if (action === 'login_success' && !success) {
        action = 'login_failure';
      }

      // Extract resource if specified
      const resource = matchedRoute.extractResource?.(req);

      // Log the event asynchronously
      logAuditEventAsync({
        action,
        userId: getUserId(req),
        resource,
        success,
        ip: getClientIP(req),
        userAgent: req.get('user-agent')?.substring(0, 500),
        metadata: {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration: Date.now() - startTime,
        },
      });

      // Call the original end function
      return originalEnd.apply(this, args);
    };

    next();
  };
}

/**
 * Helper to log authentication events
 */
export function logAuthEvent(
  action: 'login_success' | 'login_failure' | 'logout' | 'session_expired' | 'account_locked',
  req: Request,
  userId?: string,
  metadata?: Record<string, unknown>
): void {
  logAuditEventAsync({
    action,
    userId: userId || getUserId(req),
    success: action === 'login_success' || action === 'logout',
    ip: getClientIP(req),
    userAgent: req.get('user-agent')?.substring(0, 500),
    metadata: {
      ...metadata,
      path: req.path,
    },
  });
}

/**
 * Helper to log authorization failures (403 responses)
 */
export function logAuthorizationFailure(
  req: Request,
  resource: string,
  reason?: string
): void {
  logAuditEventAsync({
    action: 'authorization_failure',
    userId: getUserId(req),
    resource,
    success: false,
    ip: getClientIP(req),
    userAgent: req.get('user-agent')?.substring(0, 500),
    metadata: {
      method: req.method,
      path: req.path,
      reason,
    },
  });
}

/**
 * Helper to log rate limit violations
 */
export function logRateLimitExceeded(
  req: Request,
  limitType: string
): void {
  logAuditEventAsync({
    action: 'rate_limit_exceeded',
    userId: getUserId(req),
    resource: req.path,
    success: false,
    ip: getClientIP(req),
    userAgent: req.get('user-agent')?.substring(0, 500),
    metadata: {
      limitType,
      method: req.method,
    },
  });
}

/**
 * Helper to log admin actions
 */
export function logAdminAction(
  action: 'admin_user_create' | 'admin_user_update' | 'admin_user_delete' | 'admin_config_change',
  req: Request,
  resource: string,
  metadata?: Record<string, unknown>
): void {
  logAuditEventAsync({
    action,
    userId: getUserId(req),
    resource,
    success: true,
    ip: getClientIP(req),
    userAgent: req.get('user-agent')?.substring(0, 500),
    metadata,
  });
}

/**
 * Helper to log data access
 */
export function logDataAccess(
  action: 'customer_view' | 'customer_update' | 'data_export',
  req: Request,
  resource: string,
  metadata?: Record<string, unknown>
): void {
  logAuditEventAsync({
    action,
    userId: getUserId(req),
    resource,
    success: true,
    ip: getClientIP(req),
    userAgent: req.get('user-agent')?.substring(0, 500),
    metadata,
  });
}

/**
 * Helper to log GDPR/privacy events
 */
export function logPrivacyEvent(
  action: 'data_export' | 'data_deletion_request' | 'data_deletion_complete' | 'consent_update',
  req: Request,
  metadata?: Record<string, unknown>
): void {
  logAuditEventAsync({
    action,
    userId: getUserId(req),
    success: true,
    ip: getClientIP(req),
    userAgent: req.get('user-agent')?.substring(0, 500),
    metadata,
  });
}
