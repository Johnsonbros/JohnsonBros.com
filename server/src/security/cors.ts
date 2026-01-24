/**
 * Strict CORS Configuration
 *
 * Configures Cross-Origin Resource Sharing with an explicit whitelist
 * of allowed origins. Different configurations for development vs production.
 */

import cors from 'cors';
import type { RequestHandler, Request } from 'express';

// Allowed origins by environment
const ALLOWED_ORIGINS = {
  development: [
    'http://localhost:5000',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:5000',
    'http://127.0.0.1:3000',
  ],
  production: [
    'https://johnsonbrosplumbing.com',
    'https://www.johnsonbrosplumbing.com',
    'https://thejohnsonbros.com',
    'https://www.thejohnsonbros.com',
    'https://theabingtonplumber.com',
    'https://www.theabingtonplumber.com',
  ],
};

// Parse additional allowed origins from environment variable
function getEnvironmentOrigins(): string[] {
  const envOrigins = process.env.ALLOWED_ORIGINS;
  if (!envOrigins) return [];
  return envOrigins.split(',').map(origin => origin.trim()).filter(Boolean);
}

// Check if origin is allowed
function isOriginAllowed(origin: string | undefined, isProduction: boolean): boolean {
  // Allow requests with no origin (same-origin, server-to-server, mobile apps)
  if (!origin) return true;

  const origins = isProduction ? ALLOWED_ORIGINS.production : ALLOWED_ORIGINS.development;
  const envOrigins = getEnvironmentOrigins();
  const allAllowed = [...origins, ...envOrigins];

  // Check exact match
  if (allAllowed.includes(origin)) return true;

  // Allow Replit domains in non-production (for development/staging)
  if (!isProduction && origin.endsWith('.replit.app')) return true;
  if (!isProduction && origin.endsWith('.replit.dev')) return true;

  // In production, also allow configured production patterns
  if (isProduction) {
    const originLower = origin.toLowerCase();
    // Allow any subdomain of the main domains
    if (originLower.endsWith('.johnsonbrosplumbing.com')) return true;
    if (originLower.endsWith('.thejohnsonbros.com')) return true;
    if (originLower.endsWith('.theabingtonplumber.com')) return true;
  }

  return false;
}

// CORS configuration options
export const corsConfig: cors.CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const isProduction = process.env.NODE_ENV === 'production';

    if (isOriginAllowed(origin, isProduction)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    }
  },
  credentials: true, // Allow credentials (cookies, session)
  optionsSuccessStatus: 200, // Legacy browser support
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-CSRF-Token',
    'X-Requested-With',
    'Accept',
    'Accept-Language',
    'Cache-Control',
  ],
  exposedHeaders: [
    'X-Request-Id',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
  maxAge: 86400, // Cache preflight response for 24 hours
};

// Create CORS middleware
export function corsMiddleware(): RequestHandler {
  return cors(corsConfig);
}

// Simple CORS check function for use in other middleware
export function checkOrigin(req: Request): boolean {
  const origin = req.get('origin');
  const isProduction = process.env.NODE_ENV === 'production';
  return isOriginAllowed(origin, isProduction);
}

// Get list of all allowed origins (for debugging/admin)
export function getAllowedOrigins(): string[] {
  const isProduction = process.env.NODE_ENV === 'production';
  const origins = isProduction ? ALLOWED_ORIGINS.production : ALLOWED_ORIGINS.development;
  const envOrigins = getEnvironmentOrigins();
  return [...origins, ...envOrigins];
}
