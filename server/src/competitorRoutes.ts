/**
 * Competitor Tracking Admin Routes
 *
 * API endpoints for managing competitors, keywords, and PE activity.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  addCompetitor,
  getCompetitors,
  addKeyword,
  getKeywords,
  recordRanking,
  getLatestRankings,
  getKeywordComparison,
  getOurRankingTrends,
  logPeActivity,
  getRecentPeActivity,
  getCompetitiveDashboard,
  initializeCompetitorTracking,
} from './competitorTracking';
import {
  getUnreadAlerts,
  getCriticalAlerts,
  getAlertStats,
  markAlertRead,
  acknowledgeAlert,
  runPeMonitorCheck,
  createTestAlerts,
  processNewsItem,
  getSearchQueries,
} from './peMonitor';
import {
  insertCompetitorSchema,
  insertSeoKeywordSchema,
  insertCompetitorKeywordRankingSchema,
  insertPeActivityLogSchema,
} from '@shared/schema';

const router = Router();

// ==============================================
// DASHBOARD
// ==============================================

/**
 * GET /api/admin/competitors/dashboard
 * Get the competitive intelligence dashboard summary
 */
router.get('/dashboard', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const dashboard = await getCompetitiveDashboard();
    res.json({ success: true, data: dashboard });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/competitors/initialize
 * Seed the database with initial competitors, keywords, and PE activity
 */
router.post('/initialize', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await initializeCompetitorTracking();
    res.json({ success: true, data: result, message: 'Competitor tracking initialized' });
  } catch (error) {
    next(error);
  }
});

// ==============================================
// COMPETITORS
// ==============================================

/**
 * GET /api/admin/competitors
 * Get all competitors
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { priority, type } = req.query;
    const competitors = await getCompetitors({
      priorityOnly: priority === 'true',
      type: type as string | undefined,
    });
    res.json({ success: true, data: competitors });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/competitors
 * Add a new competitor
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = insertCompetitorSchema.parse(req.body);
    const competitor = await addCompetitor(data);
    res.status(201).json({ success: true, data: competitor });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
    }
    next(error);
  }
});

// ==============================================
// KEYWORDS
// ==============================================

/**
 * GET /api/admin/competitors/keywords
 * Get all keywords
 */
router.get('/keywords', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, primary } = req.query;
    const keywords = await getKeywords({
      category: category as string | undefined,
      primaryOnly: primary === 'true',
    });
    res.json({ success: true, data: keywords });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/competitors/keywords
 * Add a new keyword to track
 */
router.post('/keywords', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = insertSeoKeywordSchema.parse(req.body);
    const keyword = await addKeyword(data);
    res.status(201).json({ success: true, data: keyword });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
    }
    next(error);
  }
});

// ==============================================
// RANKINGS
// ==============================================

/**
 * GET /api/admin/competitors/rankings/:keywordId
 * Get latest rankings for a keyword
 */
router.get('/rankings/:keywordId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const keywordId = parseInt(req.params.keywordId, 10);
    if (isNaN(keywordId)) {
      return res.status(400).json({ success: false, error: 'Invalid keyword ID' });
    }

    const rankings = await getLatestRankings(keywordId);
    res.json({ success: true, data: rankings });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/competitors/rankings/:keywordId/comparison
 * Get competitor comparison for a keyword
 */
router.get('/rankings/:keywordId/comparison', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const keywordId = parseInt(req.params.keywordId, 10);
    if (isNaN(keywordId)) {
      return res.status(400).json({ success: false, error: 'Invalid keyword ID' });
    }

    const comparison = await getKeywordComparison(keywordId);
    res.json({ success: true, data: comparison });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/competitors/rankings
 * Record a ranking check
 */
router.post('/rankings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = insertCompetitorKeywordRankingSchema.parse(req.body);
    const ranking = await recordRanking(data);
    res.status(201).json({ success: true, data: ranking });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
    }
    next(error);
  }
});

/**
 * GET /api/admin/competitors/our-rankings
 * Get our ranking trends
 */
router.get('/our-rankings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = parseInt(req.query.days as string, 10) || 30;
    const trends = await getOurRankingTrends(days);
    res.json({ success: true, data: trends });
  } catch (error) {
    next(error);
  }
});

// ==============================================
// PE ACTIVITY
// ==============================================

/**
 * GET /api/admin/competitors/pe-activity
 * Get recent PE activity
 */
router.get('/pe-activity', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = parseInt(req.query.days as string, 10) || 90;
    const activity = await getRecentPeActivity(days);
    res.json({ success: true, data: activity });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/competitors/pe-activity
 * Log PE activity
 */
router.post('/pe-activity', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = insertPeActivityLogSchema.parse(req.body);
    const activity = await logPeActivity(data);
    res.status(201).json({ success: true, data: activity });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
    }
    next(error);
  }
});

// ==============================================
// PE MONITORING & ALERTS
// ==============================================

/**
 * GET /api/admin/competitors/alerts
 * Get all alerts with stats
 */
router.get('/alerts', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await getAlertStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/competitors/alerts/unread
 * Get unread alerts
 */
router.get('/alerts/unread', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const alerts = await getUnreadAlerts();
    res.json({ success: true, data: alerts });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/competitors/alerts/critical
 * Get critical alerts from last N days
 */
router.get('/alerts/critical', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = parseInt(req.query.days as string, 10) || 7;
    const alerts = await getCriticalAlerts(days);
    res.json({ success: true, data: alerts });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/competitors/alerts/:id/read
 * Mark alert as read
 */
router.post('/alerts/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alertId = parseInt(req.params.id, 10);
    if (isNaN(alertId)) {
      return res.status(400).json({ success: false, error: 'Invalid alert ID' });
    }
    await markAlertRead(alertId);
    res.json({ success: true, message: 'Alert marked as read' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/competitors/alerts/:id/acknowledge
 * Acknowledge an alert
 */
router.post('/alerts/:id/acknowledge', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alertId = parseInt(req.params.id, 10);
    const { acknowledgedBy } = req.body;
    if (isNaN(alertId)) {
      return res.status(400).json({ success: false, error: 'Invalid alert ID' });
    }
    await acknowledgeAlert(alertId, acknowledgedBy || 'admin');
    res.json({ success: true, message: 'Alert acknowledged' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/competitors/monitor/check
 * Trigger a PE monitoring check
 */
router.post('/monitor/check', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await runPeMonitorCheck();
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/competitors/monitor/queries
 * Get the search queries used for monitoring
 */
router.get('/monitor/queries', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const queries = getSearchQueries();
    res.json({ success: true, data: queries });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/competitors/monitor/process-news
 * Process a news item for PE activity
 */
router.post('/monitor/process-news', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, url, publishedAt } = req.body;
    if (!title || !description || !url) {
      return res.status(400).json({ success: false, error: 'title, description, and url are required' });
    }
    const created = await processNewsItem({
      title,
      description,
      url,
      publishedAt: publishedAt ? new Date(publishedAt) : undefined,
    });
    res.json({ success: true, alertCreated: created });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/competitors/alerts/test
 * Create test alerts for demonstration
 */
router.post('/alerts/test', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await createTestAlerts();
    res.json({ success: true, data: { alertsCreated: count } });
  } catch (error) {
    next(error);
  }
});

export default router;
