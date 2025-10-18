import { Request, Response, Router } from 'express';
import { db } from '../db';
import {
  conversionFunnels,
  conversionEvents,
  microConversions,
  attributionData,
  insertConversionEventSchema,
  insertMicroConversionSchema,
  insertAttributionDataSchema,
  abTestEvents
} from '@shared/schema';
import { eq, and, sql, gte, lte, desc } from 'drizzle-orm';
import { enhancedLogger as logger } from './monitoring/logger';

const router = Router();

// Track conversion event
router.post('/api/v1/conversions', async (req: Request, res: Response) => {
  try {
    const {
      sessionId,
      type,
      value,
      properties,
      attribution,
      testData
    } = req.body;

    // Insert conversion event
    const [event] = await db.insert(conversionEvents).values({
      sessionId,
      eventType: type,
      eventValue: value,
      properties,
      createdAt: new Date()
    }).returning();

    // Store attribution if provided
    if (attribution && attribution.source) {
      await db.insert(attributionData).values({
        sessionId,
        conversionEventId: event.id,
        ...attribution
      });
    }

    // Track in A/B tests if test data provided
    if (testData && testData.abTests) {
      for (const test of testData.abTests) {
        await db.insert(abTestEvents).values({
          testId: test.testId,
          variantId: test.variantId,
          visitorId: sessionId,
          eventType: 'conversion',
          eventAction: type,
          eventValue: value,
          metadata: properties
        });
      }
    }

    res.json({ success: true, eventId: event.id });
  } catch (error) {
    logger.error('Error tracking conversion', error);
    res.status(500).json({ error: 'Failed to track conversion' });
  }
});

// Track batch micro-conversions
router.post('/api/v1/conversions/batch', async (req: Request, res: Response) => {
  try {
    const { sessionId, events } = req.body;

    if (!Array.isArray(events)) {
      return res.status(400).json({ error: 'Events must be an array' });
    }

    const insertedEvents = [];
    for (const event of events) {
      const [inserted] = await db.insert(microConversions).values({
        sessionId,
        eventType: event.type,
        properties: event.properties,
        createdAt: new Date()
      }).returning();
      insertedEvents.push(inserted);
    }

    res.json({ success: true, processed: insertedEvents.length });
  } catch (error) {
    logger.error('Error tracking batch micro-conversions', error);
    res.status(500).json({ error: 'Failed to track micro-conversions' });
  }
});

// Get funnel analytics
router.get('/api/v1/conversions/funnel/:funnelId', async (req: Request, res: Response) => {
  try {
    const { funnelId } = req.params;
    const { startDate, endDate, source, medium, campaign } = req.query;

    let query = db
      .select({
        stage: conversionEvents.properties,
        count: sql<number>`count(distinct session_id)`,
        avgTimeInStage: sql<number>`avg(cast(properties->>'timeInStage' as float))`,
        conversionRate: sql<number>`0` // Will calculate below
      })
      .from(conversionEvents)
      .where(
        and(
          sql`properties->>'funnelId' = ${funnelId}`,
          startDate ? gte(conversionEvents.createdAt, new Date(startDate as string)) : undefined,
          endDate ? lte(conversionEvents.createdAt, new Date(endDate as string)) : undefined
        )
      )
      .groupBy(sql`properties->>'stage'`);

    // Apply attribution filters if provided
    if (source || medium || campaign) {
      query = query
        .leftJoin(
          attributionData,
          eq(conversionEvents.id, attributionData.conversionEventId)
        )
        .where(
          and(
            sql`properties->>'funnelId' = ${funnelId}`,
            source ? eq(attributionData.source, source as string) : undefined,
            medium ? eq(attributionData.medium, medium as string) : undefined,
            campaign ? eq(attributionData.campaign, campaign as string) : undefined
          )
        );
    }

    const results = await query;

    // Calculate conversion rates between stages
    const stages = results.map(r => ({
      stage: r.stage?.stage || 'unknown',
      visitors: r.count,
      avgTimeInStage: r.avgTimeInStage,
      conversionRate: 0
    }));

    // Sort stages and calculate drop-off rates
    for (let i = 1; i < stages.length; i++) {
      if (stages[i - 1].visitors > 0) {
        stages[i].conversionRate = (stages[i].visitors / stages[i - 1].visitors) * 100;
      }
    }

    res.json({
      funnelId,
      stages,
      totalConversion: stages.length > 0 
        ? (stages[stages.length - 1].visitors / stages[0].visitors) * 100 
        : 0
    });
  } catch (error) {
    logger.error('Error fetching funnel analytics', error);
    res.status(500).json({ error: 'Failed to fetch funnel analytics' });
  }
});

// Get conversion metrics by source
router.get('/api/v1/conversions/attribution', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, groupBy = 'source' } = req.query;

    const metrics = await db
      .select({
        dimension: groupBy === 'source' 
          ? attributionData.source 
          : groupBy === 'medium' 
          ? attributionData.medium 
          : attributionData.campaign,
        conversions: sql<number>`count(*)`,
        totalValue: sql<number>`sum(ce.event_value)`,
        avgValue: sql<number>`avg(ce.event_value)`,
        uniqueSessions: sql<number>`count(distinct ad.session_id)`
      })
      .from(attributionData)
      .leftJoin(
        conversionEvents,
        eq(attributionData.conversionEventId, conversionEvents.id)
      )
      .where(
        and(
          startDate ? gte(conversionEvents.createdAt, new Date(startDate as string)) : undefined,
          endDate ? lte(conversionEvents.createdAt, new Date(endDate as string)) : undefined
        )
      )
      .groupBy(
        groupBy === 'source' 
          ? attributionData.source 
          : groupBy === 'medium' 
          ? attributionData.medium 
          : attributionData.campaign
      );

    res.json(metrics);
  } catch (error) {
    logger.error('Error fetching attribution metrics', error);
    res.status(500).json({ error: 'Failed to fetch attribution metrics' });
  }
});

// Get micro-conversion metrics
router.get('/api/v1/conversions/micro', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, eventType } = req.query;

    const metrics = await db
      .select({
        eventType: microConversions.eventType,
        count: sql<number>`count(*)`,
        uniqueSessions: sql<number>`count(distinct session_id)`,
        avgPerSession: sql<number>`count(*) / count(distinct session_id)::float`
      })
      .from(microConversions)
      .where(
        and(
          eventType ? eq(microConversions.eventType, eventType as string) : undefined,
          startDate ? gte(microConversions.createdAt, new Date(startDate as string)) : undefined,
          endDate ? lte(microConversions.createdAt, new Date(endDate as string)) : undefined
        )
      )
      .groupBy(microConversions.eventType);

    res.json(metrics);
  } catch (error) {
    logger.error('Error fetching micro-conversion metrics', error);
    res.status(500).json({ error: 'Failed to fetch micro-conversion metrics' });
  }
});

// Get conversion rate optimization recommendations
router.get('/api/v1/conversions/recommendations', async (req: Request, res: Response) => {
  try {
    const recommendations = [];

    // Check funnel drop-off points
    const funnelDropoffs = await db.execute(sql`
      WITH funnel_stages AS (
        SELECT 
          properties->>'funnelId' as funnel_id,
          properties->>'stage' as stage,
          COUNT(DISTINCT session_id) as visitors,
          LAG(COUNT(DISTINCT session_id)) OVER (
            PARTITION BY properties->>'funnelId' 
            ORDER BY created_at
          ) as prev_visitors
        FROM conversion_events
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY properties->>'funnelId', properties->>'stage', created_at
      )
      SELECT 
        funnel_id, 
        stage,
        visitors,
        prev_visitors,
        CASE 
          WHEN prev_visitors > 0 
          THEN (1 - (visitors::float / prev_visitors)) * 100 
          ELSE 0 
        END as drop_off_rate
      FROM funnel_stages
      WHERE prev_visitors > 0
      ORDER BY drop_off_rate DESC
      LIMIT 5
    `);

    if (funnelDropoffs.rows.length > 0) {
      funnelDropoffs.rows.forEach((row: any) => {
        if (row.drop_off_rate > 50) {
          recommendations.push({
            type: 'high_dropoff',
            severity: 'high',
            funnel: row.funnel_id,
            stage: row.stage,
            dropoffRate: row.drop_off_rate,
            message: `High drop-off rate (${Math.round(row.drop_off_rate)}%) detected at ${row.stage} stage`,
            action: 'Consider simplifying this step or adding more guidance'
          });
        }
      });
    }

    // Check for low-converting sources
    const lowConvertingSources = await db.execute(sql`
      SELECT 
        source,
        COUNT(*) as visits,
        SUM(CASE WHEN ce.event_type = 'complete_booking' THEN 1 ELSE 0 END) as conversions,
        (SUM(CASE WHEN ce.event_type = 'complete_booking' THEN 1 ELSE 0 END)::float / COUNT(*)) * 100 as conversion_rate
      FROM attribution_data ad
      LEFT JOIN conversion_events ce ON ad.conversion_event_id = ce.id
      WHERE ad.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY source
      HAVING COUNT(*) > 10
      ORDER BY conversion_rate ASC
      LIMIT 3
    `);

    if (lowConvertingSources.rows.length > 0) {
      lowConvertingSources.rows.forEach((row: any) => {
        if (row.conversion_rate < 1) {
          recommendations.push({
            type: 'low_converting_source',
            severity: 'medium',
            source: row.source,
            conversionRate: row.conversion_rate,
            visits: row.visits,
            message: `${row.source} has low conversion rate (${row.conversion_rate.toFixed(2)}%)`,
            action: 'Review landing page experience for this traffic source'
          });
        }
      });
    }

    // Check for form abandonment
    const formAbandonment = await db.execute(sql`
      WITH form_stats AS (
        SELECT 
          properties->>'formName' as form_name,
          COUNT(CASE WHEN event_type = 'micro_form_start' THEN 1 END) as starts,
          COUNT(CASE WHEN event_type = 'micro_form_abandon' THEN 1 END) as abandons,
          COUNT(CASE WHEN event_type = 'micro_form_complete' THEN 1 END) as completes
        FROM micro_conversions
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY properties->>'formName'
      )
      SELECT 
        form_name,
        starts,
        abandons,
        completes,
        CASE 
          WHEN starts > 0 
          THEN (abandons::float / starts) * 100 
          ELSE 0 
        END as abandonment_rate
      FROM form_stats
      WHERE starts > 5
      ORDER BY abandonment_rate DESC
      LIMIT 3
    `);

    if (formAbandonment.rows.length > 0) {
      formAbandonment.rows.forEach((row: any) => {
        if (row.abandonment_rate > 60) {
          recommendations.push({
            type: 'form_abandonment',
            severity: 'high',
            formName: row.form_name,
            abandonmentRate: row.abandonment_rate,
            message: `High form abandonment (${Math.round(row.abandonment_rate)}%) on ${row.form_name}`,
            action: 'Simplify form fields or add progress indicators'
          });
        }
      });
    }

    res.json({ recommendations });
  } catch (error) {
    logger.error('Error generating recommendations', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

export default router;