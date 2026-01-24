/**
 * Compliance API Routes
 *
 * Consolidated routes for GDPR/CCPA compliance features:
 * - Cookie consent management (public)
 * - Privacy data access (authenticated)
 */

import { Router } from 'express';
import { consentRouter } from './compliance/cookieConsent';
import { privacyRouter } from './compliance/privacy';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiter for compliance endpoints (prevent abuse)
const complianceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per window
  message: {
    success: false,
    error: {
      message: 'Too many requests. Please try again later.',
      code: 'RATE_LIMITED',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiter for data export/deletion (expensive operations)
const dataOperationsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  message: {
    success: false,
    error: {
      message: 'Too many data requests. Please try again later.',
      code: 'RATE_LIMITED',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general rate limiter to all compliance routes
router.use(complianceLimiter);

// Cookie consent routes (public - no auth required)
// GET  /api/compliance/consent/status - Get current consent status
// POST /api/compliance/consent - Update consent preferences
// POST /api/compliance/consent/accept-all - Accept all cookies
// POST /api/compliance/consent/necessary-only - Accept only necessary
// DELETE /api/compliance/consent - Withdraw consent
router.use('/consent', consentRouter);

// Privacy routes (authenticated)
// GET  /api/compliance/privacy/summary - Get data summary
// POST /api/compliance/privacy/export - Export user data (rate limited)
// POST /api/compliance/privacy/delete - Request data deletion (rate limited)
// DELETE /api/compliance/privacy/delete - Cancel deletion request
router.use('/privacy', privacyRouter);

// Apply stricter rate limiting to expensive operations
router.use('/privacy/export', dataOperationsLimiter);
router.use('/privacy/delete', dataOperationsLimiter);

export default router;
