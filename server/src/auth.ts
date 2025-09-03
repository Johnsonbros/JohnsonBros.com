import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../db';
import { adminUsers, adminSessions, adminPermissions, adminActivityLogs } from '@shared/schema';
import { eq, and, gt } from 'drizzle-orm';

// Session management
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

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

// Generate session token
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Create session
export async function createSession(userId: number, ipAddress?: string, userAgent?: string) {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);
  
  await db.insert(adminSessions).values({
    userId,
    sessionToken: token,
    expiresAt,
    ipAddress,
    userAgent
  });
  
  // Update last login
  await db.update(adminUsers)
    .set({ lastLoginAt: new Date() })
    .where(eq(adminUsers.id, userId));
  
  return { token, expiresAt };
}

// Validate session
export async function validateSession(token: string) {
  const [session] = await db.select()
    .from(adminSessions)
    .where(
      and(
        eq(adminSessions.sessionToken, token),
        gt(adminSessions.expiresAt, new Date())
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
  
  // Add user data to request
  (req as any).user = sessionData.user;
  (req as any).permissions = sessionData.permissions;
  
  next();
}

// Middleware: Check permission
export function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const permissions = (req as any).permissions || [];
    
    if (!permissions.includes(permission)) {
      // Log unauthorized access attempt
      if ((req as any).user) {
        await db.insert(adminActivityLogs).values({
          userId: (req as any).user.id,
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
    const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'JohnsonBros2025!';
    const hashedPassword = await hashPassword(defaultPassword);
    
    await db.insert(adminUsers).values({
      email: 'Sales@thejohnsonbros.com',
      passwordHash: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'super_admin',
      isActive: true
    });
    
    console.log('Default super admin created');
    console.log('Email: Sales@thejohnsonbros.com');
    console.log('Password:', defaultPassword);
  }
}