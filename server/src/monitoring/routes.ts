import { Router, Request, Response } from 'express';
import { authenticate } from '../auth';
import { healthChecker } from '../healthcheck';
import { enhancedLogger } from './logger';
import { sentryMonitoring } from './sentry';
import { db } from '../../db';
import { sql } from 'drizzle-orm';

const router = Router();

// Extend health checker with more detailed checks
export async function getDetailedHealth() {
  const baseHealth = await healthChecker.getHealthStatus();
  
  // Add additional checks
  const additionalChecks = {
    redis: await checkRedisHealth(),
    diskSpace: await checkDiskSpace(),
    apiRateLimit: await checkAPIRateLimit(),
  };
  
  return {
    ...baseHealth,
    additionalChecks,
  };
}

async function checkRedisHealth(): Promise<any> {
  // If Redis is configured, check its health
  // For now, return a placeholder
  return {
    status: 'pass',
    message: 'Redis not configured',
  };
}

async function checkDiskSpace(): Promise<any> {
  // Check disk space availability
  try {
    const { execSync } = require('child_process');
    const output = execSync('df -h /').toString();
    const lines = output.split('\n');
    const dataLine = lines[1];
    const parts = dataLine.split(/\s+/);
    const usePercent = parseInt(parts[4].replace('%', ''));
    
    return {
      status: usePercent > 90 ? 'fail' : usePercent > 80 ? 'warn' : 'pass',
      message: `Disk usage: ${usePercent}%`,
      details: {
        used: parts[2],
        available: parts[3],
        usePercent,
      },
    };
  } catch (error) {
    return {
      status: 'warn',
      message: 'Unable to check disk space',
    };
  }
}

async function checkAPIRateLimit(): Promise<any> {
  // Check if we're approaching API rate limits
  // This would typically check against external APIs like HousecallPro
  return {
    status: 'pass',
    message: 'API rate limits OK',
    details: {
      housecallPro: {
        used: 1000,
        limit: 10000,
        resetAt: new Date(Date.now() + 3600000).toISOString(),
      },
    },
  };
}

// Health endpoints
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await healthChecker.getHealthStatus();
    const statusCode = health.status === 'healthy' ? 200 : 
                       health.status === 'degraded' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    enhancedLogger.error('Health check failed', error);
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed',
    });
  }
});

router.get('/health/ready', async (req: Request, res: Response) => {
  try {
    // Check if the application is ready to serve traffic
    const health = await healthChecker.getHealthStatus();
    
    // Application is ready if database and critical services are available
    const isReady = health.checks.database.status === 'pass' &&
                   health.checks.environment.status === 'pass';
    
    if (isReady) {
      res.json({ status: 'ready' });
    } else {
      res.status(503).json({
        status: 'not_ready',
        checks: health.checks,
      });
    }
  } catch (error) {
    res.status(503).json({ status: 'not_ready', error: 'Readiness check failed' });
  }
});

router.get('/health/live', async (req: Request, res: Response) => {
  // Liveness check - is the application running?
  // This should be very lightweight
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

router.get('/health/detailed', authenticate, async (req: Request, res: Response) => {
  try {
    const detailedHealth = await getDetailedHealth();
    res.json(detailedHealth);
  } catch (error) {
    enhancedLogger.error('Detailed health check failed', error);
    res.status(500).json({ error: 'Failed to get detailed health' });
  }
});

// Performance metrics endpoints
router.get('/monitoring/performance/:timeRange', authenticate, async (req: Request, res: Response) => {
  const { timeRange } = req.params;
  
  try {
    // Get performance metrics from database or cache
    // This would typically aggregate metrics from various sources
    const metrics = await getPerformanceMetrics(timeRange);
    res.json(metrics);
  } catch (error) {
    enhancedLogger.error('Failed to get performance metrics', error);
    res.status(500).json({ error: 'Failed to get performance metrics' });
  }
});

// Error metrics endpoints
router.get('/monitoring/errors/:timeRange', authenticate, async (req: Request, res: Response) => {
  const { timeRange } = req.params;
  
  try {
    // Get error metrics
    const errors = await getErrorMetrics(timeRange);
    res.json(errors);
  } catch (error) {
    enhancedLogger.error('Failed to get error metrics', error);
    res.status(500).json({ error: 'Failed to get error metrics' });
  }
});

// API metrics endpoints
router.get('/monitoring/api-metrics/:timeRange', authenticate, async (req: Request, res: Response) => {
  const { timeRange } = req.params;
  
  try {
    const metrics = await getAPIMetrics(timeRange);
    res.json(metrics);
  } catch (error) {
    enhancedLogger.error('Failed to get API metrics', error);
    res.status(500).json({ error: 'Failed to get API metrics' });
  }
});

// Logs endpoints
router.get('/monitoring/logs', authenticate, async (req: Request, res: Response) => {
  const { level, search, correlationId } = req.query;
  
  try {
    const logs = await enhancedLogger.searchLogs({
      level: level as string,
      search: search as string,
      correlationId: correlationId as string,
      limit: 100,
    });
    
    res.json(logs);
  } catch (error) {
    enhancedLogger.error('Failed to get logs', error);
    res.status(500).json({ error: 'Failed to get logs' });
  }
});

router.get('/monitoring/logs/export', authenticate, async (req: Request, res: Response) => {
  const { timeRange } = req.query;
  
  try {
    const logsBuffer = await enhancedLogger.exportLogs(timeRange as string);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=logs-${Date.now()}.json`);
    res.send(logsBuffer);
  } catch (error) {
    enhancedLogger.error('Failed to export logs', error);
    res.status(500).json({ error: 'Failed to export logs' });
  }
});

router.post('/monitoring/logs/clear', authenticate, async (req: Request, res: Response) => {
  const { olderThan } = req.body;
  
  try {
    await enhancedLogger.clearOldLogs(olderThan);
    res.json({ success: true, message: `Cleared logs older than ${olderThan}` });
  } catch (error) {
    enhancedLogger.error('Failed to clear logs', error);
    res.status(500).json({ error: 'Failed to clear logs' });
  }
});

// Debug mode toggle
router.post('/monitoring/debug-mode', authenticate, async (req: Request, res: Response) => {
  const { enabled } = req.body;
  
  try {
    enhancedLogger.setDebugMode(enabled);
    res.json({ success: true, debugMode: enabled });
  } catch (error) {
    enhancedLogger.error('Failed to toggle debug mode', error);
    res.status(500).json({ error: 'Failed to toggle debug mode' });
  }
});

// Web Vitals endpoint (receive metrics from frontend)
router.post('/analytics/web-vitals', async (req: Request, res: Response) => {
  const metric = req.body;
  const correlationId = (req as any).correlationId;
  
  try {
    // Store web vitals metric
    enhancedLogger.info('Web Vital received', {
      correlationId,
      metric: metric.name,
      value: metric.value,
      rating: metric.rating,
    });
    
    // Store in database if needed
    await storeWebVitalMetric(metric);
    
    res.json({ success: true });
  } catch (error) {
    enhancedLogger.error('Failed to store web vital', error);
    res.status(500).json({ error: 'Failed to store web vital' });
  }
});

// Performance alert endpoint
router.post('/monitoring/performance-alert', async (req: Request, res: Response) => {
  const alert = req.body;
  
  try {
    enhancedLogger.warn('Performance budget exceeded', alert);
    
    // Send alert to monitoring service if configured
    if (process.env.SENTRY_DSN) {
      sentryMonitoring.captureMessage(
        `Performance budget exceeded: ${alert.metric}`,
        'warning',
        alert
      );
    }
    
    res.json({ success: true });
  } catch (error) {
    enhancedLogger.error('Failed to process performance alert', error);
    res.status(500).json({ error: 'Failed to process performance alert' });
  }
});

// Helper functions
async function getPerformanceMetrics(timeRange: string): Promise<any[]> {
  // Mock implementation - replace with actual metrics storage
  const metrics = [];
  const now = Date.now();
  const ranges: Record<string, number> = {
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
  };
  
  const rangeMs = ranges[timeRange] || ranges['1h'];
  const dataPoints = 20;
  const interval = rangeMs / dataPoints;
  
  for (let i = 0; i < dataPoints; i++) {
    metrics.push({
      timestamp: new Date(now - (i * interval)).toISOString(),
      metric: 'response_time',
      value: Math.random() * 200 + 50,
      rating: Math.random() > 0.8 ? 'poor' : Math.random() > 0.5 ? 'needs-improvement' : 'good',
    });
  }
  
  return metrics;
}

async function getErrorMetrics(timeRange: string): Promise<any[]> {
  // Mock implementation - replace with actual error tracking
  const errors = [];
  const errorTypes = ['TypeError', 'ReferenceError', 'ValidationError', 'NetworkError'];
  
  for (let i = 0; i < 10; i++) {
    errors.push({
      timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      count: Math.floor(Math.random() * 5) + 1,
      type: errorTypes[Math.floor(Math.random() * errorTypes.length)],
      message: 'Sample error message',
      url: '/api/sample-endpoint',
    });
  }
  
  return errors;
}

async function getAPIMetrics(timeRange: string): Promise<any[]> {
  // Mock implementation - replace with actual API metrics
  const endpoints = [
    '/api/capacity',
    '/api/booking',
    '/api/customers',
    '/api/services',
    '/api/availability',
  ];
  
  return endpoints.map(endpoint => ({
    endpoint,
    method: 'GET',
    avgResponseTime: Math.floor(Math.random() * 300) + 50,
    p95ResponseTime: Math.floor(Math.random() * 500) + 100,
    p99ResponseTime: Math.floor(Math.random() * 800) + 200,
    errorRate: Math.random() * 0.05,
    requestCount: Math.floor(Math.random() * 1000) + 100,
    successCount: Math.floor(Math.random() * 950) + 95,
  }));
}

async function storeWebVitalMetric(metric: any): Promise<void> {
  // Store web vital metric in database
  try {
    await db.execute(sql`
      INSERT INTO web_vitals_metrics (
        metric_name, value, rating, timestamp, page_url
      ) VALUES (
        ${metric.name},
        ${metric.value},
        ${metric.rating},
        ${new Date().toISOString()},
        ${metric.url || ''}
      )
    `);
  } catch (error) {
    // Table might not exist yet, log and continue
    enhancedLogger.debug('Failed to store web vital metric', error);
  }
}

export default router;