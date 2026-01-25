import helmet from 'helmet';
import cors from 'cors';
import crypto from 'crypto';
import { Express, Request, Response, NextFunction } from 'express';

// Production security configuration
// Note: Rate limiting is handled in routes.ts to avoid conflicts
export function configureSecurityMiddleware(app: Express) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Disable X-Powered-By header
  app.disable('x-powered-by');
  
  // Security headers with helmet - disable CSP temporarily to diagnose production issue
  if (isProduction) {
    app.use(helmet({
      contentSecurityPolicy: false, // Temporarily disabled to diagnose white screen
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }));
  } else {
    // Development mode - relaxed CSP for Vite HMR
    app.use(helmet({
      contentSecurityPolicy: false, // Disable CSP in dev for Vite
      hsts: false,
    }));
  }
  
  // CORS configuration
  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      // In production, restrict to specific domains
      if (isProduction) {
        // Allow requests with no origin (same-origin requests, server-to-server)
        if (!origin) {
          return callback(null, true);
        }
        
        // Get allowed origins from environment or allow same-site requests
        const allowedOrigins = process.env.CORS_ORIGIN 
          ? process.env.CORS_ORIGIN.split(',') 
          : [];
        
        // Also allow .replit.app and production domains
        const originLower = origin.toLowerCase();
        const isReplitDomain = originLower.endsWith('.replit.app');
        const isProductionDomain = originLower.includes('thejohnsonbros.com') || 
                                    originLower.includes('theabingtonplumber.com');
        
        if (allowedOrigins.includes(origin) || isReplitDomain || isProductionDomain) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      } else {
        // Development mode - allow all
        callback(null, true);
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  };
  
  app.use(cors(corsOptions));
  
  // Request size limiting
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Limit request body size to prevent DoS
    const maxSize = 10 * 1024 * 1024; // 10MB
    let size = 0;
    
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxSize) {
        res.status(413).json({ error: 'Request entity too large' });
        req.destroy();
      }
    });
    
    next();
  });
  
  // XSS Protection - sanitize query parameters
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Sanitize query parameters - use Object.create(null) to prevent prototype pollution
    const sanitizedQuery = Object.create(null);
    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
    
    for (const key in req.query) {
      // Skip dangerous property names that could cause issues
      if (dangerousKeys.includes(key)) {
        continue;
      }
      
      if (Object.prototype.hasOwnProperty.call(req.query, key)) {
        const value = req.query[key];
        const sanitizedValue = typeof value === 'string' 
          ? value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') 
          : value;
        
        Object.defineProperty(sanitizedQuery, key, {
          value: sanitizedValue,
          enumerable: true,
          writable: true,
          configurable: true
        });
      }
    }
    req.query = sanitizedQuery;
    next();
  });
}

// CSRF Protection using double-submit cookie pattern
export function csrfProtection() {
  return (req: Request, res: Response, next: NextFunction) => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Generate CSRF token if not present
    if (!req.cookies || !req.cookies['csrf-token']) {
      const token = crypto.randomBytes(32).toString('hex');
      res.cookie('csrf-token', token, {
        httpOnly: false, // Needs to be readable by frontend
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
    }
    
    // Verify CSRF token for state-changing requests
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      // Allow internal server-to-server calls with shared secret (only if configured)
      if (process.env.INTERNAL_SECRET) {
        const internalSecret = req.headers['x-internal-secret'];
        if (internalSecret === process.env.INTERNAL_SECRET) {
          return next();
        }
      }
      
      const cookieToken = req.cookies?.['csrf-token'];
      const headerToken = req.headers['x-csrf-token'];
      
      if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        return res.status(403).json({ error: 'CSRF token validation failed' });
      }
    }
    
    next();
  };
}

// Get CSRF token endpoint
export function getCsrfToken() {
  return (req: Request, res: Response) => {
    const token = req.cookies?.['csrf-token'] || crypto.randomBytes(32).toString('hex');
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.cookie('csrf-token', token, {
      httpOnly: false,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });
    
    res.json({ csrfToken: token });
  };
}

// Session security configuration
export function getSessionConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Require SESSION_SECRET in production
  if (isProduction && !process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is required in production');
  }
  
  // Use a dev-only fallback secret in development
  const sessionSecret = process.env.SESSION_SECRET || 
    (isProduction ? '' : 'dev-only-session-secret-not-for-production');
  
  if (!sessionSecret) {
    throw new Error('SESSION_SECRET environment variable is required');
  }
  
  return {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    rolling: true, // Reset expiry on activity
    cookie: {
      secure: isProduction || process.env.SECURE_COOKIES === 'true',
      httpOnly: true,
      maxAge: parseInt(process.env.SESSION_DURATION || '86400000'), // 24 hours default
      sameSite: isProduction ? 'strict' as const : 'lax' as const,
      domain: process.env.COOKIE_DOMAIN,
    },
    name: 'sessionId', // Don't use default 'connect.sid'
  };
}