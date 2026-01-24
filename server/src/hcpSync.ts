/**
 * HousecallPro Data Sync Service
 *
 * Syncs HCP data to local database for:
 * - Reduced API calls
 * - Faster dashboard loads
 * - Historical analytics
 */

import { db } from '../db';
import {
  hcpJobs, hcpEstimates, hcpSyncLog, hcpDailyStats,
  InsertHcpJob, InsertHcpEstimate
} from '@shared/schema';
import { eq, gte, lte, and, sql } from 'drizzle-orm';
import { HousecallProClient } from './housecall';
import { Logger } from './logger';

const logger = {
  info: (msg: string, meta?: any) => Logger.info(`[hcp-sync] ${msg}`, meta),
  warn: (msg: string, meta?: any) => Logger.warn(`[hcp-sync] ${msg}`, meta),
  error: (msg: string, meta?: any) => Logger.error(`[hcp-sync] ${msg}`, meta),
  debug: (msg: string, meta?: any) => Logger.debug(`[hcp-sync] ${msg}`, meta),
};

// HCP API response types (different from our DB schema)
interface HCPApiJob {
  id: string;
  customer?: {
    id?: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    mobile_number?: string;
    phone?: string;
    email?: string;
  };
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  name?: string;
  description?: string;
  invoice_number?: string;
  work_status?: string;
  total_amount?: number;
  outstanding_balance?: number;
  scheduled_start?: string;
  scheduled_end?: string;
  completed_at?: string;
  assigned_employees?: Array<{ id: string; first_name: string; last_name: string }>;
  tags?: string[];
  source?: string;
  created_at?: string;
  updated_at?: string;
  line_items?: Array<{ name?: string }>;
}

interface HCPApiEstimate {
  id: string;
  customer?: {
    id?: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    mobile_number?: string;
    phone?: string;
    email?: string;
  };
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  name?: string;
  estimate_number?: string;
  status?: string;
  total_amount?: number;
  scheduled_start?: string;
  sent_at?: string;
  viewed_at?: string;
  responded_at?: string;
  expires_at?: string;
  converted_to_job_id?: string;
  converted_at?: string;
  created_at?: string;
  updated_at?: string;
}

interface SyncResult {
  syncType: string;
  status: 'completed' | 'failed';
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  durationMs: number;
  error?: string;
}

export class HCPSyncService {
  private static instance: HCPSyncService;
  private hcpClient: HousecallProClient;
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.hcpClient = HousecallProClient.getInstance();
  }

  static getInstance(): HCPSyncService {
    if (!this.instance) {
      this.instance = new HCPSyncService();
    }
    return this.instance;
  }

  /**
   * Start periodic sync (every 5 minutes)
   */
  startPeriodicSync(intervalMs = 5 * 60 * 1000): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    logger.info('Starting periodic HCP sync', { intervalMs });

    // Initial sync
    this.syncAll().catch(err => logger.error('Initial sync failed', { error: err.message }));

    // Periodic sync
    this.syncInterval = setInterval(() => {
      this.syncAll().catch(err => logger.error('Periodic sync failed', { error: err.message }));
    }, intervalMs);
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      logger.info('Stopped periodic HCP sync');
    }
  }

  /**
   * Sync all data (jobs, estimates, daily stats)
   */
  async syncAll(): Promise<SyncResult[]> {
    if (this.isSyncing) {
      logger.warn('Sync already in progress, skipping');
      return [];
    }

    this.isSyncing = true;
    const results: SyncResult[] = [];

    try {
      // Sync jobs for last 30 days
      const jobsResult = await this.syncJobs(30);
      results.push(jobsResult);

      // Sync estimates for last 30 days
      const estimatesResult = await this.syncEstimates(30);
      results.push(estimatesResult);

      // Update daily stats
      const statsResult = await this.syncDailyStats(30);
      results.push(statsResult);

      logger.info('Full sync completed', { results });
    } finally {
      this.isSyncing = false;
    }

    return results;
  }

  /**
   * Sync jobs from HCP
   */
  async syncJobs(daysBack = 30): Promise<SyncResult> {
    const startTime = Date.now();
    let recordsProcessed = 0;
    let recordsCreated = 0;
    let recordsUpdated = 0;

    // Log sync start
    const [syncLog] = await db.insert(hcpSyncLog).values({
      syncType: 'jobs',
      status: 'started',
    }).returning();

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      // Fetch jobs from HCP
      const jobsRaw = await this.hcpClient.getJobs({
        scheduled_start_min: startDate.toISOString(),
        scheduled_start_max: endDate.toISOString(),
      });
      const jobs = jobsRaw as unknown as HCPApiJob[];

      recordsProcessed = jobs.length;

      // Upsert each job
      for (const job of jobs) {
        const jobData: InsertHcpJob = {
          hcpJobId: job.id,
          customerId: job.customer?.id || null,
          customerName: job.customer?.name || `${job.customer?.first_name || ''} ${job.customer?.last_name || ''}`.trim() || null,
          customerPhone: job.customer?.mobile_number || job.customer?.phone || null,
          customerEmail: job.customer?.email || null,
          addressStreet: job.address?.street || null,
          addressCity: job.address?.city || null,
          addressState: job.address?.state || null,
          addressZip: job.address?.zip || null,
          jobName: job.name || job.line_items?.[0]?.name || null,
          jobDescription: job.description || null,
          invoiceNumber: job.invoice_number || null,
          workStatus: job.work_status || 'scheduled',
          totalAmount: Math.round((job.total_amount || 0) * 100), // Convert to cents
          outstandingBalance: Math.round((job.outstanding_balance || 0) * 100),
          scheduledStart: job.scheduled_start ? new Date(job.scheduled_start) : null,
          scheduledEnd: job.scheduled_end ? new Date(job.scheduled_end) : null,
          completedAt: job.completed_at ? new Date(job.completed_at) : null,
          assignedTechIds: job.assigned_employees?.map(e => e.id) || [],
          assignedTechNames: job.assigned_employees?.map(e => `${e.first_name} ${e.last_name}`) || [],
          tags: job.tags || [],
          isEmergency: job.tags?.some(t =>
            t.toLowerCase().includes('emergency') || t.toLowerCase().includes('urgent')
          ) || job.description?.toLowerCase().includes('emergency') || false,
          source: job.source || null,
          hcpCreatedAt: job.created_at ? new Date(job.created_at) : null,
          hcpUpdatedAt: job.updated_at ? new Date(job.updated_at) : null,
          rawData: job as Record<string, any>,
        };

        // Upsert
        const existing = await db.query.hcpJobs.findFirst({
          where: eq(hcpJobs.hcpJobId, job.id),
        });

        if (existing) {
          await db.update(hcpJobs)
            .set({
              ...jobData,
              syncedAt: new Date(),
              tags: jobData.tags as string[],
              assignedTechIds: jobData.assignedTechIds as string[],
              assignedTechNames: jobData.assignedTechNames as string[],
            })
            .where(eq(hcpJobs.hcpJobId, job.id));
          recordsUpdated++;
        } else {
          await db.insert(hcpJobs).values({
            ...jobData,
            tags: jobData.tags as string[],
            assignedTechIds: jobData.assignedTechIds as string[],
            assignedTechNames: jobData.assignedTechNames as string[],
          });
          recordsCreated++;
        }
      }

      const durationMs = Date.now() - startTime;

      // Update sync log
      await db.update(hcpSyncLog)
        .set({
          status: 'completed',
          recordsProcessed,
          recordsCreated,
          recordsUpdated,
          durationMs,
          completedAt: new Date(),
        })
        .where(eq(hcpSyncLog.id, syncLog.id));

      logger.info('Jobs sync completed', { recordsProcessed, recordsCreated, recordsUpdated, durationMs });

      return {
        syncType: 'jobs',
        status: 'completed',
        recordsProcessed,
        recordsCreated,
        recordsUpdated,
        durationMs,
      };
    } catch (error: any) {
      const durationMs = Date.now() - startTime;

      await db.update(hcpSyncLog)
        .set({
          status: 'failed',
          errorMessage: error.message,
          durationMs,
          completedAt: new Date(),
        })
        .where(eq(hcpSyncLog.id, syncLog.id));

      logger.error('Jobs sync failed', { error: error.message });

      return {
        syncType: 'jobs',
        status: 'failed',
        recordsProcessed,
        recordsCreated,
        recordsUpdated,
        durationMs,
        error: error.message,
      };
    }
  }

  /**
   * Sync estimates from HCP
   */
  async syncEstimates(daysBack = 30): Promise<SyncResult> {
    const startTime = Date.now();
    let recordsProcessed = 0;
    let recordsCreated = 0;
    let recordsUpdated = 0;

    const [syncLog] = await db.insert(hcpSyncLog).values({
      syncType: 'estimates',
      status: 'started',
    }).returning();

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const estimatesRaw = await this.hcpClient.getEstimates({
        scheduled_start_min: startDate.toISOString(),
        scheduled_start_max: endDate.toISOString(),
      });
      const estimates = estimatesRaw as unknown as HCPApiEstimate[];

      recordsProcessed = estimates.length;

      for (const estimate of estimates) {
        const estimateData: InsertHcpEstimate = {
          hcpEstimateId: estimate.id,
          customerId: estimate.customer?.id || null,
          customerName: estimate.customer?.name || `${estimate.customer?.first_name || ''} ${estimate.customer?.last_name || ''}`.trim() || null,
          customerPhone: estimate.customer?.mobile_number || estimate.customer?.phone || null,
          customerEmail: estimate.customer?.email || null,
          addressStreet: estimate.address?.street || null,
          addressCity: estimate.address?.city || null,
          addressState: estimate.address?.state || null,
          addressZip: estimate.address?.zip || null,
          estimateName: estimate.name || null,
          estimateNumber: estimate.estimate_number || null,
          status: estimate.status || 'draft',
          totalAmount: Math.round((estimate.total_amount || 0) * 100),
          scheduledStart: estimate.scheduled_start ? new Date(estimate.scheduled_start) : null,
          sentAt: estimate.sent_at ? new Date(estimate.sent_at) : null,
          viewedAt: estimate.viewed_at ? new Date(estimate.viewed_at) : null,
          respondedAt: estimate.responded_at ? new Date(estimate.responded_at) : null,
          expiresAt: estimate.expires_at ? new Date(estimate.expires_at) : null,
          convertedToJobId: estimate.converted_to_job_id || null,
          convertedAt: estimate.converted_at ? new Date(estimate.converted_at) : null,
          hcpCreatedAt: estimate.created_at ? new Date(estimate.created_at) : null,
          hcpUpdatedAt: estimate.updated_at ? new Date(estimate.updated_at) : null,
          rawData: estimate as Record<string, any>,
        };

        const existing = await db.query.hcpEstimates.findFirst({
          where: eq(hcpEstimates.hcpEstimateId, estimate.id),
        });

        if (existing) {
          await db.update(hcpEstimates)
            .set({ ...estimateData, syncedAt: new Date() })
            .where(eq(hcpEstimates.hcpEstimateId, estimate.id));
          recordsUpdated++;
        } else {
          await db.insert(hcpEstimates).values(estimateData);
          recordsCreated++;
        }
      }

      const durationMs = Date.now() - startTime;

      await db.update(hcpSyncLog)
        .set({
          status: 'completed',
          recordsProcessed,
          recordsCreated,
          recordsUpdated,
          durationMs,
          completedAt: new Date(),
        })
        .where(eq(hcpSyncLog.id, syncLog.id));

      logger.info('Estimates sync completed', { recordsProcessed, recordsCreated, recordsUpdated, durationMs });

      return {
        syncType: 'estimates',
        status: 'completed',
        recordsProcessed,
        recordsCreated,
        recordsUpdated,
        durationMs,
      };
    } catch (error: any) {
      const durationMs = Date.now() - startTime;

      await db.update(hcpSyncLog)
        .set({
          status: 'failed',
          errorMessage: error.message,
          durationMs,
          completedAt: new Date(),
        })
        .where(eq(hcpSyncLog.id, syncLog.id));

      logger.error('Estimates sync failed', { error: error.message });

      return {
        syncType: 'estimates',
        status: 'failed',
        recordsProcessed,
        recordsCreated,
        recordsUpdated,
        durationMs,
        error: error.message,
      };
    }
  }

  /**
   * Calculate and store daily stats from cached data
   */
  async syncDailyStats(daysBack = 30): Promise<SyncResult> {
    const startTime = Date.now();
    let recordsProcessed = 0;
    let recordsCreated = 0;
    let recordsUpdated = 0;

    const [syncLog] = await db.insert(hcpSyncLog).values({
      syncType: 'daily_stats',
      status: 'started',
    }).returning();

    try {
      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);
      startDate.setHours(0, 0, 0, 0);

      // Process each day
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dayStart = new Date(currentDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(23, 59, 59, 999);

        // Get jobs for this day
        const dayJobs = await db.query.hcpJobs.findMany({
          where: and(
            gte(hcpJobs.scheduledStart, dayStart),
            lte(hcpJobs.scheduledStart, dayEnd)
          ),
        });

        // Get estimates for this day
        const dayEstimates = await db.query.hcpEstimates.findMany({
          where: and(
            gte(hcpEstimates.scheduledStart, dayStart),
            lte(hcpEstimates.scheduledStart, dayEnd)
          ),
        });

        // Calculate metrics
        const jobsScheduled = dayJobs.filter(j => j.workStatus === 'scheduled').length;
        const jobsCompleted = dayJobs.filter(j => j.workStatus === 'completed').length;
        const jobsCancelled = dayJobs.filter(j => j.workStatus === 'cancelled').length;
        const jobsInProgress = dayJobs.filter(j => j.workStatus === 'in_progress').length;

        const revenueCompleted = dayJobs
          .filter(j => j.workStatus === 'completed')
          .reduce((sum, j) => sum + (j.totalAmount || 0), 0);
        const revenueScheduled = dayJobs
          .filter(j => j.workStatus === 'scheduled' || j.workStatus === 'in_progress')
          .reduce((sum, j) => sum + (j.totalAmount || 0), 0);

        const completedJobs = dayJobs.filter(j => j.workStatus === 'completed');
        const averageJobValue = completedJobs.length > 0
          ? Math.round(revenueCompleted / completedJobs.length)
          : 0;

        const estimatesSent = dayEstimates.filter(e => e.status === 'sent' || e.sentAt).length;
        const estimatesAccepted = dayEstimates.filter(e => e.status === 'accepted').length;
        const estimatesDeclined = dayEstimates.filter(e => e.status === 'declined').length;
        const estimateConversionRate = estimatesSent > 0
          ? estimatesAccepted / estimatesSent
          : 0;
        const estimatesValue = dayEstimates.reduce((sum, e) => sum + (e.totalAmount || 0), 0);

        const emergencyJobs = dayJobs.filter(j => j.isEmergency).length;

        // Upsert daily stats
        const statsData = {
          date: dayStart,
          jobsScheduled,
          jobsCompleted,
          jobsCancelled,
          jobsInProgress,
          revenueCompleted,
          revenueScheduled,
          averageJobValue,
          estimatesSent,
          estimatesAccepted,
          estimatesDeclined,
          estimateConversionRate,
          estimatesValue,
          emergencyJobs,
        };

        const existing = await db.query.hcpDailyStats.findFirst({
          where: eq(hcpDailyStats.date, dayStart),
        });

        if (existing) {
          await db.update(hcpDailyStats)
            .set({ ...statsData, syncedAt: new Date() })
            .where(eq(hcpDailyStats.id, existing.id));
          recordsUpdated++;
        } else {
          await db.insert(hcpDailyStats).values(statsData);
          recordsCreated++;
        }

        recordsProcessed++;
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const durationMs = Date.now() - startTime;

      await db.update(hcpSyncLog)
        .set({
          status: 'completed',
          recordsProcessed,
          recordsCreated,
          recordsUpdated,
          durationMs,
          completedAt: new Date(),
        })
        .where(eq(hcpSyncLog.id, syncLog.id));

      logger.info('Daily stats sync completed', { recordsProcessed, recordsCreated, recordsUpdated, durationMs });

      return {
        syncType: 'daily_stats',
        status: 'completed',
        recordsProcessed,
        recordsCreated,
        recordsUpdated,
        durationMs,
      };
    } catch (error: any) {
      const durationMs = Date.now() - startTime;

      await db.update(hcpSyncLog)
        .set({
          status: 'failed',
          errorMessage: error.message,
          durationMs,
          completedAt: new Date(),
        })
        .where(eq(hcpSyncLog.id, syncLog.id));

      logger.error('Daily stats sync failed', { error: error.message });

      return {
        syncType: 'daily_stats',
        status: 'failed',
        recordsProcessed,
        recordsCreated,
        recordsUpdated,
        durationMs,
        error: error.message,
      };
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<{
    lastSync: any;
    recentSyncs: any[];
    jobsCount: number;
    estimatesCount: number;
  }> {
    const recentSyncs = await db.query.hcpSyncLog.findMany({
      orderBy: (log, { desc }) => [desc(log.startedAt)],
      limit: 10,
    });

    const jobsCount = await db.select({ count: sql<number>`count(*)` })
      .from(hcpJobs)
      .then(r => r[0]?.count || 0);

    const estimatesCount = await db.select({ count: sql<number>`count(*)` })
      .from(hcpEstimates)
      .then(r => r[0]?.count || 0);

    return {
      lastSync: recentSyncs[0] || null,
      recentSyncs,
      jobsCount,
      estimatesCount,
    };
  }
}

// Export singleton getter
export function getHCPSyncService(): HCPSyncService {
  return HCPSyncService.getInstance();
}
