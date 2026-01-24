import * as cron from 'node-cron';
import type { ScheduledTask } from 'node-cron';
import { db } from '../../db';
import { seoMetrics, indexCoverage, seoAlerts, InsertSeoMetrics, InsertIndexCoverage, InsertSeoAlert } from '@shared/schema';
import { getSearchConsoleClient } from './searchConsoleClient';
import { getAnalyticsClient } from './analyticsClient';
import { Logger, getErrorMessage } from '../logger';
import { desc, eq } from 'drizzle-orm';

// Track if scheduler is running
let isSchedulerRunning = false;
let scheduledTask: ScheduledTask | null = null;

/**
 * Sync SEO data from Google Search Console and Analytics
 */
export async function syncSeoData(): Promise<void> {
  Logger.info('[SEO Sync] Starting scheduled SEO data sync');

  try {
    const gscClient = getSearchConsoleClient();
    const gaClient = getAnalyticsClient();

    // Get date range for analytics
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Clear caches to get fresh data
    gscClient.clearCache();
    gaClient.clearCache();

    // Fetch data from both sources
    const [indexedPages, crawlErrors, analytics, organicTraffic] = await Promise.all([
      gscClient.getIndexedPages(),
      gscClient.getCrawlErrors(),
      gscClient.getSearchAnalytics(undefined, startDateStr, endDateStr),
      gaClient.getOrganicTraffic(startDateStr, endDateStr),
    ]);

    // Get previous metrics for comparison
    const [previousMetric] = await db
      .select()
      .from(seoMetrics)
      .orderBy(desc(seoMetrics.date))
      .limit(1);

    // Store new metrics snapshot
    const metricsData: InsertSeoMetrics = {
      date: new Date(),
      indexedPages,
      totalClicks: analytics.clicks,
      totalImpressions: analytics.impressions,
      averageCtr: analytics.ctr,
      averagePosition: analytics.position,
      crawlErrors: crawlErrors.length,
      metadata: {
        syncedAt: new Date().toISOString(),
        organicSessions: organicTraffic.sessions,
        organicUsers: organicTraffic.users,
      },
    };

    await db.insert(seoMetrics).values(metricsData);
    Logger.info('[SEO Sync] Metrics snapshot saved', {
      indexedPages,
      clicks: analytics.clicks,
      position: analytics.position,
    });

    // Update index coverage for crawl errors
    for (const error of crawlErrors) {
      const coverageData: InsertIndexCoverage = {
        url: error.url,
        status: 'error',
        lastCrawled: error.lastCrawled ? new Date(error.lastCrawled) : null,
        errorType: error.category,
      };

      // Upsert: update if URL exists, insert if not
      const existing = await db
        .select()
        .from(indexCoverage)
        .where(eq(indexCoverage.url, error.url))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(indexCoverage)
          .set({
            status: 'error',
            errorType: error.category,
            lastCrawled: error.lastCrawled ? new Date(error.lastCrawled) : null,
            checkedAt: new Date(),
          })
          .where(eq(indexCoverage.url, error.url));
      } else {
        await db.insert(indexCoverage).values(coverageData);
      }
    }

    // Generate alerts based on changes
    await generateAlerts(previousMetric, {
      indexedPages,
      crawlErrors: crawlErrors.length,
      analytics,
    });

    Logger.info('[SEO Sync] Sync completed successfully', {
      indexedPages,
      crawlErrors: crawlErrors.length,
      totalClicks: analytics.clicks,
    });
  } catch (error) {
    Logger.error('[SEO Sync] Sync failed', { error: getErrorMessage(error) });
    throw error;
  }
}

/**
 * Generate alerts based on metric changes
 */
async function generateAlerts(
  previous: typeof seoMetrics.$inferSelect | undefined,
  current: {
    indexedPages: number;
    crawlErrors: number;
    analytics: { clicks: number; impressions: number; ctr: number; position: number };
  }
): Promise<void> {
  const alerts: InsertSeoAlert[] = [];

  if (previous) {
    // Check for indexed pages drop (> 5%)
    if (previous.indexedPages) {
      const dropPercent = ((previous.indexedPages - current.indexedPages) / previous.indexedPages) * 100;
      if (dropPercent > 5) {
        alerts.push({
          type: 'deindexed',
          severity: dropPercent > 10 ? 'critical' : 'warning',
          title: `Indexed pages dropped by ${dropPercent.toFixed(1)}%`,
          description: `Indexed pages decreased from ${previous.indexedPages} to ${current.indexedPages}. This may indicate technical SEO issues or content removal.`,
          metadata: {
            previousCount: previous.indexedPages,
            currentCount: current.indexedPages,
            dropPercent: dropPercent.toFixed(1),
          },
        });
        Logger.warn('[SEO Alert] Indexed pages drop detected', {
          previous: previous.indexedPages,
          current: current.indexedPages,
          dropPercent: dropPercent.toFixed(1),
        });
      }
    }

    // Check for ranking drops (> 10 positions for average)
    if (previous.averagePosition && current.analytics.position > 0) {
      const positionChange = current.analytics.position - previous.averagePosition;
      if (positionChange > 10) {
        alerts.push({
          type: 'ranking_drop',
          severity: positionChange > 20 ? 'critical' : 'warning',
          title: `Average position dropped by ${positionChange.toFixed(1)} positions`,
          description: `Average search position changed from ${previous.averagePosition.toFixed(1)} to ${current.analytics.position.toFixed(1)}.`,
          metadata: {
            previousPosition: previous.averagePosition,
            currentPosition: current.analytics.position,
            positionChange: positionChange.toFixed(1),
          },
        });
        Logger.warn('[SEO Alert] Ranking drop detected', {
          previous: previous.averagePosition,
          current: current.analytics.position,
          change: positionChange.toFixed(1),
        });
      }
    }

    // Check for traffic drops (> 30% clicks)
    if (previous.totalClicks && previous.totalClicks > 0) {
      const clicksDropPercent = ((previous.totalClicks - current.analytics.clicks) / previous.totalClicks) * 100;
      if (clicksDropPercent > 30) {
        alerts.push({
          type: 'traffic_drop',
          severity: clicksDropPercent > 50 ? 'critical' : 'warning',
          title: `Organic clicks dropped by ${clicksDropPercent.toFixed(1)}%`,
          description: `Organic search clicks decreased from ${previous.totalClicks} to ${current.analytics.clicks}.`,
          metadata: {
            previousClicks: previous.totalClicks,
            currentClicks: current.analytics.clicks,
            dropPercent: clicksDropPercent.toFixed(1),
          },
        });
        Logger.warn('[SEO Alert] Traffic drop detected', {
          previous: previous.totalClicks,
          current: current.analytics.clicks,
          dropPercent: clicksDropPercent.toFixed(1),
        });
      }
    }
  }

  // Alert for new crawl errors
  if (current.crawlErrors > 0) {
    const previousErrors = previous?.crawlErrors || 0;
    const newErrors = current.crawlErrors - previousErrors;

    if (newErrors > 0) {
      alerts.push({
        type: 'crawl_error',
        severity: newErrors > 5 ? 'error' : 'warning',
        title: `${newErrors} new crawl error(s) detected`,
        description: `Total crawl errors increased from ${previousErrors} to ${current.crawlErrors}.`,
        metadata: {
          previousCount: previousErrors,
          currentCount: current.crawlErrors,
          newErrors,
        },
      });
      Logger.warn('[SEO Alert] New crawl errors', {
        previous: previousErrors,
        current: current.crawlErrors,
        new: newErrors,
      });
    }
  }

  // Insert alerts
  if (alerts.length > 0) {
    await db.insert(seoAlerts).values(alerts);
    Logger.info('[SEO Sync] Generated alerts', { count: alerts.length });
  }
}

/**
 * Start the SEO sync scheduler
 * Runs every 6 hours (cron: 0 0,6,12,18 * * *)
 */
export function startSeoSyncScheduler(): void {
  if (isSchedulerRunning) {
    Logger.warn('[SEO Sync] Scheduler already running');
    return;
  }

  // Schedule: Every 6 hours
  scheduledTask = cron.schedule('0 0,6,12,18 * * *', async () => {
    Logger.info('[SEO Sync] Scheduled sync starting');
    try {
      await syncSeoData();
    } catch (error) {
      Logger.error('[SEO Sync] Scheduled sync failed', { error: getErrorMessage(error) });
    }
  });

  isSchedulerRunning = true;
  Logger.info('[SEO Sync] Scheduler started - running every 6 hours');
}

/**
 * Stop the SEO sync scheduler
 */
export function stopSeoSyncScheduler(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    isSchedulerRunning = false;
    Logger.info('[SEO Sync] Scheduler stopped');
  }
}

/**
 * Check if scheduler is running
 */
export function isSeoSyncSchedulerRunning(): boolean {
  return isSchedulerRunning;
}
