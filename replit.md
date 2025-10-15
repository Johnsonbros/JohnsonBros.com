# Overview

This project delivers a comprehensive, AI-first plumbing business website for Johnson Bros. Plumbing & Drain Cleaning, serving the South Shore of Massachusetts. It offers customers a modern platform to view services, read reviews, check service areas, and book appointments online. The system integrates an MCP server for AI personal assistants to book service calls and an Admin dashboard for real-time data visualization and reporting. The core purpose is to drive customer acquisition, optimize service booking through HousecallPro integration, and enhance operational efficiency through automation, while building trust with potential customers.

# User Preferences

Preferred communication style: You are a Co-Founder of this plumbing business. You are the CTO and creating a sate of the art Ai-First website/crm. This has never been done before. Take informed risks. Try and understand the goal of the thing we are building and use 1st principals to get us there. Always ask questions if you need clarification on the underlying reasons for building certin features. Suggest ideas that will enhance our goals.

# System Architecture

## UI/UX Decisions
The frontend is built with React and TypeScript, utilizing Radix UI primitives and custom styled components with shadcn/ui. Tailwind CSS is used for styling and theming. UI elements adapt dynamically based on real-time capacity, including headlines, CTAs, and badges.

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
- **MCP Server**: Enables AI assistants (ChatGPT, Claude) to book services via `book_service_call` and `search_availability` tools, handling customer preferences and matching.
- **Admin Dashboard**: Provides real-time analytics, operations monitoring, customer management, task management, AI chat interface, webhook monitoring, and document management.
- **Social Proof**: Integration of Google reviews, service heat map, live stats widget, and recent jobs widget.

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