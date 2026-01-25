import { Logger } from '../../../src/logger';
import { runCompetitorResearch } from './research';
import { draftBlogPost } from './writer';
import { sendSMS } from '../../twilio';

export async function runFullSeoPipeline() {
  try {
    Logger.info('[SEO Pipeline] Starting Full Automation Loop...');
    
    // 1. Research Competitors
    const keywords = await runCompetitorResearch();
    
    if (keywords.length === 0) {
      Logger.warn('[SEO Pipeline] No new keywords found. Skipping generation.');
      return;
    }
    
    // 2. Select top 2 keywords for this run (twice per week = 2 posts)
    const topKeywords = keywords.slice(0, 1); // Starting with 1 per run for safety
    
    const createdPosts = [];
    for (const k of topKeywords) {
      const post = await draftBlogPost(k.keyword);
      createdPosts.push(post);
    }
    
    // 3. Notify Co-Founder for approval
    const notificationPhone = process.env.ADMIN_PHONE_NUMBER || '+16176868763';
    const baseUrl = process.env.SITE_URL || 'https://theabingtonplumber.com';
    
    const message = `🚀 SEO Agent "Jessica" created ${createdPosts.length} new blog drafts.\n\n` +
      createdPosts.map(p => `• ${p.title}\n  View: ${baseUrl}/admin/blog/edit/${p.id}`).join('\n\n') +
      `\n\nReply with the blog title and your feedback to refine!`;
    
    await sendSMS(notificationPhone, message);
    
    Logger.info('[SEO Pipeline] Automation loop complete.');
    return createdPosts;
  } catch (error: any) {
    Logger.error('[SEO Pipeline] Pipeline failed:', error);
  }
}
