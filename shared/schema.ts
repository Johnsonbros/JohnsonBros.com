import { pgTable, serial, text, timestamp, real, integer, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Customer addresses table - stores all customer locations from Housecall Pro
export const customerAddresses = pgTable('customer_addresses', {
  id: serial('id').primaryKey(),
  customerId: text('customer_id').notNull(),
  street: text('street'),
  city: text('city'),
  state: text('state'),
  zip: text('zip'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  // Privacy-protected coordinates (offset for display)
  displayLat: real('display_lat'),
  displayLng: real('display_lng'),
  jobCount: integer('job_count').default(0).notNull(),
  lastServiceDate: timestamp('last_service_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  customerIdIdx: index('customer_id_idx').on(table.customerId),
  cityIdx: index('city_idx').on(table.city),
  coordsIdx: index('coords_idx').on(table.latitude, table.longitude),
}));

// Service areas aggregation table
export const serviceAreas = pgTable('service_areas', {
  id: serial('id').primaryKey(),
  city: text('city').notNull().unique(),
  state: text('state').notNull(),
  centerLat: real('center_lat').notNull(),
  centerLng: real('center_lng').notNull(),
  totalJobs: integer('total_jobs').default(0).notNull(),
  totalCustomers: integer('total_customers').default(0).notNull(),
  boundaryNorth: real('boundary_north'),
  boundarySouth: real('boundary_south'),
  boundaryEast: real('boundary_east'),
  boundaryWest: real('boundary_west'),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
}, (table) => ({
  cityStateIdx: uniqueIndex('city_state_idx').on(table.city, table.state),
}));

// Heat map cache table for optimized display
export const heatMapCache = pgTable('heat_map_cache', {
  id: serial('id').primaryKey(),
  gridLat: real('grid_lat').notNull(), // Rounded to grid for clustering
  gridLng: real('grid_lng').notNull(),
  pointCount: integer('point_count').default(1).notNull(),
  intensity: real('intensity').default(1).notNull(),
  cityName: text('city_name'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  gridIdx: uniqueIndex('grid_idx').on(table.gridLat, table.gridLng),
}));

// Sync status table
export const syncStatus = pgTable('sync_status', {
  id: serial('id').primaryKey(),
  syncType: text('sync_type').notNull().unique(), // 'customers', 'jobs'
  lastSyncAt: timestamp('last_sync_at'),
  recordsProcessed: integer('records_processed').default(0),
  status: text('status').default('pending'), // 'pending', 'running', 'completed', 'failed'
  error: text('error'),
});

// Relations
export const customerAddressesRelations = relations(customerAddresses, ({ one }) => ({
  serviceArea: one(serviceAreas, {
    fields: [customerAddresses.city],
    references: [serviceAreas.city],
  }),
}));

// Insert schemas
export const insertCustomerAddressSchema = createInsertSchema(customerAddresses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceAreaSchema = createInsertSchema(serviceAreas).omit({
  id: true,
  lastUpdated: true,
});

export const insertHeatMapCacheSchema = createInsertSchema(heatMapCache).omit({
  id: true,
  updatedAt: true,
});

// Types
export type CustomerAddress = typeof customerAddresses.$inferSelect;
export type InsertCustomerAddress = z.infer<typeof insertCustomerAddressSchema>;

export type ServiceArea = typeof serviceAreas.$inferSelect;
export type InsertServiceArea = z.infer<typeof insertServiceAreaSchema>;

export type HeatMapCache = typeof heatMapCache.$inferSelect;
export type InsertHeatMapCache = z.infer<typeof insertHeatMapCacheSchema>;

export type SyncStatus = typeof syncStatus.$inferSelect;

// Customer table for booking system
export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  housecallProId: text('housecall_pro_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Appointments table for booking system  
export const appointments = pgTable('appointments', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').references(() => customers.id),
  serviceType: text('service_type').notNull(),
  date: timestamp('date').notNull(),
  timeSlot: text('time_slot').notNull(),
  address: text('address'),
  notes: text('notes'),
  status: text('status').default('scheduled'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Insert schemas for booking system
export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
});

// Types for booking system
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

// Service type for API responses
export type Service = {
  id: string;
  name: string;
  price: number;
  type: string;
  source?: string;
  description?: string;
  category?: string;
};

// Available time slot type
export type AvailableTimeSlot = {
  id: string;
  startTime: string;
  endTime: string;
  date: string;
  available: boolean;
  isAvailable: boolean;
  employeeIds?: string[];
};

// Review type for testimonials
export type Review = {
  id: string;
  customerName: string;
  rating: number;
  text: string;
  serviceType: string;
  date: string;
  verified?: boolean;
};

// BookingFormData type
export type BookingFormData = {
  name: string;
  email: string;
  phone: string;
  service: string;
  date: string;
  timeSlot: string;
  address: string;
  notes?: string;
};

// Blog Posts table
export const blogPosts = pgTable('blog_posts', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  excerpt: text('excerpt'),
  content: text('content').notNull(),
  featuredImage: text('featured_image'),
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  author: text('author').notNull().default('Johnson Bros. Plumbing'),
  status: text('status').notNull().default('draft'), // draft, published, scheduled
  publishDate: timestamp('publish_date'),
  viewCount: integer('view_count').default(0).notNull(),
  readingTime: integer('reading_time'), // in minutes
  category: text('category'),
  tags: text('tags').array(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex('slug_idx').on(table.slug),
  statusIdx: index('status_idx').on(table.status),
  publishDateIdx: index('publish_date_idx').on(table.publishDate),
  categoryIdx: index('category_idx').on(table.category),
}));

// Keywords table for SEO tracking
export const keywords = pgTable('keywords', {
  id: serial('id').primaryKey(),
  keyword: text('keyword').notNull().unique(),
  searchVolume: integer('search_volume'),
  difficulty: integer('difficulty'), // 0-100 scale
  competition: text('competition'), // low, medium, high
  searchIntent: text('search_intent'), // informational, transactional, navigational, commercial
  location: text('location').default('Quincy, MA'),
  isPrimary: boolean('is_primary').default(false),
  lastTracked: timestamp('last_tracked'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  keywordIdx: uniqueIndex('keyword_idx').on(table.keyword),
  intentIdx: index('intent_idx').on(table.searchIntent),
}));

// Post Keywords junction table (many-to-many)
export const postKeywords = pgTable('post_keywords', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').notNull().references(() => blogPosts.id, { onDelete: 'cascade' }),
  keywordId: integer('keyword_id').notNull().references(() => keywords.id, { onDelete: 'cascade' }),
  isPrimary: boolean('is_primary').default(false),
  keywordDensity: real('keyword_density'), // percentage
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  postKeywordIdx: uniqueIndex('post_keyword_idx').on(table.postId, table.keywordId),
}));

// Keyword Rankings tracking table
export const keywordRankings = pgTable('keyword_rankings', {
  id: serial('id').primaryKey(),
  keywordId: integer('keyword_id').notNull().references(() => keywords.id, { onDelete: 'cascade' }),
  position: integer('position'), // SERP position
  previousPosition: integer('previous_position'),
  url: text('url'),
  searchEngine: text('search_engine').default('google'),
  location: text('location').default('Quincy, MA'),
  impressions: integer('impressions'),
  clicks: integer('clicks'),
  ctr: real('ctr'), // click-through rate
  trackedDate: timestamp('tracked_date').defaultNow().notNull(),
}, (table) => ({
  keywordDateIdx: index('keyword_date_idx').on(table.keywordId, table.trackedDate),
}));

// Blog Analytics table
export const blogAnalytics = pgTable('blog_analytics', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').notNull().references(() => blogPosts.id, { onDelete: 'cascade' }),
  date: timestamp('date').notNull(),
  pageViews: integer('page_views').default(0),
  uniqueVisitors: integer('unique_visitors').default(0),
  avgTimeOnPage: integer('avg_time_on_page'), // in seconds
  bounceRate: real('bounce_rate'), // percentage
  conversionRate: real('conversion_rate'), // percentage
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  postDateIdx: uniqueIndex('post_date_idx').on(table.postId, table.date),
}));

// Relations for blog system
export const blogPostsRelations = relations(blogPosts, ({ many }) => ({
  postKeywords: many(postKeywords),
  analytics: many(blogAnalytics),
}));

export const keywordsRelations = relations(keywords, ({ many }) => ({
  postKeywords: many(postKeywords),
  rankings: many(keywordRankings),
}));

export const postKeywordsRelations = relations(postKeywords, ({ one }) => ({
  post: one(blogPosts, {
    fields: [postKeywords.postId],
    references: [blogPosts.id],
  }),
  keyword: one(keywords, {
    fields: [postKeywords.keywordId],
    references: [keywords.id],
  }),
}));

// Insert schemas for blog system
export const insertBlogPostSchema = createInsertSchema(blogPosts)
  .omit({
    id: true,
    viewCount: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    title: z.string().min(1, 'Title is required').max(200),
    slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
    content: z.string().min(100, 'Content must be at least 100 characters'),
    status: z.enum(['draft', 'published', 'scheduled']),
    publishDate: z.string().optional(),
    metaTitle: z.string().max(60).optional(),
    metaDescription: z.string().max(160).optional(),
  });

export const insertKeywordSchema = createInsertSchema(keywords).omit({
  id: true,
  createdAt: true,
  lastTracked: true,
});

export const insertPostKeywordSchema = createInsertSchema(postKeywords).omit({
  id: true,
  createdAt: true,
});

export const insertKeywordRankingSchema = createInsertSchema(keywordRankings).omit({
  id: true,
  trackedDate: true,
});

export const insertBlogAnalyticsSchema = createInsertSchema(blogAnalytics).omit({
  id: true,
  createdAt: true,
});

// Types for blog system
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;

export type Keyword = typeof keywords.$inferSelect;
export type InsertKeyword = z.infer<typeof insertKeywordSchema>;

export type PostKeyword = typeof postKeywords.$inferSelect;
export type InsertPostKeyword = z.infer<typeof insertPostKeywordSchema>;

export type KeywordRanking = typeof keywordRankings.$inferSelect;
export type InsertKeywordRanking = z.infer<typeof insertKeywordRankingSchema>;

export type BlogAnalytics = typeof blogAnalytics.$inferSelect;
export type InsertBlogAnalytics = z.infer<typeof insertBlogAnalyticsSchema>;

// ============================================
// WEBHOOK INTEGRATION SYSTEM
// ============================================

// Webhook Events table - stores all incoming webhook events from Housecall Pro
export const webhookEvents = pgTable('webhook_events', {
  id: serial('id').primaryKey(),
  eventId: text('event_id').unique(), // Housecall Pro event ID
  eventType: text('event_type').notNull(), // e.g., 'customer.created', 'job.completed'
  eventCategory: text('event_category').notNull(), // 'customer', 'job', 'estimate', 'invoice', 'appointment', 'lead'
  entityId: text('entity_id'), // ID of the related entity (customer_id, job_id, etc.)
  companyId: text('company_id'),
  payload: text('payload').notNull(), // JSON string of the full webhook payload
  status: text('status').notNull().default('pending'), // 'pending', 'processed', 'failed', 'archived'
  processedAt: timestamp('processed_at'),
  error: text('error'),
  retryCount: integer('retry_count').default(0),
  receivedAt: timestamp('received_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  eventTypeIdx: index('webhook_event_type_idx').on(table.eventType),
  eventCategoryIdx: index('webhook_event_category_idx').on(table.eventCategory),
  entityIdIdx: index('webhook_entity_id_idx').on(table.entityId),
  statusIdx: index('webhook_status_idx').on(table.status),
  receivedAtIdx: index('webhook_received_at_idx').on(table.receivedAt),
}));

// Webhook Event Tags table - flexible tagging system for events
export const webhookEventTags = pgTable('webhook_event_tags', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').notNull().references(() => webhookEvents.id, { onDelete: 'cascade' }),
  tagName: text('tag_name').notNull(), // e.g., 'high-value', 'emergency', 'new-customer', 'repeat-customer'
  tagValue: text('tag_value'), // Optional value for the tag
  tagCategory: text('tag_category'), // 'priority', 'customer-type', 'service-type', 'location'
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  eventIdIdx: index('webhook_tag_event_id_idx').on(table.eventId),
  tagNameIdx: index('webhook_tag_name_idx').on(table.tagName),
  tagCategoryIdx: index('webhook_tag_category_idx').on(table.tagCategory),
  uniqueEventTag: uniqueIndex('unique_event_tag').on(table.eventId, table.tagName),
}));

// Webhook Processed Data table - stores parsed and categorized data from webhooks
export const webhookProcessedData = pgTable('webhook_processed_data', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').notNull().references(() => webhookEvents.id, { onDelete: 'cascade' }),
  dataType: text('data_type').notNull(), // 'customer', 'job', 'estimate', 'invoice', 'appointment'
  dataCategory: text('data_category'), // 'service-completed', 'payment-received', 'estimate-sent'
  entityData: text('entity_data').notNull(), // JSON string of parsed entity data
  
  // Denormalized fields for quick access and filtering
  customerName: text('customer_name'),
  customerEmail: text('customer_email'),
  customerPhone: text('customer_phone'),
  jobNumber: text('job_number'),
  invoiceNumber: text('invoice_number'),
  estimateNumber: text('estimate_number'),
  totalAmount: real('total_amount'),
  serviceDate: timestamp('service_date'),
  serviceType: text('service_type'),
  employeeName: text('employee_name'),
  addressCity: text('address_city'),
  addressState: text('address_state'),
  
  // Metrics for dashboard widgets
  isHighValue: boolean('is_high_value').default(false), // Amount > $500
  isEmergency: boolean('is_emergency').default(false),
  isRepeatCustomer: boolean('is_repeat_customer').default(false),
  isNewCustomer: boolean('is_new_customer').default(false),
  
  processedAt: timestamp('processed_at').defaultNow().notNull(),
}, (table) => ({
  eventIdIdx: index('processed_event_id_idx').on(table.eventId),
  dataTypeIdx: index('data_type_idx').on(table.dataType),
  dataCategoryIdx: index('data_category_idx').on(table.dataCategory),
  customerEmailIdx: index('customer_email_idx').on(table.customerEmail),
  serviceDateIdx: index('service_date_idx').on(table.serviceDate),
  highValueIdx: index('high_value_idx').on(table.isHighValue),
}));

// Webhook Subscriptions table - manage webhook subscriptions
export const webhookSubscriptions = pgTable('webhook_subscriptions', {
  id: serial('id').primaryKey(),
  companyId: text('company_id').notNull(),
  webhookUrl: text('webhook_url').notNull(),
  eventTypes: text('event_types').array(), // Array of subscribed event types
  isActive: boolean('is_active').default(true),
  secretKey: text('secret_key'), // For webhook signature verification
  lastReceivedAt: timestamp('last_received_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  companyIdIdx: uniqueIndex('company_id_sub_idx').on(table.companyId),
  activeIdx: index('active_sub_idx').on(table.isActive),
}));

// Webhook Analytics table - aggregated metrics for dashboard
export const webhookAnalytics = pgTable('webhook_analytics', {
  id: serial('id').primaryKey(),
  date: timestamp('date').notNull(),
  eventCategory: text('event_category').notNull(),
  totalEvents: integer('total_events').default(0),
  processedEvents: integer('processed_events').default(0),
  failedEvents: integer('failed_events').default(0),
  
  // Business metrics
  newCustomers: integer('new_customers').default(0),
  jobsCompleted: integer('jobs_completed').default(0),
  estimatesSent: integer('estimates_sent').default(0),
  invoicesCreated: integer('invoices_created').default(0),
  totalRevenue: real('total_revenue').default(0),
  
  // Performance metrics
  avgProcessingTime: integer('avg_processing_time'), // in milliseconds
  successRate: real('success_rate'), // percentage
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  dateEventIdx: uniqueIndex('date_event_idx').on(table.date, table.eventCategory),
  dateIdx: index('analytics_date_idx').on(table.date),
}));

// Relations for webhook system
export const webhookEventsRelations = relations(webhookEvents, ({ many, one }) => ({
  tags: many(webhookEventTags),
  processedData: one(webhookProcessedData, {
    fields: [webhookEvents.id],
    references: [webhookProcessedData.eventId],
  }),
}));

export const webhookEventTagsRelations = relations(webhookEventTags, ({ one }) => ({
  event: one(webhookEvents, {
    fields: [webhookEventTags.eventId],
    references: [webhookEvents.id],
  }),
}));

export const webhookProcessedDataRelations = relations(webhookProcessedData, ({ one }) => ({
  event: one(webhookEvents, {
    fields: [webhookProcessedData.eventId],
    references: [webhookEvents.id],
  }),
}));

// Insert schemas for webhook system
export const insertWebhookEventSchema = createInsertSchema(webhookEvents).omit({
  id: true,
  processedAt: true,
  createdAt: true,
  receivedAt: true,
});

export const insertWebhookEventTagSchema = createInsertSchema(webhookEventTags).omit({
  id: true,
  createdAt: true,
});

export const insertWebhookProcessedDataSchema = createInsertSchema(webhookProcessedData).omit({
  id: true,
  processedAt: true,
});

export const insertWebhookSubscriptionSchema = createInsertSchema(webhookSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWebhookAnalyticsSchema = createInsertSchema(webhookAnalytics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for webhook system
export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type InsertWebhookEvent = z.infer<typeof insertWebhookEventSchema>;

export type WebhookEventTag = typeof webhookEventTags.$inferSelect;
export type InsertWebhookEventTag = z.infer<typeof insertWebhookEventTagSchema>;

export type WebhookProcessedData = typeof webhookProcessedData.$inferSelect;
export type InsertWebhookProcessedData = z.infer<typeof insertWebhookProcessedDataSchema>;

export type WebhookSubscription = typeof webhookSubscriptions.$inferSelect;
export type InsertWebhookSubscription = z.infer<typeof insertWebhookSubscriptionSchema>;

export type WebhookAnalytics = typeof webhookAnalytics.$inferSelect;
export type InsertWebhookAnalytics = z.infer<typeof insertWebhookAnalyticsSchema>;