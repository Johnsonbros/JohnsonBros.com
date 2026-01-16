# MCP Architecture & Integration Guide

## Overview

This document explains how the MCP (Model Context Protocol) server is connected into the website, when it's used, where it's used, and how it works internally.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     External AI Assistants                       │
│          (ChatGPT, Claude, other MCP-compatible clients)         │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────────┐
│                   MCP Server (port 3001)                          │
│   src/mcp-http-server.ts + src/booker.ts                          │
│   Exposes: book_service_call, search_availability, etc.           │
└───────────────────────────────────────────────────────────────────┘
                                ▲
                                │ (internal calls via mcpClient.ts)
                                │
┌───────────────────────────────┴─────────────────────────────────┐
│                  Main Website (port 5000)                        │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │ API Routes   │    │ Voice AI     │    │ SMS Booking      │   │
│  │ routes.ts    │    │ realtimeVoice│    │ smsBookingAgent  │   │
│  └──────────────┘    └──────────────┘    └──────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────────┐
│                    HousecallPro API                               │
└───────────────────────────────────────────────────────────────────┘
```

## Two Servers Architecture

Your app runs **two separate servers**:

| Server | Port | Purpose |
|--------|------|---------|
| **Main Website** | 5000 | Express + Vite app users interact with |
| **MCP Server** | 3001 | Standalone server exposing booking tools to AI assistants |

Both servers start automatically when you run `npm run dev`. The MCP server runs as a child process alongside the main app.

## When MCP is Used

### 1. External AI Assistants (ChatGPT, Claude, etc.)

**Flow**: AI Assistant → `/mcp` endpoint (port 3001) → HousecallPro

External AI assistants connect directly to the MCP endpoint to:
- Book appointments
- Check availability
- Get quotes
- Answer plumbing questions

### 2. Voice AI / Phone System

**File**: `server/lib/realtimeVoice.ts`

**Flow**: Phone Call → OpenAI Realtime API → MCP Client → MCP Server → HousecallPro

Uses the MCP client to:
- List available tools to feed to OpenAI's realtime voice API
- Execute MCP tools when the voice AI decides to book/search

```typescript
// Lists tools for OpenAI
listMcpTools()

// Executes tools during conversation
callMcpTool(functionName, args)
```

### 3. SMS Booking Agent

**File**: `server/lib/smsBookingAgent.ts`

**Flow**: SMS Message → Twilio → SMS Agent → MCP Client → MCP Server → HousecallPro

Allows customers to book via text message. The agent connects to MCP using `StreamableHTTPClientTransport`.

### 4. API Routes (Website Backend)

**File**: `server/routes.ts`

**Flow**: Website Form → API Route → MCP Client → MCP Server → HousecallPro

Used when the website itself needs to create bookings:

```typescript
const { parsed } = await callMcpTool<any>("book_service_call", mcpPayload);
```

## How the Connection Works

### MCP Client (`server/lib/mcpClient.ts`)

The MCP client connects to the MCP server using the `@modelcontextprotocol/sdk`:

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3001/mcp';

// Creates persistent connection
const transport = new StreamableHTTPClientTransport(new URL(MCP_SERVER_URL));
const mcpClient = new Client(
  { name: 'jb-app-mcp-client', version: '1.0.0' },
  { capabilities: {} }
);
await mcpClient.connect(transport);
```

### Key Functions

| Function | Purpose |
|----------|---------|
| `listMcpTools()` | Returns all available booking tools (cached for efficiency) |
| `callMcpTool(name, args)` | Executes a specific tool and returns parsed results |

### MCP Server (`src/mcp-http-server.ts`)

The server exposes an HTTP endpoint at `/mcp` that:
- Accepts JSON-RPC requests over HTTP
- Manages sessions with UUID-based session IDs
- Implements rate limiting (100 req/15min per session, 200 req/hour per IP)
- Handles CORS for browser-based clients
- Supports optional Bearer token authentication

## Available MCP Tools

| Tool | Purpose |
|------|---------|
| `book_service_call` | Book a plumbing appointment |
| `search_availability` | Check available time slots |
| `create_lead` | Request a callback |
| `lookup_customer` | Verify existing customer by phone/email |
| `get_job_status` | Check appointment/job status |
| `get_service_history` | View past jobs for a customer |
| `get_services` | List all available plumbing services |
| `get_quote` | Get instant price estimates |
| `get_promotions` | Get current deals and discounts |
| `emergency_help` | Emergency plumbing guidance |
| `search_faq` | Query FAQ database |
| `request_reschedule_callback` | Log reschedule request (redirects to phone) |
| `request_cancellation_callback` | Log cancellation request (redirects to phone) |

## Security Features

- **Rate Limiting**: Prevents abuse with per-session and per-IP limits
- **CORS**: Configurable allowed origins via `MCP_CORS_ORIGINS` env var
- **Authentication**: Optional Bearer token via `MCP_AUTH_TOKEN` env var
- **Session Management**: Auto-cleanup of inactive sessions (15 min TTL)
- **Guardrails**: Reschedule/cancel tools don't directly modify - they log and redirect to phone

## Optional Enhancements (Future-Proofing)

These are not required today, but they can help as MCP usage grows or if multiple services integrate with the MCP server.

### Service-to-Service Authentication

- **Goal**: Restrict MCP calls from internal services to a trusted network and enforce a shared secret.
- **Approach**:
  - Run the MCP server on a private/internal network (e.g., internal VPC subnet or Docker network).
  - Require `MCP_AUTH_TOKEN` for all non-public calls, and rotate it regularly.
  - Use allowlisted IP ranges or service identities at the network layer.

### API Gateway

- **Goal**: Centralize auth, rate limits, and observability across the website backend and MCP server.
- **Approach**:
  - Place an API gateway (NGINX, Kong, AWS API Gateway, Cloudflare, etc.) in front of both the main app and MCP.
  - Enforce shared authentication and rate limiting policies.
  - Add request tracing IDs for end-to-end visibility.

### Versioned APIs

- **Goal**: Decouple frontend deployments from backend/MCP changes by keeping backward compatibility.
- **Approach**:
  - Introduce versioned endpoints (e.g., `/api/v1/...`, `/mcp/v1`).
  - Maintain older versions during migrations.
  - Add explicit contract docs per version to prevent breaking changes.

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `MCP_SERVER_URL` | `http://localhost:3001/mcp` | URL for internal MCP client connections |
| `MCP_PORT` | `3001` | Port for MCP server |
| `MCP_CORS_ORIGINS` | Dev: localhost:5173,5000 | Allowed CORS origins (comma-separated) |
| `MCP_AUTH_TOKEN` | None | Optional Bearer token for authentication |
| `MCP_SESSION_TTL_MS` | 900000 (15 min) | Session timeout in milliseconds |

## Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/mcp` | GET, POST, DELETE | MCP JSON-RPC endpoint |
| `/health` | GET | Health check with session stats |
| `/` | GET | Server info and tool list |

## Monitoring

Check server health:
```bash
curl http://localhost:3001/health
```

View server info and available tools:
```bash
curl http://localhost:3001/
```

## Files Reference

| File | Purpose |
|------|---------|
| `src/mcp-http-server.ts` | MCP HTTP server with session management |
| `src/booker.ts` | MCP tool implementations (booking logic) |
| `server/lib/mcpClient.ts` | Internal client for calling MCP tools |
| `server/lib/realtimeVoice.ts` | Voice AI integration |
| `server/lib/smsBookingAgent.ts` | SMS booking automation |
| `server/routes.ts` | API routes that use MCP tools |
