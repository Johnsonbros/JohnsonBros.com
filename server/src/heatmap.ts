import { db } from '../db';
import {
  jobLocations,
  checkIns,
  heatMapSnapshots,
  InsertJobLocation,
  InsertCheckIn,
  InsertHeatMapSnapshot
} from '@shared/schema';
import { eq, sql, and, desc, gte } from 'drizzle-orm';
import { Logger } from './logger';

// Privacy offset range (roughly 100-300 meters)
const PRIVACY_OFFSET_LAT = 0.0015; // ~165m at equator
const PRIVACY_OFFSET_LNG = 0.0020; // Slightly more for longitude

export class HeatMapService {
  // Add privacy offset to coordinates
  private addPrivacyOffset(lat: number, lng: number): { displayLat: number; displayLng: number } {
    // Random offset between -OFFSET and +OFFSET
    const latOffset = (Math.random() - 0.5) * 2 * PRIVACY_OFFSET_LAT;
    const lngOffset = (Math.random() - 0.5) * 2 * PRIVACY_OFFSET_LNG;

    return {
      displayLat: lat + latOffset,
      displayLng: lng + lngOffset
    };
  }

  // Calculate intensity based on job date
  private calculateIntensity(jobDate: Date): number {
    const now = new Date();
    const daysDiff = (now.getTime() - jobDate.getTime()) / (1000 * 60 * 60 * 24);

    // Weight recent jobs more heavily
    if (daysDiff <= 7) return 1.0;
    if (daysDiff <= 30) return 0.8;
    if (daysDiff <= 90) return 0.5;
    if (daysDiff <= 180) return 0.3;
    return 0.2;
  }

  // Import historical jobs from Housecall Pro
  async importHistoricalJobs(apiKey: string, startDate: string = '2022-01-01'): Promise<{
    success: boolean;
    imported: number;
    skipped: number;
    error?: string
  }> {
    Logger.info('[HeatMap] Starting historical job import...');

    let imported = 0;
    let skipped = 0;
    let page = 1;
    const pageSize = 100;

    try {
      while (true) {
        // Fetch jobs from Housecall Pro API
        const url = new URL('https://api.housecallpro.com/jobs');
        url.searchParams.append('page', page.toString());
        url.searchParams.append('page_size', pageSize.toString());
        url.searchParams.append('sort_direction', 'desc');
        url.searchParams.append('scheduled_start_min', startDate);

        const response = await fetch(url.toString(), {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const jobs = data.jobs || [];

        if (jobs.length === 0) {
          Logger.info('[HeatMap] No more jobs to import');
          break;
        }

        // Process each job
        for (const job of jobs) {
          try {
            // Check job completion status (API uses 'status' field, webhooks use 'work_status')
            const status = (job.work_status ?? job.status ?? '').toLowerCase() as string;
            // Housecall Pro statuses: "complete rated", "complete unrated", "completed", "paid"
            const isCompleted = status.startsWith('complete') || status === 'paid' || job.completed_on;

            if (!isCompleted) {
              skipped++;
              Logger.debug(`[HeatMap] Skipping job ${job.id}: not completed (status: ${job.status || job.work_status})`);
              continue;
            }

            if (!job.address) {
              skipped++;
              Logger.debug(`[HeatMap] Skipping job ${job.id}: no address`);
              continue;
            }

            // Check if job already exists
            const existing = await db.select()
              .from(jobLocations)
              .where(eq(jobLocations.jobId, job.id))
              .limit(1);

            if (existing.length > 0) {
              skipped++;
              continue;
            }

            // Get coordinates (either from API or geocode address)
            let lat = job.address.latitude;
            let lng = job.address.longitude;

            if (!lat || !lng) {
              // Skip if no coordinates available
              skipped++;
              Logger.debug(`[HeatMap] Skipping job ${job.id}: no coordinates (lat: ${lat}, lng: ${lng})`);
              continue;
            }

            // Add privacy offset
            const { displayLat, displayLng } = this.addPrivacyOffset(lat, lng);

            // Calculate intensity based on job date
            const jobDate = new Date(job.scheduled_end || job.scheduled_start || job.created_at);
            const intensity = this.calculateIntensity(jobDate);

            // Insert job location
            await db.insert(jobLocations).values({
              jobId: job.id,
              customerId: job.customer?.id,
              latitude: lat,
              longitude: lng,
              displayLat,
              displayLng,
              city: job.address.city,
              state: job.address.state,
              serviceType: job.description || 'General Service',
              jobDate,
              source: 'historical',
              intensity,
              isActive: true,
            });

            imported++;

            // Log progress every 50 jobs
            if (imported % 50 === 0) {
              Logger.info(`[HeatMap] Imported ${imported} jobs so far...`);
            }
          } catch (error) {
            Logger.error('[HeatMap] Error processing job:', error as any);
            skipped++;
          }
        }

        // Check if there are more pages
        if (jobs.length < pageSize) {
          break;
        }

        page++;
      }

      Logger.info(`[HeatMap] Import complete: ${imported} imported, ${skipped} skipped`);

      return {
        success: true,
        imported,
        skipped
      };
    } catch (error) {
      Logger.error('[HeatMap] Historical import failed:', error as any);
      return {
        success: false,
        imported,
        skipped,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Process job completion webhook
  async processJobCompletion(job: any): Promise<void> {
    try {
      // Validate job data
      if (!job.address || !job.address.latitude || !job.address.longitude) {
        Logger.warn('[HeatMap] Job missing location data:', job.id);
        return;
      }

      // Check if job already exists
      const existing = await db.select()
        .from(jobLocations)
        .where(eq(jobLocations.jobId, job.id))
        .limit(1);

      if (existing.length > 0) {
        Logger.info('[HeatMap] Job location already exists:', job.id);
        return;
      }

      const lat = job.address.latitude;
      const lng = job.address.longitude;

      // Add privacy offset
      const { displayLat, displayLng } = this.addPrivacyOffset(lat, lng);

      // Job just completed, so full intensity
      const jobDate = new Date(job.scheduled_end || job.scheduled_start || new Date());

      // Insert job location
      const [jobLocation] = await db.insert(jobLocations).values({
        jobId: job.id,
        customerId: job.customer?.id,
        latitude: lat,
        longitude: lng,
        displayLat,
        displayLng,
        city: job.address.city,
        state: job.address.state,
        serviceType: job.description || 'General Service',
        jobDate,
        source: 'webhook',
        intensity: 1.0, // Recent job = full intensity
        isActive: true,
      }).returning();

      // Create check-in entry
      await db.insert(checkIns).values({
        jobId: job.id,
        jobLocationId: jobLocation.id,
        technicianName: job.employee?.name || 'Technician',
        customerName: job.customer ? `${job.customer.first_name} ${job.customer.last_name}`.trim() : 'Customer',
        serviceType: job.description || 'General Service',
        city: job.address.city,
        state: job.address.state,
        status: 'completed',
        checkInTime: jobDate,
        completedAt: jobDate,
        isVisible: true,
      });

      Logger.info(`[HeatMap] Added job location: ${job.id} in ${job.address.city}`);
    } catch (error) {
      Logger.error('[HeatMap] Error processing job completion:', error as any);
      throw error;
    }
  }

  // Get heat map data points for display
  async getHeatMapData(daysBack: number = 730): Promise<Array<{
    lat: number;
    lng: number;
    intensity: number;
  }>> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const locations = await db.select({
      displayLat: jobLocations.displayLat,
      displayLng: jobLocations.displayLng,
      intensity: jobLocations.intensity,
    })
      .from(jobLocations)
      .where(
        and(
          eq(jobLocations.isActive, true),
          gte(jobLocations.jobDate, cutoffDate)
        )
      );

    return locations.map(loc => ({
      lat: loc.displayLat,
      lng: loc.displayLng,
      intensity: loc.intensity,
    }));
  }

  // Get recent check-ins for activity feed
  async getRecentCheckIns(limit: number = 20): Promise<any[]> {
    const checkInsData = await db.select()
      .from(checkIns)
      .where(eq(checkIns.isVisible, true))
      .orderBy(desc(checkIns.checkInTime))
      .limit(limit);

    return checkInsData;
  }

  // Update job intensities based on age
  async updateIntensities(): Promise<void> {
    Logger.info('[HeatMap] Updating job intensities...');

    const jobs = await db.select()
      .from(jobLocations)
      .where(eq(jobLocations.isActive, true));

    for (const job of jobs) {
      const newIntensity = this.calculateIntensity(job.jobDate);

      if (Math.abs(newIntensity - job.intensity) > 0.05) {
        await db.update(jobLocations)
          .set({ intensity: newIntensity })
          .where(eq(jobLocations.id, job.id));
      }
    }

    Logger.info('[HeatMap] Intensity update complete');
  }

  // Generate and save heat map snapshot
  async generateSnapshot(imageUrl: string, imageData?: string): Promise<void> {
    try {
      // Deactivate all previous snapshots
      await db.update(heatMapSnapshots)
        .set({ isActive: false })
        .where(eq(heatMapSnapshots.isActive, true));

      // Get data point count
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(jobLocations)
        .where(eq(jobLocations.isActive, true));

      const dataPointCount = Number(result[0]?.count || 0);

      // Create new snapshot
      await db.insert(heatMapSnapshots).values({
        snapshotDate: new Date(),
        imageUrl,
        imageData,
        dataPointCount,
        isActive: true,
        metadata: JSON.stringify({
          generatedAt: new Date().toISOString(),
          dataPoints: dataPointCount,
        }),
      });

      Logger.info(`[HeatMap] Snapshot saved: ${imageUrl} (${dataPointCount} data points)`);
    } catch (error) {
      Logger.error('[HeatMap] Error saving snapshot:', error as any);
      throw error;
    }
  }

  // Get active snapshot for public display
  async getActiveSnapshot(): Promise<any | null> {
    const snapshots = await db.select()
      .from(heatMapSnapshots)
      .where(eq(heatMapSnapshots.isActive, true))
      .orderBy(desc(heatMapSnapshots.generatedAt))
      .limit(1);

    return snapshots[0] || null;
  }

  // Get heat map statistics
  async getStatistics(): Promise<{
    totalJobs: number;
    jobsLast30Days: number;
    citiesCovered: number;
    activeDataPoints: number;
  }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalResult] = await db.select({ count: sql<number>`count(*)` })
      .from(jobLocations)
      .where(eq(jobLocations.isActive, true));

    const [recentResult] = await db.select({ count: sql<number>`count(*)` })
      .from(jobLocations)
      .where(
        and(
          eq(jobLocations.isActive, true),
          gte(jobLocations.jobDate, thirtyDaysAgo)
        )
      );

    const [citiesResult] = await db.select({ count: sql<number>`count(distinct city)` })
      .from(jobLocations)
      .where(eq(jobLocations.isActive, true));

    return {
      totalJobs: Number(totalResult?.count || 0),
      jobsLast30Days: Number(recentResult?.count || 0),
      citiesCovered: Number(citiesResult?.count || 0),
      activeDataPoints: Number(totalResult?.count || 0),
    };
  }
}

export const heatMapService = new HeatMapService();
