# SEO Website Migration Strategy: Johnson Bros. Plumbing

**Version**: 1.0
**Date**: January 2026
**Migration**: www.theJohnsonbros.com → [New Domain]
**Status**: Planning Phase

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Pre-Migration Checklist](#pre-migration-checklist)
3. [URL Redirect Mapping](#url-redirect-mapping)
4. [Technical SEO Configuration](#technical-seo-configuration)
5. [Local SEO Strategy](#local-seo-strategy)
6. [Post-Migration Growth Strategy](#post-migration-growth-strategy)
7. [Competitive Positioning](#competitive-positioning)
8. [KPIs & Monitoring](#kpis--monitoring)
9. [Risk Mitigation](#risk-mitigation)
10. [Phased Rollout Plan](#phased-rollout-plan)

---

## Executive Summary

This document outlines a comprehensive SEO-safe migration strategy for transitioning Johnson Bros. Plumbing from the current WordPress site (www.theJohnsonbros.com) to the new React-based application. The primary objectives are:

- **Preserve** all existing Google rankings, indexed pages, and backlink equity
- **Prevent** traffic loss, crawl errors, and SEO penalties during migration
- **Improve** site performance, user experience, and conversion rates
- **Expand** organic search visibility and local search dominance

### Critical Success Factors

| Factor | Priority | Risk if Ignored |
|--------|----------|-----------------|
| 301 Redirect Implementation | **CRITICAL** | Complete ranking loss |
| Google Search Console Setup | **CRITICAL** | Delayed indexing, lost data |
| Canonical Tag Consistency | **HIGH** | Duplicate content penalties |
| Sitemap Submission | **HIGH** | Slow re-indexing |
| NAP Consistency | **HIGH** | Local SEO degradation |

---

## Pre-Migration Checklist

### What MUST NOT Change

These elements must be preserved exactly or properly redirected:

| Element | Current State | Action Required |
|---------|---------------|-----------------|
| **Primary Keywords** | Ranking for "plumber Quincy MA", etc. | Maintain targeting on equivalent pages |
| **Title Tags** | Optimized per page | Transfer to new pages |
| **Meta Descriptions** | Service/area-specific | Transfer to new pages |
| **Heading Structure** | H1-H6 hierarchy | Replicate structure |
| **Content Substance** | Service descriptions, FAQs | Migrate or improve (never remove) |
| **Internal Link Architecture** | Existing link flow | Recreate equivalent structure |
| **Backlink Target URLs** | External sites linking to you | 301 redirect to new equivalents |
| **NAP Information** | Name, Address, Phone consistent | Keep identical across all properties |
| **Schema Markup** | LocalBusiness, Service schemas | Enhance, don't remove |
| **Image Alt Text** | Existing optimizations | Transfer to new images |

### What CAN Change

These elements can be modified or improved:

| Element | Allowed Changes |
|---------|-----------------|
| **Domain Name** | Can change with proper 301 redirects |
| **Design/Layout** | Full redesign allowed |
| **CMS/Technology** | WordPress → React (current) |
| **URL Slugs** | Can optimize with 301 redirects |
| **Performance** | Should improve (Core Web Vitals) |
| **Mobile Experience** | Should improve |
| **Page Speed** | Should improve |
| **Structured Data** | Can enhance with more types |
| **Content** | Can expand/improve (never reduce) |

---

## URL Redirect Mapping

### Critical: 301 Redirect Strategy

Every URL on the current site must map to a URL on the new site. Implement server-side 301 redirects, NOT client-side JavaScript redirects.

### Current Site URL Structure (Assumed WordPress)

Based on typical WordPress plumbing site patterns and your new site structure:

```
OLD URL (www.theJohnsonbros.com)          →  NEW URL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/                                          →  /
/about/ or /about-us/                      →  /about
/contact/ or /contact-us/                  →  /contact
/services/                                 →  /services/general-plumbing
/services/drain-cleaning/                  →  /services/drain-cleaning
/services/emergency-plumbing/              →  /services/emergency-plumbing
/services/water-heater/                    →  /services/water-heater
/services/pipe-repair/                     →  /services/pipe-repair
/services/gas-heat/ or /gas-line/          →  /services/gas-heat
/services/new-construction/                →  /services/new-construction
/blog/                                     →  /blog
/blog/{any-slug}/                          →  /blog/{slug}
/service-area/ or /areas-we-serve/         →  /service-areas
/service-area/quincy/                      →  /service-areas/quincy
/service-area/braintree/                   →  /service-areas/braintree
/service-area/weymouth/                    →  /service-areas/weymouth
/service-area/hingham/                     →  /service-areas/hingham
/service-area/plymouth/                    →  /service-areas/plymouth
/service-area/marshfield/                  →  /service-areas/marshfield
/service-area/abington/                    →  /service-areas/abington
/service-area/rockland/                    →  /service-areas/rockland
/service-area/hanover/                     →  /service-areas/hanover
/service-area/scituate/                    →  /service-areas/scituate
/service-area/cohasset/                    →  /service-areas/cohasset
/service-area/hull/                        →  /service-areas/hull
/reviews/ or /testimonials/                →  /reviews
/referral/ or /refer-a-friend/             →  /referral
```

### Implementation: Server-Side Redirects

Add to `server/routes.ts` or create `server/src/redirects.ts`:

```typescript
// SEO Migration Redirects
const SEO_REDIRECTS: Record<string, string> = {
  // Homepage variations
  '/index.html': '/',
  '/index.php': '/',
  '/home': '/',

  // About page variations
  '/about-us': '/about',
  '/about-us/': '/about',
  '/company': '/about',

  // Contact variations
  '/contact-us': '/contact',
  '/contact-us/': '/contact',
  '/get-in-touch': '/contact',

  // Service page variations (WordPress patterns)
  '/services': '/services/general-plumbing',
  '/plumbing-services': '/services/general-plumbing',
  '/drain-cleaning': '/services/drain-cleaning',
  '/drain-cleaning-service': '/services/drain-cleaning',
  '/emergency-plumber': '/services/emergency-plumbing',
  '/24-hour-plumber': '/services/emergency-plumbing',
  '/water-heater-repair': '/services/water-heater',
  '/water-heater-installation': '/services/water-heater',
  '/pipe-repair': '/services/pipe-repair',
  '/pipe-replacement': '/services/pipe-repair',
  '/gas-plumber': '/services/gas-heat',
  '/gas-line-repair': '/services/gas-heat',

  // Service area variations
  '/areas-we-serve': '/service-areas',
  '/service-area': '/service-areas',
  '/locations': '/service-areas',
  '/quincy-plumber': '/service-areas/quincy',
  '/plumber-quincy-ma': '/service-areas/quincy',
  '/braintree-plumber': '/service-areas/braintree',
  '/weymouth-plumber': '/service-areas/weymouth',

  // Review variations
  '/testimonials': '/reviews',
  '/customer-reviews': '/reviews',

  // Referral variations
  '/refer-a-friend': '/referral',
  '/referral-program': '/referral',

  // Blog variations
  '/news': '/blog',
  '/articles': '/blog',
};

// Middleware to handle redirects
export function seoRedirectMiddleware(req: Request, res: Response, next: NextFunction) {
  const path = req.path.toLowerCase().replace(/\/$/, '') || '/';

  if (SEO_REDIRECTS[path]) {
    return res.redirect(301, SEO_REDIRECTS[path]);
  }

  // Handle WordPress-style service area URLs
  const serviceAreaMatch = path.match(/^\/service-area\/(.+)$/);
  if (serviceAreaMatch) {
    return res.redirect(301, `/service-areas/${serviceAreaMatch[1]}`);
  }

  next();
}
```

### Canonical URL Strategy

Every page must have exactly ONE canonical URL. Update `client/src/lib/seoMetadata.ts`:

```typescript
// Canonical URL configuration
const NEW_DOMAIN = process.env.SITE_URL || 'https://johnsonbrosplumbing.com';

export function getCanonicalUrl(path: string): string {
  // Remove trailing slash, ensure no double slashes
  const cleanPath = path.replace(/\/+$/, '').replace(/\/+/g, '/');
  return `${NEW_DOMAIN}${cleanPath || '/'}`;
}
```

**Critical Rules:**
1. Always use HTTPS
2. Choose www or non-www (be consistent)
3. Remove trailing slashes
4. Use lowercase URLs
5. Include in `<head>`: `<link rel="canonical" href="..." />`

---

## Technical SEO Configuration

### 1. Google Search Console Setup

**Pre-Migration (Do This NOW):**

1. **Verify current domain** (www.theJohnsonbros.com) if not already
2. **Verify new domain** using DNS TXT record method
3. **Download all data** from current property:
   - Performance reports (last 16 months)
   - Index coverage reports
   - All crawl errors
   - Backlinks list

**On Migration Day:**

1. Submit new sitemap to new property
2. Use "Change of Address" tool (Settings → Change of address)
3. Request indexing for top 20 priority URLs

### 2. Sitemap Strategy

**Current sitemap** (`server/src/sitemap.ts`) needs enhancement:

```typescript
// Enhanced sitemap with hreflang support and image sitemaps
export async function generateSitemap(): Promise<string> {
  const urls: SitemapURL[] = [];
  const SITE_URL = process.env.SITE_URL || 'https://johnsonbrosplumbing.com';

  // Priority pages (1.0)
  const priorityPages = [
    { loc: '/', changefreq: 'weekly', priority: 1.0 },
    { loc: '/services/emergency-plumbing', changefreq: 'monthly', priority: 0.95 },
    { loc: '/services/drain-cleaning', changefreq: 'monthly', priority: 0.95 },
    { loc: '/service-areas/quincy', changefreq: 'monthly', priority: 0.9 },
  ];

  // Service pages (0.9)
  const services = [
    'general-plumbing', 'new-construction', 'gas-heat',
    'drain-cleaning', 'emergency-plumbing', 'water-heater',
    'pipe-repair', 'heating'
  ];

  // Service area pages (0.9)
  const serviceAreas = [
    'quincy', 'braintree', 'weymouth', 'plymouth', 'marshfield',
    'hingham', 'abington', 'rockland', 'hanover', 'scituate',
    'cohasset', 'hull'
  ];

  // Landing pages (0.85)
  const landingPages = [
    '/landing/emergency',
    '/landing/drain-cleaning',
    '/landing/winter-prep',
    '/service/drain-cleaning-landing',
    '/service/water-heater-landing',
    '/service/pipe-repair-landing',
    '/service/emergency-plumbing-landing',
    '/service/sewer-line-landing'
  ];

  // ... build URLs with lastmod dates
}
```

**Post-Migration Sitemap Actions:**

1. Submit new sitemap within 1 hour of go-live
2. Monitor index coverage daily for 30 days
3. Keep old sitemap accessible during transition (redirects to new URLs)

### 3. Robots.txt Configuration

Update `robots.txt` for new domain:

```
# Johnson Bros. Plumbing - Production Robots.txt
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /webhooks/
Disallow: /check-ins/
Disallow: /customer-portal/
Disallow: /my-plan/
Disallow: /cards/
Disallow: /chat-widget-cards/

# AI Crawlers (allow for rich snippets potential)
User-agent: GPTBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: Googlebot
Allow: /
Crawl-delay: 1

# Sitemap
Sitemap: https://johnsonbrosplumbing.com/sitemap.xml
```

### 4. Core Web Vitals Optimization

Your React/Vite setup supports excellent performance. Ensure:

| Metric | Target | Current Status | Action |
|--------|--------|----------------|--------|
| **LCP** (Largest Contentful Paint) | < 2.5s | Check with Lighthouse | Preload hero images |
| **FID** (First Input Delay) | < 100ms | Check with Lighthouse | Code-split heavy components |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Check with Lighthouse | Set image dimensions |

**Optimization Checklist:**

- [ ] Lazy load all images below the fold
- [ ] Preload critical CSS and fonts
- [ ] Enable gzip/brotli compression
- [ ] Set proper cache headers
- [ ] Use WebP images with fallbacks
- [ ] Minimize JavaScript bundle size
- [ ] Implement service worker for caching

---

## Local SEO Strategy

### 1. Google Business Profile Alignment

**Critical Actions:**

| Action | Timing | Details |
|--------|--------|---------|
| Update website URL | Migration day | Point to new domain |
| Verify NAP consistency | Pre-migration | Ensure identical across all platforms |
| Add new photos | Post-migration | Fresh content signals activity |
| Respond to all reviews | Ongoing | 24-48 hour response time |
| Post weekly updates | Ongoing | Showcase completed jobs |

**NAP Information (Must Be Identical Everywhere):**

```
Business Name: Johnson Bros. Plumbing & Drain Cleaning
Address 1: 75 East Elm Ave, Quincy, MA 02170
Address 2: 55 Brighton St, Abington, MA 02351
Phone: (617) 479-9911
Website: https://johnsonbrosplumbing.com
```

### 2. Service Area Page Architecture

Your current structure is strong. Enhance each service area page:

```
/service-areas/
├── /quincy          (Tier 1 - Primary market)
├── /braintree       (Tier 2 - Secondary)
├── /weymouth        (Tier 2)
├── /hingham         (Tier 2)
├── /abington        (Tier 1 - Office location)
├── /rockland        (Tier 3)
├── /hanover         (Tier 3)
├── /scituate        (Tier 3)
├── /cohasset        (Tier 3)
├── /hull            (Tier 3)
├── /plymouth        (Tier 3)
└── /marshfield      (Tier 3)
```

**Each Service Area Page Should Include:**

1. **Unique H1**: "Plumber in [City], MA | Johnson Bros. Plumbing"
2. **Local content**: Specific neighborhoods, landmarks, local issues
3. **Service-specific sections**: Link to service pages with local context
4. **Local testimonials**: Reviews from that specific area
5. **Map embed**: Showing service coverage in that city
6. **FAQ schema**: City-specific plumbing questions
7. **LocalBusiness schema**: With areaServed set to that city

### 3. Schema Markup Strategy

Your existing schema markup is solid. Enhance with:

**Homepage - Organization + LocalBusiness:**
```json
{
  "@context": "https://schema.org",
  "@type": ["Plumber", "LocalBusiness"],
  "@id": "https://johnsonbrosplumbing.com/#organization",
  "name": "Johnson Bros. Plumbing & Drain Cleaning",
  "url": "https://johnsonbrosplumbing.com",
  "logo": "https://johnsonbrosplumbing.com/logo.png",
  "telephone": "+16174799911",
  "address": [...],
  "areaServed": [...],
  "hasOfferCatalog": {...},
  "aggregateRating": {...}
}
```

**Service Pages - Service schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "serviceType": "Emergency Plumbing",
  "provider": { "@id": ".../#organization" },
  "areaServed": [...],
  "offers": {
    "@type": "Offer",
    "availability": "https://schema.org/InStock",
    "priceSpecification": {
      "@type": "PriceSpecification",
      "priceCurrency": "USD"
    }
  }
}
```

**Review Pages - Review schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "review": [...],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "314"
  }
}
```

### 4. Local Keyword Strategy

**Primary Keywords (High Competition, High Intent):**

| Keyword | Search Volume | Target Page |
|---------|---------------|-------------|
| plumber quincy ma | 390/mo | /service-areas/quincy |
| emergency plumber quincy | 90/mo | /services/emergency-plumbing |
| drain cleaning quincy ma | 70/mo | /services/drain-cleaning |
| 24 hour plumber near me | 1,300/mo | /services/emergency-plumbing |

**Long-Tail Keywords (Lower Competition, High Conversion):**

| Keyword | Target Page |
|---------|-------------|
| water heater repair quincy ma | /services/water-heater |
| clogged drain braintree | /service-areas/braintree |
| burst pipe repair south shore ma | /services/pipe-repair |
| gas line installation weymouth | /services/gas-heat |

### 5. Citation Building & Consistency

**Priority Citation Sites:**

1. Google Business Profile ✓
2. Yelp (already linked in schema)
3. Angi (formerly Angie's List)
4. HomeAdvisor
5. BBB (Better Business Bureau)
6. Yellow Pages
7. Manta
8. Bing Places
9. Apple Maps
10. Nextdoor

**Update Sequence:**
1. Google Business Profile (migration day)
2. Yelp, Angi, HomeAdvisor (within 48 hours)
3. All others (within 1 week)

---

## Post-Migration Growth Strategy

### 1. Content Expansion Plan

**Topical Authority Building:**

Create content clusters around core services:

```
DRAIN CLEANING CLUSTER
├── /services/drain-cleaning (pillar)
├── /blog/how-to-prevent-clogged-drains
├── /blog/signs-you-need-drain-cleaning
├── /blog/hydro-jetting-vs-snaking
├── /blog/tree-roots-in-sewer-line
└── /landing/drain-cleaning (conversion page)

EMERGENCY PLUMBING CLUSTER
├── /services/emergency-plumbing (pillar)
├── /blog/what-to-do-burst-pipe
├── /blog/emergency-plumbing-checklist
├── /blog/water-shut-off-valve-location
└── /landing/emergency (conversion page)

WATER HEATER CLUSTER
├── /services/water-heater (pillar)
├── /blog/tankless-vs-traditional-water-heater
├── /blog/water-heater-maintenance-tips
├── /blog/signs-water-heater-failing
└── /service/water-heater-landing (conversion page)
```

### 2. Link Building Strategy

**Internal Linking Structure:**

```
Homepage
  ↓
Service Pages ←→ Service Area Pages
  ↓                    ↓
Blog Posts ←→ Landing Pages
```

**External Link Acquisition:**

| Strategy | Effort | Impact |
|----------|--------|--------|
| Local business directories | Low | Medium |
| Chamber of Commerce | Medium | High |
| Local news coverage | High | High |
| Guest posts on home improvement blogs | Medium | Medium |
| Partnerships with realtors/contractors | Low | High |

### 3. Review Generation System

**Systematic Review Collection:**

1. **Post-job SMS**: "Thanks for choosing Johnson Bros! We'd appreciate a quick review: [Google Review Link]"
2. **Follow-up email**: 24 hours after service with review link
3. **In-person ask**: Technicians trained to request reviews from satisfied customers

**Review Response Protocol:**

| Review Type | Response Time | Action |
|-------------|---------------|--------|
| 5-star | 24 hours | Thank, personalize, mention service |
| 4-star | 24 hours | Thank, address any concern |
| 3-star or below | 4 hours | Apologize, offer resolution, take offline |

---

## Competitive Positioning

### How to Compete with Larger Brands

**Advantages of a Well-Optimized Local Business:**

1. **Local Relevance Signals**
   - Multiple service area pages targeting "plumber in [city]"
   - Local reviews with city mentions
   - NAP consistency across citations
   - GBP optimization with local photos

2. **Topical Depth**
   - Comprehensive service pages (not thin content)
   - Blog content answering local plumbing questions
   - FAQ schema on every relevant page

3. **Technical Excellence**
   - Fast-loading React SPA with SSR potential
   - Proper schema markup
   - Mobile-first design
   - Core Web Vitals optimization

4. **Trust Signals**
   - Real reviews with responses
   - License numbers visible
   - Years in business prominently displayed
   - Before/after photos of work

### Differentiation Strategy

| Competitor Weakness | Your Opportunity |
|---------------------|------------------|
| Slow, generic websites | Lightning-fast, locally-focused site |
| No same-day availability | Real-time capacity system |
| Hard to book | AI-powered 24/7 booking |
| Impersonal service | Family-owned, named technicians |
| Hidden pricing | Transparent pricing/quotes |

---

## KPIs & Monitoring

### SEO Health Metrics (Monitor Weekly)

| Metric | Tool | Target | Alert Threshold |
|--------|------|--------|-----------------|
| Organic traffic | GA4, GSC | ≥ Pre-migration baseline | < 80% of baseline |
| Indexed pages | GSC | 100% of sitemap URLs | Any decrease |
| Crawl errors | GSC | 0 | Any increase |
| Core Web Vitals | PageSpeed Insights | All green | Any red |
| Average position | GSC | Maintain or improve | > 10% drop |

### Local SEO Metrics (Monitor Weekly)

| Metric | Tool | Target |
|--------|------|--------|
| GBP impressions | GBP Insights | Week-over-week growth |
| GBP clicks | GBP Insights | > 5% CTR |
| Local pack rankings | Rank tracker | Top 3 for primary keywords |
| Review count | GBP | 4+ new reviews/month |
| Review rating | GBP | ≥ 4.8 stars |

### Conversion Metrics (Monitor Daily for 30 Days Post-Migration)

| Metric | Tool | Target |
|--------|------|--------|
| Booking form submissions | Analytics | Maintain baseline |
| Phone calls | Call tracking | Maintain baseline |
| Chat conversations | Chat analytics | Increase engagement |
| Bounce rate | GA4 | < 40% |
| Time on site | GA4 | > 2 minutes |

---

## Risk Mitigation

### Potential Failure Modes & Prevention

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Broken redirects | High | Critical | Test every redirect before launch |
| Slow indexing | Medium | High | Submit sitemap immediately, use URL Inspection |
| Duplicate content | Medium | Medium | Audit canonical tags |
| Lost backlinks | Low | High | Implement 301s for ALL known backlink targets |
| GBP suspension | Low | Critical | Don't make too many changes at once |
| Core Web Vitals regression | Medium | Medium | Monitor PageSpeed daily for 2 weeks |

### Rollback Plan

If critical issues arise post-migration:

1. **Immediate** (< 4 hours): Revert DNS to old hosting
2. **Short-term** (< 24 hours): Keep redirects in place on new server pointing back
3. **Investigation**: Identify root cause before re-attempting

### Pre-Launch Testing Checklist

- [ ] All 301 redirects tested and working
- [ ] Sitemap validates (no errors)
- [ ] Robots.txt accessible and correct
- [ ] All canonical tags point to correct URLs
- [ ] Schema markup validates (Google Rich Results Test)
- [ ] Mobile responsiveness verified
- [ ] Page speed > 90 (Lighthouse)
- [ ] Forms working (booking, contact)
- [ ] Phone click-to-call working
- [ ] Analytics/tracking verified
- [ ] Search Console verified on new domain

---

## Phased Rollout Plan

### Phase 1: Pre-Migration (2 weeks before)

**Week -2:**
- [ ] Crawl current site, export all URLs
- [ ] Map old URLs to new URLs
- [ ] Set up Google Search Console for new domain
- [ ] Set up Google Analytics 4 for new domain
- [ ] Audit all backlinks, prioritize high-value ones

**Week -1:**
- [ ] Implement all 301 redirects (test on staging)
- [ ] Verify sitemap includes all pages
- [ ] Verify robots.txt is correct
- [ ] Test all forms and tracking
- [ ] Prepare GBP update (draft, don't publish)
- [ ] Prepare citation updates (draft)

### Phase 2: Migration Day (D-Day)

**Hour 0-1:**
- [ ] Deploy new site
- [ ] Verify SSL certificate
- [ ] Test critical pages load correctly
- [ ] Verify 301 redirects working

**Hour 1-2:**
- [ ] Submit new sitemap to Google Search Console
- [ ] Request indexing for top 20 URLs
- [ ] Update Google Business Profile website URL
- [ ] Monitor for crawl errors

**Hour 2-24:**
- [ ] Update Yelp, Angi, HomeAdvisor listings
- [ ] Monitor Search Console for issues
- [ ] Test booking flow end-to-end
- [ ] Check all phone tracking working

### Phase 3: Post-Migration (Days 1-7)

**Day 1:**
- [ ] Check Search Console for crawl errors
- [ ] Verify pages being indexed
- [ ] Monitor organic traffic (compare to baseline)
- [ ] Respond to any customer feedback

**Day 2-3:**
- [ ] Update remaining citations
- [ ] Check for any missed redirects (404s in GSC)
- [ ] Monitor ranking positions

**Day 4-7:**
- [ ] Full SEO audit using Screaming Frog
- [ ] Fix any issues found
- [ ] Continue monitoring metrics

### Phase 4: Stabilization (Days 8-30)

**Week 2:**
- [ ] Analyze initial traffic patterns
- [ ] Compare rankings to pre-migration
- [ ] Address any ranking drops with content optimization
- [ ] Continue citation cleanup

**Week 3-4:**
- [ ] Full conversion rate analysis
- [ ] Implement any UX improvements
- [ ] Begin content expansion (blog posts)
- [ ] Start review generation campaign

### Phase 5: Growth (Day 31+)

- [ ] Launch content marketing calendar
- [ ] Begin link building outreach
- [ ] Expand service area pages
- [ ] A/B test landing pages
- [ ] Quarterly SEO audits

---

## Quick Reference: Do's and Don'ts

### DO:

- ✅ Implement server-side 301 redirects for EVERY old URL
- ✅ Keep old site content structure logic (services, areas, blog)
- ✅ Submit sitemap to Google within 1 hour of launch
- ✅ Use Google's Change of Address tool
- ✅ Monitor Search Console daily for first 30 days
- ✅ Maintain identical NAP information everywhere
- ✅ Keep schema markup on all pages
- ✅ Respond to reviews within 24 hours

### DON'T:

- ❌ Use JavaScript redirects (use server-side 301s)
- ❌ Remove content without redirecting it
- ❌ Change NAP information during migration
- ❌ Make multiple GBP changes at once
- ❌ Ignore crawl errors in Search Console
- ❌ Delete old sitemap until new one is fully indexed
- ❌ Forget to update citation sites
- ❌ Remove or significantly reduce page content

---

## Appendix: Resource Links

- [Google Search Console](https://search.google.com/search-console)
- [Google Business Profile](https://business.google.com/)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Rich Results Test](https://search.google.com/test/rich-results)
- [Schema.org Validator](https://validator.schema.org/)
- [Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)

---

*This document should be reviewed and updated after each phase of migration is complete.*
