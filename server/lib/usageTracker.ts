import { db } from "../db";
import { apiUsage, type InsertApiUsage } from "@shared/schema";

/**
 * API Usage Tracker
 *
 * Tracks API costs across OpenAI, Twilio, and Google Maps for budget monitoring
 * and optimization. All costs are stored in cents for precision.
 */

// ============================================
// PRICING CONSTANTS (as of 2024)
// ============================================

const PRICING = {
  OPENAI: {
    'gpt-4o': {
      inputPer1M: 2.50,    // $2.50 per 1M input tokens
      outputPer1M: 10.00,  // $10.00 per 1M output tokens
    },
    'gpt-4o-mini': {
      inputPer1M: 0.15,    // $0.15 per 1M input tokens
      outputPer1M: 0.60,   // $0.60 per 1M output tokens
    },
    'gpt-4o-2024-11-20': {
      inputPer1M: 2.50,
      outputPer1M: 10.00,
    },
    'gpt-4o-mini-2024-07-18': {
      inputPer1M: 0.15,
      outputPer1M: 0.60,
    },
  },
  TWILIO: {
    SMS_OUTBOUND_PER_SEGMENT: 0.0079,  // $0.0079 per outbound SMS segment
    SMS_INBOUND_PER_SEGMENT: 0.0075,   // $0.0075 per inbound SMS segment
    VOICE_PER_MINUTE: 0.0085,          // $0.0085 per voice minute
  },
  GOOGLE_MAPS: {
    GEOCODING_PER_1K: 5.00,            // $5.00 per 1000 geocoding requests
    DIRECTIONS_PER_1K: 5.00,           // $5.00 per 1000 directions requests
    PLACES_PER_1K: 17.00,              // $17.00 per 1000 places requests
    DISTANCE_MATRIX_PER_1K: 5.00,      // $5.00 per 1000 distance matrix requests
  },
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Convert dollars to cents for storage
 */
function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Calculate cost for OpenAI token usage
 */
function calculateOpenAICost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = PRICING.OPENAI[model as keyof typeof PRICING.OPENAI];

  if (!pricing) {
    console.warn(`[UsageTracker] Unknown OpenAI model: ${model}, using gpt-4o-mini pricing as fallback`);
    const fallbackPricing = PRICING.OPENAI['gpt-4o-mini'];
    const inputCost = (inputTokens / 1_000_000) * fallbackPricing.inputPer1M;
    const outputCost = (outputTokens / 1_000_000) * fallbackPricing.outputPer1M;
    return dollarsToCents(inputCost + outputCost);
  }

  const inputCost = (inputTokens / 1_000_000) * pricing.inputPer1M;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPer1M;

  return dollarsToCents(inputCost + outputCost);
}

// ============================================
// OPENAI TRACKING
// ============================================

interface OpenAIUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface OpenAIResponse {
  model: string;
  usage?: OpenAIUsage;
  [key: string]: any;
}

/**
 * Track OpenAI API usage and costs
 *
 * @param response - The OpenAI API response containing usage data
 * @param sessionId - Optional session ID to link to conversation
 * @param channel - Optional channel ('web_chat', 'sms', 'voice')
 * @param metadata - Optional additional context
 */
export async function trackOpenAIUsage(
  response: OpenAIResponse,
  sessionId?: string,
  channel?: 'web_chat' | 'sms' | 'voice',
  metadata?: Record<string, any>
): Promise<void> {
  try {
    if (!response.usage) {
      console.warn('[UsageTracker] OpenAI response missing usage data');
      return;
    }

    const { prompt_tokens, completion_tokens } = response.usage;
    const model = response.model || 'gpt-4o-mini';
    const estimatedCostCents = calculateOpenAICost(model, prompt_tokens, completion_tokens);

    const usageData: InsertApiUsage = {
      service: 'openai',
      operation: 'chat_completion',
      model,
      inputTokens: prompt_tokens,
      outputTokens: completion_tokens,
      units: prompt_tokens + completion_tokens, // total tokens as units
      estimatedCostCents,
      sessionId: sessionId || null,
      channel: channel || null,
      metadata: metadata || null,
    };

    await db.insert(apiUsage).values(usageData);

    console.log(`[UsageTracker] OpenAI usage tracked: ${model}, ${prompt_tokens}+${completion_tokens} tokens, $${(estimatedCostCents / 100).toFixed(4)}`);
  } catch (error) {
    console.error('[UsageTracker] Failed to track OpenAI usage:', error);
  }
}

// ============================================
// TWILIO SMS TRACKING
// ============================================

/**
 * Track Twilio SMS usage and costs
 *
 * @param direction - 'outbound' or 'inbound'
 * @param segmentCount - Number of SMS segments (default 1)
 * @param sessionId - Optional session ID to link to conversation
 * @param metadata - Optional additional context (e.g., message SID, phone number)
 */
export async function trackTwilioSMS(
  direction: 'outbound' | 'inbound',
  segmentCount: number = 1,
  sessionId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const costPerSegment = direction === 'outbound'
      ? PRICING.TWILIO.SMS_OUTBOUND_PER_SEGMENT
      : PRICING.TWILIO.SMS_INBOUND_PER_SEGMENT;

    const estimatedCostCents = dollarsToCents(costPerSegment * segmentCount);

    const usageData: InsertApiUsage = {
      service: 'twilio',
      operation: `sms_${direction}`,
      model: null,
      inputTokens: null,
      outputTokens: null,
      units: segmentCount,
      estimatedCostCents,
      sessionId: sessionId || null,
      channel: 'sms',
      metadata: metadata || null,
    };

    await db.insert(apiUsage).values(usageData);

    console.log(`[UsageTracker] Twilio SMS tracked: ${direction}, ${segmentCount} segments, $${(estimatedCostCents / 100).toFixed(4)}`);
  } catch (error) {
    console.error('[UsageTracker] Failed to track Twilio SMS usage:', error);
  }
}

// ============================================
// TWILIO VOICE TRACKING
// ============================================

/**
 * Track Twilio Voice usage and costs
 *
 * @param durationSeconds - Call duration in seconds
 * @param sessionId - Optional session ID to link to conversation
 * @param metadata - Optional additional context (e.g., call SID, phone number)
 */
export async function trackTwilioVoice(
  durationSeconds: number,
  sessionId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const durationMinutes = Math.ceil(durationSeconds / 60); // Twilio bills by minute, rounded up
    const estimatedCostCents = dollarsToCents(PRICING.TWILIO.VOICE_PER_MINUTE * durationMinutes);

    const usageData: InsertApiUsage = {
      service: 'twilio',
      operation: 'voice_call',
      model: null,
      inputTokens: null,
      outputTokens: null,
      units: durationSeconds, // store in seconds for accuracy
      estimatedCostCents,
      sessionId: sessionId || null,
      channel: 'voice',
      metadata: {
        ...metadata,
        durationMinutes,
      },
    };

    await db.insert(apiUsage).values(usageData);

    console.log(`[UsageTracker] Twilio Voice tracked: ${durationSeconds}s (${durationMinutes}min), $${(estimatedCostCents / 100).toFixed(4)}`);
  } catch (error) {
    console.error('[UsageTracker] Failed to track Twilio Voice usage:', error);
  }
}

// ============================================
// GOOGLE MAPS TRACKING
// ============================================

type GoogleMapsOperation = 'geocode' | 'directions' | 'places' | 'distance_matrix';

/**
 * Track Google Maps API usage and costs
 *
 * @param operation - The type of Maps API operation
 * @param requestCount - Number of API requests (default 1)
 * @param metadata - Optional additional context
 */
export async function trackGoogleMaps(
  operation: GoogleMapsOperation,
  requestCount: number = 1,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    let costPer1K: number;

    switch (operation) {
      case 'geocode':
        costPer1K = PRICING.GOOGLE_MAPS.GEOCODING_PER_1K;
        break;
      case 'directions':
        costPer1K = PRICING.GOOGLE_MAPS.DIRECTIONS_PER_1K;
        break;
      case 'places':
        costPer1K = PRICING.GOOGLE_MAPS.PLACES_PER_1K;
        break;
      case 'distance_matrix':
        costPer1K = PRICING.GOOGLE_MAPS.DISTANCE_MATRIX_PER_1K;
        break;
      default:
        console.warn(`[UsageTracker] Unknown Google Maps operation: ${operation}`);
        costPer1K = PRICING.GOOGLE_MAPS.GEOCODING_PER_1K; // fallback
    }

    const estimatedCostCents = dollarsToCents((requestCount / 1000) * costPer1K);

    const usageData: InsertApiUsage = {
      service: 'google_maps',
      operation,
      model: null,
      inputTokens: null,
      outputTokens: null,
      units: requestCount,
      estimatedCostCents,
      sessionId: null,
      channel: null,
      metadata: metadata || null,
    };

    await db.insert(apiUsage).values(usageData);

    console.log(`[UsageTracker] Google Maps tracked: ${operation}, ${requestCount} requests, $${(estimatedCostCents / 100).toFixed(4)}`);
  } catch (error) {
    console.error('[UsageTracker] Failed to track Google Maps usage:', error);
  }
}

// ============================================
// BATCH TRACKING (for bulk operations)
// ============================================

/**
 * Track multiple usage records in a single transaction
 * Useful for batch processing or aggregated tracking
 */
export async function trackBatchUsage(usageRecords: InsertApiUsage[]): Promise<void> {
  try {
    if (usageRecords.length === 0) return;

    await db.insert(apiUsage).values(usageRecords);

    console.log(`[UsageTracker] Batch tracked ${usageRecords.length} usage records`);
  } catch (error) {
    console.error('[UsageTracker] Failed to track batch usage:', error);
  }
}
