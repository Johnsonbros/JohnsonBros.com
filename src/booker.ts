import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { fetch } from "undici";
import pino from "pino";
import { getNotificationService } from "../server/src/notifications.js";

const log = pino({ name: "jb-booker", level: process.env.LOG_LEVEL || "info" });

const HOUSECALL_API_KEY = process.env.HOUSECALL_API_KEY;
if (!HOUSECALL_API_KEY) {
  log.error("HOUSECALL_API_KEY is not set in environment variables");
  // Allow server to start but API calls will fail gracefully
}
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

async function hcpGet(path: string, query?: Record<string, string | number | boolean | undefined>) {
  if (!HOUSECALL_API_KEY) {
    throw new Error("HOUSECALL_API_KEY is not configured. Please set it in environment variables.");
  }
  const url = new URL(path, HCP_BASE);
  if (query) Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined) url.searchParams.set(k, String(v));
  });
  try {
    const res = await fetch(url, { headers: hcpHeaders() });
    if (!res.ok) {
      const errorText = await res.text();
      log.error({ path, errorText, status: res.status }, `HCP API error: ${res.status}`);
      throw new Error(`GET ${url} -> ${res.status} ${errorText}`);
    }
    return res.json();
  } catch (err: any) {
    log.error({ path, error: err.message }, `Failed to fetch from HCP API`);
    throw err;
  }
}

async function hcpPost(path: string, body: unknown) {
  if (!HOUSECALL_API_KEY) {
    throw new Error("HOUSECALL_API_KEY is not configured. Please set it in environment variables.");
  }
  const url = new URL(path, HCP_BASE);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: hcpHeaders(),
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const errorText = await res.text();
      log.error({ path, errorText, body, status: res.status }, `HCP API POST error: ${res.status}`);
      throw new Error(`POST ${url} -> ${res.status} ${errorText}`);
    }
    return res.json();
  } catch (err: any) {
    log.error({ path, error: err.message, body }, `Failed to POST to HCP API`);
    throw err;
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

async function findOrCreateCustomer(input: BookInput) {
  // Try to find by phone/email using ?q
  const q = input.email || input.phone;
  const search = await hcpGet("/customers", { q, page_size: 1 }) as any;
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
  }) as any;
  return created;
}

function toYmd(dateIso: string) {
  return new Date(dateIso).toISOString().slice(0, 10);
}

function minutesBetween(aIso: string, bIso: string) {
  const diffMs = +new Date(bIso) - +new Date(aIso);
  return Math.max(30, Math.round(diffMs / 60000)); // minimum 30 min
}

async function getPrimaryAddressId(customer: any, input: BookInput) {
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
  }) as any;
  return addr.id;
}

async function createJob(customerId: string, addressId: string, window: { start_time: string; end_time: string }, notes: string, lead_source: string, tags: string[]) {
  const scheduled_start = toYmd(window.start_time);
  const scheduled_end = toYmd(window.end_time);
  const arrival_window = minutesBetween(window.start_time, window.end_time);

  const job = await hcpPost("/jobs", {
    customer_id: customerId,
    address_id: addressId,
    schedule: {
      scheduled_start,
      scheduled_end,
      arrival_window
    },
    notes,
    lead_source,
    tags,
    line_items: [
      {
        type: "service",
        description: "Service call",
        price: 99.00,
        quantity: 1,
        notes: "A service call is your first step to resolving any plumbing concerns. Our professional plumber will assess your situation and provide expert solutions."
      }
    ]
  }) as any;

  return { job, arrival_window };
}

async function createAppointment(jobId: string, window: { start_time: string; end_time: string }, arrivalWindowMinutes: number) {
  // Housecall requires dispatched_employees_ids in the request schema.
  // We either use explicit IDs from env or try to proceed with an empty list (tenant-dependent).
  const dispatched_employees_ids = DEFAULT_DISPATCH_EMPLOYEE_IDS.length > 0 ? DEFAULT_DISPATCH_EMPLOYEE_IDS : [];

  const appt = await hcpPost(`/jobs/${jobId}/appointments`, {
    start_time: window.start_time,
    end_time: window.end_time,
    arrival_window_minutes: arrivalWindowMinutes,
    dispatched_employees_ids
  });
  return appt;
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
    const input = BookInput.parse(raw);
    log.info({ input }, "book_service_call: start");

    // Step 1: fetch booking windows
    const params: Record<string, string> = {};
    if (input.earliest_date) params.start_date = input.earliest_date;
    if (input.show_for_days) params.show_for_days = String(input.show_for_days);

    const bw = await hcpGet("/company/schedule_availability/booking_windows", params) as any;
    const windows: Array<{ start_time: string; end_time: string; available: boolean }> = bw.booking_windows || [];

    if (!windows.length) {
      return {
        content: [{
          type: "text",
          text: "No available booking windows were returned by Housecall Pro. Try expanding the date range."
        }]
      };
    }

    // Step 2: choose a window by time-of-day preference
    const chosen = chooseWindow(windows, input.time_preference);
    if (!chosen) {
      return {
        content: [{ type: "text", text: "No booking window matched the time preference. Please try a different preference or date range." }]
      };
    }

    // Step 3: find or create customer
    const customer = await findOrCreateCustomer(input);

    // Step 4: get address id (create if needed)
    const addressId = await getPrimaryAddressId(customer, input);

    // Step 5: create job with day + arrival window
    const { job, arrival_window } = await createJob(customer.id, addressId, chosen, input.description, input.lead_source, input.tags);

    // Step 6: add appointment with concrete start/end (time on the day)
    let appointmentCreated: any = null;
    try {
      appointmentCreated = await createAppointment((job as any).id, chosen, arrival_window);
    } catch (err: any) {
      log.error({ err: err?.message, jobId: (job as any).id }, "Failed to create appointment for job");
      // Continue execution - job is still created, just without specific appointment
      // This is better than failing the entire booking
    }

    // Step 7: Send booking notifications to customer and technicians
    try {
      const notificationService = getNotificationService();
      await notificationService.sendBookingAlerts({
        customer: {
          id: customer.id,
          first_name: customer.first_name,
          last_name: customer.last_name,
          email: customer.email,
          mobile_number: customer.mobile_number
        },
        job: {
          id: (job as any).id,
          service_type: "Service call",
          scheduled_start: chosen.start_time,
          address: `${input.street}, ${input.city}, ${input.state} ${input.zip}`,
          notes: input.description
        },
        appointment: appointmentCreated ? {
          id: appointmentCreated.id,
          start_time: chosen.start_time,
          end_time: chosen.end_time
        } : undefined,
        booking_source: "AI Assistant"
      });
      log.info({ jobId: (job as any).id }, "MCP booking notifications sent successfully");
    } catch (notificationError) {
      log.error({ error: notificationError, jobId: (job as any).id }, "Failed to send MCP booking notifications");
      // Don't fail the booking if notifications fail
    }

    const result = {
      job_id: (job as any).id,
      appointment_id: appointmentCreated?.id || null,
      scheduled_start: chosen.start_time,
      scheduled_end: chosen.end_time,
      arrival_window_minutes: arrival_window,
      summary: `Booked for ${toYmd(chosen.start_time)} (${input.time_preference})`,
      customer_id: customer.id
    };

    log.info({ result }, "book_service_call: success");

    return {
      content: [
        { type: "text", text: JSON.stringify(result, null, 2) }
      ]
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);