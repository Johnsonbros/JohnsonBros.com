# Backlog

> **Updated**: 2026-01-16

---

## High Priority (Phase 2 Candidates)

| # | Task | Expected Output | Status |
|---|------|-----------------|--------|
| B-001 | Verify Admin Panel | Ensure admin routes work without crashing | 🔴 Queued |
| B-002 | Verify Blog System | Test creating/editing/viewing posts | 🔴 Queued |
| B-003 | Verify Static Pages | Check About, Contact, Service pages | 🔴 Queued |
| B-004 | Verify Forms | Test Contact & Booking forms (mocked) | 🔴 Queued |

## Missing Integrations (Degraded Mode)

| # | Task | Dependency | Impact |
|---|------|------------|--------|
| B-005 | Configure HousecallPro | `HOUSECALL_PRO_API_KEY` | Enable real bookings & capacity |
| B-006 | Configure OpenAI | `OPENAI_API_KEY` | Enable AI chat & agents |
| B-007 | Configure Google Maps | `GOOGLE_MAPS_API_KEY` | Enable maps & geocoding |
| B-008 | Configure Twilio | `TWILIO_ACCOUNT_SID` | Enable SMS & Voice |

## Production (Phase 3 Candidates)

- [ ] Review `TEST_COVERAGE_ANALYSIS.md` and increase coverage
- [ ] Complete `PRODUCTION_READINESS_CHECKLIST.md`
- [ ] Set up proper CI/CD pipeline
- [ ] Configure production logging/monitoring (Sentry?)

---

## Parked Items

Items moved here have enough context to pick up later but are not actively planned.

| # | Task | Context | Parked Date | Why Parked |
|---|------|---------|-------------|------------|
| - | - | - | - | - |

