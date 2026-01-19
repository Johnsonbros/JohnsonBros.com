# ZEKE Implementation Plan: Unified AI Business Supervisor

## 1. Overview
This document outlines the strategy for formalizing **ZEKE** as the central AI identity for Johnson Bros. Plumbing & Drain Cleaning. ZEKE will serve as the front-line Customer Service Representative, behind-the-scenes coordinator, and business supervisor.

## 2. Core Strategy
- **Identity Unification**: Replace disparate AI personas with a single "ZEKE" identity defined in a central configuration.
- **Contextual Memory**: Implement a database-backed memory system to link interactions (SMS, Voice, Chat) to customer profiles.
- **Dual MCP Architecture**: Maintain a Public MCP for customers and an Internal MCP (Full HCP API) for authorized admins.
- **Observability**: Log every interaction for KPI tracking (Resolution Rate, Conversion, Sentiment).

---

## 3. Architecture & File Changes

### A. Identity & Prompting
| File | Change | Why |
|------|--------|-----|
| `config/zeke.ts` | **Create** | Centralize personality, guardrails, and authority structure. |
| `server/lib/zekePrompt.ts` | **Create** | Dynamic prompt generator for different channels (SMS/Voice/Chat). |
| `server/lib/aiChat.ts` | **Edit** | Replace `SYSTEM_PROMPT` with ZEKE's identity. |
| `server/lib/realtimeVoice.ts`| **Edit** | Replace "Jenny" with ZEKE. |

### B. Memory & Context
| File | Change | Why |
|------|--------|-----|
| `shared/schema.ts` | **Edit** | Add `conversations`, `interaction_logs`, and `customer_context` tables. |
| `server/lib/memory.ts` | **Create** | Logic for identity resolution (phone -> customer) and context retrieval. |
| `server/lib/summarizer.ts` | **Create** | Background service to condense conversations for future context injection. |

### C. Internal Systems & Security
| File | Change | Why |
|------|--------|-----|
| `server/lib/internalMcp.ts` | **Create** | Internal-only MCP server with full Housecall Pro API access. |
| `server/lib/adminSms.ts` | **Edit** | Connect admin commands to Internal MCP tools. |
| `server/lib/authMiddleware.ts`| **Create** | Secure access to internal MCP based on admin phone/session. |

---

## 4. Implementation Phases

### Phase 1: Identity & Foundation (Days 1-2)
- [ ] Create `config/zeke.ts` with persona and guardrails.
- [ ] Implement `zekePrompt.ts` generator.
- [ ] Update database schema for memory and logging.
- [ ] Update SMS and Voice agents to use the "ZEKE" persona.

### Phase 2: Contextual Memory System (Days 3-4)
- [ ] Build Identity Resolution service.
- [ ] Implement interaction logging for all channels.
- [ ] Create context injection layer for LLM calls.
- [ ] Implement conversation summarization.

### Phase 3: Internal Supervisor Tools (Days 5-6)
- [ ] Set up Internal MCP server at `/api/v1/mcp/internal`.
- [ ] Integrate full Housecall Pro YAML operations.
- [ ] Build admin routing logic in `adminSms.ts`.
- [ ] Add audit logging for internal operations.

### Phase 4: Analytics & KPI Dashboard (Days 7-8)
- [ ] Build KPI calculation logic (Resolution, Conversion, Sentiment).
- [ ] Create Admin Dashboard views for ZEKE analytics.
- [ ] Final end-to-end testing and refinement.

---

## 5. Security & Guardrails
- **Public vs Private**: Explicit separation between customer-facing tools and admin-facing tools.
- **Authorization**: Phone-based auth for SMS, session-based for web dashboard.
- **Human-in-the-Loop**: ZEKE automatically escalates to Nate for complaints or high-value refund requests.
