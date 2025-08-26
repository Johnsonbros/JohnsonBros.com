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