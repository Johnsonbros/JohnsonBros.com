import { CardIntentSchema, type CardIntent } from './cardProtocol';

const CARD_INTENT_REGEX = /```card_intent\s*([\s\S]*?)```/g;

export function extractCardIntents(text: string): CardIntent[] {
  const cards: CardIntent[] = [];
  const matches = text.matchAll(CARD_INTENT_REGEX);
  
  for (const match of matches) {
    try {
      const jsonString = match[1].trim();
      const parsed = JSON.parse(jsonString);
      const validated = CardIntentSchema.safeParse(parsed);
      
      if (validated.success) {
        cards.push(validated.data);
      } else {
        console.warn('[CardExtractor] Invalid card intent:', validated.error);
      }
    } catch (e) {
      console.warn('[CardExtractor] Failed to parse card intent:', e);
    }
  }
  
  return cards;
}

export function stripCardIntents(text: string): string {
  return text.replace(CARD_INTENT_REGEX, '').trim();
}
