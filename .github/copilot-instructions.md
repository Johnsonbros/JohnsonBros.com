# GitHub Copilot Instructions for Johnson Bros. Plumbing Website

## Project Overview

This is a full-stack web application for Johnson Bros. Plumbing & Drain Cleaning, a family-owned plumbing business serving Quincy, MA and surrounding areas since 1997. The application serves as the primary digital platform for customer acquisition, service booking, and business operations management.

### Tech Stack

- **Frontend**: React 18 with TypeScript, Wouter for routing
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom theme variables
- **UI Components**: Radix UI primitives
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form with Zod validation
- **Integrations**: HousecallPro API, Google Maps API, Twilio

## Code Style and Conventions

### TypeScript

- Always use TypeScript with strict mode enabled
- Prefer explicit types over `any`
- Use type inference where appropriate
- Define interfaces for complex objects
- Use Zod schemas for runtime validation and type inference

### React Components

- Use functional components with hooks
- Prefer named exports for components
- Use lazy loading for non-critical routes and components
- Follow the pattern: imports → types → component → export
- Use custom hooks in `client/src/hooks/` for reusable logic

### Code Organization

- **Client code**: `/client/src/`
  - `pages/` - Route components
  - `components/` - Reusable UI components
  - `hooks/` - Custom React hooks
  - `contexts/` - React context providers
  - `lib/` - Utilities and helpers
- **Server code**: `/server/`
  - `routes.ts` - Main route definitions
  - `src/` - Feature modules (auth, housecall, ads, etc.)
  - `lib/` - Server utilities
- **Shared code**: `/shared/` - Types and schemas used by both client and server

### Import Paths

- Use `@/` alias for client imports: `import { Button } from "@/components/ui/button"`
- Use `@shared/` alias for shared code: `import { insertCustomerSchema } from "@shared/schema"`
- Use absolute imports from project root for server code

### Naming Conventions

- **Files**: kebab-case for most files, PascalCase for React components
- **Components**: PascalCase (e.g., `BookingModal`, `TechnicianStatus`)
- **Hooks**: camelCase starting with `use` (e.g., `useIsMobile`, `useCapacity`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `HOUSECALL_API_BASE`)
- **Functions**: camelCase (e.g., `callHousecallAPI`, `generateTestimonialText`)
- **CSS Classes**: Use Tailwind utility classes; custom classes should be kebab-case

## Architecture Patterns

### API Routes

- Use Express Router for organizing routes
- Apply rate limiting to public endpoints
- Use authentication middleware (`authenticate`) for protected routes
- Implement proper error handling with try-catch blocks
- Log errors using the Logger utility from `./src/logger`
- Return consistent JSON responses

### Data Validation

- Use Zod schemas defined in `/shared/schema.ts` for validation
- Validate user input on both client and server
- Use `insertCustomerSchema`, `insertAppointmentSchema`, etc. for database operations

### State Management

- Use TanStack Query for server state
- Use React Context for global UI state (e.g., ABTestingContext)
- Use local state with `useState` for component-specific state
- Use `useReducer` for complex state logic

### Error Handling

- Use ErrorBoundary component for React error boundaries
- Log errors with appropriate context using the Logger utility
- Display user-friendly error messages
- Never expose sensitive information in error messages

## Security Best Practices

### Authentication & Authorization

- Use Passport.js with local strategy for authentication
- Protect admin routes with `authenticate` middleware
- Store passwords with bcrypt hashing
- Use secure session management with express-session

### Input Validation & Sanitization

- Always validate user input with Zod schemas
- Sanitize data before database operations
- Use parameterized queries (Drizzle ORM handles this)
- Validate API responses from third-party services

### Security Headers

- Security middleware is configured in `server/src/security.ts`
- Helmet is used for security headers
- CSRF protection is enabled with csurf
- CORS is configured appropriately

### Environment Variables

- Never commit `.env` files
- Use `.env.example` as a template
- Access environment variables through `process.env`
- Validate required environment variables on startup (see `server/src/envValidator.ts`)

## Development Workflow

### Running the Application

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run check

# Database operations
npm run db:push
```

### Building Features

1. Define data schemas in `/shared/schema.ts` if needed
2. Create database tables using Drizzle ORM
3. Implement server-side API routes in `/server/routes.ts` or feature modules
4. Create React components in `/client/src/components/` or `/client/src/pages/`
5. Add proper error handling and loading states
6. Test the feature thoroughly

### Working with HousecallPro API

- Use the `HousecallProClient` class from `server/src/housecall.ts`
- API key is stored in `HOUSECALL_PRO_API_KEY` environment variable
- Follow the patterns in `server/routes.ts` for making API calls
- Handle rate limits and API errors appropriately
- Cache responses when appropriate to reduce API calls

## Testing Guidelines

Currently, there is no formal test infrastructure in this project. When adding tests in the future:

- Write unit tests for utility functions
- Write integration tests for API endpoints
- Write component tests for complex UI components
- Mock external API calls in tests
- Use meaningful test descriptions

## Performance Considerations

### Frontend Optimization

- Use lazy loading for routes and large components
- Implement code splitting with React.lazy
- Optimize images and assets
- Use TanStack Query for efficient data fetching and caching
- Minimize re-renders with proper memoization

### Backend Optimization

- Use caching middleware from `server/src/cachingMiddleware.ts`
- Implement rate limiting on public endpoints
- Optimize database queries
- Use compression middleware
- Monitor performance with Sentry

### Database

- Use indexes for frequently queried fields
- Avoid N+1 queries
- Use pagination for large result sets
- Implement proper connection pooling

## API Integration Patterns

### HousecallPro Integration

- Used for scheduling, customer management, and job tracking
- Key endpoints: `/employees`, `/jobs`, `/customers`, `/bookings`
- Real-time capacity calculations based on technician schedules
- Webhook handling for job updates

### Google Maps Integration

- Used for service area display and address validation
- Loader configuration in `client/src/components/`
- API key in `GOOGLE_MAPS_API_KEY` environment variable

### Twilio Integration

- Used for SMS notifications
- Configuration in `server/lib/twilio.ts`
- Send booking confirmations and updates

## Common Patterns

### Creating a New Page

1. Create component in `/client/src/pages/`
2. Add lazy import in `App.tsx`
3. Add route in the Switch component
4. Implement SEO with react-helmet-async

### Adding a New API Endpoint

1. Define route in `server/routes.ts` or create new module in `server/src/`
2. Apply appropriate middleware (auth, rate limiting, validation)
3. Implement error handling
4. Add logging for debugging
5. Document the endpoint behavior

### Creating a New Component

1. Create component file in appropriate directory
2. Define props interface with TypeScript
3. Use Radix UI primitives for accessible components
4. Style with Tailwind CSS utility classes
5. Handle loading and error states

## Deployment

- Review `DEPLOYMENT.md` for production deployment guide
- Ensure all environment variables are set
- Run database migrations before deploying
- Monitor application with Sentry
- Check `PRODUCTION_READINESS_CHECKLIST.md` before deploying

## Documentation

- Keep `WEBSITE_DOCUMENTATION.md` updated with feature changes
- Document API changes in code comments
- Update deployment documentation when adding new environment variables
- Maintain changelog for significant changes

## Additional Resources

- **Project Documentation**: See `WEBSITE_DOCUMENTATION.md` for detailed feature documentation
- **Deployment Guide**: See `DEPLOYMENT.md` for production setup
- **MCP Setup**: See `MCP_SETUP.md` for Model Context Protocol configuration
