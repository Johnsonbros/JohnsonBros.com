import axios from 'axios';
import * as xml2js from 'xml2js';
import { Logger } from '../../../src/logger';

export interface CompetitorPage {
  url: string;
  title?: string;
  lastMod?: Date;
}

export async function crawlCompetitorSitemap(baseUrl: string): Promise<CompetitorPage[]> {
  try {
    const sitemapUrl = baseUrl.endsWith('/') ? `${baseUrl}sitemap.xml` : `${baseUrl}/sitemap.xml`;
    Logger.info(`[SEO Research] Fetching sitemap: ${sitemapUrl}`);
    
    const response = await axios.get(sitemapUrl, { 
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(response.data);
    
    const pages: CompetitorPage[] = [];
    
    const extractFromUrlSet = (urlset: any) => {
      if (urlset && urlset.url) {
        for (const entry of urlset.url) {
          const url = entry.loc[0];
          pages.push({
            url,
            lastMod: entry.lastmod ? new Date(entry.lastmod[0]) : undefined
          });
        }
      }
    };

    extractFromUrlSet(result.urlset);

    if (result.sitemapindex && result.sitemapindex.sitemap) {
      for (const sitemap of result.sitemapindex.sitemap) {
        const subUrl = sitemap.loc[0];
        try {
          const subRes = await axios.get(subUrl, { 
            timeout: 5000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
          });
          const subResult = await parser.parseStringPromise(subRes.data);
          extractFromUrlSet(subResult.urlset);
        } catch (e) {
          Logger.warn(`[SEO Research] Skipping sub-sitemap ${subUrl}`);
        }
      }
    }
    
    // Filter for blog or service related pages after collection
    const filteredPages = pages.filter(p => 
      p.url.includes('/blog') || 
      p.url.includes('/service') || 
      p.url.includes('/plumbing') ||
      p.url.includes('/drain')
    );
    
    Logger.info(`[SEO Research] Found ${filteredPages.length} relevant pages for ${baseUrl}`);
    return filteredPages;
  } catch (error: any) {
    Logger.error(`[SEO Research] Failed to crawl ${baseUrl}: ${error.message}`);
    return [];
  }
}
