import express, { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { IncomingMessage, ServerResponse } from 'node:http';
import pino from 'pino';
import cors from 'cors';
import { server } from './booker.js';

const log = pino({ name: 'mcp-http-server', level: process.env.LOG_LEVEL || 'info' });

// Create Express application
const app = express();
app.use(express.json());

// Configure CORS to expose Mcp-Session-Id header for browser-based clients
const configuredOrigins = process.env.MCP_CORS_ORIGINS
  ? process.env.MCP_CORS_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  : [];

const defaultDevOrigins = ['http://localhost:5173', 'http://localhost:4173'];

const allowedOrigins = configuredOrigins.length > 0
  ? configuredOrigins
  : (process.env.NODE_ENV === 'production' ? [] : defaultDevOrigins);

app.use(cors({
  origin(origin, callback) {
    // Allow non-browser requests (no Origin header) for server-to-server calls
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    const error = new Error('Origin not allowed by MCP CORS policy');
    return callback(error);
  },
  exposedHeaders: ['Mcp-Session-Id']
}));

app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
  if (err.message.includes('CORS')) {
    log.warn({ error: err.message }, 'Blocked MCP request due to CORS policy');
    return res.status(403).json({ error: 'Forbidden', message: err.message });
  }
  return next(err);
});

const authToken = process.env.MCP_AUTH_TOKEN;

app.use((req, res, next) => {
  if (!authToken) return next();

  const header = req.headers['authorization'];
  if (header === `Bearer ${authToken}`) return next();

  log.warn({ path: req.path }, 'Unauthorized MCP HTTP request blocked');
  return res.status(401).json({
    error: 'Unauthorized',
    message: 'Valid MCP authentication token required'
  });
});

// Store transports by session ID
const transports: Record<string, { transport: StreamableHTTPServerTransport; lastActive: number; timeout?: NodeJS.Timeout }> = {};

const SESSION_TTL_MS = Number(process.env.MCP_SESSION_TTL_MS ?? 15 * 60 * 1000);

function clearSession(sessionId: string) {
  const existing = transports[sessionId];
  if (existing?.timeout) clearTimeout(existing.timeout);
  delete transports[sessionId];
  log.info({ sessionId }, 'MCP session cleared');
}

// Handle all MCP Streamable HTTP requests (GET, POST, DELETE) on a single endpoint
app.all('/mcp', async (req, res) => {
  log.info({ method: req.method, path: req.path }, 'Received MCP request');

  try {
    // Check for existing session ID
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {
      // Reuse existing transport
      transport = transports[sessionId].transport;
      transports[sessionId].lastActive = Date.now();
      if (transports[sessionId].timeout) clearTimeout(transports[sessionId].timeout);
      transports[sessionId].timeout = setTimeout(() => clearSession(sessionId), SESSION_TTL_MS);
      log.info({ sessionId }, 'Reusing existing transport');
    } else {
      // Create new transport with session management
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: async (newSessionId: string) => {
          log.info({ sessionId: newSessionId }, 'Session initialized');
          transports[newSessionId] = {
            transport,
            lastActive: Date.now(),
            timeout: setTimeout(() => clearSession(newSessionId), SESSION_TTL_MS)
          };
        },
        onsessionclosed: async (closedSessionId: string) => {
          log.info({ sessionId: closedSessionId }, 'Session closed');
          clearSession(closedSessionId);
        }
      });

      // Connect the server to the transport
      await server.connect(transport);
      log.info('Connected MCP server to transport');
    }

    // Handle the request using the transport
    await transport.handleRequest(
      req as IncomingMessage,
      res as ServerResponse,
      req.body
    );
  } catch (error: any) {
    log.error({ error: error.message, stack: error.stack }, 'Error handling MCP request');
    
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Internal server error'
        },
        id: null
      });
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'jb-booker-mcp',
    timestamp: new Date().toISOString(),
    activeSessions: Object.keys(transports).length
  });
});

// Root endpoint with info
app.get('/', (req, res) => {
  res.json({
    name: 'Johnson Bros. Plumbing MCP Server',
    version: '1.0.0',
    description: 'Model Context Protocol server for HousecallPro booking integration',
    endpoints: {
      mcp: '/mcp',
      health: '/health'
    },
    tools: [
      'book_service_call - Book a plumbing service appointment with HousecallPro',
      'search_availability - Search for available appointment slots',
      'get_quote - Get instant plumbing service price estimates',
      'get_services - List all available plumbing services',
      'emergency_help - Get emergency plumbing guidance and safety instructions'
    ]
  });
});

// Start the server
const PORT = process.env.MCP_PORT || 3001;
app.listen(PORT, () => {
  log.info({ port: PORT }, 'MCP HTTP server started successfully');
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  Johnson Bros. Plumbing MCP Server                         ║
╟────────────────────────────────────────────────────────────╢
║  Status: Running                                           ║
║  Port: ${PORT}                                               ║
║  MCP Endpoint: http://localhost:${PORT}/mcp                  ║
║  Health Check: http://localhost:${PORT}/health               ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  log.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  log.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});
