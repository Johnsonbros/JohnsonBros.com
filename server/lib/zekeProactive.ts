import { db } from "../db";
import { proactiveUpdates, escalationEvents } from "../../shared/schema";
import { ZEKE_CONFIG } from "../../config/zeke";
import { sendSMS } from "./twilio";
import { eq, and, desc, sql } from "drizzle-orm";

export class ZekeProactiveService {
  static async queueUpdate(update: {
    severity: 'critical' | 'high' | 'medium' | 'low';
    category: 'system' | 'business' | 'ops';
    title: string;
    content: string;
    metadata?: any;
  }) {
    const [record] = await db.insert(proactiveUpdates).values({
      ...update,
      status: 'pending'
    }).returning();

    // Immediate notification for critical issues
    if (update.severity === 'critical') {
      await this.notifyCEO(record);
    }

    return record;
  }

  static async notifyCEO(update: any) {
    const message = `🚨 ZEKE CRITICAL ALERT: ${update.title}\n\n${update.content}`;
    await sendSMS(ZEKE_CONFIG.ceo.phone, message);
    
    await db.update(proactiveUpdates)
      .set({ status: 'delivered', deliveredAt: new Date() })
      .where(eq(proactiveUpdates.id, update.id));
  }

  static async getPendingUpdatesForCEO() {
    return await db.select()
      .from(proactiveUpdates)
      .where(eq(proactiveUpdates.status, 'pending'))
      .orderBy(desc(proactiveUpdates.createdAt));
  }

  static async markAsDelivered(ids: number[]) {
    if (ids.length === 0) return;
    await db.update(proactiveUpdates)
      .set({ status: 'delivered', deliveredAt: new Date() })
      .where(sql`${proactiveUpdates.id} IN (${sql.join(ids, sql`, `)})`);
  }
}
