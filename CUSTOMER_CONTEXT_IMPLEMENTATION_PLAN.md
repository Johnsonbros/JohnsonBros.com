# Unified Customer Context & Memory Layer: Implementation Plan

**Version:** 1.0  
**Date:** January 2026  
**Author:** Agent (CTO Co-Founder)

---

## Executive Summary

This document provides a complete technical specification for implementing the Unified Customer Context & Memory Layer. The goal is to create a single source of truth for customer information that persists across all AI channels (web chat, SMS, voice, MCP server) and integrates with HousecallPro.

**Key Benefits:**
- Seamless cross-channel conversations (start on SMS, continue on web)
- AI that "remembers" customer history, preferences, and property details
- Proactive insights for upselling and retention
- 50% cost reduction via Batch API for non-real-time operations

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Phase 1: Database Schema Extensions](#2-phase-1-database-schema-extensions)
3. [Phase 2: Customer Context Service](#3-phase-2-customer-context-service)
4. [Phase 3: HousecallPro Bidirectional Sync](#4-phase-3-housecallpro-bidirectional-sync)
5. [Phase 4: AI Context Injection](#5-phase-4-ai-context-injection)
6. [Phase 5: Semantic Memory & Batch Processing](#6-phase-5-semantic-memory--batch-processing)
7. [Phase 6: Proactive Insight Generation](#7-phase-6-proactive-insight-generation)
8. [Phase 7: API & Admin Dashboard](#8-phase-7-api--admin-dashboard)
9. [Phase 8: Testing & Validation](#9-phase-8-testing--validation)
10. [Migration Strategy](#10-migration-strategy)
11. [Cost Analysis](#11-cost-analysis)

---

## 1. Current State Analysis

### Existing Infrastructure (Already Built)

| Component | File | Purpose | Lines of Code |
|-----------|------|---------|---------------|
| `sharedThreadCustomers` | `shared/schema.ts:223-230` | Basic customer records with `summary`, `currentIssueSummary` | 8 lines |
| `sharedThreadIdentities` | `shared/schema.ts:232-243` | Identity linking (phone, web_user_id) with verification | 12 lines |
| `sharedThreadThreads` | `shared/schema.ts:245-256` | Thread management per customer | 12 lines |
| `sharedThreadMessages` | `shared/schema.ts:258-268` | Conversation history storage | 11 lines |
| `sharedThread.ts` | `server/lib/sharedThread.ts` | Identity resolution, memory compression, customer merging | 505 lines |
| Web Chat AI | `server/lib/aiChat.ts` | OpenAI Responses API with MCP tools | 507 lines |
| SMS Agent | `server/lib/smsBookingAgent.ts` | OpenAI Agents SDK for SMS conversations | 677 lines |
| Voice Agent | `server/lib/realtimeVoice.ts` | OpenAI Realtime API for voice calls | 389 lines |
| MCP Server | `src/booker.ts` | Tool definitions for AI assistants | 3822 lines |
| HCP Client | `server/src/housecall.ts` | HousecallPro API wrapper with retry/circuit breaker | 643 lines |

### Gaps to Address

| Gap | Impact | Priority |
|-----|--------|----------|
| No HousecallPro customer/job sync to shared context | AI doesn't know service history | Critical |
| No property/equipment tracking | Can't suggest maintenance or replacements | High |
| Context only has `summary` + `currentIssueSummary` | Missing structured data (addresses, preferences) | High |
| No real-time context injection into all AI prompts | Channels operate semi-independently | High |
| No proactive insights | Missing upsell/retention opportunities | Medium |
| No semantic search of conversation history | Can't find relevant past discussions | Medium |

---

## 2. Phase 1: Database Schema Extensions

### File: `shared/schema.ts`

#### 2.1 Add `customerContext` Table

**Location:** After line 281 (after `sharedThreadPendingLinks`)

```typescript
// Customer Context - Rich profile linked to HousecallPro
export const customerContext = pgTable('customer_context', {
  id: uuid('id').defaultRandom().primaryKey(),
  sharedThreadCustomerId: uuid('shared_thread_customer_id')
    .references(() => sharedThreadCustomers.id)
    .unique(),
  housecallProId: text('housecall_pro_id').unique(), // UNIQUE constraint for upsert
  
  // Identity fields
  firstName: text('first_name'),
  lastName: text('last_name'),
  email: text('email'),
  primaryPhone: text('primary_phone'),
  
  // Preferences
  preferredTechnicianId: text('preferred_technician_id'),
  preferredTechnicianName: text('preferred_technician_name'),
  communicationPreference: text('communication_preference').default('any'), // 'sms', 'call', 'email', 'any'
  preferredTimeWindow: text('preferred_time_window'), // 'morning', 'afternoon', 'evening'
  
  // Membership & Value
  membershipStatus: text('membership_status').default('none'), // 'none', 'family_discount', 'vip'
  membershipExpiresAt: timestamp('membership_expires_at'),
  lifetimeValue: real('lifetime_value').default(0),
  totalJobs: integer('total_jobs').default(0),
  
  // Tags from HCP
  tags: text('tags').array(),
  leadSource: text('lead_source'),
  
  // Sync metadata
  lastHcpSyncAt: timestamp('last_hcp_sync_at'),
  hcpSyncError: text('hcp_sync_error'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  sharedThreadCustomerIdx: uniqueIndex('ctx_shared_thread_customer_idx').on(table.sharedThreadCustomerId),
  housecallProIdx: index('ctx_housecall_pro_idx').on(table.housecallProId),
  phoneIdx: index('ctx_phone_idx').on(table.primaryPhone),
  emailIdx: index('ctx_email_idx').on(table.email),
}));
```

#### 2.2 Extend `customer_addresses` Table (Existing)

**IMPORTANT:** Do NOT create a new `customerProperties` table. Instead, extend the existing `customer_addresses` table with equipment/property columns.

See the ADDENDUM at the end of this document for the complete migration SQL and updated schema.

#### 2.3 Add `customerJobHistory` Table

```typescript
// Customer Job History - Synced from HousecallPro
export const customerJobHistory = pgTable('customer_job_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerContextId: uuid('customer_context_id')
    .notNull()
    .references(() => customerContext.id),
  // Link to customer_addresses via HCP address ID (crosswalk)
  housecallProAddressId: text('housecall_pro_address_id'),
  housecallProJobId: text('housecall_pro_job_id').notNull().unique(),
  
  // Job details
  invoiceNumber: text('invoice_number'),
  serviceType: text('service_type'),
  description: text('description'),
  notes: text('notes'), // Technician notes
  
  // Timing
  scheduledDate: timestamp('scheduled_date'),
  completedDate: timestamp('completed_date'),
  workStatus: text('work_status'), // 'completed', 'canceled', etc.
  
  // Financials
  totalAmount: real('total_amount'),
  outstandingBalance: real('outstanding_balance'),
  
  // Technician
  technicianId: text('technician_id'),
  technicianName: text('technician_name'),
  
  // Line items (equipment installed, parts used)
  lineItems: json('line_items'), // Array of { name, quantity, price }
  
  // Customer feedback
  customerRating: integer('customer_rating'), // 1-5
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  customerContextIdx: index('job_customer_context_idx').on(table.customerContextId),
  completedDateIdx: index('job_completed_date_idx').on(table.completedDate),
  hcpJobIdx: uniqueIndex('job_hcp_job_idx').on(table.housecallProJobId),
}));
```

#### 2.4 Add `customerInsights` Table

```typescript
// Customer Insights - AI-generated proactive recommendations
export const customerInsights = pgTable('customer_insights', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerContextId: uuid('customer_context_id')
    .notNull()
    .references(() => customerContext.id),
  
  insightType: text('insight_type').notNull(), // 'equipment_replacement', 'maintenance_due', 'upsell_membership', 'churn_risk', 'review_request'
  priority: text('priority').default('medium'), // 'low', 'medium', 'high', 'urgent'
  
  // Content
  title: text('title').notNull(),
  description: text('description').notNull(),
  suggestedAction: text('suggested_action'),
  
  // Metadata
  insightData: json('insight_data'), // Type-specific structured data
  confidence: real('confidence'), // 0-1 confidence score
  
  // Status
  status: text('status').default('active'), // 'active', 'actioned', 'dismissed', 'expired'
  actionedAt: timestamp('actioned_at'),
  actionedBy: text('actioned_by'), // 'ai_chat', 'admin', 'sms_agent'
  dismissedReason: text('dismissed_reason'),
  
  // Expiry
  expiresAt: timestamp('expires_at'),
  
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  customerContextIdx: index('insight_customer_context_idx').on(table.customerContextId),
  typeIdx: index('insight_type_idx').on(table.insightType),
  statusIdx: index('insight_status_idx').on(table.status),
  priorityIdx: index('insight_priority_idx').on(table.priority),
}));
```

#### 2.5 Add `conversationEmbeddings` Table

```typescript
// Conversation Embeddings - For semantic memory search
export const conversationEmbeddings = pgTable('conversation_embeddings', {
  id: uuid('id').defaultRandom().primaryKey(),
  messageId: uuid('message_id')
    .notNull()
    .references(() => sharedThreadMessages.id),
  
  // Embedding vector (stored as array of floats)
  // Note: For production, consider pgvector extension
  embedding: real('embedding').array(),
  embeddingModel: text('embedding_model').default('text-embedding-3-small'),
  
  // Semantic classification
  semanticCategory: text('semantic_category'), // 'issue_report', 'booking_request', 'price_inquiry', 'feedback', 'general'
  
  // Extracted entities
  extractedEntities: json('extracted_entities'), // { addresses: [], services: [], dates: [] }
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  messageIdx: uniqueIndex('emb_message_idx').on(table.messageId),
  categoryIdx: index('emb_category_idx').on(table.semanticCategory),
}));
```

#### 2.6 Add `batchJobs` Table (for Batch API)

```typescript
// Batch Jobs - Track OpenAI Batch API requests
export const batchJobs = pgTable('batch_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  openAiBatchId: text('openai_batch_id'),
  
  jobType: text('job_type').notNull(), // 'embeddings', 'insights', 'memory_compression', 'profile_enrichment'
  status: text('status').default('pending'), // 'pending', 'submitted', 'processing', 'completed', 'failed'
  
  // Input/Output
  inputFileId: text('input_file_id'),
  outputFileId: text('output_file_id'),
  errorFileId: text('error_file_id'),
  
  // Counts
  totalRequests: integer('total_requests').default(0),
  completedRequests: integer('completed_requests').default(0),
  failedRequests: integer('failed_requests').default(0),
  
  // Timing
  submittedAt: timestamp('submitted_at'),
  completedAt: timestamp('completed_at'),
  expiresAt: timestamp('expires_at'),
  
  // Error handling
  errorMessage: text('error_message'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  openAiBatchIdx: index('batch_openai_batch_idx').on(table.openAiBatchId),
  jobTypeIdx: index('batch_job_type_idx').on(table.jobType),
  statusIdx: index('batch_status_idx').on(table.status),
}));
```

#### 2.7 Add Insert Schemas and Types

```typescript
// Insert schemas
export const insertCustomerContextSchema = createInsertSchema(customerContext).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Note: customerProperties table removed - use extended customer_addresses instead

export const insertCustomerJobHistorySchema = createInsertSchema(customerJobHistory).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerInsightSchema = createInsertSchema(customerInsights).omit({
  id: true,
  createdAt: true,
  generatedAt: true,
});

export const insertConversationEmbeddingSchema = createInsertSchema(conversationEmbeddings).omit({
  id: true,
  createdAt: true,
});

export const insertBatchJobSchema = createInsertSchema(batchJobs).omit({
  id: true,
  createdAt: true,
});

// Types
export type CustomerContext = typeof customerContext.$inferSelect;
export type InsertCustomerContext = z.infer<typeof insertCustomerContextSchema>;

// Note: CustomerProperty type removed - use extended CustomerAddress instead

export type CustomerJobHistory = typeof customerJobHistory.$inferSelect;
export type InsertCustomerJobHistory = z.infer<typeof insertCustomerJobHistorySchema>;

export type CustomerInsight = typeof customerInsights.$inferSelect;
export type InsertCustomerInsight = z.infer<typeof insertCustomerInsightSchema>;

export type ConversationEmbedding = typeof conversationEmbeddings.$inferSelect;
export type InsertConversationEmbedding = z.infer<typeof insertConversationEmbeddingSchema>;

export type BatchJob = typeof batchJobs.$inferSelect;
export type InsertBatchJob = z.infer<typeof insertBatchJobSchema>;
```

#### 2.8 Add Relations

```typescript
// Relations for Customer Context
export const customerContextRelations = relations(customerContext, ({ one, many }) => ({
  sharedThreadCustomer: one(sharedThreadCustomers, {
    fields: [customerContext.sharedThreadCustomerId],
    references: [sharedThreadCustomers.id],
  }),
  // Note: properties come from extended customer_addresses table via housecallProId crosswalk
  jobHistory: many(customerJobHistory),
  insights: many(customerInsights),
}));

export const customerJobHistoryRelations = relations(customerJobHistory, ({ one }) => ({
  customerContext: one(customerContext, {
    fields: [customerJobHistory.customerContextId],
    references: [customerContext.id],
  }),
  // Address lookup via housecallProAddressId -> customer_addresses.housecall_pro_address_id
}));

export const customerInsightRelations = relations(customerInsights, ({ one }) => ({
  customerContext: one(customerContext, {
    fields: [customerInsights.customerContextId],
    references: [customerContext.id],
  }),
}));
```

#### 2.9 Identifier & Constraint Strategy

| Table | Unique Constraint | Purpose |
|-------|-------------------|---------|
| `customerContext` | `housecallProId` | Enables upsert on HCP sync |
| `customerContext` | `sharedThreadCustomerId` | One context per shared thread customer |
| `customerJobHistory` | `housecallProJobId` | Prevents duplicate job records |
| `customer_addresses` | `housecall_pro_address_id` (unique index via migration) | Links addresses to HCP + required for upserts |
| `conversationEmbeddings` | `messageId` | One embedding per message |

**ID Reconciliation Strategy:**
1. When syncing from HCP, always store `housecallProId` on `customerContext` and `housecall_pro_address_id` on `customer_addresses`
2. When looking up addresses for job history, use `housecallProAddressId` to find the matching `customer_addresses` record
3. When merging sharedThread customers, preserve the HCP IDs and update foreign keys accordingly

### Migration Files: `migrations/0002_customer_context.sql` and `migrations/0003_extend_customer_addresses.sql`

Create a migration for the new context/history/insights/batch tables, and a second migration to extend
`customer_addresses`. This avoids a numbering collision with the existing `0001_shared_thread_persistence.sql`
and keeps address extensions isolated for easier rollback.

---

## 3. Phase 2: Customer Context Service

### New File: `server/lib/customerContextService.ts`

This is the core service that aggregates customer data from all sources.

```typescript
// Structure outline - not full implementation

export interface FullCustomerContext {
  // Identity
  customerId: string; // sharedThreadCustomers.id
  housecallProId: string | null;
  identities: { type: string; value: string; verified: boolean }[];
  
  // Profile
  name: string | null;
  email: string | null;
  primaryPhone: string | null;
  
  // Preferences
  preferredTechnician: { id: string; name: string } | null;
  communicationPreference: string;
  preferredTimeWindow: string | null;
  
  // Membership
  membership: {
    status: 'none' | 'family_discount' | 'vip';
    expiresAt: Date | null;
  };
  
  // Value
  lifetimeValue: number;
  totalJobs: number;
  
  // Properties (addresses with equipment)
  properties: {
    id: string;
    address: string;
    propertyType: string | null;
    equipment: {
      waterHeater: { type: string; age: number; brand: string } | null;
    };
    knownIssues: string[];
    lastServiceDate: Date | null;
  }[];
  
  // Recent job history (last 5)
  recentJobs: {
    id: string;
    date: Date;
    serviceType: string;
    description: string;
    technicianName: string | null;
    amount: number;
  }[];
  
  // Active insights
  insights: {
    id: string;
    type: string;
    title: string;
    description: string;
    priority: string;
  }[];
  
  // Conversation context
  conversationSummary: string | null;
  currentIssueSummary: string | null;
}

export class CustomerContextService {
  // Core retrieval
  async getFullContext(params: {
    identityType: 'phone' | 'email' | 'web_user_id' | 'housecall_pro_id';
    identityValue: string;
  }): Promise<FullCustomerContext | null>;
  
  // Sync operations
  async syncFromHousecallPro(housecallProId: string): Promise<void>;
  async refreshJobHistory(customerContextId: string): Promise<void>;
  
  // Profile enrichment
  async enrichFromConversation(customerId: string, messageText: string): Promise<void>;
  
  // Context formatting for AI
  buildContextPrompt(context: FullCustomerContext): string;
  
  // Caching
  private contextCache: Map<string, { context: FullCustomerContext; expiresAt: number }>;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
}
```

### Key Functions to Implement

#### 3.1 `getFullContext()`

**Logic:**
1. Look up `sharedThreadIdentities` by type/value
2. Get `sharedThreadCustomers` record
3. Get or create `customerContext` record
4. If `housecallProId` exists and `lastHcpSyncAt` is stale (>1 hour), trigger background sync
5. Query `customer_addresses` (extended with equipment columns) via `housecallProId` crosswalk
6. Query last 5 `customerJobHistory` records
7. Query active `customerInsights`
8. Build and return `FullCustomerContext`

#### 3.2 `buildContextPrompt()`

**Output format:**
```
## Customer Profile
Name: John Smith
Phone: (617) 555-1234
Email: john@example.com
Customer since: March 2022
Lifetime value: $2,450 (8 jobs)
Membership: Family Discount (expires Dec 2025)

## Properties
1. 123 Main St, Quincy, MA 02169
   - Water heater: Tank, 12 years old (Rheem) - RECOMMEND REPLACEMENT
   - Known issues: Tree roots in sewer line
   - Last service: Drain cleaning, Nov 2024

## Recent Service History
- Nov 2024: Drain cleaning - $189
- Aug 2024: Faucet repair - $145
- Mar 2024: Water heater flush - $99

## Active Recommendations
- [HIGH] Water heater is 12 years old - suggest replacement quote
- [MEDIUM] Annual drain maintenance due

## Conversation Summary
Regular customer who prefers morning appointments. Had root intrusion issue last year.
```

---

## 4. Phase 3: HousecallPro Bidirectional Sync

### New File: `server/lib/housecallProSync.ts`

#### 4.1 `syncCustomerFromHCP()`

**Input:** HousecallPro customer ID  
**Process:**
1. Call HCP API: `GET /customers/{customer_id}`
2. Call HCP API: `GET /customers/{customer_id}/addresses`
3. Upsert `customerContext` with profile data
4. Upsert `customer_addresses` for each address (using `housecall_pro_address_id` for conflict resolution)
5. Set `lastHcpSyncAt` timestamp

**HCP Data Mapping:**
| HCP Field | Our Field |
|-----------|-----------|
| `first_name` | `firstName` |
| `last_name` | `lastName` |
| `email` | `email` |
| `mobile_number` | `primaryPhone` |
| `tags` | `tags` |
| `lead_source` | `leadSource` |
| `addresses[].id` | `housecallProAddressId` |
| `addresses[].street` | `street` |

#### 4.2 `syncJobHistory()`

**Input:** Customer context ID  
**Process:**
1. Get `housecallProId` from `customerContext`
2. Call HCP API: `GET /jobs?customer_id={id}&page_size=20&sort_direction=desc`
3. For each job:
   - Upsert `customerJobHistory`
   - Extract equipment from `line_items` (water heater, etc.)
   - Update `customer_addresses.lastServiceDate` (via `housecall_pro_address_id` lookup)
4. Calculate `lifetimeValue` from sum of `total_amount`
5. Update `customerContext.totalJobs` and `lifetimeValue`

#### 4.3 `parseEquipmentFromJobNotes()`

**Purpose:** Extract equipment details from job notes/line items using pattern matching.

**Patterns to detect:**
- Water heater: "installed 50 gallon Rheem tank water heater"
- Age mentions: "water heater is approximately 10-12 years old"
- Issues: "found tree roots in main sewer line"

#### 4.4 Webhook Handler: existing `/webhooks/housecall` endpoint

**Files:** `server/routes.ts` (route registration) and `server/src/webhooks.ts` (processing)

**Why this correction?** The repo already exposes the Housecall Pro webhook endpoint at
`/webhooks/housecall` and routes events through `WebhookProcessor.processWebhookEvent()`. Adding a new
`/api/webhooks/housecallpro` endpoint would duplicate logic and bypass signature verification.

**Events to handle inside `WebhookProcessor.processEventAsync()`:**
- `job.completed` → Trigger `syncJobHistory()`, update property's `lastServiceDate`
- `customer.updated` → Trigger `syncCustomerFromHCP()`

---

## 5. Phase 4: AI Context Injection

### 5.1 Modify `server/lib/aiChat.ts`

**Current state (line 316-333):**
```typescript
function buildSystemPrompt(
  channel: 'web' | 'sms' | 'voice',
  context?: { summary?: string | null; currentIssueSummary?: string | null },
): string {
  let prompt = getChannelPrompt(channel);
  if (context?.summary || context?.currentIssueSummary) {
    prompt += `\n\n## Customer Memory\n`;
    // ... basic context
  }
  return prompt;
}
```

**Change to:**
```typescript
import { CustomerContextService, FullCustomerContext } from './customerContextService';

const contextService = new CustomerContextService();

function buildSystemPrompt(
  channel: 'web' | 'sms' | 'voice',
  context?: { 
    summary?: string | null; 
    currentIssueSummary?: string | null;
    fullContext?: FullCustomerContext | null;  // NEW
  },
): string {
  let prompt = getChannelPrompt(channel);
  
  // Inject rich customer context if available
  if (context?.fullContext) {
    prompt += `\n\n${contextService.buildContextPrompt(context.fullContext)}`;
  } else if (context?.summary || context?.currentIssueSummary) {
    // Fallback to basic context
    prompt += `\n\n## Customer Memory\n`;
    if (context.summary) {
      prompt += `Customer summary: ${context.summary}\n`;
    }
    if (context.currentIssueSummary) {
      prompt += `Current issue summary: ${context.currentIssueSummary}\n`;
    }
  }
  
  return prompt;
}
```

**Modify `processChat()` (line 345-496):**

Add context retrieval at the start:
```typescript
export async function processChat(
  sessionId: string, 
  userMessage: string,
  channel: 'web' | 'sms' | 'voice' = 'web',
  context?: {
    summary?: string | null;
    currentIssueSummary?: string | null;
    recentMessages?: ChatMessage[];
    identityType?: 'phone' | 'web_user_id';  // NEW
    identityValue?: string;                   // NEW
  }
): Promise<ChatResponse> {
  // NEW: Retrieve full customer context if identity provided
  let fullContext: FullCustomerContext | null = null;
  if (context?.identityType && context?.identityValue) {
    try {
      fullContext = await contextService.getFullContext({
        identityType: context.identityType,
        identityValue: context.identityValue,
      });
    } catch (error) {
      Logger.warn('[Chat] Failed to load customer context', { error });
    }
  }
  
  const systemPrompt = buildSystemPrompt(channel, {
    ...context,
    fullContext,
  });
  
  // ... rest of function
}
```

### 5.2 Modify `server/lib/smsBookingAgent.ts`

**Current state (line 131-170):** `createSmsAgent()` has static system instruction.

**Change:** Add context parameter to `createSmsAgent()`:

```typescript
async function createSmsAgent(customerContext?: FullCustomerContext): Promise<OpenAIAgent> {
  let systemInstruction = `You are a friendly, professional AI assistant for Johnson Bros. Plumbing...`;
  
  // Inject customer context if available
  if (customerContext) {
    systemInstruction += `\n\n${contextService.buildContextPrompt(customerContext)}`;
  }
  
  const agent = new OpenAIAgent({
    model: 'gpt-4o',
    system_instruction: systemInstruction,
    temperature: 0.7,
    max_completion_tokens: 300
  });

  return agent;
}
```

**Modify `handleIncomingSms()` (around line 450):**

Before processing, look up customer by phone:
```typescript
export async function handleIncomingSms(phoneNumber: string, message: string): Promise<string> {
  const normalizedPhone = formatPhoneNumber(phoneNumber);
  
  // NEW: Get customer context by phone
  let customerContext: FullCustomerContext | null = null;
  try {
    customerContext = await contextService.getFullContext({
      identityType: 'phone',
      identityValue: normalizedPhone,
    });
  } catch (error) {
    Logger.warn('[SMS] Failed to load customer context', { error, phone: normalizedPhone });
  }
  
  // Pass context to agent
  const agent = await createSmsAgent(customerContext);
  
  // ... rest of function
}
```

### 5.3 Modify `server/lib/realtimeVoice.ts`

**Current state (line 44-77):** Static `VOICE_SYSTEM_INSTRUCTIONS`.

**Change:** Make instructions dynamic based on caller ID:

```typescript
async function getVoiceInstructions(callerPhone?: string): Promise<string> {
  let baseInstructions = VOICE_SYSTEM_INSTRUCTIONS;
  
  if (callerPhone) {
    try {
      const context = await contextService.getFullContext({
        identityType: 'phone',
        identityValue: callerPhone,
      });
      
      if (context) {
        baseInstructions += `\n\n${contextService.buildContextPrompt(context)}`;
      }
    } catch (error) {
      log.warn('[Voice] Failed to load customer context', { error });
    }
  }
  
  return baseInstructions;
}
```

**Modify `handleMediaStream()` (line 79):**

Extract caller phone from Twilio's `start` event and use it:
```typescript
// In the 'start' event handler
if (message.start?.customParameters?.callerNumber) {
  const instructions = await getVoiceInstructions(message.start.customParameters.callerNumber);
  // Use instructions in session config
}
```

### 5.4 Modify MCP Server: `src/booker.ts`

**Add new tool:** `get_customer_context`

```typescript
server.tool(
  "get_customer_context",
  "Get full customer context including service history, properties, and preferences. Use this before booking to personalize the experience.",
  {
    phone: z.string().optional().describe("Customer phone number"),
    email: z.string().optional().describe("Customer email address"),
    housecall_pro_id: z.string().optional().describe("HousecallPro customer ID"),
  },
  async ({ phone, email, housecall_pro_id }) => {
    // Implementation calls CustomerContextService
  }
);
```

---

## 6. Phase 5: Semantic Memory & Batch Processing

### New File: `server/lib/batchProcessor.ts`

#### 6.1 Batch Embedding Generation

**Process:**
1. Query `sharedThreadMessages` without embeddings (LEFT JOIN on `conversationEmbeddings`)
2. Batch up to 50,000 messages per batch file
3. Submit to OpenAI Batch API for `text-embedding-3-small`
4. Store batch job in `batchJobs` table
5. Poll for completion (cron job)
6. On completion, insert embeddings into `conversationEmbeddings`

**Batch API Request Format:**
```json
{
  "custom_id": "msg-{message_id}",
  "method": "POST",
  "url": "/v1/embeddings",
  "body": {
    "model": "text-embedding-3-small",
    "input": "{message_text}"
  }
}
```

#### 6.2 Batch Insight Generation

**Process:**
1. Query customers with:
   - Water heater age > 10 years
   - Last service > 12 months ago
   - High lifetime value but no Family Discount
2. Generate insight requests
3. Submit to Batch API with GPT-4o-mini
4. Store results in `customerInsights`

### New File: `server/lib/semanticSearch.ts`

#### 6.3 `semanticSearch()`

```typescript
export async function semanticSearch(params: {
  customerId: string;
  query: string;
  limit?: number;
}): Promise<{ messageId: string; text: string; similarity: number }[]> {
  // 1. Generate embedding for query
  // 2. Find messages for this customer
  // 3. Calculate cosine similarity
  // 4. Return top N results
}
```

**Note:** For production, consider PostgreSQL's `pgvector` extension for efficient similarity search.

---

## 7. Phase 6: Proactive Insight Generation

### New File: `server/lib/insightGenerator.ts`

#### 7.1 Equipment Replacement Insights

**Logic:**
```sql
-- Query: Water heaters over 10 years old
-- Uses extended customer_addresses table (NOT customer_properties)
SELECT cc.id, ca.water_heater_age, ca.water_heater_type
FROM customer_context cc
JOIN customer_addresses ca ON ca.customer_id = cc.housecall_pro_id
WHERE ca.water_heater_age > 10
AND NOT EXISTS (
  SELECT 1 FROM customer_insights ci
  WHERE ci.customer_context_id = cc.id
  AND ci.insight_type = 'equipment_replacement'
  AND ci.status = 'active'
);
```

**Insight created:**
```typescript
{
  insightType: 'equipment_replacement',
  priority: 'high',
  title: 'Water Heater Replacement Opportunity',
  description: 'Tank water heater is 12 years old (average lifespan: 10-15 years). Customer may benefit from proactive replacement to avoid emergency failure.',
  suggestedAction: 'Offer water heater replacement quote during next interaction.',
  insightData: { equipmentType: 'water_heater', age: 12, averageLifespan: 12 },
}
```

#### 7.2 Maintenance Due Insights

**Rules:**
- Drain cleaning: Suggest every 2 years
- Water heater flush: Suggest annually
- Sump pump check: Suggest before spring

#### 7.3 Membership Upsell Insights

**Logic:**
- Customer has >3 jobs in past 2 years
- Customer is not a Family Discount member
- Lifetime value > $500

**Insight:**
```typescript
{
  insightType: 'upsell_membership',
  priority: 'medium',
  title: 'Family Discount Opportunity',
  description: 'Customer has used us 5 times for $1,200 total. They would save $X/year with Family Discount membership.',
  suggestedAction: 'Mention Family Discount during conversation.',
}
```

### Cron Job: `server/src/cron/insightGeneration.ts`

**Schedule:** Nightly at 2 AM EST

---

## 8. Phase 7: API & Admin Dashboard

### 8.1 New API Routes

**File:** `server/routes.ts` or new `server/routes/customerContext.ts`

```typescript
// GET /api/v1/customer-context/:identifier
// Query params: type=phone|email|housecall_pro_id
router.get('/api/v1/customer-context/:identifier', authenticate, async (req, res) => {
  const { identifier } = req.params;
  const { type } = req.query;
  const context = await contextService.getFullContext({ identityType: type, identityValue: identifier });
  res.json(context);
});

// POST /api/v1/customer-context/sync
// Body: { housecallProId: string }
router.post('/api/v1/customer-context/sync', authenticate, async (req, res) => {
  const { housecallProId } = req.body;
  await housecallProSync.syncCustomerFromHCP(housecallProId);
  res.json({ success: true });
});

// GET /api/v1/customer-context/:id/insights
router.get('/api/v1/customer-context/:id/insights', authenticate, async (req, res) => {
  const insights = await db.select().from(customerInsights)
    .where(and(
      eq(customerInsights.customerContextId, req.params.id),
      eq(customerInsights.status, 'active')
    ));
  res.json(insights);
});

// PATCH /api/v1/insights/:id
// Body: { status: 'actioned' | 'dismissed', reason?: string }
router.patch('/api/v1/insights/:id', authenticate, async (req, res) => {
  // Update insight status
});
```

### 8.2 Admin Dashboard Updates

**File:** `client/src/pages/admin/CustomerContext.tsx` (new)

**Features:**
- Search customer by phone/email
- Display full context card
- View/manage properties
- View job history timeline
- Manage insights (action, dismiss)
- Trigger manual HCP sync

---

## 9. Phase 8: Testing & Validation

### 9.1 Unit Tests

**File:** `server/lib/__tests__/customerContextService.test.ts`

```typescript
describe('CustomerContextService', () => {
  describe('getFullContext', () => {
    it('returns null for unknown identity');
    it('returns basic context for new customer');
    it('includes HCP data when synced');
    it('returns cached context within TTL');
  });
  
  describe('buildContextPrompt', () => {
    it('formats basic profile correctly');
    it('includes property equipment details');
    it('highlights insights with priority');
  });
});
```

### 9.2 Integration Tests

**File:** `server/__tests__/crossChannelContext.test.ts`

```typescript
describe('Cross-Channel Context', () => {
  it('web chat sees context from previous SMS conversation');
  it('voice call sees context from web booking');
  it('context updates after HCP job completion webhook');
});
```

### 9.3 Observability

**Metrics to add:**
- `customer_context.cache_hit_rate` - Gauge
- `customer_context.load_latency_ms` - Histogram
- `hcp_sync.duration_ms` - Histogram
- `hcp_sync.failures` - Counter
- `insights.generated` - Counter by type
- `insights.actioned` - Counter by type

---

## 10. Migration Strategy

### 10.1 Database Migration

**Step 1:** Run migrations `0002_customer_context.sql` and `0003_extend_customer_addresses.sql`  
**Step 2:** Backfill `customerContext` from existing `sharedThreadCustomers`  
**Step 3:** Link existing `customers` table records to `customerContext` via phone/email match

### 10.2 HousecallPro Initial Sync

**Approach:** Incremental, not big-bang

1. **Phase A (Day 1-7):** Sync on-demand only
   - When `getFullContext()` is called, check if HCP data is missing
   - Trigger sync if `housecallProId` exists but `lastHcpSyncAt` is null

2. **Phase B (Day 8-14):** Background sync for active customers
   - Query customers with conversation activity in last 90 days
   - Run nightly batch sync

3. **Phase C (Day 15+):** Full historical sync
   - Sync all HCP customers in batches of 100
   - Run over multiple nights to avoid rate limits

### 10.3 Feature Flags

```typescript
// config/featureFlags.ts
export const FEATURE_FLAGS = {
  CUSTOMER_CONTEXT_ENABLED: true,
  CUSTOMER_CONTEXT_HCP_SYNC: true,
  CUSTOMER_CONTEXT_INSIGHTS: false, // Enable after testing
  CUSTOMER_CONTEXT_EMBEDDINGS: false, // Enable after batch processing setup
};
```

---

## 11. Cost Analysis

### OpenAI API Costs

| Operation | Model | Real-time Cost | Batch Cost (50% off) | Volume/Month |
|-----------|-------|----------------|---------------------|--------------|
| Context retrieval | N/A (DB only) | $0 | $0 | Unlimited |
| Embeddings (new messages) | text-embedding-3-small | $0.02/1M tokens | $0.01/1M tokens | ~100K messages |
| Insight generation | gpt-4o-mini | $0.15/1M input | $0.075/1M input | ~1K customers |
| Memory compression | gpt-4o-mini | $0.15/1M input | $0.075/1M input | ~500 compressions |
| Profile enrichment | gpt-4o-mini | $0.15/1M input | $0.075/1M input | ~200 enrichments |

**Estimated Monthly Cost (Batch API):** ~$5-15/month for typical volume

### Development Cost (Time)

| Phase | Estimated Hours | Dependencies |
|-------|-----------------|--------------|
| Phase 1: Schema | 4 hours | None |
| Phase 2: Context Service | 8 hours | Phase 1 |
| Phase 3: HCP Sync | 6 hours | Phases 1, 2 |
| Phase 4: AI Injection | 6 hours | Phases 1, 2 |
| Phase 5: Batch Processing | 8 hours | Phases 1, 2 |
| Phase 6: Insights | 6 hours | Phases 1, 2, 3 |
| Phase 7: API & Dashboard | 8 hours | Phases 1-4 |
| Phase 8: Testing | 6 hours | All phases |

**Total:** ~52 hours

---

## Files Summary

### New Files to Create

| File | Purpose | Lines (Est.) |
|------|---------|--------------|
| `server/lib/customerContextService.ts` | Core context aggregation | 400 |
| `server/lib/housecallProSync.ts` | HCP bidirectional sync | 300 |
| `server/lib/batchProcessor.ts` | OpenAI Batch API handling | 250 |
| `server/lib/semanticSearch.ts` | Embedding-based search | 150 |
| `server/lib/insightGenerator.ts` | Proactive insight generation | 300 |
| `server/routes/customerContext.ts` | API endpoints | 150 |
| `client/src/pages/admin/CustomerContext.tsx` | Admin dashboard page | 400 |
| `migrations/0002_customer_context.sql` | Database migration | 150 |
| `migrations/0003_extend_customer_addresses.sql` | Extend customer_addresses | 40 |
| `server/lib/__tests__/customerContextService.test.ts` | Unit tests | 200 |

### Files to Modify

| File | Changes | Lines Changed (Est.) |
|------|---------|----------------------|
| `shared/schema.ts` | Add 6 new tables, relations, types | +300 |
| `server/lib/aiChat.ts` | Add context injection | +40 |
| `server/lib/smsBookingAgent.ts` | Add context injection | +30 |
| `server/lib/realtimeVoice.ts` | Add context injection | +30 |
| `src/booker.ts` | Add `get_customer_context` tool | +50 |
| `server/src/webhooks.ts` | Extend WebhookProcessor for HCP sync | +30 |
| `server/routes.ts` | Register new routes | +10 |

---

## Appendix: Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CUSTOMER INTERACTION                            │
├──────────────┬──────────────┬──────────────┬──────────────┬────────────────┤
│   Web Chat   │     SMS      │    Voice     │  MCP Server  │ HousecallPro   │
│  (aiChat.ts) │(smsBooking)  │(realtimeVoice)│ (booker.ts) │   (webhooks)   │
└──────┬───────┴──────┬───────┴──────┬───────┴──────┬───────┴───────┬────────┘
       │              │              │              │               │
       ▼              ▼              ▼              ▼               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CustomerContextService.getFullContext()               │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │ Identity Lookup │  │  Context Cache  │  │ HCP Sync (if stale)        │  │
│  │ (sharedThread)  │──│  (5 min TTL)    │──│ (housecallProSync.ts)      │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PostgreSQL Database                             │
├─────────────────┬─────────────────┬─────────────────┬───────────────────────┤
│ customerContext │customer_addresses│customerJobHistory│  customerInsights   │
│                 │   (EXTENDED)     │                  │                      │
│ - housecallProId│ - address        │ - service type   │ - equipment_replace  │
│ - preferences   │ - equipment cols │ - technician     │ - maintenance_due    │
│ - membership    │ - known issues   │ - amount         │ - upsell_membership  │
│ - lifetime value│ - hcp_address_id │ - notes          │                      │
└─────────────────┴─────────────────┴─────────────────┴───────────────────────┘
```

---

## Approval Checklist

- [ ] Schema reviewed by second system
- [ ] Cost estimates validated
- [ ] Migration strategy approved
- [ ] Feature flag approach confirmed
- [ ] Testing strategy adequate
- [ ] Admin dashboard scope confirmed

---

## ADDENDUM: Corrections Based on Architectural Review

### Issue 1: Avoid Duplicate Address Tables

**Problem:** The original `customerProperties` table duplicates the existing `customer_addresses` table.

**Solution:** Extend `customer_addresses` with equipment/property columns instead of creating a new table.

**Revised Schema Change for `customer_addresses` (line 7-27 in shared/schema.ts):**

```typescript
// EXTEND existing customer_addresses table - ADD these columns via migration
export const customerAddresses = pgTable('customer_addresses', {
  // ... existing columns remain unchanged ...
  id: serial('id').primaryKey(),
  customerId: text('customer_id').notNull(),
  street: text('street'),
  city: text('city'),
  state: text('state'),
  zip: text('zip'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  displayLat: real('display_lat'),
  displayLng: real('display_lng'),
  jobCount: integer('job_count').default(0).notNull(),
  lastServiceDate: timestamp('last_service_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  
  // NEW COLUMNS - Add via ALTER TABLE migration
  housecallProAddressId: text('housecall_pro_address_id'), // Link to HCP
  streetLine2: text('street_line_2'),
  propertyType: text('property_type'), // 'residential', 'commercial', 'multi-family'
  yearBuilt: integer('year_built'),
  waterHeaterType: text('water_heater_type'), // 'tank', 'tankless', 'hybrid'
  waterHeaterAge: integer('water_heater_age'),
  waterHeaterBrand: text('water_heater_brand'),
  waterHeaterInstallDate: timestamp('water_heater_install_date'),
  plumbingAge: integer('plumbing_age'),
  knownIssues: text('known_issues').array(),
  lastServiceType: text('last_service_type'),
  lastInspectionDate: timestamp('last_inspection_date'), // Optional; cannot be required on existing rows
}, (table) => ({
  // ... existing indexes ...
  hcpAddressIdx: uniqueIndex('ca_hcp_address_idx').on(table.housecallProAddressId),
}));
```

**Migration SQL:**
```sql
-- migrations/0003_extend_customer_addresses.sql
ALTER TABLE customer_addresses
ADD COLUMN housecall_pro_address_id TEXT,
ADD COLUMN street_line_2 TEXT,
ADD COLUMN property_type TEXT,
ADD COLUMN year_built INTEGER,
ADD COLUMN water_heater_type TEXT,
ADD COLUMN water_heater_age INTEGER,
ADD COLUMN water_heater_brand TEXT,
ADD COLUMN water_heater_install_date TIMESTAMP,
ADD COLUMN plumbing_age INTEGER,
ADD COLUMN known_issues TEXT[],
ADD COLUMN last_service_type TEXT,
ADD COLUMN last_inspection_date TIMESTAMP;

CREATE UNIQUE INDEX ca_hcp_address_idx ON customer_addresses(housecall_pro_address_id);
```

**Remove:** `customerProperties` table from Phase 1 - it is no longer needed.

---

### Issue 2: Specific HousecallPro API Endpoint Mappings

**HCP API Endpoints Required:**

| Operation | HCP Endpoint | Parameters | Response |
|-----------|--------------|------------|----------|
| Get customer by ID | `GET /customers/{customer_id}` | `expand=attachments` | Customer object |
| Search customer | `GET /customers?q={phone_or_email}` | `page`, `page_size` | Paginated customers |
| Get customer addresses | `GET /customers/{customer_id}/addresses` | `page`, `page_size` | Paginated addresses |
| Get jobs by customer | `GET /jobs?customer_id={id}` | `work_status=completed`, `page_size=20`, `sort_direction=desc` | Paginated jobs |
| Get single job | `GET /jobs/{id}` | `expand=attachments,appointments` | Full job object |
| Subscribe to webhooks | `POST /webhooks/subscription` | None | Subscription created |

**Sync Implementation Detail:**

```typescript
// server/lib/housecallProSync.ts

import { HousecallProClient } from '../src/housecall';

const hcpClient = HousecallProClient.getInstance();

export async function syncCustomerFromHCP(housecallProCustomerId: string): Promise<void> {
  // Step 1: Fetch customer profile
  const customer = await hcpClient.callAPI<HCPCustomer>(
    `/customers/${housecallProCustomerId}`,
    { expand: ['attachments'] }
  );
  
  // Step 2: Fetch all addresses (paginated)
  let allAddresses: HCPAddress[] = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const addressResponse = await hcpClient.callAPI<{ addresses: HCPAddress[]; total_pages: number }>(
      `/customers/${housecallProCustomerId}/addresses`,
      { page, page_size: 50 }
    );
    allAddresses = allAddresses.concat(addressResponse.addresses);
    hasMore = page < addressResponse.total_pages;
    page++;
  }
  
  // Step 3: Upsert customerContext
  await db.insert(customerContext).values({
    housecallProId: housecallProCustomerId,
    firstName: customer.first_name,
    lastName: customer.last_name,
    email: customer.email,
    primaryPhone: customer.mobile_number || customer.home_number,
    tags: customer.tags,
    leadSource: customer.lead_source,
    lastHcpSyncAt: new Date(),
  }).onConflictDoUpdate({
    target: customerContext.housecallProId,
    set: { /* same fields */ },
  });
  
  // Step 4: Upsert customer_addresses
  for (const addr of allAddresses) {
    await db.insert(customerAddresses).values({
      customerId: housecallProCustomerId,
      housecallProAddressId: addr.id,
      street: addr.street,
      streetLine2: addr.street_line_2,
      city: addr.city,
      state: addr.state,
      zip: addr.zip,
    }).onConflictDoUpdate({
      target: customerAddresses.housecallProAddressId,
      set: { /* same fields */ },
    });
  }
}

export async function syncJobHistory(customerContextId: string): Promise<void> {
  // Get HCP customer ID
  const [context] = await db.select().from(customerContext)
    .where(eq(customerContext.id, customerContextId));
  
  if (!context?.housecallProId) return;
  
  // Fetch completed jobs (paginated, max 5 pages = 100 jobs)
  let allJobs: HCPJob[] = [];
  
  for (let page = 1; page <= 5; page++) {
    const jobsResponse = await hcpClient.callAPI<{ jobs: HCPJob[]; total_pages: number }>(
      '/jobs',
      { 
        customer_id: context.housecallProId,
        work_status: ['completed'],
        page,
        page_size: 20,
        sort_direction: 'desc',
        sort_by: 'created_at',
      }
    );
    
    allJobs = allJobs.concat(jobsResponse.jobs);
    if (page >= jobsResponse.total_pages) break;
  }
  
  // Upsert each job
  let lifetimeValue = 0;
  
  for (const job of allJobs) {
    lifetimeValue += job.total_amount || 0;
    
    await db.insert(customerJobHistory).values({
      customerContextId,
      housecallProJobId: job.id,
      invoiceNumber: job.invoice_number,
      serviceType: job.name || extractServiceType(job.description),
      description: job.description,  // Optional: issueDescription equivalent (HCP may omit)
      notes: job.notes,              // Optional: resolutionNotes equivalent (HCP may omit)
      scheduledDate: job.schedule?.scheduled_start ? new Date(job.schedule.scheduled_start) : null,
      completedDate: job.work_timestamps?.completed_at ? new Date(job.work_timestamps.completed_at) : null,
      workStatus: job.work_status,
      totalAmount: job.total_amount,
      outstandingBalance: job.outstanding_balance,
      technicianId: job.assigned_employees?.[0]?.id,
      technicianName: job.assigned_employees?.[0] 
        ? `${job.assigned_employees[0].first_name} ${job.assigned_employees[0].last_name}` 
        : null,
      lineItems: job.line_items,
    }).onConflictDoUpdate({
      target: customerJobHistory.housecallProJobId,
      set: { /* same fields */ },
    });
    
    // Extract equipment from line items
    await parseAndStoreEquipment(job, context.housecallProId);
  }
  
  // Update lifetime value
  await db.update(customerContext).set({
    lifetimeValue,
    totalJobs: allJobs.length,
  }).where(eq(customerContext.id, customerContextId));
}
```

**Webhook Handling:**

```typescript
// server/src/webhooks.ts - extend WebhookProcessor.processEventAsync()
// (the /webhooks/housecall endpoint is already registered in server/routes.ts)

switch (eventType) {
  case 'job.completed':
    const jobId = payload.job?.id;
    const customerId = payload.job?.customer?.id;
    
    if (customerId) {
      // Find customerContext by HCP ID
      const [context] = await db.select()
        .from(customerContext)
        .where(eq(customerContext.housecallProId, customerId));
      
      if (context) {
        // Background sync job history
        syncJobHistory(context.id).catch(err => 
          Logger.error('[Webhook] Job sync failed', { error: err, jobId })
        );
        
        // Update address lastServiceDate
        if (payload.job?.address?.id) {
          await db.update(customerAddresses).set({
            lastServiceDate: new Date(),
            lastServiceType: payload.job?.name,
            jobCount: sql`${customerAddresses.jobCount} + 1`,
          }).where(eq(customerAddresses.housecallProAddressId, payload.job.address.id));
        }
      }
    }
    break;
    
  case 'customer.updated':
    const hcpCustomerId = payload.customer?.id;
    if (hcpCustomerId) {
      syncCustomerFromHCP(hcpCustomerId).catch(err =>
        Logger.error('[Webhook] Customer sync failed', { error: err, hcpCustomerId })
      );
    }
    break;
}
```

---

### Issue 3: Complete Batch API Workflow Definition

**Batch Processing End-to-End Flow:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BATCH PROCESSING WORKFLOW                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌───────────┐ │
│  │   TRIGGER   │────▶│   COMPOSE   │────▶│   SUBMIT    │────▶│   POLL    │ │
│  │  (Cron/API) │     │   PAYLOAD   │     │  TO OPENAI  │     │  STATUS   │ │
│  └─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘ │
│                                                                      │       │
│                                                                      ▼       │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         PROCESS RESULTS                                  │ │
│  │   - Download output file from OpenAI                                    │ │
│  │   - Parse JSONL responses                                               │ │
│  │   - Insert/update database records                                      │ │
│  │   - Mark batch job as completed                                         │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Implementation:**

```typescript
// server/lib/batchProcessor.ts

import OpenAI from 'openai';
import { db } from '../db';
import { batchJobs, sharedThreadMessages, conversationEmbeddings } from '@shared/schema';

const openai = new OpenAI();

// ═══════════════════════════════════════════════════════════════════════════
// STEP 1: TRIGGER - Called by cron job at 2 AM EST
// ═══════════════════════════════════════════════════════════════════════════
export async function triggerNightlyBatch(): Promise<void> {
  await submitEmbeddingBatch();
  await submitInsightBatch();
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 2: COMPOSE PAYLOAD - Build JSONL file for batch
// ═══════════════════════════════════════════════════════════════════════════
async function composeEmbeddingPayload(): Promise<{ fileContent: string; messageIds: string[] }> {
  // Query messages WITHOUT embeddings
  const messagesToEmbed = await db.execute(sql`
    SELECT m.id, m.text 
    FROM shared_thread_messages m
    LEFT JOIN conversation_embeddings e ON e.message_id = m.id
    WHERE e.id IS NULL
    AND m.text IS NOT NULL
    AND LENGTH(m.text) > 10
    LIMIT 10000
  `);
  
  const lines: string[] = [];
  const messageIds: string[] = [];
  
  for (const msg of messagesToEmbed.rows) {
    messageIds.push(msg.id);
    lines.push(JSON.stringify({
      custom_id: `emb-${msg.id}`,
      method: 'POST',
      url: '/v1/embeddings',
      body: {
        model: 'text-embedding-3-small',
        input: msg.text,
      }
    }));
  }
  
  return { fileContent: lines.join('\n'), messageIds };
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 3: SUBMIT TO OPENAI - Upload file and create batch
// ═══════════════════════════════════════════════════════════════════════════
async function submitEmbeddingBatch(): Promise<string | null> {
  const { fileContent, messageIds } = await composeEmbeddingPayload();
  
  if (messageIds.length === 0) {
    Logger.info('[Batch] No messages to embed');
    return null;
  }
  
  // Upload input file
  const inputFile = await openai.files.create({
    file: Buffer.from(fileContent),
    purpose: 'batch',
  });
  
  // Create batch
  const batch = await openai.batches.create({
    input_file_id: inputFile.id,
    endpoint: '/v1/embeddings',
    completion_window: '24h',
  });
  
  // Record in database
  const [batchRecord] = await db.insert(batchJobs).values({
    openAiBatchId: batch.id,
    jobType: 'embeddings',
    status: 'submitted',
    inputFileId: inputFile.id,
    totalRequests: messageIds.length,
    submittedAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  }).returning();
  
  Logger.info(`[Batch] Submitted embedding batch ${batch.id} with ${messageIds.length} requests`);
  
  return batch.id;
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 4: POLL STATUS - Called every 30 minutes by cron
// ═══════════════════════════════════════════════════════════════════════════
export async function pollBatchStatus(): Promise<void> {
  const pendingBatches = await db.select()
    .from(batchJobs)
    .where(eq(batchJobs.status, 'submitted'));
  
  for (const job of pendingBatches) {
    if (!job.openAiBatchId) continue;
    
    const batch = await openai.batches.retrieve(job.openAiBatchId);
    
    if (batch.status === 'completed') {
      await processBatchResults(job.id, batch);
    } else if (batch.status === 'failed' || batch.status === 'expired') {
      await db.update(batchJobs).set({
        status: 'failed',
        errorMessage: batch.errors?.data?.[0]?.message || 'Batch failed',
        completedAt: new Date(),
      }).where(eq(batchJobs.id, job.id));
    }
    // else: still processing, continue polling
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 5: PROCESS RESULTS - Download and ingest
// ═══════════════════════════════════════════════════════════════════════════
async function processBatchResults(batchJobId: string, batch: OpenAI.Batches.Batch): Promise<void> {
  if (!batch.output_file_id) {
    Logger.error(`[Batch] No output file for batch ${batch.id}`);
    return;
  }
  
  // Download output file
  const outputFile = await openai.files.content(batch.output_file_id);
  const outputText = await outputFile.text();
  const lines = outputText.trim().split('\n');
  
  let completed = 0;
  let failed = 0;
  
  for (const line of lines) {
    const result = JSON.parse(line);
    const messageId = result.custom_id.replace('emb-', '');
    
    if (result.error) {
      failed++;
      Logger.warn(`[Batch] Embedding failed for message ${messageId}`, { error: result.error });
      continue;
    }
    
    const embedding = result.response?.body?.data?.[0]?.embedding;
    if (!embedding) {
      failed++;
      continue;
    }
    
    // Insert embedding into database
    await db.insert(conversationEmbeddings).values({
      messageId,
      embedding,
      embeddingModel: 'text-embedding-3-small',
    }).onConflictDoNothing();
    
    completed++;
  }
  
  // Update batch job status
  await db.update(batchJobs).set({
    status: 'completed',
    outputFileId: batch.output_file_id,
    completedRequests: completed,
    failedRequests: failed,
    completedAt: new Date(),
  }).where(eq(batchJobs.id, batchJobId));
  
  Logger.info(`[Batch] Processed ${completed} embeddings, ${failed} failures`);
}

// ═══════════════════════════════════════════════════════════════════════════
// INSIGHT BATCH - Similar pattern for GPT-4o-mini insight generation
// ═══════════════════════════════════════════════════════════════════════════
async function submitInsightBatch(): Promise<string | null> {
  // Query customers needing insights
  const customersNeedingInsights = await db.execute(sql`
    SELECT cc.id, cc.first_name, cc.lifetime_value, cc.membership_status,
           ca.water_heater_age, ca.water_heater_type
    FROM customer_context cc
    LEFT JOIN customer_addresses ca ON ca.customer_id = cc.housecall_pro_id
    WHERE (ca.water_heater_age > 10 OR cc.lifetime_value > 500)
    AND NOT EXISTS (
      SELECT 1 FROM customer_insights ci
      WHERE ci.customer_context_id = cc.id
      AND ci.status = 'active'
      AND ci.generated_at > NOW() - INTERVAL '30 days'
    )
    LIMIT 500
  `);
  
  if (customersNeedingInsights.rows.length === 0) return null;
  
  const lines: string[] = [];
  
  for (const customer of customersNeedingInsights.rows) {
    lines.push(JSON.stringify({
      custom_id: `insight-${customer.id}`,
      method: 'POST',
      url: '/v1/chat/completions',
      body: {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Generate customer insights for a plumbing business. Return JSON with fields: insightType, priority, title, description, suggestedAction.'
          },
          {
            role: 'user',
            content: `Customer: ${customer.first_name}, Lifetime value: $${customer.lifetime_value}, Membership: ${customer.membership_status}, Water heater age: ${customer.water_heater_age} years, Type: ${customer.water_heater_type}`
          }
        ],
        max_tokens: 200,
      }
    }));
  }
  
  // ... same upload and submit pattern as embeddings ...
}
```

**Cron Configuration:**

```typescript
// server/src/cron/batchProcessing.ts
import cron from 'node-cron';
import { triggerNightlyBatch, pollBatchStatus } from '../lib/batchProcessor';

// Run batch submission at 2 AM EST
cron.schedule('0 2 * * *', () => {
  triggerNightlyBatch().catch(err => 
    Logger.error('[Cron] Nightly batch failed', { error: err })
  );
}, { timezone: 'America/New_York' });

// Poll batch status every 30 minutes
cron.schedule('*/30 * * * *', () => {
  pollBatchStatus().catch(err =>
    Logger.error('[Cron] Batch polling failed', { error: err })
  );
});
```

---

### Issue 4: Batch Insight Result Ingestion (Complete Workflow)

**Process Insight Batch Results:**

```typescript
// server/lib/batchProcessor.ts - ADD this function

async function processInsightBatchResults(batchJobId: string, batch: OpenAI.Batches.Batch): Promise<void> {
  if (!batch.output_file_id) {
    Logger.error(`[Batch] No output file for insight batch ${batch.id}`);
    return;
  }
  
  // Download output file
  const outputFile = await openai.files.content(batch.output_file_id);
  const outputText = await outputFile.text();
  const lines = outputText.trim().split('\n');
  
  let completed = 0;
  let failed = 0;
  
  for (const line of lines) {
    try {
      const result = JSON.parse(line);
      const customerContextId = result.custom_id.replace('insight-', '');
      
      if (result.error) {
        failed++;
        Logger.warn(`[Batch] Insight generation failed for customer ${customerContextId}`, { error: result.error });
        continue;
      }
      
      // Parse the GPT response - expecting JSON
      const responseContent = result.response?.body?.choices?.[0]?.message?.content;
      if (!responseContent) {
        failed++;
        continue;
      }
      
      // Parse the insight JSON from GPT's response
      let insightData;
      try {
        // Handle markdown code blocks if present
        const jsonMatch = responseContent.match(/```json\n?([\s\S]*?)\n?```/) || 
                          responseContent.match(/\{[\s\S]*\}/);
        insightData = JSON.parse(jsonMatch ? jsonMatch[1] || jsonMatch[0] : responseContent);
      } catch (parseErr) {
        Logger.warn(`[Batch] Failed to parse insight JSON for ${customerContextId}`, { 
          error: parseErr, 
          response: responseContent.substring(0, 200) 
        });
        failed++;
        continue;
      }
      
      // Validate required fields
      if (!insightData.insightType || !insightData.title || !insightData.description) {
        Logger.warn(`[Batch] Insight missing required fields for ${customerContextId}`);
        failed++;
        continue;
      }
      
      // Insert insight into database
      await db.insert(customerInsights).values({
        customerContextId,
        insightType: insightData.insightType,
        priority: insightData.priority || 'medium',
        title: insightData.title,
        description: insightData.description,
        suggestedAction: insightData.suggestedAction,
        insightData: insightData,
        confidence: insightData.confidence || 0.8,
        status: 'active',
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      }).onConflictDoNothing(); // Skip if duplicate
      
      completed++;
    } catch (err) {
      failed++;
      Logger.error(`[Batch] Error processing insight line`, { error: err });
    }
  }
  
  // Update batch job status
  await db.update(batchJobs).set({
    status: 'completed',
    outputFileId: batch.output_file_id,
    completedRequests: completed,
    failedRequests: failed,
    completedAt: new Date(),
  }).where(eq(batchJobs.id, batchJobId));
  
  Logger.info(`[Batch] Processed ${completed} insights, ${failed} failures`);
}

// Update pollBatchStatus to handle insight batches
export async function pollBatchStatus(): Promise<void> {
  const pendingBatches = await db.select()
    .from(batchJobs)
    .where(eq(batchJobs.status, 'submitted'));
  
  for (const job of pendingBatches) {
    if (!job.openAiBatchId) continue;
    
    const batch = await openai.batches.retrieve(job.openAiBatchId);
    
    if (batch.status === 'completed') {
      // Route to correct processor based on job type
      if (job.jobType === 'embeddings') {
        await processBatchResults(job.id, batch);
      } else if (job.jobType === 'insights') {
        await processInsightBatchResults(job.id, batch);
      }
    } else if (batch.status === 'failed' || batch.status === 'expired') {
      await db.update(batchJobs).set({
        status: 'failed',
        errorMessage: batch.errors?.data?.[0]?.message || `Batch ${batch.status}`,
        completedAt: new Date(),
      }).where(eq(batchJobs.id, job.id));
      
      // Retry strategy: mark for retry if not expired
      if (batch.status === 'failed' && job.jobType === 'insights') {
        Logger.info(`[Batch] Will retry insight batch on next nightly run`);
      }
    }
    // else: still processing, continue polling
  }
}
```

**Cost Savings Summary:**

| Operation | Real-time API | Batch API (50% off) | Monthly Volume | Savings |
|-----------|---------------|---------------------|----------------|---------|
| Embeddings | $0.02/1M tokens | $0.01/1M tokens | ~100K messages | ~$0.50 |
| Insight Gen | $0.15/1M in + $0.60/1M out | $0.075/1M in + $0.30/1M out | ~1K customers | ~$5-10 |
| **Total** | ~$10-15/month | ~$5-8/month | | **40-50%** |

---

### Issue 5: Bidirectional Sync (Pushing Data TO HousecallPro)

**Push AI Notes to HCP:**

The HousecallPro API supports updating customer records via `PUT /customers/{id}`. Use note-specific
endpoints where possible to avoid overwriting existing notes.

```typescript
// server/lib/housecallProSync.ts - ADD these functions

/**
 * Push AI-generated notes back to HousecallPro customer record
 * Called after significant conversation insights are extracted
 */
export async function pushContextToHCP(customerContextId: string): Promise<void> {
  const [context] = await db.select().from(customerContext)
    .where(eq(customerContext.id, customerContextId));
  
  if (!context?.housecallProId) {
    Logger.warn(`[HCP Sync] Cannot push context - no HCP ID for ${customerContextId}`);
    return;
  }
  
  // Get the linked sharedThread customer for conversation summary
  const [sharedCustomer] = await db.select()
    .from(sharedThreadCustomers)
    .where(eq(sharedThreadCustomers.id, context.sharedThreadCustomerId));
  
  // Build notes to push
  const notes: string[] = [];
  
  if (context.preferredTimeWindow) {
    notes.push(`AI Note: Prefers ${context.preferredTimeWindow} appointments`);
  }
  
  if (context.communicationPreference && context.communicationPreference !== 'any') {
    notes.push(`AI Note: Prefers ${context.communicationPreference} communication`);
  }
  
  if (sharedCustomer?.currentIssueSummary) {
    notes.push(`AI Note (Current Issue): ${sharedCustomer.currentIssueSummary}`);
  }
  
  if (notes.length === 0) {
    Logger.debug(`[HCP Sync] No notes to push for ${customerContextId}`);
    return;
  }
  
  // Update customer in HCP
  try {
    // Prefer addCustomerNote() to avoid overwriting existing notes.
    await hcpClient.addCustomerNote(context.housecallProId, notes.join('\n'));

    // Use updateCustomer() only for structured fields (e.g., tags).
    if (context.tags?.length) {
      await hcpClient.updateCustomer(context.housecallProId, { tags: context.tags });
    }
    
    Logger.info(`[HCP Sync] Pushed context to HCP for customer ${context.housecallProId}`);
  } catch (error) {
    Logger.error(`[HCP Sync] Failed to push context to HCP`, { 
      error, 
      customerId: context.housecallProId 
    });
    
    // Record sync error but don't fail the operation
    await db.update(customerContext).set({
      hcpSyncError: `Push failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }).where(eq(customerContext.id, customerContextId));
  }
}

/**
 * Push new address discovered during conversation to HCP
 */
export async function pushAddressToHCP(
  housecallProCustomerId: string,
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  }
): Promise<string | null> {
  try {
    const response = await hcpClient.callAPI<{ id: string }>(
      `/customers/${housecallProCustomerId}/addresses`,
      {},
      {
        method: 'POST',
        body: {
          street: address.street,
          city: address.city,
          state: address.state,
          zip: address.zip,
          country: 'USA',
        }
      }
    );
    
    Logger.info(`[HCP Sync] Created address in HCP`, { 
      customerId: housecallProCustomerId, 
      addressId: response.id 
    });
    
    return response.id;
  } catch (error) {
    Logger.error(`[HCP Sync] Failed to create address in HCP`, { error });
    return null;
  }
}
```

**When to Push to HCP:**

| Trigger | Action | API Call |
|---------|--------|----------|
| Customer preference learned during conversation | Update preferences | `PUT /customers/{id}` |
| New address discovered | Create address | `POST /customers/{id}/addresses` |
| Conversation summary updated | Append to notes | `POST /customers/{id}/notes` |
| Tag added (e.g., "VIP", "Family Discount") | Update tags | `PUT /customers/{id}` |

**Integration Points:**

```typescript
// In server/lib/sharedThread.ts - after memory compression
export async function memoryCompression(customerId: string, threadId: string, force = false): Promise<void> {
  // ... existing compression logic ...
  
  // After compression, push summary to HCP
  const [context] = await db.select().from(customerContext)
    .where(eq(customerContext.sharedThreadCustomerId, customerId));
  
  if (context) {
    // Non-blocking push to HCP
    pushContextToHCP(context.id).catch(err => 
      Logger.warn('[Memory] Failed to push to HCP after compression', { error: err })
    );
  }
}
```

---

### Issue 6: Missing Fields for Context Capture

**Added to `customerJobHistory` schema:**
- `description` → Serves as `issueDescription` (customer's reported problem; nullable if missing in HCP)
- `notes` → Serves as `resolutionNotes` (technician's notes; nullable if missing in HCP)

**Added to `customerAddresses` schema (via migration):**
- `lastInspectionDate` → Tracks when property was last inspected (nullable to avoid breaking existing rows)
- `housecall_pro_address_id` → Links to HCP address record

---

## Summary of Key Decisions

| Decision | Resolution |
|----------|------------|
| Address/Property storage | Extend existing `customer_addresses` table - NO separate `customerProperties` table |
| `customerContext.housecallProId` | UNIQUE constraint for upsert operations |
| Job → Address relationship | Via `housecallProAddressId` crosswalk (not foreign key) |
| Batch API usage | Embeddings + Insights with full result ingestion workflow |
| Bidirectional sync | Push notes via `POST /customers/{id}/notes`, update tags/preferences via `PUT /customers/{id}` |

---

*Document updated based on architectural review feedback.*
