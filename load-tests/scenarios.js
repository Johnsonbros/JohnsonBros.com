/**
 * k6 Load Testing Scenarios
 *
 * Run with: k6 run load-tests/scenarios.js
 * With config: k6 run --config load-tests/k6-config.js load-tests/scenarios.js
 *
 * Environment variables:
 * - BASE_URL: Target URL (default: http://localhost:5000)
 * - SCENARIO: Run specific scenario (smoke, load, stress, spike)
 */

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

// Configuration
const BASE_URL = __ENV.BASE_URL || "http://localhost:5000";

// Custom metrics
const errorRate = new Rate("errors");
const homepageDuration = new Trend("homepage_duration");
const apiDuration = new Trend("api_duration");
const servicePageDuration = new Trend("service_page_duration");
const pageViews = new Counter("page_views");

// Pages to test
const PAGES = [
  "/",
  "/services/drain-cleaning",
  "/services/emergency-plumbing",
  "/services/water-heater",
  "/service-areas/quincy",
  "/service-areas/braintree",
  "/contact",
  "/about",
];

// API endpoints to test
const API_ENDPOINTS = [
  "/api/v1/capacity",
  "/api/v1/services",
  "/health",
];

// Service pages for focused testing
const SERVICE_PAGES = [
  "/services/drain-cleaning",
  "/services/emergency-plumbing",
  "/services/water-heater",
  "/services/general-plumbing",
];

// Default options for single scenario runs
export const options = {
  vus: 10,
  duration: "30s",
  thresholds: {
    http_req_duration: ["p(95)<500"],
    http_req_failed: ["rate<0.01"],
  },
};

/**
 * Smoke Test - Basic functionality verification
 * Light load to verify the system is working
 */
export function smokeTest() {
  group("Smoke Test", () => {
    // Test health endpoint
    const healthRes = http.get(`${BASE_URL}/health`);
    check(healthRes, {
      "health check status 200": (r) => r.status === 200,
      "health check response time < 200ms": (r) => r.timings.duration < 200,
    }) || errorRate.add(1);

    // Test homepage
    const homeRes = http.get(`${BASE_URL}/`);
    check(homeRes, {
      "homepage status 200": (r) => r.status === 200,
      "homepage has content": (r) => r.body.length > 1000,
    }) || errorRate.add(1);

    homepageDuration.add(homeRes.timings.duration);
    pageViews.add(1);

    sleep(1);
  });
}

/**
 * Load Test - Normal traffic simulation
 * Simulates typical user behavior patterns
 */
export function loadTest() {
  group("User Journey", () => {
    // 1. Visit homepage
    const homeRes = http.get(`${BASE_URL}/`);
    homepageDuration.add(homeRes.timings.duration);
    check(homeRes, {
      "homepage status 200": (r) => r.status === 200,
    }) || errorRate.add(1);
    pageViews.add(1);
    sleep(randomBetween(1, 4)); // Reading time

    // 2. Visit a service page (random)
    const servicePage = SERVICE_PAGES[Math.floor(Math.random() * SERVICE_PAGES.length)];
    const serviceRes = http.get(`${BASE_URL}${servicePage}`);
    servicePageDuration.add(serviceRes.timings.duration);
    check(serviceRes, {
      "service page status 200": (r) => r.status === 200,
    }) || errorRate.add(1);
    pageViews.add(1);
    sleep(randomBetween(2, 7)); // Reading service info

    // 3. Check capacity API (simulates booking widget loading)
    const capacityRes = http.get(`${BASE_URL}/api/v1/capacity`);
    apiDuration.add(capacityRes.timings.duration);
    check(capacityRes, {
      "capacity API status 200": (r) => r.status === 200,
      "capacity API response time < 500ms": (r) => r.timings.duration < 500,
    }) || errorRate.add(1);

    // 4. Maybe visit contact page (30% chance)
    if (Math.random() < 0.3) {
      const contactRes = http.get(`${BASE_URL}/contact`);
      check(contactRes, {
        "contact page status 200": (r) => r.status === 200,
      }) || errorRate.add(1);
      pageViews.add(1);
      sleep(randomBetween(1, 3));
    }

    sleep(1);
  });
}

/**
 * Stress Test - High load to find breaking point
 * Pushes the system to its limits
 */
export function stressTest() {
  group("Stress Test", () => {
    // Rapid page requests
    const page = PAGES[Math.floor(Math.random() * PAGES.length)];
    const res = http.get(`${BASE_URL}${page}`);

    check(res, {
      "status is 200 or 429 (rate limited)": (r) => r.status === 200 || r.status === 429,
    }) || errorRate.add(1);

    pageViews.add(1);
    sleep(0.5); // Minimal delay between requests
  });
}

/**
 * Spike Test - Sudden traffic surge
 * Tests system resilience to traffic spikes
 */
export function spikeTest() {
  group("Spike Test", () => {
    // Simulate user landing from ad campaign
    const landingPages = [
      "/services/emergency-plumbing",
      "/services/drain-cleaning",
      "/",
    ];

    const page = landingPages[Math.floor(Math.random() * landingPages.length)];
    const res = http.get(`${BASE_URL}${page}`);

    check(res, {
      "spike: page loads": (r) => r.status === 200 || r.status === 429,
      "spike: response under 2s": (r) => r.timings.duration < 2000,
    }) || errorRate.add(1);

    pageViews.add(1);

    // Quick API check
    const apiRes = http.get(`${BASE_URL}/api/v1/capacity`);
    check(apiRes, {
      "spike: API responds": (r) => r.status === 200 || r.status === 429,
    }) || errorRate.add(1);

    sleep(randomBetween(0.5, 2));
  });
}

/**
 * API Load Test - Focus on API endpoints
 */
export function apiLoadTest() {
  group("API Load Test", () => {
    for (const endpoint of API_ENDPOINTS) {
      const res = http.get(`${BASE_URL}${endpoint}`);
      apiDuration.add(res.timings.duration);

      check(res, {
        [`${endpoint} status 200`]: (r) => r.status === 200,
        [`${endpoint} fast response`]: (r) => r.timings.duration < 500,
      }) || errorRate.add(1);
    }

    sleep(1);
  });
}

/**
 * Default function - runs when no specific scenario is selected
 */
export default function () {
  const scenario = __ENV.SCENARIO || "load";

  switch (scenario) {
    case "smoke":
      smokeTest();
      break;
    case "stress":
      stressTest();
      break;
    case "spike":
      spikeTest();
      break;
    case "api":
      apiLoadTest();
      break;
    case "load":
    default:
      loadTest();
      break;
  }
}

/**
 * Generate summary report
 */
export function handleSummary(data) {
  const duration = data.metrics.http_req_duration;
  const reqs = data.metrics.http_reqs;
  const failed = data.metrics.http_req_failed;

  const report = `
================================================================================
LOAD TEST RESULTS - Johnson Bros Website
================================================================================
Test Duration: ${formatDuration(data.state.testRunDurationMs)}
Total Requests: ${reqs?.values?.count || 0}
Request Rate: ${(reqs?.values?.rate || 0).toFixed(2)}/s

RESPONSE TIMES
--------------
  Average: ${(duration?.values?.avg || 0).toFixed(2)}ms
  Median:  ${(duration?.values?.med || 0).toFixed(2)}ms
  p(90):   ${(duration?.values?.["p(90)"] || 0).toFixed(2)}ms
  p(95):   ${(duration?.values?.["p(95)"] || 0).toFixed(2)}ms
  p(99):   ${(duration?.values?.["p(99)"] || 0).toFixed(2)}ms
  Max:     ${(duration?.values?.max || 0).toFixed(2)}ms

ERROR RATE
----------
  Failed Requests: ${((failed?.values?.rate || 0) * 100).toFixed(2)}%

THRESHOLD RESULTS
-----------------
${Object.entries(data.thresholds || {})
  .map(([k, v]) => `  ${v.ok ? "✅" : "❌"} ${k}: ${v.ok ? "PASS" : "FAIL"}`)
  .join("\n")}

PAGE VIEWS
----------
  Total: ${data.metrics.page_views?.values?.count || 0}

================================================================================
`;

  return {
    "load-test-results.json": JSON.stringify(data, null, 2),
    "load-test-summary.txt": report,
    stdout: report,
  };
}

// Utility functions
function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}
