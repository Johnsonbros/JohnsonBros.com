import { db } from '../db';
import { sql } from 'drizzle-orm';
import { HousecallProClient } from './housecall';
import { Logger } from './logger';

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

interface CheckResult {
  status: 'pass' | 'warn' | 'fail';
  message?: string;
  responseTime?: number;
  details?: any;
}

class HealthChecker {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

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
        details: errorMessage,
      };
    }
  }

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
        details: errorMessage,
      };
    }
  }

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

  checkEnvironment(): CheckResult {
    const required = [
      'DATABASE_URL',
      'HOUSECALL_PRO_API_KEY',
      'VITE_GOOGLE_MAPS_API_KEY',
    ];
    
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      return {
        status: 'fail',
        message: 'Missing required environment variables',
        details: { missing },
      };
    }
    
    // Check optional but recommended vars
    const recommended = [
      'ADMIN_EMAIL',
      'ADMIN_DEFAULT_PASSWORD',
      'SESSION_SECRET',
      'GOOGLE_ADS_DEV_TOKEN',
    ];
    
    const missingRecommended = recommended.filter(key => !process.env[key]);
    
    if (missingRecommended.length > 0) {
      return {
        status: 'warn',
        message: 'Missing recommended environment variables',
        details: { missingRecommended },
      };
    }
    
    return {
      status: 'pass',
      message: 'All environment variables configured',
    };
  }

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
      uptime: Math.round((Date.now() - this.startTime) / 1000),
      checks,
      version: process.env.APP_VERSION || '1.0.0',
    };
  }
}

export const healthChecker = new HealthChecker();