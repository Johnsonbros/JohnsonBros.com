# CLAUDE.md - AI Assistant Guide for Johnson Bros. Plumbing Codebase

## Table of Contents
1. [Project Overview](#project-overview)
2. [Codebase Structure](#codebase-structure)
3. [Technology Stack](#technology-stack)
4. [Development Workflows](#development-workflows)
5. [Code Conventions](#code-conventions)
6. [Key Systems](#key-systems)
7. [Database Patterns](#database-patterns)
8. [API Architecture](#api-architecture)
9. [Frontend Patterns](#frontend-patterns)
10. [Common Tasks](#common-tasks)
11. [Important Files Reference](#important-files-reference)
12. [Do's and Don'ts](#dos-and-donts)
13. [Git Workflow](#git-workflow)

---

## Project Overview

**Johnson Bros. Plumbing & Drain Cleaning** - A production-grade, full-stack web application for a family-owned plumbing business serving Quincy, MA and surrounding areas since 1997.

### Primary Purpose
- **Customer Acquisition**: Convert visitors to paying customers through capacity-based dynamic messaging
- **Service Booking**: Real-time HousecallPro integration for seamless appointment scheduling
- **Operations Management**: Automated capacity calculations, Google Ads adjustments, and notifications
- **AI Integration**: Native MCP (Model Context Protocol) server for AI-powered booking

### Business Model
- Same-day and next-day plumbing services
- Dynamic pricing with capacity-based fee waivers
- Emergency 24/7 service availability
- Multi-tier service areas (Tier 1: Quincy center, Tier 2: Quincy outskirts, Tier 3: Extended areas)

---

## Codebase Structure

```
JohnsonBros.com/
├── client/                      # Frontend React application
│   ├── public/                 # Static assets (images, fonts, etc.)
│   └── src/
│       ├── components/         # React components
│       │   ├── ui/            # shadcn/ui base components (100+ files)
│       │   └── *.tsx          # Feature components
│       ├── contexts/          # React Context providers (ABTestingContext)
│       ├── hooks/             # Custom React hooks
│       ├── lib/               # Utilities and helper functions
│       ├── pages/             # Route-level page components
│       │   ├── admin/         # Admin dashboard pages
│       │   ├── landing/       # Marketing landing pages
│       │   ├── service/       # Service-specific pages
│       │   ├── service-areas/ # Location-based SEO pages
│       │   └── services/      # Service category pages
│       ├── App.tsx            # Main app component with routing
│       ├── main.tsx           # Entry point
│       └── index.css          # Global styles
│
├── server/                     # Backend Express application
│   ├── src/                   # Source code
│   │   ├── adminRoutes.ts     # Admin API endpoints
│   │   ├── capacity.ts        # Capacity calculation engine
│   │   ├── housecall.ts       # HousecallPro API client
│   │   ├── webhooks.ts        # Webhook handlers
│   │   ├── ads/               # Google Ads integration
│   │   ├── monitoring/        # Server monitoring utilities
│   │   └── util/              # Server utilities
│   ├── index.ts               # Server entry point
│   ├── routes.ts              # API route registration
│   └── vite.ts                # Vite dev server setup
│
├── shared/                     # Shared code between client/server
│   └── schema.ts              # Database schema (Drizzle ORM) - 1500+ lines
│
├── config/                     # Configuration files
│   └── capacity.yml           # Business logic configuration
│
├── migrations/                 # Database migrations (Drizzle)
├── scripts/                    # Build and utility scripts
└── logs/                       # Application logs

# Configuration Files (Root)
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite build configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── drizzle.config.ts          # Database ORM configuration
└── .env                       # Environment variables (not in repo)
```

### Key Directories Explained

**client/src/components/**:
- `ui/` - Base shadcn/ui components (Button, Dialog, Card, etc.)
- Feature components (BookingModal, ExpressBooking, Header, Footer, etc.)
- Components are self-contained and follow single responsibility principle

**client/src/pages/**:
- File-based routing via Wouter
- Each page is a complete route (e.g., `/services/drain-cleaning` → `services/drain-cleaning.tsx`)
- Pages import components and manage their own SEO via React Helmet

**server/src/**:
- Route handlers follow Express.js patterns
- Services are organized as classes (HousecallProClient, CapacityCalculator)
- Middleware for auth, rate limiting, CSRF protection

**shared/schema.ts**:
- Single source of truth for database structure
- 45+ tables covering customers, bookings, analytics, blog, webhooks, A/B testing
- Type-safe schema with Drizzle ORM

---

## Technology Stack

### Core Framework
- **Frontend**: React 18.3.1 + TypeScript 5.6.3 + Vite 5.4.19
- **Backend**: Express 4.21.2 + Node.js
- **Database**: PostgreSQL (Neon serverless) + Drizzle ORM 0.39.1
- **Routing**: Wouter 3.3.5 (lightweight React router)
- **Styling**: Tailwind CSS 3.4.17 + shadcn/ui

### State Management
- **Server State**: TanStack Query 5.60.5 (React Query)
- **Client State**: React Context API + useState/useReducer
- **Form State**: React Hook Form 7.55.0
- **Validation**: Zod 3.24.2

### UI Libraries
- **Component Base**: Radix UI (20+ unstyled accessible components)
- **Icons**: Lucide React 0.453.0
- **Animations**: Framer Motion 11.13.1
- **Charts**: Recharts 2.15.2

### External Integrations
- **HousecallPro**: Primary business operations platform (scheduling, customers, jobs)
- **Google Maps**: Service area visualization and address validation
- **Twilio**: SMS notifications (5.3.2)
- **OpenAI**: AI chat integration (6.15.0)
- **Google Ads**: Automated campaign management
- **MCP**: Model Context Protocol server for AI assistants

### Security & Middleware
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **csurf**: CSRF protection
- **express-rate-limit**: Rate limiting
- **bcryptjs**: Password hashing
- **Passport**: Authentication

### Monitoring & Logging
- **Sentry**: Error tracking (@sentry/react, @sentry/node)
- **Winston**: Structured logging with daily rotation
- **web-vitals**: Performance monitoring

---

## Development Workflows

### Setting Up Development Environment

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# 3. Push database schema
npm run db:push

# 4. Start development server
npm run dev
```

### Development Server
- Runs on port 5000 (configurable via PORT env var)
- Hot Module Replacement (HMR) for frontend
- TypeScript execution via `tsx`
- Auto-reload on file changes

### NPM Scripts Reference
```json
{
  "dev": "NODE_ENV=development tsx server/index.ts",        // Start dev server
  "build": "vite build && esbuild server/index.ts ...",     // Production build
  "start": "NODE_ENV=production node dist/index.js",        // Run production
  "check": "tsc",                                            // Type checking
  "db:push": "drizzle-kit push"                             // Push schema changes
}
```

### Build Process
1. **Frontend**: Vite builds React app → `dist/public/`
2. **Backend**: esbuild bundles server → `dist/index.js`
3. **Assets**: Static files served from `client/public/`

### Environment Variables Required
```bash
# Critical - Application will not function without these
DATABASE_URL="postgresql://..."              # Neon PostgreSQL connection
HOUSECALL_PRO_API_KEY="..."                 # HousecallPro API access
VITE_GOOGLE_MAPS_API_KEY="..."              # Google Maps (prefixed for Vite)

# Important - Features degraded without these
HOUSECALL_WEBHOOK_SECRET="..."              # Webhook signature verification
SESSION_SECRET="..."                         # Session encryption

# Optional - Extended features
GOOGLE_ADS_DEV_TOKEN="..."                  # Google Ads automation
OPENAI_API_KEY="..."                        # AI chat feature
TWILIO_ACCOUNT_SID="..."                    # SMS notifications
```

See `.env.example` for complete list (185 lines).

---

## Code Conventions

### TypeScript Patterns

**Path Aliases** (defined in `tsconfig.json`):
```typescript
import { Button } from "@/components/ui/button"  // Client code
import { db } from "@shared/schema"               // Shared code
```

**Type Safety**:
- All components use TypeScript with strict mode enabled
- Drizzle ORM provides automatic type inference for database queries
- Zod schemas for runtime validation
- No `any` types unless absolutely necessary

**Naming Conventions**:
- Components: PascalCase (`BookingModal.tsx`)
- Files: kebab-case for pages (`drain-cleaning.tsx`)
- Functions: camelCase (`calculateCapacity`)
- Constants: UPPER_SNAKE_CASE (`SAME_DAY_FEE_WAIVED`)
- Database tables: snake_case (`customer_addresses`)

### Component Patterns

**Standard Component Structure**:
```typescript
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

interface MyComponentProps {
  title: string;
  onComplete?: () => void;
}

export default function MyComponent({ title, onComplete }: MyComponentProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["myData"],
    queryFn: async () => {
      const res = await fetch("/api/data");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold">{title}</h1>
      {/* Component JSX */}
    </div>
  );
}
```

**Custom Hooks Pattern**:
```typescript
// hooks/use-booking-state.ts
import { useState } from "react";

export function useBookingState() {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<string | null>(null);

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => Math.max(1, s - 1));

  return { step, selectedService, setSelectedService, nextStep, prevStep };
}
```

### API Route Patterns

**Standard Route Handler**:
```typescript
import { Router } from "express";
import { z } from "zod";

const router = Router();

// Input validation schema
const CreateBookingSchema = z.object({
  customerId: z.string(),
  serviceId: z.string(),
  scheduledDate: z.string().datetime(),
});

router.post("/api/bookings", async (req, res) => {
  try {
    // Validate input
    const data = CreateBookingSchema.parse(req.body);

    // Business logic
    const result = await createBooking(data);

    // Success response
    res.json({ success: true, data: result });
  } catch (error) {
    // Error handling
    console.error("[Bookings] Create failed:", error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
```

### Database Query Patterns

**Using Drizzle ORM**:
```typescript
import { db } from "@/db";
import { customers, appointments } from "@shared/schema";
import { eq, and, gte } from "drizzle-orm";

// Simple select
const customer = await db
  .select()
  .from(customers)
  .where(eq(customers.email, "john@example.com"))
  .limit(1);

// Join query
const upcomingAppointments = await db
  .select({
    appointment: appointments,
    customer: customers,
  })
  .from(appointments)
  .innerJoin(customers, eq(appointments.customerId, customers.id))
  .where(gte(appointments.scheduledDate, new Date()));

// Insert with returning
const [newCustomer] = await db
  .insert(customers)
  .values({
    email: "jane@example.com",
    firstName: "Jane",
    lastName: "Doe",
  })
  .returning();
```

### Styling Conventions

**Tailwind CSS Patterns**:
```typescript
// Prefer utility classes over custom CSS
<div className="container mx-auto px-4 py-8">
  <h1 className="text-3xl font-bold text-johnson-blue">Title</h1>
  <button className="bg-johnson-teal hover:bg-johnson-blue text-white px-6 py-3 rounded-lg transition-colors">
    Book Now
  </button>
</div>

// Use clsx for conditional classes
import { clsx } from "clsx";

<div className={clsx(
  "base-class",
  isActive && "active-class",
  hasError && "error-class"
)}>
  Content
</div>
```

**Custom Brand Colors** (defined in `tailwind.config.ts`):
- `johnson-blue`: Primary brand color
- `johnson-teal`: Secondary/accent color
- `johnson-orange`: CTA and urgency
- `emergency-red`: Emergency services
- `service-green`: Success states

### Error Handling

**Frontend Error Boundaries**:
```typescript
// ErrorBoundary component wraps the entire app
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

**API Error Responses**:
```typescript
// Consistent error response format
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE" // Optional
}
```

**Circuit Breaker Pattern** (for HousecallPro API):
- Automatically opens after 5 consecutive failures
- Half-open state after 60 seconds
- Prevents cascading failures

---

## Key Systems

### 1. Capacity Management System

**Location**: `server/src/capacity.ts`

**Purpose**: Calculates real-time technician availability and adjusts messaging/pricing accordingly.

**How It Works**:
1. Fetches booking windows from HousecallPro every 30 seconds
2. Calculates capacity score: `availableWindows / totalPossibleWindows`
3. Determines capacity state based on thresholds:
   - `>= 35%`: SAME_DAY_FEE_WAIVED (promotes same-day with $99 fee waived)
   - `>= 10%`: LIMITED_SAME_DAY (same-day available, standard fee)
   - Has next-day: NEXT_DAY (promotes next-day service)
   - Otherwise: EMERGENCY_ONLY

**Configuration**: `config/capacity.yml`

**Key Functions**:
- `calculateCapacity(date: Date)`: Main calculation logic
- `getCurrentCapacityState()`: Returns current state with UI copy
- `getAvailableTimeSlots(date: Date)`: Returns bookable time windows

**When to Modify**:
- Changing capacity thresholds (requires business approval)
- Adjusting time windows or buffer times
- Adding new technicians

### 2. HousecallPro Integration

**Location**: `server/src/housecall.ts`

**Purpose**: Primary integration with business operations platform.

**Class**: `HousecallProClient`

**Key Methods**:
```typescript
// Customer management
async getCustomers(params): Promise<Customer[]>
async getCustomerById(id: string): Promise<Customer>
async createCustomer(data): Promise<Customer>
async updateCustomer(id: string, data): Promise<Customer>

// Job management
async createJob(data): Promise<Job>
async getJobById(id: string): Promise<Job>
async updateJob(id: string, data): Promise<Job>

// Scheduling
async getBookingWindows(date: Date): Promise<BookingWindow[]>
async getEmployees(): Promise<Employee[]>
```

**Circuit Breaker**:
- State: `closed` | `open` | `half-open`
- Failure threshold: 5 consecutive failures
- Recovery time: 60 seconds
- Automatically retries with exponential backoff (1s, 2s, 4s)

**Rate Limiting**:
- HousecallPro limit: 100 requests/minute
- Client-side throttling implemented
- Requests queued if limit approached

**When to Modify**:
- Adding new HousecallPro API endpoints
- Changing retry logic
- Updating employee mappings

### 3. Booking Flow

**Frontend Components**:
- `BookingModalEnhanced.tsx`: Main booking interface
- `ExpressBooking.tsx`: Capacity-based express booking

**Backend Routes**:
- `POST /api/bookings`: Create new booking
- `POST /api/customers/lookup`: Find existing customer
- `GET /api/capacity/current`: Get current capacity state

**Flow**:
1. User selects service (optional pre-selection)
2. System checks capacity and shows appropriate messaging
3. User selects date/time from available windows
4. User provides contact information
5. System looks up existing customer or creates new one
6. System creates job in HousecallPro
7. System sends notifications
8. Confirmation displayed to user

**Validation**:
- Phone number format validation
- Email format validation
- Service area ZIP code validation
- Duplicate booking prevention

### 4. Webhook Processing

**Location**: `server/src/webhooks.ts`

**Purpose**: Process HousecallPro events for analytics and automation.

**Route**: `POST /api/webhooks`

**Event Types**:
- `job.created`, `job.updated`, `job.completed`, `job.cancelled`
- `customer.created`, `customer.updated`
- `estimate.created`, `estimate.approved`, `estimate.declined`

**Processing**:
1. Verify webhook signature (HMAC)
2. Parse event payload
3. Store in `webhook_events` table
4. Tag event type for categorization
5. Process business logic (update capacity, analytics, etc.)
6. Return 200 OK (HousecallPro requires < 5s response)

**Database Tables**:
- `webhook_events`: Raw event log
- `webhook_event_tags`: Event categorization
- `webhook_processed_data`: Derived data
- `webhook_analytics`: Aggregated metrics

### 5. Google Ads Automation

**Location**: `server/src/ads/bridge.ts`

**Purpose**: Automatically adjust ad spend based on capacity.

**Class**: `GoogleAdsBridge`

**Rules** (defined in `config/capacity.yml`):
```yaml
ads_rules:
  same_day_boost_pct: 50           # +50% budget when high capacity
  limited_same_day_boost_pct: 25   # +25% when moderate capacity
  next_day_cut_pct: 30             # -30% when low capacity
  brand_min_daily: 50              # Never go below $50/day for brand
  never_pause_brand: true          # Brand campaigns always active
```

**Automation**:
- Runs every 5 minutes
- Checks current capacity state
- Adjusts campaign budgets accordingly
- Logs all changes for audit trail
- Respects minimum budgets

**Safety Features**:
- Never pauses brand campaigns
- Minimum daily budgets enforced
- Change history logged
- Manual override capability

### 6. A/B Testing Framework

**Location**: `client/src/contexts/ABTestingContext.tsx`

**Purpose**: Run experiments on UI, copy, and features.

**Database Tables**:
- `ab_tests`: Test definitions
- `ab_test_variants`: Variant configurations
- `ab_test_assignments`: User-to-variant mappings
- `ab_test_events`: Interaction tracking
- `ab_test_metrics`: Performance metrics

**Usage in Components**:
```typescript
import { useABTest } from "@/hooks/use-abtest";

function MyComponent() {
  const { variant, trackEvent } = useABTest("test-id");

  const handleClick = () => {
    trackEvent("button_click", { variant });
    // ... action
  };

  return (
    <button onClick={handleClick}>
      {variant === "control" ? "Book Now" : "Schedule Service"}
    </button>
  );
}
```

**API Endpoints**:
- `GET /api/abtest/assignment`: Get user's variant
- `POST /api/abtest/event`: Track event
- `GET /api/abtest/results`: View test results (admin)

### 7. Blog & SEO System

**Location**: `client/src/pages/blog*.tsx`, `server/src/blogRoutes.ts`

**Purpose**: Content marketing and organic traffic acquisition.

**Database Tables**:
- `blog_posts`: Post content
- `keywords`: SEO keywords
- `post_keywords`: Many-to-many relationship
- `keyword_rankings`: Ranking tracking
- `blog_analytics`: Performance metrics

**Features**:
- Markdown content support (`react-markdown`)
- Keyword density optimization
- Meta tags and structured data
- Automatic sitemap generation
- Reading time calculation
- Related posts

**Admin Functions**:
- Create/edit posts
- Keyword management
- Analytics dashboard
- SEO optimization suggestions

### 8. MCP Server Integration

**Location**: `server/src/mcp/`

**Purpose**: Enable AI assistants (Claude, ChatGPT, etc.) to book services.

**Endpoints**:
- `GET /api/mcp/manifest`: Server capabilities
- `GET /api/mcp/docs`: Documentation

**Available MCP Tools**:
1. `book_service_call`: Complete booking workflow
2. `search_availability`: Check real-time availability
3. `lookup_customer`: Find existing customers
4. `create_customer`: Add new customers
5. `get_services`: List services and pricing
6. `get_capacity`: Current capacity status

**Discovery**:
- MCP manifest served at `/.well-known/mcp.json`
- HTTP Link header for AI discovery
- Hidden AI-readable content in HTML for context

---

## Database Patterns

### Schema Organization

**Location**: `shared/schema.ts` (1524 lines, 45+ tables)

**Key Table Groups**:

1. **Core Business**:
   - `customers`, `customer_addresses`, `appointments`
   - `job_locations`, `check_ins`, `service_areas`

2. **Analytics & Tracking**:
   - `conversion_funnels`, `conversion_events`, `micro_conversions`
   - `attribution_data`, `leads`, `website_analytics`

3. **A/B Testing**:
   - `ab_tests`, `ab_test_variants`, `ab_test_assignments`
   - `ab_test_events`, `ab_test_metrics`

4. **Content Management**:
   - `blog_posts`, `keywords`, `post_keywords`
   - `keyword_rankings`, `blog_analytics`

5. **Webhooks**:
   - `webhook_events`, `webhook_event_tags`
   - `webhook_processed_data`, `webhook_subscriptions`

6. **Admin & Auth**:
   - `admin_users`, `admin_sessions`, `admin_permissions`
   - `admin_activity_logs`, `admin_tasks`, `admin_documents`

### Index Strategy

**Performance-Critical Indexes**:
```typescript
// Example from schema.ts
export const customers = pgTable('customers', {
  // ... columns
}, (table) => ({
  emailIdx: index('email_idx').on(table.email),
  phoneIdx: index('phone_idx').on(table.phone),
  createdAtIdx: index('created_at_idx').on(table.createdAt),
}));
```

**Common Index Patterns**:
- Foreign keys always indexed
- Timestamp fields for date range queries
- Email/phone for customer lookup
- Composite indexes for complex queries

### Migration Workflow

```bash
# 1. Modify schema in shared/schema.ts
# 2. Push changes to database
npm run db:push

# 3. For production with existing data
npm run db:push --force  # Use with caution
```

**Schema Change Best Practices**:
- Always add new columns as nullable initially
- Use `defaultValue()` for non-nullable additions
- Test migrations on staging first
- Backup production data before major changes
- Update Zod schemas after schema changes

### Validation Patterns

**Drizzle-Zod Integration**:
```typescript
import { createInsertSchema } from 'drizzle-zod';
import { customers } from '@shared/schema';

// Auto-generate Zod schema from Drizzle table
export const insertCustomerSchema = createInsertSchema(customers, {
  email: z.string().email(),
  phone: z.string().regex(/^\(\d{3}\) \d{3}-\d{4}$/),
});

// Use in API routes
const validatedData = insertCustomerSchema.parse(req.body);
```

---

## API Architecture

### Rate Limiting Strategy

**Configuration** (`server/src/security.ts`):

```typescript
// Public read endpoints
rateLimit({ windowMs: 15 * 60 * 1000, max: 100 })  // 100 req/15min

// Write endpoints (bookings, leads)
rateLimit({ windowMs: 15 * 60 * 1000, max: 10 })   // 10 req/15min

// Customer lookup (PII protection)
rateLimit({ windowMs: 15 * 60 * 1000, max: 5 })    // 5 req/15min

// Admin operations
rateLimit({ windowMs: 15 * 60 * 1000, max: 20 })   // 20 req/15min

// Webhooks (high volume)
rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 }) // 1000 req/15min
```

### API Response Formats

**Success Response**:
```json
{
  "success": true,
  "data": { /* payload */ }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE" // optional
}
```

**Paginated Response**:
```json
{
  "success": true,
  "data": [ /* items */ ],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Caching Strategy

**Cache Durations**:
- Capacity data: 30 seconds (high volatility)
- Google reviews: 5 minutes (external API)
- Service list: 1 hour (rarely changes)
- Blog posts: 24 hours client-side (static content)
- Static assets: 1 year with versioning

**Implementation**:
```typescript
// In-memory cache with TTL
const cache = new Map<string, { data: any; expires: number }>();

function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.data as T;
  }
  cache.delete(key);
  return null;
}

function setCache<T>(key: string, data: T, ttlSeconds: number): void {
  cache.set(key, {
    data,
    expires: Date.now() + ttlSeconds * 1000,
  });
}
```

### Security Middleware

**CSRF Protection**:
- Enabled for all state-changing operations
- Exemptions: Webhooks (signature validation), pre-auth endpoints
- Token endpoint: `GET /api/csrf-token`

**CORS Configuration**:
- Allows specific origins (configurable via env)
- Credentials enabled for session cookies
- Preflight cache: 24 hours

**Helmet Security Headers**:
- Content Security Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

### Public API Endpoints

**Booking & Customers**:
- `POST /api/bookings` - Create booking
- `POST /api/customers/lookup` - Find customer by phone/email
- `GET /api/services` - List services
- `POST /api/check-service-area` - Validate ZIP code

**Capacity & Availability**:
- `GET /api/capacity/current` - Current capacity state
- `GET /api/capacity/state` - Detailed capacity info
- `GET /api/capacity/time-slots/:date` - Available time slots

**Social Proof**:
- `GET /api/reviews` - Google reviews
- `GET /api/social-proof/stats` - Business statistics
- `GET /api/social-proof/recent-jobs` - Recent completions

**Content**:
- `GET /api/blog` - List blog posts
- `GET /api/blog/:slug` - Get specific post
- `GET /api/blog/keywords` - SEO keywords

**Analytics**:
- `POST /api/conversion/event` - Track conversion
- `POST /api/conversion/micro` - Track micro-conversion
- `GET /api/abtest/assignment` - Get A/B test variant

### Admin API Endpoints

**Authentication Required** (`/api/admin/*`):
- `POST /api/admin/auth/login` - Admin login
- `POST /api/admin/auth/logout` - Admin logout
- `GET /api/admin/dashboard` - Dashboard data
- `GET /api/admin/heatmap` - Service heat map
- `GET /api/admin/webhooks` - Webhook monitoring
- `POST /api/admin/experiments` - A/B test management

---

## Frontend Patterns

### Routing with Wouter

**Pattern**: File-based routes defined in `App.tsx`

```typescript
import { Switch, Route } from "wouter";

<Switch>
  <Route path="/" component={Home} />
  <Route path="/services/:slug" component={ServicePage} />
  <Route path="/blog/:slug" component={BlogPost} />
  <Route component={NotFound} />
</Switch>
```

**Route Parameters**:
```typescript
import { useRoute } from "wouter";

function BlogPost() {
  const [match, params] = useRoute("/blog/:slug");
  const slug = params?.slug; // Type-safe access

  // Fetch post based on slug
}
```

**Navigation**:
```typescript
import { useLocation } from "wouter";

function MyComponent() {
  const [, setLocation] = useLocation();

  const handleClick = () => {
    setLocation("/services/drain-cleaning");
  };
}
```

### Data Fetching with React Query

**Standard Pattern**:
```typescript
import { useQuery } from "@tanstack/react-query";

function MyComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const res = await fetch("/api/services");
      if (!res.ok) throw new Error("Failed to fetch services");
      return res.json();
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    cacheTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{/* Render data */}</div>;
}
```

**Mutations**:
```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";

function BookingForm() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data) => {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Booking failed");
      return res.json();
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["capacity"] });
    },
  });

  const handleSubmit = (data) => {
    mutation.mutate(data);
  };
}
```

### Form Handling

**React Hook Form + Zod**:
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const FormSchema = z.object({
  firstName: z.string().min(2, "First name required"),
  email: z.string().email("Invalid email"),
  phone: z.string().regex(/^\(\d{3}\) \d{3}-\d{4}$/, "Invalid phone"),
});

type FormData = z.infer<typeof FormSchema>;

function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(FormSchema),
  });

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("firstName")} />
      {errors.firstName && <span>{errors.firstName.message}</span>}

      <input {...register("email")} />
      {errors.email && <span>{errors.email.message}</span>}

      <button type="submit">Submit</button>
    </form>
  );
}
```

### Lazy Loading Components

**Route-Based Code Splitting**:
```typescript
import { lazy, Suspense } from "react";

const VideoCallPopup = lazy(() =>
  import("@/components/VideoCallPopup").then(m => ({ default: m.VideoCallPopup }))
);

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VideoCallPopup />
    </Suspense>
  );
}
```

### SEO Management

**Using React Helmet**:
```typescript
import { Helmet } from "react-helmet-async";

function DrainCleaningPage() {
  return (
    <>
      <Helmet>
        <title>Drain Cleaning Services | Johnson Bros. Plumbing</title>
        <meta name="description" content="Professional drain cleaning..." />
        <meta property="og:title" content="Drain Cleaning Services" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://johnsonbrosplumbing.com/services/drain-cleaning" />
      </Helmet>

      {/* Page content */}
    </>
  );
}
```

### Mobile Optimization

**Mobile Detection Hook**:
```typescript
import { useIsMobile } from "@/hooks/use-mobile";

function MyComponent() {
  const isMobile = useIsMobile();

  return (
    <div className={isMobile ? "mobile-layout" : "desktop-layout"}>
      {isMobile ? <MobileNav /> : <DesktopNav />}
    </div>
  );
}
```

**Mobile-Specific Components**:
- `MobileBottomNav`: Fixed bottom navigation
- `MobileServiceCard`: Optimized service cards
- Touch gesture support via `use-swipe.tsx` hook

---

## Common Tasks

### Adding a New Service

1. **Add service to HousecallPro** (external system)
2. **Update frontend display**:
   ```typescript
   // client/src/pages/services/new-service.tsx
   import ServicePageTemplate from "@/components/ServicePageTemplate";

   export default function NewService() {
     return (
       <ServicePageTemplate
         title="New Service"
         description="Description of the new service"
         icon="wrench"
         price="$199"
       />
     );
   }
   ```
3. **Add route in App.tsx**:
   ```typescript
   import NewService from "@/pages/services/new-service";

   <Route path="/services/new-service" component={NewService} />
   ```
4. **Update ServicesSection component** to display the new service

### Creating a New API Endpoint

1. **Create route handler**:
   ```typescript
   // server/src/myRoutes.ts
   import { Router } from "express";
   import { z } from "zod";

   const router = Router();

   const MySchema = z.object({
     field: z.string(),
   });

   router.post("/api/my-endpoint", async (req, res) => {
     try {
       const data = MySchema.parse(req.body);
       // Business logic
       res.json({ success: true, data: result });
     } catch (error) {
       res.status(400).json({ success: false, error: error.message });
     }
   });

   export default router;
   ```

2. **Register route in `server/routes.ts`**:
   ```typescript
   import myRoutes from "./src/myRoutes";

   export function registerRoutes(app: Express) {
     // ... existing routes
     app.use(myRoutes);
   }
   ```

3. **Add rate limiting if needed** (in route handler or security.ts)

### Adding a Database Table

1. **Define schema in `shared/schema.ts`**:
   ```typescript
   export const myNewTable = pgTable('my_new_table', {
     id: serial('id').primaryKey(),
     name: text('name').notNull(),
     createdAt: timestamp('created_at').defaultNow().notNull(),
   }, (table) => ({
     nameIdx: index('name_idx').on(table.name),
   }));

   // Create insert schema
   export const insertMyNewTableSchema = createInsertSchema(myNewTable);
   ```

2. **Push to database**:
   ```bash
   npm run db:push
   ```

3. **Use in queries**:
   ```typescript
   import { db } from "@/db";
   import { myNewTable } from "@shared/schema";

   const results = await db.select().from(myNewTable);
   ```

### Creating a Landing Page

1. **Create page component**:
   ```typescript
   // client/src/pages/landing/my-campaign.tsx
   import { Helmet } from "react-helmet-async";
   import Header from "@/components/Header";
   import Footer from "@/components/Footer";

   export default function MyCampaignLanding() {
     return (
       <>
         <Helmet>
           <title>Special Offer | Johnson Bros.</title>
           <meta name="description" content="..." />
         </Helmet>

         <Header />
         <main>
           {/* Landing page content */}
         </main>
         <Footer />
       </>
     );
   }
   ```

2. **Add route**:
   ```typescript
   // App.tsx
   import MyCampaignLanding from "@/pages/landing/my-campaign";

   <Route path="/landing/my-campaign" component={MyCampaignLanding} />
   ```

3. **Configure A/B test if needed** (see A/B Testing section)

### Modifying Capacity Thresholds

**IMPORTANT**: Requires business approval before changing.

1. **Edit `config/capacity.yml`**:
   ```yaml
   thresholds:
     same_day_fee_waived: 0.40  # Changed from 0.35
     limited_same_day: 0.15     # Changed from 0.10
   ```

2. **Test in development**:
   ```bash
   npm run dev
   # Monitor capacity calculations in logs
   ```

3. **Deploy carefully** - these changes affect pricing and UI

### Adding a New Technician

1. **Add to HousecallPro** (external system - get employee ID)

2. **Update `config/capacity.yml`**:
   ```yaml
   tech_map:
     nate: "pro_19f45ddb23864f13ba5ffb20710e77e8"
     nick: "pro_784bb427ee27422f892b2db87dbdaf03"
     jahz: "pro_b0a7d40a10dc4477908cc808f62054ff"
     newtech: "pro_NEW_EMPLOYEE_ID_HERE"  # Add new tech
   ```

3. **Update capacity calculation** if priority order matters:
   ```typescript
   // server/src/capacity.ts
   const techPriority = ['nate', 'nick', 'newtech', 'jahz'];
   ```

### Debugging Issues

**Backend Debugging**:
```bash
# Check server logs
tail -f logs/application.log

# Watch capacity calculations
grep "Capacity" logs/application.log

# Monitor API requests
grep "POST /api/bookings" logs/application.log
```

**Frontend Debugging**:
- Open browser DevTools Console
- Check Network tab for failed requests
- Use React DevTools to inspect component state
- Look for errors in ErrorBoundary

**Database Debugging**:
```typescript
// Enable query logging in development
import { drizzle } from 'drizzle-orm/neon-http';
const db = drizzle(sql, { logger: true });
```

---

## Important Files Reference

### Configuration Files

| File | Purpose | When to Modify |
|------|---------|----------------|
| `config/capacity.yml` | Business logic, thresholds, tech mapping | Changing capacity rules, adding techs |
| `package.json` | Dependencies, scripts | Adding new packages |
| `tsconfig.json` | TypeScript config, path aliases | Rarely - established patterns |
| `vite.config.ts` | Build configuration | Rarely - core setup |
| `tailwind.config.ts` | Styling theme, colors | Adding brand colors, fonts |
| `drizzle.config.ts` | Database ORM config | Rarely - connection setup |
| `.env` | Environment variables | Adding API keys, secrets |

### Core Application Files

| File | Purpose | Lines | Modify Frequency |
|------|---------|-------|------------------|
| `shared/schema.ts` | Database schema | 1524 | Medium - adding tables |
| `server/index.ts` | Server entry point | ~200 | Low - core setup |
| `server/routes.ts` | API route registration | ~300 | Medium - new routes |
| `server/src/housecall.ts` | HousecallPro client | ~800 | Low - stable integration |
| `server/src/capacity.ts` | Capacity calculator | ~500 | Medium - business logic |
| `client/src/App.tsx` | Frontend entry, routing | 232 | High - adding pages |
| `client/src/main.tsx` | React initialization | 15 | Low - core setup |

### Key Components

| Component | Purpose | Complexity |
|-----------|---------|------------|
| `BookingModalEnhanced.tsx` | Main booking interface | High |
| `ExpressBooking.tsx` | Capacity-based express booking | High |
| `Header.tsx` | Site navigation | Medium |
| `Footer.tsx` | Site footer with links | Low |
| `ServiceHeatMap.tsx` | Google Maps integration | Medium |
| `GoogleReviewsSection.tsx` | Reviews display | Medium |
| `StatsWidget.tsx` | Social proof statistics | Low |
| `ChatWidget.tsx` | AI chat interface | Medium |

### Business Logic Files

| File | Purpose | Change Risk |
|------|---------|-------------|
| `server/src/capacity.ts` | Capacity calculations | HIGH - affects pricing |
| `server/src/housecall.ts` | HousecallPro API | MEDIUM - stable but critical |
| `server/src/webhooks.ts` | Event processing | MEDIUM - affects analytics |
| `server/src/ads/bridge.ts` | Google Ads automation | HIGH - affects ad spend |
| `config/capacity.yml` | Business rules | HIGH - requires approval |

---

## Do's and Don'ts

### ✅ DO

**Code Quality**:
- ✅ Use TypeScript strict mode - no `any` types
- ✅ Validate all user input with Zod schemas
- ✅ Handle errors gracefully with try/catch
- ✅ Add loading and error states to UI components
- ✅ Use React Query for all server state
- ✅ Follow existing naming conventions
- ✅ Add indexes to new database columns if queried frequently

**Security**:
- ✅ Validate environment variables on startup
- ✅ Use parameterized queries (Drizzle ORM does this automatically)
- ✅ Apply rate limiting to new endpoints
- ✅ Verify webhook signatures
- ✅ Sanitize user input before display
- ✅ Use HTTPS in production

**Performance**:
- ✅ Cache frequently accessed data with appropriate TTL
- ✅ Lazy load non-critical components
- ✅ Use database indexes for common queries
- ✅ Implement pagination for large datasets
- ✅ Optimize images (WebP with fallbacks)
- ✅ Code split by route

**Development**:
- ✅ Test in development before pushing
- ✅ Check TypeScript compilation (`npm run check`)
- ✅ Verify API endpoints with curl or Postman
- ✅ Read existing code patterns before implementing
- ✅ Ask for clarification on business logic changes
- ✅ Document complex business rules

### ❌ DON'T

**Critical - Never Do These**:
- ❌ NEVER commit `.env` file or secrets to git
- ❌ NEVER modify `config/capacity.yml` without business approval
- ❌ NEVER disable CSRF protection
- ❌ NEVER bypass rate limiting
- ❌ NEVER expose PII in logs or error messages
- ❌ NEVER use `--force` flag on production database
- ❌ NEVER commit directly to main branch

**Code Quality**:
- ❌ Don't use `any` type - use `unknown` and type guards
- ❌ Don't ignore TypeScript errors
- ❌ Don't create duplicate components - reuse existing
- ❌ Don't add dependencies without checking bundle size
- ❌ Don't write inline styles - use Tailwind classes
- ❌ Don't skip error handling

**Architecture**:
- ❌ Don't put business logic in components - use services
- ❌ Don't bypass Drizzle ORM with raw SQL (unless necessary)
- ❌ Don't create new database tables without schema definition
- ❌ Don't hardcode configuration - use `capacity.yml` or env vars
- ❌ Don't duplicate data - normalize properly
- ❌ Don't create circular dependencies

**Performance**:
- ❌ Don't fetch data in loops - use batch queries
- ❌ Don't skip pagination for large datasets
- ❌ Don't load all data upfront - lazy load
- ❌ Don't make synchronous API calls in loops
- ❌ Don't forget to add loading states

**HousecallPro Integration**:
- ❌ Don't exceed rate limits (100 req/min)
- ❌ Don't retry failed requests indefinitely
- ❌ Don't assume API responses are always successful
- ❌ Don't modify customer data without verification
- ❌ Don't create duplicate customers

### 🟡 Proceed with Caution

**Requires Testing**:
- 🟡 Changing capacity calculation thresholds
- 🟡 Modifying Google Ads automation rules
- 🟡 Updating webhook processing logic
- 🟡 Changing database schema with existing data
- 🟡 Modifying rate limiting rules

**Requires Approval**:
- 🟡 Changing pricing or fee structures
- 🟡 Modifying service areas or ZIP codes
- 🟡 Updating technician priority order
- 🟡 Adding new external integrations
- 🟡 Changes affecting ad spend

---

## Git Workflow

### Branch Naming Convention

Based on recent commits, the pattern is:
```
claude/[feature-description]-[session-id]
```

Examples from git history:
- `claude/add-claude-documentation-wsrw5`
- Feature branches auto-generated by system

### Commit Message Patterns

From git log analysis:
```
# Feature additions
Add [feature description]
Add new [component/feature] for [purpose]

# Updates/Improvements
Update [component] to [improvement]
Improve [feature] and [additional change]

# Fixes
Fix [issue description]

# Transitions (automated)
Transitioned from Plan to Build mode
Saved progress at the end of the loop
```

**Good Commit Messages**:
```bash
Add emergency service badge and improve time slot formatting
Fix incorrect time display in booking schedule
Integrate AI chatbot for website, SMS, and voice call interactions
Update the company logo displayed in the chat widget interface
```

**Avoid**:
```bash
# Too vague
ok
update stuff
fix bug

# Too long/detailed (save for PR description)
Added a new feature that allows users to track their usage metrics...
```

### Development Workflow

1. **Create Feature Branch**:
   ```bash
   # Branch created automatically by system
   # Format: claude/[feature]-[session-id]
   ```

2. **Make Changes**:
   ```bash
   # Edit files
   # Test locally with: npm run dev
   # Verify types: npm run check
   ```

3. **Commit Changes**:
   ```bash
   git add .
   git commit -m "Add feature description"
   ```

4. **Push to Branch**:
   ```bash
   git push -u origin claude/feature-name-xxxxx
   ```

5. **Create Pull Request** (if applicable):
   ```bash
   # Via GitHub UI or gh CLI
   gh pr create --title "Feature: Description" --body "Details..."
   ```

### Git Best Practices

**DO**:
- ✅ Write clear, descriptive commit messages
- ✅ Commit logical units of work
- ✅ Test before committing
- ✅ Push to feature branch
- ✅ Keep commits focused

**DON'T**:
- ❌ Commit secrets or `.env` files
- ❌ Commit `node_modules/` or `dist/`
- ❌ Force push to shared branches
- ❌ Commit broken code
- ❌ Mix multiple features in one commit

### Files to Ignore

Already configured in `.gitignore`:
```
node_modules/
dist/
build/
.env
.env.local
logs/
*.log
.DS_Store
```

---

## Testing & Validation

### Current Testing State

**No formal testing framework is configured.** The project relies on:
- TypeScript type checking (`npm run check`)
- Zod runtime validation
- Manual testing in development
- Browser DevTools

### Pre-Deployment Checklist

Before considering work complete:

**Build & Compile**:
- [ ] `npm run check` passes without errors
- [ ] `npm run build` completes successfully
- [ ] No TypeScript errors in console
- [ ] No browser console errors

**Functionality**:
- [ ] Application starts without errors (`npm run dev`)
- [ ] Booking modal opens and closes
- [ ] Capacity state displays correctly
- [ ] API endpoints respond as expected
- [ ] Forms validate properly
- [ ] Error states display correctly

**Integration Points**:
- [ ] HousecallPro API responds (if testing that flow)
- [ ] Google Maps loads (if modified)
- [ ] Database queries execute successfully
- [ ] Webhooks process correctly (if modified)

**UI/UX**:
- [ ] Responsive design works on mobile
- [ ] No layout shifts or broken styles
- [ ] Loading states display
- [ ] Error messages are user-friendly
- [ ] Navigation works correctly

**Security**:
- [ ] No secrets in code or commits
- [ ] Input validation working
- [ ] Rate limiting applied to new endpoints
- [ ] CSRF protection not bypassed
- [ ] No PII in logs

### Manual Testing Workflow

```bash
# 1. Start development server
npm run dev

# 2. Open browser to http://localhost:5000

# 3. Test booking flow:
#    - Click "Book Now"
#    - Select service
#    - Choose date/time
#    - Fill customer info
#    - Submit booking

# 4. Check browser console for errors

# 5. Test API endpoints with curl:
curl http://localhost:5000/api/capacity/current
curl http://localhost:5000/api/services

# 6. Check server logs:
tail -f logs/application.log
```

### Validation Commands

```bash
# Type check
npm run check

# Build test
npm run build

# Database schema check
npm run db:push --dry-run

# Lint (if configured)
# Currently not configured - rely on TypeScript strict mode
```

---

## Additional Resources

### External Documentation

- **React**: https://react.dev/
- **TypeScript**: https://www.typescriptlang.org/docs/
- **Vite**: https://vitejs.dev/guide/
- **Drizzle ORM**: https://orm.drizzle.team/docs/overview
- **TanStack Query**: https://tanstack.com/query/latest
- **Tailwind CSS**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com/
- **Wouter**: https://github.com/molefrog/wouter
- **React Hook Form**: https://react-hook-form.com/
- **Zod**: https://zod.dev/

### Internal Documentation

- `WEBSITE_DOCUMENTATION.md` - Comprehensive business logic and system architecture
- `DEPLOYMENT.md` - Deployment procedures
- `PRODUCTION_READINESS_CHECKLIST.md` - Go-live checklist
- `MCP_SETUP.md` - MCP server integration
- `.env.example` - Environment variables reference

### Getting Help

**When Stuck**:
1. Check existing similar implementations in codebase
2. Review relevant internal documentation
3. Check external library documentation
4. Test in development environment
5. Ask for clarification on business logic

**Common Issues**:
- **Build errors**: Check `tsconfig.json` paths and imports
- **API errors**: Verify environment variables are set
- **Database errors**: Check schema matches `shared/schema.ts`
- **HousecallPro errors**: Check API key and rate limits
- **Styling issues**: Verify Tailwind classes, check for typos

---

## Summary

This codebase is a **production-grade, enterprise-level application** with:
- ✅ Type-safe TypeScript throughout
- ✅ Modern React patterns (hooks, context, query)
- ✅ Robust error handling and monitoring
- ✅ Security best practices
- ✅ Performance optimizations
- ✅ Comprehensive integrations (HousecallPro, Google Maps, Ads, MCP)
- ✅ Business logic externalized to configuration files
- ✅ Scalable architecture

**Key Principles**:
1. **Type Safety**: Everything is typed, validated, and checked
2. **User-Centric**: Fast, responsive, mobile-optimized
3. **Business-Driven**: Capacity calculations drive messaging and pricing
4. **Integration-Heavy**: HousecallPro is the source of truth
5. **Data-Informed**: Analytics, A/B testing, conversion tracking
6. **AI-Ready**: Native MCP server for AI assistant integration

When making changes:
- Follow established patterns
- Maintain type safety
- Test thoroughly
- Consider business impact
- Document complex logic

**This is a well-architected codebase. Respect its patterns and conventions.**

---

**Last Updated**: 2026-01-05
**Codebase Version**: Production (commit: b2a86b4)
**Primary Branch**: `claude/add-claude-documentation-wsrw5`
