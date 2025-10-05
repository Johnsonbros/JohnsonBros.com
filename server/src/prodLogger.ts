/**
 * Production-safe logger that respects environment variables
 * Only logs in development mode unless explicitly enabled
 */

const isDevelopment = process.env.NODE_ENV !== 'production';
const debugEnabled = process.env.DEBUG_LOGS === 'true';
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'error');

const logLevels = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  none: 99
};

const currentLevel = logLevels[logLevel as keyof typeof logLevels] || logLevels.error;

export const logger = {
  debug: (...args: any[]) => {
    if (currentLevel <= logLevels.debug) {
      console.log('[DEBUG]', new Date().toISOString(), ...args);
    }
  },
  
  info: (...args: any[]) => {
    if (currentLevel <= logLevels.info) {
      console.log('[INFO]', new Date().toISOString(), ...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (currentLevel <= logLevels.warn) {
      console.warn('[WARN]', new Date().toISOString(), ...args);
    }
  },
  
  error: (...args: any[]) => {
    if (currentLevel <= logLevels.error) {
      console.error('[ERROR]', new Date().toISOString(), ...args);
    }
  },
  
  // Special logger for critical system messages that should always show
  system: (...args: any[]) => {
    console.log('[SYSTEM]', new Date().toISOString(), ...args);
  }
};

// Export a noop logger for production to completely disable logs
export const noopLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  system: () => {}
};