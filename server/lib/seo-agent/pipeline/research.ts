import { Logger } from '../../../src/logger';
import { crawlCompetitorSitemap } from '../competitors/crawler';
import { extractKeywordsFromCompetitorPages, ExtractedKeyword } from '../competitors/keywordAgent';
import { dbStorage } from '../../../dbStorage';

const COMPETITORS = [
  'https://www.bostonstandardplumbing.com/',
  'https://www.trust1services.com/',
  'https://bluebearplumbing.com/',
  'https://askgem.com/',
  'https://www.minutemanplumbing.com/'
];

export async function runCompetitorResearch() {
  Logger.info('[SEO Pipeline] Starting Competitor Research...');
  
  const allKeywords: ExtractedKeyword[] = [];
  
  for (const baseUrl of COMPETITORS) {
    const pages = await crawlCompetitorSitemap(baseUrl);
    const keywords = await extractKeywordsFromCompetitorPages(pages);
    allKeywords.push(...keywords);
  }
  
  // Deduplicate and filter high relevance
  const uniqueKeywords = Array.from(new Map(allKeywords.map(k => [k.keyword.toLowerCase(), k])).values())
    .filter(k => k.relevance > 0.7);
    
  Logger.info(`[SEO Pipeline] Research complete. Found ${uniqueKeywords.length} high-value keywords.`);
  
  // Save new keywords to database
  for (const k of uniqueKeywords) {
    const existing = await dbStorage.getKeywordByName(k.keyword);
    if (!existing) {
      await dbStorage.createKeyword({
        keyword: k.keyword,
        difficulty: 50, // Default
        searchVolume: 100, // Placeholder
      });
    }
  }
  
  return uniqueKeywords;
}
