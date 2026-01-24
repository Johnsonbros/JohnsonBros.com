import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import {
  gmbPosts, gmbReviews, gmbResponseTemplates, gmbJobPhotos,
  InsertGmbPost, InsertGmbReview, InsertGmbResponseTemplate, InsertGmbJobPhoto,
} from '@shared/schema';
import { eq, desc, and, gte, lte, sql, asc, isNull } from 'drizzle-orm';
import { getGmbClient } from './gmb/gmbClient';
import { reviewResponseService } from './gmb/reviewResponseService';
import { Logger, getErrorMessage } from './logger';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiter
const gmbRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later' },
});

router.use(gmbRateLimiter);

// Validation schemas
const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

const createPostSchema = z.object({
  type: z.enum(['update', 'offer', 'event', 'job_photo']),
  title: z.string().optional(),
  content: z.string().min(1).max(1500),
  callToAction: z.enum(['BOOK', 'ORDER', 'SHOP', 'LEARN_MORE', 'SIGN_UP', 'CALL']).optional(),
  ctaUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  scheduledFor: z.string().datetime().optional(),
  jobId: z.string().optional(),
});

const reviewResponseSchema = z.object({
  responseText: z.string().min(1).max(4096),
});

const generateResponseSchema = z.object({
  count: z.number().min(1).max(5).default(3),
});

const templateSchema = z.object({
  name: z.string().min(1).max(100),
  starRating: z.number().min(0).max(5).optional(), // 0 = any rating
  sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
  template: z.string().min(1).max(2000),
  isActive: z.boolean().default(true),
});

const jobPhotoSchema = z.object({
  jobId: z.string().min(1),
  customerId: z.string().optional(),
  photoUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  caption: z.string().max(500).optional(),
  category: z.enum(['before', 'after', 'during', 'team']).optional(),
});

const approvePhotoSchema = z.object({
  createPost: z.boolean().default(false),
  postContent: z.string().max(1500).optional(),
});

// ============================================
// LOCATION & OVERVIEW
// ============================================

router.get('/overview', async (req, res) => {
  try {
    const gmbClient = getGmbClient();

    // Get location info
    const location = await gmbClient.getLocation();

    // Get counts from database
    const [postsCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(gmbPosts)
      .where(eq(gmbPosts.status, 'published'));

    const [pendingReviewsCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(gmbReviews)
      .where(eq(gmbReviews.needsResponse, true));

    const [pendingPhotosCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(gmbJobPhotos)
      .where(eq(gmbJobPhotos.approved, false));

    // Get average rating
    const [avgRating] = await db
      .select({ avg: sql<number>`avg(star_rating)::float` })
      .from(gmbReviews);

    // Get total reviews
    const [totalReviews] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(gmbReviews);

    res.json({
      success: true,
      data: {
        location,
        isConfigured: gmbClient.isConfiguredForApi(),
        stats: {
          publishedPosts: postsCount?.count || 0,
          pendingReviews: pendingReviewsCount?.count || 0,
          pendingPhotos: pendingPhotosCount?.count || 0,
          averageRating: avgRating?.avg ? parseFloat(avgRating.avg.toFixed(1)) : 0,
          totalReviews: totalReviews?.count || 0,
        },
      },
    });
  } catch (error) {
    Logger.error('Failed to fetch GMB overview', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch GMB overview',
    });
  }
});

// ============================================
// POSTS
// ============================================

router.get('/posts', async (req, res) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const status = req.query.status as string | undefined;
    const offset = (page - 1) * limit;

    const conditions = status ? eq(gmbPosts.status, status) : undefined;

    const [totalResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(gmbPosts)
      .where(conditions);

    const posts = await db
      .select()
      .from(gmbPosts)
      .where(conditions)
      .orderBy(desc(gmbPosts.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          total: totalResult?.count || 0,
          totalPages: Math.ceil((totalResult?.count || 0) / limit),
        },
      },
    });
  } catch (error) {
    Logger.error('Failed to fetch GMB posts', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch GMB posts',
    });
  }
});

router.post('/posts', async (req, res) => {
  try {
    const data = createPostSchema.parse(req.body);

    const postData: InsertGmbPost = {
      type: data.type,
      title: data.title,
      content: data.content,
      callToAction: data.callToAction,
      ctaUrl: data.ctaUrl,
      imageUrl: data.imageUrl,
      scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
      status: data.scheduledFor ? 'scheduled' : 'draft',
      jobId: data.jobId,
    };

    const [post] = await db.insert(gmbPosts).values(postData).returning();

    Logger.info('Created GMB post', { postId: post.id, type: data.type });

    res.json({
      success: true,
      data: post,
    });
  } catch (error) {
    Logger.error('Failed to create GMB post', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to create GMB post',
    });
  }
});

router.post('/posts/:id/publish', async (req, res) => {
  try {
    const { id } = req.params;

    // Get the post
    const [post] = await db
      .select()
      .from(gmbPosts)
      .where(eq(gmbPosts.id, id))
      .limit(1);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    if (post.status === 'published') {
      return res.status(400).json({
        success: false,
        error: 'Post already published',
      });
    }

    const gmbClient = getGmbClient();

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

    // Create the post on GMB
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
        .where(eq(gmbPosts.id, id));

      Logger.info('Published GMB post', { postId: id, googlePostId: result.postId });

      res.json({
        success: true,
        data: { postId: id, googlePostId: result.postId },
      });
    } else {
      await db
        .update(gmbPosts)
        .set({
          status: 'failed',
          errorMessage: result.error,
          updatedAt: new Date(),
        })
        .where(eq(gmbPosts.id, id));

      res.status(500).json({
        success: false,
        error: result.error || 'Failed to publish post',
      });
    }
  } catch (error) {
    Logger.error('Failed to publish GMB post', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to publish GMB post',
    });
  }
});

router.delete('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [post] = await db
      .select()
      .from(gmbPosts)
      .where(eq(gmbPosts.id, id))
      .limit(1);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    // Delete from Google if published
    if (post.googlePostId) {
      const gmbClient = getGmbClient();
      await gmbClient.deletePost(post.googlePostId);
    }

    await db.delete(gmbPosts).where(eq(gmbPosts.id, id));

    Logger.info('Deleted GMB post', { postId: id });

    res.json({
      success: true,
      message: 'Post deleted',
    });
  } catch (error) {
    Logger.error('Failed to delete GMB post', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to delete GMB post',
    });
  }
});

// ============================================
// REVIEWS
// ============================================

router.get('/reviews', async (req, res) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const needsResponse = req.query.needsResponse === 'true';
    const offset = (page - 1) * limit;

    const conditions = needsResponse ? eq(gmbReviews.needsResponse, true) : undefined;

    const [totalResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(gmbReviews)
      .where(conditions);

    const reviews = await db
      .select()
      .from(gmbReviews)
      .where(conditions)
      .orderBy(desc(gmbReviews.reviewCreatedAt))
      .limit(limit)
      .offset(offset);

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page,
          limit,
          total: totalResult?.count || 0,
          totalPages: Math.ceil((totalResult?.count || 0) / limit),
        },
      },
    });
  } catch (error) {
    Logger.error('Failed to fetch GMB reviews', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch GMB reviews',
    });
  }
});

router.post('/reviews/sync', async (req, res) => {
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
        // Update existing review
        await db
          .update(gmbReviews)
          .set({
            responseText: review.reviewReply?.comment || null,
            responseCreatedAt: review.reviewReply?.updateTime
              ? new Date(review.reviewReply.updateTime)
              : null,
            needsResponse: !review.reviewReply,
            updatedAt: new Date(),
          })
          .where(eq(gmbReviews.id, existing.id));
        synced++;
      } else {
        // Analyze sentiment for new review
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
      }
    }

    Logger.info('Synced GMB reviews', { synced, newReviews });

    res.json({
      success: true,
      data: {
        synced,
        newReviews,
        total: googleReviews.length,
      },
    });
  } catch (error) {
    Logger.error('Failed to sync GMB reviews', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to sync GMB reviews',
    });
  }
});

router.post('/reviews/:id/generate-response', async (req, res) => {
  try {
    const { id } = req.params;
    const { count } = generateResponseSchema.parse(req.body);

    const [review] = await db
      .select()
      .from(gmbReviews)
      .where(eq(gmbReviews.id, id))
      .limit(1);

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found',
      });
    }

    const responses = await reviewResponseService.generateResponseOptions(
      review.reviewerName,
      review.comment || '',
      review.starRating,
      count
    );

    res.json({
      success: true,
      data: {
        reviewId: id,
        options: responses,
      },
    });
  } catch (error) {
    Logger.error('Failed to generate response options', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to generate response options',
    });
  }
});

router.post('/reviews/:id/respond', async (req, res) => {
  try {
    const { id } = req.params;
    const { responseText } = reviewResponseSchema.parse(req.body);

    const [review] = await db
      .select()
      .from(gmbReviews)
      .where(eq(gmbReviews.id, id))
      .limit(1);

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found',
      });
    }

    // Post reply to Google
    const gmbClient = getGmbClient();
    const success = await gmbClient.replyToReview(review.googleReviewId, responseText);

    if (success) {
      await db
        .update(gmbReviews)
        .set({
          responseText,
          responseCreatedAt: new Date(),
          needsResponse: false,
          autoResponded: false,
          updatedAt: new Date(),
        })
        .where(eq(gmbReviews.id, id));

      Logger.info('Responded to GMB review', { reviewId: id });

      res.json({
        success: true,
        message: 'Response posted successfully',
      });
    } else {
      // Save locally even if Google API fails
      await db
        .update(gmbReviews)
        .set({
          responseText,
          needsResponse: false,
          updatedAt: new Date(),
        })
        .where(eq(gmbReviews.id, id));

      res.json({
        success: true,
        message: 'Response saved (Google API not configured)',
      });
    }
  } catch (error) {
    Logger.error('Failed to respond to review', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to respond to review',
    });
  }
});

router.post('/reviews/auto-respond', async (req, res) => {
  try {
    // Get reviews needing response
    const reviews = await db
      .select()
      .from(gmbReviews)
      .where(
        and(
          eq(gmbReviews.needsResponse, true),
          isNull(gmbReviews.responseText)
        )
      )
      .orderBy(desc(gmbReviews.reviewCreatedAt))
      .limit(10);

    const results = await reviewResponseService.processReviewsForAutoResponse(reviews);

    Logger.info('Processed reviews for auto-response', results);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    Logger.error('Failed to auto-respond to reviews', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to auto-respond to reviews',
    });
  }
});

// ============================================
// RESPONSE TEMPLATES
// ============================================

router.get('/templates', async (req, res) => {
  try {
    const templates = await db
      .select()
      .from(gmbResponseTemplates)
      .orderBy(desc(gmbResponseTemplates.useCount));

    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    Logger.error('Failed to fetch templates', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch templates',
    });
  }
});

router.post('/templates', async (req, res) => {
  try {
    const data = templateSchema.parse(req.body);

    const templateData: InsertGmbResponseTemplate = {
      name: data.name,
      starRating: data.starRating || null,
      sentiment: data.sentiment || null,
      template: data.template,
      isActive: data.isActive,
    };

    const [template] = await db
      .insert(gmbResponseTemplates)
      .values(templateData)
      .returning();

    Logger.info('Created response template', { templateId: template.id });

    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    Logger.error('Failed to create template', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to create template',
    });
  }
});

router.put('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = templateSchema.partial().parse(req.body);

    const [template] = await db
      .update(gmbResponseTemplates)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(gmbResponseTemplates.id, id))
      .returning();

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
      });
    }

    Logger.info('Updated response template', { templateId: id });

    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    Logger.error('Failed to update template', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to update template',
    });
  }
});

router.delete('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await db.delete(gmbResponseTemplates).where(eq(gmbResponseTemplates.id, id));

    Logger.info('Deleted response template', { templateId: id });

    res.json({
      success: true,
      message: 'Template deleted',
    });
  } catch (error) {
    Logger.error('Failed to delete template', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to delete template',
    });
  }
});

// ============================================
// JOB PHOTOS
// ============================================

router.get('/photos', async (req, res) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const approved = req.query.approved === 'true';
    const pending = req.query.pending === 'true';
    const offset = (page - 1) * limit;

    let conditions;
    if (pending) {
      conditions = eq(gmbJobPhotos.approved, false);
    } else if (approved) {
      conditions = eq(gmbJobPhotos.approved, true);
    }

    const [totalResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(gmbJobPhotos)
      .where(conditions);

    const photos = await db
      .select()
      .from(gmbJobPhotos)
      .where(conditions)
      .orderBy(desc(gmbJobPhotos.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({
      success: true,
      data: {
        photos,
        pagination: {
          page,
          limit,
          total: totalResult?.count || 0,
          totalPages: Math.ceil((totalResult?.count || 0) / limit),
        },
      },
    });
  } catch (error) {
    Logger.error('Failed to fetch job photos', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job photos',
    });
  }
});

router.post('/photos', async (req, res) => {
  try {
    const data = jobPhotoSchema.parse(req.body);

    const photoData: InsertGmbJobPhoto = {
      jobId: data.jobId,
      customerId: data.customerId,
      photoUrl: data.photoUrl,
      thumbnailUrl: data.thumbnailUrl,
      caption: data.caption,
      category: data.category,
      approved: false,
    };

    const [photo] = await db.insert(gmbJobPhotos).values(photoData).returning();

    Logger.info('Added job photo', { photoId: photo.id, jobId: data.jobId });

    res.json({
      success: true,
      data: photo,
    });
  } catch (error) {
    Logger.error('Failed to add job photo', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to add job photo',
    });
  }
});

router.post('/photos/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { createPost, postContent } = approvePhotoSchema.parse(req.body);
    const adminUser = (req as any).user?.email || 'admin';

    const [photo] = await db
      .select()
      .from(gmbJobPhotos)
      .where(eq(gmbJobPhotos.id, id))
      .limit(1);

    if (!photo) {
      return res.status(404).json({
        success: false,
        error: 'Photo not found',
      });
    }

    // Upload to Google My Business
    const gmbClient = getGmbClient();
    const mediaResult = await gmbClient.uploadMedia(photo.photoUrl, 'ADDITIONAL');

    // Update photo record
    await db
      .update(gmbJobPhotos)
      .set({
        approved: true,
        approvedAt: new Date(),
        approvedBy: adminUser,
        uploadedToGoogle: !!mediaResult,
        googleMediaKey: mediaResult?.mediaKey || null,
      })
      .where(eq(gmbJobPhotos.id, id));

    // Optionally create a post with this photo
    let post = null;
    if (createPost && postContent) {
      const content = postContent || `Check out our latest work! ${photo.caption || ''}`;

      // Insert the post first
      const [newPost] = await db.insert(gmbPosts).values({
        type: 'job_photo',
        content,
        imageUrl: photo.photoUrl,
        jobId: photo.jobId,
        status: 'draft',
      }).returning();

      // Update with the media key if we have one (imageMediaKey is omitted from insert schema)
      if (mediaResult?.mediaKey) {
        await db.update(gmbPosts)
          .set({ imageMediaKey: mediaResult.mediaKey })
          .where(eq(gmbPosts.id, newPost.id));
      }

      post = newPost;

      // Link photo to post
      await db
        .update(gmbJobPhotos)
        .set({ postId: newPost.id })
        .where(eq(gmbJobPhotos.id, id));
    }

    Logger.info('Approved job photo', {
      photoId: id,
      uploadedToGoogle: !!mediaResult,
      createdPost: !!post,
    });

    res.json({
      success: true,
      data: {
        photo: { id, approved: true },
        uploadedToGoogle: !!mediaResult,
        post,
      },
    });
  } catch (error) {
    Logger.error('Failed to approve photo', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to approve photo',
    });
  }
});

router.delete('/photos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [photo] = await db
      .select()
      .from(gmbJobPhotos)
      .where(eq(gmbJobPhotos.id, id))
      .limit(1);

    if (!photo) {
      return res.status(404).json({
        success: false,
        error: 'Photo not found',
      });
    }

    // Delete from Google if uploaded
    if (photo.googleMediaKey) {
      const gmbClient = getGmbClient();
      await gmbClient.deleteMedia(photo.googleMediaKey);
    }

    await db.delete(gmbJobPhotos).where(eq(gmbJobPhotos.id, id));

    Logger.info('Deleted job photo', { photoId: id });

    res.json({
      success: true,
      message: 'Photo deleted',
    });
  } catch (error) {
    Logger.error('Failed to delete photo', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to delete photo',
    });
  }
});

// ============================================
// ANALYTICS
// ============================================

router.get('/analytics', async (req, res) => {
  try {
    // Get review stats by rating
    const ratingStats = await db
      .select({
        starRating: gmbReviews.starRating,
        count: sql<number>`count(*)::int`,
      })
      .from(gmbReviews)
      .groupBy(gmbReviews.starRating)
      .orderBy(desc(gmbReviews.starRating));

    // Get review trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentReviews = await db
      .select()
      .from(gmbReviews)
      .where(gte(gmbReviews.reviewCreatedAt, thirtyDaysAgo))
      .orderBy(asc(gmbReviews.reviewCreatedAt));

    // Get post engagement
    const postStats = await db
      .select({
        status: gmbPosts.status,
        count: sql<number>`count(*)::int`,
      })
      .from(gmbPosts)
      .groupBy(gmbPosts.status);

    // Response rate
    const [responseStats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        responded: sql<number>`sum(case when response_text is not null then 1 else 0 end)::int`,
        autoResponded: sql<number>`sum(case when auto_responded then 1 else 0 end)::int`,
      })
      .from(gmbReviews);

    res.json({
      success: true,
      data: {
        ratings: ratingStats,
        recentReviews: recentReviews.length,
        reviewTrend: recentReviews.map(r => ({
          date: r.reviewCreatedAt?.toISOString().split('T')[0],
          rating: r.starRating,
        })),
        posts: postStats,
        responseRate: {
          total: responseStats?.total || 0,
          responded: responseStats?.responded || 0,
          autoResponded: responseStats?.autoResponded || 0,
          rate: responseStats?.total
            ? ((responseStats.responded || 0) / responseStats.total * 100).toFixed(1)
            : '0',
        },
      },
    });
  } catch (error) {
    Logger.error('Failed to fetch GMB analytics', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch GMB analytics',
    });
  }
});

export default router;
