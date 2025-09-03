import { db } from '../db';
import { 
  webhookEvents, 
  webhookEventTags, 
  webhookProcessedData,
  webhookAnalytics,
  webhookSubscriptions,
  InsertWebhookEvent,
  InsertWebhookEventTag,
  InsertWebhookProcessedData 
} from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import crypto from 'crypto';

// Event type categories for organizing webhook events
const EVENT_CATEGORIES = {
  'customer.created': 'customer',
  'customer.updated': 'customer',
  'customer.deleted': 'customer',
  'job.created': 'job',
  'job.scheduled': 'job',
  'job.started': 'job',
  'job.completed': 'job',
  'job.cancelled': 'job',
  'job.updated': 'job',
  'estimate.created': 'estimate',
  'estimate.sent': 'estimate',
  'estimate.viewed': 'estimate',
  'estimate.approved': 'estimate',
  'estimate.declined': 'estimate',
  'invoice.created': 'invoice',
  'invoice.sent': 'invoice',
  'invoice.paid': 'invoice',
  'invoice.overdue': 'invoice',
  'appointment.created': 'appointment',
  'appointment.scheduled': 'appointment',
  'appointment.rescheduled': 'appointment',
  'appointment.cancelled': 'appointment',
  'lead.created': 'lead',
  'lead.converted': 'lead',
  'lead.lost': 'lead',
};

export class WebhookProcessor {
  // Process incoming webhook event
  async processWebhookEvent(
    eventType: string,
    payload: any,
    headers: Record<string, string>
  ): Promise<{ success: boolean; eventId: number | null; error?: string }> {
    try {
      // Determine event category
      const eventCategory = EVENT_CATEGORIES[eventType] || 'unknown';
      
      // Extract entity ID based on event type
      const entityId = this.extractEntityId(eventType, payload);
      
      // Store the raw webhook event
      const [webhookEvent] = await db.insert(webhookEvents).values({
        eventId: payload.id || crypto.randomUUID(),
        eventType,
        eventCategory,
        entityId,
        companyId: payload.company_id || headers['x-company-id'],
        payload: JSON.stringify(payload),
        status: 'pending',
      }).returning();

      // Process the event asynchronously
      setImmediate(() => {
        this.processEventAsync(webhookEvent.id, eventType, payload).catch(console.error);
      });

      return { success: true, eventId: webhookEvent.id };
    } catch (error) {
      console.error('Error processing webhook:', error);
      return { 
        success: false, 
        eventId: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Extract entity ID from payload based on event type
  private extractEntityId(eventType: string, payload: any): string | null {
    const category = EVENT_CATEGORIES[eventType];
    
    switch (category) {
      case 'customer':
        return payload.customer?.id || payload.id;
      case 'job':
        return payload.job?.id || payload.id;
      case 'estimate':
        return payload.estimate?.id || payload.id;
      case 'invoice':
        return payload.invoice?.id || payload.id;
      case 'appointment':
        return payload.appointment?.id || payload.id;
      case 'lead':
        return payload.lead?.id || payload.id;
      default:
        return payload.id || null;
    }
  }

  // Process event asynchronously
  private async processEventAsync(eventId: number, eventType: string, payload: any) {
    try {
      // Parse and categorize the event data
      const processedData = await this.parseEventData(eventType, payload);
      
      // Store processed data
      await db.insert(webhookProcessedData).values({
        eventId,
        ...processedData,
      });

      // Generate and store tags
      const tags = this.generateEventTags(eventType, payload, processedData);
      if (tags.length > 0) {
        await db.insert(webhookEventTags).values(
          tags.map(tag => ({ ...tag, eventId }))
        );
      }

      // Update analytics
      await this.updateAnalytics(eventType, processedData);

      // Mark event as processed
      await db.update(webhookEvents)
        .set({ 
          status: 'processed',
          processedAt: new Date(),
        })
        .where(eq(webhookEvents.id, eventId));

    } catch (error) {
      console.error('Error processing event async:', error);
      
      // Mark event as failed
      await db.update(webhookEvents)
        .set({ 
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        .where(eq(webhookEvents.id, eventId));
    }
  }

  // Parse event data based on event type
  private async parseEventData(eventType: string, payload: any): Promise<Partial<InsertWebhookProcessedData>> {
    const category = EVENT_CATEGORIES[eventType];
    const baseData: Partial<InsertWebhookProcessedData> = {
      dataType: category || 'unknown',
      dataCategory: eventType,
      entityData: JSON.stringify(payload),
    };

    // Extract common fields based on category
    switch (category) {
      case 'customer':
        return {
          ...baseData,
          customerName: `${payload.first_name || ''} ${payload.last_name || ''}`.trim(),
          customerEmail: payload.email,
          customerPhone: payload.mobile_number || payload.home_number || payload.work_number,
          addressCity: payload.address?.city,
          addressState: payload.address?.state,
          isNewCustomer: eventType === 'customer.created',
        };

      case 'job':
        const jobAmount = payload.total_amount || payload.invoice?.total || 0;
        return {
          ...baseData,
          jobNumber: payload.invoice_number || payload.number,
          customerName: payload.customer?.name || `${payload.customer?.first_name || ''} ${payload.customer?.last_name || ''}`.trim(),
          customerEmail: payload.customer?.email,
          totalAmount: jobAmount,
          serviceDate: payload.schedule?.scheduled_start || payload.completed_at,
          serviceType: payload.name || payload.job_type,
          employeeName: payload.assigned_employees?.[0]?.name || payload.assigned_employees?.[0]?.first_name,
          addressCity: payload.address?.city,
          addressState: payload.address?.state,
          isHighValue: jobAmount > 500,
          isEmergency: payload.tags?.includes('emergency') || payload.priority === 'emergency',
        };

      case 'estimate':
        const estimateAmount = payload.total || payload.total_amount || 0;
        return {
          ...baseData,
          estimateNumber: payload.estimate_number || payload.number,
          customerName: payload.customer?.name || `${payload.customer?.first_name || ''} ${payload.customer?.last_name || ''}`.trim(),
          customerEmail: payload.customer?.email,
          totalAmount: estimateAmount,
          serviceDate: payload.schedule?.start_time,
          addressCity: payload.address?.city,
          addressState: payload.address?.state,
          isHighValue: estimateAmount > 500,
        };

      case 'invoice':
        const invoiceAmount = payload.total || payload.total_amount || 0;
        return {
          ...baseData,
          invoiceNumber: payload.invoice_number || payload.number,
          customerName: payload.customer?.name || `${payload.customer?.first_name || ''} ${payload.customer?.last_name || ''}`.trim(),
          customerEmail: payload.customer?.email,
          totalAmount: invoiceAmount,
          serviceDate: payload.issued_date || payload.created_at,
          addressCity: payload.address?.city,
          addressState: payload.address?.state,
          isHighValue: invoiceAmount > 500,
        };

      case 'appointment':
        return {
          ...baseData,
          customerName: payload.customer?.name || `${payload.customer?.first_name || ''} ${payload.customer?.last_name || ''}`.trim(),
          customerEmail: payload.customer?.email,
          serviceDate: payload.start_time || payload.scheduled_start,
          serviceType: payload.job?.name || payload.service_type,
          employeeName: payload.assigned_employees?.[0]?.name || payload.assigned_employees?.[0]?.first_name,
          addressCity: payload.address?.city,
          addressState: payload.address?.state,
        };

      case 'lead':
        return {
          ...baseData,
          customerName: payload.customer?.name || `${payload.customer?.first_name || ''} ${payload.customer?.last_name || ''}`.trim(),
          customerEmail: payload.customer?.email,
          customerPhone: payload.customer?.mobile_number || payload.customer?.phone,
          addressCity: payload.address?.city,
          addressState: payload.address?.state,
          isNewCustomer: true,
        };

      default:
        return baseData;
    }
  }

  // Generate tags for the event
  private generateEventTags(eventType: string, payload: any, processedData: Partial<InsertWebhookProcessedData>): Partial<InsertWebhookEventTag>[] {
    const tags: Partial<InsertWebhookEventTag>[] = [];

    // Priority tags
    if (processedData.isHighValue) {
      tags.push({ tagName: 'high-value', tagCategory: 'priority' });
    }
    if (processedData.isEmergency) {
      tags.push({ tagName: 'emergency', tagCategory: 'priority' });
    }

    // Customer type tags
    if (processedData.isNewCustomer) {
      tags.push({ tagName: 'new-customer', tagCategory: 'customer-type' });
    }
    if (processedData.isRepeatCustomer) {
      tags.push({ tagName: 'repeat-customer', tagCategory: 'customer-type' });
    }

    // Service type tags
    if (processedData.serviceType) {
      tags.push({ 
        tagName: processedData.serviceType.toLowerCase().replace(/\s+/g, '-'),
        tagCategory: 'service-type'
      });
    }

    // Location tags
    if (processedData.addressCity) {
      tags.push({ 
        tagName: processedData.addressCity.toLowerCase(),
        tagValue: processedData.addressState,
        tagCategory: 'location'
      });
    }

    // Event type tags
    if (eventType.includes('completed')) {
      tags.push({ tagName: 'completed', tagCategory: 'status' });
    }
    if (eventType.includes('cancelled')) {
      tags.push({ tagName: 'cancelled', tagCategory: 'status' });
    }
    if (eventType.includes('paid')) {
      tags.push({ tagName: 'paid', tagCategory: 'payment' });
    }

    // Time-based tags
    const now = new Date();
    const serviceDate = processedData.serviceDate ? new Date(processedData.serviceDate) : null;
    
    if (serviceDate) {
      const daysDiff = Math.floor((serviceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 0) {
        tags.push({ tagName: 'today', tagCategory: 'timing' });
      } else if (daysDiff === 1) {
        tags.push({ tagName: 'tomorrow', tagCategory: 'timing' });
      } else if (daysDiff > 0 && daysDiff <= 7) {
        tags.push({ tagName: 'this-week', tagCategory: 'timing' });
      }
    }

    return tags;
  }

  // Update analytics
  private async updateAnalytics(eventType: string, processedData: Partial<InsertWebhookProcessedData>) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const category = EVENT_CATEGORIES[eventType] || 'unknown';

    // Get or create today's analytics record
    const [analytics] = await db.select()
      .from(webhookAnalytics)
      .where(
        and(
          eq(webhookAnalytics.date, today),
          eq(webhookAnalytics.eventCategory, category)
        )
      )
      .limit(1);

    const updates: Partial<typeof webhookAnalytics.$inferInsert> = {
      totalEvents: sql`${webhookAnalytics.totalEvents} + 1`,
      processedEvents: sql`${webhookAnalytics.processedEvents} + 1`,
    };

    // Update specific metrics based on event type
    if (eventType === 'customer.created') {
      updates.newCustomers = sql`${webhookAnalytics.newCustomers} + 1`;
    }
    if (eventType === 'job.completed') {
      updates.jobsCompleted = sql`${webhookAnalytics.jobsCompleted} + 1`;
      if (processedData.totalAmount) {
        updates.totalRevenue = sql`${webhookAnalytics.totalRevenue} + ${processedData.totalAmount}`;
      }
    }
    if (eventType === 'estimate.sent' || eventType === 'estimate.created') {
      updates.estimatesSent = sql`${webhookAnalytics.estimatesSent} + 1`;
    }
    if (eventType === 'invoice.created') {
      updates.invoicesCreated = sql`${webhookAnalytics.invoicesCreated} + 1`;
    }

    if (analytics) {
      // Update existing record
      await db.update(webhookAnalytics)
        .set(updates)
        .where(eq(webhookAnalytics.id, analytics.id));
    } else {
      // Create new record
      await db.insert(webhookAnalytics).values({
        date: today,
        eventCategory: category,
        totalEvents: 1,
        processedEvents: 1,
        newCustomers: eventType === 'customer.created' ? 1 : 0,
        jobsCompleted: eventType === 'job.completed' ? 1 : 0,
        estimatesSent: eventType.includes('estimate') ? 1 : 0,
        invoicesCreated: eventType === 'invoice.created' ? 1 : 0,
        totalRevenue: processedData.totalAmount || 0,
      });
    }
  }

  // Get recent events for dashboard
  async getRecentEvents(limit: number = 50) {
    return await db.select()
      .from(webhookEvents)
      .orderBy(desc(webhookEvents.receivedAt))
      .limit(limit);
  }

  // Get events by category
  async getEventsByCategory(category: string, limit: number = 50) {
    return await db.select()
      .from(webhookEvents)
      .where(eq(webhookEvents.eventCategory, category))
      .orderBy(desc(webhookEvents.receivedAt))
      .limit(limit);
  }

  // Get processed data with tags
  async getProcessedDataWithTags(eventId: number) {
    const [processedData] = await db.select()
      .from(webhookProcessedData)
      .where(eq(webhookProcessedData.eventId, eventId))
      .limit(1);

    if (!processedData) return null;

    const tags = await db.select()
      .from(webhookEventTags)
      .where(eq(webhookEventTags.eventId, eventId));

    return {
      ...processedData,
      tags,
    };
  }

  // Get analytics for date range
  async getAnalytics(startDate: Date, endDate: Date) {
    return await db.select()
      .from(webhookAnalytics)
      .where(
        and(
          sql`${webhookAnalytics.date} >= ${startDate}`,
          sql`${webhookAnalytics.date} <= ${endDate}`
        )
      )
      .orderBy(desc(webhookAnalytics.date));
  }

  // Verify webhook signature (if Housecall Pro provides one)
  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  // Manage webhook subscription
  async manageSubscription(companyId: string, webhookUrl: string, eventTypes?: string[]) {
    const [existing] = await db.select()
      .from(webhookSubscriptions)
      .where(eq(webhookSubscriptions.companyId, companyId))
      .limit(1);

    if (existing) {
      // Update existing subscription
      return await db.update(webhookSubscriptions)
        .set({
          webhookUrl,
          eventTypes,
          updatedAt: new Date(),
        })
        .where(eq(webhookSubscriptions.id, existing.id))
        .returning();
    } else {
      // Create new subscription
      return await db.insert(webhookSubscriptions).values({
        companyId,
        webhookUrl,
        eventTypes,
        secretKey: crypto.randomBytes(32).toString('hex'),
      }).returning();
    }
  }
}

export const webhookProcessor = new WebhookProcessor();