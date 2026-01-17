# Johnson Bros. Plumbing Platform - Complete Analysis

**Date**: 2026-01-16
**Repository**: /home/corey/projects/JohnsonBros
**Type**: Full-Stack Web Application (Monorepo)
**Domain**: Plumbing & Drain Cleaning Business Platform

---

## Executive Summary

Johnson Bros. Plumbing & Drain Cleaning is a **family-owned plumbing business** serving Quincy, MA and surrounding areas (Norfolk, Suffolk, Plymouth Counties) since 1997. This is their complete digital platform handling:

- Customer acquisition & booking optimization
- Real-time capacity monitoring that drives all business decisions
- Multi-channel AI booking agents (web, SMS, voice, external AI)
- Unified customer identity across all channels
- Deep HousecallPro integration for operations

**This is not a template or demo—it's a production business platform.**

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [Directory Structure](#3-directory-structure)
4. [Core Business Logic](#4-core-business-logic)
5. [Features (Complete List)](#5-features-complete-list)
6. [Database Schema](#6-database-schema)
7. [Key Files Reference](#7-key-files-reference)
8. [Special Patterns](#8-special-patterns)
9. [External Integrations](#9-external-integrations)
10. [Deployment & Infrastructure](#10-deployment--infrastructure)

---

## 1. Architecture Overview

### Dual-Server Architecture

The application runs **two separate servers**:

| Server | Port | Purpose | Entry Point |
|--------|------|---------|-------------|
| **Main Web Server** | 5000 | Express + Vite app | `server/index.ts` |
| **MCP Server** | 3001 | AI Assistant integration (JSON-RPC) | `src/mcp-http-server.ts` |

Both start with `npm run dev`. MCP server runs as child process.

### Communication Flow

```
┌──────────────────────────────┐
│   External AI Assistants     │  (ChatGPT, Claude, etc.)
├──────────────────────────────┤
         ↓ HTTP (JSON-RPC)
┌──────────────────────────────┐
│   MCP Server (port 3001)     │  src/booker.ts (13+ tools)
├──────────────────────────────┤
         ↓ internal API
┌──────────────────────────────┐
│ Main Website (port 5000)     │
│  ├─ API Routes               │
│  ├─ Voice AI (Realtime)      │
│  └─ SMS Agent                │
├──────────────────────────────┤
         ↓
┌──────────────────────────────┐
│    HousecallPro API          │
└──────────────────────────────┘
```

---

## 2. Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.3 | UI framework |
| TypeScript | 5.6.3 | Type safety |
| Vite | 5.4.19 | Build tool & HMR |
| Wouter | 3.3.5 | Client-side routing |
| TanStack Query | 5.60.5 | Server state management |
| Zustand | latest | Client state |
| Radix UI | various | Accessible primitives |
| Tailwind CSS | 4.1.18 | Styling |
| Framer Motion | 11.13.1 | Animations |
| React Hook Form | 7.55.0 | Form handling |
| Zod | 3.24.2 | Schema validation |
| Recharts | 2.15.2 | Data visualization |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime |
| Express | 4.21.2 | Web framework |
| Drizzle ORM | 0.39.1 | Type-safe database ORM |
| PostgreSQL | Neon | Primary database |
| Passport.js | 0.7.0 | Authentication |
| Pino | 9.9.0 | Structured logging |
| Winston | 3.18.3 | File logging |
| Express Rate Limit | 8.0.1 | Rate limiting |
| Helmet | 8.1.0 | Security headers |
| csurf | 1.11.0 | CSRF protection |

### AI & Integrations

| Technology | Version | Purpose |
|------------|---------|---------|
| @modelcontextprotocol/sdk | 1.17.4 | MCP server |
| OpenAI SDK | 6.15.0 | AI chat & agents |
| openai-agents | 1.1.0 | Agent framework |
| Twilio | 5.3.2 | SMS & voice |
| Google Maps API | - | Maps & geocoding |
| HousecallPro API | - | Business operations |
| Sentry | 10.20.0 | Error tracking |

### Build Tools

| Technology | Version | Purpose |
|------------|---------|---------|
| esbuild | 0.25.0 | Server bundler |
| Vitest | 2.1.9 | Unit testing |
| Playwright | 1.57.0 | E2E testing |
| Drizzle-Kit | 0.30.4 | DB migrations |

---

## 3. Directory Structure

```
/home/corey/projects/JohnsonBros/
├── client/                          # React frontend
│   ├── src/
│   │   ├── components/              # 100+ UI components
│   │   ├── pages/                   # 65+ route pages
│   │   ├── hooks/                   # React hooks
│   │   ├── lib/                     # Client utilities
│   │   ├── stores/                  # Zustand state
│   │   └── contexts/                # React contexts
│   └── public/                      # Static assets
│
├── server/                          # Express backend
│   ├── routes.ts                    # Main API routes (4,225 lines)
│   ├── lib/                         # Core services
│   │   ├── sharedThread.ts          # Multi-channel identity
│   │   ├── smsBookingAgent.ts       # SMS AI agent
│   │   ├── realtimeVoice.ts         # Voice AI
│   │   ├── aiChat.ts                # Web chat AI
│   │   └── mcpClient.ts             # Internal MCP client
│   ├── src/                         # Business logic
│   │   ├── capacity.ts              # Capacity calculations
│   │   ├── housecall.ts             # HousecallPro client
│   │   ├── adminRoutes.ts           # Admin API
│   │   ├── webhooks.ts              # Webhook processing
│   │   ├── auth.ts                  # Authentication
│   │   └── heatmap.ts               # Service area maps
│   └── tests/                       # Server tests
│
├── shared/                          # Shared types & schemas
│   ├── schema.ts                    # Drizzle ORM schema
│   └── unified-cards/               # Embeddable components
│
├── src/                             # MCP Server
│   ├── booker.ts                    # MCP tools (~3,500 lines)
│   ├── mcp-http-server.ts           # HTTP server
│   └── widgets/                     # Embeddable widgets
│
├── config/
│   └── capacity.yml                 # Business rules & thresholds
│
├── migrations/                      # Database migrations
├── e2e/                             # E2E tests (Playwright)
└── .context/                        # Project continuity (Beacon)
```

### Path Aliases

```typescript
@/*                           → client/src/*
@shared/*                     → shared/*
@johnsonbros/unified-cards    → shared/unified-cards/
```

---

## 4. Core Business Logic

### Capacity-Based Dynamic System

**The entire platform behavior is driven by real-time technician availability.**

#### Four Capacity States

| State | Threshold | Behavior |
|-------|-----------|----------|
| `SAME_DAY_FEE_WAIVED` | ≥35% | High urgency messaging, fee waived |
| `LIMITED_SAME_DAY` | ≥10% | Standard same-day service |
| `NEXT_DAY` | <10% | Next-day guarantee |
| `EMERGENCY_ONLY` | 0% | Emergency services only |

#### What Capacity Affects

- UI messaging, headlines, CTAs
- Google Ads campaign budgets
- Booking availability display
- Pricing and fee waivers
- Express booking eligibility

#### Calculation Location

- `server/src/capacity.ts` (~500 lines)
- `config/capacity.yml` (thresholds, zones, UI copy)

### HousecallPro Integration

**The source of truth for all business data.**

- Customers, jobs, estimates, invoices
- Technician schedules and availability
- Real-time webhook updates
- Circuit breaker pattern for resilience

Location: `server/src/housecall.ts` (~800 lines)

### Multi-Channel Identity (Shared Thread)

**Unified customer recognition across all channels.**

```
Web User         →  web_user_id (localStorage)
SMS User         →  phone number (E.164)
Voice User       →  phone number
External AI      →  session-based

All linked via OTP verification
```

Location: `server/lib/sharedThread.ts` (~500 lines)

---

## 5. Features (Complete List)

### Customer-Facing Features

#### Booking System
- Express booking with real-time availability
- Multi-step booking modal (service → date/time → info → confirm)
- Smart customer handling (new vs. returning)
- Phone/email lookup to prevent duplicates
- Dynamic fee waiving based on capacity
- Appointment confirmations (email & SMS)

#### Dynamic Messaging
- Headlines/CTAs change with capacity state
- Urgency indicators and badges
- Express time window display
- Real-time availability updates

#### Service Features
- Service directory with descriptions
- Service area coverage maps (Google Maps)
- Service heat maps (completed job visualization)
- Dynamic pricing by time/complexity
- Categories: emergency, maintenance, installation, inspection

#### Social Proof
- Google Reviews integration
- Live activity feed (anonymized recent jobs)
- Service statistics (jobs, customers, areas)
- Customer testimonials and video reviews
- Trust badges (licensed, insured, certified)

#### Multi-Channel Booking
- Web booking (direct)
- SMS booking agent (Twilio + AI)
- Voice AI booking (OpenAI Realtime)
- External AI integration (ChatGPT, Claude via MCP)
- Referral program

#### Content & SEO
- Blog system with full CMS
- SEO keyword tracking
- Dynamic meta tags
- JSON-LD structured data
- 50+ service landing pages
- Dynamic XML sitemaps

#### Additional
- Contact form with campaign tracking
- Time slot preferences
- Unit/apartment support
- Service notes (describe issue)
- Customer portal (view past jobs, reschedule)
- Family discount program
- Referral tracking

### Admin Features

#### Dashboard & Analytics
- Real-time statistics (revenue, jobs, conversions)
- Capacity gauge visualization
- Live job board
- Technician status tracking
- Revenue tracking from HousecallPro
- Performance metrics
- Customizable widget dashboard

#### Business Management
- A/B testing platform with statistical analysis
- User management (RBAC: super_admin, admin, tech, staff)
- Activity audit logging
- Webhook monitoring
- Job management

#### Capacity Management
- Manual capacity override
- Technician assignment
- Booking window configuration
- Service area management (ZIP codes)
- Promotional management

#### Marketing
- Google Ads integration (budget, bidding)
- Conversion tracking
- Lead management
- Campaign attribution
- Google Analytics integration

#### Content Management
- Blog CRUD with featured images
- Categories & tags
- Publishing workflow (draft → review → published)
- SEO metadata per post

#### Advanced Analytics
- Conversion funnel analysis
- Micro-conversion tracking
- Heat map generation
- Revenue breakdown by service/area/tech
- Customer acquisition cost by channel

### API Capabilities

#### Public API
```
POST /api/book              # Create appointment
GET  /api/availability      # Check time slots
GET  /api/services          # Service list
POST /api/customers/search  # Find customers
GET  /api/capacity          # Current capacity
```

#### Admin API
```
GET  /api/admin/stats       # Business statistics
POST /api/admin/capacity    # Override capacity
*    /api/admin/experiments # A/B testing
*    /api/admin/blog        # Blog management
GET  /api/admin/jobs        # Job list
```

#### Webhook API
```
POST /api/webhooks          # HousecallPro webhooks
POST /api/v1/twilio         # Twilio SMS/voice
```

#### MCP API (JSON-RPC)
```
POST /mcp                   # AI assistant tools
Tools: book_service_call, search_availability,
       get_services, get_quote, emergency_help, etc.
```

### AI Agent Capabilities

| Agent | Channel | Technology |
|-------|---------|------------|
| Web Chat | Website | OpenAI GPT |
| SMS Booking | Text | Twilio + OpenAI |
| Voice AI | Phone | OpenAI Realtime API |
| External AI | ChatGPT/Claude | MCP Protocol |

---

## 6. Database Schema

### Overview

- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM with Zod validation
- **Tables**: 25+ tables

### Core Tables

#### Booking
- `customers` - Customer profiles
- `appointments` - Booked appointments

#### Location
- `customerAddresses` - Service addresses with geocoding
- `serviceAreas` - Aggregated area statistics
- `heatMapCache` - Optimized heat map data

#### Conversion Tracking
- `conversionFunnels` - Funnel definitions
- `conversionEvents` - Event tracking
- `microConversions` - Sub-step conversions
- `attributionData` - UTM, GCLID, referrer
- `leads` - Form submissions

#### Multi-Channel Identity
- `sharedThreadCustomers` - Unified customer records
- `sharedThreadIdentities` - Identity links (web_id, phone)
- `sharedThreadThreads` - Conversation threads
- `sharedThreadMessages` - Message history
- `sharedThreadPendingLinks` - Pending OTP links

#### A/B Testing
- `abTests` - Test definitions
- `abTestVariants` - Variants
- `abTestAssignments` - Visitor assignments
- `abTestEvents` - Event tracking
- `abTestMetrics` - Aggregated metrics

#### Content
- `blogPosts` - Blog articles
- `keywords` - SEO keywords

#### Sync
- `syncStatus` - HousecallPro sync status

---

## 7. Key Files Reference

### Core Business Logic

| File | Lines | Purpose |
|------|-------|---------|
| `server/routes.ts` | 4,225 | Main API routes |
| `server/src/capacity.ts` | ~500 | Capacity algorithm |
| `server/src/housecall.ts` | ~800 | HousecallPro client |
| `server/src/adminRoutes.ts` | ~1,500 | Admin API |
| `server/src/webhooks.ts` | ~600 | Webhook processing |

### AI & Agents

| File | Lines | Purpose |
|------|-------|---------|
| `src/booker.ts` | ~3,500 | MCP tool implementations |
| `src/mcp-http-server.ts` | ~400 | MCP HTTP server |
| `server/lib/sharedThread.ts` | ~500 | Multi-channel identity |
| `server/lib/smsBookingAgent.ts` | ~600 | SMS automation |
| `server/lib/realtimeVoice.ts` | ~400 | Voice AI |
| `server/lib/aiChat.ts` | ~800 | Web chat AI |

### Configuration

| File | Purpose |
|------|---------|
| `config/capacity.yml` | Business rules, thresholds, UI copy |
| `.env.example` | Environment variables (217 lines) |
| `shared/schema.ts` | Database schema |

---

## 8. Special Patterns

### Circuit Breaker (HousecallPro)

```
CLOSED → OPEN → HALF-OPEN → CLOSED

- Opens after 5 consecutive failures
- 60-second recovery timeout
- Exponential backoff with jitter
- Max 3 retries, 100ms-5000ms delay
```

Location: `server/src/housecall.ts`

### Rate Limiting

| Endpoint Type | Limit |
|---------------|-------|
| Standard | 100 req/15 min |
| Booking | 5 req/15 min |
| Admin | 30 req/15 min |
| MCP | 100 req/15 min per session |

### Caching Strategy

| Data | TTL |
|------|-----|
| Capacity | 30 seconds |
| Google Reviews | 5 minutes |
| Services | 1 hour |
| Blog posts | 24 hours |
| Static assets | 1 year |

### CSRF Protection

- Global protection with `csurf`
- Exemptions for webhooks (signature-validated)
- Token endpoint: `GET /api/csrf-token`

### Security

- Passport.js authentication with bcrypt
- PostgreSQL session store
- CORS + Helmet + rate limiting
- Webhook signature validation (HMAC-SHA256)
- OTP verification for identity linking

---

## 9. External Integrations

| Service | Purpose |
|---------|---------|
| **HousecallPro** | Customers, jobs, estimates, invoices, webhooks |
| **Google Maps** | Maps, geocoding, service areas |
| **Google Ads** | Campaign management, budget control |
| **OpenAI** | Chat, agents, voice (Realtime API) |
| **Twilio** | SMS, voice calls, webhooks |
| **Google Business** | Review fetching |
| **Sentry** | Error tracking & monitoring |

---

## 10. Deployment & Infrastructure

### Build Process

```bash
npm run build  # vite build + esbuild server

Output:
├── dist/public/     (React app)
├── dist/index.js    (Server bundle)
└── dist/assets/     (Static assets)
```

### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...

# HousecallPro
HOUSECALL_PRO_API_KEY=...
HCP_COMPANY_API_KEY=...

# Security
SESSION_SECRET=... (min 32 chars)

# Google
GOOGLE_MAPS_API_KEY=...
GOOGLE_ADS_* (optional)

# Twilio
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...

# OpenAI
OPENAI_API_KEY=...

# Monitoring
SENTRY_DSN=... (optional)

# MCP
MCP_SERVER_URL=...
MCP_PORT=...
MCP_AUTH_TOKEN=... (optional)
```

### Scripts

```bash
npm run dev      # Development (both servers)
npm run build    # Production build
npm start        # Run production
npm run check    # TypeScript check
npm run db:push  # Sync schema
npm test         # Run tests
```

---

## Summary

This is a **production-grade full-stack platform** for a real plumbing business featuring:

- **Capacity-driven operations** - Every decision informed by real-time availability
- **Multi-channel AI agents** - Book via web, SMS, voice, or external AI
- **Unified customer identity** - Recognition across all channels
- **Enterprise integrations** - HousecallPro, Google, OpenAI, Twilio
- **Comprehensive admin tools** - Analytics, A/B testing, CMS
- **Resilience patterns** - Circuit breaker, rate limiting, caching
- **Security-first** - CSRF, encryption, signature validation

**Code Volume**: ~15,000+ lines core business logic, 100+ components, 25+ database tables

---

*Generated: 2026-01-16 | Project: JohnsonBros.com*
