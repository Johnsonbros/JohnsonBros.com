-- Performance Optimization Migration
-- Adds critical indexes identified through query pattern analysis
-- Expected improvement: 10-100x faster for message history, bookings, and analytics

-- ============================================================================
-- CRITICAL PRIORITY: Multi-channel messaging performance
-- ============================================================================

-- Index 1: sharedThreadMessages by threadId
-- Used in: Every conversation history query (6+ locations in sharedThread.ts)
-- Impact: Eliminates full table scans on message retrieval
CREATE INDEX IF NOT EXISTS "shared_thread_messages_thread_id_idx"
ON "shared_thread_messages" ("thread_id");

-- Index 2: sharedThreadMessages by threadId + createdAt (composite)
-- Used in: Message history queries with ordering (.orderBy(desc(createdAt)))
-- Impact: Covering index for sorted message retrieval
CREATE INDEX IF NOT EXISTS "shared_thread_messages_thread_created_idx"
ON "shared_thread_messages" ("thread_id", "created_at" DESC);

-- ============================================================================
-- CRITICAL PRIORITY: Booking system performance
-- ============================================================================

-- Index 3: appointments by customerId
-- Used in: Customer booking lookups (dbStorage.ts:77)
-- Impact: Instant customer appointment history retrieval
CREATE INDEX IF NOT EXISTS "appointments_customer_id_idx"
ON "appointments" ("customer_id");

-- Index 4: appointments by date (for availability queries)
-- Used in: Finding appointments in date ranges
-- Impact: Faster availability calculation
CREATE INDEX IF NOT EXISTS "appointments_date_idx"
ON "appointments" ("date");

-- Index 5: appointments by status (for filtering)
-- Used in: Finding active/scheduled appointments
-- Impact: Faster status-based queries
CREATE INDEX IF NOT EXISTS "appointments_status_idx"
ON "appointments" ("status");

-- ============================================================================
-- HIGH PRIORITY: Admin dashboard analytics
-- ============================================================================

-- Index 6: apiUsage composite for analytics (covering index)
-- Used in: Admin dashboard cost aggregations (3+ queries in adminRoutes.ts)
-- Impact: Enables index-only scans for cost reports
CREATE INDEX IF NOT EXISTS "api_usage_analytics_idx"
ON "api_usage" ("created_at", "service", "channel");

-- ============================================================================
-- HIGH PRIORITY: OTP and identity management
-- ============================================================================

-- Index 7: sharedThreadPendingLinks rate limiting (composite)
-- Used in: OTP rate limiting checks (sharedThread.ts:274-279)
-- Impact: Instant rate limit checks without table scans
CREATE INDEX IF NOT EXISTS "shared_thread_pending_links_rate_limit_idx"
ON "shared_thread_pending_links" ("phone_e164", "created_at" DESC);

-- ============================================================================
-- MEDIUM PRIORITY: Webhook processing
-- ============================================================================

-- Index 8: webhookEvents status + receivedAt (composite)
-- Used in: Webhook queue processing
-- Impact: Faster webhook processing queue queries
CREATE INDEX IF NOT EXISTS "webhook_events_processing_idx"
ON "webhook_events" ("status", "received_at" DESC);

-- Index 9: attributionData conversionEventId (for JOINs)
-- Used in: Conversion funnel analysis with JOINs
-- Impact: Faster JOIN performance in analytics
CREATE INDEX IF NOT EXISTS "attribution_data_conversion_event_idx"
ON "attribution_data" ("conversion_event_id");

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- To verify indexes were created, run:
-- SELECT schemaname, tablename, indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename IN (
--   'shared_thread_messages',
--   'appointments',
--   'api_usage',
--   'shared_thread_pending_links',
--   'webhook_events',
--   'attribution_data'
-- )
-- ORDER BY tablename, indexname;
