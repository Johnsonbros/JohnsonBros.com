/**
 * Uptime Monitoring
 *
 * Provides:
 * - Heartbeat endpoint for external monitoring
 * - Internal self-health monitoring
 * - Uptime statistics tracking
 * - Incident history
 */

import { Router, Request, Response } from 'express';
import { Logger } from '../logger';

// Types
export interface Incident {
  id: string;
  type: 'downtime' | 'degraded' | 'error_spike' | 'latency_spike';
  startedAt: Date;
  endedAt?: Date;
  durationMs?: number;
  description: string;
  resolved: boolean;
}

interface HealthCheck {
  name: string;
  check: () => Promise<boolean>;
  critical: boolean;
}

// Internal state
const startedAt = new Date();
const incidents: Incident[] = [];
const healthChecks: HealthCheck[] = [];

let isHealthy = true;
let lastHealthCheck = new Date();
let consecutiveFailures = 0;
const MAX_INCIDENTS = 100;

/**
 * Register a health check
 */
export function registerHealthCheck(name: string, check: () => Promise<boolean>, critical = false): void {
  healthChecks.push({ name, check, critical });
}

/**
 * Create a new incident
 */
function createIncident(type: Incident['type'], description: string): Incident {
  const incident: Incident = {
    id: `inc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    startedAt: new Date(),
    description,
    resolved: false,
  };

  incidents.unshift(incident);

  // Trim old incidents
  while (incidents.length > MAX_INCIDENTS) {
    incidents.pop();
  }

  Logger.warn('Incident created', {
    incidentId: incident.id,
    type: incident.type,
    description: incident.description,
  });

  return incident;
}

/**
 * Resolve an incident
 */
function resolveIncident(incidentId: string): void {
  const incident = incidents.find(i => i.id === incidentId);
  if (incident && !incident.resolved) {
    incident.resolved = true;
    incident.endedAt = new Date();
    incident.durationMs = incident.endedAt.getTime() - incident.startedAt.getTime();

    Logger.info('Incident resolved', {
      incidentId: incident.id,
      durationMs: incident.durationMs,
    });
  }
}

/**
 * Run all health checks
 */
async function runHealthChecks(): Promise<{ healthy: boolean; results: Record<string, boolean> }> {
  const results: Record<string, boolean> = {};
  let allHealthy = true;
  let criticalFailure = false;

  for (const { name, check, critical } of healthChecks) {
    try {
      const result = await Promise.race([
        check(),
        new Promise<boolean>((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), 5000)
        ),
      ]);
      results[name] = result;
      if (!result) {
        allHealthy = false;
        if (critical) criticalFailure = true;
      }
    } catch (error) {
      results[name] = false;
      allHealthy = false;
      if (critical) criticalFailure = true;
      Logger.error(`Health check '${name}' failed`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { healthy: !criticalFailure && allHealthy, results };
}

/**
 * Perform internal self-monitoring
 */
let monitoringInterval: NodeJS.Timeout | null = null;
let currentIncident: Incident | null = null;

export function startSelfMonitoring(intervalMs = 30000): void {
  if (monitoringInterval) return;

  monitoringInterval = setInterval(async () => {
    try {
      const { healthy, results } = await runHealthChecks();
      lastHealthCheck = new Date();

      if (healthy) {
        consecutiveFailures = 0;
        if (!isHealthy) {
          isHealthy = true;
          if (currentIncident) {
            resolveIncident(currentIncident.id);
            currentIncident = null;
          }
          Logger.info('System recovered to healthy state');
        }
      } else {
        consecutiveFailures++;

        if (consecutiveFailures >= 3 && isHealthy) {
          isHealthy = false;
          const failedChecks = Object.entries(results)
            .filter(([, passed]) => !passed)
            .map(([name]) => name);

          currentIncident = createIncident(
            'degraded',
            `Health check failures: ${failedChecks.join(', ')}`
          );
        }
      }
    } catch (error) {
      Logger.error('Self-monitoring error', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, intervalMs);

  Logger.info('Self-monitoring started', { intervalMs });
}

export function stopSelfMonitoring(): void {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }
}

/**
 * Get uptime statistics
 */
export interface UptimeStats {
  uptime: number; // percentage
  uptimeMs: number;
  since: Date;
  currentStatus: 'healthy' | 'degraded' | 'unhealthy';
  lastHealthCheck: Date;
  incidents: Incident[];
  incidentCount: number;
  mttr: number; // Mean time to recovery in ms
}

export function getUptimeStats(): UptimeStats {
  const now = new Date();
  const totalMs = now.getTime() - startedAt.getTime();

  // Calculate downtime from incidents
  let downtimeMs = 0;
  for (const incident of incidents) {
    if (incident.durationMs) {
      downtimeMs += incident.durationMs;
    } else if (!incident.resolved) {
      // Ongoing incident
      downtimeMs += now.getTime() - incident.startedAt.getTime();
    }
  }

  const uptimeMs = totalMs - downtimeMs;
  const uptime = totalMs > 0 ? (uptimeMs / totalMs) * 100 : 100;

  // Calculate MTTR
  const resolvedIncidents = incidents.filter(i => i.resolved && i.durationMs);
  const mttr = resolvedIncidents.length > 0
    ? resolvedIncidents.reduce((sum, i) => sum + (i.durationMs || 0), 0) / resolvedIncidents.length
    : 0;

  let currentStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (!isHealthy) {
    currentStatus = consecutiveFailures >= 5 ? 'unhealthy' : 'degraded';
  }

  return {
    uptime,
    uptimeMs,
    since: startedAt,
    currentStatus,
    lastHealthCheck,
    incidents: incidents.slice(0, 10), // Last 10 incidents
    incidentCount: incidents.length,
    mttr,
  };
}

/**
 * Create uptime router with heartbeat endpoint
 */
export function createUptimeRouter(): Router {
  const router = Router();

  // Simple heartbeat for external monitoring (UptimeRobot, Pingdom, etc.)
  router.get('/heartbeat', (req: Request, res: Response) => {
    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Detailed uptime stats (for admin dashboard)
  router.get('/uptime', (req: Request, res: Response) => {
    const stats = getUptimeStats();
    res.json({
      uptime: stats.uptime.toFixed(4) + '%',
      since: stats.since.toISOString(),
      status: stats.currentStatus,
      lastCheck: stats.lastHealthCheck.toISOString(),
      incidents: stats.incidents.map(i => ({
        id: i.id,
        type: i.type,
        startedAt: i.startedAt.toISOString(),
        endedAt: i.endedAt?.toISOString(),
        durationMs: i.durationMs,
        description: i.description,
        resolved: i.resolved,
      })),
    });
  });

  // Webhook handler for UptimeRobot
  router.post('/webhooks/uptimerobot', (req: Request, res: Response) => {
    const { monitorID, monitorURL, monitorFriendlyName, alertType, alertDetails } = req.body;

    Logger.info('UptimeRobot webhook received', {
      monitorID,
      monitorURL,
      monitorFriendlyName,
      alertType,
      alertDetails,
    });

    if (alertType === 'down' || alertType === 1) {
      createIncident('downtime', `External monitor detected downtime: ${monitorFriendlyName}`);
    }

    res.status(200).json({ received: true });
  });

  // Webhook handler for Pingdom
  router.post('/webhooks/pingdom', (req: Request, res: Response) => {
    const { check_name, current_state, description } = req.body;

    Logger.info('Pingdom webhook received', {
      check_name,
      current_state,
      description,
    });

    if (current_state === 'failing') {
      createIncident('downtime', `Pingdom detected issue: ${check_name} - ${description}`);
    }

    res.status(200).json({ received: true });
  });

  return router;
}

// Export the router
export const uptimeRouter = createUptimeRouter();

// Export for external incident creation (from alerts)
export { createIncident, resolveIncident };
