import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, decimal, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  housecallProId: text("housecall_pro_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  duration: text("duration").notNull(), // e.g. "2 hours"
  housecallProServiceId: text("housecall_pro_service_id"),
  isEmergency: boolean("is_emergency").default(false),
});

export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  serviceId: varchar("service_id").references(() => services.id).notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(),
  status: text("status").notNull().default("scheduled"), // scheduled, confirmed, in_progress, completed, cancelled
  problemDescription: text("problem_description"),
  estimatedPrice: decimal("estimated_price", { precision: 10, scale: 2 }),
  actualPrice: decimal("actual_price", { precision: 10, scale: 2 }),
  housecallProJobId: text("housecall_pro_job_id"),
  technicianId: text("technician_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const availableTimeSlots = pgTable("available_time_slots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: text("date").notNull(), // YYYY-MM-DD format
  startTime: text("start_time").notNull(), // HH:MM format
  endTime: text("end_time").notNull(), // HH:MM format
  isAvailable: boolean("is_available").default(true),
  technicianId: text("technician_id"),
});

export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id),
  appointmentId: varchar("appointment_id").references(() => appointments.id),
  rating: decimal("rating", { precision: 2, scale: 1 }).notNull(),
  comment: text("comment"),
  customerName: text("customer_name").notNull(),
  serviceName: text("service_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert Schemas
export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  housecallProId: true,
  createdAt: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  housecallProServiceId: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  housecallProJobId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  selectedDate: z.string(),
  selectedTime: z.string(),
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

// Types
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type AvailableTimeSlot = typeof availableTimeSlots.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

// API Response Types
export type BookingFormData = {
  service: string;
  selectedDate: string;
  selectedTime: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
  };
  problemDescription: string;
};

export type TimeSlot = {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
};
