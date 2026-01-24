/**
 * k6 Load Testing Configuration
 *
 * This configuration defines different test scenarios for load testing
 * the Johnson Bros website.
 *
 * Install k6:
 * - macOS: brew install k6
 * - Linux: sudo apt-get install k6
 * - Windows: choco install k6
 * - Docker: docker pull grafana/k6
 *
 * Run tests:
 * - Smoke test: k6 run --env SCENARIO=smoke load-tests/scenarios.js
 * - Load test: k6 run load-tests/scenarios.js
 * - Full test: k6 run --config load-tests/k6-config.js load-tests/scenarios.js
 */

export const options = {
  scenarios: {
    // Smoke test - verify basic functionality with minimal load
    smoke: {
      executor: "constant-vus",
      vus: 1,
      duration: "30s",
      exec: "smokeTest",
      tags: { scenario: "smoke" },
    },

    // Load test - simulate normal traffic patterns
    load: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m", target: 20 }, // Ramp up to 20 users
        { duration: "5m", target: 20 }, // Hold at 20 users
        { duration: "2m", target: 0 }, // Ramp down
      ],
      exec: "loadTest",
      startTime: "30s", // Start after smoke test
      tags: { scenario: "load" },
    },

    // Stress test - find the breaking point
    stress: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m", target: 50 }, // Ramp to 50 users
        { duration: "5m", target: 50 }, // Hold
        { duration: "2m", target: 100 }, // Ramp to 100 users
        { duration: "5m", target: 100 }, // Hold at peak
        { duration: "2m", target: 0 }, // Ramp down
      ],
      exec: "stressTest",
      startTime: "10m", // Start after load test
      tags: { scenario: "stress" },
    },

    // Spike test - sudden traffic spike
    spike: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 10 }, // Normal load
        { duration: "30s", target: 100 }, // Spike!
        { duration: "1m", target: 100 }, // Hold spike
        { duration: "30s", target: 10 }, // Scale down
        { duration: "1m", target: 10 }, // Recovery
      ],
      exec: "spikeTest",
      startTime: "18m", // Start after stress test
      tags: { scenario: "spike" },
    },
  },

  // Performance thresholds
  thresholds: {
    // HTTP request duration
    http_req_duration: [
      "p(50)<200", // 50% of requests should be under 200ms
      "p(95)<500", // 95% of requests should be under 500ms
      "p(99)<1500", // 99% of requests should be under 1500ms
    ],

    // Error rate
    http_req_failed: ["rate<0.01"], // Less than 1% error rate

    // Request rate
    http_reqs: ["rate>10"], // At least 10 requests per second

    // Custom metrics
    homepage_duration: ["p(95)<400"], // Homepage loads in under 400ms
    api_duration: ["p(95)<300"], // API calls under 300ms
  },

  // Output configuration
  summaryTrendStats: ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)"],
};

export default options;
