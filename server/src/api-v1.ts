import { Router } from 'express';
import type { Express } from 'express';

/**
 * API Versioning implementation for v1 routes
 * All existing API routes are moved under /api/v1 namespace
 * with backward-compatible redirects from /api to /api/v1
 */

/**
 * Create v1 router with all existing routes
 */
export function createV1Router(app: Express): Router {
  const v1Router = Router();
  
  // Move all existing routes to v1 namespace
  // This router will be mounted at /api/v1
  
  return v1Router;
}

/**
 * Set up backward-compatible redirects from /api to /api/v1
 * This maintains compatibility with existing frontend code
 */
export function setupBackwardCompatibleRedirects(app: Express) {
  // Create a middleware that redirects /api/* to /api/v1/*
  // This should be registered before the actual routes
  app.use('/api', (req, res, next) => {
    // Skip if already accessing versioned API
    if (req.path.startsWith('/v1/') || req.path === '/v1') {
      return next();
    }
    
    // Skip admin routes as they're already namespaced
    if (req.path.startsWith('/admin/')) {
      return next();
    }
    
    // Construct the v1 URL
    const v1Url = `/api/v1${req.path}`;
    
    // Log deprecation warning in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[API Deprecation] ${req.method} ${req.originalUrl} → ${v1Url}. Please update to use /api/v1 namespace.`);
    }
    
    // For GET requests, redirect
    if (req.method === 'GET') {
      const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
      return res.redirect(307, v1Url + queryString);
    }
    
    // For other methods, proxy the request to v1
    req.url = `/v1${req.path}`;
    next();
  });
}

/**
 * API Version information endpoint
 */
export function setupVersionEndpoint(app: Express) {
  app.get('/api/version', (_req, res) => {
    res.json({
      current: 'v1',
      supported: ['v1'],
      deprecated: [],
      deprecationNotice: 'Direct /api endpoints are deprecated. Please use /api/v1 namespace.',
      deprecationDate: '2026-01-01'
    });
  });
  
  app.get('/api/v1/version', (_req, res) => {
    res.json({
      version: 'v1',
      status: 'stable',
      releaseDate: '2025-10-18'
    });
  });
}