# JohnsonBros - Current Session

> **Session**: 05 | **Date**: 2026-01-23
> **Phase**: 2 - Feature Verification (Tier 3) | **Status**: IN PROGRESS | **Confidence**: 🟢

---

## Now

Assets cleanup complete. Service page images added. Ready to commit changes and continue frontend verification.

## Active

| # | Task | Solution Pattern | C | R |
|---|------|------------------|---|---|
| P2-017 | Commit asset changes | `git add` + `git commit` | 🟢 | - |
| P2-010 | Homepage loads | Open http://localhost:5000 | 🟢 | - |
| P2-011 | Check console errors | Browser DevTools | 🟡 | - |

## Uncommitted Changes

**Modified:**
- `client/src/pages/services/drain-cleaning.tsx` - Updated asset imports

**New Assets (untracked):**
- `client/src/assets/cold-radiator.webp`
- `client/src/assets/cold-shower.jpg`
- `client/src/assets/dirty-sink.jpg`
- `client/src/assets/emergency.jpg`
- `client/src/assets/new-construction.jpg`
- `client/src/assets/plumbing.jpg`
- `client/src/assets/slow-drain.png`

## Completed This Session

- ✅ Board status review and update

## Completed Previous Session (04)

- ✅ Node.js v22.19.0 verified
- ✅ npm install (1304 packages)
- ✅ Docker PostgreSQL running (johnsonbros-db:5433)
- ✅ .env configured with all API keys
- ✅ Schema pushed to database
- ✅ Dev server running on :5000
- ✅ Health endpoint returns OK
- ✅ MCP server running on :3001 (16 tools)
- ✅ aOa integration complete (200+ files tagged)
- ✅ Fixed package.json for Windows (cross-env)

## Blocked

- None

## Next

1. **Commit asset changes** - Add new images and drain-cleaning update
2. **Start dev server** (`npm run dev`)
3. **Open http://localhost:5000** in browser
4. Test navigation and routing
5. Check browser console for errors

---

## Recent Git Activity

**Recent Commits (main branch):**
- `1fc8aef` - Fix asset imports after attached_assets cleanup
- `68f167a` - Fix startup issues: remove duplicate export, add dotenv
- `1c4b7d5` - Update start script for production
- `0f0efd7` - Housekeeping: Remove attached_assets bloat, update gitignore
- `c728d2c` - Resolve merge: accept remote deletions

**Summary**: Cleaned up bloated attached_assets folder, fixed asset imports to use client/src/assets, and resolved startup issues.

---

## Environment Notes

| Item | Linux (Previous) | Windows (Current) |
|------|------------------|-------------------|
| Working Dir | `/home/corey/projects/JohnsonBros` | `C:\Users\Workstation\Desktop\Replit\Github_TheJohnsonBros_cursor\JohnsonBros.com` |
| Node.js | Required | Verify installed |
| Docker | johnsonbros-db on :5433 | Need to verify/start |
| npm packages | 1090 installed | May need reinstall |

---

## Quick Commands (Windows)

```powershell
# Check Node.js
node --version

# Check npm
npm --version

v22.19.0(windows)

# Install dependencies (if needed)
npm install

PS C:\Users\Workstation\Desktop\Replit\Github_TheJohnsonBros_cursor\JohnsonBros.com> npm audit
# npm audit report

cookie  <0.7.0
cookie accepts cookie name, path, and domain with out of bounds characters - https://github.com/advisories/GHSA-pxg6-pf52-xh8x
fix available via `npm audit fix --force`
Will install csurf@1.2.2, which is a breaking change
node_modules/csurf/node_modules/cookie
  csurf  >=1.3.0
  Depends on vulnerable versions of cookie
  node_modules/csurf

esbuild  <=0.24.2
Severity: moderate
esbuild enables any website to send any requests to the development server and read the response - https://github.com/advisories/GHSA-67mh-4wv8-2f99
fix available via `npm audit fix --force`
Will install vite@7.3.1, which is a breaking change
node_modules/@esbuild-kit/core-utils/node_modules/esbuild
node_modules/drizzle-kit/node_modules/esbuild
node_modules/vite/node_modules/esbuild
  @esbuild-kit/core-utils  *
  Depends on vulnerable versions of esbuild
  node_modules/@esbuild-kit/core-utils
    @esbuild-kit/esm-loader  *
    Depends on vulnerable versions of @esbuild-kit/core-utils
    node_modules/@esbuild-kit/esm-loader
      drizzle-kit  0.9.1 - 0.9.54 || 0.12.9 - 1.0.0-beta.1-fd8bfcc
      Depends on vulnerable versions of @esbuild-kit/esm-loader
      Depends on vulnerable versions of esbuild
      node_modules/drizzle-kit
  vite  0.11.0 - 6.1.6
  Depends on vulnerable versions of esbuild
  node_modules/vite
    vite-node  <=2.2.0-beta.2
    Depends on vulnerable versions of vite
    node_modules/vite-node
      vitest  0.0.1 - 0.0.12 || 0.0.29 - 0.0.122 || 0.3.3 - 2.2.0-beta.2
      Depends on vulnerable versions of vite
      Depends on vulnerable versions of vite-node
      node_modules/vitest

lodash  4.0.0 - 4.17.21
Severity: moderate
Lodash has Prototype Pollution Vulnerability in `_.unset` and `_.omit` functions - https://github.com/advisories/GHSA-xxjr-mmjv-4gpg
fix available via `npm audit fix --force`
Will install openmcp@0.0.0, which is a breaking change
node_modules/lodash
  @openai/apps-sdk-ui  *
  Depends on vulnerable versions of lodash
  node_modules/@openai/apps-sdk-ui
  postman-collection  >=0.5.1
  Depends on vulnerable versions of lodash
  node_modules/postman-collection
    @stoplight/http-spec  2.5.8 - 7.1.0
    Depends on vulnerable versions of postman-collection
    node_modules/@stoplight/http-spec
      @openmcp/openapi  >=0.0.1
      Depends on vulnerable versions of @stoplight/http-spec
      node_modules/@openmcp/openapi
      openmcp  >=0.0.1
      Depends on vulnerable versions of @openmcp/openapi
      Depends on vulnerable versions of @stoplight/http-spec
      node_modules/openmcp

15 vulnerabilities (2 low, 13 moderate)

To address issues that do not require attention, run:
  npm audit fix

To address all issues possible (including breaking changes), run:
  npm audit fix --force

Some issues need review, and may require choosing
a different dependency.

# Check Docker
docker ps

PS C:\Users\Workstation\Desktop\Replit\Github_TheJohnsonBros_cursor\JohnsonBros.com> docker ps
CONTAINER ID   IMAGE            COMMAND                  CREATED       STATUS       PORTS                                         NAMES
6a99826256c8   postgres:15      "docker-entrypoint.s…"   3 hours ago   Up 3 hours   0.0.0.0:5433->5432/tcp, [::]:5433->5432/tcp   johnsonbros-db
9128f415351b   aoa-gateway      "python gateway.py"      4 days ago    Up 4 hours   0.0.0.0:8080->8080/tcp, [::]:8080->8080/tcp   aoa-gateway-1
b0b0140b8bcc   aoa-index        "python indexer.py"      4 days ago    Up 4 hours   9999/tcp                                      aoa-index-1
7cbf31dec8d3   aoa-status       "python status_servi…"   4 days ago    Up 4 hours   9998/tcp                                      aoa-status-1
825658b70f81   redis:7-alpine   "docker-entrypoint.s…"   4 days ago    Up 4 hours   6379/tcp                                      aoa-redis-1
5c25b2294a35   aoa-proxy        "python git_proxy.py"    4 days ago    Up 4 hours                                                 aoa-proxy-1
b5ea9e16a6ed   c9cacfe3c67b     "python git_proxy.py"    4 days ago    Up 4 hours                                                 wizardly_shockley

# Start database (if Docker available)
docker run --name johnsonbros-db -e POSTGRES_USER=johnsonbros -e POSTGRES_PASSWORD=johnsonbros -e POSTGRES_DB=johnsonbros -p 5433:5432 -d postgres:15

PS C:\Users\Workstation\Desktop\Replit\Github_TheJohnsonBros_cursor\JohnsonBros.com> docker run --name johnsonbros-db -e POSTGRES_USER=johnsonbros -e POSTGRES_PASSWORD=johnsonbros -e POSTGRES_DB=johnsonbros -p 5433:5432 -d postgres:15
docker: Error response from daemon: Conflict. The container name "/johnsonbros-db" is already in use by container "6a99826256c86cee982073a7f91dd67fcb6ebbf4d329e06841eda65ec2ad1e8b". You have to remove (or rename) that container to be able to reuse that name.

Run 'docker run --help' for more information

# Start dev server
npm run dev

# Check health
curl http://localhost:5000/health
```

---

## Key Files

| Purpose | Path |
|---------|------|
| Schema | `shared/schema.ts` |
| Server entry | `server/index.ts` |
| Frontend entry | `client/src/App.tsx` |
| DB config | `drizzle.config.ts` |
| Env template | `.env.example` |
| Project docs | `CLAUDE.md` |

---

## Related Docs

| Doc | Purpose |
|-----|---------|
| [BOARD.md](BOARD.md) | Full work breakdown with traffic lights |
| [details/2026-01-16-project-analysis.md](details/2026-01-16-project-analysis.md) | Codebase deep-dive |
| [details/2026-01-16-security-audit.md](details/2026-01-16-security-audit.md) | Security scan - CLEAN |

---

## Resume Command

```powershell
cd C:\Users\Workstation\Desktop\Replit\Github_TheJohnsonBros_cursor\JohnsonBros.com
npm run dev
# Then open http://localhost:5000
```
