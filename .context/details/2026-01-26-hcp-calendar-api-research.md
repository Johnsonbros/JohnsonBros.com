# HousecallPro Calendar & Scheduling API Research

**Created**: 2026-01-26 | **Purpose**: Building admin calendar mirror

---

## Summary

The HousecallPro API provides all necessary endpoints to build a calendar view that mirrors their scheduling system.

---

## Available Endpoints

### 1. Get Jobs (By Date Range)

**Endpoint:** `GET /jobs`

**Key Parameters:**
- `scheduled_start_min` / `scheduled_start_max` (ISO8601): Date range filters
- `employee_ids[]`: Filter by technician IDs
- `work_status[]`: unscheduled, scheduled, in_progress, completed, canceled
- `expand[]`: Include related data (attachments, appointments)

**Already Implemented:** Yes - `server/src/housecall.ts` line 311-323

**Response Structure:**
```typescript
{
  jobs: [
    {
      id: string,
      invoice_number: string,
      customer: { id: string },
      work_status: "scheduled" | "unscheduled" | "in_progress" | "completed" | "canceled",
      schedule: {
        scheduled_start: string (ISO8601),
        scheduled_end: string (ISO8601),
        arrival_window: string
      },
      assigned_employees: [
        { id: string, first_name: string, last_name: string, color_hex: string }
      ],
      total_amount: number (cents),
      outstanding_balance: number (cents)
    }
  ]
}
```

---

### 2. Get Estimates (By Date Range)

**Endpoint:** `GET /estimates`

**Key Parameters:** Same as jobs - date range, employee_ids, work_status

**Already Implemented:** Yes - `server/src/housecall.ts` line 327-338

---

### 3. Booking Windows (Customer-Facing Availability)

**Endpoint:** `GET /company/schedule_availability/booking_windows`

**Key Parameters:**
- `start_date` (YYYY-MM-DD): Starting date
- `end_date` (YYYY-MM-DD): Ending date

**Already Implemented:** Yes - `server/src/housecall.ts` line 284-309

**Response Structure:**
```typescript
{
  booking_windows: [
    {
      id: string,
      start_time: string (ISO8601),
      end_time: string (ISO8601),
      date: string (YYYY-MM-DD),
      available: boolean,
      employee_ids: string[]
    }
  ]
}
```

---

### 4. Get Employees

**Endpoint:** `GET /employees`

**Already Implemented:** Yes - `server/src/housecall.ts` line 272-282

**Response Structure:**
```typescript
{
  employees: [
    {
      id: string,
      first_name: string,
      last_name: string,
      color_hex: string,
      can_be_booked_online: boolean
    }
  ]
}
```

---

## Building the Calendar View

### Calendar Event Interface

```typescript
interface CalendarEvent {
  id: string;
  type: 'job' | 'estimate';
  title: string;
  startTime: string; // ISO8601
  endTime: string;
  status: 'unscheduled' | 'scheduled' | 'in_progress' | 'completed' | 'canceled';
  technicians: Array<{
    id: string;
    name: string;
    colorHex: string;
  }>;
  customerId: string;
  customer: { name: string; phone: string };
  amount: number;
  address: string;
}
```

### Query Pattern

```typescript
// Get all scheduled activities for a date range
const startDate = "2024-01-20T00:00:00Z";
const endDate = "2024-01-27T23:59:59Z";

// 1. Get jobs
const jobs = await hcpClient.getJobs({
  scheduled_start_min: startDate,
  scheduled_start_max: endDate,
  work_status: ['scheduled', 'in_progress'],
  expand: ['appointments']
});

// 2. Get estimates
const estimates = await hcpClient.getEstimates({
  scheduled_start_min: startDate,
  scheduled_start_max: endDate,
  work_status: ['scheduled']
});

// 3. Get employees for color coding
const employees = await hcpClient.getEmployees();

// 4. Combine and sort
const calendarEvents = [...jobs, ...estimates]
  .sort((a, b) => a.schedule.scheduled_start.localeCompare(b.schedule.scheduled_start));
```

---

## Implementation Status

**Already Implemented:**
- `getEmployees()` - Line 272
- `getBookingWindows(date)` - Line 284
- `getJobs(params)` - Line 311
- `getEstimates(params)` - Line 327

**NOT Yet Implemented:**
- `getCompanyScheduleAvailability()` - Business hours config
- `getJobAppointments(jobId)` - Individual appointment slots
- Job schedule update endpoints (PUT/POST/DELETE)

---

## Key Notes

1. **Date Format**: Use ISO8601 (e.g., `2024-01-20T10:30:00Z`)
2. **Circuit Breaker**: Existing client has automatic retry logic
3. **Caching**: GET requests cached 5-6 minutes
4. **Employee Colors**: Use `color_hex` for calendar color coding
5. **Expand Parameter**: Use `expand=appointments` for multi-slot jobs

---

## Authentication

```
Authorization: Token <HOUSECALL_PRO_API_KEY>
```

---

## File References

- **OpenAPI Spec**: `/housecall.v1.yaml`
- **HCP Client**: `/server/src/housecall.ts`
