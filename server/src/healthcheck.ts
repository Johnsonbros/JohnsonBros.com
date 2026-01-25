import { db } from '../db';
import { sql } from 'drizzle-orm';
import { HousecallProClient } from './housecall';
import { Logger } from './logger';
import { getEnvSummary, type EnvSummary } from './envValidator';
import type { Request, Response, Router } from 'express';

// ============================================================================
// Health Check Types
// ============================================================================

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: CheckResult;
    housecallpro: CheckResult;
    memory: CheckResult;
    environment: CheckResult;
  };
  version?: string;
}

export interface ReadinessStatus {
  ready: boolean;
  timestamp: string;
  checks: {
    database: CheckResult;
    memory: CheckResult;
  };
}

export interface DetailedHealthStatus extends HealthStatus {
  environment: EnvSummary;
  system: {
    nodeVersion: string;
    platform: string;
    arch: string;
    pid: number;
    cpuUsage: NodeJS.CpuUsage;
  };
}

interface CheckResult {
  status: 'pass' | 'warn' | 'fail';
  message?: string;
  responseTime?: number;
  details?: Record<string, unknown>;
}

// ============================================================================
// Health Checker Class
// ============================================================================

class HealthChecker {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Check database connectivity and response time
   */
  async checkDatabase(): Promise<CheckResult> {
    const start = Date.now();
    try {
      // Simple query to check database connectivity
      const result = await db.execute(sql`SELECT 1 as test`);
      const responseTime = Date.now() - start;

      if (responseTime > 1000) {
        return {
          status: 'warn',
          message: 'Database response slow',
          responseTime,
        };
      }

      return {
        status: 'pass',
        message: 'Database connection healthy',
        responseTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Logger.error('Database health check failed', { error: errorMessage });
      return {
        status: 'fail',
        message: 'Database connection failed',
        details: { error: errorMessage },
      };
    }
  }

  /**
   * Check HousecallPro API connectivity
   */
  async checkHousecallPro(): Promise<CheckResult> {
    const start = Date.now();
    try {
      const client = HousecallProClient.getInstance();
      // Simple API call to check connectivity
      await client.getEmployees();
      const responseTime = Date.now() - start;

      if (responseTime > 2000) {
        return {
          status: 'warn',
          message: 'HousecallPro API response slow',
          responseTime,
        };
      }

      return {
        status: 'pass',
        message: 'HousecallPro API healthy',
        responseTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Logger.error('HousecallPro health check failed', { error: errorMessage });
      return {
        status: 'warn', // Degraded, not failed - can still operate
        message: 'HousecallPro API unreachable',
        details: { error: errorMessage },
      };
    }
  }

  /**
   * Check memory usage
   */
  checkMemory(): CheckResult {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
    const rssMB = Math.round(usage.rss / 1024 / 1024);

    // Warn if heap usage is over 80%
    const heapPercentage = (usage.heapUsed / usage.heapTotal) * 100;

    if (heapPercentage > 90) {
      return {
        status: 'fail',
        message: 'Critical memory usage',
        details: {
          heapUsedMB,
          heapTotalMB,
          rssMB,
          heapPercentage: Math.round(heapPercentage),
        },
      };
    }

    if (heapPercentage > 80) {
      return {
        status: 'warn',
        message: 'High memory usage',
        details: {
          heapUsedMB,
          heapTotalMB,
          rssMB,
          heapPercentage: Math.round(heapPercentage),
        },
      };
    }

    return {
      status: 'pass',
      message: 'Memory usage normal',
      details: {
        heapUsedMB,
        heapTotalMB,
        rssMB,
        heapPercentage: Math.round(heapPercentage),
      },
    };
  }

  /**
   * Check environment configuration
   */
  checkEnvironment(): CheckResult {
    const summary = getEnvSummary();

    // Critical checks
    if (!summary.hasDatabase) {
      return {
        status: 'fail',
        message: 'Missing database configuration',
        details: { missing: ['DATABASE_URL'] },
      };
    }

    if (!summary.hasSessionSecret) {
      return {
        status: 'fail',
        message: 'Missing session secret',
        details: { missing: ['SESSION_SECRET'] },
      };
    }

    // Required checks
    const missingRequired: string[] = [];
    if (!summary.hasHousecallAPI) missingRequired.push('HOUSECALL_PRO_API_KEY');
    if (!summary.hasGoogleMaps) missingRequired.push('GOOGLE_MAPS_API_KEY');

    if (missingRequired.length > 0) {
      return {
        status: summary.environment === 'production' ? 'fail' : 'warn',
        message: 'Missing required environment variables',
        details: { missingRequired },
      };
    }

    // Optional recommendations
    const missingOptional: string[] = [];
    if (!summary.hasSentry) missingOptional.push('SENTRY_DSN');
    if (!summary.hasOpenAI) missingOptional.push('OPENAI_API_KEY');
    if (!summary.hasTwilio) missingOptional.push('TWILIO_ACCOUNT_SID');

    if (missingOptional.length > 0) {
      return {
        status: 'pass',
        message: 'All required variables configured (some optional missing)',
        details: { missingOptional },
      };
    }

    return {
      status: 'pass',
      message: 'All environment variables configured',
    };
  }

  /**
   * Get uptime in seconds
   */
  getUptime(): number {
    return Math.round((Date.now() - this.startTime) / 1000);
  }

  /**
   * Get basic health status (for /health endpoint)
   * Always returns 200 if the server is running
   */
  async getHealthStatus(): Promise<HealthStatus> {
    const [database, housecallpro] = await Promise.all([
      this.checkDatabase(),
      this.checkHousecallPro(),
    ]);

    const memory = this.checkMemory();
    const environment = this.checkEnvironment();

    // Determine overall status
    const checks = { database, housecallpro, memory, environment };
    const hasFailure = Object.values(checks).some(check => check.status === 'fail');
    const hasWarning = Object.values(checks).some(check => check.status === 'warn');

    let status: HealthStatus['status'] = 'healthy';
    if (hasFailure) {
      status = 'unhealthy';
    } else if (hasWarning) {
      status = 'degraded';
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: this.getUptime(),
      checks,
      version: process.env.APP_VERSION || '1.0.0',
    };
  }

  /**
   * Get readiness status (for /health/ready endpoint)
   * Returns 200 if ready to accept traffic, 503 if not
   */
  async getReadinessStatus(): Promise<ReadinessStatus> {
    const [database] = await Promise.all([
      this.checkDatabase(),
    ]);

    const memory = this.checkMemory();

    // Ready if database is accessible and memory is not critical
    const ready = database.status !== 'fail' && memory.status !== 'fail';

    return {
      ready,
      timestamp: new Date().toISOString(),
      checks: {
        database,
        memory,
      },
    };
  }

  /**
   * Get detailed health status (for /health/details endpoint)
   * Requires authentication
   */
  async getDetailedHealthStatus(): Promise<DetailedHealthStatus> {
    const basicStatus = await this.getHealthStatus();

    return {
      ...basicStatus,
      environment: getEnvSummary(),
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
        cpuUsage: process.cpuUsage(),
      },
    };
  }
}

// Singleton instance
export const healthChecker = new HealthChecker();

// ============================================================================
// Route Handlers
// ============================================================================

/**
 * Liveness probe - /health
 * Returns 200 if the server is running (even if degraded)
 */
export async function healthHandler(req: Request, res: Response): Promise<void> {
  try {
    const status = await healthChecker.getHealthStatus();

    // Always return 200 for liveness - server is alive
    res.status(200).json(status);
  } catch (error) {
    // Even on error, return 200 with error info
    res.status(200).json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      uptime: healthChecker.getUptime(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Readiness probe - /health/ready
 * Returns 200 if ready to accept traffic, 503 if not
 */
export async function readinessHandler(req: Request, res: Response): Promise<void> {
  try {
    const status = await healthChecker.getReadinessStatus();

    if (status.ready) {
      res.status(200).json(status);
    } else {
      res.status(503).json(status);
    }
  } catch (error) {
    res.status(503).json({
      ready: false,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Detailed health - /health/details
 * Requires authentication (admin only)
 */
export async function detailedHealthHandler(req: Request, res: Response): Promise<void> {
  try {
    const status = await healthChecker.getDetailedHealthStatus();
    res.status(status.status === 'unhealthy' ? 503 : 200).json(status);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Register health check routes
 */
export function registerHealthRoutes(router: Router): void {
  // Basic liveness probe
  router.get('/health', healthHandler);

  // Readiness probe for load balancers
  router.get('/health/ready', readinessHandler);

  // Note: /health/details should be registered with authentication middleware
  // Example: router.get('/health/details', authenticate, isAdmin, detailedHealthHandler);
}
