# Backlog

> **Updated**: 2026-01-23

---

## Parked Items

Items moved here have enough context to pick up later but are not actively planned.

| # | Task | Context | Parked Date | Why Parked |
|---|------|---------|-------------|------------|
| B-001 | Review TEST_COVERAGE_ANALYSIS.md | Testing priorities documented | 2026-01-16 | Focus on MVP first |
| B-002 | Review PRODUCTION_READINESS_CHECKLIST.md | Deployment prep checklist | 2026-01-16 | Not deploying yet |

---

## Future Phases

### Phase 4: Production Hardening

| # | Task | Context |
|---|------|---------|
| P4-001 | SSL/TLS certificates | Needed for HTTPS in production |
| P4-002 | Environment variable audit | Ensure all secrets properly managed |
| P4-003 | Rate limiting verification | Confirm limits are appropriate |
| P4-004 | Sentry error tracking | Configure for production monitoring |
| P4-005 | Database backup strategy | Set up automated backups |

### Phase 5: Testing

| # | Task | Context |
|---|------|---------|
| P5-001 | Unit tests for capacity.ts | Business-critical calculations |
| P5-002 | Unit tests for housecall.ts | Integration with HousecallPro |
| P5-003 | Integration tests for booking flow | End-to-end booking verification |
| P5-004 | E2E tests with Playwright | Full user journey testing |

---

## Ideas / Future Consideration

- Performance profiling and optimization
- CDN setup for static assets
- Load testing before production launch
- Mobile responsiveness audit
- Accessibility (a11y) review
- SEO audit and optimization
- Analytics review (Google Analytics integration)

---

## Technical Debt

| Item | Location | Priority |
|------|----------|----------|
| Test coverage near zero | `TEST_COVERAGE_ANALYSIS.md` | High |
| MCP server as child process | Could be separate service | Low |
| npm audit vulnerabilities | 15 vulnerabilities (2 low, 13 moderate) | Medium |
| Service page images need optimization | `client/src/assets/` | Low |

---

## Notes

Add items here when they're discovered but not immediately actionable.

- The project has comprehensive documentation in `CLAUDE.md`
- Full codebase analysis in `.context/details/2026-01-16-project-analysis.md`
- Security audit (clean) in `.context/details/2026-01-16-security-audit.md`
