
# Work Board

> **Updated**: 2026-01-26 | **Phase**: 3 - SEO & Local Ranking | **Status**: IN PROGRESS
> **Session**: 12 | **Key Achievement**: Bundle optimization (50% reduction), mobile usability, aOa tagging complete

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
| CAP-001 | Weekend mode | WEEKEND_EMERGENCY state (Fri 5PM - Mon 8AM) | capacity.ts + config | **Done** | 🟢 | - |
| CAP-002 | Holiday handling | HOLIDAY state with 2026 holidays list | capacity.ts + config | **Done** | 🟢 | - |
| CAP-003 | After-cutoff state | AFTER_CUTOFF for post-noon same-day | capacity.ts | **Done** | 🟢 | - |
| CAP-004 | Frontend banners | Capacity state banners in CapacityHero | CapacityHero.tsx | **Done** | 🟢 | - |
| CAL-001 | Admin calendar | Mirror HCP calendar in admin | /admin/calendar page | **Done** | 🟢 | - |
| P3-SEO-001 | Monitor keyword rankings | Track positions for 25 towns | Google Search Console + manual checks | **Done** | 🟢 | - |
| P3-SEO-002 | Build backlinks | Citations on local directories | Submit to Yelp, Angi, HomeAdvisor | **Strategy Ready** | 🟢 | GH |
| P3-SEO-004 | Submit sitemaps | Google/Bing indexing faster | Generate & submit XML sitemaps | **Done** | 🟢 | - |

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
| P3-SEO-002 | Build local citations | Listings on 10+ directories | Manual submissions | SEO-001 | **Strategy Ready** | 🟢 | - |
| P3-SEO-004 | XML sitemap update | sitemap.xml with all service pages | Generate + submit to GSC | SEO-001 | **Done** | 🟢 | - |
| P3-SEO-005 | Page speed optimization | Core Web Vitals green | Vite chunks + image compression | SEO-001 | **Bundle Done** | 🟢 | - |
| P3-SEO-006 | Mobile usability check | All pages mobile-friendly | Viewport, touch targets, padding | SEO-001 | **Done** | 🟢 | - |

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

## Phase 3: Integration Setup (Future)

| # | Task | Expected Output | Solution Pattern | Deps | Status | C | R |
|---|------|-----------------|------------------|------|--------|---|---|
| P3-001 | Configure HousecallPro | API key in .env | Get key from HCP dashboard | P2 complete | Backlog | 🟡 | GH |
| P3-002 | Configure OpenAI | API key in .env | Get key from OpenAI | P2 complete | Backlog | 🟢 | - |
| P3-003 | Configure Google Maps | API key in .env | Get key from GCP | P2 complete | Backlog | 🟡 | - |
| P3-004 | Configure Twilio | API keys in .env | Get keys from Twilio | P2 complete | Backlog | 🟡 | - |
| P3-005 | Test AI chat | Chat responds | Verify OpenAI integration | P3-002 | Backlog | 🟡 | - |
| P3-006 | Test booking flow | Booking creates job in HCP | Full integration test | P3-001 | Backlog | 🟡 | 131 |

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

| Component | Previous (Linux) | Current (Windows) |
|-----------|------------------|-------------------|
| Server | Running :5000 | ✅ Running :5000 |
| MCP Server | Running :3001 | ✅ Running :3001 (16 tools) |
| Database | Docker :5433 | ✅ Docker :5433 |
| Frontend | Running | ✅ Vite HMR active |
| Node.js | - | ✅ v22.19.0 |
| aOa | - | ✅ Local only (not containerized) |
| Docker Desktop | - | ✅ Running (disk space cleared) |

### API Integrations

| Integration | Status | Impact |
|-------------|--------|--------|
| HousecallPro | ✅ Configured | Capacity sync working |
| OpenAI | ✅ Configured | AI chat available |
| Google Maps | ✅ Configured | Maps & geocoding available |
| Twilio | ✅ Configured | SMS/voice available |
| Neon Database | ✅ Connected | Cloud PostgreSQL |

---

## Completed

| # | Task | Output | Completed |
|---|------|--------|-----------|
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
