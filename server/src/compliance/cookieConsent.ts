/**
 * Cookie Consent Management
 *
 * Handles cookie consent tracking and enforcement for GDPR/CCPA compliance.
 * Manages consent categories: necessary, analytics, and marketing.
 */

import type { Request, Response, NextFunction, RequestHandler, Router as ExpressRouter } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { db } from '../../db';
import { cookieConsents } from '@shared/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

// Consent categories
export interface ConsentStatus {
  necessary: boolean; // Always true
  analytics: boolean;
  marketing: boolean;
  hasConsented: boolean; // User has made a choice
  timestamp: string | null;
  version: string;
}

// Cookie name constants
const CONSENT_COOKIE_NAME = 'cookie_consent';
const VISITOR_ID_COOKIE_NAME = 'visitor_id';
const CONSENT_VERSION = '1.0';

// Cookie options
function getCookieOptions(isProduction: boolean) {
  return {
    httpOnly: false, // Needs to be readable by frontend JS
    secure: isProduction,
    sameSite: isProduction ? 'strict' as const : 'lax' as const,
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    path: '/',
  };
}

// Validation schema for consent update
const consentUpdateSchema = z.object({
  analytics: z.boolean().optional(),
  marketing: z.boolean().optional(),
});

/**
 * Get or create visitor ID
 */
function getOrCreateVisitorId(req: Request, res: Response): string {
  let visitorId = req.cookies?.[VISITOR_ID_COOKIE_NAME];

  if (!visitorId) {
    visitorId = crypto.randomUUID();
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie(VISITOR_ID_COOKIE_NAME, visitorId, {
      ...getCookieOptions(isProduction),
      httpOnly: true, // Visitor ID doesn't need to be readable by frontend
    });
  }

  return visitorId;
}

/**
 * Parse consent cookie value
 */
function parseConsentCookie(cookieValue: string | undefined): ConsentStatus | null {
  if (!cookieValue) return null;

  try {
    const parsed = JSON.parse(cookieValue);
    return {
      necessary: true, // Always true
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      hasConsented: true,
      timestamp: parsed.timestamp || null,
      version: parsed.version || '1.0',
    };
  } catch {
    return null;
  }
}

/**
 * Get consent status from request
 */
export function getConsentStatus(req: Request): ConsentStatus {
  const cookieValue = req.cookies?.[CONSENT_COOKIE_NAME];
  const parsed = parseConsentCookie(cookieValue);

  if (parsed) {
    return parsed;
  }

  // Default: no consent given yet
  return {
    necessary: true,
    analytics: false,
    marketing: false,
    hasConsented: false,
    timestamp: null,
    version: CONSENT_VERSION,
  };
}

/**
 * Set consent preferences
 */
export function setConsent(
  res: Response,
  consent: { analytics?: boolean; marketing?: boolean }
): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const timestamp = new Date().toISOString();

  const consentValue = {
    necessary: true,
    analytics: consent.analytics ?? false,
    marketing: consent.marketing ?? false,
    timestamp,
    version: CONSENT_VERSION,
  };

  res.cookie(
    CONSENT_COOKIE_NAME,
    JSON.stringify(consentValue),
    getCookieOptions(isProduction)
  );
}

/**
 * Middleware to require specific consent category
 * Use this to gate analytics or marketing endpoints
 */
export function requireConsent(category: 'analytics' | 'marketing'): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const consent = getConsentStatus(req);

    if (!consent[category]) {
      return res.status(403).json({
        success: false,
        error: {
          message: `Consent for ${category} cookies required`,
          code: 'CONSENT_REQUIRED',
          category,
        },
      });
    }

    next();
  };
}

/**
 * Save consent to database
 */
async function saveConsentToDb(
  visitorId: string,
  userId: string | undefined,
  consent: { analytics: boolean; marketing: boolean },
  req: Request
): Promise<void> {
  try {
    // Check if consent record exists for this visitor
    const existing = await db.query.cookieConsents.findFirst({
      where: eq(cookieConsents.visitorId, visitorId),
    });

    const ip = req.ip || req.socket?.remoteAddress || null;
    const userAgent = req.get('user-agent')?.substring(0, 500) || null;

    if (existing) {
      // Update existing record
      await db.update(cookieConsents)
        .set({
          analytics: consent.analytics,
          marketing: consent.marketing,
          userId: userId || existing.userId,
          ip,
          userAgent,
          version: CONSENT_VERSION,
          updatedAt: new Date(),
        })
        .where(eq(cookieConsents.visitorId, visitorId));
    } else {
      // Insert new record
      await db.insert(cookieConsents).values({
        visitorId,
        userId: userId || null,
        necessary: true,
        analytics: consent.analytics,
        marketing: consent.marketing,
        version: CONSENT_VERSION,
        ip,
        userAgent,
      });
    }
  } catch (error) {
    // Log but don't fail the request
    console.error('[COOKIE CONSENT] Failed to save consent to database:', error);
  }
}

/**
 * Cookie consent API router
 */
export const consentRouter: ExpressRouter = Router();

// GET /consent/status - Get current consent status
consentRouter.get('/status', (req: Request, res: Response) => {
  const consent = getConsentStatus(req);
  res.json({
    success: true,
    data: consent,
  });
});

// POST /consent - Update consent preferences
consentRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate input
    const result = consentUpdateSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid consent data',
          code: 'VALIDATION_ERROR',
        },
      });
    }

    const { analytics, marketing } = result.data;
    const visitorId = getOrCreateVisitorId(req, res);
    const userId = (req as Request & { user?: { id: string } }).user?.id;

    // Get current consent and merge with updates
    const currentConsent = getConsentStatus(req);
    const newConsent = {
      analytics: analytics ?? currentConsent.analytics,
      marketing: marketing ?? currentConsent.marketing,
    };

    // Set consent cookie
    setConsent(res, newConsent);

    // Save to database (async, don't block response)
    saveConsentToDb(visitorId, userId, newConsent, req);

    res.json({
      success: true,
      data: {
        necessary: true,
        analytics: newConsent.analytics,
        marketing: newConsent.marketing,
        hasConsented: true,
        timestamp: new Date().toISOString(),
        version: CONSENT_VERSION,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /consent/accept-all - Accept all cookies
consentRouter.post('/accept-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const visitorId = getOrCreateVisitorId(req, res);
    const userId = (req as Request & { user?: { id: string } }).user?.id;

    const consent = {
      analytics: true,
      marketing: true,
    };

    // Set consent cookie
    setConsent(res, consent);

    // Save to database
    saveConsentToDb(visitorId, userId, consent, req);

    res.json({
      success: true,
      data: {
        necessary: true,
        analytics: true,
        marketing: true,
        hasConsented: true,
        timestamp: new Date().toISOString(),
        version: CONSENT_VERSION,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /consent/necessary-only - Accept only necessary cookies
consentRouter.post('/necessary-only', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const visitorId = getOrCreateVisitorId(req, res);
    const userId = (req as Request & { user?: { id: string } }).user?.id;

    const consent = {
      analytics: false,
      marketing: false,
    };

    // Set consent cookie
    setConsent(res, consent);

    // Save to database
    saveConsentToDb(visitorId, userId, consent, req);

    res.json({
      success: true,
      data: {
        necessary: true,
        analytics: false,
        marketing: false,
        hasConsented: true,
        timestamp: new Date().toISOString(),
        version: CONSENT_VERSION,
      },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /consent - Withdraw consent (reset to necessary only)
consentRouter.delete('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const visitorId = req.cookies?.[VISITOR_ID_COOKIE_NAME];
    const userId = (req as Request & { user?: { id: string } }).user?.id;

    const consent = {
      analytics: false,
      marketing: false,
    };

    // Set consent cookie
    setConsent(res, consent);

    // Save to database if we have a visitor ID
    if (visitorId) {
      saveConsentToDb(visitorId, userId, consent, req);
    }

    res.json({
      success: true,
      message: 'Consent withdrawn. Only necessary cookies will be used.',
      data: {
        necessary: true,
        analytics: false,
        marketing: false,
        hasConsented: true,
        timestamp: new Date().toISOString(),
        version: CONSENT_VERSION,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Helper to check if analytics consent is given
 */
export function hasAnalyticsConsent(req: Request): boolean {
  return getConsentStatus(req).analytics;
}

/**
 * Helper to check if marketing consent is given
 */
export function hasMarketingConsent(req: Request): boolean {
  return getConsentStatus(req).marketing;
}
