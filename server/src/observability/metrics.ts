/**
 * Performance Metrics Collection
 *
 * Provides Prometheus-compatible metrics with:
 * - Request duration histograms
 * - Request counts by route and status
 * - Active connection tracking
 * - Database query metrics
 * - External API call metrics
 * - Memory and event loop monitoring
 */

import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { Router } from 'express';
import { Logger } from '../logger';

// Create a custom registry
const register = new Registry();

// Add default metrics (memory, CPU, etc.)
collectDefaultMetrics({ register });

// Request duration histogram
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

// Request counter
const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Active connections gauge
const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  registers: [register],
});

// Database query metrics
const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

const dbQueryTotal = new Counter({
  name: 'db_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'success'],
  registers: [register],
});

// External API metrics
const externalApiDuration = new Histogram({
  name: 'external_api_duration_seconds',
  help: 'Duration of external API calls in seconds',
  labelNames: ['service', 'operation'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

const externalApiTotal = new Counter({
  name: 'external_api_calls_total',
  help: 'Total number of external API calls',
  labelNames: ['service', 'operation', 'success'],
  registers: [register],
});

// Event loop lag gauge
const eventLoopLag = new Gauge({
  name: 'event_loop_lag_seconds',
  help: 'Event loop lag in seconds',
  registers: [register],
});

// Memory usage gauges
const memoryUsageHeap = new Gauge({
  name: 'process_memory_heap_bytes',
  help: 'Process heap memory usage in bytes',
  registers: [register],
});

const memoryUsageRss = new Gauge({
  name: 'process_memory_rss_bytes',
  help: 'Process RSS memory usage in bytes',
  registers: [register],
});

// Business metrics
const bookingAttempts = new Counter({
  name: 'booking_attempts_total',
  help: 'Total booking attempts',
  labelNames: ['channel', 'success'],
  registers: [register],
});

const capacityState = new Gauge({
  name: 'capacity_state',
  help: 'Current capacity state (0=EMERGENCY_ONLY, 1=NEXT_DAY, 2=LIMITED_SAME_DAY, 3=SAME_DAY_FEE_WAIVED)',
  registers: [register],
});

// In-memory metrics for dashboard (rolling window)
interface MetricSample {
  timestamp: number;
  value: number;
}

interface InMemoryMetrics {
  requestDurations: MetricSample[];
  errorCounts: MetricSample[];
  requestCounts: MetricSample[];
  externalApiLatencies: Map<string, MetricSample[]>;
}

const inMemoryMetrics: InMemoryMetrics = {
  requestDurations: [],
  errorCounts: [],
  requestCounts: [],
  externalApiLatencies: new Map(),
};

const MAX_SAMPLES = 1000; // Keep last 1000 samples
const SAMPLE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Add a sample to a rolling window array
 */
function addSample(arr: MetricSample[], value: number): void {
  const now = Date.now();

  // Add new sample
  arr.push({ timestamp: now, value });

  // Remove old samples
  const cutoff = now - SAMPLE_TTL;
  while (arr.length > 0 && arr[0].timestamp < cutoff) {
    arr.shift();
  }

  // Trim to max samples
  while (arr.length > MAX_SAMPLES) {
    arr.shift();
  }
}

/**
 * Normalize route path for metrics (avoid high cardinality)
 */
function normalizeRoute(path: string): string {
  return path
    // Replace UUIDs
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
    // Replace numeric IDs
    .replace(/\/\d+/g, '/:id')
    // Collapse multiple slashes
    .replace(/\/+/g, '/')
    // Remove trailing slash
    .replace(/\/$/, '') || '/';
}

/**
 * Express middleware to track request metrics
 */
export function metricsMiddleware(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = process.hrtime.bigint();
    activeConnections.inc();

    res.on('finish', () => {
      const endTime = process.hrtime.bigint();
      const durationNs = Number(endTime - startTime);
      const durationSeconds = durationNs / 1e9;

      const route = normalizeRoute(req.route?.path || req.path);
      const method = req.method;
      const statusCode = String(res.statusCode);

      // Record Prometheus metrics
      httpRequestDuration.observe({ method, route, status_code: statusCode }, durationSeconds);
      httpRequestTotal.inc({ method, route, status_code: statusCode });

      // Record in-memory metrics
      addSample(inMemoryMetrics.requestDurations, durationSeconds * 1000); // ms for dashboard
      addSample(inMemoryMetrics.requestCounts, 1);

      if (res.statusCode >= 400) {
        addSample(inMemoryMetrics.errorCounts, 1);
      }

      activeConnections.dec();
    });

    res.on('close', () => {
      // Handle aborted requests
      if (!res.writableEnded) {
        activeConnections.dec();
      }
    });

    next();
  };
}

/**
 * Record database query metrics
 */
export function recordDbQuery(durationMs: number, operation: string, success = true): void {
  const durationSeconds = durationMs / 1000;
  dbQueryDuration.observe({ operation }, durationSeconds);
  dbQueryTotal.inc({ operation, success: String(success) });
}

/**
 * Record external API call metrics
 */
export function recordExternalCall(
  service: string,
  durationMs: number,
  success: boolean,
  operation = 'request'
): void {
  const durationSeconds = durationMs / 1000;
  externalApiDuration.observe({ service, operation }, durationSeconds);
  externalApiTotal.inc({ service, operation, success: String(success) });

  // Record in-memory for dashboard
  const key = `${service}:${operation}`;
  if (!inMemoryMetrics.externalApiLatencies.has(key)) {
    inMemoryMetrics.externalApiLatencies.set(key, []);
  }
  addSample(inMemoryMetrics.externalApiLatencies.get(key)!, durationMs);
}

/**
 * Record booking attempt
 */
export function recordBookingAttempt(channel: string, success: boolean): void {
  bookingAttempts.inc({ channel, success: String(success) });
}

/**
 * Update capacity state metric
 */
export function updateCapacityState(state: string): void {
  const stateMap: Record<string, number> = {
    'EMERGENCY_ONLY': 0,
    'NEXT_DAY': 1,
    'LIMITED_SAME_DAY': 2,
    'SAME_DAY_FEE_WAIVED': 3,
  };
  capacityState.set(stateMap[state] ?? -1);
}

/**
 * Get metrics summary for dashboard
 */
export interface MetricsSummary {
  requests: {
    total: number;
    errorsTotal: number;
    errorRate: number;
    avgDurationMs: number;
    p50DurationMs: number;
    p95DurationMs: number;
    p99DurationMs: number;
  };
  memory: {
    heapUsedMb: number;
    heapTotalMb: number;
    rssMb: number;
    external: number;
  };
  eventLoopLagMs: number;
  activeConnections: number;
  externalApis: Record<string, {
    avgLatencyMs: number;
    requestCount: number;
  }>;
}

export function getMetrics(): MetricsSummary {
  const mem = process.memoryUsage();

  // Calculate request stats
  const durations = inMemoryMetrics.requestDurations.map(s => s.value).sort((a, b) => a - b);
  const errors = inMemoryMetrics.errorCounts.reduce((sum, s) => sum + s.value, 0);
  const total = inMemoryMetrics.requestCounts.reduce((sum, s) => sum + s.value, 0);

  const p50Index = Math.floor(durations.length * 0.5);
  const p95Index = Math.floor(durations.length * 0.95);
  const p99Index = Math.floor(durations.length * 0.99);

  // Calculate external API stats
  const externalApis: Record<string, { avgLatencyMs: number; requestCount: number }> = {};
  for (const [key, samples] of inMemoryMetrics.externalApiLatencies) {
    const latencies = samples.map(s => s.value);
    externalApis[key] = {
      avgLatencyMs: latencies.reduce((a, b) => a + b, 0) / latencies.length || 0,
      requestCount: latencies.length,
    };
  }

  return {
    requests: {
      total,
      errorsTotal: errors,
      errorRate: total > 0 ? errors / total : 0,
      avgDurationMs: durations.reduce((a, b) => a + b, 0) / durations.length || 0,
      p50DurationMs: durations[p50Index] || 0,
      p95DurationMs: durations[p95Index] || 0,
      p99DurationMs: durations[p99Index] || 0,
    },
    memory: {
      heapUsedMb: mem.heapUsed / 1024 / 1024,
      heapTotalMb: mem.heapTotal / 1024 / 1024,
      rssMb: mem.rss / 1024 / 1024,
      external: mem.external / 1024 / 1024,
    },
    eventLoopLagMs: 0, // Updated by monitoring loop
    activeConnections: 0, // Would need to query gauge
    externalApis,
  };
}

/**
 * Start periodic metrics collection
 */
let metricsInterval: NodeJS.Timeout | null = null;

export function startMetricsCollection(): void {
  if (metricsInterval) return;

  const intervalMs = parseInt(process.env.METRICS_LOG_INTERVAL_MS || '60000', 10);

  // Measure event loop lag
  let lastLoopCheck = process.hrtime.bigint();

  metricsInterval = setInterval(() => {
    // Measure event loop lag
    const now = process.hrtime.bigint();
    const elapsed = Number(now - lastLoopCheck) / 1e6; // ms
    const expectedInterval = intervalMs;
    const lag = Math.max(0, elapsed - expectedInterval);
    eventLoopLag.set(lag / 1000);
    lastLoopCheck = now;

    // Update memory metrics
    const mem = process.memoryUsage();
    memoryUsageHeap.set(mem.heapUsed);
    memoryUsageRss.set(mem.rss);

    // Log metrics summary periodically
    if (process.env.ENABLE_METRICS === 'true') {
      const summary = getMetrics();
      Logger.debug('Metrics snapshot', {
        requests: summary.requests.total,
        errorRate: (summary.requests.errorRate * 100).toFixed(2) + '%',
        avgDurationMs: summary.requests.avgDurationMs.toFixed(2),
        memoryMb: summary.memory.heapUsedMb.toFixed(2),
      });
    }
  }, intervalMs);

  Logger.info('Metrics collection started', { intervalMs });
}

export function stopMetricsCollection(): void {
  if (metricsInterval) {
    clearInterval(metricsInterval);
    metricsInterval = null;
  }
}

/**
 * Create metrics endpoint router
 */
export function createMetricsRouter(): Router {
  const router = Router();

  // Prometheus format endpoint
  router.get('/metrics', async (req: Request, res: Response) => {
    try {
      res.set('Content-Type', register.contentType);
      const metrics = await register.metrics();
      res.end(metrics);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get metrics' });
    }
  });

  // JSON format endpoint for dashboard
  router.get('/metrics.json', (req: Request, res: Response) => {
    try {
      const metrics = getMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get metrics' });
    }
  });

  return router;
}

// Export registry for custom metrics
export { register as metricsRegistry };
