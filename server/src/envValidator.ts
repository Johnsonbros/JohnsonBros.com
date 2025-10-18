import crypto from 'crypto';
import { Logger } from './logger';

interface EnvVariable {
  name: string;
  required: boolean;
  defaultValue?: string | (() => string);
  validator?: (value: string) => boolean;
  description: string;
  example?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class EnvValidator {
  private static readonly ENV_VARIABLES: EnvVariable[] = [
    // ========= REQUIRED VARIABLES =========
    {
      name: 'DATABASE_URL',
      required: true,
      description: 'PostgreSQL connection string',
      validator: (val) => val.startsWith('postgresql://') || val.startsWith('postgres://'),
      example: 'postgresql://user:pass@host:5432/dbname'
    },
    {
      name: 'HOUSECALL_PRO_API_KEY',
      required: false, // Not required if HCP_COMPANY_API_KEY is set
      description: 'HousecallPro API key for integration',
      validator: (val) => val.startsWith('Bearer ') || val.startsWith('Token '),
      example: 'Bearer your_api_key_here'
    },
    {
      name: 'HCP_COMPANY_API_KEY',
      required: false, // Alternative to HOUSECALL_PRO_API_KEY
      description: 'Alternative HousecallPro company API key',
      validator: (val) => val.startsWith('Bearer ') || val.startsWith('Token '),
      example: 'Token your_company_api_key'
    },
    {
      name: 'SESSION_SECRET',
      required: false, // Will generate in dev, required in prod
      description: 'Secret key for session encryption',
      defaultValue: () => {
        if (process.env.NODE_ENV !== 'production') {
          const secret = crypto.randomBytes(32).toString('hex');
          Logger.warn(`Generated development SESSION_SECRET. Set this in production!`);
          return secret;
        }
        return '';
      },
      validator: (val) => val.length >= 32,
      example: 'minimum-32-character-secure-random-string'
    },

    // ========= GOOGLE SERVICES =========
    {
      name: 'GOOGLE_MAPS_API_KEY',
      required: false,
      description: 'Google Maps API key for server-side geocoding',
      example: 'AIzaSy...'
    },
    {
      name: 'VITE_GOOGLE_MAPS_API_KEY',
      required: false,
      description: 'Google Maps API key for client-side map display',
      defaultValue: () => process.env.GOOGLE_MAPS_API_KEY || '',
      example: 'AIzaSy...'
    },
    {
      name: 'GOOGLE_PLACES_API_KEY',
      required: false,
      description: 'Google Places API key for location autocomplete',
      defaultValue: () => process.env.GOOGLE_MAPS_API_KEY || '',
      example: 'AIzaSy...'
    },

    // ========= TWILIO CONFIGURATION =========
    {
      name: 'TWILIO_ACCOUNT_SID',
      required: false,
      description: 'Twilio account SID for SMS notifications',
      validator: (val) => val.startsWith('AC'),
      example: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
    },
    {
      name: 'TWILIO_AUTH_TOKEN',
      required: false,
      description: 'Twilio authentication token',
      example: 'your_auth_token'
    },
    {
      name: 'TWILIO_PHONE_NUMBER',
      required: false,
      description: 'Twilio phone number for sending SMS',
      validator: (val) => /^\+\d{10,15}$/.test(val),
      example: '+12025551234'
    },

    // ========= ADMIN CONFIGURATION =========
    {
      name: 'SUPER_ADMIN_EMAIL',
      required: false,
      description: 'Initial super admin email',
      validator: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      defaultValue: () => process.env.ADMIN_EMAIL || 'admin@example.com',
      example: 'admin@yourdomain.com'
    },
    {
      name: 'SUPER_ADMIN_PASSWORD',
      required: false,
      description: 'Initial super admin password',
      defaultValue: () => process.env.ADMIN_DEFAULT_PASSWORD || 'changeme123',
      validator: (val) => val.length >= 8,
      example: 'secure_password_123!'
    },
    {
      name: 'SUPER_ADMIN_NAME',
      required: false,
      description: 'Super admin display name',
      defaultValue: 'Admin User',
      example: 'John Doe'
    },

    // ========= SECURITY & CORS =========
    {
      name: 'CORS_ORIGIN',
      required: false,
      description: 'Comma-separated list of allowed CORS origins',
      defaultValue: () => process.env.NODE_ENV === 'production' ? '' : '*',
      example: 'https://yourdomain.com,https://www.yourdomain.com'
    },
    {
      name: 'SECURE_COOKIES',
      required: false,
      description: 'Use secure cookies (HTTPS only)',
      defaultValue: () => process.env.NODE_ENV === 'production' ? 'true' : 'false',
      validator: (val) => ['true', 'false'].includes(val.toLowerCase()),
      example: 'true'
    },
    {
      name: 'SESSION_DURATION',
      required: false,
      description: 'Session duration in milliseconds',
      defaultValue: '86400000', // 24 hours
      validator: (val) => !isNaN(parseInt(val)),
      example: '86400000'
    },
    {
      name: 'INTERNAL_SECRET',
      required: false,
      description: 'Secret for internal server-to-server API calls',
      validator: (val) => val.length >= 32,
      example: 'minimum-32-character-secure-random-string'
    },

    // ========= WEBHOOK CONFIGURATION =========
    {
      name: 'HOUSECALL_WEBHOOK_SECRET',
      required: false,
      description: 'Secret for verifying HousecallPro webhook signatures',
      validator: (val) => val.length >= 16,
      defaultValue: () => {
        if (process.env.NODE_ENV !== 'production') {
          return crypto.randomBytes(16).toString('hex');
        }
        return '';
      },
      example: 'your_webhook_secret'
    },
    {
      name: 'WEBHOOK_URL',
      required: false,
      description: 'Custom webhook URL if different from auto-detected',
      validator: (val) => val.startsWith('https://') || val.startsWith('http://'),
      example: 'https://yourdomain.com/api/webhooks/housecall'
    },

    // ========= SITE CONFIGURATION =========
    {
      name: 'SITE_URL',
      required: false,
      description: 'Base URL of the site for sitemap generation',
      defaultValue: 'https://johnsonbrosplumbing.com',
      validator: (val) => val.startsWith('https://') || val.startsWith('http://'),
      example: 'https://yourdomain.com'
    },
    {
      name: 'COMPANY_TZ',
      required: false,
      description: 'Company timezone',
      defaultValue: 'America/New_York',
      example: 'America/Los_Angeles'
    },
    {
      name: 'HOUSECALL_COMPANY_ID',
      required: false,
      description: 'HousecallPro company identifier',
      example: 'com_abc123'
    },
    {
      name: 'DEFAULT_DISPATCH_EMPLOYEE_IDS',
      required: false,
      description: 'Comma-separated list of default employee IDs for dispatch',
      example: 'emp_123,emp_456'
    },

    // ========= LOGGING & MONITORING =========
    {
      name: 'LOG_LEVEL',
      required: false,
      description: 'Application log level',
      defaultValue: () => process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      validator: (val) => ['debug', 'info', 'warn', 'error'].includes(val.toLowerCase()),
      example: 'info'
    },
    {
      name: 'DEBUG_LOGS',
      required: false,
      description: 'Enable debug logging in production',
      defaultValue: 'false',
      validator: (val) => ['true', 'false'].includes(val.toLowerCase()),
      example: 'false'
    },
    {
      name: 'APP_VERSION',
      required: false,
      description: 'Application version for monitoring',
      defaultValue: '1.0.0',
      example: '1.2.3'
    },

    // ========= MCP CONFIGURATION =========
    {
      name: 'MCP_PORT',
      required: false,
      description: 'Port for Model Context Protocol server',
      defaultValue: '3001',
      validator: (val) => !isNaN(parseInt(val)) && parseInt(val) > 0 && parseInt(val) < 65536,
      example: '3001'
    },

    // ========= API CONFIGURATION =========
    {
      name: 'HCP_API_BASE',
      required: false,
      description: 'HousecallPro API base URL',
      defaultValue: 'https://api.housecallpro.com',
      validator: (val) => val.startsWith('https://') || val.startsWith('http://'),
      example: 'https://api.housecallpro.com'
    },

    // ========= GOOGLE ADS (OPTIONAL) =========
    {
      name: 'GOOGLE_ADS_CLIENT_ID',
      required: false,
      description: 'Google Ads OAuth client ID',
      example: '123456789.apps.googleusercontent.com'
    },
    {
      name: 'GOOGLE_ADS_CLIENT_SECRET',
      required: false,
      description: 'Google Ads OAuth client secret',
      example: 'your_client_secret'
    },
    {
      name: 'GOOGLE_ADS_DEVELOPER_TOKEN',
      required: false,
      description: 'Google Ads API developer token',
      example: 'your_developer_token'
    },

    // ========= PLATFORM SPECIFIC =========
    {
      name: 'NODE_ENV',
      required: false,
      description: 'Node environment',
      defaultValue: 'development',
      validator: (val) => ['development', 'production', 'test'].includes(val),
      example: 'production'
    },
    {
      name: 'PORT',
      required: false,
      description: 'Server port (usually auto-set by platform)',
      defaultValue: '5000',
      validator: (val) => !isNaN(parseInt(val)) && parseInt(val) > 0 && parseInt(val) < 65536,
      example: '5000'
    },
  ];

  /**
   * Validates all environment variables and returns a result
   */
  public static validate(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const isProduction = process.env.NODE_ENV === 'production';

    // Check for HousecallPro API key (one of two must be present)
    const hasHCPKey = !!(process.env.HOUSECALL_PRO_API_KEY || process.env.HCP_COMPANY_API_KEY);
    if (!hasHCPKey) {
      errors.push('Missing HousecallPro API key: Set either HOUSECALL_PRO_API_KEY or HCP_COMPANY_API_KEY');
    }

    // Validate each environment variable
    for (const envVar of this.ENV_VARIABLES) {
      const value = process.env[envVar.name];

      // Check if required variable is missing
      if (envVar.required && !value) {
        errors.push(`Missing required environment variable: ${envVar.name} - ${envVar.description}`);
        if (envVar.example) {
          errors.push(`  Example: ${envVar.name}=${envVar.example}`);
        }
        continue;
      }

      // Apply default value if not set
      if (!value && envVar.defaultValue) {
        const defaultVal = typeof envVar.defaultValue === 'function' 
          ? envVar.defaultValue() 
          : envVar.defaultValue;
        
        if (defaultVal) {
          process.env[envVar.name] = defaultVal;
          
          // Warn about defaults in production for sensitive vars
          if (isProduction && ['SESSION_SECRET', 'SUPER_ADMIN_PASSWORD', 'HOUSECALL_WEBHOOK_SECRET'].includes(envVar.name)) {
            warnings.push(`Using default value for ${envVar.name} in production - this should be explicitly set!`);
          }
        }
      }

      // Validate the value if validator exists and value is present
      if (value && envVar.validator) {
        if (!envVar.validator(value)) {
          errors.push(`Invalid value for ${envVar.name}: "${value}" - ${envVar.description}`);
          if (envVar.example) {
            errors.push(`  Example: ${envVar.name}=${envVar.example}`);
          }
        }
      }

      // Production-specific validations
      if (isProduction) {
        // Warn about missing recommended production variables
        if (!value && ['HOUSECALL_WEBHOOK_SECRET', 'CORS_ORIGIN', 'SITE_URL'].includes(envVar.name)) {
          warnings.push(`Missing recommended production variable: ${envVar.name} - ${envVar.description}`);
        }

        // Error for required production variables
        if (!value && envVar.name === 'SESSION_SECRET') {
          errors.push(`${envVar.name} is required in production for security!`);
        }

        // Warn about insecure defaults
        if (value === 'changeme123' && envVar.name === 'SUPER_ADMIN_PASSWORD') {
          warnings.push('Using default admin password in production - change this immediately!');
        }
      }
    }

    // Check for deprecated environment variables
    const deprecatedVars = {
      'GOOGLE_ADS_DEV_TOKEN': 'Use GOOGLE_ADS_DEVELOPER_TOKEN instead',
      'GOOGLE_ADS_MANAGER_ID': 'Use GOOGLE_ADS_CUSTOMER_ID instead',
      'GOOGLE_ADS_ACCOUNT_ID': 'Use GOOGLE_ADS_CUSTOMER_ID instead'
    };

    for (const [oldVar, message] of Object.entries(deprecatedVars)) {
      if (process.env[oldVar]) {
        warnings.push(`Deprecated environment variable ${oldVar}: ${message}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates environment on startup and logs results
   */
  public static validateOnStartup(): void {
    const result = this.validate();
    
    // Log warnings
    result.warnings.forEach(warning => {
      Logger.warn(`[ENV] ${warning}`);
    });

    // Log and potentially exit on errors
    if (!result.valid) {
      Logger.error('[ENV] Environment validation failed:');
      result.errors.forEach(error => {
        Logger.error(`[ENV] ${error}`);
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
      const summary = {
        environment: process.env.NODE_ENV || 'development',
        hasDatabase: !!process.env.DATABASE_URL,
        hasHousecallAPI: !!(process.env.HOUSECALL_PRO_API_KEY || process.env.HCP_COMPANY_API_KEY),
        hasGoogleMaps: !!process.env.GOOGLE_MAPS_API_KEY,
        hasTwilio: !!process.env.TWILIO_ACCOUNT_SID,
        hasWebhookSecret: !!process.env.HOUSECALL_WEBHOOK_SECRET,
        hasSessionSecret: !!process.env.SESSION_SECRET,
        port: process.env.PORT || '5000'
      };
      
      Logger.info('[ENV] Configuration summary:', summary);
    }
  }

  /**
   * Generates a template .env file with current values (secrets masked)
   */
  public static generateEnvTemplate(): string {
    const lines: string[] = ['# Generated Environment Configuration'];
    lines.push(`# Generated at: ${new Date().toISOString()}`);
    lines.push('# =======================================\n');

    const categories = {
      'Core Configuration': ['DATABASE_URL', 'HOUSECALL_PRO_API_KEY', 'HCP_COMPANY_API_KEY', 'SESSION_SECRET'],
      'Google Services': ['GOOGLE_MAPS_API_KEY', 'VITE_GOOGLE_MAPS_API_KEY', 'GOOGLE_PLACES_API_KEY'],
      'Communication': ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'],
      'Admin': ['SUPER_ADMIN_EMAIL', 'SUPER_ADMIN_PASSWORD', 'SUPER_ADMIN_NAME'],
      'Security': ['CORS_ORIGIN', 'SECURE_COOKIES', 'SESSION_DURATION', 'INTERNAL_SECRET'],
      'Webhooks': ['HOUSECALL_WEBHOOK_SECRET', 'WEBHOOK_URL'],
      'Site': ['SITE_URL', 'COMPANY_TZ', 'HOUSECALL_COMPANY_ID'],
      'Monitoring': ['LOG_LEVEL', 'DEBUG_LOGS', 'APP_VERSION'],
      'Other': []
    };

    // Get all categorized variables
    const allCategorizedVars: string[] = [];
    for (const vars of Object.values(categories)) {
      if (Array.isArray(vars)) {
        allCategorizedVars.push(...vars);
      }
    }
    
    for (const [category, varNames] of Object.entries(categories)) {
      lines.push(`# ${category}`);
      lines.push('# ' + '='.repeat(category.length));
      
      const categoryVars = varNames.length > 0 
        ? this.ENV_VARIABLES.filter(v => varNames.includes(v.name))
        : this.ENV_VARIABLES.filter(v => !allCategorizedVars.includes(v.name));

      for (const envVar of categoryVars) {
        const value = process.env[envVar.name];
        lines.push(`# ${envVar.description}`);
        
        if (value) {
          // Mask sensitive values
          const maskedValue = this.maskSensitiveValue(envVar.name, value);
          lines.push(`${envVar.name}=${maskedValue}`);
        } else {
          lines.push(`# ${envVar.name}=${envVar.example || 'your_value_here'}`);
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
    const sensitivePatterns = ['SECRET', 'PASSWORD', 'TOKEN', 'KEY', 'AUTH'];
    
    if (sensitivePatterns.some(pattern => name.includes(pattern))) {
      if (value.length <= 8) {
        return '***';
      }
      return value.substring(0, 4) + '***' + value.substring(value.length - 4);
    }
    
    return value;
  }
}

// Export for use in other modules
export { ValidationResult };