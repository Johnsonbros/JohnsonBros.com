
# Work Board

> **Updated**: 2026-01-29 | **Phase**: 3 - SEO & Local Ranking | **Status**: IN PROGRESS
> **Session**: 16 | **Key Achievement**: 301 redirects, landing page analytics, image lazy loading complete

---

## Confidence Legend

| Indicator | Meaning | Action |
|-----------|---------|--------|
| 🟢 | Confident - clear path, similar to existing code | Proceed freely |
| 🟡 | Uncertain - some unknowns, may need quick research | Try first, then research |
| 🔴 | Lost - significant unknowns, needs research first | Research before starting |

| Research | Agent | When to Use |
|----------|-------|-------------|
| 131 | 1-3-1 Pattern | Problem decomposition, understanding behavior |
| GH | Growth Hacker | Architecture decisions, best practices |
| - | None | Straightforward implementation |

---

## Active

| # | Task | Expected Output | Solution Pattern | Status | C | R |
|---|------|-----------------|------------------|--------|---|---|
| P3-SEO-002 | Build backlinks | Citations on local directories | Submit to Yelp, Angi, HomeAdvisor | **Strategy Ready** | 🟢 | GH |
| P3-SEO-005 | Page speed optimization | Core Web Vitals green | Image compression (pending) | **Partial** | 🟢 | - |
| IMG-001 | Large image compression | Compress 5 large images (14MB truck.png) | WebP conversion, resize | **Pending** | 🟢 | - |

---

## Recently Completed (Session 15-16)

| # | Task | Output | Completed |
|---|------|--------|-----------|
| LP-003 | 301 redirects for migration | 150+ WordPress URLs redirected (server/src/redirects.ts) | 2026-01-29 |
| LP-001 | Landing page registry | landingPages.ts + /admin/landing-pages dashboard | 2026-01-29 |
| LP-002 | LandingPageBuilder analytics | UTM tracking, scroll depth, CTA events | 2026-01-29 |
| PERF-002 | Image lazy loading | loading="lazy" on 16+ images (referral, landing, service pages) | 2026-01-29 |
| PERF-001 | API call reduction | staleTime 5min, disabled refetchOnWindowFocus on 11 components | 2026-01-26 |
| P3-SEO-005 | Bundle optimization | Main bundle 1.28MB to 635KB (50% reduction) via Vite chunks | 2026-01-26 |
| CAP-001 | Weekend mode | WEEKEND_EMERGENCY state (Fri 5PM - Mon 8AM) | 2026-01-26 |
| CAP-002 | Holiday handling | HOLIDAY state with 2026 holidays list | 2026-01-26 |
| CAP-003 | After-cutoff state | AFTER_CUTOFF for post-noon same-day | 2026-01-26 |
| CAP-004 | Frontend banners | Capacity state banners in CapacityHero | 2026-01-26 |
| CAL-001 | Admin calendar | Mirror HCP calendar in admin | 2026-01-26 |
| P3-SEO-001 | Keyword tracking plan | 125 keywords for 25 towns documented | 2026-01-26 |
| P3-SEO-004 | Submit sitemaps | All 25 service areas in sitemap.xml | 2026-01-26 |

---

## Phase 3: SEO & Local Ranking

### Completed SEO Work (2026-01-25)

| # | Task | Output | Completed |
|---|------|--------|-----------|
| P3-SEO-003 | Internal Linking System | Centralized NearbyServiceAreas component + all 25 pages standardized | 2026-01-25 |
| - | Geographic Adjacency Data | `client/src/lib/serviceAreaAdjacency.ts` with neighbor relationships | 2026-01-25 |
| - | Broken Link Fixes | Fixed 8+ links to non-existent pages (Boston, Brockton, Avon, etc.) | 2026-01-25 |
| - | Missing Sections Added | Added nearby section to 6 pages (abington, cohasset, hanover, hull, rockland, scituate) | 2026-01-25 |
| SEO-001 | Service Area Pages | 13 new South Shore pages created | 2026-01-24 |
| SEO-002 | Schema Markup | LocalBusiness + Service schemas on all pages | 2026-01-24 |
| SEO-003 | Geo Tags | viewport, ICBM, geo.position, geo.region | 2026-01-24 |
| SEO-004 | FAQ Sections | Unique Q&A for each town | 2026-01-24 |
| SEO-005 | Reviews Integration | Google reviews displayed per location | 2026-01-24 |
| SEO-006 | GBP Integration | Quincy (4.8, 320+ reviews) + Abington (5.0, 23 reviews) | 2026-01-24 |
| SEO-007 | SEO Metadata | All 13 towns in seoMetadata.ts | 2026-01-24 |
| SEO-008 | Routes Setup | Lazy-loaded routes in App.tsx | 2026-01-24 |
| SEO-009 | Service Area Index | 25-town grid directory page | 2026-01-24 |

### Towns with SEO Pages (25 total)

**Existing (12):** Quincy, Abington, Rockland, Hanover, Braintree, Weymouth, Hull, Hingham, Scituate, Marshfield, Cohasset, Plymouth

**New (13):** Milton, Randolph, Holbrook, Norwell, Whitman, Stoughton, Canton, Pembroke, Hanson, East Bridgewater, Duxbury, Kingston, Halifax

### Ranking Tasks (Queued)

| # | Task | Expected Output | Solution Pattern | Deps | Status | C | R |
|---|------|-----------------|------------------|------|--------|---|---|
| P3-SEO-002 | Build local citations | Listings on 10+ directories | Manual submissions | SEO-001 | **Strategy Ready** | 🟢 | GH |
| P3-SEO-004 | XML sitemap update | sitemap.xml with all service pages | Generate + submit to GSC | SEO-001 | **Done** | 🟢 | - |
| P3-SEO-005 | Page speed optimization | Core Web Vitals green | Bundle done, images pending | SEO-001 | **Partial** | 🟢 | - |
| P3-SEO-006 | Mobile usability check | All pages mobile-friendly | Viewport, touch targets, padding | SEO-001 | **Done** | 🟢 | - |
| IMG-001 | Large image compression | WebP conversion for 5 oversized images | Manual compression needed | - | **Pending** | 🟢 | - |

---

## Phase 2.5: aOa Integration

Enable fast codebase search and semantic tagging for AI-optimized development.

| # | Task | Expected Output | Solution Pattern | Deps | Status | C | R |
|---|------|-----------------|------------------|------|--------|---|---|
| P2.5-001 | Verify aOa health | All services green (Docker, Redis, Index) | `aoa health` - runs locally only | - | Done | 🟢 | - |
| P2.5-002 | Add aOa to AGENTS.md | aOa callout block | Edit frontmatter | - | Done | 🟢 | - |
| P2.5-003 | Add aOa to 131.md | aOa callout block | Edit frontmatter | - | Done | 🟢 | - |
| P2.5-004 | Add aOa to beacon.md | aOa callout block | Edit frontmatter | - | Done | 🟢 | - |
| P2.5-005 | Add aOa to gh.md | aOa callout block | Edit frontmatter | - | Done | 🟢 | - |
| P2.5-006 | Add aOa to skills | aOa callout blocks | Edit frontmatter | - | Done | 🟢 | - |
| P2.5-007 | Tag server files | ~65 files tagged | `aoa intent store` | - | Done | 🟢 | - |
| P2.5-008 | Tag client files | 251 files tagged | `aoa intent store` | - | **Done** | 🟢 | - |
| P2.5-009 | Tag config files | ~20 files tagged | `aoa intent store` | - | Done | 🟢 | - |
| P2.5-010 | Tag documentation | ~15 files tagged | `aoa intent store` | - | Done | 🟢 | - |
| P2.5-011 | Verify semantic search | `aoa intent files <tag>` works | Test searches | P2.5-008 | **Done** | 🟢 | - |
| P2.5-012 | Confirm aOa architecture | aOa runs locally, not in Docker | Verified 2026-01-25 | - | Done | 🟢 | - |

---

## Phase 2: Feature Verification

Test what works without full integrations. Focus on features that don't require API keys.

### Tier 1: Environment Setup (Windows)

| # | Task | Expected Output | Solution Pattern | Deps | Status | C | R |
|---|------|-----------------|------------------|------|--------|---|---|
| P2-001 | Verify Node.js installed | `node --version` returns 18+ | Check installed version | - | **Done** | 🟢 | - |
| P2-002 | Verify npm installed | `npm --version` returns version | Check installed version | - | **Done** | 🟢 | - |
| P2-003 | Install dependencies | `node_modules/` populated | `npm install` | P2-001 | **Done** | 🟢 | - |
| P2-004 | Start/verify PostgreSQL | Database accessible on port | Docker or local postgres | P2-003 | **Done** | 🟢 | - |
| P2-005 | Create/verify .env | .env file with DATABASE_URL | Copy from .env.example | P2-003 | **Done** | 🟢 | - |
| P2-006 | Push database schema | Tables created in database | `npm run db:push` | P2-004, P2-005 | **Done** | 🟢 | - |

### Tier 2: Server Verification

| # | Task | Expected Output | Solution Pattern | Deps | Status | C | R |
|---|------|-----------------|------------------|------|--------|---|---|
| P2-007 | Start dev server | Server running on :5000 | `npm run dev` | P2-006 | **Done** | 🟢 | - |
| P2-008 | Verify health endpoint | `{"status":"ok"}` | `curl localhost:5000/health` | P2-007 | **Done** | 🟢 | - |
| P2-009 | Verify MCP server | Port 3001 responding | Check child process started | P2-007 | **Done** | 🟢 | - |

### Tier 3: Frontend Verification

| # | Task | Expected Output | Solution Pattern | Deps | Status | C | R |
|---|------|-----------------|------------------|------|--------|---|---|
| P2-017 | Commit asset changes | 7 new images + drain-cleaning committed | git add, git commit | - | **Done** | 🟢 | - |
| P2-010 | Homepage loads | Johnson Bros. homepage renders | Open localhost:5000 | P2-007 | **Done** | 🟢 | - |
| P2-011 | Check console for errors | No critical errors | Browser DevTools | P2-010 | **Done** | 🟢 | - |
| P2-012 | Test routing | Pages navigate correctly | Click through nav | P2-010 | **Done** | 🟢 | - |

### Tier 4: Feature Testing (No API Keys)

| # | Task | Expected Output | Solution Pattern | Deps | Status | C | R |
|---|------|-----------------|------------------|------|--------|---|---|
| P2-013 | Test blog system | Blog posts display | Navigate to /blog | P2-010 | **Done** | 🟢 | - |
| P2-014 | Test admin login | Admin panel accessible | Navigate to /admin | P2-010 | **Done** | 🟢 | - |
| P2-015 | Test static pages | About, Services render | Navigate pages | P2-010 | **Done** | 🟢 | - |
| P2-016 | Test form rendering | Forms display correctly | View booking/contact | P2-010 | **Done** | 🟢 | - |

---

## Phase 3: Integration Setup

| # | Task | Expected Output | Solution Pattern | Deps | Status | C | R |
|---|------|-----------------|------------------|------|--------|---|---|
| P3-001 | Configure HousecallPro | API key in .env | Get key from HCP dashboard | P2 complete | **Done** | 🟢 | - |
| P3-002 | Configure OpenAI | API key in .env | Get key from OpenAI | P2 complete | **Done** | 🟢 | - |
| P3-003 | Configure Google Maps | API key in .env | Get key from GCP | P2 complete | **Done** | 🟢 | - |
| P3-004 | Configure Twilio | API keys in .env | Get keys from Twilio | P2 complete | **Done** | 🟢 | - |
| P3-005 | Test AI chat | Chat responds | Verify OpenAI integration | P3-002 | **Blocked** (needs real OPENAI_API_KEY) | 🟡 | - |
| P3-006 | Test booking flow | Capacity API working | Full integration test | P3-001 | **Done** | 🟢 | - |
| P3-007 | Service area pages | All 25 pages expanded | 377+ lines each with 7 sections | - | **Done** | 🟢 | - |

---

## Phases Overview

| Phase | Focus | Status | Blocked By |
|-------|-------|--------|------------|
| 0 | Setup & Analysis | Done | - |
| 1 | MVP Local Launch | Done | - |
| 2 | Feature Verification | Done | - |
| 2.5 | aOa Integration | Done | - |
| 3 | SEO & Local Ranking | **Active** | - |
| 4 | Integration Setup | Backlog | Phase 3 completion |
| 5 | Production Hardening | Backlog | Phase 4 completion |

---

## Current System State

| Component | Status | Notes |
|-----------|--------|-------|
| Server | ✅ Running :5000 | Express + Vite |
| MCP Server | ✅ Running :3001 | 16 tools available |
| Database | ✅ Docker :5433 | PostgreSQL |
| Frontend | ✅ Vite HMR active | React 19 |
| Node.js | ✅ v22.19.0 | - |
| aOa | ✅ Local | 498 files indexed, sub-ms search |
| Docker Desktop | ✅ Running | - |

### API Integrations

| Integration | Status | Notes |
|-------------|--------|-------|
| HousecallPro | ✅ Configured | Capacity API working |
| OpenAI | ⚠️ Placeholder | Needs real key for AI chat |
| Google Maps | ✅ Configured | Maps & geocoding available |
| Twilio | ✅ Configured | SMS/voice available |
| PostgreSQL | ✅ Connected | Docker :5433 |

### Pending Image Optimization

| File | Size | Action Needed |
|------|------|---------------|
| truck_1756136293648.png | 14 MB | Compress to <500KB WebP |
| image_1756134291758.png | 2.4 MB | WebP conversion |
| image_1756125098554.png | 1.2 MB | WebP conversion |
| banner-bg.png | 1.2 MB | WebP conversion |
| banner-bg-emergency.png | 1.2 MB | WebP conversion |

---

## Completed

| # | Task | Output | Completed |
|---|------|--------|-----------|
| LP-003 | 301 redirects | 150+ WordPress URL redirects (server/src/redirects.ts) | 2026-01-29 |
| LP-001 | Landing page tracking | landingPages.ts registry + /admin/landing-pages dashboard | 2026-01-29 |
| LP-002 | Analytics in LandingPageBuilder | UTM tracking, scroll depth, time on page, CTA events | 2026-01-29 |
| PERF-002 | Image lazy loading | loading="lazy" on 16+ referral/landing/service images | 2026-01-29 |
| P3-006 | Booking flow test | Capacity API tested - returns AFTER_CUTOFF correctly | 2026-01-26 |
| P3-007 | Service area pages | All 25 pages verified expanded (229-379 lines each) | 2026-01-26 |
| PERF-001 | API call reduction | staleTime 5min, disabled refetchOnWindowFocus on 11 components | 2026-01-26 |
| BUNDLE-001 | Vite manual chunks | Main bundle 1.28MB to 635KB (50% reduction) | 2026-01-26 |
| SITEMAP-001 | Sitemap update | All 25 service areas now in sitemap.xml | 2026-01-26 |
| MOBILE-001 | Mobile responsiveness | Fixed 25 service area pages + 3 shared components | 2026-01-26 |
| DEV-001 | Docker dev environment | docker-compose.yml + Dockerfile.mcp + SKIP_MCP_SPAWN flag | 2026-01-26 |
| UI-001 | Copyright year fix | Footer.tsx 2025 to 2026 | 2026-01-26 |
| TOOL-001 | TTS skill | /s and /speak skills using edge-tts | 2026-01-26 |
| FIX-001 | Hook file restored | aoa-enforce-search.py recreated | 2026-01-26 |
| SYS-001 | Docker Desktop fix | Cleared Windows disk space, Docker running | 2026-01-25 |
| P2.5-012 | aOa architecture verification | Confirmed aOa runs locally only (not containerized) | 2026-01-25 |
| P3-SEO-003 | Internal Linking System | NearbyServiceAreas component + serviceAreaAdjacency.ts + 25 pages standardized | 2026-01-25 |
| SEO-ALL | SEO Service Area Pages | 13 new South Shore pages with schema, geo tags, FAQs, reviews | 2026-01-24 |
| GBP-INT | Google Business Profile | Quincy (4.8/320+) + Abington (5.0/23) with Maps links, badges | 2026-01-24 |
| META-001 | SEO Metadata | All 13 towns added to seoMetadata.ts | 2026-01-24 |
| ROUTE-001 | Routes & Directory | Lazy-loaded routes + 25-town grid index | 2026-01-24 |
| BUG-001 | Competitor Tracking Fix | Drizzle ORM query chaining bug fixed, PE alert added | 2026-01-24 |
| P2-010-016 | Frontend Verification | All Tier 3 & 4 tests passed | 2026-01-24 |
| - | Asset cleanup | Removed attached_assets bloat, moved to client/src/assets | 2026-01-23 |
| - | Fix startup issues | Added dotenv, fixed duplicate export | 2026-01-23 |
| P2-001 | Verify Node.js | v22.19.0 | 2026-01-22 |
| P2-002 | Verify npm | npm available | 2026-01-22 |
| P2-003 | Install dependencies | 1304 packages | 2026-01-22 |
| P2-004 | Start PostgreSQL | Docker johnsonbros-db:5433 | 2026-01-22 |
| P2-005 | Create .env | All API keys configured | 2026-01-22 |
| P2-006 | Push schema | Tables synced | 2026-01-22 |
| P2-007 | Start dev server | Running on :5000 | 2026-01-22 |
| P2-008 | Health endpoint | Returns {"status":"ok"} | 2026-01-22 |
| P2-009 | MCP server | Running on :3001, 16 tools | 2026-01-22 |
| P2.5-001 | aOa health check | All services green | 2026-01-22 |
| P2.5-002 | Add aOa to agents | 6 files updated with aOa instructions | 2026-01-22 |
| P2.5-007 | Tag server files | 65+ files tagged | 2026-01-22 |
| P2.5-009 | Tag config files | 20+ files tagged | 2026-01-22 |
| P2.5-010 | Tag documentation | 15+ files tagged | 2026-01-22 |
| P0-001 | Initialize Beacon | .context/ folder created | 2026-01-16 |
| P0-002 | Project analysis | `details/2026-01-16-project-analysis.md` | 2026-01-16 |
| P0-003 | Security audit | `details/2026-01-16-security-audit.md` - CLEAN | 2026-01-16 |
| P1-001 | Install dependencies | 1090 packages in node_modules/ | 2026-01-16 |
| P1-002 | Create .env file | DATABASE_URL configured | 2026-01-16 |
| P1-003 | Set up PostgreSQL | Docker container johnsonbros-db:5433 | 2026-01-16 |
| P1-004 | Push Drizzle schema | 25+ tables created | 2026-01-16 |
| P1-005 | Verify tables | Tables confirmed in database | 2026-01-16 |
| P1-006 | Start dev server | Server running on :5000 | 2026-01-16 |
| P1-007 | Test health endpoint | Returns {"status":"ok"} | 2026-01-16 |
| P1-009 | Frontend loads | Homepage renders at localhost:5000 | 2026-01-16 |
| Bonus | Upgrade .gitignore | 6 -> 140 lines (security) | 2026-01-16 |

---

## Related Documentation

| Document | Path | Summary |
|----------|------|---------|
| Project Analysis | `details/2026-01-16-project-analysis.md` | Full codebase breakdown, tech stack, features |
| Security Audit | `details/2026-01-16-security-audit.md` | Secrets scan - CLEAN |
| CLAUDE.md | `CLAUDE.md` | AI assistant development guide |
