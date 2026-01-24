import OpenAI from 'openai';
import { db } from '../../db';
import { gmbReviews, gmbResponseTemplates, GmbReview } from '@shared/schema';
import { eq, desc, and, isNotNull, ne } from 'drizzle-orm';
import { Logger, getErrorMessage } from '../logger';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ReviewAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  topics: string[];
  suggestedResponse: string;
  confidence: number;
}

export interface ResponseContext {
  businessName: string;
  ownerName: string;
  phoneNumber: string;
  website: string;
}

const DEFAULT_CONTEXT: ResponseContext = {
  businessName: 'Johnson Bros Plumbing & Drain Cleaning',
  ownerName: 'The Johnson Bros Team',
  phoneNumber: '(617) 555-1234',
  website: 'johnsonbrosplumbing.com',
};

/**
 * Analyze review sentiment and extract topics
 */
export async function analyzeReview(
  reviewText: string,
  starRating: number
): Promise<ReviewAnalysis> {
  try {
    const prompt = `Analyze this customer review for a plumbing business.

Review (${starRating} stars):
"${reviewText}"

Provide a JSON response with:
1. sentiment: "positive", "neutral", or "negative"
2. topics: array of topics mentioned (e.g., ["pricing", "timeliness", "professionalism", "quality", "cleanliness"])
3. confidence: 0.0 to 1.0 confidence score

JSON only, no markdown:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 200,
    });

    const content = completion.choices[0]?.message?.content || '';
    const parsed = JSON.parse(content);

    return {
      sentiment: parsed.sentiment || (starRating >= 4 ? 'positive' : starRating >= 3 ? 'neutral' : 'negative'),
      topics: parsed.topics || [],
      suggestedResponse: '',
      confidence: parsed.confidence || 0.8,
    };
  } catch (error) {
    Logger.error('Failed to analyze review', { error: getErrorMessage(error) });

    // Fallback based on star rating
    return {
      sentiment: starRating >= 4 ? 'positive' : starRating >= 3 ? 'neutral' : 'negative',
      topics: [],
      suggestedResponse: '',
      confidence: 0.5,
    };
  }
}

/**
 * Get previous review responses as examples for AI
 */
export async function getPreviousResponses(limit: number = 10): Promise<string[]> {
  try {
    const reviews = await db
      .select()
      .from(gmbReviews)
      .where(
        and(
          isNotNull(gmbReviews.responseText),
          ne(gmbReviews.responseText, '')
        )
      )
      .orderBy(desc(gmbReviews.responseCreatedAt))
      .limit(limit);

    return reviews
      .map(r => `${r.starRating} stars: "${r.comment}" → Response: "${r.responseText}"`)
      .filter(s => s.length < 500);
  } catch (error) {
    Logger.error('Failed to get previous responses', { error: getErrorMessage(error) });
    return [];
  }
}

/**
 * Get response templates for a given rating
 */
export async function getTemplatesForRating(starRating: number): Promise<string[]> {
  try {
    const templates = await db
      .select()
      .from(gmbResponseTemplates)
      .where(
        and(
          eq(gmbResponseTemplates.isActive, true),
          eq(gmbResponseTemplates.starRating, starRating)
        )
      )
      .orderBy(desc(gmbResponseTemplates.useCount))
      .limit(5);

    // Also get general templates (no specific rating)
    const generalTemplates = await db
      .select()
      .from(gmbResponseTemplates)
      .where(
        and(
          eq(gmbResponseTemplates.isActive, true),
          eq(gmbResponseTemplates.starRating, 0)
        )
      )
      .orderBy(desc(gmbResponseTemplates.useCount))
      .limit(3);

    return [...templates, ...generalTemplates].map(t => t.template);
  } catch (error) {
    Logger.error('Failed to get response templates', { error: getErrorMessage(error) });
    return [];
  }
}

/**
 * Generate a personalized response to a review
 */
export async function generateReviewResponse(
  reviewerName: string,
  reviewText: string,
  starRating: number,
  context: ResponseContext = DEFAULT_CONTEXT
): Promise<string> {
  try {
    // Get examples of previous responses
    const previousResponses = await getPreviousResponses(5);
    const templates = await getTemplatesForRating(starRating);

    const examplesSection = previousResponses.length > 0
      ? `Here are examples of how we've responded to similar reviews:\n${previousResponses.join('\n')}\n\n`
      : '';

    const templatesSection = templates.length > 0
      ? `Here are some response templates we like to use:\n${templates.join('\n')}\n\n`
      : '';

    const prompt = `You are responding to a Google review for ${context.businessName}, a family-owned plumbing business.

${examplesSection}${templatesSection}Review from ${reviewerName} (${starRating} stars):
"${reviewText}"

Write a professional, warm, and personalized response that:
1. Thanks the customer by name
2. Addresses specific points they mentioned
3. For positive reviews: Express genuine gratitude and invite them back
4. For negative reviews: Apologize sincerely, offer to make it right, provide contact info
5. Keep it concise (2-4 sentences)
6. Sign off with "${context.ownerName}"

${starRating <= 2 ? `Include our phone number (${context.phoneNumber}) for them to reach us directly.` : ''}

Response only, no quotes or explanations:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 300,
    });

    const response = completion.choices[0]?.message?.content?.trim() || '';

    if (!response) {
      throw new Error('Empty response from AI');
    }

    Logger.info('Generated review response', {
      reviewerName,
      starRating,
      responseLength: response.length,
    });

    return response;
  } catch (error) {
    Logger.error('Failed to generate review response', { error: getErrorMessage(error) });

    // Fallback responses
    if (starRating >= 4) {
      return `Thank you so much for your kind words, ${reviewerName}! We truly appreciate you taking the time to share your experience. It's customers like you that make our work so rewarding. We look forward to serving you again!\n\n- ${context.ownerName}`;
    } else if (starRating === 3) {
      return `Thank you for your feedback, ${reviewerName}. We appreciate you sharing your experience and are always looking for ways to improve. If there's anything we can do better next time, please don't hesitate to reach out.\n\n- ${context.ownerName}`;
    } else {
      return `${reviewerName}, we're sorry to hear about your experience. This is not the level of service we strive for, and we'd like the opportunity to make things right. Please call us at ${context.phoneNumber} so we can address your concerns directly.\n\n- ${context.ownerName}`;
    }
  }
}

/**
 * Generate multiple response options for human review
 */
export async function generateResponseOptions(
  reviewerName: string,
  reviewText: string,
  starRating: number,
  count: number = 3,
  context: ResponseContext = DEFAULT_CONTEXT
): Promise<string[]> {
  try {
    const prompt = `You are responding to a Google review for ${context.businessName}, a family-owned plumbing business.

Review from ${reviewerName} (${starRating} stars):
"${reviewText}"

Generate ${count} different response options. Each should be:
1. Professional and warm
2. Thank the customer by name
3. Address their specific feedback
4. 2-4 sentences each
5. Signed by "${context.ownerName}"

${starRating <= 2 ? `Include our phone number (${context.phoneNumber}) in at least one option.` : ''}

Format as JSON array of strings:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.9,
      max_tokens: 600,
    });

    const content = completion.choices[0]?.message?.content || '[]';
    const responses = JSON.parse(content);

    return Array.isArray(responses) ? responses : [responses];
  } catch (error) {
    Logger.error('Failed to generate response options', { error: getErrorMessage(error) });

    // Return single fallback
    const fallback = await generateReviewResponse(reviewerName, reviewText, starRating, context);
    return [fallback];
  }
}

/**
 * Check if a review should get an auto-response
 */
export function shouldAutoRespond(
  starRating: number,
  hasExistingResponse: boolean,
  reviewAge: number // in hours
): { autoRespond: boolean; reason: string } {
  // Don't respond if already has a response
  if (hasExistingResponse) {
    return { autoRespond: false, reason: 'Already has response' };
  }

  // Don't auto-respond to very old reviews
  if (reviewAge > 72) {
    return { autoRespond: false, reason: 'Review too old for auto-response' };
  }

  // Auto-respond to 4-5 star reviews
  if (starRating >= 4) {
    return { autoRespond: true, reason: 'Positive review qualifies for auto-response' };
  }

  // Flag lower ratings for human review
  return { autoRespond: false, reason: 'Requires human review due to rating' };
}

/**
 * Process a batch of reviews for auto-response
 */
export async function processReviewsForAutoResponse(
  reviews: GmbReview[],
  context: ResponseContext = DEFAULT_CONTEXT
): Promise<{
  processed: number;
  autoResponded: number;
  flaggedForReview: number;
  errors: number;
}> {
  const results = {
    processed: 0,
    autoResponded: 0,
    flaggedForReview: 0,
    errors: 0,
  };

  for (const review of reviews) {
    results.processed++;

    if (review.responseText) {
      continue; // Already has response
    }

    const reviewAge = review.reviewCreatedAt
      ? (Date.now() - new Date(review.reviewCreatedAt).getTime()) / (1000 * 60 * 60)
      : 0;

    const { autoRespond, reason } = shouldAutoRespond(
      review.starRating,
      !!review.responseText,
      reviewAge
    );

    try {
      if (autoRespond) {
        const response = await generateReviewResponse(
          review.reviewerName,
          review.comment || '',
          review.starRating,
          context
        );

        // Update the review record with suggested response
        await db
          .update(gmbReviews)
          .set({
            responseText: response,
            autoResponded: true,
            needsResponse: false,
            updatedAt: new Date(),
          })
          .where(eq(gmbReviews.id, review.id));

        results.autoResponded++;
        Logger.info('Auto-responded to review', {
          reviewId: review.id,
          starRating: review.starRating,
        });
      } else {
        // Flag for human review
        await db
          .update(gmbReviews)
          .set({
            needsResponse: true,
            updatedAt: new Date(),
          })
          .where(eq(gmbReviews.id, review.id));

        results.flaggedForReview++;
        Logger.info('Review flagged for human review', {
          reviewId: review.id,
          starRating: review.starRating,
          reason,
        });
      }
    } catch (error) {
      results.errors++;
      Logger.error('Error processing review', {
        reviewId: review.id,
        error: getErrorMessage(error),
      });
    }
  }

  return results;
}

export const reviewResponseService = {
  analyzeReview,
  generateReviewResponse,
  generateResponseOptions,
  shouldAutoRespond,
  processReviewsForAutoResponse,
  getPreviousResponses,
  getTemplatesForRating,
};
