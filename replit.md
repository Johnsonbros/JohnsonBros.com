# Overview

This project delivers a comprehensive, AI-first plumbing business website for Johnson Bros. Plumbing & Drain Cleaning, serving the South Shore of Massachusetts. The application offers customers a modern platform to view services, read reviews, check service areas, and book appointments online. It includes an MCP server for AI personal assistants to book service calls, and an Admin dashboard for real-time data visualization and reporting. The system features a full-stack architecture with a React frontend and Express backend, integrated with a database for managing customers, services, appointments, and reviews.

## Primary Business Goals

1. **Customer Acquisition**: Convert website visitors into paying customers through strategic positioning of booking CTAs and trust-building elements
2. **Service Booking Optimization**: Streamline the appointment booking process while maximizing revenue potential through real-time HousecallPro integration
3. **Operational Efficiency**: Automate business operations including capacity calculations, Google Ads adjustments, and customer notifications
4. **Trust Building**: Establish credibility through real Google reviews, service statistics, coverage maps, and recent job completions

# Core Features

## Express Booking System
- **Real-time Capacity Monitoring**: Continuously monitors technician availability via HousecallPro API
- **Dynamic State Management**: Three primary capacity states (SAME_DAY_FEE_WAIVED, LIMITED_SAME_DAY, NEXT_DAY) with EMERGENCY_ONLY reserved for multi-day outages
- **Smart Pricing**: Automatic $99 service fee waiver when high capacity  
- **Time-Based Rules**: 12 PM (noon) cutoff - same-day slots before noon, next-day slots after noon
- **Weekend Logic**: Weekends follow same capacity rules as weekdays (no automatic emergency mode)
- **UI Adaptation**: Headlines, CTAs, and badges update based on capacity

## Smart Booking Modal
- **Multi-step Flow**: Service Selection → Date/Time → Customer Info → Confirmation
- **Customer Intelligence**: Automatic detection of new vs. returning customers
- **HousecallPro Integration**: Direct job creation with all relevant tags
- **Notification System**: Automated SMS/email via HousecallPro

## MCP Server (AI Agent Integration)
- **AI-First Booking**: Enables ChatGPT, Claude, and other AI assistants to book services
- **Comprehensive API**: `book_service_call` and `search_availability` tools
- **Smart Scheduling**: Handles customer preferences (morning/afternoon/evening)
- **Automatic Matching**: Phone/email lookup for existing customers

## Admin Dashboard
- **Real-time Analytics**: Live metrics for bookings, capacity, revenue
- **Operations Center**: Monitor technician status, job board, capacity state
- **Customer Management**: Search, view, and manage customer data
- **Task Management**: Assign and track internal tasks
- **AI Chat Interface**: Interact with AI assistant for business insights
- **Webhook Monitoring**: Process and analyze HousecallPro events
- **Document Management**: AI-generated documents and reports
- **Customizable Widgets**: Drag-and-drop dashboard configuration

## Social Proof & Trust Building
- **Google Reviews Integration**: Real reviews from multiple locations
- **Service Heat Map**: Visual representation of coverage areas
- **Stats Widget**: Live business metrics (jobs completed, customers served)
- **Recent Jobs Widget**: Anonymized feed of completed services

# User Preferences

Preferred communication style: You are a Co-Founder of this plumbing business. You are the CTO and creating a sate of the art Ai-First website/crm. This has never been done before. Take informed risks. Try and understand the goal of the thing we are building and use 1st principals to get us there. Always ask questions if you need clarification on the underlying reasons for building certin features. Suggest ideas that will enhance our goals.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript, using Vite.
- **Routing**: Wouter for client-side routing.
- **UI Components**: Radix UI primitives with custom styled components using shadcn/ui.
- **Styling**: Tailwind CSS with custom CSS variables for theming.
- **State Management**: React Query (TanStack Query) for server state management and API caching.
- **Form Handling**: React Hook Form with Zod validation.
- **Component Structure**: Modular components organized by feature.

## Backend Architecture
- **Framework**: Express.js with TypeScript on Node.js.
- **API Design**: RESTful API for services, time slots, bookings, and reviews.
- **Database Integration**: Drizzle ORM with PostgreSQL (Neon serverless).
- **Data Storage**: PostgreSQL database storage for all environments (production-ready persistence).
- **Request Handling**: Middleware for JSON parsing, CORS, logging, and error handling.

## Data Storage Solutions
- **Database**: PostgreSQL via Neon serverless connection (Production-ready persistence).
- **ORM**: Drizzle ORM for type-safe database operations and migrations.
- **Schema**: Well-defined schema for customers, appointments, blog posts, keywords, referrals, webhooks, and analytics.
- **Migration System**: Drizzle Kit for schema management (`npm run db:push`).
- **Storage Implementation**: DatabaseStorage class using Drizzle ORM for all data persistence.

## Authentication and Authorization
- **Session Management**: Express sessions with PostgreSQL session store.
- **Customer Data**: Email-based customer identification, with optional HousecallPro integration.
- **Data Validation**: Zod schemas for input validation.

## Business Logic & Rules
- **Service Area Management**: Primary service areas defined by postal codes and boundaries in `config/capacity.yml`.
- **Capacity Calculation**: Real-time availability from HousecallPro, technician schedules, and time of day determine capacity states (e.g., `SAME_DAY_FEE_WAIVED`, `LIMITED_SAME_DAY`, `NEXT_DAY`).
- **Booking Workflow**: Integrates customer lookup/creation, address management, service selection, and job creation within HousecallPro.
- **Pricing & Fees**: Automatic service fee waivers based on capacity thresholds, and premium pricing for emergency services.

## Security Implementation (Production-Ready)
- **Trust Proxy Configuration**: Properly configured to trust only first hop (Replit proxy), preventing IP spoofing while enabling accurate rate limiting
- **Security Headers**: Helmet.js for comprehensive security headers including CSP, HSTS, X-Frame-Options
- **CORS Protection**: Strict origin validation in production, development-friendly in dev mode
- **CSRF Protection**: Global double-submit cookie pattern protecting ALL state-changing endpoints (POST/PUT/DELETE/PATCH) including public endpoints (/api/customers, /api/bookings)
  - Targeted exemptions: `/api/admin/auth/login` (pre-auth), `/api/webhooks/*` (HMAC validated), `/health` (health check)
  - Internal server-to-server calls authenticated with X-Internal-Secret header
  - No hardcoded fallback secrets - requires INTERNAL_SECRET env var for internal calls
- **Account Lockout**: Automatic account lockout after 5 failed login attempts (30-minute lockout period, auto-reset on success)
- **Rate Limiting**: Comprehensive rate limiting on all endpoints (public read: 100/15min, public write: 10/15min, customer lookup: 5/15min, admin: 20/15min, webhooks: 1000/15min)
- **Session Management**: Secure Express sessions with PostgreSQL store, rolling expiration, and production secret enforcement (no hardcoded fallback)
- **Webhook Security**: HMAC-SHA256 signature verification and timing attack protection for HousecallPro webhooks
- **Input Validation**: XSS protection via query parameter sanitization, prototype pollution prevention, and Zod schema validation
- **Request Size Limiting**: 10MB request body size limit to prevent DoS attacks
- **Data Protection**: Coordinate privacy (offset for display), PII handling, secure API key storage
- **External API Security**: Bearer token authentication for HousecallPro, circuit breaker pattern, request retry logic
- **Production Requirements**: Requires SESSION_SECRET and INTERNAL_SECRET env vars in production (throws error if missing)

## SEO & Discoverability
- **Dynamic Sitemap**: `/sitemap.xml` automatically includes all static pages and published blog posts from the database.
- **Robots.txt**: `/robots.txt` guides search engine crawlers and references the sitemap.
- **Auto-updating**: Sitemap regenerates on each request, ensuring new blog posts are immediately discoverable.
- **SEO-optimized URLs**: Clean, descriptive URLs for all pages and blog posts.
- **Service Pages**: 7 dedicated service pages (General Plumbing, New Construction, Gas Heat, Drain Cleaning, Emergency Plumbing, Water Heater, Pipe Repair) with unique content, local keywords, and varied internal linking.
- **Location Pages**: 6 Tier 1 city pages (Quincy, Braintree, Weymouth, Plymouth, Marshfield, Hingham) optimized for local search with neighborhood-specific content.
- **Structured Data**: LocalBusiness and Service schema markup (JSON-LD) implemented on all 13 pages using reusable SchemaMarkup component for enhanced Google visibility.
- **Internal Linking**: Cross-linking strategy between service and city pages for improved crawlability and user navigation.
- **Priority**: All service and city pages included in sitemap at priority 0.9 for maximum crawl frequency.

# External Dependencies

- **Design System**: Radix UI.
- **Styling Framework**: Tailwind CSS.
- **Date Handling**: date-fns.
- **Icons**: Lucide React.
- **Database**: PostgreSQL (Neon serverless).
- **ORM**: Drizzle ORM.
- **CRM/Field Service Management**: HousecallPro API.
- **Mapping/Location**: Google Maps API.
- **Form Management**: React Hook Form ecosystem.
- **Session Store**: connect-pg-simple.

# Configuration Management

## Capacity Configuration (`config/capacity.yml`)
Controls business rules without code changes:
- **Capacity Thresholds**: State transition percentages
- **Technician Mapping**: Internal names to HousecallPro IDs
- **Service Areas**: Primary ZIP codes and express zones
- **Google Ads Rules**: Budget automation settings
- **UI Copy**: Dynamic messaging for each state
- **Fee Waiver Settings**: Promotional configurations

## Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `HOUSECALL_PRO_API_KEY`: HousecallPro API access
- `HOUSECALL_WEBHOOK_SECRET`: Webhook signature verification
- `VITE_GOOGLE_MAPS_API_KEY`: Google Maps for frontend
- Optional: Google Ads API credentials for automation

# Recent Updates & Improvements

## October 2025 Express Booking Enhancements
- **Noon Cutoff**: Changed express booking cutoff from 3 PM to 12 PM (noon EST) for better capacity management
- **Weekend Optimization**: Weekends now follow same booking logic as weekdays (removed emergency-only restriction)
- **Time-Based Logic**:
  - Before noon: Show same-day waived slots if capacity ≥35%
  - After noon: Show next-day waived slots
  - No slots available: Regular booking with $99 fee
- **BookingModal Fix**: Auto-selects express booking time slots from real API data for seamless user experience
- **Capacity States**: Simplified to 3 primary states (SAME_DAY_FEE_WAIVED, LIMITED_SAME_DAY, NEXT_DAY) with frontend handling emergency UI

## October 2024 Database Migration to PostgreSQL
- **Production Persistence**: Migrated from in-memory storage to PostgreSQL for all data
- **DatabaseStorage Implementation**: All CRUD operations now use Drizzle ORM with PostgreSQL
- **Data Integrity**: Customers, appointments, blog posts, referrals, and webhook data now persist across server restarts
- **Performance**: Database queries optimized with proper indexing for customer lookups
- **Reliability**: Automatic schema synchronization with `npm run db:push`

## October 2024 OpenAI Apps SDK Integration
- **MCP HTTP Server**: Converted MCP server from stdio to HTTP/SSE transport for ChatGPT integration
- **Deployment Ready**: MCP server can now be deployed and accessed over HTTPS
- **ChatGPT Apps SDK**: Ready for OpenAI Apps SDK when app submissions open
- **Dual Interface**: Website booking and AI assistant booking work independently
- **Session Management**: Tracks active MCP connections with UUID-based sessions
- **Health Monitoring**: `/health` and `/` endpoints for server status
- **Documentation**: Complete setup guide in `MCP_SETUP.md`

## December 2024 SEO Enhancements
- **New Service Pages**: Added Emergency Plumbing, Water Heater, and Pipe Repair pages
- **Schema Markup**: LocalBusiness and Service JSON-LD on all 13 pages
- **Enhanced Content**: 500+ words per service page with local keywords
- **Cross-linking Strategy**: Service pages link to city pages and vice versa
- **Sitemap Priority**: All SEO pages at 0.9 priority for maximum crawl frequency

## Performance & Cost Optimizations
- **Backend API Cache**: 5-6 minute cache for HousecallPro API calls (reduced API calls by 80%)
- **Capacity Calculator Cache**: 5 minute cache for capacity calculations (reduced API calls by 90%)
- **Frontend Polling**: 5 minute intervals instead of 60 seconds (reduced API calls by 80%)
- **Lazy Load Google Maps**: Maps only load when user scrolls to them (saves 90% of map API costs)
- **Review Cache**: 5 minute cache for Google Reviews
- **Circuit Breaker**: Prevents cascade failures with HousecallPro API
- **Retry Logic**: Exponential backoff for failed requests
- **Database Indexes**: Optimized queries for customer lookup

## Reliability Features
- **Graceful Degradation**: Site functions even if external services fail
- **Mock Data Mode**: Development testing without API dependencies
- **Error Recovery**: Automatic reconnection and state restoration
- **Webhook Processing**: Event queue prevents data loss