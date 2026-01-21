# Overview

This project is an AI-first plumbing business website for Johnson Bros. Plumbing & Drain Cleaning. Its primary goal is to modernize customer interaction, streamline service booking, and enhance operational efficiency through automation. The platform allows customers to view services, read reviews, check service areas, and book appointments online. Key features include integration with HousecallPro for optimized service calls, an MCP server for AI personal assistants, and an Admin dashboard for data visualization. The project aims to boost customer acquisition, improve efficiency, and build customer trust.

# User Preferences

Preferred communication style: You are a Co-Founder of this plumbing business. You are the CTO and creating a sate of the art Ai-First website/crm. This has never been done before. Take informed risks. Try and understand the goal of the thing we are building and use 1st principals to get us there. Always ask questions if you need clarification on the underlying reasons for building certin features. Suggest ideas that will enhance our goals.

# System Architecture

## UI/UX Decisions
The frontend is built with React and TypeScript, using Radix UI primitives, shadcn/ui custom styled components, and Tailwind CSS for styling. UI elements, including headlines, CTAs, and badges, adapt dynamically based on real-time capacity. Professional service images are used to enhance credibility.

### Navigation
Desktop navigation uses dropdown menus for Services and Service Areas. Mobile navigation features accordion-style expandable menus. Direct links to "The Family Discount" program are available.

### Homepage Layout
The homepage includes sections for Express Booking with dynamic capacity messaging, an overview of services, a consolidated trust section with badges and Google reviews, a prominent CTA for "The Family Discount" membership, customer success stories, and a showcase of the service fleet.

## Multi-Hierarchical Agent Swarm
A five-tier agent architecture automates plumbing business operations:
1.  **PRIME (Strategic Command)**: Strategic planning and KPI monitoring.
2.  **ZEKE (Operational Supervision)**: Daily operations, staff coordination, and escalation.
3.  **Specialized Admin Swarm**: Agents for Marketing, Data Processing, and Order Management.
4.  **JENNY (Public Interaction)**: Customer-facing secretary for booking, quotes, and FAQs.
5.  **Technician Copilots**: Field assistants for jobsite support.

## Technical Implementations
-   **Frontend**: React with TypeScript, Vite, Wouter for routing, React Query for state management, and React Hook Form with Zod for forms.
-   **Backend**: Express.js with TypeScript on Node.js, utilizing a RESTful API.
-   **Database**: PostgreSQL (Neon serverless) with Drizzle ORM.
-   **Authentication**: Express sessions with a PostgreSQL store, email-based customer identification, and Zod validation.
-   **Security**: Production-ready features including Helmet.js, strict CORS, CSRF protection, account lockout, rate limiting, HMAC-SHA256 for webhooks, and input validation.
-   **SEO**: Dynamic sitemap, robots.txt, SEO-optimized URLs, dedicated service and location pages with structured data, and internal linking.

## Feature Specifications
-   **Express Booking System**: Monitors real-time capacity via HousecallPro, supports dynamic capacity states, smart pricing, and time-based rules.
-   **Smart Booking Modal**: A multi-step flow for service selection, date/time, customer info, and confirmation, with new/returning customer detection and direct HousecallPro job creation.
-   **The Family Discount Membership**: A $99/year program offering priority scheduling, waived service call fees, discounts, and referral benefits.
-   **MCP Server / ChatGPT App**: Enables AI assistants (ChatGPT, Claude) to interact with the business through 12 tools. It includes external AI client connectivity, OpenAI Apps SDK Widget Integration (9 interactive UI templates for booking), and tools for phone verification, booking, availability search, quotes, promotions, emergency help, customer lookup, lead creation, and FAQ search. Security measures include rate limiting and service area validation.
-   **Multi-Channel AI Chat System**: An OpenAI-powered chatbot available via web widget, SMS (Twilio), and voice, using OpenAI function calling to execute MCP tools.
-   **Interactive Card System**: AI assistant outputs structured card intents that render as rich, interactive UI forms for various actions like lead generation, customer info, date/time selection, and booking confirmation.
-   **Automated SMS Booking Agent**: An AI-powered follow-up system for contact form submissions, using OpenAI Agents SDK to conduct conversational SMS dialogues for booking appointments and integrating with HousecallPro.
-   **Admin Dashboard**: Provides real-time analytics, operations monitoring, customer and task management, AI chat interface, and webhook/document management.
-   **Social Proof**: Real-time Google reviews integration, service heat map, live stats widget, and recent jobs widget.
-   **Visual Assets**: Professional plumbing service images are used across all major service and landing pages.

## Business Logic & Rules
-   **Service Area Management**: Defined by postal codes in `config/capacity.yml`.
-   **Capacity Calculation**: Based on real-time availability from HousecallPro, technician schedules, and time of day.
-   **Booking Workflow (2026 Refactor)**:
    1.  **Identity**: Customer lookup (Housecall Pro) or new profile creation.
    2.  **Schedule**: Date and time selection with problem notes and photos.
    3.  **Verification**: SMS OTP final fraud prevention gate.
    4.  **Confirm**: Final review and HCP job creation.
-   **Fraud Prevention**: Bookings are blocked until a human-verified SMS code is entered for the specific phone number linked to the profile.
-   **Address Handling**: Lookup allows selecting from existing addresses or entering a new one.
-   **SMS Verification**: All online bookings require SMS phone verification as the final security gate. Failed SMS attempts trigger a "Call to Schedule" fallback. Address autocomplete uses Google Places API.
-   **Pricing & Fees**: Automatic service fee waivers based on capacity and premium pricing for emergency services.

# External Dependencies

-   **Design System**: Radix UI
-   **Styling Framework**: Tailwind CSS
-   **Date Handling**: date-fns
-   **Icons**: Lucide React
-   **Database**: PostgreSQL (Neon serverless)
-   **ORM**: Drizzle ORM
-   **CRM/Field Service Management**: HousecallPro API
-   **Mapping/Location**: Google Maps API, Google Places API
-   **Form Management**: React Hook Form
-   **Session Store**: connect-pg-simple
-   **SMS/Voice**: Twilio