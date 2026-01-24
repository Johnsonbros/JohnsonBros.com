import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { seoMetrics, indexCoverage, seoAlerts, InsertSeoMetrics, InsertIndexCoverage } from '@shared/schema';
import { eq, desc, and, gte, lte, sql, asc } from 'drizzle-orm';
import { getSearchConsoleClient } from './seo/searchConsoleClient';
import { getAnalyticsClient } from './seo/analyticsClient';
import { Logger, getErrorMessage } from './logger';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiter for SEO endpoints
const seoRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later' },
});

router.use(seoRateLimiter);

// Validation schemas
const dateRangeSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

const statusFilterSchema = z.object({
  status: z.enum(['indexed', 'crawled', 'excluded', 'error']).optional(),
});

const searchAnalyticsSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  type: z.enum(['queries', 'pages']).default('queries'),
});

const requestIndexingSchema = z.object({
  urls: z.array(z.string().url()).min(1).max(50),
});

// Helper functions
function getDefaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

// ============================================
// GET /metrics/summary - Current SEO health summary
// ============================================
router.get('/metrics/summary', async (req, res) => {
  try {
    const gscClient = getSearchConsoleClient();
    const gaClient = getAnalyticsClient();

    const defaults = getDefaultDateRange();

    // Fetch live data from GSC and GA4
    const [indexedPages, crawlErrors, analytics, organicTraffic] = await Promise.all([
      gscClient.getIndexedPages(),
      gscClient.getCrawlErrors(),
      gscClient.getSearchAnalytics(undefined, defaults.startDate, defaults.endDate),
      gaClient.getOrganicTraffic(defaults.startDate, defaults.endDate),
    ]);

    // Get the latest stored metrics for comparison
    const [latestMetric] = await db
      .select()
      .from(seoMetrics)
      .orderBy(desc(seoMetrics.date))
      .limit(1);

    // Get active alerts count
    const [alertCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(seoAlerts)
      .where(eq(seoAlerts.dismissed, false));

    res.json({
      success: true,
      data: {
        indexedPages,
        crawlErrors: crawlErrors.length,
        totalClicks: analytics.clicks,
        totalImpressions: analytics.impressions,
        averageCtr: analytics.ctr,
        averagePosition: analytics.position,
        organicSessions: organicTraffic.sessions,
        organicUsers: organicTraffic.users,
        activeAlerts: alertCount?.count || 0,
        lastUpdated: latestMetric?.createdAt || null,
        previousIndexedPages: latestMetric?.indexedPages || null,
        previousPosition: latestMetric?.averagePosition || null,
      },
    });
  } catch (error) {
    Logger.error('Failed to fetch SEO metrics summary', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch SEO metrics summary',
    });
  }
});

// ============================================
// GET /metrics/history - Historical metrics for charts
// ============================================
router.get('/metrics/history', async (req, res) => {
  try {
    const { startDate, endDate } = dateRangeSchema.parse(req.query);

    const defaults = getDefaultDateRange();
    const start = startDate || defaults.startDate;
    const end = endDate || defaults.endDate;

    const metrics = await db
      .select()
      .from(seoMetrics)
      .where(
        and(
          gte(seoMetrics.date, new Date(start)),
          lte(seoMetrics.date, new Date(end))
        )
      )
      .orderBy(asc(seoMetrics.date));

    res.json({
      success: true,
      data: {
        startDate: start,
        endDate: end,
        metrics: metrics.map(m => ({
          date: m.date?.toISOString().split('T')[0],
          indexedPages: m.indexedPages,
          totalClicks: m.totalClicks,
          totalImpressions: m.totalImpressions,
          averageCtr: m.averageCtr,
          averagePosition: m.averagePosition,
          crawlErrors: m.crawlErrors,
        })),
      },
    });
  } catch (error) {
    Logger.error('Failed to fetch SEO metrics history', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch SEO metrics history',
    });
  }
});

// ============================================
// GET /index-coverage - URL index status
// ============================================
router.get('/index-coverage', async (req, res) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const { status } = statusFilterSchema.parse(req.query);

    const offset = (page - 1) * limit;

    const conditions = status ? eq(indexCoverage.status, status) : undefined;

    const [totalResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(indexCoverage)
      .where(conditions);

    const urls = await db
      .select()
      .from(indexCoverage)
      .where(conditions)
      .orderBy(desc(indexCoverage.checkedAt))
      .limit(limit)
      .offset(offset);

    const total = totalResult?.count || 0;

    res.json({
      success: true,
      data: {
        urls: urls.map(u => ({
          id: u.id,
          url: u.url,
          status: u.status,
          lastCrawled: u.lastCrawled?.toISOString(),
          errorType: u.errorType,
          checkedAt: u.checkedAt?.toISOString(),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    Logger.error('Failed to fetch index coverage', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch index coverage',
    });
  }
});

// ============================================
// GET /crawl-errors - List of crawl errors
// ============================================
router.get('/crawl-errors', async (req, res) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const offset = (page - 1) * limit;

    // Get errors from database
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(indexCoverage)
      .where(eq(indexCoverage.status, 'error'));

    const errors = await db
      .select()
      .from(indexCoverage)
      .where(eq(indexCoverage.status, 'error'))
      .orderBy(desc(indexCoverage.checkedAt))
      .limit(limit)
      .offset(offset);

    // Also fetch live errors from GSC
    const gscClient = getSearchConsoleClient();
    const liveErrors = await gscClient.getCrawlErrors();

    const total = totalResult?.count || 0;

    res.json({
      success: true,
      data: {
        errors: errors.map(e => ({
          id: e.id,
          url: e.url,
          errorType: e.errorType,
          lastCrawled: e.lastCrawled?.toISOString(),
          checkedAt: e.checkedAt?.toISOString(),
        })),
        liveErrors: liveErrors.slice(0, 10),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    Logger.error('Failed to fetch crawl errors', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch crawl errors',
    });
  }
});

// ============================================
// GET /search-analytics - Top queries or pages
// ============================================
router.get('/search-analytics', async (req, res) => {
  try {
    const { startDate, endDate, type } = searchAnalyticsSchema.parse(req.query);

    const gscClient = getSearchConsoleClient();
    const defaults = getDefaultDateRange();
    const start = startDate || defaults.startDate;
    const end = endDate || defaults.endDate;

    let data;
    if (type === 'queries') {
      data = await gscClient.getTopQueries(undefined, 20);
    } else {
      data = await gscClient.getTopPages(undefined, 20);
    }

    res.json({
      success: true,
      data: {
        type,
        startDate: start,
        endDate: end,
        items: data,
      },
    });
  } catch (error) {
    Logger.error('Failed to fetch search analytics', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch search analytics',
    });
  }
});

// ============================================
// GET /alerts - Active SEO alerts
// ============================================
router.get('/alerts', async (req, res) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const offset = (page - 1) * limit;

    const [totalResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(seoAlerts)
      .where(eq(seoAlerts.dismissed, false));

    const alerts = await db
      .select()
      .from(seoAlerts)
      .where(eq(seoAlerts.dismissed, false))
      .orderBy(desc(seoAlerts.createdAt))
      .limit(limit)
      .offset(offset);

    const total = totalResult?.count || 0;

    res.json({
      success: true,
      data: {
        alerts: alerts.map(a => ({
          id: a.id,
          type: a.type,
          severity: a.severity,
          title: a.title,
          description: a.description,
          url: a.url,
          createdAt: a.createdAt?.toISOString(),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    Logger.error('Failed to fetch SEO alerts', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch SEO alerts',
    });
  }
});

// ============================================
// POST /alerts/:id/dismiss - Dismiss an alert
// ============================================
router.post('/alerts/:id/dismiss', async (req, res) => {
  try {
    const { id } = req.params;

    await db
      .update(seoAlerts)
      .set({
        dismissed: true,
        dismissedAt: new Date(),
      })
      .where(eq(seoAlerts.id, id));

    Logger.info('SEO alert dismissed', { alertId: id });

    res.json({
      success: true,
      message: 'Alert dismissed',
    });
  } catch (error) {
    Logger.error('Failed to dismiss alert', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to dismiss alert',
    });
  }
});

// ============================================
// POST /request-indexing - Request URL indexing
// ============================================
router.post('/request-indexing', async (req, res) => {
  try {
    const { urls } = requestIndexingSchema.parse(req.body);

    const gscClient = getSearchConsoleClient();
    const results: Array<{ url: string; success: boolean; message?: string }> = [];

    for (const url of urls) {
      const success = await gscClient.requestIndexing(url);
      results.push({
        url,
        success,
        message: success ? 'Indexing requested' : 'Failed to request indexing',
      });
    }

    const successCount = results.filter(r => r.success).length;
    Logger.info('Indexing requests processed', {
      total: urls.length,
      successful: successCount,
    });

    res.json({
      success: true,
      data: {
        results,
        summary: {
          total: urls.length,
          successful: successCount,
          failed: urls.length - successCount,
        },
      },
    });
  } catch (error) {
    Logger.error('Failed to request indexing', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to request indexing',
    });
  }
});

// ============================================
// POST /sync - Manual sync from GSC/GA4
// ============================================
router.post('/sync', async (req, res) => {
  try {
    const gscClient = getSearchConsoleClient();
    const gaClient = getAnalyticsClient();

    const defaults = getDefaultDateRange();

    // Clear caches to force fresh data
    gscClient.clearCache();
    gaClient.clearCache();

    // Fetch fresh data
    const [indexedPages, crawlErrors, analytics] = await Promise.all([
      gscClient.getIndexedPages(),
      gscClient.getCrawlErrors(),
      gscClient.getSearchAnalytics(undefined, defaults.startDate, defaults.endDate),
    ]);

    // Store metrics snapshot
    const metricsData: InsertSeoMetrics = {
      date: new Date(),
      indexedPages,
      totalClicks: analytics.clicks,
      totalImpressions: analytics.impressions,
      averageCtr: analytics.ctr,
      averagePosition: analytics.position,
      crawlErrors: crawlErrors.length,
      metadata: { syncedAt: new Date().toISOString() },
    };

    await db.insert(seoMetrics).values(metricsData);

    // Update index coverage for errors
    for (const error of crawlErrors) {
      const coverageData: InsertIndexCoverage = {
        url: error.url,
        status: 'error',
        lastCrawled: error.lastCrawled ? new Date(error.lastCrawled) : null,
        errorType: error.category,
      };

      // Upsert: update if exists, insert if not
      await db
        .insert(indexCoverage)
        .values(coverageData)
        .onConflictDoUpdate({
          target: indexCoverage.url,
          set: {
            status: 'error',
            errorType: error.category,
            lastCrawled: error.lastCrawled ? new Date(error.lastCrawled) : null,
            checkedAt: new Date(),
          },
        });
    }

    // Check for alerts
    const [previousMetric] = await db
      .select()
      .from(seoMetrics)
      .orderBy(desc(seoMetrics.date))
      .limit(1)
      .offset(1);

    if (previousMetric) {
      // Check for indexed pages drop
      if (previousMetric.indexedPages && indexedPages < previousMetric.indexedPages * 0.95) {
        const dropPercent = Math.round((1 - indexedPages / previousMetric.indexedPages) * 100);
        await db.insert(seoAlerts).values({
          type: 'deindexed',
          severity: dropPercent > 10 ? 'critical' : 'warning',
          title: `Indexed pages dropped by ${dropPercent}%`,
          description: `Indexed pages decreased from ${previousMetric.indexedPages} to ${indexedPages}`,
          metadata: { previousCount: previousMetric.indexedPages, currentCount: indexedPages },
        });
      }

      // Check for position drop
      if (
        previousMetric.averagePosition &&
        analytics.position > previousMetric.averagePosition + 5
      ) {
        await db.insert(seoAlerts).values({
          type: 'ranking_drop',
          severity: 'warning',
          title: 'Average position dropped significantly',
          description: `Average position changed from ${previousMetric.averagePosition?.toFixed(1)} to ${analytics.position.toFixed(1)}`,
          metadata: {
            previousPosition: previousMetric.averagePosition,
            currentPosition: analytics.position,
          },
        });
      }
    }

    // Alert for new crawl errors
    if (crawlErrors.length > 0) {
      await db.insert(seoAlerts).values({
        type: 'crawl_error',
        severity: crawlErrors.length > 5 ? 'error' : 'warning',
        title: `${crawlErrors.length} crawl error(s) detected`,
        description: `URLs with errors: ${crawlErrors.slice(0, 3).map(e => e.url).join(', ')}${crawlErrors.length > 3 ? '...' : ''}`,
        metadata: { errorCount: crawlErrors.length, urls: crawlErrors.map(e => e.url) },
      });
    }

    Logger.info('SEO data sync completed', {
      indexedPages,
      crawlErrors: crawlErrors.length,
      clicks: analytics.clicks,
    });

    res.json({
      success: true,
      message: 'Sync completed successfully',
      data: {
        indexedPages,
        crawlErrors: crawlErrors.length,
        totalClicks: analytics.clicks,
        averagePosition: analytics.position,
        syncedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    Logger.error('Failed to sync SEO data', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to sync SEO data',
    });
  }
});

// ============================================
// GET /traffic - Traffic overview from GA4
// ============================================
router.get('/traffic', async (req, res) => {
  try {
    const { startDate, endDate } = dateRangeSchema.parse(req.query);

    const gaClient = getAnalyticsClient();
    const defaults = getDefaultDateRange();
    const start = startDate || defaults.startDate;
    const end = endDate || defaults.endDate;

    const [trafficBySource, realTimeUsers, landingPages] = await Promise.all([
      gaClient.getTrafficBySource(start, end),
      gaClient.getRealTimeUsers(),
      gaClient.getTopLandingPages(start, end, 10),
    ]);

    res.json({
      success: true,
      data: {
        startDate: start,
        endDate: end,
        realTimeUsers,
        trafficBySource,
        topLandingPages: landingPages,
      },
    });
  } catch (error) {
    Logger.error('Failed to fetch traffic data', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch traffic data',
    });
  }
});

export default router;
