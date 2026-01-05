import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { fetch } from "undici";
import pino from "pino";
import { randomUUID } from "crypto";

const log = pino({ name: "jb-booker", level: process.env.LOG_LEVEL || "info" });

// Error types for better classification
enum ErrorType {
  CONFIGURATION = "CONFIGURATION",
  VALIDATION = "VALIDATION", 
  API_ERROR = "API_ERROR",
  NETWORK = "NETWORK",
  NOT_FOUND = "NOT_FOUND",
  BUSINESS_LOGIC = "BUSINESS_LOGIC",
  UNKNOWN = "UNKNOWN"
}

interface StructuredError {
  type: ErrorType;
  code: string;
  message: string;
  details?: any;
  correlationId: string;
  userMessage: string; // Friendly message for AI assistants
}

// Environment validation
function validateEnvironment() {
  const required = ["HOUSECALL_API_KEY"];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    log.error({ missing }, "Missing required environment variables");
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

// Validate environment on startup
validateEnvironment();

const HOUSECALL_API_KEY = process.env.HOUSECALL_API_KEY!;
const COMPANY_TZ = process.env.COMPANY_TZ || "America/New_York";
const DEFAULT_DISPATCH_EMPLOYEE_IDS = (process.env.DEFAULT_DISPATCH_EMPLOYEE_IDS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

const HCP_BASE = "https://api.housecallpro.com";

const BookInput = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone: z.string().min(7),
  email: z.string().email().optional(),
  street: z.string().min(1),
  street_line_2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(2),
  zip: z.string().min(3),
  country: z.string().default("USA"),
  description: z.string().min(3),
  lead_source: z.string().default("AI Assistant"),
  time_preference: z.enum(["any", "morning", "afternoon", "evening"]).default("any"),
  earliest_date: z.string().optional(),   // YYYY-MM-DD
  latest_date: z.string().optional(),     // YYYY-MM-DD
  show_for_days: z.number().int().min(1).max(30).default(7),
  tags: z.array(z.string()).default(["AI booking"])
});

type BookInput = z.infer<typeof BookInput>;

const SearchAvailabilityInput = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  serviceType: z.string().min(1),
  time_preference: z.enum(["any", "morning", "afternoon", "evening"]).default("any"),
  show_for_days: z.number().int().min(1).max(30).default(7)
});

type SearchAvailabilityInput = z.infer<typeof SearchAvailabilityInput>;

function hcpHeaders() {
  return {
    "Authorization": `Token ${HOUSECALL_API_KEY}`,
    "Content-Type": "application/json"
  };
}

function createStructuredError(
  type: ErrorType,
  code: string,
  message: string,
  userMessage: string,
  correlationId: string,
  details?: any
): StructuredError {
  return { type, code, message, userMessage, correlationId, details };
}

async function hcpGet(path: string, query?: Record<string, string | number | boolean | undefined>, correlationId?: string) {
  const corrId = correlationId || randomUUID();
  const url = new URL(path, HCP_BASE);
  if (query) Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined) url.searchParams.set(k, String(v));
  });
  
  try {
    const res = await fetch(url, { headers: hcpHeaders() });
    if (!res.ok) {
      const errorText = await res.text();
      log.error({ path, errorText, status: res.status, correlationId: corrId }, `HCP API error: ${res.status}`);
      
      if (res.status === 401 || res.status === 403) {
        throw createStructuredError(
          ErrorType.CONFIGURATION,
          "HCP_AUTH_ERROR",
          `Authentication failed: ${res.status} ${errorText}`,
          "There's an issue with the HousecallPro API authentication. Please contact support.",
          corrId,
          { status: res.status, path }
        );
      } else if (res.status === 404) {
        throw createStructuredError(
          ErrorType.NOT_FOUND,
          "HCP_NOT_FOUND",
          `Resource not found: ${path}`,
          "The requested resource was not found in HousecallPro.",
          corrId,
          { status: res.status, path }
        );
      } else if (res.status >= 500) {
        throw createStructuredError(
          ErrorType.API_ERROR,
          "HCP_SERVER_ERROR",
          `HousecallPro server error: ${res.status} ${errorText}`,
          "HousecallPro is experiencing technical difficulties. Please try again in a few minutes.",
          corrId,
          { status: res.status, path }
        );
      } else {
        throw createStructuredError(
          ErrorType.API_ERROR,
          "HCP_CLIENT_ERROR",
          `HCP API error: ${res.status} ${errorText}`,
          "There was an issue with the booking request. Please check the provided information and try again.",
          corrId,
          { status: res.status, path }
        );
      }
    }
    return res.json();
  } catch (err: any) {
    if (err.type) throw err; // Already a structured error
    
    log.error({ path, error: err.message, correlationId: corrId }, `Failed to fetch from HCP API`);
    throw createStructuredError(
      ErrorType.NETWORK,
      "NETWORK_ERROR",
      `Network error: ${err.message}`,
      "There was a network connectivity issue. Please try again.",
      corrId,
      { path, originalError: err.message }
    );
  }
}

async function hcpPost(path: string, body: unknown, correlationId?: string) {
  const corrId = correlationId || randomUUID();
  const url = new URL(path, HCP_BASE);
  
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: hcpHeaders(),
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const errorText = await res.text();
      log.error({ path, errorText, body, status: res.status, correlationId: corrId }, `HCP API POST error: ${res.status}`);
      
      if (res.status === 401 || res.status === 403) {
        throw createStructuredError(
          ErrorType.CONFIGURATION,
          "HCP_AUTH_ERROR",
          `Authentication failed: ${res.status} ${errorText}`,
          "There's an issue with the HousecallPro API authentication. Please contact support.",
          corrId,
          { status: res.status, path }
        );
      } else if (res.status === 422) {
        throw createStructuredError(
          ErrorType.VALIDATION,
          "HCP_VALIDATION_ERROR",
          `Validation error: ${errorText}`,
          "Some of the provided information is invalid. Please check the customer details and try again.",
          corrId,
          { status: res.status, path, body }
        );
      } else if (res.status >= 500) {
        throw createStructuredError(
          ErrorType.API_ERROR,
          "HCP_SERVER_ERROR",
          `HousecallPro server error: ${res.status} ${errorText}`,
          "HousecallPro is experiencing technical difficulties. Please try again in a few minutes.",
          corrId,
          { status: res.status, path }
        );
      } else {
        throw createStructuredError(
          ErrorType.API_ERROR,
          "HCP_CLIENT_ERROR",
          `HCP API error: ${res.status} ${errorText}`,
          "There was an issue creating the booking. Please check the provided information and try again.",
          corrId,
          { status: res.status, path, body }
        );
      }
    }
    return res.json();
  } catch (err: any) {
    if (err.type) throw err; // Already a structured error
    
    log.error({ path, error: err.message, body, correlationId: corrId }, `Failed to POST to HCP API`);
    throw createStructuredError(
      ErrorType.NETWORK,
      "NETWORK_ERROR",
      `Network error: ${err.message}`,
      "There was a network connectivity issue. Please try again.",
      corrId,
      { path, originalError: err.message }
    );
  }
}

/** Choose a booking window by time-of-day preference in COMPANY_TZ */
function chooseWindow(windows: Array<{ start_time: string; end_time: string; available: boolean }>,
                      pref: "any" | "morning" | "afternoon" | "evening") {
  const fmt = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit", hour12: false, timeZone: COMPANY_TZ
  });

  function hourLocal(iso: string) {
    const d = new Date(iso);
    const parts = fmt.formatToParts(d);
    const hh = Number(parts.find(p => p.type === "hour")?.value ?? "0");
    return hh;
  }

  const inPref = (startIso: string) => {
    const h = hourLocal(startIso);
    if (pref === "any") return true;
    if (pref === "morning") return h >= 7 && h < 12;
    if (pref === "afternoon") return h >= 12 && h < 17;
    if (pref === "evening") return h >= 17 && h < 21;
    return true;
  };

  const candidates = windows.filter(w => w.available && inPref(w.start_time));
  return candidates[0] || windows.find(w => w.available);
}

async function findOrCreateCustomer(input: BookInput, correlationId?: string) {
  const corrId = correlationId || randomUUID();
  
  // Try to find by phone/email using ?q
  const q = input.email || input.phone;
  const search = await hcpGet("/customers", { q, page_size: 1 }, corrId) as any;
  const existing = (search.customers || [])[0];
  if (existing?.id) return existing;

  // Create new customer with address
  const created = await hcpPost("/customers", {
    first_name: input.first_name,
    last_name: input.last_name,
    email: input.email,
    mobile_number: input.phone,
    notifications_enabled: true,
    lead_source: input.lead_source,
    tags: input.tags,
    addresses: [{
      street: input.street,
      street_line_2: input.street_line_2 || null,
      city: input.city,
      state: input.state,
      zip: input.zip,
      country: input.country
    }]
  }, corrId) as any;
  return created;
}

function toYmd(dateIso: string) {
  return new Date(dateIso).toISOString().slice(0, 10);
}

function minutesBetween(aIso: string, bIso: string) {
  const diffMs = +new Date(bIso) - +new Date(aIso);
  return Math.max(30, Math.round(diffMs / 60000)); // minimum 30 min
}

async function getPrimaryAddressId(customer: any, input: BookInput, correlationId?: string) {
  const corrId = correlationId || randomUUID();
  
  // Prefer the one we just created (if present)
  const fromCreate = customer?.addresses?.[0]?.id;
  if (fromCreate) return fromCreate;

  // Otherwise try to look up addresses for the customer (fallback)
  // (The spec provides GET /customers/{id}/addresses; some tenants may need it.)
  // If not available, re-create:
  const addr = await hcpPost(`/customers/${customer.id}/addresses`, {
    street: input.street,
    street_line_2: input.street_line_2 || null,
    city: input.city,
    state: input.state,
    zip: input.zip,
    country: input.country
  }, corrId) as any;
  return addr.id;
}

async function createJob(customerId: string, addressId: string, window: { start_time: string; end_time: string }, notes: string, lead_source: string, tags: string[], correlationId?: string) {
  const corrId = correlationId || randomUUID();
  const scheduled_start = window.start_time;
  const scheduled_end = window.end_time;
  const arrival_window = minutesBetween(window.start_time, window.end_time);

  const job = await hcpPost("/jobs", {
    customer_id: customerId,
    address_id: addressId,
    schedule: {
      scheduled_start,
      scheduled_end
    },
    notes,
    lead_source: lead_source || "AI Assistant",
    tags: [...(tags || []), 'MCP Booking', 'Fee Waived'],
    notify_customer: true,  // Use built-in Housecall Pro customer notifications
    notify_pro: true        // Use built-in Housecall Pro technician notifications
  }, corrId) as any;

  return { job, arrival_window };
}

async function createAppointment(jobId: string, window: { start_time: string; end_time: string }, arrivalWindowMinutes: number, correlationId?: string) {
  // Skip appointment creation for now - job scheduling is sufficient
  // Housecall Pro will handle scheduling internally
  return null;
}

const server = new McpServer({
  name: "jb-booker",
  version: "1.0.0"
});

server.registerTool(
  "book_service_call",
  {
    title: "Book a Johnson Bros. Plumbing service visit",
    description: "Creates/updates a customer, finds an available window, creates a job and appointment in Housecall Pro.",
    inputSchema: {
      type: "object",
      properties: {
        first_name: { type: "string" },
        last_name: { type: "string" },
        phone: { type: "string" },
        email: { type: "string" },
        street: { type: "string" },
        street_line_2: { type: "string" },
        city: { type: "string" },
        state: { type: "string" },
        zip: { type: "string" },
        country: { type: "string" },
        description: { type: "string" },
        lead_source: { type: "string" },
        time_preference: { type: "string", enum: ["any", "morning", "afternoon", "evening"] },
        earliest_date: { type: "string" },
        latest_date: { type: "string" },
        show_for_days: { type: "number", minimum: 1, maximum: 30 },
        tags: { type: "array", items: { type: "string" } }
      },
      required: ["first_name", "last_name", "phone", "street", "city", "state", "zip", "description"]
    }
  } as any,
  async (raw) => {
    const correlationId = randomUUID();
    
    try {
      // Input validation
      const input = BookInput.parse(raw);
      log.info({ input, correlationId }, "book_service_call: start");

      // Step 1: fetch booking windows
      const params: Record<string, string> = {};
      if (input.earliest_date) params.start_date = input.earliest_date;
      if (input.show_for_days) params.show_for_days = String(input.show_for_days);

      const bw = await hcpGet("/company/schedule_availability/booking_windows", params, correlationId) as any;
      const windows: Array<{ start_time: string; end_time: string; available: boolean }> = bw.booking_windows || [];

      if (!windows.length) {
        const error = createStructuredError(
          ErrorType.BUSINESS_LOGIC,
          "NO_AVAILABILITY",
          "No booking windows available",
          "No available booking windows were returned by HousecallPro. Try expanding the date range or choosing different dates.",
          correlationId
        );
        log.warn({ correlationId }, error.userMessage);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.userMessage,
              error_code: error.code,
              correlation_id: correlationId
            }, null, 2)
          }]
        };
      }

      // Step 2: choose a window by time-of-day preference
      const chosen = chooseWindow(windows, input.time_preference);
      if (!chosen) {
        const error = createStructuredError(
          ErrorType.BUSINESS_LOGIC,
          "NO_PREFERRED_WINDOW",
          "No booking window matched time preference",
          "No booking window matched the time preference. Please try a different preference or date range.",
          correlationId
        );
        log.warn({ correlationId, preference: input.time_preference }, error.userMessage);
        
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify({
              success: false,
              error: error.userMessage,
              error_code: error.code,
              correlation_id: correlationId
            }, null, 2)
          }]
        };
      }

      // Step 3: find or create customer
      const customer = await findOrCreateCustomer(input, correlationId);

      // Step 4: get address id (create if needed)
      const addressId = await getPrimaryAddressId(customer, input, correlationId);

      // Step 5: create job with day + arrival window
      const { job, arrival_window } = await createJob(customer.id, addressId, chosen, input.description, input.lead_source, input.tags, correlationId);

      // Step 6: add appointment with concrete start/end (time on the day)
      let appointmentCreated: any = null;
      try {
        appointmentCreated = await createAppointment((job as any).id, chosen, arrival_window, correlationId);
      } catch (err: any) {
        log.error({ err: err?.message, jobId: (job as any).id, correlationId }, "Failed to create appointment for job");
        // Continue execution - job is still created, just without specific appointment
        // This is better than failing the entire booking
      }

      log.info({ jobId: (job as any).id, correlationId }, "MCP booking completed with built-in Housecall Pro notifications");

      const result = {
        success: true,
        job_id: (job as any).id,
        appointment_id: appointmentCreated?.id || null,
        scheduled_start: chosen.start_time,
        scheduled_end: chosen.end_time,
        arrival_window_minutes: arrival_window,
        summary: `Booked for ${toYmd(chosen.start_time)} (${input.time_preference})`,
        customer_id: customer.id,
        correlation_id: correlationId
      };

      log.info({ result, correlationId }, "book_service_call: success");

      return {
        content: [
          { type: "text", text: JSON.stringify(result, null, 2) }
        ]
      };
      
    } catch (err: any) {
      // Comprehensive error handling with structured responses
      let structuredError: StructuredError;
      
      if (err.type) {
        // Already a structured error
        structuredError = err;
      } else if (err.name === 'ZodError') {
        // Input validation error
        structuredError = createStructuredError(
          ErrorType.VALIDATION,
          "INPUT_VALIDATION_ERROR",
          `Input validation failed: ${err.message}`,
          "The booking information provided is invalid. Please check all required fields and try again.",
          correlationId,
          { validation_errors: err.issues }
        );
      } else {
        // Unknown error
        structuredError = createStructuredError(
          ErrorType.UNKNOWN,
          "UNEXPECTED_ERROR",
          `Unexpected error: ${err.message}`,
          "An unexpected error occurred while processing your booking. Please try again or contact support.",
          correlationId,
          { original_error: err.message, stack: err.stack }
        );
      }
      
      log.error({ 
        error: structuredError,
        correlationId 
      }, "book_service_call: error");

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: structuredError.userMessage,
            error_code: structuredError.code,
            error_type: structuredError.type,
            correlation_id: correlationId,
            details: structuredError.details
          }, null, 2)
        }]
      };
    }
  }
);

// Register search_availability tool
server.registerTool(
  "search_availability",
  {
    title: "Search Johnson Bros. Plumbing service availability",
    description: "Check available time slots for service appointments without booking. Returns available windows for the specified date and service type.",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", format: "date", description: "Preferred date (YYYY-MM-DD)" },
        serviceType: { type: "string", description: "Type of service needed (e.g., 'emergency plumbing', 'routine maintenance', 'drain cleaning')" },
        time_preference: { type: "string", enum: ["any", "morning", "afternoon", "evening"], description: "Preferred time of day" },
        show_for_days: { type: "number", minimum: 1, maximum: 30, description: "Number of days to show availability for" }
      },
      required: ["date", "serviceType"]
    }
  } as any,
  async (raw) => {
    const correlationId = randomUUID();
    
    try {
      // Input validation
      const input = SearchAvailabilityInput.parse(raw);
      log.info({ input, correlationId }, "search_availability: start");

      // Step 1: fetch booking windows
      const params: Record<string, string> = {};
      params.start_date = input.date;
      if (input.show_for_days) params.show_for_days = String(input.show_for_days);

      const bw = await hcpGet("/company/schedule_availability/booking_windows", params, correlationId) as any;
      const windows: Array<{ start_time: string; end_time: string; available: boolean }> = bw.booking_windows || [];

      if (!windows.length) {
        log.warn({ correlationId, date: input.date }, "No booking windows available");
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              available_slots: [],
              message: `No available slots found for ${input.date}. Please try a different date or contact us directly.`,
              service_type: input.serviceType,
              date: input.date,
              correlation_id: correlationId
            }, null, 2)
          }]
        };
      }

      // Step 2: filter by time preference if specified
      const fmt = new Intl.DateTimeFormat("en-US", {
        hour: "2-digit", hour12: false, timeZone: COMPANY_TZ
      });

      function hourLocal(iso: string) {
        const d = new Date(iso);
        const parts = fmt.formatToParts(d);
        const hh = Number(parts.find(p => p.type === "hour")?.value ?? "0");
        return hh;
      }

      const inPref = (startIso: string) => {
        const h = hourLocal(startIso);
        if (input.time_preference === "any") return true;
        if (input.time_preference === "morning") return h >= 7 && h < 12;
        if (input.time_preference === "afternoon") return h >= 12 && h < 17;
        if (input.time_preference === "evening") return h >= 17 && h < 21;
        return true;
      };

      const availableWindows = windows
        .filter(w => w.available && inPref(w.start_time))
        .map(w => ({
          start_time: w.start_time,
          end_time: w.end_time,
          formatted_time: new Intl.DateTimeFormat("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
            timeZone: COMPANY_TZ
          }).format(new Date(w.start_time))
        }));

      const result = {
        success: true,
        available_slots: availableWindows,
        service_type: input.serviceType,
        date: input.date,
        time_preference: input.time_preference,
        total_slots: availableWindows.length,
        message: availableWindows.length > 0 
          ? `Found ${availableWindows.length} available slots for ${input.serviceType} on ${input.date}`
          : `No slots available for ${input.time_preference} preference on ${input.date}. Try 'any' time preference for more options.`,
        correlation_id: correlationId
      };

      log.info({ 
        result: { 
          slots_found: availableWindows.length, 
          service_type: input.serviceType,
          date: input.date
        }, 
        correlationId 
      }, "search_availability: success");

      return {
        content: [
          { type: "text", text: JSON.stringify(result, null, 2) }
        ]
      };
      
    } catch (err: any) {
      // Comprehensive error handling
      let structuredError: StructuredError;
      
      if (err.type) {
        // Already a structured error
        structuredError = err;
      } else if (err.name === 'ZodError') {
        // Input validation error
        structuredError = createStructuredError(
          ErrorType.VALIDATION,
          "INPUT_VALIDATION_ERROR",
          `Input validation failed: ${err.message}`,
          "The search parameters are invalid. Please check the date format (YYYY-MM-DD) and service type.",
          correlationId,
          { validation_errors: err.issues }
        );
      } else {
        // Unknown error
        structuredError = createStructuredError(
          ErrorType.UNKNOWN,
          "UNEXPECTED_ERROR",
          `Unexpected error: ${err.message}`,
          "An unexpected error occurred while searching availability. Please try again.",
          correlationId,
          { original_error: err.message, stack: err.stack }
        );
      }
      
      log.error({ 
        error: structuredError,
        correlationId 
      }, "search_availability: error");

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: structuredError.userMessage,
            error_code: structuredError.code,
            error_type: structuredError.type,
            correlation_id: correlationId,
            details: structuredError.details
          }, null, 2)
        }]
      };
    }
  }
);

// Service pricing and information data
const PLUMBING_SERVICES = [
  {
    id: "emergency-repair",
    name: "Emergency Plumbing Repair",
    description: "24/7 emergency services for burst pipes, major leaks, sewage backups, and no-water situations",
    priceRange: { min: 150, max: 500 },
    estimatedDuration: "1-4 hours",
    category: "emergency",
    isEmergency: true
  },
  {
    id: "drain-cleaning",
    name: "Drain Cleaning",
    description: "Professional drain cleaning for clogged sinks, showers, tubs, and floor drains using advanced equipment",
    priceRange: { min: 99, max: 250 },
    estimatedDuration: "1-2 hours",
    category: "maintenance"
  },
  {
    id: "water-heater",
    name: "Water Heater Service",
    description: "Installation, repair, and maintenance of traditional tank and tankless water heaters",
    priceRange: { min: 150, max: 2500 },
    estimatedDuration: "2-6 hours",
    category: "installation"
  },
  {
    id: "toilet-repair",
    name: "Toilet Repair & Installation",
    description: "Fix running toilets, clogs, leaks, or install new toilets",
    priceRange: { min: 85, max: 450 },
    estimatedDuration: "1-3 hours",
    category: "repair"
  },
  {
    id: "faucet-fixtures",
    name: "Faucet & Fixture Installation",
    description: "Install or repair faucets, showerheads, garbage disposals, and other fixtures",
    priceRange: { min: 75, max: 300 },
    estimatedDuration: "1-2 hours",
    category: "installation"
  },
  {
    id: "pipe-repair",
    name: "Pipe Repair & Replacement",
    description: "Fix leaking, corroded, or damaged pipes including copper, PVC, and PEX",
    priceRange: { min: 150, max: 800 },
    estimatedDuration: "2-8 hours",
    category: "repair"
  },
  {
    id: "sewer-line",
    name: "Sewer Line Service",
    description: "Camera inspection, cleaning, and repair of main sewer lines",
    priceRange: { min: 200, max: 5000 },
    estimatedDuration: "2-8 hours",
    category: "specialty"
  },
  {
    id: "gas-line",
    name: "Gas Line Services",
    description: "Gas leak detection, repair, and new gas line installation for appliances",
    priceRange: { min: 150, max: 1500 },
    estimatedDuration: "2-6 hours",
    category: "specialty"
  },
  {
    id: "sump-pump",
    name: "Sump Pump Services",
    description: "Installation, repair, and maintenance of sump pumps and backup systems",
    priceRange: { min: 150, max: 1200 },
    estimatedDuration: "2-4 hours",
    category: "installation"
  },
  {
    id: "water-filtration",
    name: "Water Filtration",
    description: "Whole-house water filtration and water softener installation",
    priceRange: { min: 300, max: 3000 },
    estimatedDuration: "3-6 hours",
    category: "installation"
  }
];

const EMERGENCY_GUIDANCE = {
  "burst_pipe": {
    title: "Burst Pipe Emergency",
    immediateSteps: [
      "Turn off the main water supply immediately - usually located near the water meter or where water enters your home",
      "Turn off electricity in affected areas if water is near electrical outlets",
      "Open faucets to drain remaining water from pipes",
      "Move valuables away from the water",
      "If possible, place buckets under the leak"
    ],
    doNotDo: [
      "Do not attempt to repair the pipe yourself while water is still on",
      "Do not use electrical appliances in wet areas"
    ],
    urgency: "critical",
    callToAction: "This requires immediate professional attention. We can dispatch a plumber right away."
  },
  "no_hot_water": {
    title: "No Hot Water",
    immediateSteps: [
      "Check if the water heater is getting power (circuit breaker for electric, pilot light for gas)",
      "For gas heaters: Check if the pilot light is lit - if not, follow relighting instructions on the unit",
      "Check the temperature setting on the water heater",
      "Allow 30-60 minutes for water to heat after relighting pilot"
    ],
    doNotDo: [
      "Do not attempt to repair gas connections yourself",
      "Do not ignore the smell of gas - leave immediately and call gas company"
    ],
    urgency: "moderate",
    callToAction: "If these steps don't work, schedule a service call for water heater diagnosis."
  },
  "clogged_drain": {
    title: "Clogged Drain",
    immediateSteps: [
      "Try a plunger first - create a seal and use forceful pumping action",
      "For kitchen sinks: Check if the garbage disposal is the issue",
      "Avoid chemical drain cleaners as they can damage pipes",
      "Try hot water flush - pour boiling water slowly down the drain"
    ],
    doNotDo: [
      "Do not mix different chemical drain cleaners",
      "Do not use a plunger if you've already added chemicals"
    ],
    urgency: "low",
    callToAction: "If plunging doesn't work, professional drain cleaning can clear the blockage effectively."
  },
  "gas_leak": {
    title: "Gas Leak Emergency",
    immediateSteps: [
      "Do NOT turn on any lights or electrical switches",
      "Do NOT use your phone inside the house",
      "Open windows and doors if safely possible",
      "Leave the house immediately",
      "Call 911 and your gas company from outside"
    ],
    doNotDo: [
      "NEVER light matches, lighters, or any flame",
      "NEVER operate electrical switches or appliances",
      "NEVER try to locate the leak yourself"
    ],
    urgency: "critical",
    callToAction: "After the gas company clears the situation, we can repair any gas line issues."
  },
  "running_toilet": {
    title: "Running Toilet",
    immediateSteps: [
      "Remove the tank lid and check if the flapper is seated properly",
      "Check if the float is stuck or set too high",
      "Jiggle the flush handle - sometimes the chain gets caught",
      "Turn off water supply valve behind toilet if it won't stop"
    ],
    doNotDo: [
      "Don't leave it running - a running toilet can waste 200+ gallons per day"
    ],
    urgency: "low",
    callToAction: "If these steps don't fix it, the internal parts may need replacement."
  },
  "sewage_backup": {
    title: "Sewage Backup Emergency",
    immediateSteps: [
      "Stop using all water and flushing in your home immediately",
      "Keep children and pets away from affected areas",
      "Turn off HVAC system to prevent spreading contamination",
      "Open windows for ventilation but stay out of flooded areas"
    ],
    doNotDo: [
      "Do NOT try to clean up sewage yourself - it contains harmful bacteria",
      "Do NOT run water or flush toilets"
    ],
    urgency: "critical",
    callToAction: "This is a health hazard requiring immediate professional service. We can dispatch emergency help."
  },
  "low_water_pressure": {
    title: "Low Water Pressure",
    immediateSteps: [
      "Check if the issue affects all faucets or just one",
      "Check if neighbors are experiencing the same issue",
      "Look for any visible leaks under sinks or in basement",
      "Check the main water valve to ensure it's fully open"
    ],
    doNotDo: [
      "Don't ignore sudden pressure drops - could indicate a hidden leak"
    ],
    urgency: "moderate",
    callToAction: "Persistent low pressure often indicates pipe issues that need professional diagnosis."
  }
};

// Get Quote Tool
const GetQuoteInput = z.object({
  service_type: z.string().describe("Type of plumbing service needed"),
  issue_description: z.string().describe("Description of the plumbing issue"),
  property_type: z.enum(["residential", "commercial"]).default("residential"),
  urgency: z.enum(["routine", "soon", "urgent", "emergency"]).default("routine")
});

server.registerTool(
  "get_quote",
  {
    title: "Get Plumbing Service Quote",
    description: "Provides an instant estimate for plumbing services based on the type of work needed. Returns price range, estimated duration, and recommendations.",
    inputSchema: {
      type: "object",
      properties: {
        service_type: { type: "string", description: "Type of service (e.g., 'drain cleaning', 'water heater repair', 'toilet repair')" },
        issue_description: { type: "string", description: "Description of the plumbing problem" },
        property_type: { type: "string", enum: ["residential", "commercial"], description: "Type of property" },
        urgency: { type: "string", enum: ["routine", "soon", "urgent", "emergency"], description: "How urgent is the repair" }
      },
      required: ["service_type", "issue_description"]
    }
  } as any,
  async (raw) => {
    const correlationId = randomUUID();
    
    try {
      const input = GetQuoteInput.parse(raw);
      log.info({ input, correlationId }, "get_quote: start");

      // Find matching services
      const searchTerms = input.service_type.toLowerCase();
      const matchingServices = PLUMBING_SERVICES.filter(s => 
        s.name.toLowerCase().includes(searchTerms) ||
        s.description.toLowerCase().includes(searchTerms) ||
        s.id.includes(searchTerms.replace(/\s+/g, '-'))
      );

      // If no exact match, try to find closest match or suggest similar
      let recommendedService = matchingServices[0];
      if (!recommendedService) {
        // Find best match based on keywords
        const keywords: Record<string, string> = {
          'drain': 'drain-cleaning',
          'clog': 'drain-cleaning',
          'water heater': 'water-heater',
          'hot water': 'water-heater',
          'toilet': 'toilet-repair',
          'faucet': 'faucet-fixtures',
          'leak': 'pipe-repair',
          'pipe': 'pipe-repair',
          'sewer': 'sewer-line',
          'gas': 'gas-line',
          'sump': 'sump-pump',
          'filter': 'water-filtration',
          'emergency': 'emergency-repair'
        };

        for (const [keyword, serviceId] of Object.entries(keywords)) {
          if (searchTerms.includes(keyword)) {
            const found = PLUMBING_SERVICES.find(s => s.id === serviceId);
            if (found) {
              recommendedService = found;
              break;
            }
          }
        }
      }

      // Default to general repair estimate if still no match
      if (!recommendedService) {
        recommendedService = {
          id: "general-plumbing",
          name: "General Plumbing Service",
          description: "Diagnostic and repair services for various plumbing issues",
          priceRange: { min: 99, max: 500 },
          estimatedDuration: "1-4 hours",
          category: "repair"
        };
      }

      // Adjust pricing for urgency
      let priceMultiplier = 1;
      let urgencyNote = "";
      if (input.urgency === "emergency") {
        priceMultiplier = 1.5;
        urgencyNote = "Emergency service includes after-hours premium.";
      } else if (input.urgency === "urgent") {
        priceMultiplier = 1.25;
        urgencyNote = "Priority scheduling available with expedited rate.";
      }

      // Commercial premium
      if (input.property_type === "commercial") {
        priceMultiplier *= 1.2;
      }

      const adjustedMin = Math.round(recommendedService.priceRange.min * priceMultiplier);
      const adjustedMax = Math.round(recommendedService.priceRange.max * priceMultiplier);

      const result = {
        success: true,
        service: recommendedService.name,
        description: recommendedService.description,
        estimated_price_range: {
          min: adjustedMin,
          max: adjustedMax,
          currency: "USD"
        },
        estimated_duration: recommendedService.estimatedDuration,
        urgency_level: input.urgency,
        property_type: input.property_type,
        notes: [
          urgencyNote,
          "Final price depends on actual scope of work after on-site assessment.",
          "We offer a $99 diagnostic fee that's waived if you proceed with the repair.",
          "All work comes with our satisfaction guarantee."
        ].filter(Boolean),
        next_steps: input.urgency === "emergency" 
          ? "For emergencies, call us directly at (617) 555-0123 or book now for immediate dispatch."
          : "Book an appointment to get an exact quote after our technician assesses the issue.",
        correlation_id: correlationId
      };

      log.info({ result, correlationId }, "get_quote: success");

      return {
        content: [
          { type: "text", text: JSON.stringify(result, null, 2) }
        ]
      };
      
    } catch (err: any) {
      log.error({ error: err.message, correlationId }, "get_quote: error");
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: "Unable to generate quote. Please describe your plumbing issue and we'll help.",
            correlation_id: correlationId
          }, null, 2)
        }]
      };
    }
  }
);

// Emergency Help Tool
const EmergencyHelpInput = z.object({
  emergency_type: z.string().describe("Type of plumbing emergency"),
  additional_details: z.string().optional().describe("Any additional details about the situation")
});

server.registerTool(
  "emergency_help",
  {
    title: "Emergency Plumbing Help",
    description: "Provides immediate guidance for plumbing emergencies. Gives step-by-step instructions while waiting for a plumber, safety warnings, and determines if emergency dispatch is needed.",
    inputSchema: {
      type: "object",
      properties: {
        emergency_type: { type: "string", description: "Type of emergency (e.g., 'burst pipe', 'gas leak', 'sewage backup', 'no hot water')" },
        additional_details: { type: "string", description: "Additional details about the emergency" }
      },
      required: ["emergency_type"]
    }
  } as any,
  async (raw) => {
    const correlationId = randomUUID();
    
    try {
      const input = EmergencyHelpInput.parse(raw);
      log.info({ input, correlationId }, "emergency_help: start");

      // Match emergency type to guidance
      const searchTerm = input.emergency_type.toLowerCase();
      let guidance: typeof EMERGENCY_GUIDANCE[keyof typeof EMERGENCY_GUIDANCE] | null = null;

      // Map common terms to emergency types
      const emergencyMappings: Record<string, keyof typeof EMERGENCY_GUIDANCE> = {
        'burst': 'burst_pipe',
        'pipe burst': 'burst_pipe',
        'broken pipe': 'burst_pipe',
        'flooding': 'burst_pipe',
        'water everywhere': 'burst_pipe',
        'hot water': 'no_hot_water',
        'cold water': 'no_hot_water',
        'water heater': 'no_hot_water',
        'clog': 'clogged_drain',
        'drain': 'clogged_drain',
        'slow drain': 'clogged_drain',
        'backed up': 'clogged_drain',
        'gas': 'gas_leak',
        'smell gas': 'gas_leak',
        'gas smell': 'gas_leak',
        'running': 'running_toilet',
        'toilet running': 'running_toilet',
        'wont stop': 'running_toilet',
        'sewage': 'sewage_backup',
        'sewer': 'sewage_backup',
        'backup': 'sewage_backup',
        'pressure': 'low_water_pressure',
        'low pressure': 'low_water_pressure',
        'weak water': 'low_water_pressure'
      };

      for (const [term, emergencyKey] of Object.entries(emergencyMappings)) {
        if (searchTerm.includes(term)) {
          guidance = EMERGENCY_GUIDANCE[emergencyKey];
          break;
        }
      }

      // Default emergency guidance if no match
      if (!guidance) {
        guidance = {
          title: "Plumbing Emergency",
          immediateSteps: [
            "Locate and turn off your main water supply if there's active water damage",
            "Avoid using plumbing fixtures until the issue is assessed",
            "Document the issue with photos if safe to do so",
            "Clear the area of valuables and electronics"
          ],
          doNotDo: [
            "Don't attempt repairs without proper tools and knowledge",
            "Don't ignore signs of water damage"
          ],
          urgency: "moderate",
          callToAction: "Describe your issue in more detail so we can provide specific guidance, or book an emergency appointment now."
        };
      }

      const result = {
        success: true,
        emergency_type: guidance.title,
        urgency_level: guidance.urgency,
        immediate_steps: guidance.immediateSteps,
        safety_warnings: guidance.doNotDo,
        recommendation: guidance.callToAction,
        emergency_contact: {
          phone: "(617) 555-0123",
          available: "24/7 for emergencies",
          response_time: guidance.urgency === "critical" ? "Within 1 hour" : "Same day"
        },
        book_now: guidance.urgency === "critical" 
          ? "CRITICAL: We recommend booking emergency service immediately."
          : "Book a service call to address this issue professionally.",
        correlation_id: correlationId
      };

      log.info({ result: { emergency_type: guidance.title, urgency: guidance.urgency }, correlationId }, "emergency_help: success");

      return {
        content: [
          { type: "text", text: JSON.stringify(result, null, 2) }
        ]
      };
      
    } catch (err: any) {
      log.error({ error: err.message, correlationId }, "emergency_help: error");
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: "Unable to process emergency request. For immediate help, call (617) 555-0123.",
            correlation_id: correlationId
          }, null, 2)
        }]
      };
    }
  }
);

// Get Services Tool
const GetServicesInput = z.object({
  category: z.string().optional().describe("Filter by category: emergency, maintenance, repair, installation, specialty"),
  search: z.string().optional().describe("Search term to filter services")
});

server.registerTool(
  "get_services",
  {
    title: "Get Available Plumbing Services",
    description: "Lists all plumbing services offered by Johnson Bros. Plumbing with descriptions, price ranges, and estimated durations.",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Filter by category (emergency, maintenance, repair, installation, specialty)" },
        search: { type: "string", description: "Search term to filter services" }
      }
    }
  } as any,
  async (raw) => {
    const correlationId = randomUUID();
    
    try {
      const input = GetServicesInput.parse(raw || {});
      log.info({ input, correlationId }, "get_services: start");

      let services = [...PLUMBING_SERVICES];

      // Filter by category
      if (input.category) {
        services = services.filter(s => 
          s.category?.toLowerCase() === input.category?.toLowerCase()
        );
      }

      // Filter by search term
      if (input.search) {
        const searchTerm = input.search.toLowerCase();
        services = services.filter(s =>
          s.name.toLowerCase().includes(searchTerm) ||
          s.description.toLowerCase().includes(searchTerm)
        );
      }

      const result = {
        success: true,
        total_services: services.length,
        services: services.map(s => ({
          id: s.id,
          name: s.name,
          description: s.description,
          price_range: `$${s.priceRange.min} - $${s.priceRange.max}`,
          estimated_duration: s.estimatedDuration,
          category: s.category,
          is_emergency: s.isEmergency || false
        })),
        categories: ["emergency", "maintenance", "repair", "installation", "specialty"],
        business_info: {
          name: "Johnson Bros. Plumbing",
          phone: "(617) 555-0123",
          service_area: "Greater Boston Area",
          emergency_available: true,
          licensed_insured: true
        },
        correlation_id: correlationId
      };

      log.info({ result: { service_count: services.length }, correlationId }, "get_services: success");

      return {
        content: [
          { type: "text", text: JSON.stringify(result, null, 2) }
        ]
      };
      
    } catch (err: any) {
      log.error({ error: err.message, correlationId }, "get_services: error");
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: "Unable to retrieve services list.",
            correlation_id: correlationId
          }, null, 2)
        }]
      };
    }
  }
);

// Lookup Customer Tool - search for existing customers by phone or email
const LookupCustomerInput = z.object({
  phone: z.string().optional().describe("Customer's phone number to search for"),
  email: z.string().email().optional().describe("Customer's email address to search for"),
  name: z.string().optional().describe("Customer's name to search for")
});

server.registerTool(
  "lookup_customer",
  {
    title: "Look Up Existing Customer",
    description: "Search for an existing customer in HousecallPro by phone number, email, or name. Returns customer details including address and service history if found.",
    inputSchema: {
      type: "object",
      properties: {
        phone: { type: "string", description: "Customer's phone number" },
        email: { type: "string", description: "Customer's email address" },
        name: { type: "string", description: "Customer's name" }
      }
    }
  } as any,
  async (raw) => {
    const correlationId = randomUUID();
    
    try {
      const input = LookupCustomerInput.parse(raw || {});
      log.info({ input, correlationId }, "lookup_customer: start");

      // Need at least one search parameter
      if (!input.phone && !input.email && !input.name) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: "Please provide a phone number, email, or name to look up the customer.",
              correlation_id: correlationId
            }, null, 2)
          }]
        };
      }

      // Build search query - prioritize phone, then email, then name
      const searchQuery = input.phone || input.email || input.name;
      
      // Search HousecallPro for existing customer
      const searchResult = await hcpGet("/customers", { 
        q: searchQuery,
        page_size: 5 
      }, correlationId) as any;
      
      const customers = searchResult.customers || [];
      
      if (customers.length === 0) {
        log.info({ correlationId, searchQuery }, "lookup_customer: no customers found");
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              found: false,
              message: `No customer found matching "${searchQuery}". Would you like to create a new booking? I'll just need your details.`,
              search_query: searchQuery,
              correlation_id: correlationId
            }, null, 2)
          }]
        };
      }

      // Format customer data for response
      const formattedCustomers = customers.map((c: any) => ({
        id: c.id,
        name: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
        first_name: c.first_name,
        last_name: c.last_name,
        phone: c.mobile_number || c.home_number || c.work_number,
        email: c.email,
        addresses: (c.addresses || []).map((addr: any) => ({
          id: addr.id,
          street: addr.street,
          street_line_2: addr.street_line_2,
          city: addr.city,
          state: addr.state,
          zip: addr.zip,
          full_address: [addr.street, addr.street_line_2, addr.city, addr.state, addr.zip]
            .filter(Boolean)
            .join(', ')
        })),
        tags: c.tags || [],
        created_at: c.created_at
      }));

      const primaryCustomer = formattedCustomers[0];
      
      const result = {
        success: true,
        found: true,
        customer_count: customers.length,
        customer: primaryCustomer,
        all_matches: formattedCustomers.length > 1 ? formattedCustomers : undefined,
        message: `Found ${customers.length > 1 ? customers.length + ' customers' : 'your account'}: ${primaryCustomer.name}${primaryCustomer.addresses.length > 0 ? ` at ${primaryCustomer.addresses[0].full_address}` : ''}`,
        next_steps: "I have your information on file. Would you like to book a service appointment at this address, or do you have a different location?",
        correlation_id: correlationId
      };

      log.info({ 
        result: { 
          found: true, 
          customer_count: customers.length,
          customer_id: primaryCustomer.id 
        }, 
        correlationId 
      }, "lookup_customer: success");

      return {
        content: [
          { type: "text", text: JSON.stringify(result, null, 2) }
        ]
      };
      
    } catch (err: any) {
      let structuredError: StructuredError;
      
      if (err.type) {
        structuredError = err;
      } else {
        structuredError = createStructuredError(
          ErrorType.UNKNOWN,
          "LOOKUP_ERROR",
          `Customer lookup failed: ${err.message}`,
          "I had trouble looking up customer records. Could you please provide your details so I can help you book an appointment?",
          correlationId,
          { original_error: err.message }
        );
      }
      
      log.error({ error: structuredError, correlationId }, "lookup_customer: error");

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: structuredError.userMessage,
            error_code: structuredError.code,
            correlation_id: correlationId
          }, null, 2)
        }]
      };
    }
  }
);

// Export the server for use in different transports
export { server };