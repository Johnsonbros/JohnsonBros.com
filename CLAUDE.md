# CLAUDE.md - AI Assistant Guide for Johnson Bros. Plumbing

> **Last Updated**: January 2026
> **Purpose**: Comprehensive reference guide for AI assistants (Claude, GitHub Copilot, etc.) working on this codebase

---

## 📋 Quick Reference

### Project Identity
- **Name**: Johnson Bros. Plumbing & Drain Cleaning
- **Type**: Production Full-Stack Web Application
- **Business**: Family-owned plumbing company (Quincy, MA, since 1997)
- **Primary Functions**: Customer acquisition, booking automation, business operations, AI-powered support

### Technology Stack at a Glance
```
Frontend:  React 18 + TypeScript + Vite + Tailwind CSS + Radix UI
Backend:   Express + TypeScript + Node.js
Database:  PostgreSQL (Neon) + Drizzle ORM
Routing:   Wouter (lightweight React router)
State:     TanStack Query + React Hook Form
AI/MCP:    OpenAI Agents SDK + Model Context Protocol
```

### Essential Commands
```bash
npm run dev      # Development mode (port 5000 + MCP on 3001)
npm run build    # Production build
npm start        # Production server
npm run check    # TypeScript type checking
npm run db:push  # Apply database schema changes
```

---

## 🗂️ Codebase Structure

### Directory Organization

```
/home/user/JohnsonBros.com/
│
├── client/                          # Frontend React Application
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   │   ├── ui/                 # shadcn/ui primitives (Button, Dialog, etc.)
│   │   │   ├── landing/            # Marketing components
│   │   │   ├── booking/            # Booking flow components
│   │   │   └── admin/              # Admin dashboard components
│   │   ├── pages/                  # Route-level page components
│   │   │   ├── admin/              # Admin dashboard pages
│   │   │   ├── service-areas/      # Location-specific SEO pages
│   │   │   ├── services/           # Service detail pages
│   │   │   └── landing/            # Marketing landing pages
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── contexts/               # React contexts (ABTestingContext)
│   │   └── lib/                    # Client utilities, API clients
│   └── public/                     # Static assets (images, icons)
│
├── server/                          # Backend Express Application
│   ├── src/                        # Core server logic modules
│   │   ├── adminRoutes.ts          # Admin API endpoints
│   │   ├── auth.ts                 # Authentication logic
│   │   ├── capacity.ts             # Capacity calculation engine
│   │   ├── housecall.ts            # HousecallPro API integration
│   │   ├── webhooks.ts             # Webhook event handlers
│   │   ├── heatmap.ts              # Geographic data processing
│   │   ├── security.ts             # Security middleware
│   │   ├── monitoring/             # Logging & Sentry
│   │   ├── ads/                    # Google Ads automation
│   │   └── util/                   # Server utilities
│   ├── lib/                        # Shared server libraries
│   │   ├── smsBookingAgent.ts      # AI SMS automation
│   │   ├── twilio.ts               # SMS integration
│   │   └── aiChat.ts               # Chat functionality
│   ├── routes.ts                   # Main API route definitions
│   └── index.ts                    # Server entry point
│
├── shared/                          # Shared Client/Server Code
│   └── schema.ts                   # Database schema & Zod validation (73K+ lines)
│
├── src/                             # MCP Server Implementation
│   ├── mcp-http-server.ts          # HTTP transport for MCP
│   └── booker.ts                   # MCP booking tools
│
├── config/                          # Configuration Files
│   └── capacity.yml                # Business rules, capacity thresholds, UI copy
│
├── scripts/                         # Utility scripts
├── migrations/                      # Database migrations
├── logs/                            # Application logs
└── attached_assets/                 # Historical assets & content
```

### Path Aliases (Critical for Imports)

```typescript
// Client imports - use @ prefix
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"

// Shared imports - use @shared prefix
import { insertCustomerSchema } from "@shared/schema"

// Server imports - use absolute paths from project root
import { HousecallProClient } from "server/src/housecall.ts"
```

**Path Configuration:**
- Defined in `vite.config.ts` and `tsconfig.json`
- `@/*` → `/client/src/*`
- `@shared/*` → `/shared/*`
- `@assets/*` → `/attached_assets/*`

---

## 🎯 Development Workflows

### Starting a New Feature

**Step-by-Step Workflow:**

1. **Understand the requirements** - Read existing documentation (`WEBSITE_DOCUMENTATION.md`)
2. **Check capacity configuration** - Review `/config/capacity.yml` for business rules
3. **Define data models** (if needed):
   - Add Zod schemas to `/shared/schema.ts`
   - Create database tables using Drizzle ORM syntax
   - Run `npm run db:push` to apply changes
4. **Implement backend**:
   - Create API routes in `/server/routes.ts` or feature module
   - Apply appropriate middleware (auth, rate limiting, validation)
   - Add error handling with try-catch blocks
   - Use Logger utility for debugging
5. **Implement frontend**:
   - Create components in `/client/src/components/` or `/client/src/pages/`
   - Use TanStack Query for API calls
   - Implement loading and error states
   - Style with Tailwind CSS utility classes
6. **Test thoroughly**:
   - Manual testing in development mode
   - Check mobile responsiveness
   - Verify error handling
   - Test with real HousecallPro data if applicable

### Common Development Tasks

#### Adding a New Page

```typescript
// 1. Create page component: /client/src/pages/my-new-page.tsx
export default function MyNewPage() {
  return <div>My New Page</div>
}

// 2. Add lazy import in App.tsx
const MyNewPage = lazy(() => import("@/pages/my-new-page"))

// 3. Add route in App.tsx Switch component
<Route path="/my-new-page" component={MyNewPage} />

// 4. Add SEO metadata with react-helmet-async
import { Helmet } from "react-helmet-async"
<Helmet>
  <title>Page Title | Johnson Bros. Plumbing</title>
  <meta name="description" content="Page description" />
</Helmet>
```

#### Adding a New API Endpoint

```typescript
// In server/routes.ts or create new module
app.post(
  '/api/my-endpoint',
  rateLimits.publicWrite,        // Apply rate limiting
  authenticate,                   // If auth required
  async (req, res) => {
    try {
      // Validate input
      const data = mySchema.parse(req.body)

      // Business logic
      const result = await doSomething(data)

      // Log for debugging
      Logger.info('My endpoint called', { userId: req.user?.id })

      // Return response
      res.json({ success: true, data: result })
    } catch (error) {
      Logger.error('My endpoint error', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)
```

#### Creating a New Component

```typescript
// 1. Create file: /client/src/components/MyComponent.tsx
import { cn } from "@/lib/utils"

interface MyComponentProps {
  title: string
  onAction?: () => void
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      {onAction && (
        <button onClick={onAction}>Action</button>
      )}
    </div>
  )
}

// 2. Use in other components
import { MyComponent } from "@/components/MyComponent"
```

#### Working with Database

```typescript
// 1. Define schema in /shared/schema.ts
export const myTable = pgTable('my_table', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow()
})

// 2. Create insert schema with Zod
export const insertMyTableSchema = createInsertSchema(myTable)

// 3. Use in API endpoint
import { db } from "@db"
import { myTable, insertMyTableSchema } from "@shared/schema"

const data = insertMyTableSchema.parse(req.body)
const [result] = await db.insert(myTable).values(data).returning()
```

---

## 🔑 Key Conventions & Patterns

### Naming Conventions

| Item | Convention | Examples |
|------|-----------|----------|
| **Files** | kebab-case | `booking-modal.tsx`, `api-client.ts` |
| **React Components** | PascalCase | `BookingModal.tsx`, `TechnicianStatus.tsx` |
| **Functions** | camelCase | `callHousecallAPI()`, `calculateCapacity()` |
| **Hooks** | camelCase with `use` prefix | `useIsMobile()`, `useCapacity()` |
| **Constants** | SCREAMING_SNAKE_CASE | `HOUSECALL_API_BASE`, `MAX_RETRY_ATTEMPTS` |
| **CSS Classes** | Tailwind utilities or kebab-case | `flex`, `gap-4`, `custom-class` |
| **Types/Interfaces** | PascalCase | `CustomerAddress`, `BookingFormData` |

### TypeScript Patterns

**Always Use Strict Mode:**
```typescript
// ✅ Good - Explicit types
interface User {
  id: number
  email: string
  role: 'admin' | 'customer'
}

function getUser(id: number): Promise<User> {
  // implementation
}

// ❌ Bad - Using any
function getUser(id: any): any {
  // implementation
}
```

**Zod for Runtime Validation:**
```typescript
import { z } from "zod"

// Define schema
const customerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional()
})

// Infer TypeScript type
type Customer = z.infer<typeof customerSchema>

// Use in validation
const data = customerSchema.parse(req.body) // Throws if invalid
const result = customerSchema.safeParse(req.body) // Returns {success, data/error}
```

### React Component Patterns

**Standard Component Structure:**
```typescript
// 1. Imports
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"

// 2. Types
interface MyComponentProps {
  id: string
  onComplete?: () => void
}

// 3. Component
export function MyComponent({ id, onComplete }: MyComponentProps) {
  // 4. Hooks
  const [loading, setLoading] = useState(false)
  const { data } = useQuery({ queryKey: ['item', id], queryFn: fetchItem })

  // 5. Event handlers
  const handleSubmit = () => {
    // logic
    onComplete?.()
  }

  // 6. Render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}

// 7. Export (named export preferred)
```

**State Management Best Practices:**
```typescript
// Server state - Use TanStack Query
const { data, isLoading, error } = useQuery({
  queryKey: ['customers', filters],
  queryFn: () => fetchCustomers(filters),
  staleTime: 5 * 60 * 1000 // 5 minutes
})

// Form state - Use React Hook Form
const form = useForm({
  resolver: zodResolver(bookingSchema),
  defaultValues: { name: '', email: '' }
})

// UI state - Use useState or Context
const [isOpen, setIsOpen] = useState(false)
```

### API Design Patterns

**Rate Limiting Strategy (6 Tiers):**
```typescript
// Defined in server/src/security.ts
rateLimits.publicRead       // 100 requests/15min
rateLimits.publicWrite      // 20 requests/15min
rateLimits.customerLookup   // 10 requests/15min
rateLimits.admin            // 200 requests/15min
rateLimits.blog             // 50 requests/15min
rateLimits.webhooks         // 500 requests/15min
```

**CSRF Protection:**
```typescript
// Most endpoints use CSRF tokens
// Exemptions in server/src/security.ts:
// - /api/webhooks/* (verified via signatures)
// - /health (monitoring)
// - GET requests (safe methods)
```

**Error Response Format:**
```typescript
// Standard error response
{
  "error": "Human-readable message",
  "code": "ERROR_CODE",
  "details": { /* optional */ }
}
```

---

## 🔌 External Integrations

### HousecallPro API

**Purpose**: Field service management, customer/job/scheduling data

**Key Implementation**: `/server/src/housecall.ts`

**Common Operations:**
```typescript
import { HousecallProClient } from "server/src/housecall.ts"

// Get available booking windows
const windows = await callHousecallAPI('/booking_windows', {
  start_time: '2024-01-01T00:00:00Z',
  end_time: '2024-01-31T23:59:59Z'
})

// Create customer
const customer = await callHousecallAPI('/customers', {
  method: 'POST',
  body: { name: 'John Doe', email: 'john@example.com' }
})

// Search customers
const results = await callHousecallAPI('/customers', {
  params: { 'filter[email]': 'john@example.com' }
})
```

**Important Notes:**
- All API calls use circuit breaker pattern for resilience
- Rate limits: Respect HousecallPro's limits
- Webhook events: Handled in `/server/src/webhooks.ts`
- API key: `process.env.HOUSECALL_PRO_API_KEY`

### OpenAI Integration

**Purpose**: AI-powered booking assistant, SMS automation

**Key Implementation**: `/server/lib/smsBookingAgent.ts`

**SMS Booking Agent:**
```typescript
// Automated SMS follow-ups
// - 3min 57sec after initial inquiry
// - AI-powered conversation via OpenAI Agents SDK
// - Tool access via MCP for booking actions
```

**ChatKit Widget:**
- Integration in `/client/src/components/` (OpenAI ChatKit React)
- Provides conversational booking interface
- Context-aware assistance

### Twilio SMS

**Purpose**: SMS notifications, two-way messaging

**Key Implementation**: `/server/lib/twilio.ts`

**Common Operations:**
```typescript
import { twilioClient } from "server/lib/twilio.ts"

// Send SMS
await twilioClient.messages.create({
  body: 'Your appointment is confirmed',
  to: '+1234567890',
  from: process.env.TWILIO_PHONE_NUMBER
})
```

**Webhook Handling:**
- Inbound SMS → `/api/twilio/sms` endpoint
- Triggers AI booking agent for conversational booking

### Google Services

**Maps API**: Service area visualization, address autocomplete
**Places API**: Location data enrichment
**Ads API**: Automated budget adjustments based on capacity

**Ads Automation Logic** (`/server/src/ads/bridge.ts`):
- When capacity drops below threshold → increase ad spend
- When capacity is healthy → reduce ad spend
- Prevents wasted spend during busy periods

---

## 🤖 Model Context Protocol (MCP)

### What is MCP?

This repository implements **Model Context Protocol**, allowing AI assistants (like Claude) to interact with the booking system programmatically. This is a cutting-edge feature that enables:

- AI assistants to book services directly
- Conversational booking via SMS
- Future ChatGPT app integration

### MCP Server Architecture

**HTTP Server** (`/src/mcp-http-server.ts`):
- Runs on port 3001 in development
- Implements HTTP SSE transport
- Session-based with 15-minute TTL
- Auto-starts with `npm run dev`

**MCP Tools** (`/src/booker.ts`):
```typescript
// Available tools for AI assistants:
1. book_service_call    - Complete booking workflow
2. search_availability  - Check available time slots
3. get_quote           - Instant price estimates
4. get_services        - List all services
5. emergency_help      - Emergency guidance
```

### MCP Configuration

**OpenMCP Setup** (`openmcp_housecall.json`):
```json
{
  "mcpServers": {
    "housecall_openapi": {
      "command": "npx",
      "args": ["-y", "@open-rpc/mcp-server", "${HCP_OPENAPI_PATH}"]
    },
    "housecall_booker": {
      "command": "node",
      "args": ["dist/booker.js"]
    }
  }
}
```

**Usage in Claude Desktop** (see `MCP_SETUP.md` for full guide):
1. Build MCP server: `npm run build`
2. Configure in Claude Desktop settings
3. Tools become available in Claude conversations

**Important Considerations:**
- MCP discovery headers present on all pages
- CORS configured for AI client access
- Comprehensive error handling with correlation IDs
- Logging with Pino for debugging

---

## 🔒 Security Conventions

### Authentication & Authorization

**Pattern:**
```typescript
// Protect admin routes
app.get('/api/admin/data', authenticate, async (req, res) => {
  // req.user available here
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  // proceed
})
```

**Implementation**: Passport.js with local strategy (`/server/src/auth.ts`)

**Session Management**:
- Express Session with PostgreSQL store
- Secure cookies in production
- 24-hour default session duration

### Input Validation

**ALWAYS validate user input:**
```typescript
// ✅ Good
const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100)
})
const data = schema.parse(req.body) // Throws if invalid

// ❌ Bad
const { email, name } = req.body // No validation!
```

### Secrets Management

**Environment Variables:**
- NEVER commit `.env` files
- Use `.env.example` as template
- Validate required vars on startup (`/server/src/envValidator.ts`)
- Generate secure secrets: `openssl rand -base64 32`

**Required in Production:**
```bash
DATABASE_URL=postgresql://...
SESSION_SECRET=<secure-random-string>
HOUSECALL_PRO_API_KEY=Bearer ...
GOOGLE_MAPS_API_KEY=...
```

### Security Headers

Configured in `/server/src/security.ts`:
- Helmet for security headers
- CSRF protection with targeted exemptions
- CORS with environment-based origins
- Rate limiting on all endpoints

---

## 📊 Database Patterns

### Drizzle ORM Usage

**Schema Definition** (`/shared/schema.ts`):
```typescript
export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  emailIdx: index('email_idx').on(table.email)
}))
```

**Common Queries:**
```typescript
import { db } from "@db"
import { customers, eq } from "@shared/schema"

// Insert
const [newCustomer] = await db
  .insert(customers)
  .values({ email: 'test@example.com', name: 'Test' })
  .returning()

// Select
const customer = await db
  .select()
  .from(customers)
  .where(eq(customers.email, 'test@example.com'))
  .limit(1)

// Update
await db
  .update(customers)
  .set({ name: 'Updated Name' })
  .where(eq(customers.id, 123))

// Delete
await db
  .delete(customers)
  .where(eq(customers.id, 123))
```

### Key Tables & Their Purpose

| Table | Purpose | Notes |
|-------|---------|-------|
| `customerAddresses` | Customer locations | Privacy-protected coordinates |
| `appointments` | Service bookings | Synced with HousecallPro |
| `scheduledSms` | SMS queue | 3min 57sec delayed follow-ups |
| `smsConversations` | AI agent sessions | Conversation tracking |
| `conversionEvents` | Analytics funnel | Conversion tracking |
| `abTests` | A/B experiments | Variant assignments |
| `blogPosts` | Content management | SEO-optimized |
| `heatMapCache` | Geographic data | Optimized grid-based queries |
| `webhookEvents` | Event log | HousecallPro webhooks |

### Schema Updates

```bash
# 1. Modify /shared/schema.ts
# 2. Push changes to database
npm run db:push

# 3. Type check
npm run check
```

**Best Practices:**
- Add indexes for frequently queried fields
- Use composite indexes for multi-column queries
- Implement timestamps for audit trails
- Use foreign keys for referential integrity

---

## 🎨 UI/UX Conventions

### Tailwind CSS Patterns

**Component Styling:**
```typescript
// Use utility classes
<div className="flex items-center gap-4 p-6 bg-white rounded-lg shadow-md">

// Responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// Conditional classes with cn utility
import { cn } from "@/lib/utils"
<button className={cn(
  "px-4 py-2 rounded",
  isActive && "bg-blue-500 text-white",
  !isActive && "bg-gray-200 text-gray-700"
)}>
```

**Custom Theme:**
- Defined in `tailwind.config.js`
- CSS variables in `client/src/index.css`
- Brand colors use HSL format

### Radix UI Components

**Pattern for Dialogs:**
```typescript
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
```

**Common Radix Primitives Used:**
- Dialog, AlertDialog - Modals
- Popover, DropdownMenu - Overlays
- Accordion, Collapsible - Expandable content
- Select, RadioGroup - Form controls
- Toast - Notifications

### Mobile Responsiveness

**Critical Considerations:**
- Mobile-first approach with Tailwind
- Test on actual devices when possible
- Pay attention to modal scrolling on mobile
- Use `useIsMobile()` hook for conditional rendering

```typescript
import { useIsMobile } from "@/hooks/use-mobile"

function MyComponent() {
  const isMobile = useIsMobile()

  return (
    <div className={isMobile ? "p-4" : "p-8"}>
      {/* Content */}
    </div>
  )
}
```

---

## 🧪 Testing & Quality Assurance

### Current Testing Status

**No Formal Test Suite** - Tests should be added:
- Unit tests for utility functions
- Integration tests for API endpoints
- Component tests for complex UI
- E2E tests for booking flow

**Existing QA Documentation:**
- `TESTING_FINDINGS_REPORT.md` - Detailed findings
- `PRODUCTION_READINESS_CHECKLIST.md` - QA checklist
- Test scenarios in `test-time-scenarios.js`

### Manual Testing Checklist

**Before Deploying:**
1. Test booking flow end-to-end
2. Verify capacity calculations
3. Check mobile responsiveness
4. Test authentication flows
5. Verify webhook handling
6. Check error states
7. Test A/B experiment assignments
8. Verify SMS notifications
9. Test admin dashboard functionality

**Health Check Endpoint:**
```bash
GET /health
# Returns: { status: 'ok', timestamp, uptime, memory, ... }
```

---

## 🚀 Deployment & Production

### Environment Setup

**Required Environment Variables:**
```bash
DATABASE_URL                # PostgreSQL connection
HOUSECALL_PRO_API_KEY      # HousecallPro API access
SESSION_SECRET             # Secure session encryption
GOOGLE_MAPS_API_KEY        # Maps integration
VITE_GOOGLE_MAPS_API_KEY   # Frontend maps
```

**Optional but Recommended:**
```bash
SENTRY_DSN                 # Error tracking
TWILIO_ACCOUNT_SID         # SMS notifications
GOOGLE_ADS_CLIENT_ID       # Ads automation
```

See `.env.example` for complete list.

### Build Process

```bash
# Production build
npm run build

# This does:
# 1. Vite builds React app → dist/public/
# 2. esbuild bundles server → dist/index.js
```

### Deployment Targets

**Primary: Replit**
- Auto-deployment via Replit platform
- Environment variables in Secrets tab
- Zero-config deployment

**Traditional Hosting:**
- Node.js 18+ required
- Reverse proxy (nginx) for SSL/TLS
- Process manager (PM2 or systemd)
- See `DEPLOYMENT.md` for detailed guide

### Production Optimizations

**Enabled by Default:**
- Compression middleware
- Static asset caching (1 year)
- Security headers via Helmet
- Rate limiting
- CSRF protection
- Sentry error tracking

### Monitoring

**Health Monitoring:**
- `/health` endpoint for uptime checks
- Sentry for error tracking
- Winston logging to files in `/logs/`
- Admin dashboard for real-time metrics

**Log Files:**
```bash
/logs/combined.log       # All logs
/logs/error.log         # Error logs only
/logs/exceptions.log    # Uncaught exceptions
```

---

## 🎓 Best Practices for AI Assistants

### Reading Before Writing

**CRITICAL RULE**: Never modify code you haven't read first.

```
✅ Correct workflow:
1. Read the existing file
2. Understand current implementation
3. Make targeted changes
4. Preserve existing patterns

❌ Incorrect workflow:
1. Generate new code from scratch
2. Replace existing code without reading
```

### Understanding Business Logic

**Key Configuration File**: `/config/capacity.yml`

This file contains:
- Capacity thresholds and calculations
- Dynamic pricing rules
- UI copy for different capacity states
- Google Ads automation rules

**Always review this file when working on:**
- Booking flow changes
- Capacity-related features
- Pricing display
- Marketing automation

### Avoiding Over-Engineering

**Keep it Simple:**
- ❌ Don't add features beyond requirements
- ❌ Don't refactor code unnecessarily
- ❌ Don't add abstractions prematurely
- ✅ Make minimal changes to achieve the goal
- ✅ Follow existing patterns
- ✅ Keep code readable and maintainable

### Documentation Discipline

**Update Documentation When:**
- Adding new environment variables
- Creating new API endpoints
- Changing core business logic
- Adding external integrations

**Key Docs to Update:**
- `WEBSITE_DOCUMENTATION.md` - Feature documentation
- `DEPLOYMENT.md` - Deployment changes
- `MCP_SETUP.md` - MCP-related changes
- This file (`CLAUDE.md`) - AI conventions

### Error Handling Pattern

**Always Handle Errors Gracefully:**
```typescript
try {
  // Operation
  const result = await riskyOperation()
  Logger.info('Operation successful', { result })
  return result
} catch (error) {
  Logger.error('Operation failed', error)
  // User-friendly error message
  throw new Error('Something went wrong. Please try again.')
}
```

### Commit Message Convention

**Pattern observed in git history:**
```
# Good examples from recent commits:
"Add automated SMS booking agent to follow up on customer inquiries"
"Harden MCP customer lookup and add callback tools"
"Improve mobile menu display by adjusting layering"

# Pattern:
- Imperative mood ("Add", "Fix", "Improve")
- Clear description of what changed
- No issue numbers in message (use PR description)
```

---

## 📚 Important Reference Files

### Essential Documentation

| File | Purpose | When to Read |
|------|---------|--------------|
| `WEBSITE_DOCUMENTATION.md` | Comprehensive feature docs | Understanding any feature |
| `MCP_SETUP.md` | MCP server configuration | Working on AI integrations |
| `DEPLOYMENT.md` | Production deployment | Deployment changes |
| `.env.example` | Environment variables | Setup or new env vars |
| `/config/capacity.yml` | Business rules | Booking/capacity work |
| `.github/copilot-instructions.md` | GitHub Copilot guide | Code conventions |

### Key Source Files

| File | Lines | Purpose |
|------|-------|---------|
| `/shared/schema.ts` | 73,626 | Database schema & validation |
| `/server/routes.ts` | ~600 | Main API route definitions |
| `/server/src/capacity.ts` | ~800 | Capacity calculation engine |
| `/server/src/housecall.ts` | ~600 | HousecallPro integration |
| `/client/src/App.tsx` | ~400 | React app root & routing |

---

## 🔍 Common Gotchas & Pitfalls

### 1. Import Path Issues

**Problem**: Import fails with "Cannot find module"

**Solution**: Check path alias configuration
```typescript
// ✅ Correct - Client code
import { Button } from "@/components/ui/button"

// ❌ Wrong - Missing alias
import { Button } from "components/ui/button"

// ✅ Correct - Shared code
import { schema } from "@shared/schema"

// ❌ Wrong - Absolute path in client
import { schema } from "/shared/schema"
```

### 2. TypeScript Strict Mode

**Problem**: TypeScript errors on optional chaining

**Solution**: Use proper TypeScript patterns
```typescript
// ✅ Correct
const name = user?.name ?? 'Guest'

// ❌ Risky
const name = user.name // May throw if user is undefined
```

### 3. Rate Limiting on Development

**Problem**: Getting rate limited during testing

**Solution**: Rate limits apply in development
- Use different endpoints if testing repeatedly
- Or temporarily comment out rate limiter
- Remember to restore before committing

### 4. Database Schema Changes

**Problem**: Schema changes not reflected

**Solution**: Run the migration command
```bash
npm run db:push
npm run check  # Verify types updated
```

### 5. Environment Variables in Client

**Problem**: Client can't access `process.env.MY_VAR`

**Solution**: Prefix with `VITE_` for client access
```bash
# ❌ Not accessible in client
GOOGLE_MAPS_API_KEY=abc123

# ✅ Accessible in client
VITE_GOOGLE_MAPS_API_KEY=abc123
```

### 6. MCP Server Not Starting

**Problem**: MCP tools not available

**Solution**:
- Check MCP server is running on port 3001
- Verify build with `npm run build`
- Check logs in `/logs/` directory
- Ensure environment variables are set

### 7. CSRF Token Issues

**Problem**: POST requests failing with 403

**Solution**:
- Check if endpoint is CSRF-exempt (webhooks, etc.)
- Ensure CSRF token is included in requests
- Review `/server/src/security.ts` for exemptions

---

## 🚦 Performance Guidelines

### Frontend Optimization

**Code Splitting:**
```typescript
// ✅ Lazy load routes
const AdminDashboard = lazy(() => import("@/pages/admin/dashboard"))

// ✅ Lazy load heavy components
const HeavyChart = lazy(() => import("@/components/HeavyChart"))
```

**React Query Caching:**
```typescript
// ✅ Set appropriate stale times
const { data } = useQuery({
  queryKey: ['customers'],
  queryFn: fetchCustomers,
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 30 * 60 * 1000, // 30 minutes
})
```

**Minimize Re-renders:**
```typescript
// ✅ Memoize expensive calculations
const expensiveValue = useMemo(() =>
  calculateExpensiveValue(data),
  [data]
)

// ✅ Memoize callbacks
const handleClick = useCallback(() => {
  // handler
}, [deps])
```

### Backend Optimization

**Database Queries:**
```typescript
// ✅ Use indexes for WHERE clauses
// ✅ Limit result sets with .limit()
// ✅ Avoid N+1 queries
// ❌ Don't fetch all rows without pagination
```

**Caching Strategy:**
```typescript
// Implemented in /server/src/cachingMiddleware.ts
// - Static assets: 1 year
// - API responses: Varies by endpoint
// - Use cache headers appropriately
```

---

## 🎯 Quick Troubleshooting

### Application Won't Start

```bash
# Check for TypeScript errors
npm run check

# Check for missing dependencies
npm install

# Check environment variables
cat .env  # Ensure required vars are set

# Check database connection
# Verify DATABASE_URL is correct

# Check logs
tail -f logs/combined.log
```

### API Calls Failing

```bash
# Check authentication
# - Is user logged in?
# - Is authenticate middleware applied correctly?

# Check rate limits
# - Review /server/src/security.ts
# - Check if rate limit exceeded

# Check CSRF
# - Exempt endpoint or include token
# - Review /server/src/security.ts

# Check validation
# - Review Zod schema
# - Check request body format
```

### Frontend Not Updating

```bash
# Hard refresh browser
# Clear React Query cache
# Check if API response changed
# Verify staleTime configuration
# Check browser console for errors
```

---

## 📖 Learning Resources

### Project-Specific

- **Comprehensive Docs**: `WEBSITE_DOCUMENTATION.md`
- **MCP Guide**: `MCP_SETUP.md`
- **Deployment**: `DEPLOYMENT.md`
- **Testing Findings**: `TESTING_FINDINGS_REPORT.md`

### Technology Documentation

- **React**: https://react.dev
- **TypeScript**: https://www.typescriptlang.org/docs
- **Vite**: https://vitejs.dev
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Radix UI**: https://www.radix-ui.com/primitives
- **TanStack Query**: https://tanstack.com/query/latest
- **Drizzle ORM**: https://orm.drizzle.team
- **Wouter**: https://github.com/molefrog/wouter
- **Zod**: https://zod.dev
- **Model Context Protocol**: https://modelcontextprotocol.io

### API Documentation

- **HousecallPro API**: https://docs.housecallpro.com/
- **Google Maps JS**: https://developers.google.com/maps/documentation/javascript
- **Twilio**: https://www.twilio.com/docs
- **OpenAI API**: https://platform.openai.com/docs

---

## 🔄 Keeping This Document Updated

### When to Update CLAUDE.md

- **Major architectural changes** - New patterns or conventions
- **Technology stack changes** - New dependencies or frameworks
- **Workflow changes** - New development processes
- **Common pitfalls discovered** - Add to Gotchas section
- **New integrations** - Document integration patterns
- **Security practices** - Update security conventions

### Update Process

1. Identify what changed
2. Update relevant section(s)
3. Update "Last Updated" date at top
4. Commit with descriptive message
5. Inform team of significant changes

---

## ✅ Checklist for AI Assistants

Before making any code changes, ensure you:

- [ ] Read all relevant existing code first
- [ ] Understand the current implementation pattern
- [ ] Review business logic in `/config/capacity.yml` if applicable
- [ ] Check existing documentation (`WEBSITE_DOCUMENTATION.md`, etc.)
- [ ] Verify TypeScript types are correct
- [ ] Apply proper error handling
- [ ] Follow naming conventions
- [ ] Use appropriate rate limiting on API endpoints
- [ ] Add logging for debugging
- [ ] Test the change in development mode
- [ ] Update documentation if needed
- [ ] Check mobile responsiveness for UI changes
- [ ] Verify no security vulnerabilities introduced

---

## 📝 Notes

### Project Philosophy

This is a **production application** serving real customers. Changes should be:
- **Conservative**: Don't break existing functionality
- **Tested**: Verify changes work as expected
- **Documented**: Update docs for future reference
- **Secure**: Never compromise security for convenience
- **Simple**: Prefer simplicity over complexity

### Code Quality Principles

1. **Type Safety**: Leverage TypeScript fully
2. **Validation**: Validate all user input
3. **Error Handling**: Graceful degradation
4. **Performance**: Optimize for user experience
5. **Accessibility**: Follow WCAG guidelines
6. **Security**: Defense in depth

---

**End of CLAUDE.md**

For questions or updates to this guide, please review recent code changes or consult project documentation.
