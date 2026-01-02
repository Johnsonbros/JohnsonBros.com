# Overview

This project delivers a comprehensive, AI-first plumbing business website for Johnson Bros. Plumbing & Drain Cleaning, serving the South Shore of Massachusetts. It offers customers a modern platform to view services, read reviews, check service areas, and book appointments online. The system integrates an MCP server for AI personal assistants to book service calls and an Admin dashboard for real-time data visualization and reporting. The core purpose is to drive customer acquisition, optimize service booking through HousecallPro integration, and enhance operational efficiency through automation, while building trust with potential customers.

# User Preferences

Preferred communication style: You are a Co-Founder of this plumbing business. You are the CTO and creating a sate of the art Ai-First website/crm. This has never been done before. Take informed risks. Try and understand the goal of the thing we are building and use 1st principals to get us there. Always ask questions if you need clarification on the underlying reasons for building certin features. Suggest ideas that will enhance our goals.

# System Architecture

## UI/UX Decisions
The frontend is built with React and TypeScript, utilizing Radix UI primitives and custom styled components with shadcn/ui. Tailwind CSS is used for styling and theming. UI elements adapt dynamically based on real-time capacity, including headlines, CTAs, and badges. Professional service images are strategically placed throughout the site to enhance credibility and visual appeal.

### Navigation
- **Desktop Navigation**: Dropdown menus for Services (7 options) and Service Areas (6 locations) using shadcn DropdownMenu components
- **Mobile Navigation**: Accordion-style expandable menus for Services and Service Areas with smooth animations
- **Direct Links**: Quick access to The Family Discount membership program in main navigation

### Homepage Layout (Streamlined)
1. **Express Booking** - Dynamic booking with real-time capacity-based messaging
2. **Services Section** - Overview of all plumbing services with quick booking
3. **Why Choose Us & Reviews** - Consolidated trust section with badges (Licensed & Insured, 4.9/5 Rating, 15+ Years Experience) and embedded Google reviews
4. **The Family Discount Promo** - Prominent CTA section highlighting $99/year membership benefits
5. **Customer Success Stories** - Combined video testimonials and featured projects
6. **Service Fleet** - Showcase of professional service vehicles

## Technical Implementations
- **Frontend**: React with TypeScript, Vite, Wouter for routing, React Query for state management, React Hook Form with Zod for forms.
- **Backend**: Express.js with TypeScript on Node.js, RESTful API design.
- **Database**: PostgreSQL (Neon serverless) managed with Drizzle ORM for type-safe operations and migrations.
- **Authentication**: Express sessions with PostgreSQL store, email-based customer identification, Zod validation for inputs.
- **Security**: Production-ready security features including Helmet.js, strict CORS, CSRF protection, account lockout, comprehensive rate limiting, HMAC-SHA256 for webhooks, and input validation.
- **SEO**: Dynamic sitemap, robots.txt, SEO-optimized URLs, dedicated service and location pages with structured data (JSON-LD), and internal linking strategies.

## Feature Specifications
- **Express Booking System**: Real-time capacity monitoring via HousecallPro, dynamic capacity states (SAME_DAY_FEE_WAIVED, LIMITED_SAME_DAY, NEXT_DAY), smart pricing (fee waivers), time-based rules (e.g., 12 PM cutoff), and weekend logic.
- **Smart Booking Modal**: Multi-step flow for service selection, date/time, customer info, and confirmation, with new/returning customer detection and direct HousecallPro job creation.
- **The Family Discount Membership**: $99/year program offering priority scheduling, waived service call fees, 10% discount on all jobs, and 1 referral gift ability per year. Managed through dedicated page at /family-discount with customer portal at /my-plan.
- **MCP Server / ChatGPT App**: Enables AI assistants (ChatGPT, Claude) to interact with the plumbing business through 5 tools:
  - `book_service_call` - Book plumbing appointments directly with HousecallPro
  - `search_availability` - Check available time slots for services
  - `get_quote` - Get instant price estimates based on service type and urgency
  - `get_services` - List all available plumbing services with descriptions
  - `emergency_help` - Provide emergency guidance for plumbing issues (burst pipes, gas leaks, etc.)
- **Admin Dashboard**: Provides real-time analytics, operations monitoring, customer management, task management, AI chat interface, webhook monitoring, and document management.
- **Social Proof**: Real-time Google reviews integration displaying live rating and review count in header (updates every 30 minutes), service heat map, live stats widget, and recent jobs widget.
- **Visual Assets**: Professional plumbing service images across all major service pages (Emergency Plumbing, Water Heater, Drain Cleaning, New Construction, General Plumbing) and landing pages to build trust and showcase quality workmanship.

## Business Logic & Rules
- **Service Area Management**: Defined by postal codes and boundaries in `config/capacity.yml`.
- **Capacity Calculation**: Real-time availability from HousecallPro, technician schedules, and time of day.
- **Booking Workflow**: Integrates customer lookup/creation, address management, service selection, and job creation within HousecallPro.
- **Pricing & Fees**: Automatic service fee waivers based on capacity, premium pricing for emergency services.

# External Dependencies

- **Design System**: Radix UI
- **Styling Framework**: Tailwind CSS
- **Date Handling**: date-fns
- **Icons**: Lucide React
- **Database**: PostgreSQL (Neon serverless)
- **ORM**: Drizzle ORM
- **CRM/Field Service Management**: HousecallPro API
- **Mapping/Location**: Google Maps API
- **Form Management**: React Hook Form
- **Session Store**: connect-pg-simple

## Environment Variables Configuration

### Required (Configured)
- `DATABASE_URL` - PostgreSQL connection string ✅
- `HOUSECALLPRO_API_KEY` - HousecallPro API integration ✅
- `HOUSECALLPRO_COMPANY_ID` - HousecallPro company identifier ✅
- `GOOGLE_MAPS_API_KEY` - Backend Google Maps integration ✅

### Optional (Gracefully Degraded)
- `VITE_GOOGLE_MAPS_API_KEY` - Frontend Google Maps for heat map visualization
  - Status: Not configured
  - Impact: Service heat map shows console warning but continues to function with limited features
  - Code handles missing key gracefully (ServiceHeatMap.tsx lines 137-140)
- `GOOGLE_PLACES_API_KEY` - Google Places API for fetching real-time business reviews ✅
  - Status: Configured
  - Impact: Header displays live Google review rating and count from both business locations
  - Endpoint: /api/v1/google-reviews fetches reviews from Quincy and Abington locations
  - Updates: Every 30 minutes and on window focus

### Optional (Stub Mode)
- Google Ads API credentials (not configured)
  - `GOOGLE_ADS_CLIENT_ID`
  - `GOOGLE_ADS_CLIENT_SECRET`
  - `GOOGLE_ADS_DEVELOPER_TOKEN`
  - `GOOGLE_ADS_REFRESH_TOKEN`
  - Status: Application runs in STUB mode
  - Impact: Google Ads automation simulated locally without actual API calls

### Admin System
- Super admin exists in database: `Sales@thejohnsonbros.com`
- No environment variables needed for admin
- Optional setup variables (only needed for auto-creation):
  - `ADMIN_EMAIL` - Admin account email
  - `ADMIN_DEFAULT_PASSWORD` - Secure password (min 12 chars)
  - `ADMIN_FIRST_NAME` - Admin first name
  - `ADMIN_LAST_NAME` - Admin last name