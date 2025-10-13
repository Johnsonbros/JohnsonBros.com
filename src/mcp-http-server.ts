import express from 'express';
import { randomUUID } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { IncomingMessage, ServerResponse } from 'node:http';
import { server } from './booker.js';
import pino from 'pino';
import cors from 'cors';

const log = pino({ name: 'mcp-http-server', level: process.env.LOG_LEVEL || 'info' });

// Create Express application
const app = express();
app.use(express.json());

// Configure CORS to expose Mcp-Session-Id header for browser-based clients
const corsOrigins = process.env.MCP_CORS_ORIGINS 
  ? process.env.MCP_CORS_ORIGINS.split(',').map(o => o.trim())
  : '*'; // Default to all origins in development

app.use(cors({
  origin: corsOrigins,
  exposedHeaders: ['Mcp-Session-Id']
}));

// Store transports by session ID
const transports: Record<string, StreamableHTTPServerTransport> = {};

// Handle all MCP Streamable HTTP requests (GET, POST, DELETE) on a single endpoint
app.all('/mcp', async (req, res) => {
  log.info({ method: req.method, path: req.path }, 'Received MCP request');

  try {
    // Check for existing session ID
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {
      // Reuse existing transport
      transport = transports[sessionId];
      log.info({ sessionId }, 'Reusing existing transport');
    } else {
      // Create new transport with session management
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: async (newSessionId: string) => {
          log.info({ sessionId: newSessionId }, 'Session initialized');
          transports[newSessionId] = transport;
        },
        onsessionclosed: async (closedSessionId: string) => {
          log.info({ sessionId: closedSessionId }, 'Session closed');
          delete transports[closedSessionId];
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
      'book_service_call - Book a plumbing service appointment',
      'search_availability - Search for available appointment slots'
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
