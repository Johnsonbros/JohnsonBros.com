import { db } from '../db';
import { zekeKpis, interactionLogs } from '@shared/schema';
import { sql, eq, and, gte, lte } from 'drizzle-orm';
import { Logger } from '../src/logger';

export async function updateZekeKpis() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate total interactions today
    const [counts] = await db.select({
      total: sql<number>`count(*)`,
      byChannel: sql<Record<string, number>>`jsonb_object_agg(channel, count)`,
    }).from(
      db.select({
        channel: interactionLogs.channel,
        count: sql<number>`count(*)`
      })
      .from(interactionLogs)
      .where(gte(interactionLogs.createdAt, today))
      .groupBy(interactionLogs.channel)
      .as('channel_counts')
    );

    // Calculate booking conversion (placeholder - would need booking tool call logs)
    const bookings = 0; 
    
    // Average sentiment (placeholder)
    const sentiment = 0.85;

    await db.insert(zekeKpis).values({
      date: today,
      totalInteractions: Number(counts?.total || 0),
      bookingsCount: bookings,
      conversionRate: bookings > 0 ? (bookings / Number(counts?.total)) * 100 : 0,
      avgSentiment: sentiment.toString(),
      topTools: [],
      metadata: counts?.byChannel || {}
    }).onConflictDoUpdate({
      target: [zekeKpis.date],
      set: {
        totalInteractions: Number(counts?.total || 0),
        bookingsCount: bookings,
        conversionRate: bookings > 0 ? (bookings / Number(counts?.total)) * 100 : 0,
        metadata: counts?.byChannel || {}
      }
    });

    Logger.info('[ZEKE] KPIs updated for', today.toDateString());
  } catch (error: any) {
    Logger.error('[ZEKE] Failed to update KPIs:', error.message);
  }
}
