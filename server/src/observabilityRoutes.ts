/**
 * Observability Admin Routes
 *
 * Protected API endpoints for the observability dashboard:
 * - Error summaries and trends
 * - Performance metrics
 * - Alert management
 * - System health
 */

import { Router, Request, Response } from 'express';
import { authenticate } from './auth';
import {
  getErrorSummary,
  getPerformanceSummary,
  getAlerts,
  getSystemHealth,
  getDashboardOverview,
} from './observability/dashboardData';
import {
  acknowledgeAlert,
  getUnacknowledgedAlerts,
  getThresholds,
  updateThresholds,
} from './observability/alerts';
import { getMetrics } from './observability/metrics';
import { getUptimeStats } from './observability/uptime';
import { Logger } from './logger';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/admin/observability/overview
 * Get complete dashboard overview
 */
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const overview = await getDashboardOverview(hours);
    res.json(overview);
  } catch (error) {
    Logger.error('Failed to get observability overview', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Failed to get dashboard overview' });
  }
});

/**
 * GET /api/admin/observability/errors/summary
 * Get error summary with optional time range
 */
router.get('/errors/summary', async (req: Request, res: Response) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const summary = await getErrorSummary(hours);
    res.json(summary);
  } catch (error) {
    Logger.error('Failed to get error summary', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Failed to get error summary' });
  }
});

/**
 * GET /api/admin/observability/performance
 * Get performance metrics summary
 */
router.get('/performance', async (req: Request, res: Response) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const summary = await getPerformanceSummary(hours);
    res.json(summary);
  } catch (error) {
    Logger.error('Failed to get performance summary', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Failed to get performance metrics' });
  }
});

/**
 * GET /api/admin/observability/metrics
 * Get raw metrics data
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = getMetrics();
    res.json(metrics);
  } catch (error) {
    Logger.error('Failed to get metrics', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

/**
 * GET /api/admin/observability/alerts
 * Get alert history
 */
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const alerts = await getAlerts(limit);
    res.json({ alerts });
  } catch (error) {
    Logger.error('Failed to get alerts', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Failed to get alerts' });
  }
});

/**
 * GET /api/admin/observability/alerts/unacknowledged
 * Get unacknowledged alerts count and list
 */
router.get('/alerts/unacknowledged', async (req: Request, res: Response) => {
  try {
    const alerts = getUnacknowledgedAlerts();
    res.json({
      count: alerts.length,
      alerts,
    });
  } catch (error) {
    Logger.error('Failed to get unacknowledged alerts', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Failed to get unacknowledged alerts' });
  }
});

/**
 * POST /api/admin/observability/alerts/:id/acknowledge
 * Acknowledge an alert
 */
router.post('/alerts/:id/acknowledge', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const acknowledgedBy = user?.email || user?.username || 'admin';

    const success = acknowledgeAlert(id, acknowledgedBy);

    if (success) {
      res.json({ success: true, message: 'Alert acknowledged' });
    } else {
      res.status(404).json({ error: 'Alert not found or already acknowledged' });
    }
  } catch (error) {
    Logger.error('Failed to acknowledge alert', {
      error: error instanceof Error ? error.message : String(error),
      alertId: req.params.id,
    });
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

/**
 * GET /api/admin/observability/system
 * Get system health overview
 */
router.get('/system', async (req: Request, res: Response) => {
  try {
    const health = await getSystemHealth();
    res.json(health);
  } catch (error) {
    Logger.error('Failed to get system health', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Failed to get system health' });
  }
});

/**
 * GET /api/admin/observability/uptime
 * Get uptime statistics
 */
router.get('/uptime', async (req: Request, res: Response) => {
  try {
    const stats = getUptimeStats();
    res.json({
      uptime: stats.uptime.toFixed(4) + '%',
      uptimeMs: stats.uptimeMs,
      since: stats.since.toISOString(),
      status: stats.currentStatus,
      lastHealthCheck: stats.lastHealthCheck.toISOString(),
      incidentCount: stats.incidentCount,
      mttrMs: stats.mttr,
      recentIncidents: stats.incidents.map(i => ({
        id: i.id,
        type: i.type,
        startedAt: i.startedAt.toISOString(),
        endedAt: i.endedAt?.toISOString(),
        durationMs: i.durationMs,
        description: i.description,
        resolved: i.resolved,
      })),
    });
  } catch (error) {
    Logger.error('Failed to get uptime stats', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Failed to get uptime statistics' });
  }
});

/**
 * GET /api/admin/observability/thresholds
 * Get current alert thresholds
 */
router.get('/thresholds', async (req: Request, res: Response) => {
  try {
    const thresholds = getThresholds();
    res.json(thresholds);
  } catch (error) {
    Logger.error('Failed to get thresholds', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Failed to get thresholds' });
  }
});

/**
 * PUT /api/admin/observability/thresholds
 * Update alert thresholds
 */
router.put('/thresholds', async (req: Request, res: Response) => {
  try {
    const newThresholds = req.body;

    // Validate thresholds
    const validKeys = [
      'errorRatePercent',
      'slowResponseTimeP95Ms',
      'memoryUsagePercent',
      'diskUsagePercent',
      'externalApiFailureCount',
      'dbConnectionFailures',
    ];

    const updates: Record<string, number> = {};
    for (const key of validKeys) {
      if (key in newThresholds && typeof newThresholds[key] === 'number') {
        updates[key] = newThresholds[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid threshold updates provided' });
    }

    updateThresholds(updates);
    const updated = getThresholds();

    res.json({
      success: true,
      message: 'Thresholds updated',
      thresholds: updated,
    });
  } catch (error) {
    Logger.error('Failed to update thresholds', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Failed to update thresholds' });
  }
});

export default router;
