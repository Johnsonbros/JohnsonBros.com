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
- **Dynamic State Management**: Four capacity states (SAME_DAY_FEE_WAIVED, LIMITED_SAME_DAY, NEXT_DAY, EMERGENCY_ONLY)
- **Smart Pricing**: Automatic $99 service fee waiver when high capacity
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
- **Data Storage**: Configurable storage layer (in-memory for dev, database for production).
- **Request Handling**: Middleware for JSON parsing, CORS, logging, and error handling.

## Data Storage Solutions
- **Database**: PostgreSQL via Neon serverless connection.
- **ORM**: Drizzle ORM for type-safe database operations and migrations.
- **Schema**: Well-defined schema for customers, services, appointments, time slots, and reviews.
- **Migration System**: Drizzle Kit for schema management.

## Authentication and Authorization
- **Session Management**: Express sessions with PostgreSQL session store.
- **Customer Data**: Email-based customer identification, with optional HousecallPro integration.
- **Data Validation**: Zod schemas for input validation.

## Business Logic & Rules
- **Service Area Management**: Primary service areas defined by postal codes and boundaries in `config/capacity.yml`.
- **Capacity Calculation**: Real-time availability from HousecallPro, technician schedules, and time of day determine capacity states (e.g., `SAME_DAY_FEE_WAIVED`, `LIMITED_SAME_DAY`, `NEXT_DAY`).
- **Booking Workflow**: Integrates customer lookup/creation, address management, service selection, and job creation within HousecallPro.
- **Pricing & Fees**: Automatic service fee waivers based on capacity thresholds, and premium pricing for emergency services.

## Security Implementation
- **Session Management**: Secure Express sessions with PostgreSQL store.
- **Webhook Security**: HMAC-SHA256 signature verification and timing attack protection for HousecallPro webhooks.
- **API Security**: Rate limiting (customer lookup), Zod schema input validation, Drizzle ORM for SQL injection prevention, and CORS.
- **Data Protection**: Coordinate privacy (offset for display), PII handling, and secure API key storage.
- **External API Security**: Bearer token authentication for HousecallPro, circuit breaker pattern, and request retry logic.

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

## December 2024 SEO Enhancements
- **New Service Pages**: Added Emergency Plumbing, Water Heater, and Pipe Repair pages
- **Schema Markup**: LocalBusiness and Service JSON-LD on all 13 pages
- **Enhanced Content**: 500+ words per service page with local keywords
- **Cross-linking Strategy**: Service pages link to city pages and vice versa
- **Sitemap Priority**: All SEO pages at 0.9 priority for maximum crawl frequency

## Performance Optimizations
- **Caching Strategy**: 30-second capacity cache, 5-minute review cache
- **Circuit Breaker**: Prevents cascade failures with HousecallPro API
- **Retry Logic**: Exponential backoff for failed requests
- **Database Indexes**: Optimized queries for customer lookup

## Reliability Features
- **Graceful Degradation**: Site functions even if external services fail
- **Mock Data Mode**: Development testing without API dependencies
- **Error Recovery**: Automatic reconnection and state restoration
- **Webhook Processing**: Event queue prevents data loss