CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "shared_thread_customers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "last_seen_at" timestamptz,
  "summary" text,
  "current_issue_summary" text,
  "opted_out_sms" boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS "shared_thread_identities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "type" text NOT NULL,
  "value" text NOT NULL,
  "customer_id" uuid NOT NULL REFERENCES "shared_thread_customers"("id"),
  "verified" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "shared_thread_identity_type_value_idx"
  ON "shared_thread_identities" ("type", "value");

CREATE TABLE IF NOT EXISTS "shared_thread_threads" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "customer_id" uuid NOT NULL REFERENCES "shared_thread_customers"("id"),
  "thread_key" text NOT NULL DEFAULT 'default',
  "provider_thread_id" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "last_message_at" timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS "shared_thread_customer_thread_key_idx"
  ON "shared_thread_threads" ("customer_id", "thread_key");

CREATE TABLE IF NOT EXISTS "shared_thread_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "thread_id" uuid NOT NULL REFERENCES "shared_thread_threads"("id"),
  "channel" text NOT NULL,
  "direction" text NOT NULL,
  "text" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "metadata" json
);

CREATE TABLE IF NOT EXISTS "shared_thread_pending_links" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "web_user_id" text NOT NULL,
  "phone_e164" text NOT NULL,
  "code_hash" text NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "attempt_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "shared_thread_pending_phone_idx"
  ON "shared_thread_pending_links" ("phone_e164");

CREATE INDEX IF NOT EXISTS "shared_thread_pending_web_user_idx"
  ON "shared_thread_pending_links" ("web_user_id");
