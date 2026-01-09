# Johnson Bros. Plumbing & Drain Cleaning Website Documentation

## Overview
This is a comprehensive full-stack web application for Johnson Bros. Plumbing & Drain Cleaning, a family-owned plumbing business serving Quincy, MA and surrounding areas since 1997. The website serves as the primary digital platform for customer acquisition, service booking, and business operations management.

## Primary Business Goals

### 1. Customer Acquisition
- **Goal**: Convert website visitors into paying customers through strategic positioning of booking CTAs and trust-building elements
- **Strategy**: Dynamic capacity-based messaging that creates urgency when appropriate (same-day service availability, waived fees)

### 2. Service Booking Optimization
- **Goal**: Streamline the appointment booking process while maximizing revenue potential
- **Strategy**: Real-time integration with HousecallPro for availability, smart routing of express vs. standard bookings

### 3. Operational Efficiency
- **Goal**: Automate business operations and reduce manual overhead
- **Strategy**: Automated capacity calculations, Google Ads adjustments, and customer notifications

### 4. Trust Building
- **Goal**: Establish credibility and social proof to increase conversion rates
- **Strategy**: Display real Google reviews, service statistics, coverage maps, and recent job completions

## Core Features & Their Purpose

### 1. Express Booking System
**Purpose**: Capture high-value same-day service requests when capacity allows

**How it Works**:
- Continuously monitors real-time capacity via HousecallPro API
- Calculates technician availability based on current bookings
- Dynamically adjusts messaging based on four capacity states:
  - `SAME_DAY_FEE_WAIVED`: High capacity - promotes same-day service with $99 fee waived
  - `LIMITED_SAME_DAY`: Moderate capacity - still offers same-day but with standard fee
  - `NEXT_DAY`: Low capacity - promotes guaranteed next-day service
  - `EMERGENCY_ONLY`: No regular capacity - emergency services only

**Business Value**: Maximizes revenue by filling available slots and creating urgency when beneficial

### 2. Smart Booking Modal
**Purpose**: Provide a seamless, conversion-optimized booking experience

**How it Works**:
- Multi-step form flow: Service Selection → Date/Time → Customer Info → Confirmation
- Fetches real-time availability from HousecallPro
- Handles both new and returning customers
- Validates customer data and prevents duplicates
- Creates jobs directly in HousecallPro system
- Sends automated notifications to customers and technicians

**Business Value**: Reduces booking friction while capturing all necessary information for service delivery

### 3. Dynamic Service Display
**Purpose**: Showcase all available services with visual appeal and clear pricing

**How it Works**:
- Fetches services from backend/HousecallPro
- Categorizes services (emergency, maintenance, installation, inspection)
- Displays with appropriate icons and imagery
- Direct booking integration for each service

**Business Value**: Educates customers on available services and encourages broader service utilization

### 4. Social Proof Section
**Purpose**: Build trust and credibility through data-driven proof points

**Components**:
- **Service Heat Map**: Visual representation of service coverage areas
- **Stats Widget**: Real-time business metrics (jobs completed, customers served, etc.)
- **Recent Jobs Widget**: Live feed of recently completed services (anonymized)

**Business Value**: Increases conversion rates by demonstrating active, successful business operations

### 5. Google Reviews Integration
**Purpose**: Leverage authentic customer feedback for trust building

**How it Works**:
- Fetches reviews from multiple Google Business Profile locations
- Calculates aggregate ratings and displays recent reviews
- Shows location-specific reviews for local relevance
- Updates every 5 minutes for freshness

**Business Value**: Third-party validation increases customer confidence in service quality

### 6. Capacity-Based Ad Management
**Purpose**: Optimize advertising spend based on real-time capacity

**How it Works**:
- Google Ads Bridge monitors capacity state changes
- Automatically adjusts campaign budgets and status:
  - High capacity: Increases ad spend to drive more bookings
  - Low capacity: Reduces spend to avoid overwhelming the system
  - Next day only: Pauses certain campaigns, adjusts messaging

**Business Value**: Maximizes ROI on advertising spend while preventing overbooking

### 7. HousecallPro Integration
**Purpose**: Centralize all business operations in industry-standard platform

**Integration Points**:
- Customer management (search, create, update)
- Job scheduling and management
- Real-time availability and booking windows
- Employee/technician data
- Webhook processing for event-driven updates
- Notification system via job notes

**Business Value**: Eliminates double-entry, reduces errors, provides single source of truth

### 8. Blog & SEO System
**Purpose**: Improve organic search rankings and provide valuable content

**Features**:
- Full blog post management with categories and tags
- Keyword tracking and density optimization
- SEO meta tags and structured data
- Analytics tracking for content performance
- Automatic sitemap generation

**Business Value**: Long-term customer acquisition through organic search traffic

## Shared Thread Persistence (Web Chat, SMS, Voice)
The assistant now uses a single, persistent conversation thread per customer across web chat, SMS, and voice. Web users are identified by a stable `userId` (stored in localStorage), and phone identities are linked via OTP verification. Once linked, all channels map to the same customer record and default thread.

### Key Endpoints
- `POST /api/v1/chatkit/session` — Creates/reuses the persistent thread for a web user.
- `POST /api/identity/start-link` — Sends OTP to link web user to phone.
- `POST /api/identity/confirm-link` — Confirms OTP and merges customer records if needed.
- `POST /api/webhooks/twilio/sms` — Inbound SMS webhook (Twilio).
- `POST /api/webhooks/twilio/voice/incoming` — Voice entrypoint (Twilio).
- `POST /api/webhooks/twilio/voice/handle-speech` — Voice turn handler (Twilio).
- `GET /api/debug/customer-by-identity` — Debug identity lookup (protected).
- `GET /api/debug/thread/:customerId` — Debug thread lookup (protected).
- `GET /api/debug/messages/:threadId` — Debug message history (protected).

### Environment Variables (Add to `.env`)
- `DATABASE_URL`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `OTP_SENDER_NAME` (optional)
- `INTERNAL_ADMIN_TOKEN`
- `OPENAI_API_KEY`
- `DEFAULT_REGION` (default `US`)

### End-to-End Flow (Web → OTP → SMS → Voice)
1. Web chat requests `/api/v1/chatkit/session` with a stable `userId`.
2. User submits phone number to `/api/identity/start-link` to receive OTP via SMS.
3. User confirms OTP via `/api/identity/confirm-link`, which merges identities and threads.
4. Inbound SMS via Twilio uses `/api/webhooks/twilio/sms` and continues the same thread.
5. Caller ID on voice calls hits `/api/webhooks/twilio/voice/incoming`, then `/voice/handle-speech`, continuing the same thread with rolling summaries for concise responses.

### 9. Webhook Monitoring
**Purpose**: Process and analyze HousecallPro events for business intelligence

**How it Works**:
- Receives webhooks for all HousecallPro events
- Categorizes and tags events for analysis
- Stores processed data for reporting
- Provides visual monitoring interface
- Tracks event patterns and anomalies

**Business Value**: Enables data-driven decision making and system health monitoring

### 10. Customer Notification System
**Purpose**: Keep customers and technicians informed about bookings

**How it Works**:
- Triggered automatically after successful booking
- Adds formatted notes to HousecallPro jobs
- HousecallPro's internal system sends actual SMS/email
- Includes all relevant booking details

**Business Value**: Reduces no-shows and improves customer satisfaction

## System Architecture & Operation

### Frontend Flow
1. **User Lands on Homepage**
   - Express booking section loads with real-time capacity data
   - Services section displays available options
   - Social proof elements build trust

2. **User Initiates Booking**
   - Can start from Express Booking, Services Section, or Header CTA
   - Booking modal opens with appropriate pre-selections

3. **Booking Process**
   - User selects service (or has pre-selected)
   - System fetches available time slots
   - User provides contact information
   - System validates and creates booking

4. **Post-Booking**
   - Confirmation displayed to user
   - Notifications sent automatically
   - Job created in HousecallPro

### Backend Operations

#### Continuous Processes
1. **Capacity Monitoring** (Every 30 seconds)
   - Fetches latest booking windows from HousecallPro
   - Calculates technician availability
   - Updates capacity state and UI messaging

2. **Google Ads Sync** (Every 5 minutes)
   - Checks current capacity state
   - Applies appropriate ad rules
   - Logs actions for audit trail

3. **Review Updates** (Every 5 minutes)
   - Fetches latest Google reviews
   - Updates aggregate ratings
   - Refreshes review display

#### Event-Driven Processes
1. **Webhook Processing**
   - Receives HousecallPro events
   - Processes and categorizes data
   - Updates analytics and tags
   - Triggers relevant actions

2. **Booking Creation**
   - Validates customer data
   - Creates/updates customer in HousecallPro
   - Creates job with appropriate tags
   - Sends notifications
   - Updates capacity calculations

### Data Flow

```
User Action → Frontend Component → API Endpoint → Business Logic → HousecallPro API
                                                        ↓
                                                   Database
                                                        ↓
                                                Webhook Events → Processing → Analytics
```

### Configuration Management

The system uses a YAML configuration file (`config/capacity.yml`) that controls:
- Capacity thresholds for state transitions
- Technician mappings to HousecallPro IDs
- Service area ZIP codes
- Google Ads rules and budgets
- UI copy for different states
- Fee waiver promotional settings

This allows non-technical staff to adjust business rules without code changes.

## Business Intelligence & Analytics

### Key Metrics Tracked
- **Booking Metrics**: Conversion rates, service types, time slots
- **Capacity Metrics**: Utilization rates, peak times, technician efficiency
- **Customer Metrics**: New vs. returning, geographic distribution
- **Content Metrics**: Blog views, keyword rankings, SEO performance
- **System Metrics**: Webhook processing, API performance

### Reporting Capabilities
- Real-time capacity dashboard
- Webhook event monitoring
- Blog analytics and keyword tracking
- Social proof statistics
- Review sentiment analysis

## Security & Reliability

### Security Measures
- Environment variables for sensitive data
- Webhook signature verification
- Rate limiting on public endpoints
- Input validation and sanitization
- SQL injection prevention via ORM

### Reliability Features
- Circuit breaker pattern for API calls
- Retry logic with exponential backoff
- Graceful degradation when services unavailable
- Caching for frequently accessed data
- Error logging and monitoring

## Maintenance & Extensibility

### Database Management
- PostgreSQL with Drizzle ORM
- Automated migrations
- Type-safe schema definitions
- Indexed for performance

### Code Organization
- Modular component architecture
- Shared types between frontend and backend
- Clear separation of concerns
- Comprehensive error handling

### Development Workflow
- Hot module replacement in development
- Automated testing capabilities
- Seed data for development
- Environment-based configuration

## Environment Setup & Prerequisites

### Required Environment Variables

```bash
# Database Configuration (Required)
DATABASE_URL="postgresql://user:password@host:port/database"  # Neon PostgreSQL connection string

# HousecallPro Integration (Required for bookings)
HOUSECALL_PRO_API_KEY="your_api_key_here"  # or HCP_COMPANY_API_KEY
HOUSECALL_WEBHOOK_SECRET="webhook_secret"  # For webhook signature verification

# Google Services (Required for maps)
VITE_GOOGLE_MAPS_API_KEY="your_google_maps_key"  # Frontend Google Maps

# Application Settings
PORT=5000  # Server port (defaults to 5000)
NODE_ENV=development  # or "production"

# Optional: Google Ads Integration
GOOGLE_ADS_DEV_TOKEN=""
GOOGLE_ADS_CLIENT_ID=""
GOOGLE_ADS_CLIENT_SECRET=""
GOOGLE_ADS_REFRESH_TOKEN=""
GOOGLE_ADS_MANAGER_ID=""
GOOGLE_ADS_ACCOUNT_ID=""
```

### Obtaining API Keys

**HousecallPro API Key**:
1. Log into your HousecallPro account as an admin
2. Navigate to Settings → API & Webhooks
3. Generate a new API key with appropriate permissions
4. Required permissions: Customers, Jobs, Estimates, Employees, Schedules

**Google Maps API Key**:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Maps JavaScript API
4. Create credentials (API Key)
5. Restrict key to your domain for security

### Database Initialization

```bash
# Install dependencies
npm install

# Push schema to database
npm run db:push

# For production with potential data loss
npm run db:push --force

# Seed initial blog data (development only)
npm run seed:blog
```

## HousecallPro Integration Details

### Required Account Permissions
- **API Access Level**: Full access to Customers, Jobs, Estimates, and Schedules
- **Webhook Permissions**: Ability to register webhook endpoints
- **Employee Access**: Read access to employee/technician data

### Employee ID Mapping
The system maps internal technician names to HousecallPro employee IDs:
```yaml
tech_map:
  nate: "pro_19f45ddb23864f13ba5ffb20710e77e8"  # Nate Johnson
  nick: "pro_784bb427ee27422f892b2db87dbdaf03"  # Nick Johnson  
  jahz: "pro_b0a7d40a10dc4477908cc808f62054ff"  # Jahz Malary
```

### Service Type Configuration
Services must exist in HousecallPro with matching IDs:
- Emergency services: `emergency-*`
- Maintenance services: `maintenance-*`
- Installation services: `installation-*`
- Inspection services: `inspection-*`

### Webhook Setup
1. In HousecallPro, navigate to Settings → Webhooks
2. Add webhook endpoint: `https://yourdomain.com/api/webhooks`
3. Select events to subscribe to:
   - Job events (created, updated, completed, cancelled)
   - Customer events (created, updated)
   - Estimate events (created, approved, declined)
4. Copy the webhook secret for signature verification

### API Rate Limits & Circuit Breaker
- **Rate Limit**: 100 requests per minute (HousecallPro default)
- **Circuit Breaker Threshold**: Opens after 5 consecutive failures
- **Recovery Time**: 60 seconds before attempting half-open state
- **Retry Logic**: 3 attempts with exponential backoff (1s, 2s, 4s)

## Business Logic & Capacity Calculations

### Capacity Score Formula
```javascript
capacityScore = availableWindows / totalPossibleWindows

// State transitions:
if (capacityScore >= 0.35) state = "SAME_DAY_FEE_WAIVED"
else if (capacityScore >= 0.10) state = "LIMITED_SAME_DAY"  
else if (hasNextDayAvailability) state = "NEXT_DAY"
else state = "EMERGENCY_ONLY"
```

### Booking Window Rules
- **Business Hours**: 7:00 AM - 9:00 PM EST
- **Window Duration**: 3 hours (e.g., 9:00-12:00, 12:00-15:00)
- **Buffer Time**: 30 minutes before each appointment
- **Cutoff Time**: 30 minutes before window start for same-day
- **Weekend Logic**: Emergency services only (EMERGENCY_ONLY state)

### Technician Priority
Priority order for assignment: `['nate', 'nick', 'jahz']`
- Nate gets priority for complex jobs
- Nick handles standard maintenance
- Jahz covers overflow and emergency calls

### Express Zone Tiers
```yaml
express_zones:
  tier1: ["02170", "02169"]  # Quincy center - highest priority
  tier2: ["02171", "02351"]  # Quincy outskirts
  tier3: ["02184", "02186"]  # Extended service area
```

## Error Recovery & Fallback Behaviors

### Service Failure Handling

**HousecallPro API Unavailable**:
- Development: Returns mock data for testing
- Production: Shows error message with phone number
- User sees: "Online booking temporarily unavailable. Please call (617) 479-9911"

**Google Maps Failure**:
- Heat map component doesn't render
- Rest of page continues normally
- Fallback: Text-based service area list

**Database Connection Lost**:
- In-memory storage takes over temporarily
- Data persists until connection restored
- Warning logged to monitoring system

### Circuit Breaker States
```
CLOSED → (5 failures) → OPEN → (60 seconds) → HALF_OPEN → (success) → CLOSED
                           ↓                        ↓
                    Service Unavailable         Single test request
```

### User-Facing Error Messages
- **Booking Failure**: "We couldn't complete your booking. Please call us at (617) 479-9911"
- **Service Unavailable**: "This service is temporarily unavailable. Please try again later."
- **Capacity Full**: "We're fully booked today. Schedule for tomorrow or call for emergency service."

## Configuration File Structure (capacity.yml)

### Complete Schema
```yaml
# Capacity thresholds
thresholds:
  same_day_fee_waived: 0.35  # >= 35% capacity available
  limited_same_day: 0.10     # >= 10% capacity available

# Technician mapping to HousecallPro
tech_map:
  nate: "pro_19f45ddb23864f13ba5ffb20710e77e8"
  nick: "pro_784bb427ee27422f892b2db87dbdaf03"
  jahz: "pro_b0a7d40a10dc4477908cc808f62054ff"

# Service areas by priority
geos: ["02170", "02169", "02171", "02351", "02184"]

express_zones:
  tier1: ["02170", "02169"]
  tier2: ["02171", "02351"]
  tier3: ["02184"]

# Google Ads automation rules
ads_rules:
  brand_min_daily: 50         # Minimum $50/day for brand campaigns
  discovery_min_daily: 25     # Minimum $25/day for discovery
  same_day_boost_pct: 50      # +50% budget when high capacity
  limited_same_day_boost_pct: 25  # +25% when moderate capacity
  next_day_cut_pct: 30        # -30% when low capacity
  never_pause_brand: true     # Brand campaigns always run

# UI messaging for each state
ui_copy:
  SAME_DAY_FEE_WAIVED:
    headline: "Same-Day Service Available!"
    subhead: "Book now and we'll waive the $99 emergency fee"
    cta: "Book Same-Day Service"
    badge: "Fee Waived"
    urgent: true
  LIMITED_SAME_DAY:
    headline: "Limited Same-Day Spots"
    subhead: "We have a few appointments left today"
    cta: "Check Availability"
    badge: "Today"
    urgent: false
  NEXT_DAY:
    headline: "Next-Day Guarantee"
    subhead: "Schedule for tomorrow - guaranteed arrival time"
    cta: "Book for Tomorrow"
    badge: "Next Day"
    urgent: false
  EMERGENCY_ONLY:
    headline: "Emergency Service Available"
    subhead: "We're here for urgent plumbing issues"
    cta: "Call for Emergency"
    badge: "Emergency"
    urgent: true

# Promotional settings
fee_waive:
  promo_tag: "FEEWAIVED_SAMEDAY"
  discount_amount: 99
  utm_source: "website"
  utm_campaign: "capacity_based_promo"
```

## Development & Testing Workflow

### Local Development Setup
```bash
# 1. Clone repository
git clone [repository-url]
cd johnson-bros-plumbing

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# 4. Initialize database
npm run db:push

# 5. Seed development data
npm run seed:blog

# 6. Start development server
npm run dev
```

### Testing Different Capacity States
```bash
# Modify capacity.yml thresholds temporarily:
# High capacity (SAME_DAY_FEE_WAIVED)
thresholds:
  same_day_fee_waived: 0.0

# Low capacity (NEXT_DAY)
thresholds:
  same_day_fee_waived: 1.0
  limited_same_day: 1.0
```

### Testing Webhook Locally
```bash
# Use ngrok for local webhook testing
ngrok http 5000

# Update HousecallPro webhook URL to:
# https://[your-ngrok-id].ngrok.io/api/webhooks
```

### Simulating External Service Failures
```javascript
// In server/src/housecall.ts, force circuit breaker open:
this.circuitBreakerState = 'open';

// Test Google Maps failure by removing API key:
VITE_GOOGLE_MAPS_API_KEY=""
```

## Monitoring & Observability

### Key Metrics to Monitor

**System Health**:
- API response times (target < 200ms)
- Error rate (target < 1%)
- Circuit breaker state changes
- Database connection pool utilization

**Business Metrics**:
- Booking conversion rate (target > 5%)
- Average time to book (target < 3 minutes)
- Capacity utilization rate (target 70-85%)
- Express booking adoption rate

**Integration Health**:
- HousecallPro API success rate
- Webhook processing lag
- Google Maps API quota usage
- Cache hit rates

### Log Locations & Formats
```javascript
// Application logs
console.log('[Component] Message', { metadata });

// Capacity logs
[Capacity] Calculating capacity { date: "2024-01-01" }
[Capacity] State changed from NEXT_DAY to SAME_DAY_FEE_WAIVED

// API logs
[express] GET /api/endpoint 200 in 45ms

// Error logs
[ERROR] HousecallPro API failed { error: "Circuit breaker open" }
```

### Performance Bottlenecks
1. **HousecallPro API Calls**: Cache for 30 seconds minimum
2. **Database Queries**: Use indexes on frequently queried fields
3. **Frontend Bundle**: Lazy load heavy components
4. **Image Loading**: Use WebP format with fallbacks

## Business Continuity & Critical Path

### System Priority Matrix

**Critical (Site Won't Function)**:
- HousecallPro API for bookings
- Database for customer data storage
- Basic HTML/CSS rendering

**Important (Degraded Experience)**:
- Google Maps for heat map
- Reviews display
- Capacity-based messaging
- Express booking features

**Nice-to-Have (Can Be Disabled)**:
- Blog system
- Webhook analytics dashboard
- Social proof widgets
- Google Ads automation

### Minimum Viable Operation
The site can operate with:
1. Static service information
2. Phone number for bookings
3. Basic contact form
4. No real-time availability

## AI Agent Integration Guidelines

### Files That Should NEVER Be Modified
- `vite.config.ts` - Core build configuration
- `package.json` - Dependency management
- `drizzle.config.ts` - Database configuration
- `server/vite.ts` - Server setup

### Safe Customization Areas
- UI components in `client/src/components/`
- Page content in `client/src/pages/`
- Blog posts and content
- CSS styles and themes
- UI copy and messaging

### Changes Requiring Approval
- Capacity calculation thresholds
- Pricing or fee structures
- Service area modifications
- API integration changes
- Database schema updates

### Testing Requirements Before Completion
1. Verify application starts without errors
2. Test booking flow end-to-end
3. Confirm capacity calculations are correct
4. Validate API integrations are working
5. Check responsive design on mobile
6. Ensure no console errors in browser

### Validation Checklist
- [ ] All environment variables are set
- [ ] Database migrations applied successfully
- [ ] HousecallPro API responding
- [ ] Booking modal completes full flow
- [ ] Capacity state updates properly
- [ ] Express booking shows correct messaging
- [ ] Reviews and social proof load
- [ ] No TypeScript errors
- [ ] No failed API calls in network tab

## Performance Optimization Guidelines

### Caching Strategy
- **Capacity Data**: 30-second cache
- **Google Reviews**: 5-minute cache
- **Service List**: 1-hour cache
- **Blog Posts**: 24-hour cache client-side
- **Static Assets**: 1-year cache with versioning

### Database Optimization
```sql
-- Indexed fields for performance
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_appointments_customer ON appointments(customer_id);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_webhook_events_type ON webhook_events(event_type);
```

### Frontend Optimization
- Lazy load route components
- Image optimization with next-gen formats
- Bundle splitting by route
- Preload critical fonts
- Minify and compress assets

### API Rate Limiting
```javascript
// Public endpoints
rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // Limit to 100 requests
})

// Booking endpoint (stricter)
rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10 // Limit to 10 bookings per 15 min
})
```

## Deployment & Production Considerations

### Server Requirements
- **Minimum**: 2 CPU cores, 4GB RAM
- **Recommended**: 4 CPU cores, 8GB RAM
- **Node.js**: Version 18.x or higher
- **Storage**: 20GB minimum for logs and assets

### SSL/TLS Configuration
- Use Let's Encrypt for free SSL certificates
- Force HTTPS redirect for all traffic
- HSTS header with 1-year max-age
- TLS 1.2 minimum, prefer TLS 1.3

### Domain Configuration
```
A Record: @ → Your server IP
CNAME: www → yourdomain.com
MX Records: For email delivery
```

### Environment-Specific Settings
```javascript
// Production optimizations
if (process.env.NODE_ENV === 'production') {
  // Enable compression
  app.use(compression());
  
  // Serve static files with caching
  app.use(express.static('public', {
    maxAge: '1y',
    etag: false
  }));
  
  // Security headers
  app.use(helmet());
}
```

### Backup & Recovery
1. **Database**: Daily automated backups to S3
2. **Configuration**: Version control for capacity.yml
3. **Uploads**: Regular backup of customer data
4. **Recovery Time Objective**: 4 hours
5. **Recovery Point Objective**: 24 hours

### Zero-Downtime Deployment
```bash
# 1. Build new version
npm run build

# 2. Run migrations
npm run db:migrate

# 3. Start new instance
pm2 start ecosystem.config.js --env production

# 4. Health check
curl https://yourdomain.com/health

# 5. Switch traffic (load balancer)
# 6. Stop old instance
pm2 stop old-instance
```

## Troubleshooting Common Issues

### Booking Modal Won't Open
- Check browser console for errors
- Verify API endpoints are accessible
- Ensure HOUSECALL_PRO_API_KEY is set
- Check network tab for failed requests

### Capacity Always Shows "EMERGENCY_ONLY"
- Verify HousecallPro API is responding
- Check capacity.yml thresholds
- Ensure booking windows exist in HousecallPro
- Review capacity calculation logs

### Google Maps Not Loading
- Verify VITE_GOOGLE_MAPS_API_KEY is set
- Check API key restrictions
- Ensure Maps JavaScript API is enabled
- Review browser console for errors

### Webhooks Not Processing
- Verify webhook secret matches HousecallPro
- Check webhook endpoint is publicly accessible
- Review webhook event logs in database
- Ensure signature verification is working

## Conclusion

This website application serves as a comprehensive digital platform that:
1. Maximizes booking conversions through smart capacity management
2. Builds trust through authentic social proof
3. Operates efficiently via deep HousecallPro integration
4. Adapts dynamically to business conditions
5. Provides valuable business intelligence
6. Scales with business growth

The system successfully bridges the gap between traditional plumbing services and modern digital customer expectations, providing a competitive advantage in the local market.

This documentation provides the complete context needed for any developer or AI system to understand, maintain, and enhance the Johnson Bros. Plumbing website while maintaining alignment with business goals and technical requirements.
