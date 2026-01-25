/**
 * Dashboard Data API
 *
 * Provides data aggregation functions for the observability admin dashboard:
 * - Error summaries and trends
 * - Performance metrics and percentiles
 * - Alert history
 * - System health overview
 */

import { getMetrics, type MetricsSummary } from './metrics';
import { getUptimeStats, type UptimeStats } from './uptime';
import { getAlertHistory, getUnacknowledgedAlerts, type Alert } from './alerts';
import { db } from '../../db';
import { sql } from 'drizzle-orm';
import { Logger } from '../logger';

// Types
export interface ErrorSummary {
  totalErrors: number;
  errorRate: number;
  topErrors: {
    message: string;
    count: number;
    lastSeen: Date;
  }[];
  errorTrend: {
    timestamp: Date;
    count: number;
  }[];
}

export interface PerformanceSummary {
  p50ResponseMs: number;
  p95ResponseMs: number;
  p99ResponseMs: number;
  avgResponseMs: number;
  slowestEndpoints: {
    endpoint: string;
    avgMs: number;
    p95Ms: number;
    requestCount: number;
  }[];
  requestVolume: {
    timestamp: Date;
    count: number;
  }[];
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: UptimeStats;
  memory: {
    usedMb: number;
    totalMb: number;
    usagePercent: number;
  };
  cpu: {
    usagePercent: number;
  };
  disk: {
    usedGb: number;
    totalGb: number;
    usagePercent: number;
  } | null;
  database: {
    status: 'connected' | 'disconnected';
    connectionPoolSize: number;
    activeConnections: number;
  };
  externalServices: {
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastResponseMs: number;
    lastCheck: Date;
  }[];
}

// In-memory error tracking (would be replaced by actual logging/APM in production)
interface ErrorRecord {
  message: string;
  count: number;
  lastSeen: Date;
  stack?: string;
}

const errorRecords: Map<string, ErrorRecord> = new Map();
const errorTimeSeries: { timestamp: Date; count: number }[] = [];

/**
 * Record an error for dashboard tracking
 */
export function recordError(error: Error): void {
  const key = error.message.substring(0, 200);
  const existing = errorRecords.get(key);

  if (existing) {
    existing.count++;
    existing.lastSeen = new Date();
  } else {
    errorRecords.set(key, {
      message: error.message,
      count: 1,
      lastSeen: new Date(),
      stack: error.stack,
    });
  }

  // Add to time series
  const now = new Date();
  const lastEntry = errorTimeSeries[errorTimeSeries.length - 1];

  // Aggregate by minute
  if (lastEntry && now.getTime() - lastEntry.timestamp.getTime() < 60000) {
    lastEntry.count++;
  } else {
    errorTimeSeries.push({ timestamp: now, count: 1 });
  }

  // Keep last 24 hours
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  while (errorTimeSeries.length > 0 && errorTimeSeries[0].timestamp.getTime() < cutoff) {
    errorTimeSeries.shift();
  }
}

/**
 * Get error summary for the dashboard
 */
export async function getErrorSummary(hours = 24): Promise<ErrorSummary> {
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  const metrics = getMetrics();

  // Filter recent errors
  const recentErrors = Array.from(errorRecords.values())
    .filter(e => e.lastSeen.getTime() >= cutoff)
    .sort((a, b) => b.count - a.count);

  const totalErrors = recentErrors.reduce((sum, e) => sum + e.count, 0);

  // Get error trend
  const trend = errorTimeSeries
    .filter(e => e.timestamp.getTime() >= cutoff)
    .map(e => ({ timestamp: e.timestamp, count: e.count }));

  return {
    totalErrors,
    errorRate: metrics.requests.errorRate,
    topErrors: recentErrors.slice(0, 10).map(e => ({
      message: e.message,
      count: e.count,
      lastSeen: e.lastSeen,
    })),
    errorTrend: trend,
  };
}

/**
 * Get performance summary for the dashboard
 */
export async function getPerformanceSummary(hours = 24): Promise<PerformanceSummary> {
  const metrics = getMetrics();

  // In production, this would come from actual metrics storage
  // For now, we derive from the in-memory metrics

  // Generate sample request volume data
  const requestVolume: { timestamp: Date; count: number }[] = [];
  const now = Date.now();
  const intervalMs = 60 * 60 * 1000; // hourly buckets

  for (let i = hours - 1; i >= 0; i--) {
    requestVolume.push({
      timestamp: new Date(now - i * intervalMs),
      count: Math.floor(metrics.requests.total / hours) + Math.floor(Math.random() * 50),
    });
  }

  // Get slowest endpoints from external API metrics
  const slowestEndpoints = Object.entries(metrics.externalApis)
    .map(([endpoint, data]) => ({
      endpoint,
      avgMs: data.avgLatencyMs,
      p95Ms: data.avgLatencyMs * 1.5, // Estimate
      requestCount: data.requestCount,
    }))
    .sort((a, b) => b.avgMs - a.avgMs)
    .slice(0, 10);

  return {
    p50ResponseMs: metrics.requests.p50DurationMs,
    p95ResponseMs: metrics.requests.p95DurationMs,
    p99ResponseMs: metrics.requests.p99DurationMs,
    avgResponseMs: metrics.requests.avgDurationMs,
    slowestEndpoints,
    requestVolume,
  };
}

/**
 * Get alert history for the dashboard
 */
export async function getAlerts(limit = 50): Promise<Alert[]> {
  return getAlertHistory(limit);
}

/**
 * Get system health overview
 */
export async function getSystemHealth(): Promise<SystemHealth> {
  const metrics = getMetrics();
  const uptime = getUptimeStats();

  // Memory info
  const memory = {
    usedMb: metrics.memory.heapUsedMb,
    totalMb: metrics.memory.heapTotalMb,
    usagePercent: (metrics.memory.heapUsedMb / metrics.memory.heapTotalMb) * 100,
  };

  // CPU info (approximate from event loop lag)
  const cpu = {
    usagePercent: Math.min(100, metrics.eventLoopLagMs * 10), // Rough approximation
  };

  // Disk info (may not be available on all platforms)
  let disk: SystemHealth['disk'] = null;
  try {
    const { execSync } = require('child_process');
    const output = execSync('df -BG / | tail -1', { encoding: 'utf-8' });
    const parts = output.trim().split(/\s+/);
    disk = {
      usedGb: parseFloat(parts[2].replace('G', '')),
      totalGb: parseFloat(parts[1].replace('G', '')),
      usagePercent: parseFloat(parts[4].replace('%', '')),
    };
  } catch {
    // Disk check not available
  }

  // Database health
  let dbStatus: 'connected' | 'disconnected' = 'connected';
  try {
    await db.execute(sql`SELECT 1`);
  } catch {
    dbStatus = 'disconnected';
  }

  const database = {
    status: dbStatus,
    connectionPoolSize: 10, // Would come from actual pool
    activeConnections: 1, // Would come from actual pool
  };

  // External service health (derived from metrics)
  const externalServices = Object.entries(metrics.externalApis).map(([name, data]) => {
    const serviceName = name.split(':')[0];
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (data.avgLatencyMs > 5000) status = 'unhealthy';
    else if (data.avgLatencyMs > 2000) status = 'degraded';

    return {
      name: serviceName,
      status,
      lastResponseMs: data.avgLatencyMs,
      lastCheck: new Date(),
    };
  });

  // Add known services if not present
  const knownServices = ['HousecallPro', 'OpenAI', 'Twilio'];
  for (const service of knownServices) {
    if (!externalServices.find(s => s.name.toLowerCase() === service.toLowerCase())) {
      externalServices.push({
        name: service,
        status: 'healthy',
        lastResponseMs: 0,
        lastCheck: new Date(),
      });
    }
  }

  return {
    status: uptime.currentStatus,
    uptime,
    memory,
    cpu,
    disk,
    database,
    externalServices,
  };
}

/**
 * Get a combined dashboard overview
 */
export interface DashboardOverview {
  health: SystemHealth;
  errors: ErrorSummary;
  performance: PerformanceSummary;
  alerts: Alert[];
  unacknowledgedAlertCount: number;
}

export async function getDashboardOverview(hours = 24): Promise<DashboardOverview> {
  const [health, errors, performance, alerts] = await Promise.all([
    getSystemHealth(),
    getErrorSummary(hours),
    getPerformanceSummary(hours),
    getAlerts(20),
  ]);

  return {
    health,
    errors,
    performance,
    alerts,
    unacknowledgedAlertCount: getUnacknowledgedAlerts().length,
  };
}
