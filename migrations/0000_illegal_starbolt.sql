CREATE TABLE "ab_test_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"test_id" text NOT NULL,
	"variant_id" text NOT NULL,
	"visitor_id" text NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"session_id" text
);
--> statement-breakpoint
CREATE TABLE "ab_test_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"test_id" text NOT NULL,
	"variant_id" text NOT NULL,
	"visitor_id" text NOT NULL,
	"event_type" text NOT NULL,
	"event_action" text,
	"event_value" real,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ab_test_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"test_id" text NOT NULL,
	"variant_id" text NOT NULL,
	"impressions" integer DEFAULT 0 NOT NULL,
	"conversions" integer DEFAULT 0 NOT NULL,
	"conversion_rate" real DEFAULT 0 NOT NULL,
	"bounce_rate" real DEFAULT 0 NOT NULL,
	"avg_time_on_page" real,
	"revenue" real DEFAULT 0 NOT NULL,
	"statistical_significance" real,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ab_test_variants" (
	"id" serial PRIMARY KEY NOT NULL,
	"test_id" integer NOT NULL,
	"variant_id" text NOT NULL,
	"name" text NOT NULL,
	"weight" integer DEFAULT 50 NOT NULL,
	"is_control" boolean DEFAULT false NOT NULL,
	"changes" json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ab_tests" (
	"id" serial PRIMARY KEY NOT NULL,
	"test_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"traffic_allocation" real DEFAULT 1 NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"winner_variant_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ab_tests_test_id_unique" UNIQUE("test_id")
);
--> statement-breakpoint
CREATE TABLE "admin_activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"action" text NOT NULL,
	"entity_type" text,
	"entity_id" text,
	"details" text,
	"ip_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"type" text NOT NULL,
	"created_by" integer NOT NULL,
	"metadata" text,
	"is_template" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"role" text NOT NULL,
	"permissions" text[] NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_permissions_role_unique" UNIQUE("role")
);
--> statement-breakpoint
CREATE TABLE "admin_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"session_token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"last_rotated_at" timestamp DEFAULT now() NOT NULL,
	"revoked_at" timestamp,
	"revoked_reason" text,
	"last_activity_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "admin_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"assigned_to" integer,
	"created_by" integer NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"due_date" timestamp,
	"completed_at" timestamp,
	"category" text,
	"tags" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"role" text DEFAULT 'staff' NOT NULL,
	"is_active" boolean DEFAULT true,
	"last_login_at" timestamp,
	"failed_login_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "agent_conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"channel" text DEFAULT 'web_chat' NOT NULL,
	"customer_phone" text,
	"customer_id" integer,
	"system_prompt" text,
	"messages" json DEFAULT '[]'::json,
	"total_tokens" integer DEFAULT 0,
	"total_tool_calls" integer DEFAULT 0,
	"outcome" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"metadata" json,
	CONSTRAINT "agent_conversations_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "agent_eval_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"eval_id" integer NOT NULL,
	"run_id" text NOT NULL,
	"passed" boolean NOT NULL,
	"actual_output" text,
	"actual_tool_calls" json,
	"failure_reason" text,
	"latency_ms" integer,
	"model_used" text,
	"prompt_version" text,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_evals" (
	"id" serial PRIMARY KEY NOT NULL,
	"eval_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"input_messages" json NOT NULL,
	"expected_behavior" text NOT NULL,
	"expected_tool_calls" json,
	"expected_output" text,
	"pass_criteria" json,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agent_evals_eval_id_unique" UNIQUE("eval_id")
);
--> statement-breakpoint
CREATE TABLE "agent_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"tool_call_id" integer,
	"message_index" integer,
	"feedback_type" text NOT NULL,
	"rating" integer,
	"original_response" text,
	"corrected_response" text,
	"flag_reason" text,
	"annotation" text,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"included_in_training" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_tool_calls" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"tool_name" text NOT NULL,
	"tool_call_id" text NOT NULL,
	"arguments" json,
	"result" json,
	"success" boolean DEFAULT true NOT NULL,
	"error_message" text,
	"latency_ms" integer,
	"tokens_before" integer,
	"user_message_trigger" text,
	"was_correct_tool" boolean,
	"correct_tool_suggestion" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_chat_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"context" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer,
	"service_type" text NOT NULL,
	"date" timestamp NOT NULL,
	"time_slot" text NOT NULL,
	"address" text,
	"notes" text,
	"status" text DEFAULT 'scheduled',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attribution_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"conversion_event_id" integer,
	"source" text NOT NULL,
	"medium" text NOT NULL,
	"campaign" text,
	"term" text,
	"content" text,
	"gclid" text,
	"fbclid" text,
	"msclkid" text,
	"utm_id" text,
	"referrer" text,
	"landing_page" text,
	"entry_time" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"date" timestamp NOT NULL,
	"page_views" integer DEFAULT 0,
	"unique_visitors" integer DEFAULT 0,
	"avg_time_on_page" integer,
	"bounce_rate" real,
	"conversion_rate" real,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"content" text NOT NULL,
	"featured_image" text,
	"meta_title" text,
	"meta_description" text,
	"author" text DEFAULT 'Johnson Bros. Plumbing' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"publish_date" timestamp,
	"view_count" integer DEFAULT 0 NOT NULL,
	"reading_time" integer,
	"category" text,
	"tags" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "check_ins" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" text NOT NULL,
	"job_location_id" integer,
	"technician_name" text,
	"customer_name" text,
	"service_type" text NOT NULL,
	"city" text,
	"state" text,
	"status" text DEFAULT 'completed' NOT NULL,
	"check_in_time" timestamp NOT NULL,
	"completed_at" timestamp,
	"notes" text,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversion_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"event_type" text NOT NULL,
	"event_value" real,
	"properties" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversion_funnels" (
	"id" serial PRIMARY KEY NOT NULL,
	"funnel_id" text NOT NULL,
	"name" text NOT NULL,
	"stages" json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "conversion_funnels_funnel_id_unique" UNIQUE("funnel_id")
);
--> statement-breakpoint
CREATE TABLE "customer_addresses" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"street" text,
	"city" text,
	"state" text,
	"zip" text,
	"latitude" real,
	"longitude" real,
	"display_lat" real,
	"display_lng" real,
	"job_count" integer DEFAULT 0 NOT NULL,
	"last_service_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_credits" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"amount" integer NOT NULL,
	"type" text DEFAULT 'referral' NOT NULL,
	"source_referral_id" integer,
	"applied_to_job_id" text,
	"status" text DEFAULT 'available' NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"applied_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"normalized_phone" text,
	"housecall_pro_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "dashboard_widgets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"widget_type" text NOT NULL,
	"position" integer NOT NULL,
	"grid_layout" json,
	"config" text,
	"is_visible" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"content" text NOT NULL,
	"trigger_type" text NOT NULL,
	"trigger_delay" integer,
	"category" text NOT NULL,
	"variables" json,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_templates_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "google_ads_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"campaign_name" text NOT NULL,
	"status" text NOT NULL,
	"type" text NOT NULL,
	"budget" real,
	"impressions" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"cost" real DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"conversion_value" real DEFAULT 0,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "google_ads_campaigns_campaign_id_unique" UNIQUE("campaign_id")
);
--> statement-breakpoint
CREATE TABLE "heat_map_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"grid_lat" real NOT NULL,
	"grid_lng" real NOT NULL,
	"point_count" integer DEFAULT 1 NOT NULL,
	"intensity" real DEFAULT 1 NOT NULL,
	"city_name" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "heat_map_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"snapshot_date" timestamp NOT NULL,
	"image_url" text NOT NULL,
	"image_data" text,
	"data_point_count" integer DEFAULT 0,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" text
);
--> statement-breakpoint
CREATE TABLE "job_locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" text NOT NULL,
	"customer_id" text,
	"latitude" real NOT NULL,
	"longitude" real NOT NULL,
	"display_lat" real NOT NULL,
	"display_lng" real NOT NULL,
	"city" text,
	"state" text,
	"service_type" text,
	"job_date" timestamp NOT NULL,
	"source" text DEFAULT 'webhook' NOT NULL,
	"intensity" real DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "keyword_rankings" (
	"id" serial PRIMARY KEY NOT NULL,
	"keyword_id" integer NOT NULL,
	"position" integer,
	"previous_position" integer,
	"url" text,
	"search_engine" text DEFAULT 'google',
	"location" text DEFAULT 'Quincy, MA',
	"impressions" integer,
	"clicks" integer,
	"ctr" real,
	"tracked_date" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "keywords" (
	"id" serial PRIMARY KEY NOT NULL,
	"keyword" text NOT NULL,
	"search_volume" integer,
	"difficulty" integer,
	"competition" text,
	"search_intent" text,
	"location" text DEFAULT 'Quincy, MA',
	"is_primary" boolean DEFAULT false,
	"last_tracked" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "keywords_keyword_unique" UNIQUE("keyword")
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"unit_number" text,
	"service_type" text,
	"message" text,
	"campaign_source" text,
	"campaign_medium" text,
	"campaign_name" text,
	"landing_page" text,
	"gclid" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"utm_term" text,
	"utm_content" text,
	"referrer" text,
	"status" text DEFAULT 'new' NOT NULL,
	"converted_customer_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"tier" text NOT NULL,
	"price" real NOT NULL,
	"billing_cycle" text DEFAULT 'annual' NOT NULL,
	"inspections_per_year" integer NOT NULL,
	"discount_percentage" integer DEFAULT 0 NOT NULL,
	"priority_level" text NOT NULL,
	"features" json NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "maintenance_plans_tier_unique" UNIQUE("tier")
);
--> statement-breakpoint
CREATE TABLE "member_benefits" (
	"id" serial PRIMARY KEY NOT NULL,
	"subscription_id" integer NOT NULL,
	"benefit_type" text NOT NULL,
	"used_date" timestamp NOT NULL,
	"service_id" text,
	"amount_saved" real,
	"details" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"plan_id" integer NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"next_inspection_date" timestamp,
	"last_inspection_date" timestamp,
	"inspections_used" integer DEFAULT 0 NOT NULL,
	"total_savings" real DEFAULT 0 NOT NULL,
	"referral_code" text,
	"referred_by" integer,
	"free_months_earned" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "member_subscriptions_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "micro_conversions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"event_type" text NOT NULL,
	"properties" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_keywords" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"keyword_id" integer NOT NULL,
	"is_primary" boolean DEFAULT false,
	"keyword_density" real,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" serial PRIMARY KEY NOT NULL,
	"referrer_customer_id" text NOT NULL,
	"referrer_name" text NOT NULL,
	"referrer_phone" text NOT NULL,
	"referred_lead_id" text,
	"referred_name" text NOT NULL,
	"referred_phone" text NOT NULL,
	"referred_email" text,
	"referral_code" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"discount_amount" integer DEFAULT 9900,
	"discount_applied" boolean DEFAULT false,
	"notes" text,
	"job_id" text,
	"converted_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "referrals_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "revenue_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"metric_type" text NOT NULL,
	"amount" real NOT NULL,
	"transaction_count" integer DEFAULT 0 NOT NULL,
	"average_value" real,
	"plan_conversions" integer DEFAULT 0,
	"upsell_conversions" integer DEFAULT 0,
	"customer_lifetime_value" real,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_areas" (
	"id" serial PRIMARY KEY NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"center_lat" real NOT NULL,
	"center_lng" real NOT NULL,
	"total_jobs" integer DEFAULT 0 NOT NULL,
	"total_customers" integer DEFAULT 0 NOT NULL,
	"boundary_north" real,
	"boundary_south" real,
	"boundary_east" real,
	"boundary_west" real,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "service_areas_city_unique" UNIQUE("city")
);
--> statement-breakpoint
CREATE TABLE "sync_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"sync_type" text NOT NULL,
	"last_sync_at" timestamp,
	"records_processed" integer DEFAULT 0,
	"status" text DEFAULT 'pending',
	"error" text,
	CONSTRAINT "sync_status_sync_type_unique" UNIQUE("sync_type")
);
--> statement-breakpoint
CREATE TABLE "upsell_offers" (
	"id" serial PRIMARY KEY NOT NULL,
	"trigger_service" text NOT NULL,
	"upsell_service" text NOT NULL,
	"bundle_price" real,
	"savings_amount" real,
	"display_order" integer DEFAULT 0 NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"event_category" text NOT NULL,
	"total_events" integer DEFAULT 0,
	"processed_events" integer DEFAULT 0,
	"failed_events" integer DEFAULT 0,
	"new_customers" integer DEFAULT 0,
	"jobs_completed" integer DEFAULT 0,
	"estimates_sent" integer DEFAULT 0,
	"invoices_created" integer DEFAULT 0,
	"total_revenue" real DEFAULT 0,
	"avg_processing_time" integer,
	"success_rate" real,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_event_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"tag_name" text NOT NULL,
	"tag_value" text,
	"tag_category" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" text,
	"event_type" text NOT NULL,
	"event_category" text NOT NULL,
	"entity_id" text,
	"company_id" text,
	"payload" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"processed_at" timestamp,
	"error" text,
	"retry_count" integer DEFAULT 0,
	"received_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "webhook_events_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "webhook_processed_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"data_type" text NOT NULL,
	"data_category" text,
	"entity_data" text NOT NULL,
	"customer_name" text,
	"customer_email" text,
	"customer_phone" text,
	"job_number" text,
	"invoice_number" text,
	"estimate_number" text,
	"total_amount" real,
	"service_date" timestamp,
	"service_type" text,
	"employee_name" text,
	"address_city" text,
	"address_state" text,
	"is_high_value" boolean DEFAULT false,
	"is_emergency" boolean DEFAULT false,
	"is_repeat_customer" boolean DEFAULT false,
	"is_new_customer" boolean DEFAULT false,
	"processed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"webhook_url" text NOT NULL,
	"event_types" text[],
	"is_active" boolean DEFAULT true,
	"secret_key" text,
	"last_received_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "website_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"page_views" integer DEFAULT 0,
	"unique_visitors" integer DEFAULT 0,
	"bounce_rate" real,
	"avg_session_duration" integer,
	"conversion_rate" real,
	"top_pages" text,
	"traffic_sources" text,
	"device_types" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ab_test_variants" ADD CONSTRAINT "ab_test_variants_test_id_ab_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."ab_tests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_activity_logs" ADD CONSTRAINT "admin_activity_logs_user_id_admin_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_documents" ADD CONSTRAINT "admin_documents_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_user_id_admin_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_tasks" ADD CONSTRAINT "admin_tasks_assigned_to_admin_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_tasks" ADD CONSTRAINT "admin_tasks_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_conversations" ADD CONSTRAINT "agent_conversations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_eval_runs" ADD CONSTRAINT "agent_eval_runs_eval_id_agent_evals_id_fk" FOREIGN KEY ("eval_id") REFERENCES "public"."agent_evals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_feedback" ADD CONSTRAINT "agent_feedback_conversation_id_agent_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."agent_conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_feedback" ADD CONSTRAINT "agent_feedback_tool_call_id_agent_tool_calls_id_fk" FOREIGN KEY ("tool_call_id") REFERENCES "public"."agent_tool_calls"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_tool_calls" ADD CONSTRAINT "agent_tool_calls_conversation_id_agent_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."agent_conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_chat_messages" ADD CONSTRAINT "ai_chat_messages_session_id_ai_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."ai_chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_chat_sessions" ADD CONSTRAINT "ai_chat_sessions_user_id_admin_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attribution_data" ADD CONSTRAINT "attribution_data_conversion_event_id_conversion_events_id_fk" FOREIGN KEY ("conversion_event_id") REFERENCES "public"."conversion_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_analytics" ADD CONSTRAINT "blog_analytics_post_id_blog_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_job_location_id_job_locations_id_fk" FOREIGN KEY ("job_location_id") REFERENCES "public"."job_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_credits" ADD CONSTRAINT "customer_credits_source_referral_id_referrals_id_fk" FOREIGN KEY ("source_referral_id") REFERENCES "public"."referrals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_widgets" ADD CONSTRAINT "dashboard_widgets_user_id_admin_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keyword_rankings" ADD CONSTRAINT "keyword_rankings_keyword_id_keywords_id_fk" FOREIGN KEY ("keyword_id") REFERENCES "public"."keywords"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_converted_customer_id_customers_id_fk" FOREIGN KEY ("converted_customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_benefits" ADD CONSTRAINT "member_benefits_subscription_id_member_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."member_subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_subscriptions" ADD CONSTRAINT "member_subscriptions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_subscriptions" ADD CONSTRAINT "member_subscriptions_plan_id_maintenance_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."maintenance_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_subscriptions" ADD CONSTRAINT "member_subscriptions_referred_by_customers_id_fk" FOREIGN KEY ("referred_by") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_keywords" ADD CONSTRAINT "post_keywords_post_id_blog_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_keywords" ADD CONSTRAINT "post_keywords_keyword_id_keywords_id_fk" FOREIGN KEY ("keyword_id") REFERENCES "public"."keywords"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_event_tags" ADD CONSTRAINT "webhook_event_tags_event_id_webhook_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."webhook_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_processed_data" ADD CONSTRAINT "webhook_processed_data_event_id_webhook_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."webhook_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "visitor_test_idx" ON "ab_test_assignments" USING btree ("visitor_id","test_id");--> statement-breakpoint
CREATE INDEX "assignment_test_variant_idx" ON "ab_test_assignments" USING btree ("test_id","variant_id");--> statement-breakpoint
CREATE INDEX "test_variant_event_idx" ON "ab_test_events" USING btree ("test_id","variant_id","event_type");--> statement-breakpoint
CREATE INDEX "visitor_event_idx" ON "ab_test_events" USING btree ("visitor_id","event_type");--> statement-breakpoint
CREATE INDEX "event_created_at_idx" ON "ab_test_events" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "test_variant_metrics_idx" ON "ab_test_metrics" USING btree ("test_id","variant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "test_variant_idx" ON "ab_test_variants" USING btree ("test_id","variant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "test_id_idx" ON "ab_tests" USING btree ("test_id");--> statement-breakpoint
CREATE INDEX "ab_test_status_idx" ON "ab_tests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "activity_user_idx" ON "admin_activity_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "activity_action_idx" ON "admin_activity_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "activity_created_idx" ON "admin_activity_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "doc_created_by_idx" ON "admin_documents" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "doc_type_idx" ON "admin_documents" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "permission_role_idx" ON "admin_permissions" USING btree ("role");--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_idx" ON "admin_sessions" USING btree ("session_token");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "admin_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_revoked_idx" ON "admin_sessions" USING btree ("revoked_at");--> statement-breakpoint
CREATE INDEX "task_assigned_idx" ON "admin_tasks" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "task_status_idx" ON "admin_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "task_due_date_idx" ON "admin_tasks" USING btree ("due_date");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_email_idx" ON "admin_users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "admin_role_idx" ON "admin_users" USING btree ("role");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_conv_session_idx" ON "agent_conversations" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "agent_conv_channel_idx" ON "agent_conversations" USING btree ("channel");--> statement-breakpoint
CREATE INDEX "agent_conv_customer_idx" ON "agent_conversations" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "agent_conv_started_idx" ON "agent_conversations" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "agent_conv_outcome_idx" ON "agent_conversations" USING btree ("outcome");--> statement-breakpoint
CREATE INDEX "eval_run_eval_idx" ON "agent_eval_runs" USING btree ("eval_id");--> statement-breakpoint
CREATE INDEX "eval_run_passed_idx" ON "agent_eval_runs" USING btree ("passed");--> statement-breakpoint
CREATE INDEX "eval_run_id_idx" ON "agent_eval_runs" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "eval_run_created_idx" ON "agent_eval_runs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "eval_id_idx" ON "agent_evals" USING btree ("eval_id");--> statement-breakpoint
CREATE INDEX "eval_category_idx" ON "agent_evals" USING btree ("category");--> statement-breakpoint
CREATE INDEX "feedback_conv_idx" ON "agent_feedback" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "feedback_type_idx" ON "agent_feedback" USING btree ("feedback_type");--> statement-breakpoint
CREATE INDEX "feedback_included_idx" ON "agent_feedback" USING btree ("included_in_training");--> statement-breakpoint
CREATE INDEX "feedback_rating_idx" ON "agent_feedback" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "tool_call_conv_idx" ON "agent_tool_calls" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "tool_call_name_idx" ON "agent_tool_calls" USING btree ("tool_name");--> statement-breakpoint
CREATE INDEX "tool_call_success_idx" ON "agent_tool_calls" USING btree ("success");--> statement-breakpoint
CREATE INDEX "tool_call_created_idx" ON "agent_tool_calls" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ai_message_session_idx" ON "ai_chat_messages" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "ai_session_user_idx" ON "ai_chat_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_session_status_idx" ON "ai_chat_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "attribution_session_idx" ON "attribution_data" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "attribution_source_idx" ON "attribution_data" USING btree ("source");--> statement-breakpoint
CREATE INDEX "attribution_medium_idx" ON "attribution_data" USING btree ("medium");--> statement-breakpoint
CREATE INDEX "attribution_campaign_idx" ON "attribution_data" USING btree ("campaign");--> statement-breakpoint
CREATE UNIQUE INDEX "post_date_idx" ON "blog_analytics" USING btree ("post_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "slug_idx" ON "blog_posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "status_idx" ON "blog_posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "publish_date_idx" ON "blog_posts" USING btree ("publish_date");--> statement-breakpoint
CREATE INDEX "category_idx" ON "blog_posts" USING btree ("category");--> statement-breakpoint
CREATE INDEX "checkin_job_id_idx" ON "check_ins" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "checkin_time_idx" ON "check_ins" USING btree ("check_in_time");--> statement-breakpoint
CREATE INDEX "checkin_status_idx" ON "check_ins" USING btree ("status");--> statement-breakpoint
CREATE INDEX "checkin_visible_idx" ON "check_ins" USING btree ("is_visible");--> statement-breakpoint
CREATE INDEX "checkin_city_idx" ON "check_ins" USING btree ("city");--> statement-breakpoint
CREATE INDEX "conversion_session_idx" ON "conversion_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "conversion_event_type_idx" ON "conversion_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "conversion_created_at_idx" ON "conversion_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "customer_id_idx" ON "customer_addresses" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "city_idx" ON "customer_addresses" USING btree ("city");--> statement-breakpoint
CREATE INDEX "coords_idx" ON "customer_addresses" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE INDEX "credit_customer_idx" ON "customer_credits" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "credit_status_idx" ON "customer_credits" USING btree ("status");--> statement-breakpoint
CREATE INDEX "credit_type_idx" ON "customer_credits" USING btree ("type");--> statement-breakpoint
CREATE INDEX "normalized_phone_idx" ON "customers" USING btree ("normalized_phone");--> statement-breakpoint
CREATE INDEX "widget_user_idx" ON "dashboard_widgets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "template_name_idx" ON "email_templates" USING btree ("name");--> statement-breakpoint
CREATE INDEX "template_category_idx" ON "email_templates" USING btree ("category");--> statement-breakpoint
CREATE UNIQUE INDEX "gads_campaign_id_idx" ON "google_ads_campaigns" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "gads_status_idx" ON "google_ads_campaigns" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "grid_idx" ON "heat_map_cache" USING btree ("grid_lat","grid_lng");--> statement-breakpoint
CREATE UNIQUE INDEX "snapshot_date_idx" ON "heat_map_snapshots" USING btree ("snapshot_date");--> statement-breakpoint
CREATE INDEX "snapshot_active_idx" ON "heat_map_snapshots" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "job_id_idx" ON "job_locations" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "job_coords_idx" ON "job_locations" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE INDEX "job_date_idx" ON "job_locations" USING btree ("job_date");--> statement-breakpoint
CREATE INDEX "job_city_idx" ON "job_locations" USING btree ("city");--> statement-breakpoint
CREATE INDEX "job_source_idx" ON "job_locations" USING btree ("source");--> statement-breakpoint
CREATE INDEX "job_active_idx" ON "job_locations" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "keyword_date_idx" ON "keyword_rankings" USING btree ("keyword_id","tracked_date");--> statement-breakpoint
CREATE UNIQUE INDEX "keyword_idx" ON "keywords" USING btree ("keyword");--> statement-breakpoint
CREATE INDEX "intent_idx" ON "keywords" USING btree ("search_intent");--> statement-breakpoint
CREATE INDEX "lead_phone_idx" ON "leads" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "lead_email_idx" ON "leads" USING btree ("email");--> statement-breakpoint
CREATE INDEX "lead_status_idx" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "lead_campaign_idx" ON "leads" USING btree ("campaign_name");--> statement-breakpoint
CREATE INDEX "lead_landing_page_idx" ON "leads" USING btree ("landing_page");--> statement-breakpoint
CREATE INDEX "lead_created_at_idx" ON "leads" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "tier_idx" ON "maintenance_plans" USING btree ("tier");--> statement-breakpoint
CREATE INDEX "member_benefit_subscription_idx" ON "member_benefits" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "member_benefit_type_idx" ON "member_benefits" USING btree ("benefit_type");--> statement-breakpoint
CREATE INDEX "member_sub_customer_idx" ON "member_subscriptions" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "member_sub_status_idx" ON "member_subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "member_sub_referral_code_idx" ON "member_subscriptions" USING btree ("referral_code");--> statement-breakpoint
CREATE INDEX "micro_session_idx" ON "micro_conversions" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "micro_event_type_idx" ON "micro_conversions" USING btree ("event_type");--> statement-breakpoint
CREATE UNIQUE INDEX "post_keyword_idx" ON "post_keywords" USING btree ("post_id","keyword_id");--> statement-breakpoint
CREATE INDEX "referrer_customer_idx" ON "referrals" USING btree ("referrer_customer_id");--> statement-breakpoint
CREATE INDEX "referred_lead_idx" ON "referrals" USING btree ("referred_lead_id");--> statement-breakpoint
CREATE INDEX "referral_status_idx" ON "referrals" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "referral_code_idx" ON "referrals" USING btree ("referral_code");--> statement-breakpoint
CREATE INDEX "date_idx" ON "revenue_metrics" USING btree ("date");--> statement-breakpoint
CREATE INDEX "metric_type_idx" ON "revenue_metrics" USING btree ("metric_type");--> statement-breakpoint
CREATE UNIQUE INDEX "city_state_idx" ON "service_areas" USING btree ("city","state");--> statement-breakpoint
CREATE INDEX "trigger_service_idx" ON "upsell_offers" USING btree ("trigger_service");--> statement-breakpoint
CREATE INDEX "upsell_active_offers_idx" ON "upsell_offers" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "date_event_idx" ON "webhook_analytics" USING btree ("date","event_category");--> statement-breakpoint
CREATE INDEX "analytics_date_idx" ON "webhook_analytics" USING btree ("date");--> statement-breakpoint
CREATE INDEX "webhook_tag_event_id_idx" ON "webhook_event_tags" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "webhook_tag_name_idx" ON "webhook_event_tags" USING btree ("tag_name");--> statement-breakpoint
CREATE INDEX "webhook_tag_category_idx" ON "webhook_event_tags" USING btree ("tag_category");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_event_tag" ON "webhook_event_tags" USING btree ("event_id","tag_name");--> statement-breakpoint
CREATE INDEX "webhook_event_type_idx" ON "webhook_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "webhook_event_category_idx" ON "webhook_events" USING btree ("event_category");--> statement-breakpoint
CREATE INDEX "webhook_entity_id_idx" ON "webhook_events" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "webhook_status_idx" ON "webhook_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "webhook_received_at_idx" ON "webhook_events" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "processed_event_id_idx" ON "webhook_processed_data" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "data_type_idx" ON "webhook_processed_data" USING btree ("data_type");--> statement-breakpoint
CREATE INDEX "data_category_idx" ON "webhook_processed_data" USING btree ("data_category");--> statement-breakpoint
CREATE INDEX "customer_email_idx" ON "webhook_processed_data" USING btree ("customer_email");--> statement-breakpoint
CREATE INDEX "service_date_idx" ON "webhook_processed_data" USING btree ("service_date");--> statement-breakpoint
CREATE INDEX "high_value_idx" ON "webhook_processed_data" USING btree ("is_high_value");--> statement-breakpoint
CREATE UNIQUE INDEX "company_id_sub_idx" ON "webhook_subscriptions" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "active_sub_idx" ON "webhook_subscriptions" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "website_analytics_date_idx" ON "website_analytics" USING btree ("date");