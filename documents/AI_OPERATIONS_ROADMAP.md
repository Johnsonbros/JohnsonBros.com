# AI-First Operations Roadmap: Johnson Bros. Plumbing

This document outlines the strategic implementation plan for the multi-agent AI ecosystem.

## 1. JENNY: High-Fidelity Voice Agent (ElevenLabs)
**Goal:** Replace basic voice interaction with a best-in-class, natural conversational agent.

### Technical Architecture
- **Platform:** ElevenLabs Conversational AI + Twilio Native Integration.
- **Voice:** Custom-selected professional female voice (warm, authoritative, helpful).
- **Tooling:** Webhook bridge to our existing MCP server (Housecall Pro integration).
- **RAG:** Knowledge base populated with service pricing, membership details, and FAQs.

### Implementation Steps
1. **Infrastructure:** Configure ElevenLabs Agent with system prompt and knowledge base.
2. **Connectivity:** Provision a dedicated public Twilio number for JENNY.
3. **Integration:** Deploy `/api/voice/jessica/tools` endpoint to bridge ElevenLabs to HCP.
4. **Logic:** Implement fallback routing to Nate (ZEKE) for high-urgency/escalation scenarios.

---

## 2. ZEKE: The Supervisor (Admin Direct)
**Goal:** Maintain a secure, high-authority channel for co-founder/executive operations.

### Channel Strategy
- **Restricted Access:** Strictly gated to Admin Phone Number (+1 617-686-8763) and Admin Portal.
- **Temporal Awareness:** Real-time clock injection for relative date scheduling (tomorrow, next week).
- **Executive Memory:** Persistent database storage for cross-session context (remembers strategic decisions).

---

## 3. JESSICA: PR & Content Agent (Automated SEO)
**Goal:** Drive organic traffic through competitive intelligence and automated content refinement.

### Pipeline Workflow
1. **Crawl:** Weekly automated crawl of South Shore competitors (Trust1, Blue Bear, etc.).
2. **Draft:** Content generation targeting identified keyword gaps.
3. **Notify:** SMS notification to Admin with direct dashboard edit link.
4. **Refine:** Admin replies with feedback; Jessica auto-updates draft via SMS loop.

---

## 4. Operational Milestones (Q1 2026)

| Milestone | Agent | Status | Priority |
| :--- | :--- | :--- | :--- |
| **SMS Feedback Loop** | Jessica | **LIVE** | Completed |
| **Temporal Awareness** | Zeke | **LIVE** | Completed |
| **Admin Channel Gating** | Zeke | **LIVE** | Completed |
| **Voice Agent Migration** | Jenny | Planning | High |
| **Scheduled SEO Cron** | Jessica | Pending | Medium |
| **Executive Memory** | Zeke | Pending | Medium |

---

## 5. Security & Sovereignty
- **Data Sovereignty:** All customer data stays within Johnson Bros. Postgres/Housecall Pro.
- **Identity Gating:** All online bookings require SMS OTP verification.
- **Agent Separation:** Distinct Twilio numbers for Public (Jenny) vs. Operations (Zeke).
