import { Request, Response, Router } from 'express';
import { db } from '../db';
import { 
  abTests, 
  abTestVariants, 
  abTestAssignments, 
  abTestEvents, 
  abTestMetrics,
  insertAbTestEventSchema 
} from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { logger } from './logger';

const router = Router();

// Get active A/B tests
router.get('/api/v1/ab-tests/active', async (req: Request, res: Response) => {
  try {
    const activeTests = await db
      .select()
      .from(abTests)
      .leftJoin(abTestVariants, eq(abTests.id, abTestVariants.testId))
      .where(eq(abTests.status, 'active'));

    // Group tests with their variants
    const testsMap = new Map();
    activeTests.forEach(row => {
      const test = row.ab_tests;
      const variant = row.ab_test_variants;
      
      if (!testsMap.has(test.testId)) {
        testsMap.set(test.testId, {
          ...test,
          variants: []
        });
      }
      
      if (variant) {
        testsMap.get(test.testId).variants.push(variant);
      }
    });

    res.json(Array.from(testsMap.values()));
  } catch (error) {
    logger.error('Error fetching active AB tests', error);
    res.status(500).json({ error: 'Failed to fetch active tests' });
  }
});

// Track assignment
router.post('/api/v1/ab-tests/assignment', async (req: Request, res: Response) => {
  try {
    const { testId, variantId, visitorId, sessionId } = req.body;

    // Check if assignment already exists
    const existing = await db
      .select()
      .from(abTestAssignments)
      .where(
        and(
          eq(abTestAssignments.visitorId, visitorId),
          eq(abTestAssignments.testId, testId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(abTestAssignments).values({
        testId,
        variantId,
        visitorId,
        sessionId
      });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Error tracking assignment', error);
    res.status(500).json({ error: 'Failed to track assignment' });
  }
});

// Track event
router.post('/api/v1/ab-tests/event', async (req: Request, res: Response) => {
  try {
    const eventData = insertAbTestEventSchema.parse(req.body);
    
    await db.insert(abTestEvents).values(eventData);
    
    // Update metrics in real-time
    await updateMetrics(eventData.testId, eventData.variantId, eventData.eventType);
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Error tracking AB test event', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

// Track batch events
router.post('/api/v1/ab-tests/events/batch', async (req: Request, res: Response) => {
  try {
    const { events } = req.body;
    
    if (!Array.isArray(events)) {
      return res.status(400).json({ error: 'Events must be an array' });
    }

    // Insert all events
    for (const event of events) {
      const eventData = insertAbTestEventSchema.parse(event);
      await db.insert(abTestEvents).values(eventData);
    }

    // Update metrics for each unique test/variant combination
    const uniqueCombinations = new Set(
      events.map(e => `${e.testId}|${e.variantId}`)
    );

    for (const combo of uniqueCombinations) {
      const [testId, variantId] = combo.split('|');
      await updateMetrics(testId, variantId);
    }

    res.json({ success: true, processed: events.length });
  } catch (error) {
    logger.error('Error tracking batch events', error);
    res.status(500).json({ error: 'Failed to track batch events' });
  }
});

// Get test metrics
router.get('/api/v1/ab-tests/:testId/metrics', async (req: Request, res: Response) => {
  try {
    const { testId } = req.params;
    
    const metrics = await db
      .select()
      .from(abTestMetrics)
      .where(eq(abTestMetrics.testId, testId));

    // Calculate statistical significance if there's enough data
    const enrichedMetrics = await Promise.all(metrics.map(async (metric) => {
      const significance = await calculateStatisticalSignificance(testId, metric.variantId);
      return {
        ...metric,
        statisticalSignificance: significance
      };
    }));

    res.json(enrichedMetrics);
  } catch (error) {
    logger.error('Error fetching metrics', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Update test status
router.patch('/api/v1/ab-tests/:testId/status', async (req: Request, res: Response) => {
  try {
    const { testId } = req.params;
    const { status } = req.body;
    
    if (!['draft', 'active', 'paused', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await db
      .update(abTests)
      .set({ 
        status,
        updatedAt: new Date(),
        ...(status === 'active' ? { startDate: new Date() } : {}),
        ...(status === 'completed' ? { endDate: new Date() } : {})
      })
      .where(eq(abTests.testId, testId));

    res.json({ success: true });
  } catch (error) {
    logger.error('Error updating test status', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Helper function to update metrics
async function updateMetrics(testId: string, variantId: string, eventType?: string) {
  try {
    // Get current metrics
    const currentMetrics = await db
      .select()
      .from(abTestMetrics)
      .where(
        and(
          eq(abTestMetrics.testId, testId),
          eq(abTestMetrics.variantId, variantId)
        )
      )
      .limit(1);

    // Count events
    const impressions = await db
      .select({ count: sql<number>`count(*)` })
      .from(abTestEvents)
      .where(
        and(
          eq(abTestEvents.testId, testId),
          eq(abTestEvents.variantId, variantId),
          eq(abTestEvents.eventType, 'impression')
        )
      );

    const conversions = await db
      .select({ count: sql<number>`count(*)` })
      .from(abTestEvents)
      .where(
        and(
          eq(abTestEvents.testId, testId),
          eq(abTestEvents.variantId, variantId),
          eq(abTestEvents.eventType, 'conversion')
        )
      );

    const revenue = await db
      .select({ total: sql<number>`coalesce(sum(event_value), 0)` })
      .from(abTestEvents)
      .where(
        and(
          eq(abTestEvents.testId, testId),
          eq(abTestEvents.variantId, variantId),
          eq(abTestEvents.eventType, 'conversion')
        )
      );

    const impressionCount = impressions[0]?.count || 0;
    const conversionCount = conversions[0]?.count || 0;
    const totalRevenue = revenue[0]?.total || 0;
    const conversionRate = impressionCount > 0 ? conversionCount / impressionCount : 0;

    if (currentMetrics.length === 0) {
      // Insert new metrics
      await db.insert(abTestMetrics).values({
        testId,
        variantId,
        impressions: impressionCount,
        conversions: conversionCount,
        conversionRate,
        revenue: totalRevenue,
        updatedAt: new Date()
      });
    } else {
      // Update existing metrics
      await db
        .update(abTestMetrics)
        .set({
          impressions: impressionCount,
          conversions: conversionCount,
          conversionRate,
          revenue: totalRevenue,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(abTestMetrics.testId, testId),
            eq(abTestMetrics.variantId, variantId)
          )
        );
    }
  } catch (error) {
    logger.error('Error updating metrics', error);
  }
}

// Calculate statistical significance using Chi-squared test
async function calculateStatisticalSignificance(testId: string, variantId: string): Promise<number> {
  try {
    // Get control variant metrics
    const controlMetrics = await db
      .select()
      .from(abTestMetrics)
      .leftJoin(abTestVariants, and(
        eq(abTestVariants.variantId, abTestMetrics.variantId),
        eq(abTestVariants.isControl, true)
      ))
      .where(eq(abTestMetrics.testId, testId))
      .limit(1);

    // Get test variant metrics
    const testMetrics = await db
      .select()
      .from(abTestMetrics)
      .where(
        and(
          eq(abTestMetrics.testId, testId),
          eq(abTestMetrics.variantId, variantId)
        )
      )
      .limit(1);

    if (!controlMetrics[0] || !testMetrics[0]) {
      return 0;
    }

    const control = controlMetrics[0].ab_test_metrics;
    const test = testMetrics[0].ab_test_metrics;

    // Simple Z-score calculation for conversion rate difference
    const p1 = control.conversionRate;
    const p2 = test.conversionRate;
    const n1 = control.impressions;
    const n2 = test.impressions;

    if (n1 === 0 || n2 === 0) {
      return 0;
    }

    const pooledProp = ((p1 * n1) + (p2 * n2)) / (n1 + n2);
    const se = Math.sqrt(pooledProp * (1 - pooledProp) * ((1/n1) + (1/n2)));
    
    if (se === 0) {
      return 0;
    }

    const z = (p2 - p1) / se;
    
    // Convert Z-score to confidence level
    // Z = 1.645 -> 90% confidence
    // Z = 1.96 -> 95% confidence
    // Z = 2.576 -> 99% confidence
    const absZ = Math.abs(z);
    if (absZ >= 2.576) return 99;
    if (absZ >= 1.96) return 95;
    if (absZ >= 1.645) return 90;
    
    return Math.min(Math.floor(absZ * 50), 89); // Scale to percentage
  } catch (error) {
    logger.error('Error calculating statistical significance', error);
    return 0;
  }
}

export default router;