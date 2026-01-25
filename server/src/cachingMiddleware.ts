import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to set cache-control headers for API responses
 */

export function cacheControl(maxAge: number, options: { private?: boolean; immutable?: boolean } = {}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const directives = [];
    
    if (options.private) {
      directives.push('private');
    } else {
      directives.push('public');
    }
    
    directives.push(`max-age=${maxAge}`);
    
    if (options.immutable) {
      directives.push('immutable');
    }
    
    res.setHeader('Cache-Control', directives.join(', '));
    next();
  };
}

/**
 * Preset cache control middleware for common use cases
 */
export const cachePresets = {
  // No caching for dynamic/sensitive data
  noCache: () => cacheControl(0, { private: true }),
  
  // Short cache for frequently changing data (30 seconds)
  short: () => cacheControl(30),
  
  // Medium cache for semi-static data (5 minutes)
  medium: () => cacheControl(300),
  
  // Long cache for relatively static data (1 hour)
  long: () => cacheControl(3600),
  
  // Very long cache for static assets (1 year)
  static: () => cacheControl(31536000, { immutable: true }),
};

/**
 * Conditional caching based on query parameters or conditions
 */
export function conditionalCache(
  condition: (req: Request) => boolean,
  trueCacheSeconds: number,
  falseCacheSeconds: number = 0
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const maxAge = condition(req) ? trueCacheSeconds : falseCacheSeconds;
    const directive = maxAge > 0 ? `public, max-age=${maxAge}` : 'no-cache, no-store, must-revalidate';
    res.setHeader('Cache-Control', directive);
    next();
  };
}
