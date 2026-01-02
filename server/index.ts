import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { configureSecurityMiddleware, getCsrfToken, csrfProtection } from "./src/security";
import { EnvValidator } from "./src/envValidator";

// Validate environment variables on startup
EnvValidator.validateOnStartup();

const app = express();

// Unhandled rejection handler - crash process to maintain fail-fast behavior
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('[UNHANDLED REJECTION]', {
    timestamp: new Date().toISOString(),
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
  
  // Exit process to prevent running in indeterminate state
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Uncaught exception handler
process.on('uncaughtException', (error: Error) => {
  console.error('[UNCAUGHT EXCEPTION]', {
    timestamp: new Date().toISOString(),
    message: error.message,
    stack: error.stack,
  });
  
  // Give time to log before exiting
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Fix trust proxy for rate limiting - trust only first hop (Replit proxy)
// This prevents IP spoofing while allowing rate limiting to work correctly
app.set('trust proxy', 1);

// Cookie parser (required for CSRF protection)
app.use(cookieParser());

// Security middleware (helmet, CORS, etc.)
configureSecurityMiddleware(app);

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// CSRF token endpoint (must be before routes)
app.get('/api/csrf-token', getCsrfToken());

// Global CSRF protection with targeted exemptions
app.use((req, res, next) => {
  // Exempt paths that don't require CSRF (pre-auth, webhooks with signature validation, health check)
  const exemptPaths = [
    '/api/admin/auth/login',  // Pre-authentication
    '/api/webhooks',          // Webhooks use HMAC signature validation
    '/api/v1/twilio',         // Twilio webhooks use signature validation
    '/api/v1/chat',           // AI chat endpoints (session-based)
    '/health'                 // Health check
  ];
  
  // Check for exact match or prefix match for webhook routes
  const isExempt = exemptPaths.some(path => 
    req.path === path || req.path.startsWith(path + '/')
  );
  
  if (isExempt) {
    return next();
  }
  
  // Apply CSRF protection to all other routes
  return csrfProtection()(req, res, next);
});

// MCP Discovery HTTP Headers Middleware
app.use((req, res, next) => {
  // Add MCP discovery Link header to all HTML pages
  if (req.accepts('html') || req.path === '/' || !req.path.startsWith('/api')) {
    res.set('Link', '</.well-known/mcp.json>; rel="mcp"; type="application/json"');
    
    // Add additional AI discovery headers
    res.set('X-MCP-Server', 'johnson-bros-plumbing');
    res.set('X-AI-Integration', 'mcp-enabled');
  }
  
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Run initial capacity check and ads sync
  setTimeout(async () => {
    try {
      const { GoogleAdsBridge } = await import('./src/ads/bridge');
      const adsBridge = GoogleAdsBridge.getInstance();
      await adsBridge.applyCapacityRules();
      console.log('Initial capacity check and ads sync completed');
      
      // Schedule periodic ads sync (every 5 minutes)
      setInterval(async () => {
        try {
          await adsBridge.applyCapacityRules();
        } catch (error) {
          console.error('Error applying ads rules:', error);
        }
      }, 5 * 60 * 1000);
    } catch (error) {
      console.error('Error initializing capacity system:', error);
    }
  }, 5000);

  const server = await registerRoutes(app);

  // Global error handler - must be last middleware
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log error with context
    console.error('[ERROR]', {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status,
      message,
      stack: err.stack,
      ...(err.details && { details: err.details }),
    });

    // Send error response
    res.status(status).json({ 
      message,
      ...(app.get("env") === "development" && { stack: err.stack })
    });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });

  // Start MCP Server automatically in development
  if (app.get("env") === "development") {
    const { spawn, exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    const mcpPort = process.env.MCP_PORT || '3001';
    
    // Check if port is already in use
    try {
      await execAsync(`lsof -i :${mcpPort}`);
      log(`MCP server already running on port ${mcpPort}`);
    } catch (error) {
      // Port is not in use, start the MCP server
      const mcpServer = spawn('tsx', ['src/mcp-http-server.ts'], {
        env: { ...process.env, MCP_PORT: mcpPort },
        stdio: 'inherit',
        detached: false
      });

      mcpServer.on('error', (error) => {
        console.error('Failed to start MCP server:', error);
      });

      // Cleanup on exit
      process.on('SIGTERM', () => {
        mcpServer.kill();
        process.exit(0);
      });

      process.on('SIGINT', () => {
        mcpServer.kill();
        process.exit(0);
      });

      log(`MCP server starting on port ${mcpPort}`);
    }
  }
})();
