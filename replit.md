# Overview

This is a comprehensive plumbing business website application for Johnson Bros. Plumbing & Drain Cleaning, serving Quincy, MA and surrounding areas. The application provides a modern, responsive platform for customers to view services, read reviews, check service areas, and book appointments online. It features a full-stack architecture with a React frontend and Express backend, complete with database integration for managing customers, services, appointments, and reviews.

# User Preferences

Preferred communication style: Simple, everyday language.

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