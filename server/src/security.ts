import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { Express, Request, Response, NextFunction } from 'express';

// Production security configuration
export function configureSecurityMiddleware(app: Express) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Security headers with helmet - strict CSP for production
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // Remove unsafe-inline for production security - use nonce or hash-based CSP
        scriptSrc: ["'self'", "https://maps.googleapis.com"],
        styleSrc: ["'self'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https://api.housecallpro.com", "https://maps.googleapis.com"],
        frameSrc: ["'self'", "https://maps.googleapis.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }));
  
  // CORS configuration
  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      // In production, restrict to specific domains
      if (isProduction) {
        const allowedOrigins = process.env.CORS_ORIGIN 
          ? process.env.CORS_ORIGIN.split(',') 
          : ['https://yourdomain.com'];
        
        if (!origin || allowedOrigins.includes(origin)) {
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
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
  
  app.use(cors(corsOptions));
  
  // Global rate limiting
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProduction ? 100 : 1000, // Limit requests per IP
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: req.rateLimit?.resetTime,
      });
    },
  });
  
  app.use(globalLimiter);
  
  // Strict rate limiting for authentication endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Max 5 login attempts per IP
    skipSuccessfulRequests: true, // Don't count successful logins
    message: 'Too many login attempts, please try again later.',
  });
  
  app.use('/auth/login', authLimiter);
  app.use('/admin/login', authLimiter);
  
  // API rate limiting
  const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: isProduction ? 30 : 100, // 30 requests per minute in production
    message: 'API rate limit exceeded.',
  });
  
  app.use('/api/', apiLimiter);
  
  // Booking-specific rate limiting (prevent abuse)
  const bookingLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Max 10 booking attempts per hour per IP
    message: 'Too many booking attempts, please try again later.',
  });
  
  app.use('/api/booking', bookingLimiter);
  app.use('/api/lead', bookingLimiter);
  
  // Security middleware for production
  if (isProduction) {
    // Disable X-Powered-By header
    app.disable('x-powered-by');
    
    // Trust proxy for accurate IP addresses behind reverse proxy
    if (process.env.TRUST_PROXY === 'true') {
      app.set('trust proxy', 1);
    }
  }
  
  // Request size limiting
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Limit request body size to prevent DoS
    const maxSize = 10 * 1024 * 1024; // 10MB
    let size = 0;
    
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxSize) {
        res.status(413).json({ error: 'Request entity too large' });
        req.connection.destroy();
      }
    });
    
    next();
  });
  
  // XSS Protection
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Sanitize query parameters - use Object.create(null) to prevent prototype pollution
    const sanitizedQuery = Object.create(null);
    for (const key in req.query) {
      if (Object.prototype.hasOwnProperty.call(req.query, key) && typeof req.query[key] === 'string') {
        sanitizedQuery[key] = (req.query[key] as string).replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      } else if (Object.prototype.hasOwnProperty.call(req.query, key)) {
        sanitizedQuery[key] = req.query[key];
      }
    }
    req.query = sanitizedQuery;
    next();
  });
}

// Session security configuration
export function getSessionConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    secret: process.env.SESSION_SECRET || 'change-this-secret-in-production',
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