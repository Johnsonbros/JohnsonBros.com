import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Log colors for console output
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
};

winston.addColors(colors);

// Custom format with correlation ID
const correlationFormat = winston.format.printf(({ level, message, timestamp, correlationId, ...metadata }) => {
  let msg = `${timestamp} [${level}]`;
  if (correlationId) {
    msg += ` [${correlationId}]`;
  }
  msg += ` ${message}`;
  
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  
  return msg;
});

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        correlationFormat
      ),
    }),
    
    // Daily rotate file for all logs
    new DailyRotateFile({
      filename: path.join(logsDir, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
    
    // Separate file for errors
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
  ],
});

// Development-specific transport
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.File({
    filename: path.join(logsDir, 'debug.log'),
    level: 'debug',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
  }));
}

// Enhanced logger with correlation ID support
export class EnhancedLogger {
  private static instance: EnhancedLogger;
  private correlationIds = new Map<string, string>();
  private debugMode = process.env.DEBUG_MODE === 'true';

  private constructor() {}

  static getInstance(): EnhancedLogger {
    if (!EnhancedLogger.instance) {
      EnhancedLogger.instance = new EnhancedLogger();
    }
    return EnhancedLogger.instance;
  }

  // Generate correlation ID
  generateCorrelationId(): string {
    return `req_${Date.now()}_${uuidv4().substring(0, 8)}`;
  }

  // Set correlation ID for a request
  setCorrelationId(requestId: string, correlationId: string) {
    this.correlationIds.set(requestId, correlationId);
  }

  // Get correlation ID for a request
  getCorrelationId(requestId: string): string | undefined {
    return this.correlationIds.get(requestId);
  }

  // Clear correlation ID (cleanup)
  clearCorrelationId(requestId: string) {
    this.correlationIds.delete(requestId);
  }

  // Log methods with correlation ID support
  log(level: string, message: string, meta?: any) {
    const correlationId = meta?.correlationId || meta?.requestId;
    logger.log(level, message, {
      ...meta,
      correlationId,
    });
  }

  error(message: string, error?: Error | any, meta?: any) {
    const errorMeta = {
      ...meta,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    };
    this.log('error', message, errorMeta);
  }

  warn(message: string, meta?: any) {
    this.log('warn', message, meta);
  }

  info(message: string, meta?: any) {
    this.log('info', message, meta);
  }

  debug(message: string, meta?: any) {
    if (this.debugMode || process.env.NODE_ENV !== 'production') {
      this.log('debug', message, meta);
    }
  }

  // Express middleware to add correlation ID
  correlationMiddleware() {
    return (req: Request & { correlationId?: string; requestId?: string }, res: Response, next: NextFunction) => {
      const correlationId = this.generateCorrelationId();
      req.correlationId = correlationId;
      req.requestId = correlationId; // For compatibility
      
      // Add to response headers for tracing
      res.setHeader('X-Correlation-ID', correlationId);
      
      // Log request
      this.info(`${req.method} ${req.path}`, {
        correlationId,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
      
      // Clean up on response finish
      res.on('finish', () => {
        this.info(`Response sent`, {
          correlationId,
          statusCode: res.statusCode,
          method: req.method,
          path: req.path,
        });
        this.clearCorrelationId(correlationId);
      });
      
      next();
    };
  }

  // Request logging middleware
  requestLoggingMiddleware() {
    return (req: Request & { correlationId?: string }, res: Response, next: NextFunction) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
          correlationId: req.correlationId,
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          duration,
          ip: req.ip,
          userAgent: req.get('user-agent'),
        };
        
        if (res.statusCode >= 400) {
          this.warn('Request completed with error status', logData);
        } else if (duration > 1000) {
          this.warn('Slow request detected', logData);
        } else {
          this.info('Request completed', logData);
        }
      });
      
      next();
    };
  }

  // Error logging middleware
  errorLoggingMiddleware() {
    return (err: Error, req: Request & { correlationId?: string }, res: Response, next: NextFunction) => {
      this.error('Unhandled error in request', err, {
        correlationId: req.correlationId,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
      });
      
      next(err);
    };
  }

  // Toggle debug mode
  setDebugMode(enabled: boolean) {
    this.debugMode = enabled;
    logger.level = enabled ? 'debug' : (process.env.LOG_LEVEL || 'info');
    this.info('Debug mode changed', { debugMode: enabled });
  }

  // Get debug mode status
  isDebugMode(): boolean {
    return this.debugMode;
  }

  // Search logs
  async searchLogs(options: {
    level?: string;
    search?: string;
    correlationId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<any[]> {
    const logs: any[] = [];
    const { level, search, correlationId, limit = 100 } = options;
    
    try {
      // Read recent log files
      const logFiles = fs.readdirSync(logsDir)
        .filter(file => file.startsWith('application-'))
        .sort()
        .reverse()
        .slice(0, 3); // Last 3 days
      
      for (const file of logFiles) {
        const content = fs.readFileSync(path.join(logsDir, file), 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const log = JSON.parse(line);
            
            // Apply filters
            if (level && log.level !== level) continue;
            if (correlationId && log.correlationId !== correlationId) continue;
            if (search && !JSON.stringify(log).toLowerCase().includes(search.toLowerCase())) continue;
            
            logs.push(log);
            
            if (logs.length >= limit) break;
          } catch (e) {
            // Skip malformed log lines
          }
        }
        
        if (logs.length >= limit) break;
      }
    } catch (error) {
      this.error('Failed to search logs', error);
    }
    
    return logs.slice(0, limit);
  }

  // Export logs
  async exportLogs(timeRange: string): Promise<Buffer> {
    const logs = await this.searchLogs({ limit: 10000 });
    return Buffer.from(JSON.stringify(logs, null, 2));
  }

  // Clear old logs
  async clearOldLogs(olderThan: string) {
    const daysMatch = olderThan.match(/(\d+)d/);
    if (!daysMatch) return;
    
    const days = parseInt(daysMatch[1]);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    try {
      const files = fs.readdirSync(logsDir);
      for (const file of files) {
        const filePath = path.join(logsDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          this.info(`Deleted old log file: ${file}`);
        }
      }
    } catch (error) {
      this.error('Failed to clear old logs', error);
    }
  }

  // Get log statistics
  async getLogStats(): Promise<any> {
    const stats = {
      totalLogs: 0,
      errorCount: 0,
      warnCount: 0,
      infoCount: 0,
      debugCount: 0,
      logFileSize: 0,
      oldestLog: null as Date | null,
      newestLog: null as Date | null,
    };
    
    try {
      const files = fs.readdirSync(logsDir);
      
      for (const file of files) {
        const filePath = path.join(logsDir, file);
        const fileStats = fs.statSync(filePath);
        stats.logFileSize += fileStats.size;
        
        if (file.startsWith('application-')) {
          const content = fs.readFileSync(filePath, 'utf-8');
          const lines = content.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            try {
              const log = JSON.parse(line);
              stats.totalLogs++;
              
              switch (log.level) {
                case 'error': stats.errorCount++; break;
                case 'warn': stats.warnCount++; break;
                case 'info': stats.infoCount++; break;
                case 'debug': stats.debugCount++; break;
              }
              
              const timestamp = new Date(log.timestamp);
              if (!stats.oldestLog || timestamp < stats.oldestLog) {
                stats.oldestLog = timestamp;
              }
              if (!stats.newestLog || timestamp > stats.newestLog) {
                stats.newestLog = timestamp;
              }
            } catch (e) {
              // Skip malformed lines
            }
          }
        }
      }
    } catch (error) {
      this.error('Failed to get log stats', error);
    }
    
    return stats;
  }
}

export const enhancedLogger = EnhancedLogger.getInstance();
export { logger as winstonLogger };