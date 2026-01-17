import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../db';
import { adminUsers, adminSessions, adminPermissions, adminActivityLogs } from '@shared/schema';
import { eq, and, gt, isNull, ne } from 'drizzle-orm';

// Session management
export const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
export const SESSION_ROTATION_INTERVAL = 60 * 60 * 1000; // Rotate every hour
export const SESSION_ACTIVITY_EXTEND = 30 * 60 * 1000; // Extend by 30 minutes on activity
export const MAX_LOGIN_ATTEMPTS = 5; // Lock account after 5 failed attempts
export const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes lockout

// Permission definitions by role
const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: [
    'users.view', 'users.create', 'users.edit', 'users.delete',
    'dashboard.view', 'dashboard.customize',
    'reports.view', 'reports.create', 'reports.export',
    'blog.view', 'blog.create', 'blog.edit', 'blog.delete',
    'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.delete', 'tasks.assign',
    'ai.chat', 'ai.generate_documents',
    'customers.view', 'customers.edit',
    'jobs.view', 'jobs.edit',
    'billing.view', 'billing.edit',
    'settings.view', 'settings.edit',
    'google_ads.view', 'google_ads.edit',
    'analytics.view'
  ],
  admin: [
    'dashboard.view', 'dashboard.customize',
    'reports.view', 'reports.create',
    'blog.view', 'blog.create', 'blog.edit',
    'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.assign',
    'ai.chat', 'ai.generate_documents',
    'customers.view', 'customers.edit',
    'jobs.view', 'jobs.edit',
    'billing.view',
    'google_ads.view', 'google_ads.edit',
    'analytics.view'
  ],
  tech: [
    'dashboard.view',
    'tasks.view', 'tasks.edit',
    'customers.view',
    'jobs.view', 'jobs.edit',
    'ai.chat'
  ],
  staff: [
    'dashboard.view',
    'tasks.view',
    'customers.view',
    'jobs.view',
    'ai.chat'
  ]
};

// Initialize default permissions in database
export async function initializePermissions() {
  for (const [role, permissions] of Object.entries(ROLE_PERMISSIONS)) {
    const existing = await db.select().from(adminPermissions).where(eq(adminPermissions.role, role)).limit(1);

    if (existing.length === 0) {
      await db.insert(adminPermissions).values({
        role,
        permissions
      });
    }
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Check if account is locked
export async function isAccountLocked(userId: number): Promise<boolean> {
  const [user] = await db.select()
    .from(adminUsers)
    .where(eq(adminUsers.id, userId))
    .limit(1);

  if (!user || !user.lockedUntil) return false;

  // Check if lockout period has expired
  if (new Date() > user.lockedUntil) {
    // Reset lockout
    await db.update(adminUsers)
      .set({
        lockedUntil: null,
        failedLoginAttempts: 0
      })
      .where(eq(adminUsers.id, userId));
    return false;
  }

  return true;
}

// Record failed login attempt
export async function recordFailedLogin(userId: number): Promise<void> {
  const [user] = await db.select()
    .from(adminUsers)
    .where(eq(adminUsers.id, userId))
    .limit(1);

  if (!user) return;

  const newAttempts = (user.failedLoginAttempts || 0) + 1;

  // Lock account if max attempts reached
  if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
    await db.update(adminUsers)
      .set({
        failedLoginAttempts: newAttempts,
        lockedUntil: new Date(Date.now() + LOCKOUT_DURATION)
      })
      .where(eq(adminUsers.id, userId));
  } else {
    await db.update(adminUsers)
      .set({ failedLoginAttempts: newAttempts })
      .where(eq(adminUsers.id, userId));
  }
}

// Reset failed login attempts on successful login
export async function resetFailedLogins(userId: number): Promise<void> {
  await db.update(adminUsers)
    .set({
      failedLoginAttempts: 0,
      lockedUntil: null
    })
    .where(eq(adminUsers.id, userId));
}

// Generate session token
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Create session
export async function createSession(userId: number, ipAddress?: string, userAgent?: string) {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);
  const now = new Date();

  await db.insert(adminSessions).values({
    userId,
    sessionToken: token,
    expiresAt,
    ipAddress,
    userAgent,
    lastRotatedAt: now,
    lastActivityAt: now
  });

  // Update last login
  await db.update(adminUsers)
    .set({ lastLoginAt: now })
    .where(eq(adminUsers.id, userId));

  return { token, expiresAt };
}

// Validate session
export async function validateSession(token: string, shouldExtend: boolean = true) {
  const [session] = await db.select()
    .from(adminSessions)
    .where(
      and(
        eq(adminSessions.sessionToken, token),
        gt(adminSessions.expiresAt, new Date()),
        isNull(adminSessions.revokedAt) // Check session not revoked
      )
    )
    .limit(1);

  if (!session) return null;

  const [user] = await db.select()
    .from(adminUsers)
    .where(eq(adminUsers.id, session.userId))
    .limit(1);

  if (!user || !user.isActive) return null;

  const [permissions] = await db.select()
    .from(adminPermissions)
    .where(eq(adminPermissions.role, user.role))
    .limit(1);

  // Sliding expiration - extend session on activity
  if (shouldExtend) {
    const now = new Date();
    const timeSinceLastActivity = now.getTime() - session.lastActivityAt.getTime();

    // Extend session if active within the last 30 minutes
    if (timeSinceLastActivity < SESSION_ACTIVITY_EXTEND) {
      const newExpiresAt = new Date(now.getTime() + SESSION_DURATION);
      await db.update(adminSessions)
        .set({
          expiresAt: newExpiresAt,
          lastActivityAt: now
        })
        .where(eq(adminSessions.id, session.id));

      session.expiresAt = newExpiresAt;
      session.lastActivityAt = now;
    }
  }

  return {
    user,
    session,
    permissions: permissions?.permissions || []
  };
}

// Middleware: Authenticate user
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const sessionData = await validateSession(token);

  if (!sessionData) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  // Add user data to request with proper typing
  const authReq = req as AuthenticatedRequest;
  authReq.user = sessionData.user;
  authReq.permissions = sessionData.permissions;

  next();
}

// Middleware: Check permission
export function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const permissions = authReq.permissions || [];

    if (!permissions.includes(permission)) {
      // Log unauthorized access attempt
      if (authReq.user) {
        await db.insert(adminActivityLogs).values({
          userId: authReq.user.id,
          action: 'unauthorized_access',
          entityType: 'permission',
          entityId: permission,
          details: JSON.stringify({
            requestedPermission: permission,
            userPermissions: permissions,
            path: req.path,
            method: req.method
          }),
          ipAddress: req.ip
        });
      }

      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

// Session rotation - rotate token on privileged actions or after interval
export async function rotateSession(sessionId: number): Promise<string | null> {
  try {
    const [session] = await db.select()
      .from(adminSessions)
      .where(
        and(
          eq(adminSessions.id, sessionId),
          isNull(adminSessions.revokedAt)
        )
      )
      .limit(1);

    if (!session) return null;

    // Generate new token
    const newToken = generateSessionToken();
    const now = new Date();

    // Update session with new token
    await db.update(adminSessions)
      .set({
        sessionToken: newToken,
        lastRotatedAt: now
      })
      .where(eq(adminSessions.id, sessionId));

    return newToken;
  } catch (error) {
    console.error('Session rotation error:', error);
    return null;
  }
}

// Revoke a specific session
export async function revokeSession(sessionId: number, reason?: string): Promise<void> {
  await db.update(adminSessions)
    .set({
      revokedAt: new Date(),
      revokedReason: reason || 'Manual revocation'
    })
    .where(eq(adminSessions.id, sessionId));
}

// Revoke all sessions for a user
export async function revokeUserSessions(userId: number, reason?: string): Promise<void> {
  await db.update(adminSessions)
    .set({
      revokedAt: new Date(),
      revokedReason: reason || 'All user sessions revoked'
    })
    .where(
      and(
        eq(adminSessions.userId, userId),
        isNull(adminSessions.revokedAt)
      )
    );
}

// Revoke all sessions (emergency)
export async function revokeAllSessions(reason?: string): Promise<void> {
  await db.update(adminSessions)
    .set({
      revokedAt: new Date(),
      revokedReason: reason || 'Emergency: All sessions revoked'
    })
    .where(isNull(adminSessions.revokedAt));
}

// Check if session needs rotation
export function shouldRotateSession(session: any): boolean {
  const now = new Date();
  const timeSinceRotation = now.getTime() - session.lastRotatedAt.getTime();
  return timeSinceRotation > SESSION_ROTATION_INTERVAL;
}

// Log activity
export async function logActivity(
  userId: number,
  action: string,
  entityType?: string,
  entityId?: string,
  details?: any,
  ipAddress?: string
) {
  await db.insert(adminActivityLogs).values({
    userId,
    action,
    entityType,
    entityId,
    details: details ? JSON.stringify(details) : undefined,
    ipAddress
  });
}

// Create default super admin if none exists
export async function ensureSuperAdmin() {
  const admins = await db.select()
    .from(adminUsers)
    .where(eq(adminUsers.role, 'super_admin'))
    .limit(1);

  if (admins.length === 0) {
    console.warn('═══════════════════════════════════════════════════════════');
    console.warn('⚠️  NO SUPER ADMIN EXISTS - APPLICATION SECURITY AT RISK');
    console.warn('═══════════════════════════════════════════════════════════');
    console.warn('');
    console.warn('Please run the admin setup script to create a super admin:');
    console.warn('  npm run setup:admin');
    console.warn('');
    console.warn('Or set these environment variables for automatic setup:');
    console.warn('  SUPER_ADMIN_EMAIL - Email for the super admin account');
    console.warn('  SUPER_ADMIN_PASSWORD - Secure password (min 12 chars)');
    console.warn('  SUPER_ADMIN_NAME - Admin full name (optional)');
    console.warn('');
    console.warn('For backward compatibility, these are also checked:');
    console.warn('  ADMIN_EMAIL, ADMIN_DEFAULT_PASSWORD, ADMIN_FIRST_NAME, ADMIN_LAST_NAME');
    console.warn('═══════════════════════════════════════════════════════════');

    // Check new environment variables first, then fall back to old ones
    const adminEmail = process.env.SUPER_ADMIN_EMAIL ||
      process.env.ADMIN_EMAIL;

    const defaultPassword = process.env.SUPER_ADMIN_PASSWORD ||
      process.env.ADMIN_DEFAULT_PASSWORD;

    // Parse name from SUPER_ADMIN_NAME or use individual name env vars
    let firstName = 'Admin';
    let lastName = 'User';

    if (process.env.SUPER_ADMIN_NAME) {
      const nameParts = process.env.SUPER_ADMIN_NAME.split(' ');
      firstName = nameParts[0] || 'Admin';
      lastName = nameParts.slice(1).join(' ') || 'User';
    } else {
      firstName = process.env.ADMIN_FIRST_NAME || 'Admin';
      lastName = process.env.ADMIN_LAST_NAME || 'User';
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (adminEmail && !emailRegex.test(adminEmail)) {
      console.error('❌ Invalid SUPER_ADMIN_EMAIL format');
      return;
    }

    if (adminEmail && defaultPassword && defaultPassword.length >= 12) {
      const hashedPassword = await hashPassword(defaultPassword);

      await db.insert(adminUsers).values({
        email: adminEmail,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        role: 'super_admin',
        isActive: true
      });

      console.log('✅ Super admin created automatically');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Name: ${firstName} ${lastName}`);
      console.log('   Password: [Set via environment variable]');
    }
  }
}