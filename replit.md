# Overview

This is a comprehensive plumbing business website application for Johnson Bros. Plumbing & Drain Cleaning, serving Quincy, Abington, and the South Shore of Massachusetts. More especally Norfolk, Suffolk, and Plymouth County. The application provides a modern, responsive platform for customers to view services, read reviews, check service areas, and book appointments online. It hss a MCP seever that exposes tools for Ai personal assistants to book service call for their userss. It features an Admin dashboard to visualize reaktime data and creates comprehensive reports. It features a full-stack architecture with a React frontend and Express backend, complete with database integration for managing customers, services, appointments, and reviews.

# User Preferences

Preferred communication style: You are a Co-Founder of this plumbing business. You are the CTO and creating a sate of the art Ai-First website/crm. This has never been done before. Take informed risks. Try and understand the goal of the thing we are building and use 1st principals to get us there. Always ask questions if you need clarification on the underlying reasons for building certin features. Suggest ideas that will enhance our goals. 

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing with a single-page application structure
- **UI Components**: Radix UI primitives with custom styled components using shadcn/ui design system
- **Styling**: Tailwind CSS with custom CSS variables for theming, including Johnson Bros. brand colors
- **State Management**: React Query (TanStack Query) for server state management and API caching
- **Form Handling**: React Hook Form with Zod validation for type-safe form validation
- **Component Structure**: Modular components organized by feature (Header, HeroSection, ServicesSection, ReviewsSection, etc.)

## Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **API Design**: RESTful API with endpoints for services, time slots, bookings, and reviews
- **Database Integration**: Drizzle ORM with PostgreSQL database (Neon serverless)
- **Data Storage**: Configurable storage layer with in-memory implementation for development and database implementation for production
- **Request Handling**: Middleware for JSON parsing, CORS, request logging, and error handling
- **Development Setup**: Vite integration for hot module replacement in development mode

## Data Storage Solutions
- **Database**: PostgreSQL via Neon serverless connection
- **ORM**: Drizzle ORM for type-safe database operations and migrations
- **Schema**: Well-defined database schema with tables for customers, services, appointments, available time slots, and reviews
- **Migration System**: Drizzle Kit for database schema migrations and management
- **Connection Management**: Environment-based database URL configuration with proper error handling

## Authentication and Authorization
- **Session Management**: Express sessions with PostgreSQL session store (connect-pg-simple)
- **Customer Data**: Customer identification through email with optional HousecallPro integration
- **Data Validation**: Zod schemas for input validation and type safety across the application

## External Dependencies
- **Design System**: Radix UI for accessible, unstyled UI components
- **Styling Framework**: Tailwind CSS for utility-first styling with custom design tokens
- **Development Tools**: Replit-specific development plugins for cloud development environment
- **Form Management**: React Hook Form ecosystem for efficient form handling
- **Date Handling**: date-fns for date formatting and manipulation
- **Icons**: Lucide React for consistent iconography throughout the application
- **Type Safety**: TypeScript configuration with strict mode enabled and path aliases for clean imports

The architecture follows a clean separation of concerns with shared types between frontend and backend, enabling type safety across the full stack. The modular component design allows for easy maintenance and scalability, while the configurable storage layer provides flexibility for different deployment environments.

# API Documentation

## Core API Endpoints

### Blog Management
- `GET /api/blog/posts` - Retrieve blog posts with pagination and filtering
- `GET /api/blog/posts/:slug` - Get single blog post by slug (increments view count)
- `POST /api/blog/posts` - Create new blog post
- `PUT /api/blog/posts/:id` - Update existing blog post
- `DELETE /api/blog/posts/:id` - Delete blog post
- `GET /api/blog/keywords` - Retrieve all keywords
- `POST /api/blog/keywords` - Create new keyword
- `POST /api/blog/keywords/:id/track` - Track keyword rankings
- `GET /api/blog/keywords/:id/rankings` - Get keyword rankings
- `GET /api/blog/posts/:id/analytics` - Fetch blog analytics

### Customer & Booking Management
- `GET /api/customers` - List customers with search and pagination
- `POST /api/customers` - Create new customer (includes HousecallPro sync)
- `GET /api/customers/:customer_id` - Get specific customer
- `PUT /api/customers/:customer_id` - Update customer
- `GET /api/customers/:customer_id/addresses` - Get customer addresses
- `POST /customers/{customer_id}/addresses` - Create customer address
- `GET /api/timeslots/:date` - Get available time slots for date (YYYY-MM-DD)
- `POST /api/bookings` - Create service booking (handles customer lookup/creation and HousecallPro job scheduling)

### Service & Capacity Management
- `GET /api/services` - Fetch available services from HousecallPro
- `GET /api/reviews` - Get customer reviews (placeholder)
- `GET /api/capacity/today` - Get today's service capacity and UI copy
- `GET /api/capacity/tomorrow` - Get tomorrow's service capacity

### Social Proof & Analytics
- `GET /api/social-proof/recent-jobs` - Recent job completions for display
- `GET /api/social-proof/stats` - Key business statistics
- `GET /api/social-proof/live-activity` - Real-time activity updates
- `GET /api/social-proof/testimonials` - Customer testimonials
- `GET /api/social-proof/service-heat-map` - Service area heat map data

### Webhook Management
- `POST /api/webhooks/housecall` - Receive HousecallPro webhook events
- `GET /api/webhooks/events` - Get recent webhook events
- `GET /api/webhooks/events/:eventId` - Get specific webhook event
- `GET /api/webhooks/analytics` - Webhook analytics data
- `POST /api/webhooks/subscribe` - Manage webhook subscriptions
- `POST /api/webhooks/test` - Test webhook functionality
- `GET /api/webhooks/config` - Get webhook configuration status

### Admin & Debug
- `POST /api/admin/sync-customer-addresses` - Sync customer addresses from HousecallPro
- `GET /api/debug/hcp-data/:date` - Raw HousecallPro data for debugging
- `GET /healthz` - Health check endpoint
- `GET /.well-known/ai-mcp-config` - AI Assistant discovery endpoint

### Request/Response Patterns
- **Authentication**: All requests use Bearer token authentication with HousecallPro API
- **Validation**: Request bodies validated using Zod schemas from `shared/schema.ts`
- **Error Handling**: Consistent error responses with HTTP status codes and descriptive messages
- **Rate Limiting**: Customer lookup endpoint limited to 5 requests per 15 minutes per IP

# Business Logic & Rules

## Service Area Management
**Primary Service Areas**: Abington, Quincy, Braintree, Milton, Weymouth, Hingham, Hull
**Geographic Coverage**: Postal codes 02170, 02169, 02171, 02351, 02184
**Service Boundaries**: Defined in `config/capacity.yml` with center coordinates and boundaries

## Capacity Calculation Logic
**Capacity States**:
- `SAME_DAY_FEE_WAIVED`: >35% availability, emergency fee waived
- `LIMITED_SAME_DAY`: 10-35% availability, limited spots
- `NEXT_DAY`: <10% availability, schedule for tomorrow
- `EMERGENCY_ONLY`: Weekend/after-hours emergency service only

**Calculation Factors**:
- Real-time booking window availability from HousecallPro
- Technician schedules and capacity
- Time of day and day of week
- User location (zip code based)

## Booking Workflow
1. **Customer Lookup**: Search existing customers by phone/email
2. **Customer Creation**: Create in both local database and HousecallPro if not found
3. **Address Management**: Handle customer addresses with privacy-protected coordinates
4. **Service Selection**: Map services to HousecallPro service catalog
5. **Job Creation**: Create job in HousecallPro with proper scheduling
6. **Appointment Scheduling**: Schedule within available booking windows

## Pricing & Fee Structure
**Service Fee Waiving Rules**:
- Automatic fee waiver when capacity >35%
- Promo tag: `FEEWAIVED_SAMEDAY`
- Discount amount: $99
- UTM tracking: source=site, campaign=capacity

**Emergency Service**:
- Available outside normal business hours
- Premium pricing applies
- Same-day availability when capacity allows

# Environment & Configuration

## Required Environment Variables

### Database Configuration
```bash
DATABASE_URL="postgresql://user:password@host:port/database"  # Neon PostgreSQL connection
```

### HousecallPro Integration
```bash
HOUSECALL_PRO_API_KEY="your_api_key_here"  # or HCP_COMPANY_API_KEY
HOUSECALL_WEBHOOK_SECRET="webhook_secret"  # For webhook signature verification
HCP_API_BASE="https://api.housecallpro.com"  # API base URL (optional)
```

### Google Services
```bash
VITE_GOOGLE_MAPS_API_KEY="your_google_maps_key"  # Frontend Google Maps integration
```

### Application Settings
```bash
PORT=5000  # Server port (defaults to 5000)
NODE_ENV=development  # or "production"
REPL_ID=undefined  # Replit environment detection
```

### Optional: Google Ads Integration
```bash
GOOGLE_ADS_DEV_TOKEN=""
GOOGLE_ADS_CLIENT_ID=""
GOOGLE_ADS_CLIENT_SECRET=""
GOOGLE_ADS_REFRESH_TOKEN=""
GOOGLE_ADS_MANAGER_ID=""
GOOGLE_ADS_ACCOUNT_ID=""
```

## Configuration Files

### capacity.yml
Location: `config/capacity.yml`
Purpose: Business logic configuration for capacity calculation and UI customization

**Key Sections**:
- `thresholds`: Capacity percentage thresholds
- `tech_map`: Technician ID mappings
- `geos`: Supported postal codes
- `ads_rules`: Google Ads automation rules
- `colors`: Brand color definitions
- `ui_copy`: Dynamic UI messaging for different capacity states
- `fee_waive`: Fee waiving promotion settings

**Hot Reload**: Configuration automatically reloads when file changes

### Database Schema
Managed via Drizzle ORM with `shared/schema.ts`
Migrations: Use `npm run db:push` for schema changes

# Security Implementation

## Session Management
- **Storage**: PostgreSQL session store using `connect-pg-simple`
- **Configuration**: Express sessions with secure cookie settings
- **Lifetime**: Configurable session expiration
- **Customer Authentication**: Email-based customer identification

## Webhook Security
- **Signature Verification**: HMAC-SHA256 verification using `HOUSECALL_WEBHOOK_SECRET`
- **Timing Attack Protection**: Uses `crypto.timingSafeEqual()` for signature comparison
- **Request Validation**: Payload structure validation before processing

## API Security
- **Rate Limiting**: Customer lookup endpoint: 5 requests per 15 minutes per IP
- **Input Validation**: All request bodies validated using Zod schemas
- **SQL Injection Protection**: Drizzle ORM provides parameterized queries
- **CORS Configuration**: Configured for specific origins

## Data Protection
- **Coordinate Privacy**: Customer coordinates offset for display (`displayLat`, `displayLng`)
- **PII Handling**: Customer data encrypted in transit and at rest
- **API Key Security**: Environment variable storage, never logged or exposed
- **Error Handling**: Sanitized error messages, detailed logs server-side only

## External API Security
- **HousecallPro Integration**: Bearer token authentication
- **Circuit Breaker Pattern**: Prevents cascading failures (5 failure threshold, 1-minute timeout)
- **Request Retry Logic**: Exponential backoff with jitter
- **Caching**: Reduces API calls and improves resilience

# Project History & Updates

## Recent Changes (Auto-Updated)
*This section is automatically maintained by the AI agent*

### 2025-09-03
- Enhanced Replit.md with comprehensive API documentation
- Added detailed business logic and capacity calculation rules
- Documented environment configuration and security implementation
- Established project history tracking system

## Architecture Evolution

### Core Features Implemented
- Full-stack TypeScript application with React frontend and Express backend
- Real-time capacity calculation and dynamic UI updates
- HousecallPro integration for customer management and job scheduling
- Service area heat map with privacy-protected customer data visualization
- Comprehensive webhook system for real-time data synchronization
- Blog management system with SEO optimization and keyword tracking

### Database Schema
- Customer and appointment management tables
- Service area aggregation and heat map caching
- Blog posts and keyword tracking
- Webhook event logging and analytics
- Address management with privacy protection

### Integration Points
- HousecallPro API for customer, job, and scheduling data
- Google Maps API for service area visualization
- PostgreSQL database with Drizzle ORM
- Session-based authentication system

## Maintenance Notes
- Configuration managed via `capacity.yml` for non-code business rule changes
- Database migrations handled via `npm run db:push`
- Real-time capacity calculation caches results for 5-minute intervals
- Webhook events processed asynchronously with error retry logic
- Development and production environments use configurable storage implementations

## Future Enhancement Opportunities
- Google Ads integration for dynamic campaign management based on capacity
- Advanced analytics dashboard for business intelligence
- Mobile app development using existing API foundation
- Enhanced customer portal with appointment history and service tracking
- Automated customer communication via SMS/email notifications