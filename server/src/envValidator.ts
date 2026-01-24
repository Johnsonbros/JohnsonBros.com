import { z } from 'zod';
import { Logger } from './logger';

// ============================================================================
// ENVIRONMENT VARIABLE SCHEMA DEFINITIONS
// ============================================================================

/**
 * CRITICAL variables - Application won't start without these
 */
const criticalEnvSchema = z.object({
  DATABASE_URL: z.string()
    .url('DATABASE_URL must be a valid URL')
    .refine(
      (val) => val.startsWith('postgresql://') || val.startsWith('postgres://'),
      'DATABASE_URL must be a PostgreSQL connection string'
    ),
  SESSION_SECRET: z.string()
    .min(32, 'SESSION_SECRET must be at least 32 characters for security'),
  NODE_ENV: z.enum(['development', 'staging', 'production'])
    .default('development'),
});

/**
 * REQUIRED variables - Core features will be broken without these
 */
const requiredEnvSchema = z.object({
  HOUSECALL_PRO_API_KEY: z.string()
    .min(10, 'HOUSECALL_PRO_API_KEY must be at least 10 characters')
    .optional(),
  HCP_COMPANY_API_KEY: z.string()
    .min(10, 'HCP_COMPANY_API_KEY must be at least 10 characters')
    .optional(),
  GOOGLE_MAPS_API_KEY: z.string()
    .refine(
      (val) => val.startsWith('AIza'),
      'GOOGLE_MAPS_API_KEY must start with "AIza"'
    ),
  TWILIO_ACCOUNT_SID: z.string()
    .refine(
      (val) => val.startsWith('AC'),
      'TWILIO_ACCOUNT_SID must start with "AC"'
    ),
  TWILIO_AUTH_TOKEN: z.string()
    .min(20, 'TWILIO_AUTH_TOKEN must be at least 20 characters'),
  OPENAI_API_KEY: z.string()
    .refine(
      (val) => val.startsWith('sk-'),
      'OPENAI_API_KEY must start with "sk-"'
    ),
}).refine(
  (data) => data.HOUSECALL_PRO_API_KEY || data.HCP_COMPANY_API_KEY,
  'Either HOUSECALL_PRO_API_KEY or HCP_COMPANY_API_KEY must be set'
);

/**
 * OPTIONAL variables - Enhanced features only
 */
const optionalEnvSchema = z.object({
  // Monitoring & Error tracking
  SENTRY_DSN: z.string().url().optional(),
  VITE_SENTRY_DSN: z.string().url().optional(),

  // Site configuration
  SITE_URL: z.string().url().optional(),

  // Google Service Account
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().email().optional(),

  // Google Analytics
  GA4_PROPERTY_ID: z.string().optional(),

  // Google Ads Configuration
  GOOGLE_ADS_CLIENT_ID: z.string().optional(),
  GOOGLE_ADS_CLIENT_SECRET: z.string().optional(),
  GOOGLE_ADS_DEVELOPER_TOKEN: z.string().optional(),
  GOOGLE_ADS_CUSTOMER_ID: z.string().optional(),
  GOOGLE_ADS_REFRESH_TOKEN: z.string().optional(),
  GOOGLE_ADS_BRAND_CAMPAIGN_ID: z.string().optional(),
  GOOGLE_ADS_DISCOVERY_CAMPAIGN_ID: z.string().optional(),

  // Additional optional services
  PORT: z.string().regex(/^\d+$/).transform(Number).optional(),
  MCP_PORT: z.string().regex(/^\d+$/).transform(Number).optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional(),
  APP_VERSION: z.string().optional(),
  COMPANY_TZ: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),

  // Twilio additional config
  TWILIO_PHONE_NUMBER: z.string().regex(/^\+\d{10,15}$/).optional(),

  // Admin config
  SUPER_ADMIN_EMAIL: z.string().email().optional(),
  SUPER_ADMIN_PASSWORD: z.string().min(8).optional(),
  SUPER_ADMIN_NAME: z.string().optional(),

  // Google Maps variants
  VITE_GOOGLE_MAPS_API_KEY: z.string().optional(),
  GOOGLE_PLACES_API_KEY: z.string().optional(),

  // Security
  INTERNAL_SECRET: z.string().min(32).optional(),
  HOUSECALL_WEBHOOK_SECRET: z.string().min(16).optional(),
  WEBHOOK_URL: z.string().url().optional(),

  // HousecallPro additional
  HOUSECALL_COMPANY_ID: z.string().optional(),
  DEFAULT_DISPATCH_EMPLOYEE_IDS: z.string().optional(),
  HCP_API_BASE: z.string().url().optional(),
});

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export type CriticalEnv = z.infer<typeof criticalEnvSchema>;
export type RequiredEnv = z.infer<typeof requiredEnvSchema>;
export type OptionalEnv = z.infer<typeof optionalEnvSchema>;

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface EnvSummary {
  environment: string;
  hasDatabase: boolean;
  hasHousecallAPI: boolean;
  hasGoogleMaps: boolean;
  hasTwilio: boolean;
  hasOpenAI: boolean;
  hasSessionSecret: boolean;
  hasSentry: boolean;
  hasGoogleAds: boolean;
  port: number;
  version: string;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates CRITICAL environment variables.
 * These are absolutely required - the app will not start without them.
 */
function validateCriticalEnv(): { success: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check DATABASE_URL
  if (!process.env.DATABASE_URL) {
    errors.push('CRITICAL: DATABASE_URL is required - application cannot start');
  } else {
    const urlResult = criticalEnvSchema.shape.DATABASE_URL.safeParse(process.env.DATABASE_URL);
    if (!urlResult.success) {
      errors.push(`CRITICAL: DATABASE_URL - ${urlResult.error.errors[0]?.message}`);
    }
  }

  // Check SESSION_SECRET
  if (!process.env.SESSION_SECRET) {
    // In development, we can auto-generate
    if (process.env.NODE_ENV !== 'production') {
      const crypto = require('crypto');
      process.env.SESSION_SECRET = crypto.randomBytes(32).toString('hex');
      Logger.warn('[ENV] Generated development SESSION_SECRET. Set this explicitly in production!');
    } else {
      errors.push('CRITICAL: SESSION_SECRET is required in production - application cannot start');
    }
  } else if (process.env.SESSION_SECRET.length < 32) {
    errors.push('CRITICAL: SESSION_SECRET must be at least 32 characters');
  }

  // Check NODE_ENV
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (!['development', 'staging', 'production'].includes(nodeEnv)) {
    errors.push(`CRITICAL: NODE_ENV must be one of: development, staging, production (got: ${nodeEnv})`);
  }

  return { success: errors.length === 0, errors };
}

/**
 * Validates REQUIRED environment variables.
 * Core features will not work without these.
 * In development, these generate warnings instead of errors.
 */
function validateRequiredEnv(): { success: boolean; errors: string[]; warnings: string[] } {
  const isProduction = process.env.NODE_ENV === 'production';
  const errors: string[] = [];
  const warnings: string[] = [];
  const addIssue = (message: string) => {
    if (isProduction) {
      errors.push(message);
    } else {
      warnings.push(message);
    }
  };

  // Check HousecallPro API key (one of two required)
  const hasHCPKey = !!(process.env.HOUSECALL_PRO_API_KEY || process.env.HCP_COMPANY_API_KEY);
  if (!hasHCPKey) {
    addIssue('REQUIRED: Either HOUSECALL_PRO_API_KEY or HCP_COMPANY_API_KEY must be set');
  }

  // Check Google Maps API key
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    addIssue('REQUIRED: GOOGLE_MAPS_API_KEY is required for geocoding and maps');
  } else if (!process.env.GOOGLE_MAPS_API_KEY.startsWith('AIza')) {
    addIssue('REQUIRED: GOOGLE_MAPS_API_KEY should start with "AIza"');
  }

  // Check Twilio
  if (!process.env.TWILIO_ACCOUNT_SID) {
    addIssue('REQUIRED: TWILIO_ACCOUNT_SID is required for SMS notifications');
  } else if (!process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
    addIssue('REQUIRED: TWILIO_ACCOUNT_SID should start with "AC"');
  }

  if (!process.env.TWILIO_AUTH_TOKEN) {
    addIssue('REQUIRED: TWILIO_AUTH_TOKEN is required for SMS notifications');
  } else if (process.env.TWILIO_AUTH_TOKEN.length < 20) {
    addIssue('REQUIRED: TWILIO_AUTH_TOKEN appears to be too short');
  }

  // Check OpenAI
  if (!process.env.OPENAI_API_KEY) {
    addIssue('REQUIRED: OPENAI_API_KEY is required for AI chat features');
  } else if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
    addIssue('REQUIRED: OPENAI_API_KEY should start with "sk-"');
  }

  return { success: errors.length === 0, errors, warnings };
}

/**
 * Validates OPTIONAL environment variables.
 * Missing these just logs info messages.
 */
function validateOptionalEnv(): { info: string[] } {
  const info: string[] = [];

  const optionalChecks = [
    { key: 'SENTRY_DSN', feature: 'error tracking' },
    { key: 'SITE_URL', feature: 'canonical URLs and sitemap generation' },
    { key: 'GOOGLE_SERVICE_ACCOUNT_EMAIL', feature: 'Google service account integration' },
    { key: 'GA4_PROPERTY_ID', feature: 'Google Analytics 4' },
    { key: 'GOOGLE_ADS_CLIENT_ID', feature: 'Google Ads automation' },
  ];

  for (const check of optionalChecks) {
    if (!process.env[check.key]) {
      info.push(`OPTIONAL: ${check.key} not set - ${check.feature} disabled`);
    }
  }

  // Set defaults for optional values
  if (!process.env.PORT) {
    process.env.PORT = '5000';
  }
  if (!process.env.MCP_PORT) {
    process.env.MCP_PORT = '3001';
  }
  if (!process.env.LOG_LEVEL) {
    process.env.LOG_LEVEL = process.env.NODE_ENV === 'production' ? 'info' : 'debug';
  }
  if (!process.env.APP_VERSION) {
    process.env.APP_VERSION = '1.0.0';
  }
  if (!process.env.COMPANY_TZ) {
    process.env.COMPANY_TZ = 'America/New_York';
  }

  // Set VITE_GOOGLE_MAPS_API_KEY from GOOGLE_MAPS_API_KEY if not set
  if (!process.env.VITE_GOOGLE_MAPS_API_KEY && process.env.GOOGLE_MAPS_API_KEY) {
    process.env.VITE_GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
  }

  return { info };
}

/**
 * Main validation function - validates all environment variables
 * and returns a comprehensive result.
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate critical (will prevent startup if missing)
  const criticalResult = validateCriticalEnv();
  errors.push(...criticalResult.errors);

  // Validate required (errors in prod, warnings in dev)
  const requiredResult = validateRequiredEnv();
  errors.push(...requiredResult.errors);
  warnings.push(...requiredResult.warnings);

  // Validate optional (info only)
  const optionalResult = validateOptionalEnv();

  // Log optional info messages at debug level
  if (process.env.NODE_ENV !== 'production') {
    for (const msg of optionalResult.info) {
      Logger.debug(`[ENV] ${msg}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Returns a summary of the current environment configuration.
 * Safe to expose in health checks (no secrets).
 */
export function getEnvSummary(): EnvSummary {
  return {
    environment: process.env.NODE_ENV || 'development',
    hasDatabase: !!process.env.DATABASE_URL,
    hasHousecallAPI: !!(process.env.HOUSECALL_PRO_API_KEY || process.env.HCP_COMPANY_API_KEY),
    hasGoogleMaps: !!process.env.GOOGLE_MAPS_API_KEY,
    hasTwilio: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    hasSessionSecret: !!process.env.SESSION_SECRET,
    hasSentry: !!process.env.SENTRY_DSN,
    hasGoogleAds: !!process.env.GOOGLE_ADS_CLIENT_ID,
    port: parseInt(process.env.PORT || '5000', 10),
    version: process.env.APP_VERSION || '1.0.0',
  };
}

// ============================================================================
// LEGACY COMPATIBILITY - EnvValidator class
// ============================================================================

/**
 * EnvValidator class for backwards compatibility with existing code.
 * New code should use validateEnvironment() and getEnvSummary() directly.
 */
export class EnvValidator {
  /**
   * Validates all environment variables and returns a result
   */
  public static validate(): ValidationResult {
    return validateEnvironment();
  }

  /**
   * Validates environment on startup and logs results
   */
  public static validateOnStartup(): void {
    const result = validateEnvironment();

    // Log warnings
    result.warnings.forEach(warning => {
      Logger.warn(`[ENV] ${warning}`);
    });

    // Log and potentially exit on errors
    if (!result.valid) {
      Logger.error('[ENV] Environment validation failed:');
      result.errors.forEach(error => {
        Logger.error(`[ENV]   ${error}`);
      });

      // In production, exit if critical variables are missing
      if (process.env.NODE_ENV === 'production') {
        Logger.error('[ENV] Exiting due to missing required environment variables');
        process.exit(1);
      } else {
        Logger.warn('[ENV] Continuing in development mode despite missing variables');
      }
    } else {
      Logger.info('[ENV] Environment validation successful');

      // Log configuration summary (without exposing secrets)
      const summary = getEnvSummary();
      Logger.info('[ENV] Configuration summary:', summary);
    }
  }

  /**
   * Generates a template .env file with current values (secrets masked)
   */
  public static generateEnvTemplate(): string {
    const lines: string[] = ['# Generated Environment Configuration'];
    lines.push(`# Generated at: ${new Date().toISOString()}`);
    lines.push(`# Environment: ${process.env.NODE_ENV || 'development'}`);
    lines.push('# =======================================\n');

    const categories: Record<string, { name: string; description: string; example?: string }[]> = {
      'CRITICAL - Required for Startup': [
        { name: 'DATABASE_URL', description: 'PostgreSQL connection string', example: 'postgresql://user:pass@host:5432/db' },
        { name: 'SESSION_SECRET', description: 'Session encryption key (min 32 chars)', example: 'generate-with-openssl-rand-hex-32' },
        { name: 'NODE_ENV', description: 'Environment mode', example: 'production' },
      ],
      'REQUIRED - Core Features': [
        { name: 'HOUSECALL_PRO_API_KEY', description: 'HousecallPro API key' },
        { name: 'GOOGLE_MAPS_API_KEY', description: 'Google Maps API key', example: 'AIza...' },
        { name: 'TWILIO_ACCOUNT_SID', description: 'Twilio account SID', example: 'AC...' },
        { name: 'TWILIO_AUTH_TOKEN', description: 'Twilio auth token' },
        { name: 'OPENAI_API_KEY', description: 'OpenAI API key', example: 'sk-...' },
      ],
      'OPTIONAL - Enhanced Features': [
        { name: 'SENTRY_DSN', description: 'Sentry error tracking DSN' },
        { name: 'SITE_URL', description: 'Site URL for canonical links', example: 'https://yourdomain.com' },
        { name: 'GOOGLE_ADS_CLIENT_ID', description: 'Google Ads client ID' },
        { name: 'PORT', description: 'Server port', example: '5000' },
        { name: 'LOG_LEVEL', description: 'Logging level', example: 'info' },
      ],
    };

    for (const [category, vars] of Object.entries(categories)) {
      lines.push(`# ${category}`);
      lines.push('# ' + '='.repeat(category.length));

      for (const varDef of vars) {
        const value = process.env[varDef.name];
        lines.push(`# ${varDef.description}`);

        if (value) {
          const maskedValue = this.maskSensitiveValue(varDef.name, value);
          lines.push(`${varDef.name}=${maskedValue}`);
        } else {
          lines.push(`# ${varDef.name}=${varDef.example || 'your_value_here'}`);
        }
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * Masks sensitive values for display
   */
  private static maskSensitiveValue(name: string, value: string): string {
    const sensitivePatterns = ['SECRET', 'PASSWORD', 'TOKEN', 'KEY', 'AUTH', 'DSN'];

    if (sensitivePatterns.some(pattern => name.toUpperCase().includes(pattern))) {
      if (value.length <= 8) {
        return '***';
      }
      return value.substring(0, 4) + '***' + value.substring(value.length - 4);
    }

    return value;
  }
}
