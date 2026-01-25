/**
 * Security Headers Configuration
 *
 * Configures HTTP security headers using helmet, including Content Security Policy,
 * HSTS, X-Frame-Options, and other security headers.
 */

import helmet from 'helmet';
import crypto from 'crypto';
import type { RequestHandler, Request, Response, NextFunction } from 'express';

// Generate a cryptographically secure nonce
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64');
}

// Build Content Security Policy directives
function buildCSPDirectives(nonce: string) {
  return {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      `'nonce-${nonce}'`,
      // Google Tag Manager & Analytics
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
      'https://googleads.g.doubleclick.net',
      'https://www.google.com',
      // Google Maps
      'https://maps.googleapis.com',
      'https://maps.gstatic.com',
      // Sentry for error tracking
      'https://browser.sentry-cdn.com',
      'https://*.sentry.io',
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'", // Required for Tailwind CSS and inline styles
      'https://fonts.googleapis.com',
    ],
    imgSrc: [
      "'self'",
      'data:',
      'blob:',
      'https:',
      // Specific trusted image sources
      'https://maps.gstatic.com',
      'https://maps.googleapis.com',
      'https://lh3.googleusercontent.com', // Google profile images
      'https://*.google.com',
      'https://*.googleapis.com',
    ],
    connectSrc: [
      "'self'",
      // OpenAI API
      'https://api.openai.com',
      // WebSocket connections
      'wss:',
      'ws:',
      // Google services
      'https://www.google-analytics.com',
      'https://analytics.google.com',
      'https://www.googletagmanager.com',
      'https://maps.googleapis.com',
      // Sentry
      'https://*.sentry.io',
      'https://sentry.io',
      // HousecallPro (if needed from browser)
      'https://api.housecallpro.com',
    ],
    fontSrc: [
      "'self'",
      'https://fonts.gstatic.com',
      'data:',
    ],
    frameSrc: [
      "'self'",
      'https://www.google.com', // For reCAPTCHA if used
      'https://www.youtube.com', // For embedded videos
      'https://player.vimeo.com',
    ],
    frameAncestors: ["'self'"],
    formAction: ["'self'"],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
  };
}

// Helmet configuration options
export function getHelmetConfig(nonce: string): Parameters<typeof helmet>[0] {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    // Content Security Policy
    contentSecurityPolicy: isProduction ? {
      useDefaults: false,
      directives: buildCSPDirectives(nonce),
      reportOnly: false, // Set to true to test without blocking
    } : false, // Disable CSP in development for Vite HMR

    // HTTP Strict Transport Security
    strictTransportSecurity: isProduction ? {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    } : false,

    // X-Frame-Options - prevent clickjacking
    frameguard: {
      action: 'sameorigin',
    },

    // X-Content-Type-Options - prevent MIME sniffing
    noSniff: true,

    // Referrer-Policy
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },

    // X-DNS-Prefetch-Control
    dnsPrefetchControl: {
      allow: true, // Allow DNS prefetching for performance
    },

    // X-Download-Options (IE specific)
    ieNoOpen: true,

    // X-Permitted-Cross-Domain-Policies
    permittedCrossDomainPolicies: {
      permittedPolicies: 'none',
    },

    // X-XSS-Protection (deprecated but still set for older browsers)
    xssFilter: true,

    // Don't expose powered-by header
    hidePoweredBy: true,

    // Cross-Origin-Embedder-Policy - we don't use this as it breaks some integrations
    crossOriginEmbedderPolicy: false,

    // Cross-Origin-Opener-Policy
    crossOriginOpenerPolicy: {
      policy: 'same-origin-allow-popups',
    },

    // Cross-Origin-Resource-Policy
    crossOriginResourcePolicy: {
      policy: 'cross-origin', // Allow cross-origin for public resources
    },

    // Origin-Agent-Cluster
    originAgentCluster: true,
  };
}

// Permissions Policy header (formerly Feature-Policy)
function getPermissionsPolicyHeader(): string {
  const policies = [
    'accelerometer=()',
    'autoplay=(self)',
    'camera=()',
    'cross-origin-isolated=()',
    'display-capture=()',
    'encrypted-media=(self)',
    'fullscreen=(self)',
    'geolocation=(self)', // Needed for location features
    'gyroscope=()',
    'keyboard-map=()',
    'magnetometer=()',
    'microphone=()', // Could enable for voice features
    'midi=()',
    'payment=()',
    'picture-in-picture=(self)',
    'publickey-credentials-get=()',
    'screen-wake-lock=()',
    'sync-xhr=()',
    'usb=()',
    'web-share=(self)',
    'xr-spatial-tracking=()',
  ];
  return policies.join(', ');
}

// Create security headers middleware
export function securityHeadersMiddleware(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    // Generate nonce for this request
    const nonce = generateNonce();

    // Store nonce for use in templates (if needed)
    res.locals.cspNonce = nonce;

    // Apply helmet middleware
    const helmetMiddleware = helmet(getHelmetConfig(nonce));

    // Apply helmet
    helmetMiddleware(req, res, (err) => {
      if (err) {
        return next(err);
      }

      // Add Permissions-Policy header (not included in helmet by default)
      res.setHeader('Permissions-Policy', getPermissionsPolicyHeader());

      // Add custom security headers
      res.setHeader('X-Request-Id', req.headers['x-request-id'] || crypto.randomUUID());

      // Cache control for security-sensitive pages
      if (req.path.startsWith('/api/admin') || req.path.startsWith('/admin')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }

      next();
    });
  };
}

// Get CSP nonce from response locals (for use in rendering)
export function getCSPNonce(res: Response): string {
  return res.locals.cspNonce || '';
}
