import { z } from 'zod';

export const CardTypeEnum = z.enum([
  'lead_card',
  'new_customer_info',
  'returning_customer_lookup',
  'date_picker',
  'time_picker',
  'booking_confirmation',
  'service_recommendation',
  'service_fee',
  'estimate_range',
  'emergency_help',
]);

export type CardType = z.infer<typeof CardTypeEnum>;

const BaseCardSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  type: CardTypeEnum,
  title: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  createdAt: z.string().datetime().optional(),
  threadId: z.string().optional(),
  version: z.literal("1").default("1"),
});

const CtaSchema = z.object({
  label: z.string(),
  action: z.string(),
  payload: z.record(z.unknown()).optional(),
});

export const LeadCardSchema = BaseCardSchema.extend({
  type: z.literal('lead_card'),
  message: z.string().optional(),
  prefill: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    issueDescription: z.string().optional(),
  }).optional(),
});

export const NewCustomerInfoCardSchema = BaseCardSchema.extend({
  type: z.literal('new_customer_info'),
  message: z.string().optional(),
  prefill: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    address: z.object({
      line1: z.string().optional(),
      line2: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
    }).optional(),
  }).optional(),
});

export const ReturningCustomerLookupCardSchema = BaseCardSchema.extend({
  type: z.literal('returning_customer_lookup'),
  message: z.string().optional(),
  searchValue: z.string().optional(),
  results: z.array(z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    phone: z.string(),
    email: z.string().optional(),
    address: z.string().optional(),
  })).optional(),
});

export const DatePickerCardSchema = BaseCardSchema.extend({
  type: z.literal('date_picker'),
  message: z.string().optional(),
  serviceId: z.string().optional(),
  availableDates: z.array(z.object({
    date: z.string(),
    label: z.string().optional(),
    slotsAvailable: z.number().optional(),
    capacityState: z.enum(['SAME_DAY_FEE_WAIVED', 'LIMITED_SAME_DAY', 'NEXT_DAY', 'AVAILABLE']).optional(),
  })).optional(),
  selectedDate: z.string().optional(),
});

export const TimePickerCardSchema = BaseCardSchema.extend({
  type: z.literal('time_picker'),
  message: z.string().optional(),
  selectedDate: z.string().optional(),
  slots: z.array(z.object({
    id: z.string(),
    label: z.string(),
    timeWindow: z.enum(['MORNING', 'MIDDAY', 'AFTERNOON', 'EVENING']),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    available: z.boolean(),
    technicianCount: z.number().optional(),
  })).optional(),
  availableTimes: z.array(z.object({
    time: z.string(),
    label: z.string().optional(),
  })).optional(),
  selectedSlot: z.string().optional(),
});

export const BookingConfirmationCardSchema = BaseCardSchema.extend({
  type: z.literal('booking_confirmation'),
  message: z.string().optional(),
  booking: z.object({
    jobId: z.string().optional(),
    externalId: z.string().optional(),
    customerName: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    serviceType: z.string().optional(),
    scheduledDate: z.string(),
    scheduledTime: z.string(),
    estimatedArrival: z.string().optional(),
    confirmationNumber: z.string().optional(),
  }),
  cta: CtaSchema.optional(),
});

export const ServiceRecommendationCardSchema = BaseCardSchema.extend({
  type: z.literal('service_recommendation'),
  summary: z.string().optional(),
  description: z.string().optional(),
  priceRange: z.object({
    min: z.number(),
    max: z.number(),
    currency: z.string().default('USD'),
  }).optional(),
  cta: CtaSchema.optional(),
});

export const ServiceFeeCardSchema = BaseCardSchema.extend({
  type: z.literal('service_fee'),
  message: z.string().optional(),
  amount: z.number().default(99),
  waived: z.boolean().optional(),
  cta: CtaSchema.optional(),
});

export const EstimateRangeCardSchema = BaseCardSchema.extend({
  type: z.literal('estimate_range'),
  summary: z.string().optional(),
  range: z.object({
    min: z.number(),
    max: z.number(),
    currency: z.string().default('USD'),
  }),
  disclaimer: z.string().optional(),
});

export const EmergencyHelpCardSchema = BaseCardSchema.extend({
  type: z.literal('emergency_help'),
  message: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  instructions: z.array(z.string()).default([]),
  contactLabel: z.string().optional(),
  contactPhone: z.string().optional(),
  cta: CtaSchema.optional(),
});

export const CardIntentSchema = z.discriminatedUnion('type', [
  LeadCardSchema,
  NewCustomerInfoCardSchema,
  ReturningCustomerLookupCardSchema,
  DatePickerCardSchema,
  TimePickerCardSchema,
  BookingConfirmationCardSchema,
  ServiceRecommendationCardSchema,
  ServiceFeeCardSchema,
  EstimateRangeCardSchema,
  EmergencyHelpCardSchema,
]);

export type CardIntent = z.infer<typeof CardIntentSchema>;
export type LeadCard = z.infer<typeof LeadCardSchema>;
export type NewCustomerInfoCard = z.infer<typeof NewCustomerInfoCardSchema>;
export type ReturningCustomerLookupCard = z.infer<typeof ReturningCustomerLookupCardSchema>;
export type DatePickerCard = z.infer<typeof DatePickerCardSchema>;
export type TimePickerCard = z.infer<typeof TimePickerCardSchema>;
export type BookingConfirmationCard = z.infer<typeof BookingConfirmationCardSchema>;
export type ServiceRecommendationCard = z.infer<typeof ServiceRecommendationCardSchema>;
export type ServiceFeeCard = z.infer<typeof ServiceFeeCardSchema>;
export type EstimateRangeCard = z.infer<typeof EstimateRangeCardSchema>;
export type EmergencyHelpCard = z.infer<typeof EmergencyHelpCardSchema>;

const CARD_INTENT_REGEX = /```card_intent\s*([\s\S]*?)```/g;
const CARD_INTENT_TAG_REGEX = /<CARD_INTENT>([\s\S]*?)<\/CARD_INTENT>/g;
const JSON_CARD_REGEX = /```json\s*([\s\S]*?)```/g;
const INLINE_JSON_CARD_REGEX = /(\{[\s\S]*?"type"\s*:\s*"(lead_card|new_customer_info|returning_customer_lookup|date_picker|time_picker|booking_confirmation|service_recommendation|service_fee|estimate_range|emergency_help)"[\s\S]*?\})/g;
const EMERGENCY_HELP_BLOCK_REGEX = /```(?:json)?\s*({[\s\S]*?"type"\s*:\s*"emergency_help"[\s\S]*?})\s*```/g;
const EMERGENCY_HELP_INLINE_REGEX = /\{[\s\S]*?"type"\s*:\s*"emergency_help"[\s\S]*?\}/g;

export interface ExtractResult {
  cleanText: string;
  cards: CardIntent[];
  errors: string[];
}

export function extractCardIntents(text: string): ExtractResult {
  const cards: CardIntent[] = [];
  const errors: string[] = [];
  let cleanText = text;

  const extractFromRegex = (regex: RegExp) => {
    let match;
    while ((match = regex.exec(text)) !== null) {
      const jsonStr = match[1].trim();
      cleanText = cleanText.replace(match[0], '').trim();
      
      try {
        const parsed = JSON.parse(jsonStr);
        
        if (!parsed.id) {
          parsed.id = crypto.randomUUID();
        }
        if (!parsed.createdAt) {
          parsed.createdAt = new Date().toISOString();
        }
        
        // Normalize type names (AI may output variants)
        if (parsed.type === 'new_customer_information') {
          parsed.type = 'new_customer_info';
        }
        
        const result = CardIntentSchema.safeParse(parsed);
        
        if (result.success) {
          cards.push(result.data);
        } else {
          errors.push(`Invalid card schema: ${result.error.message}`);
        }
      } catch (e) {
        errors.push(`Failed to parse JSON: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    }
  };

  extractFromRegex(CARD_INTENT_REGEX);
  extractFromRegex(CARD_INTENT_TAG_REGEX);
  extractFromRegex(JSON_CARD_REGEX);
  extractFromRegex(INLINE_JSON_CARD_REGEX);

  cleanText = cleanText.replace(/\n{3,}/g, '\n\n').trim();

  return { cleanText, cards, errors };
}

export function stripEmergencyHelpCard(text: string): { cleanText: string; found: boolean } {
  const hasBlock = EMERGENCY_HELP_BLOCK_REGEX.test(text);
  EMERGENCY_HELP_BLOCK_REGEX.lastIndex = 0;
  const withoutBlocks = text.replace(EMERGENCY_HELP_BLOCK_REGEX, '').trim();

  const hasInline = EMERGENCY_HELP_INLINE_REGEX.test(withoutBlocks);
  EMERGENCY_HELP_INLINE_REGEX.lastIndex = 0;
  const cleanText = withoutBlocks
    .replace(EMERGENCY_HELP_INLINE_REGEX, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { cleanText, found: hasBlock || hasInline };
}

export function isCardIntentComplete(text: string): boolean {
  // Check for complete code blocks with card_intent
  const codeBlockStarts = text.match(/```card_intent/g) || [];

  // Count closing backticks that appear after a card_intent block start
  // by checking if there's a card_intent before each closing ```
  let codeBlockEnds = 0;
  const parts = text.split('```');
  let inCardBlock = false;
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith('card_intent')) {
      inCardBlock = true;
    } else if (inCardBlock && i > 0) {
      // This is a closing ``` after a card_intent block
      codeBlockEnds++;
      inCardBlock = false;
    }
  }

  const tagOpens = text.match(/<CARD_INTENT>/g) || [];
  const tagCloses = text.match(/<\/CARD_INTENT>/g) || [];

  return codeBlockStarts.length === codeBlockEnds &&
         tagOpens.length === tagCloses.length;
}

export function generateCardId(): string {
  return crypto.randomUUID();
}
