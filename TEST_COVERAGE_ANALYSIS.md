# Test Coverage Analysis
**Generated:** 2026-01-07
**Status:** No existing tests found

## Executive Summary

This codebase currently has **ZERO test coverage** despite containing complex business logic that directly impacts revenue, security, and data integrity. This analysis identifies critical gaps and provides a prioritized roadmap for implementing comprehensive test coverage.

### Critical Findings
- ❌ **0 test files** found (`.test.ts`, `.spec.ts`, etc.)
- ❌ **No testing framework** installed (Jest, Vitest, Playwright)
- ❌ **No test scripts** in package.json
- ✅ **Strong TypeScript typing** and Zod validation throughout

---

## Priority Test Coverage Recommendations

### 🔴 CRITICAL PRIORITY - Revenue Impact

#### 1. Booking Capacity Calculation
**File:** `server/src/capacity.ts`
**Risk Level:** HIGH - Directly affects customer bookings and revenue

**Current Gaps:**
- No tests for same-day vs. next-day fee logic
- No tests for express window calculations
- No tests for technician availability calculations
- No tests for caching behavior (5-minute TTL)
- No edge case testing (holidays, after-hours, no available techs)

**Recommended Test Cases:**
```typescript
describe('Capacity Calculation', () => {
  describe('calculateNextAvailableSlot()', () => {
    it('should calculate correct slot with multiple techs available')
    it('should apply same-day fee when booking within 24 hours')
    it('should apply express window fee correctly')
    it('should return null when no techs available')
    it('should respect technician working hours')
    it('should handle timezone conversions correctly')
  })

  describe('Caching', () => {
    it('should cache results for 5 minutes')
    it('should invalidate cache after TTL expires')
    it('should handle cache misses gracefully')
  })
})
```

**Estimated Test Files:** 1 unit test file, 300+ lines

---

#### 2. Authentication & Security
**File:** `server/src/auth.ts`
**Risk Level:** CRITICAL - Security vulnerabilities = business risk

**Current Gaps:**
- No tests for password hashing/verification
- No tests for account lockout logic (5 failed attempts → 30 min lockout)
- No tests for session rotation (every hour)
- No tests for session hijacking prevention
- No tests for CSRF token validation

**Recommended Test Cases:**
```typescript
describe('Authentication', () => {
  describe('Password Security', () => {
    it('should hash passwords with bcrypt cost factor 10')
    it('should verify correct passwords')
    it('should reject incorrect passwords')
    it('should prevent timing attacks')
  })

  describe('Account Lockout', () => {
    it('should lock account after 5 failed attempts')
    it('should unlock account after 30 minutes')
    it('should reset failed attempts counter on successful login')
    it('should not count failed attempts for non-existent users')
  })

  describe('Session Management', () => {
    it('should rotate session ID every hour')
    it('should extend session activity on user interaction')
    it('should invalidate expired sessions')
    it('should prevent session fixation attacks')
    it('should handle concurrent sessions correctly')
  })
})
```

**Estimated Test Files:** 1 unit test file + 1 integration test file, 500+ lines

---

#### 3. SMS Booking Agent
**File:** `server/lib/smsBookingAgent.ts`
**Risk Level:** HIGH - Automated customer interaction affects satisfaction

**Current Gaps:**
- No tests for MCP tool execution
- No tests for OpenAI agent responses
- No tests for conversation state management
- No tests for SMS scheduling (3:57 minute delay)
- No tests for error handling and fallback behavior

**Recommended Test Cases:**
```typescript
describe('SMS Booking Agent', () => {
  describe('MCP Integration', () => {
    it('should connect to MCP server successfully')
    it('should handle MCP connection failures gracefully')
    it('should execute customer lookup tool')
    it('should execute slot availability tool')
    it('should handle MCP tool execution errors')
  })

  describe('Conversation Management', () => {
    it('should maintain conversation history')
    it('should track conversation state correctly')
    it('should handle multi-turn conversations')
    it('should persist conversation to database')
  })

  describe('SMS Scheduling', () => {
    it('should schedule SMS with 3:57 minute delay')
    it('should handle Twilio API errors')
    it('should retry failed SMS sends')
  })
})
```

**Estimated Test Files:** 1 integration test file, 400+ lines

---

### 🟠 HIGH PRIORITY - Data Integrity

#### 4. A/B Testing System
**Files:** `server/src/experimentManagement.ts`, `server/src/abTestingRoutes.ts`
**Risk Level:** MEDIUM-HIGH - Invalid calculations = bad business decisions

**Current Gaps:**
- No tests for z-score calculations
- No tests for confidence interval computation
- No tests for sample size calculations
- No tests for variant assignment algorithm
- No tests for statistical significance determination

**Recommended Test Cases:**
```typescript
describe('A/B Testing', () => {
  describe('Statistical Calculations', () => {
    it('should calculate z-score correctly for known datasets')
    it('should compute confidence intervals accurately')
    it('should determine statistical significance (p < 0.05)')
    it('should calculate required sample size')
    it('should handle edge cases (0% conversion, 100% conversion)')
  })

  describe('Variant Assignment', () => {
    it('should assign variants based on weights')
    it('should maintain consistent assignment per user')
    it('should distribute traffic according to weights')
  })

  describe('Metrics Aggregation', () => {
    it('should aggregate metrics across variants')
    it('should calculate conversion rates correctly')
    it('should handle incomplete data gracefully')
  })
})
```

**Estimated Test Files:** 2 unit test files, 400+ lines

---

#### 5. Conversion Tracking
**Files:** `client/src/lib/conversionTracking.ts`, `server/src/conversionRoutes.ts`
**Risk Level:** MEDIUM-HIGH - Marketing attribution depends on accurate tracking

**Current Gaps:**
- No tests for funnel progression logic
- No tests for event buffering/flushing (20 events or 30 seconds)
- No tests for attribution data capture (UTM params)
- No tests for micro-conversion events
- No tests for session-based tracking

**Recommended Test Cases:**
```typescript
describe('Conversion Tracking', () => {
  describe('Funnel Progression', () => {
    it('should track stage transitions correctly')
    it('should prevent skipping required stages')
    it('should handle backward navigation')
    it('should persist funnel state across sessions')
  })

  describe('Event Buffering', () => {
    it('should buffer up to 20 events before flushing')
    it('should flush events after 30 seconds')
    it('should flush on page unload')
    it('should handle failed flush retries')
  })

  describe('Attribution', () => {
    it('should capture UTM parameters from URL')
    it('should persist attribution data in session')
    it('should handle GCLID, FBCLID, MSCLKID')
    it('should attribute conversions to correct source')
  })
})
```

**Estimated Test Files:** 2 test files (client + server), 500+ lines

---

#### 6. Webhook Processing
**File:** `server/src/webhooks.ts`
**Risk Level:** MEDIUM-HIGH - Data sync failures = out-of-date information

**Current Gaps:**
- No tests for event parsing and categorization
- No tests for duplicate prevention (eventId uniqueness)
- No tests for retry logic
- No tests for invalid payload handling
- No tests for database transaction rollback

**Recommended Test Cases:**
```typescript
describe('Webhook Processing', () => {
  describe('Event Parsing', () => {
    it('should parse valid webhook payloads')
    it('should categorize events by type')
    it('should extract relevant data fields')
    it('should reject malformed payloads')
  })

  describe('Duplicate Prevention', () => {
    it('should prevent duplicate event processing')
    it('should use eventId for uniqueness check')
    it('should handle race conditions')
  })

  describe('Error Handling', () => {
    it('should retry failed processing')
    it('should rollback database transactions on errors')
    it('should log failed webhook events')
  })
})
```

**Estimated Test Files:** 1 integration test file, 300+ lines

---

#### 7. HousecallPro Integration
**File:** `server/src/housecall.ts`
**Risk Level:** MEDIUM-HIGH - Core business data source

**Current Gaps:**
- No tests for circuit breaker pattern implementation
- No tests for exponential backoff retry logic
- No tests for API error handling (rate limits, timeouts)
- No tests for caching strategy
- No contract tests for API schema validation

**Recommended Test Cases:**
```typescript
describe('HousecallPro Integration', () => {
  describe('Circuit Breaker', () => {
    it('should open circuit after threshold failures')
    it('should transition to half-open state after timeout')
    it('should close circuit on successful requests')
    it('should fail fast when circuit is open')
  })

  describe('Retry Logic', () => {
    it('should retry with exponential backoff')
    it('should respect max retry attempts')
    it('should handle transient errors')
  })

  describe('API Error Handling', () => {
    it('should handle 429 rate limit responses')
    it('should handle timeout errors')
    it('should handle malformed responses')
  })

  describe('Caching', () => {
    it('should cache successful responses')
    it('should invalidate cache on TTL expiration')
    it('should bypass cache on explicit refresh')
  })
})
```

**Estimated Test Files:** 1 integration test file + contract tests, 400+ lines

---

### 🟡 MEDIUM PRIORITY - User Experience

#### 8. Referral Form & Customer Lookup
**Files:** Various routes in `server/src/`
**Risk Level:** MEDIUM - Affects user experience

**Current Gaps:**
- No tests for phone number normalization
- No tests for duplicate customer detection
- No tests for 2-step wizard flow validation
- No tests for lead creation workflow

**Recommended Test Cases:**
```typescript
describe('Referral Form', () => {
  describe('Customer Lookup', () => {
    it('should normalize phone numbers (various formats)')
    it('should perform fuzzy name matching')
    it('should detect duplicate customers')
    it('should handle no matches found')
  })

  describe('Wizard Flow', () => {
    it('should validate step 1 before proceeding to step 2')
    it('should allow backward navigation')
    it('should persist form state across steps')
  })

  describe('Lead Creation', () => {
    it('should create lead with referral data')
    it('should link to existing customer if found')
    it('should handle validation errors gracefully')
  })
})
```

**Estimated Test Files:** 1 E2E test file + 1 integration test file, 300+ lines

---

#### 9. Admin Dashboard Authorization
**File:** `server/src/adminRoutes.ts`
**Risk Level:** MEDIUM - Security and audit trail

**Current Gaps:**
- No tests for role-based permission checks
- No tests for activity logging
- No tests for permission middleware
- No tests for unauthorized access attempts

**Recommended Test Cases:**
```typescript
describe('Admin Authorization', () => {
  describe('Role Permissions', () => {
    it('should allow super_admin full access')
    it('should restrict admin to allowed operations')
    it('should restrict tech to read-only dashboard')
    it('should restrict staff appropriately')
  })

  describe('Activity Logging', () => {
    it('should log all admin actions')
    it('should capture user, action, timestamp')
    it('should handle logging failures gracefully')
  })

  describe('Unauthorized Access', () => {
    it('should reject requests without valid session')
    it('should reject requests with insufficient permissions')
    it('should return 403 for unauthorized operations')
  })
})
```

**Estimated Test Files:** 1 integration test file, 300+ lines

---

### 🟢 LOWER PRIORITY - Analytics & Reporting

#### 10. Heatmap Generation (`server/src/heatmap.ts`)
- Grid clustering algorithm accuracy
- Intensity calculation correctness
- Cache invalidation behavior

#### 11. Blog Analytics
- Page view aggregation accuracy
- Bounce rate calculation
- Time-on-page metrics

#### 12. Google Ads Integration
- Campaign data sync correctness
- Bid calculation logic
- API error handling

**Estimated Test Files:** 3 test files, 300+ lines total

---

## Recommended Testing Stack

### Backend Testing
```json
{
  "vitest": "^1.0.0",                      // Fast unit test runner
  "supertest": "^6.3.0",                   // HTTP integration tests
  "@testcontainers/postgresql": "^10.0.0", // Real DB for integration tests
  "nock": "^13.5.0",                       // Mock external APIs
  "@types/supertest": "^6.0.0"
}
```

**Why Vitest?**
- Native ESM support (matches your project's `"type": "module"`)
- Fast execution with smart test caching
- Compatible with Vite build system
- TypeScript out of the box

### Frontend Testing
```json
{
  "@testing-library/react": "^14.0.0",
  "@testing-library/jest-dom": "^6.0.0",
  "@testing-library/user-event": "^14.0.0",
  "vitest": "^1.0.0",
  "jsdom": "^23.0.0"
}
```

### E2E Testing
```json
{
  "playwright": "^1.40.0",
  "@playwright/test": "^1.40.0"
}
```

---

## Test File Structure

```
project-root/
├── server/
│   ├── src/
│   │   └── (existing source files)
│   └── __tests__/
│       ├── unit/
│       │   ├── capacity.test.ts
│       │   ├── auth.test.ts
│       │   ├── experimentManagement.test.ts
│       │   └── lib/
│       │       ├── smsBookingAgent.test.ts
│       │       └── aiChat.test.ts
│       ├── integration/
│       │   ├── adminRoutes.test.ts
│       │   ├── conversionRoutes.test.ts
│       │   ├── abTestingRoutes.test.ts
│       │   ├── webhooks.test.ts
│       │   ├── housecall.test.ts
│       │   └── auth-flow.test.ts
│       └── setup.ts
│
├── client/
│   └── src/
│       ├── (existing source files)
│       └── __tests__/
│           ├── lib/
│           │   ├── conversionTracking.test.ts
│           │   ├── abTesting.test.ts
│           │   └── seoMetadata.test.ts
│           ├── components/
│           │   ├── BookingForm.test.tsx
│           │   ├── ReferralWizard.test.tsx
│           │   └── AdminDashboard.test.tsx
│           └── setup.ts
│
└── e2e/
    ├── booking-flow.spec.ts
    ├── referral-flow.spec.ts
    ├── admin-login.spec.ts
    └── conversion-funnel.spec.ts
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
**Goal:** Set up testing infrastructure and critical path tests

**Tasks:**
1. Install testing dependencies (Vitest, Supertest, Testing Library)
2. Configure Vitest for both client and server
3. Set up test database with Testcontainers
4. Create test utilities and helpers
5. Implement auth tests (password, lockout, sessions)
6. Implement capacity calculation tests

**Deliverables:**
- Working test infrastructure
- 50+ passing tests for auth and capacity
- CI/CD integration (run tests on push)

**Success Metrics:**
- Auth module: 80%+ coverage
- Capacity module: 80%+ coverage
- Tests run in < 30 seconds

---

### Phase 2: Data Integrity (Week 3-4)
**Goal:** Ensure data accuracy and sync reliability

**Tasks:**
1. Implement webhook processing tests
2. Create HousecallPro integration tests (mocked)
3. Build A/B testing statistical calculation tests
4. Add circuit breaker pattern tests
5. Implement conversion tracking tests

**Deliverables:**
- 100+ passing integration tests
- Mock external API dependencies
- Database transaction tests

**Success Metrics:**
- Webhook module: 75%+ coverage
- A/B testing module: 85%+ coverage
- Conversion tracking: 75%+ coverage

---

### Phase 3: Customer-Facing Features (Week 5-6)
**Goal:** Validate user-facing functionality

**Tasks:**
1. Implement SMS booking agent tests
2. Create referral form E2E tests
3. Build booking flow E2E tests
4. Add frontend component tests
5. Implement micro-conversion tracking tests

**Deliverables:**
- 50+ E2E tests covering critical user journeys
- Frontend component test suite
- Integration tests for SMS agent

**Success Metrics:**
- SMS agent: 70%+ coverage
- Referral form: E2E test coverage
- Booking flow: E2E test coverage

---

### Phase 4: Coverage Expansion (Week 7-8)
**Goal:** Achieve comprehensive test coverage

**Tasks:**
1. Add admin authorization tests
2. Implement remaining API route tests
3. Create analytics and reporting tests
4. Build heatmap generation tests
5. Add blog system tests

**Deliverables:**
- 300+ total passing tests
- >70% overall code coverage
- Performance benchmarks established

**Success Metrics:**
- Overall backend coverage: 70%+
- Overall frontend coverage: 65%+
- E2E coverage: All critical paths
- Total test runtime: < 5 minutes

---

## Coverage Targets

| Module | Unit Tests | Integration Tests | E2E Tests | Target Coverage |
|--------|-----------|-------------------|-----------|-----------------|
| **Auth** | ✅ High | ✅ High | ✅ Medium | 80%+ |
| **Capacity** | ✅ High | ✅ Medium | ⚠️ Low | 80%+ |
| **A/B Testing** | ✅ High | ✅ Medium | ⚠️ Low | 85%+ |
| **Webhooks** | ⚠️ Medium | ✅ High | ⚠️ Low | 75%+ |
| **HousecallPro** | ⚠️ Medium | ✅ High | ⚠️ Low | 70%+ |
| **SMS Agent** | ⚠️ Medium | ✅ High | ⚠️ Low | 70%+ |
| **Conversion Tracking** | ✅ High | ✅ Medium | ✅ Medium | 75%+ |
| **Referral Form** | ⚠️ Medium | ✅ Medium | ✅ High | 65%+ |
| **Admin Routes** | ⚠️ Low | ✅ High | ⚠️ Medium | 70%+ |
| **Heatmap** | ✅ Medium | ⚠️ Low | ⚠️ Low | 60%+ |
| **Blog** | ⚠️ Low | ⚠️ Medium | ⚠️ Low | 50%+ |

**Legend:**
- ✅ High Priority
- ⚠️ Medium Priority
- ❌ Low Priority

---

## Key Performance Indicators

Once testing infrastructure is in place, track these KPIs:

1. **Code Coverage**
   - Backend unit tests: 80%+
   - Backend integration tests: 70%+
   - Frontend tests: 65%+
   - Overall: 70%+

2. **Test Execution Speed**
   - Unit tests: < 1 minute
   - Integration tests: < 3 minutes
   - E2E tests: < 5 minutes
   - Total suite: < 10 minutes

3. **Test Reliability**
   - Flaky test rate: < 1%
   - Test failure investigation time: < 15 minutes
   - False positive rate: < 2%

4. **Defect Detection**
   - Bugs caught pre-production: 80%+
   - Regression detection rate: 95%+
   - Critical bug escape rate: < 5%

---

## Continuous Integration Setup

### GitHub Actions Workflow
```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:coverage

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
```

---

## Cost-Benefit Analysis

### Investment Required
- **Development Time:** 320-400 hours (8 weeks with 1-2 engineers)
- **Maintenance:** ~20 hours/month ongoing
- **CI/CD Runtime Costs:** ~$50-100/month (GitHub Actions)

### Expected Benefits
1. **Reduced Production Bugs:** 60-80% fewer critical bugs reach production
2. **Faster Development:** 30% reduction in debugging time
3. **Confident Refactoring:** Enable architectural improvements without fear
4. **Better Onboarding:** New developers understand codebase through tests
5. **Business Continuity:** Catch regressions before they affect revenue
6. **Compliance:** Meet audit requirements for financial/healthcare applications

### Risk Mitigation
| Risk | Without Tests | With Tests | Reduction |
|------|--------------|------------|-----------|
| **Revenue Loss** (booking bugs) | High | Low | 80% |
| **Security Breach** (auth bugs) | Critical | Low | 90% |
| **Data Corruption** (webhook bugs) | High | Low | 85% |
| **Customer Churn** (UX bugs) | Medium | Low | 70% |

---

## Next Steps

1. **Immediate Actions:**
   - [ ] Review and approve this analysis
   - [ ] Prioritize which module to test first
   - [ ] Allocate engineering resources

2. **Week 1 Deliverables:**
   - [ ] Install testing dependencies
   - [ ] Configure Vitest for client and server
   - [ ] Set up test database
   - [ ] Write first 20 tests for auth module

3. **Follow-Up Meeting Topics:**
   - Coverage targets per module
   - Team training on testing best practices
   - CI/CD integration timeline
   - Ongoing maintenance plan

---

## Appendix: Example Test Configuration

### vitest.config.ts (Server)
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./server/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        '**/*.test.ts',
        '**/__tests__/**',
      ],
    },
  },
});
```

### vitest.config.ts (Client)
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./client/src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

---

**Report Generated By:** Claude Code
**Analysis Date:** 2026-01-07
**Repository:** JohnsonBros.com
**Branch:** claude/analyze-test-coverage-l0Sop
