import { shutdownDatabase } from '../db';
import { shutdownCache } from './cache';
import { stopRateLimiterCleanup } from '../lib/mcpRateLimiter';
import { stopScheduledSmsProcessor } from '../lib/smsBookingAgent';
import { stopChatKitCleanup } from './chatkitRoutes';
import { stopTwilioCleanup } from '../lib/twilioWebhooks';

let isShuttingDown = false;

export async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    console.log('[Shutdown] Already shutting down...');
    return;
  }
  
  isShuttingDown = true;
  console.log(`[Shutdown] Received ${signal}, starting graceful shutdown...`);
  
  try {
    console.log('[Shutdown] Stopping scheduled processors...');
    stopScheduledSmsProcessor();
    
    console.log('[Shutdown] Stopping rate limiter cleanup...');
    stopRateLimiterCleanup();
    
    console.log('[Shutdown] Stopping ChatKit cleanup...');
    stopChatKitCleanup();
    
    console.log('[Shutdown] Stopping Twilio cleanup...');
    stopTwilioCleanup();
    
    console.log('[Shutdown] Stopping ads sync interval...');
    const adsSyncInterval = (global as any).__adsSyncInterval;
    if (adsSyncInterval) {
      clearInterval(adsSyncInterval);
      (global as any).__adsSyncInterval = null;
    }
    
    console.log('[Shutdown] Clearing cache...');
    shutdownCache();
    
    console.log('[Shutdown] Closing database connections...');
    await shutdownDatabase();
    
    console.log('[Shutdown] Graceful shutdown completed');
  } catch (error) {
    console.error('[Shutdown] Error during graceful shutdown:', error);
  }
}

export function setupShutdownHandlers(): void {
  process.on('SIGTERM', () => {
    gracefulShutdown('SIGTERM').then(() => process.exit(0));
  });
  
  process.on('SIGINT', () => {
    gracefulShutdown('SIGINT').then(() => process.exit(0));
  });
  
  console.log('[Shutdown] Graceful shutdown handlers registered');
}
