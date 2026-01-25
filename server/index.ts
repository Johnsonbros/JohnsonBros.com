import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { configureSecurityMiddleware, getCsrfToken, csrfProtection } from "./src/security";
import { getErrorHandler, getSecurityConfig } from "./src/security/index";
import { EnvValidator } from "./src/envValidator";
import { setupShutdownHandlers } from "./src/shutdown";
import { initObservability, addObservabilityErrorHandler, captureException } from "./src/observability";

// Validate environment variables on startup
EnvValidator.validateOnStartup();

// Setup graceful shutdown handlers
setupShutdownHandlers();

// Log security configuration on startup
console.log('[SECURITY] Security configuration:', getSecurityConfig());

const app = express();

// Unhandled rejection handler - crash process to maintain fail-fast behavior
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  captureException(error, { type: 'unhandledRejection' });

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
  captureException(error, { type: 'uncaughtException' });

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

// Initialize observability (Sentry, metrics, health checks) - must be early
initObservability(app);

// Security middleware (helmet, CORS, etc.)
configureSecurityMiddleware(app);

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// CSRF token endpoint (must be before routes)
app.get('/api/csrf-token', getCsrfToken());

// Global CSRF protection with targeted exemptions
app.use((req, res, next) => {
  // Exempt paths that don't require CSRF (pre-auth, webhooks with signature validation, health check, MCP)
  const exemptPaths = [
    '/api/admin/auth/login',  // Pre-authentication
    '/api/webhooks',          // Webhooks use HMAC signature validation
    '/api/v1/twilio',         // Twilio webhooks use signature validation
    '/api/v1/chat',           // AI chat endpoints (session-based)
    '/api/v1/chatkit',        // ChatKit session endpoints
    '/api/v1/customers/search', // Customer lookup (read-only, rate-limited)
    '/api/v1/leads',          // Lead creation from chat widget (rate-limited)
    '/api/v1/analytics',      // Web vitals and analytics (telemetry only)
    '/api/compliance/consent', // Cookie consent (public, no auth)
    '/mcp',                   // MCP endpoint for AI assistants (external clients)
    '/.well-known',           // Discovery endpoints
    '/api/mcp',               // MCP API endpoints
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
  // Run initial capacity check and ads sync with proper async handling
  const initializeAdsBridge = async () => {
    try {
      const { GoogleAdsBridge } = await import('./src/ads/bridge');
      const adsBridge = GoogleAdsBridge.getInstance();
      await adsBridge.applyCapacityRules();
      console.log('Initial capacity check and ads sync completed');

      // Schedule periodic ads sync (every 5 minutes)
      const adsSyncInterval = setInterval(async () => {
        try {
          await adsBridge.applyCapacityRules();
        } catch (error) {
          console.error('Error applying ads rules:', error);
        }
      }, 5 * 60 * 1000);

      // Store interval for potential cleanup
      (global as any).__adsSyncInterval = adsSyncInterval;
    } catch (error) {
      console.error('Error initializing capacity system:', error);
    }
  };

  // Delay initialization to ensure server is ready
  setTimeout(initializeAdsBridge, 5000);

  const server = await registerRoutes(app);

  // Add Sentry error handler before the generic error handler
  addObservabilityErrorHandler(app);

  // Global error handler - must be last middleware
  // Uses the security error sanitizer to prevent information leakage
  app.use(getErrorHandler());

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
  }, () => {
    log(`serving on port ${port}`);
  });

  // Start MCP Server automatically (only if not already running)
  const startMcpServer = async () => {
    const { spawn } = await import('child_process');
    const path = await import('path');
    const net = await import('net');
    const mcpPort = parseInt(process.env.MCP_PORT || '3001', 10);

    // Check if port is already in use with a TCP connection test
    const isPortInUse = await new Promise<boolean>((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(1000);
      socket.once('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.once('error', () => {
        socket.destroy();
        resolve(false);
      });
      socket.once('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      socket.connect(mcpPort, '127.0.0.1');
    });

    if (isPortInUse) {
      log(`MCP server already running on port ${mcpPort}`);
      return;
    }

    // Port is not in use, start the MCP server
    const mcpServerPath = path.resolve(process.cwd(), 'src/mcp-http-server.ts');
    log(`Starting MCP server from: ${mcpServerPath}`);

    const mcpServer = spawn('npx', ['tsx', mcpServerPath], {
      env: { ...process.env, MCP_PORT: String(mcpPort) },
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
      shell: true,
      cwd: process.cwd()
    });

    mcpServer.stdout?.on('data', (data) => {
      log(`[MCP] ${data.toString().trim()}`);
    });

    mcpServer.stderr?.on('data', (data) => {
      console.error(`[MCP Error] ${data.toString().trim()}`);
    });

    mcpServer.on('error', (error) => {
      console.error('Failed to start MCP server:', error);
    });

    mcpServer.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`MCP server exited with code ${code}`);
      }
    });

    // Cleanup on exit
    const cleanup = () => {
      if (mcpServer && !mcpServer.killed) {
        mcpServer.kill();
      }
    };

    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);

    log(`MCP server starting on port ${mcpPort}`);
  };

  // Start MCP server with a small delay to ensure main server is ready
  setTimeout(startMcpServer, 2000);
})();
