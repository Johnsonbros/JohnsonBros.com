import * as cron from 'node-cron';
import type { ScheduledTask } from 'node-cron';
import { db } from '../../db';
import { gmbPosts, gmbReviews, InsertGmbReview } from '@shared/schema';
import { getGmbClient } from './gmbClient';
import { reviewResponseService } from './reviewResponseService';
import { Logger, getErrorMessage } from '../logger';
import { eq, and, lte, isNull } from 'drizzle-orm';

// Track scheduler state
let isSchedulerRunning = false;
let reviewSyncTask: ScheduledTask | null = null;
let postPublishTask: ScheduledTask | null = null;
let autoResponseTask: ScheduledTask | null = null;

/**
 * Sync reviews from Google My Business
 */
export async function syncReviews(): Promise<{ synced: number; newReviews: number }> {
  Logger.info('[GMB Sync] Starting review sync');

  try {
    const gmbClient = getGmbClient();
    const googleReviews = await gmbClient.getReviews(100);

    let synced = 0;
    let newReviews = 0;

    for (const review of googleReviews) {
      const starRating = gmbClient.starRatingToNumber(review.starRating);

      // Check if review exists
      const [existing] = await db
        .select()
        .from(gmbReviews)
        .where(eq(gmbReviews.googleReviewId, review.reviewId))
        .limit(1);

      if (existing) {
        // Update if reply changed
        if (review.reviewReply && !existing.responseText) {
          await db
            .update(gmbReviews)
            .set({
              responseText: review.reviewReply.comment,
              responseCreatedAt: new Date(review.reviewReply.updateTime),
              needsResponse: false,
              updatedAt: new Date(),
            })
            .where(eq(gmbReviews.id, existing.id));
        }
        synced++;
      } else {
        // Analyze new review
        const analysis = await reviewResponseService.analyzeReview(
          review.comment || '',
          starRating
        );

        // Insert new review
        const reviewData: InsertGmbReview = {
          googleReviewId: review.reviewId,
          reviewerName: review.reviewer.displayName,
          reviewerPhotoUrl: review.reviewer.profilePhotoUrl,
          starRating,
          comment: review.comment,
          reviewCreatedAt: new Date(review.createTime),
          needsResponse: !review.reviewReply,
          sentiment: analysis.sentiment,
          topics: analysis.topics,
        };

        await db.insert(gmbReviews).values(reviewData);
        newReviews++;
        synced++;

        Logger.info('[GMB Sync] New review detected', {
          starRating,
          sentiment: analysis.sentiment,
        });
      }
    }

    Logger.info('[GMB Sync] Review sync completed', { synced, newReviews });
    return { synced, newReviews };
  } catch (error) {
    Logger.error('[GMB Sync] Review sync failed', { error: getErrorMessage(error) });
    throw error;
  }
}

/**
 * Publish scheduled posts
 */
export async function publishScheduledPosts(): Promise<{ published: number; failed: number }> {
  Logger.info('[GMB Scheduler] Checking for scheduled posts');

  try {
    const now = new Date();

    // Find posts scheduled for now or earlier
    const scheduledPosts = await db
      .select()
      .from(gmbPosts)
      .where(
        and(
          eq(gmbPosts.status, 'scheduled'),
          lte(gmbPosts.scheduledFor, now)
        )
      );

    let published = 0;
    let failed = 0;

    const gmbClient = getGmbClient();

    for (const post of scheduledPosts) {
      try {
        // Upload image if present
        let mediaItems: any[] = [];
        if (post.imageUrl) {
          const mediaResult = await gmbClient.uploadMedia(post.imageUrl);
          if (mediaResult) {
            mediaItems = [{
              mediaFormat: 'PHOTO',
              sourceUrl: mediaResult.googleUrl,
            }];
          }
        }

        // Create the post
        const result = await gmbClient.createPost({
          summary: post.content,
          callToAction: post.callToAction ? {
            actionType: post.callToAction as any,
            url: post.ctaUrl || undefined,
          } : undefined,
          media: mediaItems.length > 0 ? mediaItems : undefined,
          topicType: post.type === 'offer' ? 'OFFER' : post.type === 'event' ? 'EVENT' : 'STANDARD',
        });

        if (result.success) {
          await db
            .update(gmbPosts)
            .set({
              status: 'published',
              googlePostId: result.postId,
              publishedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(gmbPosts.id, post.id));

          published++;
          Logger.info('[GMB Scheduler] Published scheduled post', { postId: post.id });
        } else {
          await db
            .update(gmbPosts)
            .set({
              status: 'failed',
              errorMessage: result.error,
              updatedAt: new Date(),
            })
            .where(eq(gmbPosts.id, post.id));

          failed++;
          Logger.error('[GMB Scheduler] Failed to publish post', {
            postId: post.id,
            error: result.error,
          });
        }
      } catch (error) {
        failed++;
        await db
          .update(gmbPosts)
          .set({
            status: 'failed',
            errorMessage: getErrorMessage(error),
            updatedAt: new Date(),
          })
          .where(eq(gmbPosts.id, post.id));

        Logger.error('[GMB Scheduler] Error publishing post', {
          postId: post.id,
          error: getErrorMessage(error),
        });
      }
    }

    if (published > 0 || failed > 0) {
      Logger.info('[GMB Scheduler] Scheduled posts processed', { published, failed });
    }

    return { published, failed };
  } catch (error) {
    Logger.error('[GMB Scheduler] Publish scheduled posts failed', { error: getErrorMessage(error) });
    throw error;
  }
}

/**
 * Auto-respond to reviews (positive reviews only by default)
 */
export async function processAutoResponses(): Promise<{ processed: number; responded: number }> {
  Logger.info('[GMB AutoResponse] Processing reviews for auto-response');

  try {
    // Get reviews needing response (only 4-5 star reviews for auto-response)
    const reviews = await db
      .select()
      .from(gmbReviews)
      .where(
        and(
          eq(gmbReviews.needsResponse, true),
          isNull(gmbReviews.responseText)
        )
      )
      .limit(5); // Process in small batches

    const results = await reviewResponseService.processReviewsForAutoResponse(reviews);

    // For reviews that were auto-responded, post to Google
    if (results.autoResponded > 0) {
      const gmbClient = getGmbClient();

      const autoRespondedReviews = await db
        .select()
        .from(gmbReviews)
        .where(eq(gmbReviews.autoResponded, true))
        .limit(5);

      for (const review of autoRespondedReviews) {
        if (review.responseText) {
          const success = await gmbClient.replyToReview(
            review.googleReviewId,
            review.responseText
          );

          if (success) {
            await db
              .update(gmbReviews)
              .set({
                responseCreatedAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(gmbReviews.id, review.id));

            Logger.info('[GMB AutoResponse] Posted auto-response to Google', {
              reviewId: review.id,
            });
          }
        }
      }
    }

    Logger.info('[GMB AutoResponse] Processing completed', {
      processed: results.processed,
      responded: results.autoResponded,
    });

    return {
      processed: results.processed,
      responded: results.autoResponded,
    };
  } catch (error) {
    Logger.error('[GMB AutoResponse] Processing failed', { error: getErrorMessage(error) });
    throw error;
  }
}

/**
 * Start all GMB schedulers
 */
export function startGmbSchedulers(): void {
  if (isSchedulerRunning) {
    Logger.warn('[GMB Scheduler] Schedulers already running');
    return;
  }

  // Sync reviews every 2 hours
  reviewSyncTask = cron.schedule('0 0,2,4,6,8,10,12,14,16,18,20,22 * * *', async () => {
    try {
      await syncReviews();
    } catch (error) {
      Logger.error('[GMB Scheduler] Review sync job failed', { error: getErrorMessage(error) });
    }
  });

  // Check for scheduled posts every 15 minutes
  reviewSyncTask = cron.schedule('*/15 * * * *', async () => {
    try {
      await publishScheduledPosts();
    } catch (error) {
      Logger.error('[GMB Scheduler] Post publish job failed', { error: getErrorMessage(error) });
    }
  });

  // Auto-respond to reviews every 4 hours
  autoResponseTask = cron.schedule('0 1,5,9,13,17,21 * * *', async () => {
    try {
      await processAutoResponses();
    } catch (error) {
      Logger.error('[GMB Scheduler] Auto-response job failed', { error: getErrorMessage(error) });
    }
  });

  isSchedulerRunning = true;
  Logger.info('[GMB Scheduler] All schedulers started');
}

/**
 * Stop all GMB schedulers
 */
export function stopGmbSchedulers(): void {
  if (reviewSyncTask) {
    reviewSyncTask.stop();
    reviewSyncTask = null;
  }
  if (postPublishTask) {
    postPublishTask.stop();
    postPublishTask = null;
  }
  if (autoResponseTask) {
    autoResponseTask.stop();
    autoResponseTask = null;
  }

  isSchedulerRunning = false;
  Logger.info('[GMB Scheduler] All schedulers stopped');
}

/**
 * Check if schedulers are running
 */
export function isGmbSchedulerRunning(): boolean {
  return isSchedulerRunning;
}
