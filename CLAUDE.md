# CLAUDE.md - AI Assistant Development Guide

**Last Updated**: 2026-01-18
**Repository**: JohnsonBros.com
**Purpose**: Guide for AI assistants working with this codebase

---

## MANDATORY: aOa Search

> **STOP! Before using Grep or Glob, use aOa instead.**
>
> ```bash
> aoa grep <term>        # Use this, NOT Grep tool
> aoa grep "a b c"       # Multi-term OR search
> aoa grep -a a,b,c      # Multi-term AND search
> ```
>
> aOa is 10-100x faster and provides semantic search. See [aOa Integration](#aoa-integration) for full details.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Codebase Architecture](#codebase-architecture)
3. [Technology Stack](#technology-stack)
4. [Development Workflows](#development-workflows)
5. [Key Conventions & Patterns](#key-conventions--patterns)
6. [Critical Files Reference](#critical-files-reference)
7. [Common Tasks](#common-tasks)
8. [Testing Guidelines](#testing-guidelines)
9. [Security Considerations](#security-considerations)
10. [Deployment Process](#deployment-process)

---

## Project Overview

### Business Context

Johnson Bros. Plumbing & Drain Cleaning is a family-owned plumbing business serving Quincy, MA and surrounding areas since 1997. This full-stack web application serves as the primary digital platform for:

- **Customer acquisition** through capacity-based dynamic messaging
- **Service booking optimization** with real-time HousecallPro integration
- **Operational efficiency** via automated capacity calculations and ad management
- **Trust building** through social proof and review integration

### Primary Business Goals

1. **Maximize Booking Conversions**: Convert visitors into paying customers
2. **Optimize Capacity Utilization**: Fill available technician slots efficiently
3. **Automate Operations**: Reduce manual overhead for capacity and ad management
4. **Build Trust**: Display authentic social proof to increase conversion rates

### Key Differentiators

- **Real-time capacity monitoring** that drives UI/UX and advertising
- **AI-powered booking agents** across multiple channels (web, SMS, voice)
- **Unified customer identity** across all interaction channels
- **Deep HousecallPro integration** for seamless business operations
- **Comprehensive API cost tracking** across OpenAI, Twilio, and Google Maps
- **Automated service area validation** using Google Maps geocoding

---

## Codebase Architecture

### Monorepo Structure

```
/home/user/JohnsonBros.com/
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── components/    # UI components (100+ files)
│   │   ├── pages/         # Route pages (lazy-loaded)
│   │   ├── hooks/         # React hooks
│   │   ├── lib/           # Client utilities
│   │   ├── stores/        # Zustand state management
│   │   └── contexts/      # React contexts
│   └── public/            # Static assets
├── server/                # Express backend
│   ├── lib/              # Core services (AI, SMS, MCP client)
│   ├── routes/           # API route handlers
│   ├── src/              # Business logic & admin routes
│   ├── seeds/            # Database seeders
│   └── tests/            # Server tests
├── shared/               # Shared types/schemas
│   └── schema.ts         # Database schema (Drizzle ORM)
├── src/                  # MCP Server implementation
│   ├── booker.ts         # MCP tool implementations
│   ├── mcp-http-server.ts # MCP HTTP server
│   └── widgets/          # Embeddable widgets
├── config/               # YAML configurations (capacity.yml)
├── migrations/           # Database migrations
└── attached_assets/      # Media files
```

### Dual-Server Architecture

The application runs **two separate servers**:

| Server | Port | Purpose | Entry Point |
|--------|------|---------|-------------|
| **Main Web Server** | 5000 | Express + Vite app | `server/index.ts` |
| **MCP Server** | 3001 | Standalone MCP HTTP server | `src/mcp-http-server.ts` |

Both servers start automatically with `npm run dev`. The MCP server runs as a child process.

### Path Aliases

```typescript
// TypeScript path resolution (tsconfig.json)
import { Button } from "@/components/ui/button"      // → client/src/components/ui/button
import { schema } from "@shared/schema"              // → shared/schema
```

---

## Technology Stack

### Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2.3 | UI framework |
| **TypeScript** | 5.6.3 | Type safety |
| **Vite** | 5.4.19 | Build tool & dev server |
| **Wouter** | 3.3.5 | Lightweight routing |
| **TanStack Query** | 5.60.5 | Server state management |
| **Zustand** | N/A | Client state management |
| **Radix UI** | Various | Accessible UI primitives |
| **Tailwind CSS** | 4.1.18 | Styling |
| **Framer Motion** | 11.13.1 | Animations |
| **React Hook Form** | 7.55.0 | Form handling |
| **Zod** | 3.24.2 | Schema validation |

### Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | Runtime |
| **Express** | 4.21.2 | Web framework |
| **Drizzle ORM** | 0.39.1 | Database ORM |
| **PostgreSQL** | N/A | Database (Neon) |
| **Passport.js** | 0.7.0 | Authentication |
| **Pino** | 9.9.0 | Structured logging |
| **Winston** | 3.18.3 | File logging |

### AI & Integration Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **@modelcontextprotocol/sdk** | 1.17.4 | MCP integration |
| **OpenAI** | 6.15.0 | AI chat & agents |
| **openai-agents** | 1.1.0 | Agent SDK |
| **Twilio** | 5.3.2 | SMS & voice |
| **Google Maps API** | N/A | Maps & geocoding |
| **HousecallPro API** | N/A | Business operations |
| **Sentry** | 10.20.0 | Error tracking |

---

## Development Workflows

### Initial Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Push database schema
npm run db:push

# Start development servers (both main & MCP)
npm run dev
```

### Common Commands

```bash
npm run dev          # Start dev servers (port 5000 & 3001)
npm run build        # Build for production
npm start            # Run production build
npm run check        # TypeScript type checking
npm test             # Run tests
npm run db:push      # Sync database schema
```

### Development Server Behavior

When you run `npm run dev`:
1. Main Express server starts on port **5000**
2. Vite dev server serves frontend with HMR
3. MCP server starts automatically on port **3001** as child process
4. Changes to client code trigger HMR
5. Changes to server code require manual restart

### Git Workflow

This project follows standard Git practices:

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "Clear, descriptive commit message"

# Push to remote
git push -u origin feature/your-feature-name

# Create PR using GitHub CLI
gh pr create --title "Feature: Description" --body "Details"
```

**Important**: When working with AI assistants, feature branches typically start with `claude/` prefix.

---

## Key Conventions & Patterns

### 1. Code Organization

#### Component Structure
```typescript
// Standard component pattern
import { useState } from "react";
import type { ComponentProps } from "@/types";

export function MyComponent({ prop1, prop2 }: ComponentProps) {
  // Hooks first
  const [state, setState] = useState();

  // Event handlers
  const handleClick = () => {
    // Logic here
  };

  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

#### API Route Pattern
```typescript
// server/routes.ts or modular route files
router.post("/api/endpoint", async (req, res, next) => {
  try {
    // Validate input with Zod
    const data = schema.parse(req.body);

    // Business logic
    const result = await someService(data);

    // Return response
    res.json({ success: true, data: result });
  } catch (error) {
    next(error); // Let error handler deal with it
  }
});
```

### 2. Database Patterns

#### Schema Definition (shared/schema.ts)
```typescript
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const customers = pgTable("customers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schema for validation
export const insertCustomerSchema = createInsertSchema(customers);
```

#### Database Queries
```typescript
import { db } from "@/db";
import { customers } from "@shared/schema";
import { eq } from "drizzle-orm";

// Insert
const newCustomer = await db.insert(customers).values(data).returning();

// Select
const customer = await db.query.customers.findFirst({
  where: eq(customers.id, customerId),
});

// Update
await db.update(customers)
  .set({ name: "New Name" })
  .where(eq(customers.id, customerId));
```

#### API Usage Tracking Table
```typescript
import { apiUsage } from "@shared/schema";

// The apiUsage table tracks all API costs with:
// - service: 'openai' | 'twilio' | 'google_maps'
// - operation: 'chat_completion' | 'sms_outbound' | 'geocode' | etc.
// - model: e.g., 'gpt-4o', 'gpt-4o-mini' (for OpenAI)
// - input_tokens, output_tokens: For OpenAI token counting
// - units: Generic unit count (tokens, SMS segments, API calls)
// - estimated_cost_cents: Cost in cents for precision
// - session_id: Links to conversation/interaction
// - channel: 'web_chat' | 'sms' | 'voice'
// - metadata: JSON for additional context
// - created_at: Timestamp for tracking and aggregation

// Indexed on: service, created_at, session_id, channel for fast queries
```

### 3. Error Handling

#### Frontend Error Boundaries
```typescript
// client/src/components/ErrorBoundary.tsx exists
// Wrap routes with <ErrorBoundary>
```

#### Backend Error Handling
```typescript
// All routes use Express error middleware
// Errors are automatically logged and formatted

// Custom error example
if (!customer) {
  return res.status(404).json({
    success: false,
    error: "Customer not found"
  });
}
```

### 4. State Management

#### Server State (TanStack Query)
```typescript
import { useQuery } from "@tanstack/react-query";

const { data, isLoading, error } = useQuery({
  queryKey: ["services"],
  queryFn: async () => {
    const res = await fetch("/api/services");
    return res.json();
  },
  staleTime: 1000 * 60 * 5, // 5 minutes
});
```

#### Client State (Zustand)
```typescript
// client/src/stores/someStore.ts
import { create } from "zustand";

interface StoreState {
  value: string;
  setValue: (value: string) => void;
}

export const useStore = create<StoreState>((set) => ({
  value: "",
  setValue: (value) => set({ value }),
}));
```

### 5. Business Logic Patterns

#### Capacity-Based Logic
```typescript
// Four capacity states drive UI and behavior:
type CapacityState =
  | "SAME_DAY_FEE_WAIVED"    // ≥35% capacity
  | "LIMITED_SAME_DAY"        // ≥10% capacity
  | "NEXT_DAY"                // next day available
  | "EMERGENCY_ONLY"          // no capacity

// Always check capacity before booking operations
const capacity = await getCapacity();
if (capacity.state === "EMERGENCY_ONLY") {
  // Handle emergency-only state
}
```

#### Circuit Breaker Pattern
```typescript
// HousecallProClient implements circuit breaker
// - Opens after 5 consecutive failures
// - 60-second recovery period
// - Automatic retry with exponential backoff

// When calling HousecallPro:
const client = getHousecallProClient();
const result = await client.someMethod(); // Handles circuit breaking automatically
```

#### Multi-Channel Identity Resolution
```typescript
// Customer can be identified by:
// - Web: localStorage userId
// - Phone: normalized phone number
// - Email: email address

// OTP linking merges identities:
await startIdentityLink(userId, phoneNumber); // Sends OTP
await confirmIdentityLink(userId, otp);       // Merges identities
```

#### API Cost Tracking Pattern
```typescript
// Track OpenAI usage
import { trackOpenAIUsage } from "@/lib/usageTracker";

const response = await openai.chat.completions.create({...});
await trackOpenAIUsage(response, sessionId, 'web_chat', {
  operation: 'chat_completion'
});

// Track Twilio SMS (with segment counting)
import { trackTwilioSMS } from "@/lib/usageTracker";

const message = await sendSMS(to, body);
await trackTwilioSMS('outbound', message.numSegments, sessionId);

// Track Twilio Voice (with duration in seconds)
await trackTwilioVoice(durationSeconds, sessionId, 'voice', { callSid });

// Track Google Maps operations
import { trackGoogleMaps } from "@/lib/usageTracker";

const result = await geocodeAddress(address);
await trackGoogleMaps('geocode', 1, sessionId);
```

**Key Features:**
- All costs stored in cents for precision arithmetic
- Session-based tracking links costs to conversations
- Channel attribution (web_chat, sms, voice) for ROI analysis
- Metadata support for additional context
- Graceful error handling with fallbacks

**Pricing Constants (Updated 2024):**
```typescript
// OpenAI
gpt-4o: $2.50/$10.00 per 1M tokens (input/output)
gpt-4o-mini: $0.15/$0.60 per 1M tokens

// Twilio
SMS: $0.0079 outbound, $0.0075 inbound (per segment)
Voice: $0.0085 per minute

// Google Maps
Geocoding: $5.00 per 1K requests
Directions: $5.00 per 1K requests
```

#### Service Area Validation Pattern
```typescript
// Check if address is in service area
import { checkServiceArea } from "@/src/geocoding";

const result = await checkServiceArea(userAddress);

if (result.inServiceArea) {
  // Address is valid, proceed with booking
  console.log(`Service tier: ${result.tier}`); // tier1, tier2, or tier3
  console.log(`ZIP: ${result.zipCode}`);
} else {
  // Outside service area
  console.log(result.message); // User-friendly message
}

// Geocode address for coordinates
import { geocodeAddress } from "@/src/geocoding";

const geocoded = await geocodeAddress("123 Main St, Quincy MA");
// Returns: { zipCode, city, state, formattedAddress, latitude, longitude }
```

**Integration with config/capacity.yml:**
- Reads `geos` array for all service ZIP codes
- Reads `express_zones` (tier1, tier2, tier3) for service tiers
- Automatic tier detection for express service pricing

### 6. Security Patterns

#### CSRF Protection
```typescript
// Global CSRF protection enabled with exemptions:
// - /api/webhooks/* (signature validated)
// - /api/admin/auth/login (pre-auth)
// - /health

// Frontend must include CSRF token:
const csrfToken = await fetch("/api/csrf-token").then(r => r.json());
fetch("/api/endpoint", {
  headers: { "X-CSRF-Token": csrfToken.token }
});
```

#### Rate Limiting
```typescript
// Different limits per endpoint type:
// - Standard: 100 req/15min
// - Booking: 5 req/15min
// - Admin: 30 req/15min
// - MCP: 100 req/15min (per session)
```

#### Input Validation
```typescript
// ALWAYS validate with Zod before processing:
import { z } from "zod";

const bookingSchema = z.object({
  customerId: z.string().uuid(),
  serviceId: z.string(),
  scheduledAt: z.string().datetime(),
});

const validated = bookingSchema.parse(req.body); // Throws if invalid
```

### 7. Performance Patterns

#### Lazy Loading
```typescript
// All pages except Home are lazy-loaded:
const BlogPost = lazy(() => import("@/pages/blog-post"));

// Use Suspense for loading states:
<Suspense fallback={<LoadingSpinner />}>
  <BlogPost />
</Suspense>
```

#### Caching Strategy
```typescript
// Capacity data: 30 seconds
// Google reviews: 5 minutes
// Services: 1 hour
// Static assets: 1 year (immutable)

// Example:
const cachedCapacity = cache.get("capacity");
if (!cachedCapacity || Date.now() - cachedCapacity.timestamp > 30000) {
  // Fetch fresh data
}
```

---

## Critical Files Reference

### Must-Read Files (Read These First!)

| File | Purpose | Size | Priority |
|------|---------|------|----------|
| `shared/schema.ts` | Database schema, all types | 85KB | **CRITICAL** |
| `server/routes.ts` | Main API routes | 40KB | **CRITICAL** |
| `config/capacity.yml` | Business rules & thresholds | 108 lines | **CRITICAL** |
| `WEBSITE_DOCUMENTATION.md` | Business & technical overview | 848 lines | **HIGH** |
| `MCP_ARCHITECTURE.md` | MCP integration guide | 203 lines | **HIGH** |

### Core Business Logic

| File | Purpose | Lines |
|------|---------|-------|
| `server/src/capacity.ts` | Capacity calculations | ~500 |
| `server/src/housecall.ts` | HousecallPro client with circuit breaker | ~800 |
| `server/src/googleAds.ts` | Automated ad management | ~300 |
| `server/lib/usageTracker.ts` | Unified API cost tracking (OpenAI, Twilio, Google Maps) | ~310 |
| `server/src/geocoding.ts` | Google Maps geocoding & service area validation | ~150 |

### Agent Systems

| File | Purpose | Lines |
|------|---------|-------|
| `src/booker.ts` | MCP tool implementations | ~1000 |
| `src/mcp-http-server.ts` | MCP HTTP server | ~400 |
| `server/lib/smsBookingAgent.ts` | SMS booking agent | ~600 |
| `server/lib/aiChat.ts` | Web chat agent | ~800 |
| `server/lib/realtimeVoice.ts` | Voice AI agent | ~400 |
| `server/lib/sharedThread.ts` | Multi-channel identity | ~500 |
| `server/lib/mcpClient.ts` | Internal MCP client | ~150 |

### API Routes (Modular)

| File | Purpose |
|------|---------|
| `server/routes.ts` | Main public API routes |
| `server/src/adminRoutes.ts` | Admin panel endpoints |
| `server/src/abTestingRoutes.ts` | A/B testing |
| `server/src/conversionRoutes.ts` | Conversion tracking |
| `server/src/chatkitRoutes.ts` | ChatKit integration |
| `server/src/identityRoutes.ts` | OTP & identity linking |
| `server/lib/twilioWebhooks.ts` | Twilio SMS/voice webhooks |
| `server/routes/actions.ts` | Card action dispatcher |
| `server/src/webhooks.ts` | HousecallPro webhooks |

**Admin API Endpoints - Usage Tracking:**
```typescript
// GET /api/admin/usage/summary
// Query: startDate (ISO string), endDate (ISO string)
// Returns: {
//   grandTotalCents: number,
//   grandTotalDollars: string,
//   byService: [{
//     service: string,
//     totalCents: number,
//     totalDollars: string,
//     requestCount: number
//   }]
// }

// GET /api/admin/usage/daily
// Query: startDate, endDate
// Returns: [{
//   date: string,
//   openai: number,
//   twilio: number,
//   google_maps: number
// }]

// GET /api/admin/usage/by-channel
// Query: startDate, endDate
// Returns: {
//   byChannel: [{
//     channel: 'web_chat' | 'sms' | 'voice',
//     totalCents: number,
//     totalDollars: string,
//     requestCount: number
//   }],
//   channelTotals: {
//     web_chat: number,
//     sms: number,
//     voice: number
//   }
// }
```

### Frontend Entry Points

| File | Purpose |
|------|---------|
| `client/src/App.tsx` | React app root, routes |
| `client/src/main.tsx` | React render entry |
| `client/src/pages/Home.tsx` | Homepage |
| `client/src/components/BookingModal.tsx` | Primary booking UI |
| `client/src/pages/admin/api-usage.tsx` | API usage analytics dashboard (~450 lines) |

### Configuration Files

| File | Purpose |
|------|---------|
| `.env.example` | Environment variable template (217 lines) |
| `config/capacity.yml` | Capacity thresholds, zones, UI copy |
| `tsconfig.json` | TypeScript config with path aliases |
| `vite.config.ts` | Vite bundler config |
| `tailwind.config.ts` | Tailwind customization |
| `drizzle.config.ts` | Database migration config |

---

## Common Tasks

### Adding a New API Endpoint

1. **Define route** in appropriate file:
```typescript
// server/routes.ts or modular file
router.post("/api/my-endpoint", async (req, res, next) => {
  try {
    // Validate with Zod
    const data = mySchema.parse(req.body);

    // Business logic
    const result = await myService(data);

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});
```

2. **Add rate limiting** if needed:
```typescript
import { createRateLimiter } from "@/middleware/rateLimiter";

const limiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

router.post("/api/my-endpoint", limiter, handler);
```

3. **Update CSRF exemptions** if needed (for webhooks):
```typescript
// server/index.ts - csrfProtection middleware
```

4. **Test the endpoint**:
```bash
curl -X POST http://localhost:5000/api/my-endpoint \
  -H "Content-Type: application/json" \
  -d '{"key":"value"}'
```

### Adding a Database Table

1. **Define schema** in `shared/schema.ts`:
```typescript
export const myTable = pgTable("my_table", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMyTableSchema = createInsertSchema(myTable);
export type MyTable = typeof myTable.$inferSelect;
export type InsertMyTable = typeof myTable.$inferInsert;
```

2. **Generate migration**:
```bash
npm run db:push
```

3. **Use in code**:
```typescript
import { db } from "@/db";
import { myTable } from "@shared/schema";

const result = await db.insert(myTable).values({ name: "Test" });
```

### Adding a React Component

1. **Create component file**:
```typescript
// client/src/components/MyComponent.tsx
import { useState } from "react";

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  return (
    <div>
      <h2>{title}</h2>
      <button onClick={onAction}>Action</button>
    </div>
  );
}
```

2. **Import and use**:
```typescript
import { MyComponent } from "@/components/MyComponent";

<MyComponent title="Hello" onAction={handleAction} />
```

### Adding an MCP Tool

1. **Define tool** in `src/booker.ts`:
```typescript
{
  name: "my_tool",
  description: "Does something useful",
  inputSchema: {
    type: "object",
    properties: {
      param: { type: "string", description: "Parameter description" },
    },
    required: ["param"],
  },
}
```

2. **Implement handler**:
```typescript
case "my_tool": {
  const { param } = args as { param: string };

  // Business logic
  const result = await doSomething(param);

  return {
    content: [{
      type: "text",
      text: JSON.stringify(result),
    }],
  };
}
```

3. **Test via MCP client**:
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "my_tool",
      "arguments": { "param": "value" }
    },
    "id": 1
  }'
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- server/tests/sharedThread.test.ts

# Run with coverage (if configured)
npm test -- --coverage
```

### Tracking API Usage and Costs

```typescript
// 1. Usage is automatically tracked when using these services:
// - OpenAI chat completions (server/lib/aiChat.ts)
// - OpenAI memory compression (server/lib/sharedThread.ts)
// - Twilio SMS send (server/lib/twilio.ts)
// - Twilio SMS/voice webhooks (server/lib/twilioWebhooks.ts)
// - Google Maps geocoding (server/src/geocoding.ts)

// 2. To manually track usage:
import {
  trackOpenAIUsage,
  trackTwilioSMS,
  trackTwilioVoice,
  trackGoogleMaps
} from "@/lib/usageTracker";

// After an OpenAI call
const completion = await openai.chat.completions.create({...});
await trackOpenAIUsage(completion, sessionId, 'web_chat');

// After sending SMS
await trackTwilioSMS('outbound', numSegments, sessionId);

// After voice call completes
await trackTwilioVoice(durationInSeconds, sessionId, 'voice');

// After geocoding
await trackGoogleMaps('geocode', 1, sessionId);

// 3. View usage in admin dashboard:
// Navigate to /admin/api-usage
// - Total spend across all services
// - Daily spending trends
// - Per-service breakdown
// - Channel attribution (web, SMS, voice)
// - Date range filtering (7d, 30d, 90d)

// 4. API endpoints for custom analytics:
GET /api/admin/usage/summary?startDate=2026-01-01&endDate=2026-01-31
GET /api/admin/usage/daily?startDate=2026-01-01&endDate=2026-01-31
GET /api/admin/usage/by-channel?startDate=2026-01-01&endDate=2026-01-31
```

### Validating Service Area

```typescript
// 1. Check if an address is in the service area
import { checkServiceArea } from "@/src/geocoding";

const result = await checkServiceArea("123 Main St, Quincy MA 02169");
// Returns: { inServiceArea: boolean, message: string, zipCode: string | null, tier?: string }

if (result.inServiceArea) {
  console.log(`Valid address in ${result.zipCode}`);
  if (result.tier) {
    console.log(`Express service tier: ${result.tier}`);
  }
} else {
  console.log(`Outside service area: ${result.message}`);
}

// 2. Geocode an address to get coordinates
import { geocodeAddress } from "@/src/geocoding";

const geocoded = await geocodeAddress("123 Main St, Quincy MA");
// Returns: {
//   zipCode: string | null,
//   city: string | null,
//   state: string | null,
//   formattedAddress: string,
//   latitude: number,
//   longitude: number
// }

// 3. Frontend integration (already wired up)
// POST /api/v1/check-service-area
// Body: { address: string }
// Response: { inServiceArea: boolean, message: string, zipCode: string | null }

// 4. Usage automatically tracked
// Each geocoding call is tracked in apiUsage table with cost attribution
```

### Debugging Common Issues

#### Issue: Port already in use
```bash
# Find process using port 5000 or 3001
lsof -ti:5000
lsof -ti:3001

# Kill process
kill -9 <PID>
```

#### Issue: Database connection error
```bash
# Verify DATABASE_URL in .env
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Sync schema
npm run db:push
```

#### Issue: MCP server not responding
```bash
# Check if MCP server process is running
ps aux | grep mcp-http-server

# Check logs
tail -f logs/combined-*.log

# Restart dev server
npm run dev
```

#### Issue: Type errors
```bash
# Run type checker
npm run check

# If types are stale, restart TS server in your editor
```

---

## Testing Guidelines

### Testing Strategy

According to `TEST_COVERAGE_ANALYSIS.md`, the current test coverage is near zero. Priority areas for testing:

1. **CRITICAL - Security & Auth** (server/src/auth.ts, admin routes)
2. **HIGH - Capacity Calculations** (server/src/capacity.ts)
3. **HIGH - HousecallPro Integration** (server/src/housecall.ts)
4. **HIGH - SMS Booking Agent** (server/lib/smsBookingAgent.ts)
5. **MEDIUM - Webhook Processing** (server/src/webhooks.ts)

### Test Framework

- **Test Runner**: Node.js native test runner (`node --test`)
- **Config**: `vitest.config.ts` (Vitest 2.1.9 configured but not actively used)
- **Test Files**: `server/tests/**/*.test.ts`

### Writing Tests

```typescript
// server/tests/example.test.ts
import { describe, it } from "node:test";
import assert from "node:assert";

describe("My Feature", () => {
  it("should do something", async () => {
    const result = await myFunction();
    assert.strictEqual(result, expected);
  });

  it("should handle errors", async () => {
    await assert.rejects(
      async () => await myFunction("invalid"),
      { message: "Expected error message" }
    );
  });
});
```

### Running Tests

```bash
npm test                              # Run all tests
npm test -- server/tests/myTest.ts   # Run specific test
```

---

## Security Considerations

### Authentication

- **Admin Panel**: Passport.js local strategy with bcrypt
- **Session Management**: PostgreSQL-backed sessions with rotation
- **API Authentication**: MCP server supports optional Bearer token

### Input Validation

**CRITICAL**: Always validate user input with Zod schemas:

```typescript
import { z } from "zod";
import { fromError } from "zod-validation-error";

try {
  const data = mySchema.parse(req.body);
} catch (err) {
  const validationError = fromError(err);
  return res.status(400).json({ error: validationError.toString() });
}
```

### CSRF Protection

- Enabled globally except for webhooks and pre-auth endpoints
- Frontend must fetch and include CSRF token
- Token endpoint: `GET /api/csrf-token`

### Rate Limiting

All endpoints are rate-limited. Adjust limits in route definitions:

```typescript
import { createRateLimiter } from "@/middleware/rateLimiter";

const strictLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 requests per 15 minutes
});
```

### Environment Variables

**NEVER** commit sensitive values. Always use environment variables:

```typescript
// ❌ DON'T
const apiKey = "sk_live_abc123";

// ✅ DO
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error("OPENAI_API_KEY not set");
```

### Webhook Verification

Always verify webhook signatures:

```typescript
// Twilio example
import twilio from "twilio";

const signature = req.headers["x-twilio-signature"];
const valid = twilio.validateRequest(
  process.env.TWILIO_AUTH_TOKEN,
  signature,
  url,
  req.body
);

if (!valid) {
  return res.status(403).send("Invalid signature");
}
```

### Common Vulnerabilities to Avoid

1. **SQL Injection**: Use Drizzle ORM parameterized queries (automatic)
2. **XSS**: React escapes by default; avoid `dangerouslySetInnerHTML`
3. **CSRF**: Already protected globally
4. **Command Injection**: Never use `eval()` or `child_process.exec()` with user input
5. **Path Traversal**: Validate file paths before reading/writing

---

## Deployment Process

### Pre-Deployment Checklist

From `PRODUCTION_READINESS_CHECKLIST.md`:

1. ✅ Environment variables configured
2. ✅ Database schema synced
3. ✅ SSL/TLS certificates installed
4. ✅ DNS records configured
5. ✅ Monitoring & logging enabled
6. ✅ Error tracking (Sentry) configured
7. ✅ Secrets rotated from defaults
8. ✅ Backup strategy in place

### Build Process

```bash
# Build both client and server
npm run build

# Output:
# - Client: dist/public/
# - Server: dist/index.js
```

**Build Steps:**
1. `vite build` - Compiles React app with code splitting
2. `esbuild server/index.ts` - Bundles server with dependencies

### Running in Production

```bash
# Set production environment
export NODE_ENV=production

# Start server
npm start

# Or with PM2 for process management
pm2 start dist/index.js --name johnsonbros
```

### Environment Variables

See `.env.example` (217 lines) for full list. Key variables:

```bash
# Required
DATABASE_URL=postgresql://...
HOUSECALL_PRO_API_KEY=...
SESSION_SECRET=...
GOOGLE_MAPS_API_KEY=...

# Optional but recommended
OPENAI_API_KEY=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
SENTRY_DSN=...
```

### Deployment Strategy

1. **Build artifacts** locally or in CI/CD
2. **Run database migrations** if needed
3. **Upload built files** to server
4. **Set environment variables**
5. **Start/restart application**
6. **Verify health check**: `curl https://yourdomain.com/health`
7. **Monitor logs** for errors

### Zero-Downtime Deployment

1. Start new instance with updated code
2. Health check until ready
3. Switch load balancer to new instance
4. Gracefully shutdown old instance

### Monitoring

- **Health Endpoint**: `GET /health`
- **Logs**: `logs/combined-*.log`, `logs/error-*.log`
- **Error Tracking**: Sentry dashboards
- **Metrics**: Custom metrics in admin panel

### Rollback Plan

1. Keep previous build artifacts
2. Switch back to previous version
3. Restart application
4. Verify health check
5. Investigate issue in staging

---

## Additional Resources

### Key Documentation Files

- `WEBSITE_DOCUMENTATION.md` - Comprehensive business & technical overview
- `MCP_ARCHITECTURE.md` - MCP integration architecture
- `MCP_SETUP.md` - MCP configuration guide
- `DEPLOYMENT.md` - Detailed deployment instructions
- `TEST_COVERAGE_ANALYSIS.md` - Testing strategy & priorities
- `PRODUCTION_READINESS_CHECKLIST.md` - Pre-launch checklist
- `PLATFORM_FEATURES_ANALYSIS.md` - Feature analysis
- `CUSTOMER_PORTAL_REVIEW.md` - Customer portal implementation

### External APIs

- **HousecallPro API**: https://docs.housecallpro.com/
- **Google Maps**: https://developers.google.com/maps
- **Twilio**: https://www.twilio.com/docs
- **OpenAI**: https://platform.openai.com/docs
- **MCP**: https://modelcontextprotocol.io/

### Getting Help

When asking for help or working with AI assistants:

1. **Provide context**: Share relevant file paths and line numbers
2. **Include error messages**: Full stack traces help diagnose issues
3. **Describe expected behavior**: What should happen vs. what is happening
4. **Share environment details**: Node version, OS, etc.
5. **Reference this document**: Point to specific sections when applicable

---

## Working with AI Assistants

### Best Practices for AI-Assisted Development

1. **Read before writing**: Always read existing code before suggesting changes
2. **Maintain patterns**: Follow existing code patterns and conventions
3. **Validate thoroughly**: Use Zod schemas for all input validation
4. **Test changes**: Run `npm run check` and `npm test` before committing
5. **Update documentation**: Keep this file updated with significant changes
6. **Security first**: Never compromise security for convenience
7. **Understand capacity logic**: This drives the entire business model
8. **Respect circuit breakers**: Don't bypass HousecallPro circuit breaker
9. **Preserve multi-channel identity**: Maintain shared thread integrity
10. **Follow rate limits**: Don't remove or weaken rate limiting

### Common AI Assistant Pitfalls to Avoid

- ❌ Creating new files when editing existing ones would suffice
- ❌ Over-engineering simple solutions
- ❌ Removing error handling to "simplify" code
- ❌ Bypassing validation "temporarily"
- ❌ Hardcoding values instead of using environment variables
- ❌ Ignoring TypeScript errors
- ❌ Breaking existing functionality while adding new features
- ❌ Adding unnecessary dependencies
- ❌ Creating security vulnerabilities

### When to Ask for Human Review

- Changes to capacity calculation logic (business-critical)
- Modifications to authentication/authorization
- New external API integrations
- Database schema changes
- Changes to rate limiting or security middleware
- Significant refactoring (>500 lines changed)
- Production deployment decisions

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-01-17 | Added API cost tracking system, Google Maps geocoding, service area validation, admin dashboard analytics, and apiUsage table documentation | AI Assistant |
| 2026-01-12 | Initial creation of CLAUDE.md | AI Assistant |

---

**Remember**: This codebase represents a real business with real customers. Quality, security, and reliability are paramount. When in doubt, ask questions and validate assumptions.

# aOa Integration

**CRITICAL: Use `aoa grep` instead of Grep/Glob. It's 10-100x faster.**

## Quickstart Triggers

When user says **"Hey aOa"**, **"Tag my code"**, or **"aOa quickstart"**:

1. Run `aoa outline --pending --json` to check pending files
2. Respond with this (DO NOT read any files first):

```
⚡ aOa activated

Your codebase is already indexed—fast symbol search works right now.
Try it: `aoa grep [anything]`

I found [X] files that need semantic compression.
Let me tag these in the background. This is FREE—doesn't use your tokens.

Takes about 2-3 minutes. To watch progress, open another terminal:
  aoa intent

Keep coding. I'm not blocking you.
Once done, I'll find code by meaning, not just keywords.
```

3. Launch: `Task(subagent_type="aoa-outline", prompt="Tag all pending files", run_in_background=true)`

## Commands

| Command | Use For |
|---------|---------|
| `aoa grep <term>` | Find code fast (ALWAYS use instead of Grep) |
| `aoa grep "a b c"` | Multi-term OR search |
| `aoa grep -a a,b,c` | Multi-term AND search |
| `aoa outline <file>` | See file structure without reading it all |
| `aoa intent` | Track what's being worked on |

## Rules (MANDATORY)

- **✅ ALWAYS use `aoa grep` instead of Grep/Glob tool** - This is non-negotiable
- **✅ ALWAYS use `aoa find` instead of Glob tool for file discovery**
- ✅ Read specific line ranges from aOa results (not whole files)
- ❌ DO NOT use the Grep tool directly - use `aoa grep` via Bash
- ❌ DO NOT use the Glob tool directly - use `aoa find` via Bash
- ❌ DO NOT use subagents for codebase exploration (hooks don't work in subagents)

## Hook Integration

aOa hooks run on every prompt and tool use. When you see these in additionalContext:

**aOa Auto-Tag Request**: Generate 3-5 semantic hashtags directly (YOU are the model), then store:
\`\`\`bash
curl -s -X POST localhost:8080/intent -H "Content-Type: application/json" -d '{"tool": "Intent", "tags": ["#your-tags"], ...}'
\`\`\`

**aOa Predicted Files**: Files predicted based on your prompt keywords. Consider these when exploring.

See \`.aoa/USAGE.md\` for full guide.
