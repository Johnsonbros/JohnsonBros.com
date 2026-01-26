# HousecallPro Replacement Research

**Last Updated**: 2026-01-26
**Purpose**: Document research for building an in-house scheduling/booking system to replace HousecallPro dependency
**Status**: Research Phase

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current HousecallPro Usage Analysis](#current-housecallpro-usage-analysis)
3. [HousecallPro Feature Analysis](#housecallpro-feature-analysis)
4. [Feature Matrix: HCP to Local Replacement](#feature-matrix-hcp-to-local-replacement)
5. [Data Model Requirements](#data-model-requirements)
6. [API Endpoints Currently in Use](#api-endpoints-currently-in-use)
7. [Webhook Events Being Processed](#webhook-events-being-processed)
8. [Migration Strategy](#migration-strategy)
9. [Architecture Recommendations](#architecture-recommendations)
10. [Risk Assessment](#risk-assessment)
11. [Timeline Estimates](#timeline-estimates)

---

## Executive Summary

Johnson Bros. Plumbing currently relies heavily on HousecallPro (HCP) for:
- Customer management (CRM)
- Job scheduling and dispatch
- Availability/booking windows
- Customer notifications
- Invoice management (through HCP, not directly integrated)

**Key Finding**: The codebase uses HCP primarily as a **booking backend** and **customer database**, with sophisticated local logic for capacity calculation, UI messaging, and AI-powered booking agents. This architecture pattern suggests a gradual migration is feasible.

**Recommendation**: Phase 1 should focus on building a **local scheduling engine** while maintaining HCP sync for legacy operations. This reduces risk while building the core replacement.

---

## Current HousecallPro Usage Analysis

### Files Using HousecallPro

| File | Purpose | HCP Dependency Level |
|------|---------|---------------------|
| `server/src/housecall.ts` | HCP client with circuit breaker | **CRITICAL** |
| `src/booker.ts` | MCP booking tools (11+ tools) | **CRITICAL** |
| `server/src/capacity.ts` | Capacity calculations | **HIGH** - fetches booking windows |
| `server/src/webhooks.ts` | Webhook processing | **HIGH** - receives all HCP events |
| `server/lib/smsBookingAgent.ts` | SMS booking agent | **MEDIUM** - uses MCP tools |
| `server/lib/aiChat.ts` | Web chat agent | **MEDIUM** - uses MCP tools |

### HCP Client Architecture (server/src/housecall.ts)

The current implementation includes:
- **Circuit Breaker Pattern**: Opens after 5 consecutive failures, 60-second recovery
- **Rate Limiting**: Respects HCP API limits
- **Error Classification**: Structured error handling for auth, not-found, server errors
- **Correlation IDs**: Full request tracing

```typescript
// Key constants from housecall.ts
const HCP_BASE = "https://api.housecallpro.com";
const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_TIMEOUT = 60000; // 60 seconds
```

---

## HousecallPro Feature Analysis

### Core HCP Features (Full Platform)

Based on HousecallPro's documented feature set:

| Feature Category | Features | Currently Used by JohnsonBros |
|-----------------|----------|------------------------------|
| **Scheduling** | Calendar, drag-drop dispatch, recurring jobs, booking windows | **YES** - booking_windows API |
| **Customer Management** | Customer records, addresses, notes, history | **YES** - customers API |
| **Job Management** | Create jobs, assign techs, job notes, status tracking | **YES** - jobs API |
| **Estimates** | Create, send, convert to jobs | **NO** - not integrated |
| **Invoicing** | Generate, send, payments | **NO** - not integrated |
| **Employee Management** | Tech profiles, schedules, GPS tracking | **PARTIAL** - employee IDs only |
| **Notifications** | SMS/email to customers | **YES** - via HCP (not custom) |
| **Leads** | Lead capture, conversion tracking | **PARTIAL** - leads API |
| **Appointments** | Arrival windows, confirmations | **YES** - appointments API |
| **Mobile App** | Tech mobile app for field service | **N/A** - HCP native |
| **Reporting** | Business analytics, revenue reports | **NO** - using local analytics |
| **Payments** | Card processing, financing | **NO** - not integrated |
| **Online Booking** | Self-service customer booking | **CUSTOM** - using MCP tools |
| **Quickbooks Integration** | Accounting sync | **UNKNOWN** |

### Features Actually Used (from codebase analysis)

**Heavily Used:**
1. `/company/schedule_availability/booking_windows` - Core capacity/scheduling
2. `/customers` - Customer lookup, creation, search
3. `/jobs` - Job creation, status, notes
4. `/appointments` - Appointment scheduling within jobs
5. `/leads` - Lead creation for out-of-area customers

**Moderately Used:**
6. `/customers/{id}/addresses` - Address management
7. `/jobs/{id}/notes` - Adding notes to jobs
8. `/employees` - Employee ID references

**Not Used (but available):**
- `/estimates`
- `/invoices`
- `/payments`
- `/tags`
- `/price_book`

---

## Feature Matrix: HCP to Local Replacement

### Priority 1: Core Booking System (MVP)

| HCP Feature | Local Replacement | Complexity | Existing Tables |
|-------------|-------------------|------------|-----------------|
| Booking Windows | `booking_windows` table + scheduling algorithm | **HIGH** | None - needs creation |
| Customer Records | Extend `customers` table | **LOW** | `customers` exists |
| Job Creation | `jobs` table | **MEDIUM** | None - needs creation |
| Appointment Scheduling | `appointments` table | **LOW** | `appointments` exists |
| Service Area Validation | `config/capacity.yml` + geocoding | **DONE** | Already implemented |
| Capacity Calculation | `CapacityCalculator` | **DONE** | Already implemented |

### Priority 2: Operational Features

| HCP Feature | Local Replacement | Complexity | Notes |
|-------------|-------------------|------------|-------|
| Customer Addresses | `customer_addresses` table | **LOW** | Already exists |
| Job Notes | `job_notes` table | **LOW** | Simple CRUD |
| Tech Assignment | `job_assignments` table | **MEDIUM** | Need employee/tech table |
| Job Status Tracking | `jobs.status` enum + history | **MEDIUM** | State machine needed |
| Customer Notifications | Twilio integration | **DONE** | Already have SMS/voice |

### Priority 3: Advanced Features

| HCP Feature | Local Replacement | Complexity | Notes |
|-------------|-------------------|------------|-------|
| Tech Scheduling | Employee availability system | **HIGH** | Calendar + constraints |
| Recurring Jobs | Recurrence rules engine | **HIGH** | RRULE-like system |
| Estimates | `estimates` table + workflow | **MEDIUM** | PDF generation needed |
| Invoicing | `invoices` table + payments | **HIGH** | Consider Stripe integration |
| Mobile Tech App | React Native or PWA | **VERY HIGH** | Separate project |

### Priority 4: Nice-to-Have

| HCP Feature | Local Replacement | Complexity | Notes |
|-------------|-------------------|------------|-------|
| GPS Tracking | Location services | **HIGH** | Privacy considerations |
| Parts Inventory | Inventory system | **HIGH** | ERP-like scope |
| Accounting Sync | Quickbooks API | **MEDIUM** | Third-party integration |

---

## Data Model Requirements

### New Tables Needed

#### 1. Jobs Table (Core)

```sql
CREATE TABLE jobs (
  id SERIAL PRIMARY KEY,
  job_number TEXT UNIQUE NOT NULL,  -- "JB-2026-00001"
  customer_id INTEGER REFERENCES customers(id) NOT NULL,
  address_id INTEGER REFERENCES customer_addresses(id),

  -- Scheduling
  scheduled_start TIMESTAMP,
  scheduled_end TIMESTAMP,
  arrival_window_start TIMESTAMP,
  arrival_window_end TIMESTAMP,

  -- Status
  status TEXT NOT NULL DEFAULT 'scheduled',  -- scheduled, dispatched, in_progress, completed, cancelled

  -- Assignment
  assigned_tech_id INTEGER REFERENCES employees(id),

  -- Details
  description TEXT NOT NULL,
  service_type TEXT,
  estimated_duration_minutes INTEGER,

  -- Pricing
  estimated_total DECIMAL(10,2),
  actual_total DECIMAL(10,2),

  -- Source tracking
  lead_source TEXT,
  booking_channel TEXT,  -- web_chat, sms, voice, manual

  -- Metadata
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,

  -- Legacy sync
  housecall_pro_id TEXT,  -- For migration period
  synced_at TIMESTAMP
);

CREATE INDEX jobs_customer_idx ON jobs(customer_id);
CREATE INDEX jobs_status_idx ON jobs(status);
CREATE INDEX jobs_scheduled_idx ON jobs(scheduled_start);
CREATE INDEX jobs_tech_idx ON jobs(assigned_tech_id);
CREATE INDEX jobs_hcp_id_idx ON jobs(housecall_pro_id);
```

#### 2. Employees/Technicians Table

```sql
CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,

  -- Role
  role TEXT NOT NULL DEFAULT 'technician',  -- technician, dispatcher, admin
  is_active BOOLEAN DEFAULT TRUE,

  -- Scheduling
  default_start_time TIME DEFAULT '07:00',
  default_end_time TIME DEFAULT '17:00',
  working_days INTEGER[] DEFAULT '{1,2,3,4,5}',  -- Mon=1 ... Sun=7

  -- Capacity
  max_jobs_per_day INTEGER DEFAULT 6,
  skills TEXT[],  -- ['drain', 'water_heater', 'gas_line']

  -- Location
  home_zip TEXT,
  service_radius_miles INTEGER DEFAULT 25,

  -- Legacy sync
  housecall_pro_id TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. Booking Windows Table

```sql
CREATE TABLE booking_windows (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  -- Capacity
  max_slots INTEGER NOT NULL DEFAULT 2,
  booked_slots INTEGER NOT NULL DEFAULT 0,

  -- Availability
  is_available BOOLEAN DEFAULT TRUE,
  blocked_reason TEXT,

  -- Employee-specific windows (optional)
  employee_id INTEGER REFERENCES employees(id),

  UNIQUE(date, start_time, end_time, employee_id)
);

CREATE INDEX booking_windows_date_idx ON booking_windows(date);
CREATE INDEX booking_windows_available_idx ON booking_windows(is_available, date);
```

#### 4. Job Status History

```sql
CREATE TABLE job_status_history (
  id SERIAL PRIMARY KEY,
  job_id INTEGER REFERENCES jobs(id) NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by INTEGER REFERENCES employees(id),
  changed_at TIMESTAMP DEFAULT NOW(),
  notes TEXT
);

CREATE INDEX job_status_history_job_idx ON job_status_history(job_id);
```

#### 5. Job Notes

```sql
CREATE TABLE job_notes (
  id SERIAL PRIMARY KEY,
  job_id INTEGER REFERENCES jobs(id) NOT NULL,
  author_type TEXT NOT NULL,  -- 'employee', 'ai_agent', 'customer', 'system'
  author_id INTEGER,  -- employee_id if applicable
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT TRUE,  -- Hide from customer
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX job_notes_job_idx ON job_notes(job_id);
```

### Existing Tables to Extend

#### customers (extend existing)

Add columns:
```sql
ALTER TABLE customers ADD COLUMN default_address_id INTEGER REFERENCES customer_addresses(id);
ALTER TABLE customers ADD COLUMN customer_type TEXT DEFAULT 'residential';  -- residential, commercial
ALTER TABLE customers ADD COLUMN is_member BOOLEAN DEFAULT FALSE;  -- maintenance plan member
ALTER TABLE customers ADD COLUMN total_jobs INTEGER DEFAULT 0;
ALTER TABLE customers ADD COLUMN total_revenue DECIMAL(10,2) DEFAULT 0;
ALTER TABLE customers ADD COLUMN last_service_date TIMESTAMP;
ALTER TABLE customers ADD COLUMN preferred_tech_id INTEGER REFERENCES employees(id);
```

### Entity Relationship Diagram

```
+------------------+       +------------------+       +------------------+
|    customers     |       |       jobs       |       |    employees     |
+------------------+       +------------------+       +------------------+
| id (PK)          |<------| customer_id (FK) |       | id (PK)          |
| first_name       |       | id (PK)          |------>| assigned_tech_id |
| last_name        |       | job_number       |       | first_name       |
| email            |       | status           |       | last_name        |
| phone            |       | scheduled_start  |       | role             |
| housecall_pro_id |       | description      |       | skills[]         |
+------------------+       | housecall_pro_id |       +------------------+
        |                  +------------------+               |
        |                          |                          |
        v                          v                          v
+------------------+       +------------------+       +------------------+
|customer_addresses|       |    job_notes     |       | booking_windows  |
+------------------+       +------------------+       +------------------+
| id (PK)          |       | id (PK)          |       | id (PK)          |
| customer_id (FK) |       | job_id (FK)      |       | date             |
| street           |       | content          |       | start_time       |
| city, state, zip |       | author_type      |       | end_time         |
| latitude/longitude       | created_at       |       | employee_id (FK) |
+------------------+       +------------------+       | max_slots        |
                                                      +------------------+
```

---

## API Endpoints Currently in Use

### HousecallPro API Calls (from booker.ts)

| Method | Endpoint | Purpose | Frequency |
|--------|----------|---------|-----------|
| GET | `/company/schedule_availability/booking_windows` | Fetch available slots | **HIGH** - every booking check |
| GET | `/customers?q={phone}` | Customer lookup by phone | **HIGH** - every booking |
| POST | `/customers` | Create new customer | **MEDIUM** - new customers |
| GET | `/customers/{id}` | Get customer details | **LOW** |
| POST | `/customers/{id}/addresses` | Add customer address | **MEDIUM** |
| GET | `/jobs?customer_id={id}` | Get customer's jobs | **MEDIUM** |
| GET | `/jobs/{id}` | Get job details | **LOW** |
| POST | `/jobs` | Create new job | **HIGH** - every booking |
| POST | `/jobs/{id}/appointments` | Add appointment to job | **HIGH** - every booking |
| POST | `/jobs/{id}/notes` | Add note to job | **MEDIUM** |
| POST | `/leads` | Create lead (out-of-area) | **LOW** |
| GET | `/employees` | Get technician list | **LOW** |

### Local API Endpoints Needed (Replacement)

```typescript
// Booking System
POST   /api/v2/bookings                    // Create booking (replaces HCP job creation)
GET    /api/v2/bookings/availability       // Get available slots (replaces booking_windows)
GET    /api/v2/bookings/{id}               // Get booking details
PATCH  /api/v2/bookings/{id}               // Update booking (reschedule)
DELETE /api/v2/bookings/{id}               // Cancel booking

// Customer Management
GET    /api/v2/customers                   // List/search customers
POST   /api/v2/customers                   // Create customer
GET    /api/v2/customers/{id}              // Get customer
PATCH  /api/v2/customers/{id}              // Update customer
GET    /api/v2/customers/{id}/jobs         // Get customer's jobs
GET    /api/v2/customers/{id}/addresses    // Get customer addresses
POST   /api/v2/customers/{id}/addresses    // Add address

// Job Management
GET    /api/v2/jobs                        // List jobs (with filters)
GET    /api/v2/jobs/{id}                   // Get job details
PATCH  /api/v2/jobs/{id}                   // Update job
POST   /api/v2/jobs/{id}/notes             // Add note
PATCH  /api/v2/jobs/{id}/status            // Update status

// Employee/Tech Management
GET    /api/v2/employees                   // List employees
GET    /api/v2/employees/{id}/schedule     // Get tech schedule
PATCH  /api/v2/employees/{id}/schedule     // Update schedule

// Capacity (extends existing)
GET    /api/v2/capacity                    // Enhanced capacity endpoint
GET    /api/v2/capacity/express            // Express window availability
```

---

## Webhook Events Being Processed

### Current Webhook Integration (server/src/webhooks.ts)

The codebase processes these HCP webhook events:

| Event Type | Category | Current Processing | Local Replacement |
|------------|----------|-------------------|-------------------|
| `customer.created` | Customer | Store in `webhookEvents` | Direct DB insert |
| `customer.updated` | Customer | Store in `webhookEvents` | Direct DB update |
| `job.created` | Job | Store in `webhookEvents` | Internal job service |
| `job.updated` | Job | Store in `webhookEvents` | Internal job service |
| `job.completed` | Job | Store + process analytics | Trigger notifications |
| `appointment.scheduled` | Appointment | Store in `webhookEvents` | Calendar update |
| `appointment.completed` | Appointment | Store + analytics | Trigger follow-up |
| `estimate.created` | Estimate | Store in `webhookEvents` | Not needed initially |
| `invoice.created` | Invoice | Store in `webhookEvents` | Not needed initially |
| `lead.created` | Lead | Store in `webhookEvents` | Direct lead handling |

### Webhook Data Storage

Current schema stores all webhook events in:
- `webhookEvents` - Raw event storage
- `webhookProcessedData` - Parsed/denormalized data
- `webhookEventTags` - Event categorization
- `webhookAnalytics` - Aggregated metrics

**Recommendation**: Keep this structure for the local system. Events from the local booking system can be processed through the same pipeline for consistency.

---

## Migration Strategy

### Phase 1: Parallel Operation (Months 1-2)

**Goal**: Build local booking system that syncs with HCP

1. **Database Setup**
   - Create new tables (jobs, employees, booking_windows)
   - Add `housecall_pro_id` columns for sync
   - Build migration scripts

2. **Dual-Write System**
   - All bookings go to local DB first
   - Sync to HCP for legacy operations
   - HCP webhooks update local DB

3. **Read from Local**
   - MCP tools read from local DB
   - Fall back to HCP if local data missing
   - Monitor discrepancies

**Deliverables**:
- Local job/booking tables
- Sync service (local -> HCP)
- Webhook processor updates
- MCP tool modifications

### Phase 2: Local-First (Months 3-4)

**Goal**: Local system becomes primary, HCP becomes backup

1. **Scheduling Engine**
   - Build local availability calculation
   - Implement booking window generation
   - Handle tech assignment logic

2. **Capacity Calculator Migration**
   - Update `CapacityCalculator` to use local data
   - Maintain HCP fallback
   - Performance testing

3. **Notification System**
   - Customer SMS confirmations (Twilio)
   - Email notifications
   - Reminder scheduling

**Deliverables**:
- Local scheduling algorithm
- Notification service
- Updated capacity system
- Admin dashboard updates

### Phase 3: HCP Deprecation (Months 5-6)

**Goal**: Remove HCP dependency for core operations

1. **Cut Over**
   - Disable HCP writes for new bookings
   - Historical data export from HCP
   - Legacy job read-only mode

2. **Feature Completion**
   - Estimates (if needed)
   - Basic invoicing
   - Employee scheduling

3. **Cleanup**
   - Remove HCP sync code
   - Archive HCP integration
   - Documentation update

**Deliverables**:
- HCP-free booking system
- Data migration completed
- New admin tools
- Updated documentation

### Phase 4: Enhancement (Ongoing)

- Mobile tech app
- Advanced scheduling optimization
- Customer portal
- Reporting enhancements

---

## Architecture Recommendations

### Core Principles

1. **Event-Driven Architecture**
   - All state changes emit events
   - Enables audit trails
   - Supports notifications
   - Allows async processing

2. **Service Separation**
   - `BookingService` - Handles bookings
   - `SchedulingService` - Manages availability
   - `NotificationService` - Sends alerts
   - `SyncService` - HCP synchronization (Phase 1-2)

3. **Database Transactions**
   - Booking creation is atomic
   - Use optimistic locking for slots
   - Idempotent operations where possible

### Proposed Service Architecture

```
+------------------+     +------------------+     +------------------+
|   MCP Tools      |     |   Web Chat AI    |     |   SMS Agent      |
|   (booker.ts)    |     |   (aiChat.ts)    |     |(smsBookingAgent) |
+--------+---------+     +--------+---------+     +--------+---------+
         |                        |                        |
         v                        v                        v
+------------------------------------------------------------------+
|                         BookingService                           |
|   - createBooking()     - cancelBooking()                        |
|   - rescheduleBooking() - getBookingDetails()                    |
+------------------------------------------------------------------+
         |                        |                        |
         v                        v                        v
+------------------+     +------------------+     +------------------+
| SchedulingService|     |CustomerService   |     |NotificationService|
| - getAvailability|     | - findOrCreate() |     | - sendConfirmation|
| - reserveSlot()  |     | - updateCustomer |     | - sendReminder()  |
| - releaseSlot()  |     | - getHistory()   |     | - sendCancellation|
+------------------+     +------------------+     +------------------+
         |                        |                        |
         v                        v                        v
+------------------------------------------------------------------+
|                         PostgreSQL                               |
|   jobs | customers | booking_windows | employees | job_notes     |
+------------------------------------------------------------------+
         |
         v (Phase 1-2 only)
+------------------+
|   SyncService    |
| - syncToHCP()    |
| - syncFromHCP()  |
+------------------+
         |
         v
+------------------+
| HousecallPro API |
+------------------+
```

### Key Design Decisions

1. **Booking Window Generation**
   - Pre-generate windows for 30 days ahead
   - Nightly batch job to extend
   - Real-time adjustment on booking

2. **Slot Reservation**
   - Soft lock during booking flow (5 min TTL)
   - Hard reservation on confirmation
   - Automatic release on timeout

3. **Tech Assignment**
   - Initial: Manual/default tech
   - Future: Algorithm based on skills, location, availability

4. **Capacity Calculation**
   - Keep existing `CapacityCalculator` logic
   - Replace data source from HCP to local
   - Same four states (SAME_DAY_FEE_WAIVED, LIMITED_SAME_DAY, NEXT_DAY, EMERGENCY_ONLY)

---

## Risk Assessment

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Data loss during migration | Low | High | Comprehensive backup, dual-write period |
| Scheduling conflicts | Medium | High | Optimistic locking, reservation system |
| HCP API deprecation | Low | High | Accelerate migration timeline |
| Performance degradation | Medium | Medium | Caching, query optimization |
| Feature gaps | High | Medium | Prioritize MVP, document gaps |

### Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Booking downtime | Low | High | Fallback to HCP during transition |
| Customer notification failures | Medium | High | Twilio already integrated, monitor delivery |
| Staff training needed | High | Medium | Documentation, gradual rollout |
| Lost HCP mobile app | High | High | PWA or native app (separate project) |

### Operational Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Increased maintenance burden | High | Medium | Good architecture, testing, docs |
| Loss of HCP support | Medium | Low | This is the goal - own the data |
| Integration complexity | Medium | Medium | Clear API contracts, versioning |

---

## Timeline Estimates

### Development Effort by Feature

| Feature | Estimated Hours | Priority | Phase |
|---------|----------------|----------|-------|
| Database schema/migrations | 16h | P1 | 1 |
| Jobs CRUD service | 24h | P1 | 1 |
| Customer service updates | 8h | P1 | 1 |
| HCP sync service | 32h | P1 | 1 |
| Booking window generation | 24h | P1 | 2 |
| Scheduling algorithm | 40h | P1 | 2 |
| MCP tool migration | 24h | P1 | 2 |
| Capacity calculator updates | 16h | P1 | 2 |
| Notification service | 24h | P2 | 2 |
| Employee scheduling | 32h | P2 | 3 |
| Admin dashboard updates | 40h | P2 | 3 |
| Testing & QA | 40h | P1 | All |
| Documentation | 16h | P2 | All |
| **Total** | **336h** (~8.5 weeks FTE) | | |

### Phase Timeline

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| Phase 1: Parallel Operation | 8 weeks | Week 1 | Week 8 |
| Phase 2: Local-First | 8 weeks | Week 9 | Week 16 |
| Phase 3: HCP Deprecation | 8 weeks | Week 17 | Week 24 |
| Phase 4: Enhancement | Ongoing | Week 25+ | - |

**Total MVP Timeline**: ~6 months to full HCP independence

---

## Cost-Benefit Analysis

### Current HCP Costs (Estimated)

- HCP subscription: ~$100-300/month
- API call overhead: Latency, rate limits
- Vendor dependency: No control over features/pricing

### Replacement Investment

- Development: 336 hours @ $X/hour
- Ongoing maintenance: ~10 hours/month
- Infrastructure: Existing (PostgreSQL, Twilio)

### Benefits

1. **Cost Reduction**: Eliminate HCP subscription
2. **Flexibility**: Build features specific to JB needs
3. **Data Ownership**: Full control over customer data
4. **Performance**: No external API latency
5. **Integration**: Deeper integration with AI agents
6. **Customization**: Capacity algorithm fully customizable

---

## Next Steps

1. **Validate this research** with stakeholders
2. **Prioritize Phase 1 features** based on business needs
3. **Create detailed technical design** for booking service
4. **Set up development branch** for migration work
5. **Define success metrics** for each phase

---

## Appendix A: HousecallPro API Reference

### Authentication

```
Authorization: Token {HOUSECALL_API_KEY}
Content-Type: application/json
Base URL: https://api.housecallpro.com
```

### Rate Limits

- Standard: 100 requests/minute
- Burst: 200 requests/minute (short periods)
- Circuit breaker recommended at 5 consecutive failures

### Key Endpoints Used

```
GET  /company/schedule_availability/booking_windows
     ?start_date=YYYY-MM-DD&show_for_days=N

GET  /customers?q={search_term}&page_size=N

POST /customers
     { first_name, last_name, mobile_number, email, addresses[], tags[] }

POST /jobs
     { customer_id, address_id, description, lead_source, tags[], schedule }

POST /jobs/{id}/appointments
     { start_time, end_time, arrival_window_in_minutes }

POST /jobs/{id}/notes
     { content }
```

---

## Appendix B: Existing Codebase Reference

### Key Files

- `/server/src/housecall.ts` - HCP client implementation
- `/src/booker.ts` - MCP booking tools
- `/server/src/capacity.ts` - Capacity calculation
- `/server/src/webhooks.ts` - Webhook processing
- `/shared/schema.ts` - Database schema
- `/config/capacity.yml` - Service area configuration

### Existing Tables (Relevant)

- `customers` - Customer records
- `customer_addresses` - Customer addresses
- `appointments` - Basic appointments (local)
- `webhookEvents` - HCP webhook storage
- `webhookProcessedData` - Parsed webhook data
- `jobLocations` - Job location tracking
- `checkIns` - Activity feed

### MCP Tools (from booker.ts)

1. `book_service_call` - Main booking tool
2. `send_phone_verification` - SMS verification
3. `search_availability` - Check available slots
4. `get_capacity` - Get capacity state
5. `get_quote` - Price estimates
6. `emergency_help` - Emergency guidance
7. `get_services` - List services
8. `lookup_customer` - Customer verification
9. `request_reschedule_callback` - Reschedule request
10. `request_cancellation_callback` - Cancellation request
11. `get_job_status` - Job status lookup
