import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

export const CardActionEnum = z.enum([
  "HCP_LOOKUP_CUSTOMER",
  "HCP_GET_AVAILABILITY",
  "HCP_CREATE_BOOKING",
  "HCP_CREATE_ESTIMATE_REQUEST",
  "OPEN_BOOKING_MODAL",
  "OPEN_CALL_MODAL",
]);

export const DateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");
export const TimeHM = z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:mm");
export const DateTimeISO = z.string().datetime();

const DateOnlyOrISO = z.union([DateOnly, DateTimeISO]);
const TimeHMOrISO = z.union([TimeHM, DateTimeISO]);

export function safeRandomUUID(): string {
  const cryptoUUID = globalThis.crypto?.randomUUID?.bind(globalThis.crypto);
  if (cryptoUUID) {
    return cryptoUUID();
  }

  return uuidv4();
}

export const BaseCardSchema = z.object({
  id: z.string().default(() => safeRandomUUID()),
  type: z.string(),
  version: z.literal("1").default("1"),
});

const CtaSchema = z.object({
  label: z.string().min(1),
  action: CardActionEnum,
  payload: z.record(z.unknown()).optional(),
});

export const DatePickerCardSchema = BaseCardSchema.extend({
  type: z.literal("date_picker"),
  title: z.string().min(1),
  availableDates: z
    .array(
      z.object({
        date: DateOnlyOrISO,
        label: z.string().optional(),
      })
    )
    .default([]),
  selectedDate: DateOnlyOrISO.optional(),
});

export const TimePickerCardSchema = BaseCardSchema.extend({
  type: z.literal("time_picker"),
  title: z.string().min(1),
  selectedDate: DateOnlyOrISO.optional(),
  availableTimes: z
    .array(
      z.object({
        time: TimeHM,
        label: z.string().optional(),
      })
    )
    .default([]),
});

export const BookingConfirmationCardSchema = BaseCardSchema.extend({
  type: z.literal("booking_confirmation"),
  title: z.string().min(1),
  booking: z.object({
    scheduledDate: DateOnlyOrISO,
    scheduledTime: TimeHMOrISO,
  }),
  cta: CtaSchema.optional(),
});

export const ServiceRecommendationCardSchema = BaseCardSchema.extend({
  type: z.literal("service_recommendation"),
  title: z.string().min(1),
  description: z.string().optional(),
  cta: CtaSchema.optional(),
});

export const CardIntentSchema = z.discriminatedUnion("type", [
  DatePickerCardSchema,
  TimePickerCardSchema,
  BookingConfirmationCardSchema,
  ServiceRecommendationCardSchema,
]);

export type CardIntent = z.infer<typeof CardIntentSchema>;

export type ExtractCardIntentsResult = {
  cards: CardIntent[];
  cleanText: string;
  errors: string[];
};

export function extractCardIntents(text: string): ExtractCardIntentsResult {
  const cards: CardIntent[] = [];
  const errors: string[] = [];
  let cleanText = text;

  const fencedRegex = /```card_intent\s*([\s\S]*?)```/gi;
  const tagRegex = /<CARD_INTENT>([\s\S]*?)<\/CARD_INTENT>/gi;

  const findNextMatch = () => {
    fencedRegex.lastIndex = 0;
    tagRegex.lastIndex = 0;

    const fencedMatch = fencedRegex.exec(cleanText);
    const tagMatch = tagRegex.exec(cleanText);

    if (!fencedMatch && !tagMatch) {
      return null;
    }

    if (!fencedMatch) {
      return { match: tagMatch!, regex: tagRegex };
    }

    if (!tagMatch) {
      return { match: fencedMatch, regex: fencedRegex };
    }

    return fencedMatch.index <= tagMatch.index
      ? { match: fencedMatch, regex: fencedRegex }
      : { match: tagMatch, regex: tagRegex };
  };

  while (true) {
    const next = findNextMatch();
    if (!next) {
      break;
    }

    const { match, regex } = next;
    const raw = match[1]?.trim() ?? "";

    if (!raw) {
      errors.push("Empty card intent payload");
    } else {
      try {
        const parsed = JSON.parse(raw);
        const parsedResult = CardIntentSchema.safeParse(parsed);
        if (parsedResult.success) {
          cards.push(parsedResult.data);
        } else {
          errors.push(parsedResult.error.message);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Invalid JSON";
        errors.push(message);
      }
    }

    const startIndex = match.index ?? 0;
    const endIndex = startIndex + match[0].length;
    cleanText = `${cleanText.slice(0, startIndex)}${cleanText.slice(endIndex)}`;

    regex.lastIndex = 0;
  }

  return { cards, cleanText, errors };
}

export function isCardIntentComplete(text: string): boolean {
  const openerRegex = /```card_intent\b/gi;
  let openerMatch: RegExpExecArray | null;

  while ((openerMatch = openerRegex.exec(text)) !== null) {
    const closeIndex = text.indexOf("```", openerMatch.index + openerMatch[0].length);
    if (closeIndex === -1) {
      return false;
    }
    openerRegex.lastIndex = closeIndex + 3;
  }

  const tagRegex = /<\/?CARD_INTENT>/g;
  let balance = 0;
  let tagMatch: RegExpExecArray | null;

  while ((tagMatch = tagRegex.exec(text)) !== null) {
    if (tagMatch[0].startsWith("</")) {
      balance -= 1;
      if (balance < 0) {
        return false;
      }
    } else {
      balance += 1;
    }
  }

  return balance === 0;
}
