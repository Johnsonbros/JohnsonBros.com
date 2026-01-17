import { Request, Response, Router } from 'express';
import { db } from '../db';
import {
  abTests,
  abTestVariants,
  abTestAssignments,
  abTestEvents,
  abTestMetrics,
  conversionEvents,
  insertAbTestSchema,
  insertAbTestVariantSchema,
  updateAbTestSchema
} from '@shared/schema';
import { eq, and, sql, gte, lte, desc, asc, isNull } from 'drizzle-orm';
import { enhancedLogger as logger } from './monitoring/logger';
import { authenticate } from './auth';

const router = Router();

// Statistical significance calculation
function calculateZScore(control: any, variant: any): number {
  const p1 = control.conversionRate;
  const p2 = variant.conversionRate;
  const n1 = control.impressions;
  const n2 = variant.impressions;

  if (n1 === 0 || n2 === 0) return 0;

  const pooledProp = ((p1 * n1) + (p2 * n2)) / (n1 + n2);
  const se = Math.sqrt(pooledProp * (1 - pooledProp) * ((1 / n1) + (1 / n2)));

  if (se === 0) return 0;

  return (p2 - p1) / se;
}

function calculateConfidenceLevel(zScore: number): number {
  const absZ = Math.abs(zScore);
  if (absZ >= 2.576) return 99;
  if (absZ >= 1.96) return 95;
  if (absZ >= 1.645) return 90;
  return Math.min(Math.floor(absZ * 50), 89);
}

function calculateSampleSize(
  baselineRate: number,
  mde: number, // minimum detectable effect
  alpha: number = 0.05,
  power: number = 0.8
): number {
  const p1 = baselineRate;
  const p2 = baselineRate * (1 + mde);
  const pooledP = (p1 + p2) / 2;

  const za = 1.96; // Z-score for 95% confidence (two-tailed)
  const zb = 0.84; // Z-score for 80% power

  const n = 2 * pooledP * (1 - pooledP) * Math.pow((za + zb), 2) / Math.pow((p2 - p1), 2);

  return Math.ceil(n);
}

// Create new experiment
router.post('/api/v1/experiments', authenticate, async (req: Request, res: Response) => {
  try {
    const { test, variants } = req.body;

    // Validate test data
    const testData = insertAbTestSchema.parse(test);

    // Insert test
    const [insertedTest] = await db.insert(abTests).values({
      ...testData,
      status: 'draft',
      createdAt: new Date()
    }).returning();

    // Insert variants
    const insertedVariants = [];
    for (const variant of variants) {
      const [inserted] = await db.insert(abTestVariants).values({
        testId: insertedTest.id,
        ...variant
      }).returning();
      insertedVariants.push(inserted);
    }

    res.json({
      test: insertedTest,
      variants: insertedVariants
    });
  } catch (error) {
    logger.error('Error creating experiment', error);
    res.status(500).json({ error: 'Failed to create experiment' });
  }
});

// Update experiment
router.patch('/api/v1/experiments/:testId', authenticate, async (req: Request, res: Response) => {
  try {
    const { testId } = req.params;
    const updates = updateAbTestSchema.parse(req.body);

    const [updated] = await db
      .update(abTests)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(abTests.testId, testId))
      .returning();

    res.json(updated);
  } catch (error) {
    logger.error('Error updating experiment', error);
    res.status(500).json({ error: 'Failed to update experiment' });
  }
});

// Get all experiments with metrics
router.get('/api/v1/experiments', authenticate, async (req: Request, res: Response) => {
  try {
    const { status, startDate, endDate } = req.query;

    let query: any = db
      .select({
        test: abTests,
        variant: abTestVariants,
        metrics: abTestMetrics
      })
      .from(abTests)
      .leftJoin(abTestVariants, eq(abTests.id, abTestVariants.testId))
      .leftJoin(abTestMetrics, and(
        eq(abTestMetrics.testId, abTests.testId),
        eq(abTestMetrics.variantId, abTestVariants.variantId)
      ));

    if (status) {
      query = query.where(eq(abTests.status, status as string));
    }

    if (startDate) {
      query = query.where(gte(abTests.startDate, new Date(startDate as string)));
    }

    if (endDate) {
      query = query.where(lte(abTests.endDate, new Date(endDate as string)));
    }

    const results = await query;

    // Group by test and calculate additional metrics
    const experiments = new Map();

    for (const row of results) {
      const testId = row.test.testId;

      if (!experiments.has(testId)) {
        experiments.set(testId, {
          ...row.test,
          variants: [] as any[],
          totalImpressions: 0,
          totalConversions: 0,
          overallConversionRate: 0,
          status: row.test.status
        });
      }

      const experiment = experiments.get(testId);

      if (row.variant) {
        const variantData = {
          ...row.variant,
          metrics: row.metrics || {
            impressions: 0,
            conversions: 0,
            conversionRate: 0,
            revenue: 0
          },
          lift: 0,
          confidence: 0
        };

        experiment.variants.push(variantData);

        if (row.metrics) {
          experiment.totalImpressions += row.metrics.impressions;
          experiment.totalConversions += row.metrics.conversions;
        }
      }
    }

    // Calculate lift and confidence for each variant
    for (const experiment of experiments.values()) {
      if (experiment.totalImpressions > 0) {
        experiment.overallConversionRate = experiment.totalConversions / experiment.totalImpressions;
      }

      const control = experiment.variants.find((v: any) => v.isControl);

      if (control && control.metrics) {
        for (const variant of experiment.variants) {
          if (!variant.isControl && variant.metrics) {
            // Calculate lift
            if (control.metrics.conversionRate > 0) {
              variant.lift = ((variant.metrics.conversionRate - control.metrics.conversionRate) / control.metrics.conversionRate) * 100;
            }

            // Calculate statistical significance
            const zScore = calculateZScore(control.metrics, variant.metrics);
            variant.confidence = calculateConfidenceLevel(zScore);
          }
        }
      }

      // Determine winner if experiment is completed
      if (experiment.status === 'completed' && !experiment.winnerVariantId) {
        let winner = null;
        let maxConversionRate = 0;

        for (const variant of experiment.variants) {
          if (variant.metrics && variant.metrics.conversionRate > maxConversionRate && variant.confidence >= 95) {
            winner = variant;
            maxConversionRate = variant.metrics.conversionRate;
          }
        }

        if (winner) {
          experiment.winnerVariantId = winner.variantId;
          // Update in database
          await db
            .update(abTests)
            .set({ winnerVariantId: winner.variantId })
            .where(eq(abTests.testId, experiment.testId));
        }
      }
    }

    res.json(Array.from(experiments.values()));
  } catch (error) {
    logger.error('Error fetching experiments', error);
    res.status(500).json({ error: 'Failed to fetch experiments' });
  }
});

// Get single experiment details
router.get('/api/v1/experiments/:testId', authenticate, async (req: Request, res: Response) => {
  try {
    const { testId } = req.params;
    const { dateRange = '7d' } = req.query;

    // Get test and variants
    const testData = await db
      .select()
      .from(abTests)
      .leftJoin(abTestVariants, eq(abTests.id, abTestVariants.testId))
      .leftJoin(abTestMetrics, and(
        eq(abTestMetrics.testId, abTests.testId),
        eq(abTestMetrics.variantId, abTestVariants.variantId)
      ))
      .where(eq(abTests.testId, testId));

    if (testData.length === 0) {
      return res.status(404).json({ error: 'Experiment not found' });
    }

    // Get time series data for charts
    const startDate = new Date();
    if (dateRange === '24h') {
      startDate.setDate(startDate.getDate() - 1);
    } else if (dateRange === '7d') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (dateRange === '30d') {
      startDate.setDate(startDate.getDate() - 30);
    }

    const timeSeriesData = await db
      .select({
        date: sql<string>`DATE(created_at)`,
        hour: sql<number>`EXTRACT(HOUR FROM created_at)`,
        variantId: abTestEvents.variantId,
        eventType: abTestEvents.eventType,
        count: sql<number>`COUNT(*)`,
        sumValue: sql<number>`SUM(event_value)`
      })
      .from(abTestEvents)
      .where(and(
        eq(abTestEvents.testId, testId),
        gte(abTestEvents.createdAt, startDate)
      ))
      .groupBy(
        sql`DATE(created_at)`,
        sql`EXTRACT(HOUR FROM created_at)`,
        abTestEvents.variantId,
        abTestEvents.eventType
      )
      .orderBy(sql`DATE(created_at)`, sql`EXTRACT(HOUR FROM created_at)`);

    // Get user segments data
    const segmentData = await db
      .select({
        variantId: abTestEvents.variantId,
        segment: sql<string>`
          CASE 
            WHEN metadata->>'isMobile' = 'true' THEN 'mobile'
            ELSE 'desktop'
          END
        `,
        conversions: sql<number>`COUNT(CASE WHEN event_type = 'conversion' THEN 1 END)`,
        impressions: sql<number>`COUNT(CASE WHEN event_type = 'impression' THEN 1 END)`
      })
      .from(abTestEvents)
      .where(eq(abTestEvents.testId, testId))
      .groupBy(
        abTestEvents.variantId,
        sql`CASE WHEN metadata->>'isMobile' = 'true' THEN 'mobile' ELSE 'desktop' END`
      );

    // Build response
    const experiment = {
      ...testData[0].ab_tests,
      variants: [] as any[],
      timeSeries: timeSeriesData,
      segments: segmentData
    };

    const variantsMap = new Map();

    for (const row of testData) {
      if (row.ab_test_variants) {
        const variantId = row.ab_test_variants.variantId;

        if (!variantsMap.has(variantId)) {
          variantsMap.set(variantId, {
            ...row.ab_test_variants,
            metrics: row.ab_test_metrics || {
              impressions: 0,
              conversions: 0,
              conversionRate: 0,
              revenue: 0
            }
          });
        }
      }
    }

    experiment.variants = Array.from(variantsMap.values());

    // Add statistical analysis
    const control = experiment.variants.find((v: any) => v.isControl);

    if (control) {
      for (const variant of experiment.variants) {
        if (!variant.isControl) {
          const zScore = calculateZScore(control.metrics, variant.metrics);
          variant.confidence = calculateConfidenceLevel(zScore);

          if (control.metrics.conversionRate > 0) {
            variant.lift = ((variant.metrics.conversionRate - control.metrics.conversionRate) / control.metrics.conversionRate) * 100;
          }

          // Calculate required sample size for significance
          variant.requiredSampleSize = calculateSampleSize(
            control.metrics.conversionRate,
            0.2, // 20% minimum detectable effect
            0.05,
            0.8
          );
        }
      }
    }

    res.json(experiment);
  } catch (error) {
    logger.error('Error fetching experiment details', error);
    res.status(500).json({ error: 'Failed to fetch experiment details' });
  }
});

// Start experiment
router.post('/api/v1/experiments/:testId/start', authenticate, async (req: Request, res: Response) => {
  try {
    const { testId } = req.params;

    const [updated] = await db
      .update(abTests)
      .set({
        status: 'active',
        startDate: new Date(),
        updatedAt: new Date()
      })
      .where(eq(abTests.testId, testId))
      .returning();

    res.json(updated);
  } catch (error) {
    logger.error('Error starting experiment', error);
    res.status(500).json({ error: 'Failed to start experiment' });
  }
});

// Pause experiment
router.post('/api/v1/experiments/:testId/pause', authenticate, async (req: Request, res: Response) => {
  try {
    const { testId } = req.params;

    const [updated] = await db
      .update(abTests)
      .set({
        status: 'paused',
        updatedAt: new Date()
      })
      .where(eq(abTests.testId, testId))
      .returning();

    res.json(updated);
  } catch (error) {
    logger.error('Error pausing experiment', error);
    res.status(500).json({ error: 'Failed to pause experiment' });
  }
});

// Complete experiment and select winner
router.post('/api/v1/experiments/:testId/complete', authenticate, async (req: Request, res: Response) => {
  try {
    const { testId } = req.params;
    const { winnerVariantId } = req.body;

    const [updated] = await db
      .update(abTests)
      .set({
        status: 'completed',
        endDate: new Date(),
        winnerVariantId,
        updatedAt: new Date()
      })
      .where(eq(abTests.testId, testId))
      .returning();

    res.json(updated);
  } catch (error) {
    logger.error('Error completing experiment', error);
    res.status(500).json({ error: 'Failed to complete experiment' });
  }
});

// Roll out winner to 100% traffic
router.post('/api/v1/experiments/:testId/rollout', authenticate, async (req: Request, res: Response) => {
  try {
    const { testId } = req.params;

    // Get experiment with winner
    const [experiment] = await db
      .select()
      .from(abTests)
      .where(eq(abTests.testId, testId))
      .limit(1);

    if (!experiment || !experiment.winnerVariantId) {
      return res.status(400).json({ error: 'No winner selected for this experiment' });
    }

    // Set all variants to 0 weight except winner
    await db
      .update(abTestVariants)
      .set({ weight: 0 })
      .where(eq(abTestVariants.testId, experiment.id));

    await db
      .update(abTestVariants)
      .set({ weight: 100 })
      .where(and(
        eq(abTestVariants.testId, experiment.id),
        eq(abTestVariants.variantId, experiment.winnerVariantId)
      ));

    // Update test traffic allocation to 100%
    await db
      .update(abTests)
      .set({
        trafficAllocation: 1.0,
        updatedAt: new Date()
      })
      .where(eq(abTests.testId, testId));

    res.json({ success: true, message: 'Winner rolled out to 100% of traffic' });
  } catch (error) {
    logger.error('Error rolling out winner', error);
    res.status(500).json({ error: 'Failed to roll out winner' });
  }
});

// Export experiment data
router.get('/api/v1/experiments/:testId/export', authenticate, async (req: Request, res: Response) => {
  try {
    const { testId } = req.params;
    const { format = 'csv' } = req.query;

    // Get all events for the experiment
    const events = await db
      .select()
      .from(abTestEvents)
      .where(eq(abTestEvents.testId, testId))
      .orderBy(abTestEvents.createdAt);

    if (format === 'csv') {
      const csv = [
        'Timestamp,Visitor ID,Variant ID,Event Type,Event Action,Event Value',
        ...events.map(e =>
          `${e.createdAt},${e.visitorId},${e.variantId},${e.eventType},${e.eventAction || ''},${e.eventValue || ''}`
        )
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=experiment-${testId}-${Date.now()}.csv`);
      res.send(csv);
    } else {
      res.json(events);
    }
  } catch (error) {
    logger.error('Error exporting experiment data', error);
    res.status(500).json({ error: 'Failed to export experiment data' });
  }
});

// Get experiment recommendations
router.get('/api/v1/experiments/recommendations', authenticate, async (req: Request, res: Response) => {
  try {
    const recommendations: any[] = []; // Explicitly type as any[]

    // Check for experiments running too long without significance
    const longRunning = await db
      .select()
      .from(abTests)
      .where(and(
        eq(abTests.status, 'active'),
        lte(abTests.startDate as any, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // 30 days ago
      ));

    for (const test of longRunning) {
      // Fetch variants and their metrics correctly
      const variantsWithMetrics = await db
        .select({
          variant: abTestVariants,
          metrics: abTestMetrics
        })
        .from(abTestVariants)
        .leftJoin(abTestMetrics, and(
          eq(abTestMetrics.testId, test.testId),
          eq(abTestMetrics.variantId, abTestVariants.variantId)
        ))
        .where(eq(abTestVariants.testId, test.id));

      let hasSignificance = false;
      const controlData = variantsWithMetrics.find(r => r.variant.isControl);

      if (controlData && controlData.metrics) {
        for (const row of variantsWithMetrics) {
          if (!row.variant.isControl && row.metrics) {
            const zScore = calculateZScore(controlData.metrics, row.metrics);
            if (calculateConfidenceLevel(zScore) >= 95) {
              hasSignificance = true;
              break;
            }
          }
        }
      }

      if (!hasSignificance) {
        recommendations.push({
          type: 'long_running_test',
          testId: test.testId,
          testName: test.name,
          daysRunning: Math.floor((Date.now() - test.startDate!.getTime()) / (24 * 60 * 60 * 1000)),
          action: 'Consider ending this test or increasing traffic allocation',
          severity: 'medium'
        });
      }
    }

    // Check for tests with low traffic
    const lowTraffic = await db.execute(sql`
      SELECT 
        t.test_id,
        t.name,
        COUNT(DISTINCT e.visitor_id) as unique_visitors,
        t.traffic_allocation
      FROM ab_tests t
      LEFT JOIN ab_test_events e ON t.test_id = e.test_id
      WHERE t.status = 'active'
      GROUP BY t.test_id, t.name, t.traffic_allocation
      HAVING COUNT(DISTINCT e.visitor_id) < 100
    `);

    for (const row of lowTraffic.rows) {
      recommendations.push({
        type: 'low_traffic',
        testId: row.test_id,
        testName: row.name,
        uniqueVisitors: row.unique_visitors,
        action: 'Increase traffic allocation or promote the test page',
        severity: 'high'
      });
    }

    res.json({ recommendations });
  } catch (error) {
    logger.error('Error generating experiment recommendations', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

export default router;