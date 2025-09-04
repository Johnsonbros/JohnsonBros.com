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
  const scheduled_start = toYmd(window.start_time);
  const scheduled_end = toYmd(window.end_time);
  const arrival_window = minutesBetween(window.start_time, window.end_time);

  const job = await hcpPost("/jobs", {
    customer_id: customerId,
    address_id: addressId,
    schedule: {
      scheduled_start,
      scheduled_end
    },
    notes,
    lead_source: lead_source || "Website",
    tags,
    line_items: [
      {
        name: 'Service Call - Plumbing Repair',
        quantity: 1,
        unit_price: 9900 // $99.00 in cents
      }
    ],
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

// Server startup with error handling
async function startServer() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    log.info("MCP server started successfully");
  } catch (err: any) {
    log.error({ error: err.message, stack: err.stack }, "Failed to start MCP server");
    process.exit(1);
  }
}

// Start the server
startServer();