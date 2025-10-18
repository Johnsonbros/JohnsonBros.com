import { db } from '../db';
import { blogPosts } from '@shared/schema';
import { eq } from 'drizzle-orm';

const SITE_URL = process.env.SITE_URL || 'https://johnsonbrosplumbing.com';

export interface SitemapURL {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export async function generateSitemap(): Promise<string> {
  const urls: SitemapURL[] = [];

  // Add static pages
  urls.push({
    loc: `${SITE_URL}/`,
    changefreq: 'weekly',
    priority: 1.0,
    lastmod: new Date().toISOString().split('T')[0]
  });

  urls.push({
    loc: `${SITE_URL}/blog`,
    changefreq: 'daily',
    priority: 0.8,
    lastmod: new Date().toISOString().split('T')[0]
  });

  urls.push({
    loc: `${SITE_URL}/contact`,
    changefreq: 'monthly',
    priority: 0.7
  });

  urls.push({
    loc: `${SITE_URL}/referral`,
    changefreq: 'monthly',
    priority: 0.7
  });

  urls.push({
    loc: `${SITE_URL}/maintenance-plans`,
    changefreq: 'weekly',
    priority: 0.8
  });

  urls.push({
    loc: `${SITE_URL}/ai-booking`,
    changefreq: 'monthly',
    priority: 0.6
  });

  // Add service pages
  const services = [
    'general-plumbing',
    'new-construction',
    'gas-heat',
    'drain-cleaning',
    'emergency-plumbing',
    'water-heater',
    'pipe-repair'
  ];

  services.forEach(service => {
    urls.push({
      loc: `${SITE_URL}/services/${service}`,
      changefreq: 'monthly',
      priority: 0.9
    });
  });

  // Add service landing pages
  const serviceLandingPages = [
    'drain-cleaning-landing',
    'emergency-plumbing-landing',
    'water-heater-landing',
    'pipe-repair-landing',
    'sewer-line-landing'
  ];

  serviceLandingPages.forEach(page => {
    urls.push({
      loc: `${SITE_URL}/service/${page}`,
      changefreq: 'monthly',
      priority: 0.85
    });
  });

  // Add general landing pages
  const landingPages = [
    'emergency',
    'winter-prep',
    'drain-cleaning'
  ];

  landingPages.forEach(page => {
    urls.push({
      loc: `${SITE_URL}/landing/${page}`,
      changefreq: 'monthly',
      priority: 0.85
    });
  });

  // Add service area pages (Tier 1 cities)
  const serviceAreas = [
    'quincy',
    'braintree',
    'weymouth',
    'plymouth',
    'marshfield',
    'hingham'
  ];

  serviceAreas.forEach(area => {
    urls.push({
      loc: `${SITE_URL}/service-areas/${area}`,
      changefreq: 'monthly',
      priority: 0.9
    });
  });

  // Add published blog posts
  try {
    const posts = await db
      .select({
        slug: blogPosts.slug,
        publishDate: blogPosts.publishDate,
        updatedAt: blogPosts.updatedAt
      })
      .from(blogPosts)
      .where(eq(blogPosts.status, 'published'));

    posts.forEach(post => {
      const lastmod = post.updatedAt 
        ? new Date(post.updatedAt).toISOString().split('T')[0]
        : post.publishDate 
          ? new Date(post.publishDate).toISOString().split('T')[0]
          : undefined;

      urls.push({
        loc: `${SITE_URL}/blog/${post.slug}`,
        changefreq: 'weekly',
        priority: 0.6,
        lastmod
      });
    });
  } catch (error) {
    console.error('Error fetching blog posts for sitemap:', error);
  }

  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
${url.lastmod ? `    <lastmod>${url.lastmod}</lastmod>\n` : ''}${url.changefreq ? `    <changefreq>${url.changefreq}</changefreq>\n` : ''}${url.priority !== undefined ? `    <priority>${url.priority.toFixed(1)}</priority>\n` : ''}  </url>`).join('\n')}
</urlset>`;

  return xml;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
