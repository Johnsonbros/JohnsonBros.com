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
    const notificationPhone = process.env.BUSINESS_NOTIFICATION_PHONE || '+16174799911';
    const message = `🚀 SEO Agent created ${createdPosts.length} new blog drafts based on competitor research.\n\nTopics:\n${createdPosts.map(p => `• ${p.title}`).join('\n')}\n\nReview them in the Admin Dashboard.`;
    
    await sendSMS(notificationPhone, message);
    
    Logger.info('[SEO Pipeline] Automation loop complete.');
    return createdPosts;
  } catch (error: any) {
    Logger.error('[SEO Pipeline] Pipeline failed:', error);
  }
}
