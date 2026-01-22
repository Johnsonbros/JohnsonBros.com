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
    
    const response = await axios.get(sitemapUrl, { timeout: 10000 });
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(response.data);
    
    const pages: CompetitorPage[] = [];
    
    if (result.urlset && result.urlset.url) {
      for (const entry of result.urlset.url) {
        const url = entry.loc[0];
        // Filter for blog or service related pages to keep it relevant
        if (url.includes('/blog/') || url.includes('/services/') || url.includes('/plumbing-services/')) {
          pages.push({
            url,
            lastMod: entry.lastmod ? new Date(entry.lastmod[0]) : undefined
          });
        }
      }
    } else if (result.sitemapindex && result.sitemapindex.sitemap) {
      // Handle sitemap index files by crawling each sub-sitemap
      for (const sitemap of result.sitemapindex.sitemap) {
        const subUrl = sitemap.loc[0];
        if (subUrl.includes('post') || subUrl.includes('page') || subUrl.includes('blog')) {
          const subPages = await crawlCompetitorSitemap(subUrl.replace('/sitemap.xml', ''));
          pages.push(...subPages);
        }
      }
    }
    
    Logger.info(`[SEO Research] Found ${pages.length} relevant pages for ${baseUrl}`);
    return pages;
  } catch (error: any) {
    Logger.error(`[SEO Research] Failed to crawl ${baseUrl}: ${error.message}`);
    return [];
  }
}
