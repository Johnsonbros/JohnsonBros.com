import { CardIntentSchema, type CardIntent, CardTypeEnum } from './cardProtocol';

const CARD_INTENT_REGEX = /```card_intent\s*([\s\S]*?)```/g;
const JSON_BLOCK_REGEX = /```json\s*([\s\S]*?)```/g;

const VALID_CARD_TYPES = CardTypeEnum.options;

export function extractCardIntents(text: string): CardIntent[] {
  const cards: CardIntent[] = [];
  
  const cardIntentMatches = text.matchAll(CARD_INTENT_REGEX);
  for (const match of cardIntentMatches) {
    const card = tryParseCard(match[1]);
    if (card) cards.push(card);
  }
  
  const jsonMatches = text.matchAll(JSON_BLOCK_REGEX);
  for (const match of jsonMatches) {
    const card = tryParseCard(match[1]);
    if (card) cards.push(card);
  }
  
  const seen = new Set<string>();
  return cards.filter(card => {
    if (seen.has(card.id)) return false;
    seen.add(card.id);
    return true;
  });
}

function tryParseCard(jsonString: string): CardIntent | null {
  try {
    const trimmed = jsonString.trim();
    const parsed = JSON.parse(trimmed);
    
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.type || !VALID_CARD_TYPES.includes(parsed.type)) return null;
    
    const validated = CardIntentSchema.safeParse(parsed);
    
    if (validated.success) {
      return validated.data;
    } else {
      console.warn('[CardExtractor] Invalid card intent:', validated.error.errors);
      return null;
    }
  } catch (e) {
    return null;
  }
}

export function stripCardIntents(text: string): string {
  return text
    .replace(CARD_INTENT_REGEX, '')
    .replace(/```json\s*\{[\s\S]*?"type"\s*:\s*"(lead_card|new_customer_info|returning_customer_lookup|date_picker|time_picker|booking_confirmation|service_recommendation|service_fee|estimate_range|emergency_help)"[\s\S]*?\}[\s\S]*?```/g, '')
    .trim();
}
