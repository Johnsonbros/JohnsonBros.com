# Customer Portal Review (Housecall Pro v1 API)

## Purpose
Define the customer portal scope, the Housecall Pro API integration plan, and a phased delivery path that maps directly to the available endpoints in `housecall.v1.yaml`.【F:housecall.v1.yaml†L78-L3125】

---

## Product Goals
- Give customers a single destination to **view and manage** their jobs, estimates, and invoices.
- Enable **self-service scheduling** and **service requests** without contacting the office.
- Provide transparent job status, technician details, and upcoming appointment info.

---

## MVP Feature Set (Customer-Facing)

### 1) Customer Profile
**Capabilities**
- View customer record and contact details.
- Edit contact info and preferred phone/email.

**Housecall Pro API**
- `GET /customers` for lookup/search (by name, email, phone).【F:housecall.v1.yaml†L78-L177】
- `GET /customers/{customer_id}` for full profile data (addresses, notifications).【F:housecall.v1.yaml†L201-L233】
- `PUT /customers/{customer_id}` to update profile details.【F:housecall.v1.yaml†L233-L254】

---

### 2) Job History & Status
**Capabilities**
- List past + active jobs for the logged-in customer.
- View job details: schedule, status, assigned technician(s), outstanding balance.

**Housecall Pro API**
- `GET /jobs` filtered by `customer_id` for job list.【F:housecall.v1.yaml†L459-L656】
- `GET /jobs/{id}` for job details (schedule, status, assigned employees, balance).【F:housecall.v1.yaml†L675-L760】

---

### 3) Appointments & Scheduling
**Capabilities**
- View upcoming appointment(s) tied to a job.
- Self-service reschedule/cancel.
- Book new service windows.

**Housecall Pro API**
- `GET /jobs/{job_id}/appointments` to list appointments for a job.【F:housecall.v1.yaml†L992-L1017】
- `POST /jobs/{job_id}/appointments` to create appointments (scheduling).【F:housecall.v1.yaml†L1026-L1046】
- `PUT /jobs/{job_id}/appointments/{appointment_id}` to reschedule/update.【F:housecall.v1.yaml†L1047-L1079】
- `DELETE /jobs/{job_id}/appointments/{appointment_id}` to cancel appointments.【F:housecall.v1.yaml†L1080-L1096】
- `GET /company/schedule_availability/booking_windows` to show actual bookable time slots.【F:housecall.v1.yaml†L2288-L2326】

---

### 4) Estimates & Approvals
**Capabilities**
- List estimates.
- View estimate details + options (approval status, totals).
- Show attachments/links for proposals (if needed).

**Housecall Pro API**
- `GET /estimates` filtered by `customer_id` to list estimates.【F:housecall.v1.yaml†L1656-L1852】
- `GET /estimates/{estimate_id}` for estimate detail + options.【F:housecall.v1.yaml†L1877-L1985】
- `POST /estimates/{estimate_id}/options/{option_id}/attachments` to attach files (if required).【F:housecall.v1.yaml†L1986-L2032】
- `POST /estimates/{estimate_id}/options/{option_id}/links` to attach links (if required).【F:housecall.v1.yaml†L2033-L2050】

---

### 5) Invoices (View-Only)
**Capabilities**
- Show open, paid, and historical invoices.
- Provide invoice detail per job.
- No in-portal payment processing.

**Housecall Pro API**
- `GET /jobs/{job_id}/invoices` to display job invoice records.【F:housecall.v1.yaml†L1415-L1441】
- `GET /invoices` for a consolidated invoice list with status filters.【F:housecall.v1.yaml†L3007-L3125】

---

### 6) Request Service (New Work)
**Capabilities**
- Customer submits a new service request (lead).
- Display lead status if desired.

**Housecall Pro API**
- `POST /leads` to create a service request tied to an existing customer.【F:housecall.v1.yaml†L2661-L2683】
- `GET /leads` or `GET /leads/{id}` to show request status (optional).【F:housecall.v1.yaml†L2684-L2805】

---

## UX / Page Map

**1. Login / Authentication**
> Implementation depends on how Housecall Pro access tokens are stored/issued.

**2. Dashboard**
- Upcoming appointment
- Quick links to: Jobs, Estimates, Invoices, Request Service

**3. Jobs**
- Job list with status + dates
- Job detail view (schedule, tech, notes, balance)

**4. Schedule**
- View upcoming appointment(s)
- Self-service reschedule
- Book new slot (if allowed)

**5. Estimates**
- List of estimates + status
- Detailed view with options and totals

**6. Invoices**
- Open invoices list
- Paid invoices history
- Job-level invoice detail

**7. Profile**
- Contact info
- Address management

---

## Data & API Integration Notes

### Filtering & Linking
Use `customer_id` from the authenticated customer profile to filter:
- Jobs, estimates, and leads lists (filter by `customer_id`).【F:housecall.v1.yaml†L459-L656】【F:housecall.v1.yaml†L1656-L1852】【F:housecall.v1.yaml†L2684-L2775】

### Scheduling Inputs
Use Housecall booking window availability in the scheduling UI so the customer only sees valid timeslots. Customers can book, reschedule, or cancel appointments directly in the portal.【F:housecall.v1.yaml†L2288-L2326】

### Invoice Availability
Invoice data depends on progressive invoicing configuration (as indicated in API descriptions).【F:housecall.v1.yaml†L1415-L1441】【F:housecall.v1.yaml†L3007-L3044】

---

## Phased Delivery Plan

### Phase 1 (MVP)
- Customer profile
- Jobs list + detail
- Estimates list + detail
- Invoices list + detail

### Phase 2 (Scheduling & Requests)
- Appointments + reschedule/cancel
- Booking windows + new booking flow
- Request Service (lead creation)

### Phase 3 (Enhancements)
- Estimate attachments/links
- Notifications / alerts
- Rich job notes or messaging (if supported)

---

## Open Questions / Decisions Needed
1. **Authentication**: How will customer identity map to Housecall Pro customer records?
2. **Data Access**: Are we using Company API Key or OAuth token flow for portal sessions?
