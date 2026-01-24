/**
 * Observability Module
 *
 * Unified initialization and exports for the complete observability stack:
 * - Sentry error tracking
 * - Prometheus metrics collection
 * - Uptime monitoring
 * - Alerting system
 */

import type { Express } from 'express';
import { Logger } from '../logger';

// Sentry exports
export {
  initSentry,
  captureException,
  captureMessage,
  setUser,
  clearUser,
  addBreadcrumb,
  sentryErrorHandler,
  sentryRequestContext,
  isSentryInitialized,
  withSentryCapture,
  recordOperation,
  recordSentryExternalCall,
} from './sentry';

// Metrics exports
export {
  metricsMiddleware,
  recordDbQuery,
  recordExternalCall,
  recordBookingAttempt,
  updateCapacityState,
  getMetrics,
  startMetricsCollection,
  stopMetricsCollection,
  createMetricsRouter,
  metricsRegistry,
  type MetricsSummary,
} from './metrics';

// Uptime exports
export {
  uptimeRouter,
  getUptimeStats,
  registerHealthCheck,
  startSelfMonitoring,
  stopSelfMonitoring,
  createIncident,
  resolveIncident,
  type UptimeStats,
  type Incident,
} from './uptime';

// Alerts exports
export {
  sendAlert,
  acknowledgeAlert,
  getAlertHistory,
  getUnacknowledgedAlerts,
  updateThresholds,
  getThresholds,
  startAlertMonitor,
  stopAlertMonitor,
  defaultThresholds,
  type AlertLevel,
  type Alert,
  type AlertThresholds,
} from './alerts';

// Import for unified initialization
import { initSentry, sentryErrorHandler, sentryRequestContext } from './sentry';
import { metricsMiddleware, startMetricsCollection, createMetricsRouter } from './metrics';
import { uptimeRouter, startSelfMonitoring, registerHealthCheck } from './uptime';
import { startAlertMonitor } from './alerts';
import { db } from '../../db';
import { sql } from 'drizzle-orm';

/**
 * Initialize the complete observability stack
 *
 * This should be called early in the application startup,
 * after creating the Express app but before registering routes.
 * This initializes:
 * - Sentry for error tracking and performance monitoring
 * - Prometheus metrics collection
 * - Uptime monitoring and health checks
 * - Alert monitoring system
 */
export function initObservability(app: Express): void {
  const startTime = Date.now();

  try {
    // 1. Initialize Sentry (must be first for error tracking)
    initSentry(app);

    // 2. Add Sentry request context middleware (early to track all requests)
    app.use(sentryRequestContext());

    // 3. Add metrics middleware (must be early to capture all requests)
    app.use(metricsMiddleware());

    // 4. Register health check endpoints
    app.use('/health', uptimeRouter);

    // 5. Register metrics endpoints
    const metricsRouter = createMetricsRouter();
    app.use('/health', metricsRouter);

    // 6. Register default health checks
    registerDefaultHealthChecks();

    // 7. Start background monitoring
    startMetricsCollection();
    startSelfMonitoring();
    startAlertMonitor();

    const duration = Date.now() - startTime;
    Logger.info('Observability initialized', {
      durationMs: duration,
      sentry_enabled: !!process.env.SENTRY_DSN,
      metrics_enabled: process.env.ENABLE_METRICS !== 'false',
    });
  } catch (error) {
    Logger.error('Failed to initialize observability', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    // Don't throw - observability failures shouldn't crash the app
  }
}

/**
 * Register default health checks
 */
function registerDefaultHealthChecks(): void {
  // Database health check
  registerHealthCheck('database', async () => {
    try {
      await db.execute(sql`SELECT 1`);
      return true;
    } catch {
      return false;
    }
  }, true); // Critical

  // Memory health check
  registerHealthCheck('memory', async () => {
    const mem = process.memoryUsage();
    const usagePercent = (mem.heapUsed / mem.heapTotal) * 100;
    return usagePercent < 95;
  }, false);

  // Event loop health check
  registerHealthCheck('event_loop', async () => {
    return new Promise((resolve) => {
      const start = Date.now();
      setImmediate(() => {
        const lag = Date.now() - start;
        resolve(lag < 100); // 100ms max lag
      });
    });
  }, false);
}

/**
 * Add Sentry error handler to the Express app
 *
 * This should be called after all routes are registered,
 * but before the generic error handler.
 */
export function addObservabilityErrorHandler(app: Express): void {
  app.use(sentryErrorHandler());
}

/**
 * Shutdown observability gracefully
 */
export function shutdownObservability(): void {
  stopMetricsCollection();
  stopSelfMonitoring();
  stopAlertMonitor();
  Logger.info('Observability shut down');
}

// Import stop functions
import { stopMetricsCollection } from './metrics';
import { stopSelfMonitoring } from './uptime';
import { stopAlertMonitor } from './alerts';
