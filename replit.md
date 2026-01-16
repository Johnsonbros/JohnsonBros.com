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
- **MCP Server / ChatGPT App**: Enables AI assistants (ChatGPT, Claude) to interact with the plumbing business through 12 tools with comprehensive guardrails:
  - **OpenAI Apps SDK Widget Integration**: MCP server registers 9 interactive UI templates for ChatGPT that render rich, interactive booking experiences:
    - Widget templates: `date-picker`, `time-picker`, `booking-confirmation`, `lead-capture`, `availability`, `services`, `quote`, `emergency`, `service-fee`
    - Location: `src/widgets/templates/` with HTML+Skybridge format
    - Registered as MCP resources at `ui://widget/v2/*.html` with `text/html+skybridge` MIME type
    - Uses `window.openai` APIs: `toolOutput`, `callTool()`, `sendFollowUpMessage()`, `notifyIntrinsicHeight()`, `requestClose()`, `setWidgetState()`
    - Shared utilities in `shared-card.js` for consistent widget behavior
  - `book_service_call` - Book plumbing appointments directly with HousecallPro (with service area validation)
  - `search_availability` - Check available time slots for services
  - `get_quote` - Get instant price estimates based on service type and urgency
  - `get_services` - List all available plumbing services with descriptions
  - `get_promotions` - Get current deals, discounts, coupons, rebates, and seasonal offers (filters by type, service, active status)
  - `emergency_help` - Provide emergency guidance for plumbing issues (burst pipes, gas leaks, etc.)
  - `lookup_customer` - Look up existing customer by phone/email
  - `get_job_status` - Check appointment/job status
  - `create_lead` - Request callback with conversation notes logged to HousecallPro
  - `get_service_history` - View past jobs for a customer
  - `search_faq` - Query FAQ database for common questions
  - `reschedule_appointment` - Soft redirect to phone call (no direct modification)
  - `cancel_appointment` - Soft redirect to phone call (no direct modification)
  - `request_review` - [OFFLINE] Request Google review after completed jobs (documented for future activation)
  - **Rate Limiting**: 100 requests/15min per session, 200 requests/hour per IP, 500ms cooldown between requests
  - **Service Area Validation**: 158 zip codes covering Norfolk, Suffolk, and Plymouth Counties MA; out-of-area customers automatically get leads created with office notification
  - **Security**: Reschedule/cancel tools intentionally don't modify schedules - they log requests and redirect to phone
  - **Business Notifications**: Owner receives SMS after AI interactions with customer details, outcome, and sentiment analysis
- **Multi-Channel AI Chat System**: OpenAI-powered chatbot available across web, SMS, and voice:
  - **Web Chat Widget**: Floating chat button with company logo, opens branded chat panel with quick action prompts
  - **SMS**: Twilio integration at +18577546617 for text-based support
  - **Voice**: Same number for voice calls with speech-to-text AI conversation
  - Uses OpenAI function calling to execute MCP tools (booking, quotes, availability, services, emergency help)
  - Maintains conversation history per session for context continuity
  - Emergency phone: (617) 479-9911
- **Interactive Card System** (Replit Agent v3-style): AI assistant outputs structured card intents that render as rich, interactive UI forms:
  - **Card Types**: lead_card, new_customer_info, returning_customer_lookup, date_picker, time_picker, booking_confirmation, service_recommendation, estimate_range
  - **Responsive Layout**: Desktop shows side panel (≥1024px), mobile shows bottom drawer (<1024px)
  - **Card Protocol**: Zod schemas at `client/src/lib/cardProtocol.ts` define card structure with UUID validation
  - **Card Store**: React Context-based store (`client/src/stores/useCardStore.tsx`) manages cards per thread with form data persistence
  - **Card Extraction**: `extractCardIntents.ts` parses card_intent code blocks from assistant responses (handles ChatKit's structured content array format)
  - **Action Dispatch**: Card form submissions route through `/api/actions/dispatch` to call MCP tools (customer lookup, availability, booking)
  - **Integration**: ChatKitWidget extracts cards from `onResponseEnd` events and pushes to CardStore for rendering in CardSurface
- **Automated SMS Booking Agent**: AI-powered follow-up system for contact form submissions:
  - Triggers exactly 3 minutes and 57 seconds (237 seconds) after form submission (when customer opts in for marketing)
  - Uses OpenAI Agents SDK (gpt-4o) connected to HousecallPro MCP server via StreamableHTTPClientTransport
  - Has access to 5 MCP tools: book_service_call, search_availability, get_quote, get_services, emergency_help
  - Conducts conversational SMS dialogue to book $99 service fee appointments
  - Automatically enters conversation notes into HousecallPro jobs after successful bookings
  - Session history maintained in-memory by phone number for context continuity
  - Agent runs autonomous tool execution loop (max 5 iterations) to prevent infinite loops
- **Admin Dashboard**: Provides real-time analytics, operations monitoring, customer management, task management, AI chat interface, webhook monitoring, and document management.
- **Social Proof**: Real-time Google reviews integration displaying live rating and review count in header (updates every 30 minutes), service heat map, live stats widget, and recent jobs widget.
- **Visual Assets**: Professional plumbing service images across all major service pages (Emergency Plumbing, Water Heater, Drain Cleaning, New Construction, General Plumbing) and landing pages to build trust and showcase quality workmanship.

## Business Logic & Rules
- **Service Area Management**: Defined by postal codes and boundaries in `config/capacity.yml`.
- **Capacity Calculation**: Real-time availability from HousecallPro, technician schedules, and time of day.
- **Booking Workflow**: Integrates customer lookup/creation, address management, service selection, and job creation within HousecallPro.
  - **SMS Verification Required**: All online bookings require phone verification via 6-digit OTP code sent by SMS. This prevents fake bookings and verifies customer identity.
  - **SMS Verification Retry & Fallback**: If SMS fails to send, customers can retry up to 2 times. After 2 failed attempts, the system shows a "Call to Schedule" card with the office phone number. All failures are logged to `sms_verification_failures` table with suggested fixes.
  - **SMS Failure Tracking**: Database table tracks all SMS failures with: phone, failure type (send_failed, verify_failed, max_retries_exceeded), error message, attempt number, IP address, user agent, and auto-generated suggested fixes. Admin can view/resolve via `/api/v1/admin/sms-failures`.
  - **Address Autocomplete**: Service address field uses Google Places API for autocomplete, ensuring properly formatted addresses for HousecallPro.
  - **Known Limitation - Household Members**: If a family member (spouse, child, etc.) wants to book for an address where another household member's phone is on file, they must call the office directly. The online booking system verifies the phone number on record, so unregistered household members cannot complete online bookings.
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