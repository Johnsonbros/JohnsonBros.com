import OpenAI from 'openai';
import { Logger } from '../../../src/logger';
import { dbStorage } from '../../../dbStorage';
import { generateZekePrompt } from '../../zekePrompt';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function draftBlogPost(keyword: string) {
  Logger.info(`[SEO Pipeline] Drafting post for keyword: ${keyword}`);
  
  try {
    const prompt = `You are a Senior Content Writer for Johnson Bros. Plumbing. Write a high-quality, SEO-optimized blog post targeting the keyword: "${keyword}".
    
    Requirements:
    - Tone: Professional, friendly, expert, and local (South Shore MA).
    - Structure: Engaging H1, intro, several H2/H3 subheadings, and a strong CTA for Johnson Bros.
    - Content: Practical plumbing advice reflecting our business model (family-owned, state-of-the-art AI booking).
    - Service Area: Mention towns like Quincy, Weymouth, Braintree, or Hingham naturally.
    - SEO: Include the primary keyword naturally in the first paragraph and subheadings.
    - Format: Return JSON with 'title', 'content' (HTML), 'metaDescription', and 'tags'.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: `Write the blog post about ${keyword}` }
      ],
      response_format: { type: "json_object" }
    });

    const draft = JSON.parse(response.choices[0].message.content || '{}');
    
    // Create the blog post in 'draft' status
    const slug = draft.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const newPost = await dbStorage.createBlogPost({
      title: draft.title,
      slug,
      content: draft.content,
      excerpt: draft.metaDescription,
      metaDescription: draft.metaDescription,
      status: 'draft',
      author: 'ZEKE Content Agent',
      category: 'Plumbing Tips',
      tags: draft.tags || [],
      readingTime: Math.ceil(draft.content.split(' ').length / 200)
    });

    return newPost;
  } catch (error: any) {
    Logger.error(`[SEO Pipeline] Drafting failed for ${keyword}: ${error.message}`);
    throw error;
  }
}
