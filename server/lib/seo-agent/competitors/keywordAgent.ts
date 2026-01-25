import OpenAI from 'openai';
import { Logger } from '../../../src/logger';
import { CompetitorPage } from './crawler';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export interface ExtractedKeyword {
  keyword: string;
  relevance: number;
  topic: string;
}

export async function extractKeywordsFromCompetitorPages(pages: CompetitorPage[]): Promise<ExtractedKeyword[]> {
  if (pages.length === 0) return [];
  
  // Sample a subset of pages if too many
  const samplePages = pages.slice(0, 15);
  const pageList = samplePages.map(p => p.url).join('\n');
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an SEO Research Agent. Analyze the following list of competitor URLs and extract high-value SEO keywords they are likely targeting. For each keyword, provide its relevance (0-1) and a general topic category."
        },
        {
          role: "user",
          content: `Analyze these URLs and return a JSON array of objects with 'keyword', 'relevance', and 'topic' fields:\n\n${pageList}`
        }
      ],
      response_format: { type: "json_object" }
    });
    
    const content = response.choices[0].message.content || '{"keywords": []}';
    const parsed = JSON.parse(content);
    return parsed.keywords || [];
  } catch (error: any) {
    Logger.error(`[SEO Research] Keyword extraction failed: ${error.message}`);
    return [];
  }
}
