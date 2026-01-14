import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { fetch } from "undici";
import pino from "pino";
import { randomUUID } from "crypto";
import { CapacityCalculator } from "../server/src/capacity.js";
import { 
  BOOKING_CONFIRMATION_WIDGET, 
  AVAILABILITY_WIDGET, 
  SERVICES_WIDGET, 
  QUOTE_WIDGET, 
  EMERGENCY_WIDGET 
} from "./widgets/booking-widget.js";

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

function getHousecallApiKey(correlationId?: string) {
  const apiKey = process.env.HOUSECALL_API_KEY;
  if (!apiKey) {
    const corrId = correlationId || randomUUID();
    const error = createStructuredError(
      ErrorType.CONFIGURATION,
      "MISSING_HOUSECALL_API_KEY",
      "HOUSECALL_API_KEY environment variable is not set",
      "Booking tools are temporarily unavailable because required credentials are missing. Please contact support.",
      corrId,
      { envVar: "HOUSECALL_API_KEY" }
    );

    log.error({ correlationId: corrId }, "HousecallPro API key missing");
    throw error;
  }
  return apiKey;
}

const COMPANY_TZ = process.env.COMPANY_TZ || "America/New_York";
const DEFAULT_DISPATCH_EMPLOYEE_IDS = (process.env.DEFAULT_DISPATCH_EMPLOYEE_IDS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

const HCP_BASE = "https://api.housecallpro.com";

// In-memory locks for customer creation to prevent duplicate records
const customerCreationLocks = new Map<string, Promise<any>>();

// Service Area Validation - In-memory set of valid zip codes
// Norfolk, Suffolk, and Plymouth County MA zip codes
const SERVICE_AREA_ZIPS = new Set([
  // Norfolk County
  "02021", "02025", "02026", "02027", "02030", "02032", "02035", "02038", "02043", "02045",
  "02047", "02050", "02052", "02053", "02054", "02056", "02061", "02062", "02066", "02067",
  "02070", "02071", "02072", "02081", "02090", "02093", "02169", "02170", "02171", "02184",
  "02185", "02186", "02187", "02188", "02189", "02190", "02191", "02269",
  "02382", "02445", "02446", "02447", "02457", "02459", "02460", "02461", "02462", "02464",
  "02465", "02466", "02467", "02468", "02481", "02482", "02492", "02494",
  // Suffolk County
  "02108", "02109", "02110", "02111", "02113", "02114", "02115", "02116", "02117", "02118",
  "02119", "02120", "02121", "02122", "02124", "02125", "02126", "02127", "02128", "02129",
  "02130", "02131", "02132", "02133", "02134", "02135", "02136", "02137", "02150", "02151",
  "02152", "02163", "02199", "02201", "02203", "02204", "02205", "02206", "02210", "02211",
  "02212", "02215", "02217", "02222", "02228", "02241", "02266", "02283", "02284", "02293",
  "02297", "02298",
  // Plymouth County
  "02018", "02020", "02040", "02041", "02044", "02048", "02050", "02051", "02055", "02059",
  "02060", "02061", "02065", "02066", "02330", "02331", "02332", "02333", "02337", "02338",
  "02339", "02340", "02341", "02343", "02344", "02345", "02346", "02347", "02349", "02350",
  "02351", "02355", "02356", "02357", "02358", "02359", "02360", "02361", "02362", "02364",
  "02366", "02367", "02368", "02370", "02375", "02379", "02381", "02382"
]);

function isInServiceArea(zipCode: string): boolean {
  const normalizedZip = zipCode.trim().substring(0, 5);
  return SERVICE_AREA_ZIPS.has(normalizedZip);
}

function getServiceAreaMessage(): string {
  return "Johnson Bros. Plumbing serves Norfolk, Suffolk, and Plymouth Counties in Massachusetts, including Quincy, Braintree, Weymouth, Abington, Rockland, and surrounding South Shore communities.";
}

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

const GetCapacityInput = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  zip: z.string().optional(),
  service_area: z.string().optional()
});

type GetCapacityInput = z.infer<typeof GetCapacityInput>;

function hcpHeaders(correlationId?: string) {
  const apiKey = getHousecallApiKey(correlationId);

  return {
    "Authorization": `Token ${apiKey}`,
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
    const res = await fetch(url, { headers: hcpHeaders(corrId) });
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
      headers: hcpHeaders(corrId),
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const errorText = await res.text();
      log.error({ path, errorText, body: redactPayload(body), status: res.status, correlationId: corrId }, `HCP API POST error: ${res.status}`);
      
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
          { status: res.status, path, body: redactPayload(body) }
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
          { status: res.status, path, body: redactPayload(body) }
        );
      }
    }
    return res.json();
  } catch (err: any) {
    if (err.type) throw err; // Already a structured error
    
    log.error({ path, error: err.message, body: redactPayload(body), correlationId: corrId }, `Failed to POST to HCP API`);
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

function normPhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (!digits) return "";
  const normalized = digits.length > 10 ? digits.slice(-10) : digits;
  return normalized.length === 10 ? normalized : "";
}

function isValidPhone(input: string): boolean {
  return normPhone(input).length === 10;
}

function normName(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function phoneLast4(input?: string) {
  if (!input) return undefined;
  const digits = normPhone(input);
  return digits ? digits.slice(-4) : undefined;
}

function maskPhone(input?: string) {
  const last4 = phoneLast4(input);
  return last4 ? `***-***-${last4}` : undefined;
}

function redactPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return { type: typeof payload };
  }
  if (Array.isArray(payload)) {
    return { type: "array", length: payload.length };
  }
  const record = payload as Record<string, unknown>;
  const keys = Object.keys(record);
  return {
    type: "object",
    keys,
    has_phone: keys.some(key => key.includes("phone") || key.includes("number")),
    has_email: keys.includes("email"),
    has_address: keys.some(key => key.includes("address") || key.includes("street") || key.includes("zip"))
  };
}

function redactCustomerLookupInput(input: { first_name?: string; last_name?: string; phone?: string }) {
  return {
    has_first_name: Boolean(input.first_name),
    has_last_name: Boolean(input.last_name),
    phone_last4: phoneLast4(input.phone)
  };
}

function redactBookingInput(input: BookInput) {
  return {
    has_first_name: Boolean(input.first_name),
    has_last_name: Boolean(input.last_name),
    phone_last4: phoneLast4(input.phone),
    has_email: Boolean(input.email),
    zip_prefix: input.zip ? input.zip.slice(0, 3) : undefined
  };
}

function buildFullAddress(address: any) {
  if (!address) return undefined;
  return [address.street, address.street_line_2, address.city, address.state, address.zip]
    .filter(Boolean)
    .join(", ");
}

function getCustomerPhoneCandidates(customer: any) {
  return [customer.mobile_number, customer.home_number, customer.work_number].filter(Boolean);
}

function parseDate(value?: string) {
  if (!value) return undefined;
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? undefined : parsed;
}

function formatJobScheduleSummary(job: any, appointment?: any) {
  const scheduledStart = appointment?.start_time || appointment?.scheduled_start || job?.schedule?.scheduled_start || job?.scheduled_start;
  const scheduledEnd = appointment?.end_time || appointment?.scheduled_end || job?.schedule?.scheduled_end || job?.scheduled_end;
  if (scheduledStart && scheduledEnd) {
    return `Scheduled for ${scheduledStart} to ${scheduledEnd}.`;
  }
  if (scheduledStart) {
    return `Scheduled for ${scheduledStart}.`;
  }
  return "Schedule not yet assigned.";
}

function getWorkStatus(job: any): string {
  const rawStatus = job?.work_status || job?.status || "unknown";
  return String(rawStatus).toLowerCase();
}

function isFinalizedStatus(status: string): boolean {
  return ["completed", "cancelled", "canceled", "closed"].includes(status);
}

/** Choose a booking window by time-of-day preference in COMPANY_TZ */
function chooseWindow(
  windows: Array<{ start_time: string; end_time: string; available: boolean }>,
  pref: "any" | "morning" | "afternoon" | "evening"
): { window: { start_time: string; end_time: string; available: boolean }; matchedPreference: boolean } | undefined {
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
  if (candidates.length) {
    return { window: candidates[0], matchedPreference: true };
  }
  const fallback = windows.find(w => w.available);
  return fallback ? { window: fallback, matchedPreference: false } : undefined;
}

async function findOrCreateCustomer(input: BookInput, correlationId?: string) {
  const corrId = correlationId || randomUUID();

  const lockKey = (input.email || normPhone(input.phone) || `${input.first_name}-${input.last_name}-${input.zip}`)
    .toLowerCase();
  const existingLock = customerCreationLocks.get(lockKey);
  if (existingLock) {
    return existingLock;
  }

  const creationPromise = (async () => {
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
  })();

  customerCreationLocks.set(lockKey, creationPromise);
  try {
    return await creationPromise;
  } finally {
    customerCreationLocks.delete(lockKey);
  }
}

function toYmd(dateIso: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: COMPANY_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(new Date(dateIso));
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

type StrictCustomerLookupInput = {
  first_name: string;
  last_name: string;
  phone: string;
};

async function lookupCustomerStrict(input: StrictCustomerLookupInput, correlationId: string) {
  const normalizedInput = {
    first_name: normName(input.first_name),
    last_name: normName(input.last_name),
    phone: normPhone(input.phone)
  };

  const searchResult = await hcpGet("/customers", {
    q: input.phone,
    page_size: 10
  }, correlationId) as any;

  const customers = searchResult.customers || [];
  const strictMatches = customers.filter((customer: any) => {
    const first = normName(customer.first_name || "");
    const last = normName(customer.last_name || "");
    const phoneMatches = getCustomerPhoneCandidates(customer)
      .some((phone: string) => normPhone(phone) === normalizedInput.phone);

    return first === normalizedInput.first_name
      && last === normalizedInput.last_name
      && phoneMatches;
  });

  const rankedMatches = strictMatches
    .map((customer: any, index: number) => ({
      customer,
      index,
      createdAt: parseDate(customer.created_at)
    }))
    .sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return b.createdAt.getTime() - a.createdAt.getTime();
      }
      if (a.createdAt) return -1;
      if (b.createdAt) return 1;
      return a.index - b.index;
    });

  return {
    customers,
    strictMatches,
    selected: rankedMatches[0]?.customer || null
  };
}

function formatCustomerSummary(customer: any) {
  const primaryAddress = customer?.addresses?.[0];
  return {
    customer_id: customer.id,
    first_name: customer.first_name,
    last_name: customer.last_name,
    phone: maskPhone(getCustomerPhoneCandidates(customer)[0]),
    primary_address: primaryAddress ? buildFullAddress(primaryAddress) : undefined
  };
}

function extractJobsResponse(response: any) {
  return response?.jobs || response?.data || response?.items || [];
}

function getJobTimestamp(job: any) {
  return parseDate(
    job?.schedule?.scheduled_start
    || job?.scheduled_start
    || job?.scheduled_end
    || job?.created_at
  );
}

function selectJobByPreference(jobs: any[], preference: "upcoming" | "most_recent") {
  const now = Date.now();
  const withDates = jobs
    .map(job => ({ job, date: getJobTimestamp(job) }))
    .filter(({ date }) => date);

  if (preference === "upcoming") {
    const upcoming = withDates
      .filter(({ date }) => (date as Date).getTime() >= now)
      .sort((a, b) => (a.date as Date).getTime() - (b.date as Date).getTime());
    return upcoming[0]?.job || null;
  }

  const recent = withDates
    .sort((a, b) => (b.date as Date).getTime() - (a.date as Date).getTime());
  return recent[0]?.job || null;
}

const server = new McpServer({
  name: "jb-booker",
  version: "1.0.0"
});

// Register ChatGPT UI widget templates as MCP resources
// These render interactive UI inside ChatGPT when tools are called
const WIDGET_DOMAIN = process.env.SITE_URL || "https://chatgpt.com";

server.resource(
  "booking-confirmation-widget",
  "ui://widget/booking-confirmation.html",
  {},
  async () => ({
    contents: [{
      uri: "ui://widget/booking-confirmation.html",
      mimeType: "text/html+skybridge",
      text: BOOKING_CONFIRMATION_WIDGET,
      _meta: {
        "openai/widgetPrefersBorder": true,
        "openai/widgetDomain": WIDGET_DOMAIN
      }
    }]
  })
);

server.resource(
  "availability-widget",
  "ui://widget/availability.html",
  {},
  async () => ({
    contents: [{
      uri: "ui://widget/availability.html",
      mimeType: "text/html+skybridge",
      text: AVAILABILITY_WIDGET,
      _meta: {
        "openai/widgetPrefersBorder": true,
        "openai/widgetDomain": WIDGET_DOMAIN
      }
    }]
  })
);

server.resource(
  "services-widget",
  "ui://widget/services.html",
  {},
  async () => ({
    contents: [{
      uri: "ui://widget/services.html",
      mimeType: "text/html+skybridge",
      text: SERVICES_WIDGET,
      _meta: {
        "openai/widgetPrefersBorder": true,
        "openai/widgetDomain": WIDGET_DOMAIN
      }
    }]
  })
);

server.resource(
  "quote-widget",
  "ui://widget/quote.html",
  {},
  async () => ({
    contents: [{
      uri: "ui://widget/quote.html",
      mimeType: "text/html+skybridge",
      text: QUOTE_WIDGET,
      _meta: {
        "openai/widgetPrefersBorder": true,
        "openai/widgetDomain": WIDGET_DOMAIN
      }
    }]
  })
);

server.resource(
  "emergency-widget",
  "ui://widget/emergency.html",
  {},
  async () => ({
    contents: [{
      uri: "ui://widget/emergency.html",
      mimeType: "text/html+skybridge",
      text: EMERGENCY_WIDGET,
      _meta: {
        "openai/widgetPrefersBorder": true,
        "openai/widgetDomain": WIDGET_DOMAIN
      }
    }]
  })
);

log.info("Registered 5 ChatGPT widget templates for interactive UI");

type ToolMetrics = {
  totalCalls: number;
  successCalls: number;
  failureCalls: number;
  totalLatencyMs: number;
  lastError?: string;
  lastFailureAt?: string;
};

const toolMetrics = new Map<string, ToolMetrics>();

function recordToolMetric(toolName: string, success: boolean, latencyMs: number, errorMessage?: string) {
  const metric = toolMetrics.get(toolName) || {
    totalCalls: 0,
    successCalls: 0,
    failureCalls: 0,
    totalLatencyMs: 0
  };

  metric.totalCalls += 1;
  metric.totalLatencyMs += latencyMs;

  if (success) {
    metric.successCalls += 1;
  } else {
    metric.failureCalls += 1;
    metric.lastError = errorMessage;
    metric.lastFailureAt = new Date().toISOString();
  }

  toolMetrics.set(toolName, metric);
}

function normalizeToolResponse(
  toolName: string,
  response: any,
  latencyMs: number
): { response: any; success: boolean } {
  const content = response?.content?.[0];
  if (!content?.text || typeof content.text !== "string") {
    return { response, success: true };
  }

  try {
    const payload = JSON.parse(content.text);
    const correlationId = payload.correlation_id || randomUUID();
    const success = payload.success !== false;

    if (!payload.correlation_id) {
      payload.correlation_id = correlationId;
    }

    if (!payload.status) {
      payload.status = success ? "ok" : "error";
    }

    payload.diagnostics = {
      ...(payload.diagnostics || {}),
      tool: toolName,
      correlation_id: correlationId,
      latency_ms: latencyMs,
      timestamp: new Date().toISOString()
    };

    content.text = JSON.stringify(payload, null, 2);
    return { response, success };
  } catch (error) {
    return { response, success: true };
  }
}

function registerToolWithDiagnostics(
  name: string,
  definition: any,
  handler: (raw: any) => Promise<any>
) {
  server.registerTool(name, definition, async (raw) => {
    const startTime = Date.now();

    try {
      const result = await handler(raw);
      const latencyMs = Date.now() - startTime;
      const normalized = normalizeToolResponse(name, result, latencyMs);

      recordToolMetric(name, normalized.success, latencyMs);
      return normalized.response;
    } catch (error: any) {
      const latencyMs = Date.now() - startTime;
      recordToolMetric(name, false, latencyMs, error?.message || "Unknown error");
      throw error;
    }
  });
}

registerToolWithDiagnostics(
  "book_service_call",
  {
    title: "Book a Johnson Bros. Plumbing service visit",
    description: `Book a plumbing service appointment with Johnson Bros. Plumbing. This tool creates or updates a customer record, finds an available time slot, and schedules the job in HousecallPro.

WHEN TO USE: After you have collected all required customer information (name, phone, address, and issue description). For returning customers, use 'lookup_customer' first to verify their details.

WORKFLOW: 
1. First use 'get_services' or 'get_quote' if the customer needs service/pricing information
2. Then use 'search_availability' to show available time slots
3. Finally use this tool to complete the booking once all details are confirmed

SERVICE AREA: Norfolk, Suffolk, and Plymouth Counties in Massachusetts (South Shore area including Quincy, Braintree, Weymouth, Abington, Rockland). If ZIP code is outside service area, a callback lead will be created instead.

IMPORTANT: All required fields must be provided. Phone must be a valid 10-digit US number.`,
    inputSchema: {
      type: "object",
      properties: {
        first_name: { 
          type: "string", 
          description: "Customer's first name (required). Example: 'John'" 
        },
        last_name: { 
          type: "string", 
          description: "Customer's last name (required). Example: 'Smith'" 
        },
        phone: { 
          type: "string", 
          description: "Customer's phone number (required). Must be a valid 10-digit US phone number. Examples: '6175551234', '(617) 555-1234', '617-555-1234'" 
        },
        email: { 
          type: "string", 
          description: "Customer's email address (optional). Used for appointment confirmations and receipts." 
        },
        street: { 
          type: "string", 
          description: "Street address where service is needed (required). Example: '123 Main Street'" 
        },
        street_line_2: { 
          type: "string", 
          description: "Apartment, unit, or suite number (optional). Example: 'Apt 2B'" 
        },
        city: { 
          type: "string", 
          description: "City name (required). Must be within our service area. Example: 'Quincy'" 
        },
        state: { 
          type: "string", 
          description: "Two-letter state code (required). Example: 'MA'" 
        },
        zip: { 
          type: "string", 
          description: "5-digit ZIP code (required). Used to verify service area eligibility. Example: '02169'" 
        },
        country: { 
          type: "string", 
          description: "Country code (optional, defaults to 'USA')" 
        },
        description: { 
          type: "string", 
          description: "Detailed description of the plumbing issue (required). Include symptoms, location, and any relevant details. Example: 'Kitchen sink is clogged and draining slowly. Tried plunger but no improvement.'" 
        },
        lead_source: { 
          type: "string", 
          description: "How the customer found us (optional). Examples: 'Google', 'Referral', 'Website Chat'" 
        },
        time_preference: { 
          type: "string", 
          enum: ["any", "morning", "afternoon", "evening"], 
          description: "Preferred time of day for the appointment. 'morning' = 7am-12pm, 'afternoon' = 12pm-5pm, 'evening' = 5pm-9pm, 'any' = first available" 
        },
        earliest_date: { 
          type: "string", 
          description: "Earliest acceptable date for the appointment in YYYY-MM-DD format. Example: '2025-01-15'" 
        },
        latest_date: { 
          type: "string", 
          description: "Latest acceptable date for the appointment in YYYY-MM-DD format. Example: '2025-01-20'" 
        },
        show_for_days: { 
          type: "number", 
          minimum: 1, 
          maximum: 30, 
          description: "Number of days to search for availability (default: 7, max: 30)" 
        },
        tags: { 
          type: "array", 
          items: { type: "string" }, 
          description: "Optional tags for the job. Example: ['Urgent', 'Repeat Customer']" 
        }
      },
      required: ["first_name", "last_name", "phone", "street", "city", "state", "zip", "description"]
    },
    annotations: {
      title: "Book Service Appointment",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true
    },
    _meta: {
      "openai/outputTemplate": "ui://widget/booking-confirmation.html",
      "openai/toolInvocation/invoking": "Scheduling your appointment...",
      "openai/toolInvocation/invoked": "Appointment confirmed!"
    }
  } as any,
  async (raw) => {
    const correlationId = randomUUID();
    
    try {
      // Input validation
      const input = BookInput.parse(raw);
      if (!isValidPhone(input.phone)) {
        throw createStructuredError(
          ErrorType.VALIDATION,
          "INVALID_PHONE_NUMBER",
          `Phone number failed validation: ${input.phone}`,
          "The phone number provided is invalid. Please enter a valid 10-digit US phone number.",
          correlationId
        );
      }
      log.info({ input: redactBookingInput(input), correlationId }, "book_service_call: start");

      // Step 0.5: Service area validation - check if zip code is within our service area
      if (!isInServiceArea(input.zip)) {
        log.info({ 
          correlationId, 
          zip: input.zip, 
          phone_last4: phoneLast4(input.phone) 
        }, "book_service_call: out of service area - creating lead instead");

        // Create a lead for out-of-area customers so they get a callback
        const timestamp = new Date().toISOString();
        const leadNotes = [
          `[AI Lead - Out of Area] Customer requested service at ZIP ${input.zip}`,
          `\n\nISSUE: ${input.description}`,
          `\nAddress: ${input.street}, ${input.city}, ${input.state} ${input.zip}`,
          `\nPreferred time: ${input.time_preference || 'any'}`,
          `\n\nAuto-created via AI on ${timestamp} - ZIP outside service area`,
          `\nCustomer should be contacted to discuss service options.`
        ].join("");

        let leadCreated = false;

        // Try to create customer and log lead
        try {
          const searchResult = await hcpGet("/customers", { q: input.phone, page_size: 5 }, correlationId) as any;
          const existingCustomer = (searchResult.customers || [])[0];

          let customerId: string;
          
          if (existingCustomer?.id) {
            customerId = existingCustomer.id;
          } else {
            const customerPayload = {
              first_name: input.first_name,
              last_name: input.last_name,
              mobile_number: input.phone,
              email: input.email,
              notifications_enabled: true,
              lead_source: input.lead_source || "AI Assistant - Out of Area",
              tags: ["Out of Area", "AI Lead", "Callback Requested"],
              addresses: [{
                street: input.street,
                street_line_2: input.street_line_2 || null,
                city: input.city,
                state: input.state,
                zip: input.zip,
                country: input.country || "USA"
              }]
            };

            const newCustomer = await hcpPost("/customers", customerPayload, correlationId) as any;
            customerId = newCustomer.id;
          }

          // Try to create a lead
          try {
            await hcpPost("/leads", {
              customer_id: customerId,
              source: input.lead_source || "AI Assistant - Out of Area",
              notes: leadNotes,
              tags: ["Out of Area", "Callback Requested"]
            }, correlationId);
            leadCreated = true;
          } catch (leadErr: any) {
            // Fall back to adding a note to the customer
            try {
              await hcpPost(`/customers/${customerId}/notes`, { content: leadNotes }, correlationId);
              leadCreated = true;
            } catch (noteErr: any) {
              log.warn({ correlationId, error: noteErr.message }, "Failed to add out-of-area note");
            }
          }
        } catch (err: any) {
          log.error({ correlationId, error: err.message }, "Failed to create out-of-area lead");
        }

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              out_of_service_area: true,
              error_code: "OUT_OF_SERVICE_AREA",
              zip_provided: input.zip,
              message: `We're sorry, but ZIP code ${input.zip} is outside our service area. ${getServiceAreaMessage()}`,
              lead_created: leadCreated,
              next_steps: "We've noted your request and our office will contact you to discuss options. For immediate assistance, please call (617) 479-9911.",
              service_area_info: {
                counties: ["Norfolk", "Suffolk", "Plymouth"],
                state: "Massachusetts",
                example_cities: ["Quincy", "Braintree", "Weymouth", "Abington", "Rockland", "Plymouth", "Hingham"]
              },
              phone: "(617) 479-9911",
              correlation_id: correlationId
            }, null, 2)
          }]
        };
      }

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

      if (!chosen.matchedPreference) {
        log.info({
          correlationId,
          preference: input.time_preference,
          fallback_window: chosen.window.start_time
        }, "No windows matched preference; falling back to first available.");
      }

      // Step 3: find or create customer
      const customer = await findOrCreateCustomer(input, correlationId);

      // Step 4: get address id (create if needed)
      const addressId = await getPrimaryAddressId(customer, input, correlationId);

      // Step 5: create job with day + arrival window
      const { job, arrival_window } = await createJob(customer.id, addressId, chosen.window, input.description, input.lead_source, input.tags, correlationId);

      // Step 6: add appointment with concrete start/end (time on the day)
      let appointmentCreated: any = null;
      try {
        appointmentCreated = await createAppointment((job as any).id, chosen.window, arrival_window, correlationId);
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
        scheduled_start: chosen.window.start_time,
        scheduled_end: chosen.window.end_time,
        arrival_window_minutes: arrival_window,
        summary: `Booked for ${toYmd(chosen.window.start_time)} (${input.time_preference})`,
        customer_id: customer.id,
        correlation_id: correlationId,
        matched_preference: chosen.matchedPreference
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
registerToolWithDiagnostics(
  "search_availability",
  {
    title: "Search Johnson Bros. Plumbing service availability",
    description: `Check available appointment time slots without making a booking. Returns a list of available windows for the specified date and service type.

WHEN TO USE: Before booking an appointment, use this tool to show the customer what times are available. This helps them choose a convenient slot before committing.

WORKFLOW:
1. Use this tool to show available times
2. Let the customer choose their preferred slot
3. Then use 'book_service_call' to complete the booking

RETURNS: List of available time slots with formatted times in Eastern timezone. If no slots match the time preference, suggests trying 'any' for more options.

TIP: Use 'get_capacity' first to understand overall scheduling availability before showing specific slots.`,
    inputSchema: {
      type: "object",
      properties: {
        date: { 
          type: "string", 
          format: "date", 
          description: "Date to check availability for in YYYY-MM-DD format (required). Example: '2025-01-15'" 
        },
        serviceType: { 
          type: "string", 
          description: "Type of plumbing service needed (required). Examples: 'drain cleaning', 'water heater repair', 'toilet repair', 'emergency plumbing', 'routine maintenance'" 
        },
        time_preference: { 
          type: "string", 
          enum: ["any", "morning", "afternoon", "evening"], 
          description: "Preferred time of day. 'morning' = 7am-12pm, 'afternoon' = 12pm-5pm, 'evening' = 5pm-9pm, 'any' = show all available slots (default: 'any')" 
        },
        show_for_days: { 
          type: "number", 
          minimum: 1, 
          maximum: 30, 
          description: "Number of days to search starting from the specified date (default: 7). Increase this if the customer has flexible scheduling." 
        }
      },
      required: ["date", "serviceType"]
    },
    annotations: {
      title: "Check Availability",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    },
    _meta: {
      "openai/outputTemplate": "ui://widget/availability.html",
      "openai/toolInvocation/invoking": "Checking available appointments...",
      "openai/toolInvocation/invoked": "Here are the available times"
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

// Get Capacity Tool
server.registerTool(
  "get_capacity",
  {
    title: "Get Real-Time Service Capacity",
    description: `Check current scheduling capacity and availability state. Returns real-time information about how busy the schedule is and whether same-day service is available.

WHEN TO USE: At the start of a booking conversation to understand current availability, or when a customer asks "Can you come today?" or "How soon can you get here?"

CAPACITY STATES:
- SAME_DAY_FEE_WAIVED: Plenty of availability, same-day service available with no extra fee
- LIMITED_SAME_DAY: Some same-day slots remain, encourage quick booking
- NEXT_DAY: Fully booked today, suggest next-day scheduling
- EMERGENCY_ONLY: Very limited capacity, only emergency bookings accepted

WORKFLOW:
1. Use this tool first to understand current capacity
2. Use 'search_availability' to show specific time slots
3. Adjust your recommendations based on capacity state

RETURNS: Capacity state, score (0-100), express window availability, and recommended messaging for the customer.`,
    inputSchema: {
      type: "object",
      properties: {
        date: { 
          type: "string", 
          format: "date", 
          description: "Date to check capacity for in YYYY-MM-DD format (optional, defaults to today). Example: '2025-01-15'" 
        },
        zip: { 
          type: "string", 
          description: "Customer's ZIP code for localized capacity information (optional). Example: '02169'" 
        },
        service_area: { 
          type: "string", 
          description: "City or area name if ZIP is not available (optional). Examples: 'Quincy', 'South Shore'" 
        }
      }
    },
    annotations: {
      title: "Check Capacity",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  } as any,
  async (raw) => {
    const correlationId = randomUUID();

    try {
      const input = GetCapacityInput.parse(raw || {});
      log.info({ input, correlationId }, "get_capacity: start");

      const calculator = CapacityCalculator.getInstance();
      let capacity;

      if (input.date) {
        const date = new Date(`${input.date}T12:00:00`);
        capacity = await calculator.calculateCapacity(date, input.zip || input.service_area);
      } else {
        capacity = await calculator.getTodayCapacity(input.zip || input.service_area);
      }

      const expressWindows = capacity.unique_express_windows || [];
      const nextExpressWindow = expressWindows.find((window) => window.available_techs.length > 0) || null;

      const result = {
        success: true,
        capacity_state: capacity.overall.state,
        capacity_score: capacity.overall.score,
        express_eligible: capacity.express_eligible || false,
        express_windows: expressWindows,
        next_express_window: nextExpressWindow,
        ui_copy: capacity.ui_copy,
        expires_at: capacity.expires_at,
        guidance: {
          recommended_action: capacity.overall.state === "SAME_DAY_FEE_WAIVED"
            ? "Promote same-day booking and highlight waived fee."
            : capacity.overall.state === "LIMITED_SAME_DAY"
            ? "Offer remaining same-day windows and encourage quick booking."
            : capacity.overall.state === "NEXT_DAY"
            ? "Steer customer toward next-day scheduling."
            : "Offer emergency booking only and recommend calling for urgent issues."
        },
        correlation_id: correlationId
      };

      log.info({ result: { state: capacity.overall.state, score: capacity.overall.score }, correlationId }, "get_capacity: success");

      return {
        content: [
          { type: "text", text: JSON.stringify(result, null, 2) }
        ]
      };
    } catch (err: any) {
      log.error({ error: err.message, correlationId }, "get_capacity: error");

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: "Unable to retrieve capacity information right now.",
            correlation_id: correlationId
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

registerToolWithDiagnostics(
  "get_quote",
  {
    title: "Get Plumbing Service Quote",
    description: `Provide an instant price estimate for plumbing services. Returns estimated price range, duration, and recommendations based on the service type and urgency.

WHEN TO USE: When a customer asks "How much does it cost?", "What's the price?", or wants to know pricing before booking. Use this early in the conversation to set expectations.

PRICING NOTES:
- Estimates are ranges; final price depends on on-site assessment
- Emergency and urgent services include premium pricing
- Commercial properties have a 20% premium
- We offer a $99 diagnostic fee that's waived if customer proceeds with repair

WORKFLOW:
1. Use this tool when customer asks about pricing
2. Share the estimate with appropriate caveats
3. If they want to proceed, use 'search_availability' then 'book_service_call'

RETURNS: Service name, price range (min/max in USD), estimated duration, urgency notes, and suggested next steps.`,
    inputSchema: {
      type: "object",
      properties: {
        service_type: { 
          type: "string", 
          description: "Type of plumbing service (required). Examples: 'drain cleaning', 'water heater repair', 'toilet repair', 'faucet installation', 'pipe repair', 'sewer line', 'emergency plumbing'" 
        },
        issue_description: { 
          type: "string", 
          description: "Description of the plumbing problem (required). Be specific about symptoms and location. Example: 'Kitchen sink drains slowly and makes gurgling sounds'" 
        },
        property_type: { 
          type: "string", 
          enum: ["residential", "commercial"], 
          description: "Type of property (default: 'residential'). Commercial properties have different pricing." 
        },
        urgency: { 
          type: "string", 
          enum: ["routine", "soon", "urgent", "emergency"], 
          description: "How urgent is the repair? 'routine' = can wait a week, 'soon' = within a few days, 'urgent' = within 24 hours, 'emergency' = immediate dispatch needed (default: 'routine')" 
        }
      },
      required: ["service_type", "issue_description"]
    },
    annotations: {
      title: "Get Price Estimate",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    },
    _meta: {
      "openai/outputTemplate": "ui://widget/quote.html",
      "openai/toolInvocation/invoking": "Calculating your estimate...",
      "openai/toolInvocation/invoked": "Here's your instant estimate"
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

registerToolWithDiagnostics(
  "emergency_help",
  {
    title: "Emergency Plumbing Help",
    description: `Provide immediate safety guidance and step-by-step instructions for plumbing emergencies. This tool helps customers mitigate damage while waiting for a plumber.

WHEN TO USE: Immediately when a customer mentions an emergency situation like:
- Burst pipe, flooding, or water damage
- Gas smell or suspected gas leak (CRITICAL - may need to call 911)
- Sewage backup or overflow
- No water or sudden loss of water
- Water heater leaking or not working

PRIORITY ORDER:
1. First ensure customer safety (especially for gas leaks)
2. Provide immediate mitigation steps (how to shut off water, etc.)
3. Then offer to book emergency service

RETURNS: Step-by-step immediate actions, safety warnings, things NOT to do, urgency level, and whether emergency dispatch is recommended.

IMPORTANT: For gas leaks, always advise leaving the house and calling 911 first.`,
    inputSchema: {
      type: "object",
      properties: {
        emergency_type: { 
          type: "string", 
          description: "Type of plumbing emergency (required). Examples: 'burst pipe', 'flooding', 'gas leak', 'gas smell', 'sewage backup', 'no hot water', 'water heater leaking', 'clogged toilet overflowing', 'no water'" 
        },
        additional_details: { 
          type: "string", 
          description: "Additional context about the emergency (optional). Include: location in home, how long it's been happening, any actions already taken. Example: 'Pipe burst in basement, water is actively spraying, I can't find the shutoff valve'" 
        }
      },
      required: ["emergency_type"]
    },
    annotations: {
      title: "Emergency Guidance",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    },
    _meta: {
      "openai/outputTemplate": "ui://widget/emergency.html",
      "openai/toolInvocation/invoking": "Getting emergency guidance...",
      "openai/toolInvocation/invoked": "Here's what to do right now"
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

registerToolWithDiagnostics(
  "get_services",
  {
    title: "Get Available Plumbing Services",
    description: `List all plumbing services offered by Johnson Bros. Plumbing. Returns service names, descriptions, price ranges, and estimated durations.

WHEN TO USE: When a customer asks "What services do you offer?", "What can you help with?", or wants to browse available services before describing their issue.

SERVICE CATEGORIES:
- emergency: 24/7 urgent repairs (burst pipes, major leaks, sewage backup)
- maintenance: Preventive services (drain cleaning, inspections)
- repair: Fix existing issues (toilet repair, faucet leaks, pipe repair)
- installation: New fixtures and equipment (water heaters, faucets, toilets)
- specialty: Specialized services (sewer lines, gas lines, water filtration)

WORKFLOW:
1. Use this tool to show available services
2. Once customer identifies their need, use 'get_quote' for pricing
3. Then use 'search_availability' and 'book_service_call' to complete booking

RETURNS: List of services with price ranges and durations, plus business contact info.`,
    inputSchema: {
      type: "object",
      properties: {
        category: { 
          type: "string", 
          description: "Filter services by category (optional). Options: 'emergency', 'maintenance', 'repair', 'installation', 'specialty'" 
        },
        search: { 
          type: "string", 
          description: "Search term to find specific services (optional). Examples: 'water heater', 'drain', 'toilet'" 
        }
      }
    },
    annotations: {
      title: "Browse Services",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    },
    _meta: {
      "openai/outputTemplate": "ui://widget/services.html",
      "openai/toolInvocation/invoking": "Loading services...",
      "openai/toolInvocation/invoked": "Here are our services"
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

// Lookup Customer Tool - strict identification by name + phone
const LookupCustomerInput = z.object({
  first_name: z.string().min(1).describe("Customer's first name"),
  last_name: z.string().min(1).describe("Customer's last name"),
  phone: z.string().min(7).describe("Customer's phone number")
});

const CallbackRequestInput = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone: z.string().min(7),
  job_id: z.string().optional(),
  requested_times: z.string().optional(),
  reason: z.string().optional()
});

const RescheduleCallbackInput = CallbackRequestInput;
const CancellationCallbackInput = CallbackRequestInput.omit({ requested_times: true });

const JobStatusInput = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone: z.string().min(7),
  job_id: z.string().optional(),
  job_selection: z.enum(["most_recent", "upcoming"]).optional().default("upcoming")
});

registerToolWithDiagnostics(
  "lookup_customer",
  {
    title: "Look Up Existing Customer",
    description: `Verify and retrieve an existing customer's information from HousecallPro using their name and phone number.

WHEN TO USE: When a customer says they are a returning customer, or when they want to check on an existing appointment, or before booking if you want to see if they're already in the system.

STRICT MATCHING: This tool requires an exact match on first name, last name, AND phone number. All three must match a customer record.

WORKFLOW:
1. Ask the customer for their first name, last name, and phone number
2. Use this tool to verify their identity
3. If found, you can proceed with booking or checking their job status
4. If not found, treat them as a new customer for booking

RETURNS: Customer ID, masked phone number, and primary address on file if found. Suggests next steps based on the result.`,
    inputSchema: {
      type: "object",
      properties: {
        first_name: { 
          type: "string", 
          description: "Customer's first name exactly as it appears in our records (required). Example: 'John'" 
        },
        last_name: { 
          type: "string", 
          description: "Customer's last name exactly as it appears in our records (required). Example: 'Smith'" 
        },
        phone: { 
          type: "string", 
          description: "Customer's phone number (required). Must match the number on file. Examples: '6175551234', '(617) 555-1234'" 
        }
      },
      required: ["first_name", "last_name", "phone"]
    },
    annotations: {
      title: "Verify Customer",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  } as any,
  async (raw) => {
    const correlationId = randomUUID();
    
    try {
      const input = LookupCustomerInput.parse(raw || {});
      log.info({ input: redactCustomerLookupInput(input), correlationId }, "lookup_customer: start");

      const lookup = await lookupCustomerStrict(input, correlationId);
      if (!lookup.selected) {
        log.info({ correlationId, phone_last4: phoneLast4(input.phone) }, "lookup_customer: no strict match");

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              found: false,
              message: "No customer found matching the provided details. If you are a returning customer, please verify your first name, last name, and phone number.",
              correlation_id: correlationId
            }, null, 2)
          }]
        };
      }

      const customerSummary = formatCustomerSummary(lookup.selected);

      const result = {
        success: true,
        found: true,
        customer: customerSummary,
        message: "Customer verified. I have your information on file.",
        next_steps: "Would you like to book a service appointment, or do you need help with an existing job?",
        correlation_id: correlationId
      };

      log.info({
        result: {
          found: true,
          customer_id: customerSummary.customer_id
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

registerToolWithDiagnostics(
  "request_reschedule_callback",
  {
    title: "Request Reschedule Callback",
    description: `Log a reschedule request for an existing appointment. This creates a callback request for the office to process - it does NOT directly modify the schedule.

WHEN TO USE: When a customer says they need to reschedule their existing appointment to a different time or date.

IMPORTANT LIMITATIONS:
- This tool REQUESTS a reschedule, it doesn't perform one directly
- Office staff must confirm and process the reschedule
- Completed or ambiguous appointments require a phone call to the office

WORKFLOW:
1. Use 'lookup_customer' first to verify the customer
2. Use this tool to log the reschedule request
3. Inform customer that the office will call to confirm the new time

REQUIRES: Customer verification with name and phone. If no job_id provided, the system will attempt to find their upcoming appointment.`,
    inputSchema: {
      type: "object",
      properties: {
        first_name: { 
          type: "string", 
          description: "Customer's first name for verification (required). Example: 'John'" 
        },
        last_name: { 
          type: "string", 
          description: "Customer's last name for verification (required). Example: 'Smith'" 
        },
        phone: { 
          type: "string", 
          description: "Customer's phone number for verification (required). Example: '6175551234'" 
        },
        job_id: { 
          type: "string", 
          description: "HousecallPro job ID if known (optional). If not provided, the system will look for upcoming appointments." 
        },
        requested_times: { 
          type: "string", 
          description: "Customer's preferred new times or date range (optional). Example: 'Next Tuesday morning' or 'Any afternoon this week'" 
        },
        reason: { 
          type: "string", 
          description: "Reason for the reschedule request (optional). Example: 'Work conflict' or 'Family emergency'" 
        }
      },
      required: ["first_name", "last_name", "phone"]
    },
    annotations: {
      title: "Request Reschedule",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true
    }
  } as any,
  async (raw) => {
    const correlationId = randomUUID();

    try {
      const input = RescheduleCallbackInput.parse(raw || {});
      log.info({ input: redactCustomerLookupInput(input), job_id: input.job_id, correlationId }, "request_reschedule_callback: start");

      const lookup = await lookupCustomerStrict(input, correlationId);
      if (!lookup.selected) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: "Unable to verify customer with the provided details.",
              correlation_id: correlationId
            }, null, 2)
          }]
        };
      }

      const customerId = lookup.selected.id;
      let jobId = input.job_id;
      let jobDetails: any = null;
      let usedFallbackJob = false;

      if (!jobId) {
        const jobsResponse = await hcpGet("/jobs", { customer_id: customerId, page_size: 25 }, correlationId) as any;
        const jobs = extractJobsResponse(jobsResponse);
        const selectedJob = selectJobByPreference(jobs, "upcoming");
        if (selectedJob?.id) {
          jobId = selectedJob.id;
        } else {
          const fallbackJob = selectJobByPreference(jobs, "most_recent");
          if (fallbackJob?.id) {
            jobId = fallbackJob.id;
            usedFallbackJob = true;
          }
        }
      }

      if (!jobId) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: "No jobs were found for this customer.",
              action_required: "CALL_US",
              requires_office_call: true,
              confirmation_required: true,
              call_phone: "(617) 555-0123",
              call_reason: "We couldn't locate an active appointment to reschedule. Please call the office so we can verify and assist.",
              correlation_id: correlationId
            }, null, 2)
          }]
        };
      }

      jobDetails = await hcpGet(`/jobs/${jobId}`, undefined, correlationId) as any;

      if (jobDetails?.customer_id && jobDetails.customer_id !== customerId) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: "The specified job does not belong to the verified customer.",
              correlation_id: correlationId
            }, null, 2)
          }]
        };
      }

      const timestamp = new Date().toISOString();
      const noteContent = [
        "[AI Request] Customer requested a reschedule callback.",
        `Requested times: ${input.requested_times || "Not provided"}.`,
        `Reason: ${input.reason || "Not provided"}.`,
        `Requested via AI on ${timestamp}.`
      ].join(" ");

      // Business rule: log the request only; never mutate schedules or appointments.
      await hcpPost(`/jobs/${jobId}/notes`, { content: noteContent }, correlationId);

      const summary = formatJobScheduleSummary(jobDetails);
      const workStatus = getWorkStatus(jobDetails);
      const requiresOfficeCall = usedFallbackJob || isFinalizedStatus(workStatus);
      const callReason = requiresOfficeCall
        ? "Reschedule requests for completed or unclear appointments must be handled by the office."
        : "Reschedule request logged. Please call to confirm changes.";

      const result = {
        success: true,
        action_required: "CALL_US",
        requires_office_call: true,
        confirmation_required: true,
        call_phone: "(617) 555-0123",
        call_reason: callReason,
        job_id: jobId,
        job_status: workStatus,
        current_schedule_summary: summary,
        next_steps: "Please call us at (617) 555-0123. Say: \"I need to reschedule my service appointment. My name is "
          + `${lookup.selected.first_name} ${lookup.selected.last_name}` + ".\"",
        correlation_id: correlationId
      };

      log.info({ correlationId, job_id: jobId, customer_id: customerId }, "request_reschedule_callback: success");

      return {
        content: [
          { type: "text", text: JSON.stringify(result, null, 2) }
        ]
      };
    } catch (err: any) {
      log.error({ error: err.message, correlationId }, "request_reschedule_callback: error");

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: "Unable to log the reschedule request. Please call us directly at (617) 555-0123.",
            correlation_id: correlationId
          }, null, 2)
        }]
      };
    }
  }
);

registerToolWithDiagnostics(
  "request_cancellation_callback",
  {
    title: "Request Cancellation Callback",
    description: "Logs a cancellation callback request for an existing job without modifying the schedule. Office confirmation is required; completed or unclear appointments must be handled by phone.",
    inputSchema: {
      type: "object",
      properties: {
        first_name: { type: "string", description: "Customer's first name" },
        last_name: { type: "string", description: "Customer's last name" },
        phone: { type: "string", description: "Customer's phone number" },
        job_id: { type: "string", description: "Housecall Pro job ID" },
        reason: { type: "string", description: "Reason for cancellation request" }
      },
      required: ["first_name", "last_name", "phone"]
    }
  } as any,
  async (raw) => {
    const correlationId = randomUUID();

    try {
      const input = CancellationCallbackInput.parse(raw || {});
      log.info({ input: redactCustomerLookupInput(input), job_id: input.job_id, correlationId }, "request_cancellation_callback: start");

      const lookup = await lookupCustomerStrict(input, correlationId);
      if (!lookup.selected) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: "Unable to verify customer with the provided details.",
              correlation_id: correlationId
            }, null, 2)
          }]
        };
      }

      const customerId = lookup.selected.id;
      let jobId = input.job_id;
      let jobDetails: any = null;
      let usedFallbackJob = false;

      if (!jobId) {
        const jobsResponse = await hcpGet("/jobs", { customer_id: customerId, page_size: 25 }, correlationId) as any;
        const jobs = extractJobsResponse(jobsResponse);
        const selectedJob = selectJobByPreference(jobs, "upcoming");
        if (selectedJob?.id) {
          jobId = selectedJob.id;
        } else {
          const fallbackJob = selectJobByPreference(jobs, "most_recent");
          if (fallbackJob?.id) {
            jobId = fallbackJob.id;
            usedFallbackJob = true;
          }
        }
      }

      if (!jobId) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: "No jobs were found for this customer.",
              action_required: "CALL_US",
              requires_office_call: true,
              confirmation_required: true,
              call_phone: "(617) 555-0123",
              call_reason: "We couldn't locate an active appointment to cancel. Please call the office so we can verify and assist.",
              correlation_id: correlationId
            }, null, 2)
          }]
        };
      }

      jobDetails = await hcpGet(`/jobs/${jobId}`, undefined, correlationId) as any;

      if (jobDetails?.customer_id && jobDetails.customer_id !== customerId) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: "The specified job does not belong to the verified customer.",
              correlation_id: correlationId
            }, null, 2)
          }]
        };
      }

      const timestamp = new Date().toISOString();
      const noteContent = [
        "[AI Request] Customer requested a cancellation callback.",
        `Reason: ${input.reason || "Not provided"}.`,
        `Requested via AI on ${timestamp}.`
      ].join(" ");

      // Business rule: log the request only; never mutate schedules or appointments.
      await hcpPost(`/jobs/${jobId}/notes`, { content: noteContent }, correlationId);

      const summary = formatJobScheduleSummary(jobDetails);
      const workStatus = getWorkStatus(jobDetails);
      const requiresOfficeCall = usedFallbackJob || isFinalizedStatus(workStatus);
      const callReason = requiresOfficeCall
        ? "Cancellation requests for completed or unclear appointments must be handled by the office."
        : "Cancellation request logged. Please call to confirm changes.";

      const result = {
        success: true,
        action_required: "CALL_US",
        requires_office_call: true,
        confirmation_required: true,
        call_phone: "(617) 555-0123",
        call_reason: callReason,
        job_id: jobId,
        job_status: workStatus,
        current_schedule_summary: summary,
        next_steps: "Please call us at (617) 555-0123. Say: \"I need to cancel my service appointment. My name is "
          + `${lookup.selected.first_name} ${lookup.selected.last_name}` + ".\"",
        correlation_id: correlationId
      };

      log.info({ correlationId, job_id: jobId, customer_id: customerId }, "request_cancellation_callback: success");

      return {
        content: [
          { type: "text", text: JSON.stringify(result, null, 2) }
        ]
      };
    } catch (err: any) {
      log.error({ error: err.message, correlationId }, "request_cancellation_callback: error");

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: "Unable to log the cancellation request. Please call us directly at (617) 555-0123.",
            correlation_id: correlationId
          }, null, 2)
        }]
      };
    }
  }
);

registerToolWithDiagnostics(
  "get_job_status",
  {
    title: "Get Job Status",
    description: `Check the status of a customer's scheduled or past job. Returns current status, schedule information, and work details.

WHEN TO USE: When a customer asks "When is my appointment?", "What's the status of my job?", "Is my plumber on the way?", or wants to check on an existing booking.

REQUIRES VERIFICATION: Customer must be verified with first name, last name, and phone number before their job status can be retrieved.

JOB SELECTION:
- 'upcoming': Find the next scheduled appointment (default)
- 'most_recent': Find the most recently scheduled job

WORKFLOW:
1. Use 'lookup_customer' first if you haven't already verified the customer
2. Use this tool to check their job status
3. If they need to reschedule, use 'request_reschedule_callback'

RETURNS: Job ID, current status (scheduled, in-progress, completed, etc.), and schedule summary.`,
    inputSchema: {
      type: "object",
      properties: {
        first_name: { 
          type: "string", 
          description: "Customer's first name for verification (required). Example: 'John'" 
        },
        last_name: { 
          type: "string", 
          description: "Customer's last name for verification (required). Example: 'Smith'" 
        },
        phone: { 
          type: "string", 
          description: "Customer's phone number for verification (required). Example: '6175551234'" 
        },
        job_id: { 
          type: "string", 
          description: "Specific HousecallPro job ID to check (optional). If not provided, uses job_selection to find the job." 
        },
        job_selection: { 
          type: "string", 
          enum: ["most_recent", "upcoming"], 
          description: "Which job to retrieve when job_id is not provided. 'upcoming' = next scheduled appointment, 'most_recent' = last job (default: 'upcoming')" 
        }
      },
      required: ["first_name", "last_name", "phone"]
    },
    annotations: {
      title: "Check Job Status",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  } as any,
  async (raw) => {
    const correlationId = randomUUID();

    try {
      const input = JobStatusInput.parse(raw || {});
      log.info({ input: redactCustomerLookupInput(input), job_id: input.job_id, correlationId }, "get_job_status: start");

      const lookup = await lookupCustomerStrict(input, correlationId);
      if (!lookup.selected) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: "Unable to verify customer with the provided details.",
              correlation_id: correlationId
            }, null, 2)
          }]
        };
      }

      const customerId = lookup.selected.id;
      let jobId = input.job_id;
      let jobDetails: any = null;

      if (!jobId) {
        const jobsResponse = await hcpGet("/jobs", { customer_id: customerId, page_size: 25 }, correlationId) as any;
        const jobs = extractJobsResponse(jobsResponse);
        const selectedJob = selectJobByPreference(jobs, input.job_selection || "upcoming");
        jobId = selectedJob?.id;
      }

      if (!jobId) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: "No jobs were found for this customer.",
              correlation_id: correlationId
            }, null, 2)
          }]
        };
      }

      jobDetails = await hcpGet(`/jobs/${jobId}`, undefined, correlationId) as any;

      if (jobDetails?.customer_id && jobDetails.customer_id !== customerId) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: "The specified job does not belong to the verified customer.",
              correlation_id: correlationId
            }, null, 2)
          }]
        };
      }

      let appointment: any = null;
      try {
        const appointmentsResponse = await hcpGet(`/jobs/${jobId}/appointments`, undefined, correlationId) as any;
        const appointments = appointmentsResponse?.appointments || appointmentsResponse?.data || [];
        appointment = appointments
          .filter((appt: any) => appt?.start_time)
          .sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0];
      } catch (err: any) {
        log.warn({ error: err.message, correlationId }, "get_job_status: appointments lookup failed");
      }

      const scheduleSummary = formatJobScheduleSummary(jobDetails, appointment);
      const workStatus = jobDetails?.work_status || jobDetails?.status || "unknown";

      const result = {
        success: true,
        job_id: jobId,
        work_status: workStatus,
        current_schedule_summary: scheduleSummary,
        summary: `Your job is currently ${workStatus}. ${scheduleSummary}`,
        correlation_id: correlationId
      };

      log.info({ correlationId, job_id: jobId, customer_id: customerId }, "get_job_status: success");

      return {
        content: [
          { type: "text", text: JSON.stringify(result, null, 2) }
        ]
      };
    } catch (err: any) {
      log.error({ error: err.message, correlationId }, "get_job_status: error");

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: "Unable to retrieve job status at this time.",
            correlation_id: correlationId
          }, null, 2)
        }]
      };
    }
  }
);

// Create Lead Tool - create a lead in HCP for callback requests
const CreateLeadInput = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone: z.string().min(7),
  email: z.string().email().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  issue_description: z.string().min(1),
  preferred_callback_time: z.string().optional(),
  urgency: z.enum(["low", "medium", "high", "emergency"]).default("medium"),
  conversation_notes: z.string().optional(),
  lead_source: z.string().default("AI Assistant")
});

registerToolWithDiagnostics(
  "create_lead",
  {
    title: "Create Lead for Callback",
    description: `Create a callback request for customers who prefer to speak with the office before booking. The lead is saved in HousecallPro for office follow-up.

WHEN TO USE: When a customer:
- Wants to speak with someone before booking
- Has a complex issue that needs discussion
- Prefers a phone callback over online booking
- Is unsure about what service they need
- Wants to discuss pricing in more detail

NOT FOR: Customers ready to book - use 'book_service_call' instead.

INCLUDES: All conversation context and notes are attached to the lead so the office knows the full situation when calling back.

RESPONSE TIME: Office typically responds within 1-2 business hours. Emergency requests are prioritized.`,
    inputSchema: {
      type: "object",
      properties: {
        first_name: { 
          type: "string", 
          description: "Customer's first name (required). Example: 'John'" 
        },
        last_name: { 
          type: "string", 
          description: "Customer's last name (required). Example: 'Smith'" 
        },
        phone: { 
          type: "string", 
          description: "Customer's phone number for callback (required). Example: '6175551234'" 
        },
        email: { 
          type: "string", 
          description: "Customer's email address (optional). Used for follow-up communications." 
        },
        street: { 
          type: "string", 
          description: "Street address if known (optional). Example: '123 Main St'" 
        },
        city: { 
          type: "string", 
          description: "City if known (optional). Example: 'Quincy'" 
        },
        state: { 
          type: "string", 
          description: "State if known (optional). Example: 'MA'" 
        },
        zip: { 
          type: "string", 
          description: "ZIP code if known (optional). Example: '02169'" 
        },
        issue_description: { 
          type: "string", 
          description: "Description of the plumbing issue or question (required). Be as detailed as possible from the conversation." 
        },
        preferred_callback_time: { 
          type: "string", 
          description: "When the customer prefers to receive the callback (optional). Examples: 'morning', 'after 5pm', 'anytime tomorrow'" 
        },
        urgency: { 
          type: "string", 
          enum: ["low", "medium", "high", "emergency"], 
          description: "How urgent is this request? 'low' = no rush, 'medium' = within a day or two, 'high' = today, 'emergency' = ASAP (default: 'medium')" 
        },
        conversation_notes: { 
          type: "string", 
          description: "Summary of the AI conversation to include (optional). Helps office understand the context." 
        },
        lead_source: { 
          type: "string", 
          description: "How the customer found us (optional, defaults to 'AI Assistant')" 
        }
      },
      required: ["first_name", "last_name", "phone", "issue_description"]
    },
    annotations: {
      title: "Request Callback",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true
    }
  } as any,
  async (raw) => {
    const correlationId = randomUUID();

    try {
      const input = CreateLeadInput.parse(raw || {});
      log.info({ input: redactCustomerLookupInput(input), correlationId }, "create_lead: start");

      // Build the lead notes with all context
      const timestamp = new Date().toISOString();
      const noteParts = [
        `[AI Lead] Created via AI Assistant on ${timestamp}`,
        `\n\nISSUE: ${input.issue_description}`,
        input.preferred_callback_time ? `\nPREFERRED CALLBACK: ${input.preferred_callback_time}` : "",
        `\nURGENCY: ${input.urgency.toUpperCase()}`,
        input.conversation_notes ? `\n\nCONVERSATION NOTES:\n${input.conversation_notes}` : ""
      ].filter(Boolean).join("");

      // First, check if customer already exists
      const searchResult = await hcpGet("/customers", { q: input.phone, page_size: 5 }, correlationId) as any;
      const existingCustomer = (searchResult.customers || [])[0];

      let customerId: string;
      
      if (existingCustomer?.id) {
        customerId = existingCustomer.id;
        log.info({ correlationId, customer_id: customerId }, "create_lead: using existing customer");
      } else {
        // Create new customer
        const customerPayload: any = {
          first_name: input.first_name,
          last_name: input.last_name,
          mobile_number: input.phone,
          notifications_enabled: true,
          lead_source: input.lead_source,
          tags: ["AI Lead", `Urgency: ${input.urgency}`]
        };

        if (input.email) customerPayload.email = input.email;
        
        if (input.street && input.city && input.state && input.zip) {
          customerPayload.addresses = [{
            street: input.street,
            city: input.city,
            state: input.state,
            zip: input.zip,
            country: "USA"
          }];
        }

        const newCustomer = await hcpPost("/customers", customerPayload, correlationId) as any;
        customerId = newCustomer.id;
        log.info({ correlationId, customer_id: customerId }, "create_lead: created new customer");
      }

      // Create the lead in HousecallPro
      const leadPayload = {
        customer_id: customerId,
        source: input.lead_source,
        notes: noteParts,
        tags: ["AI Lead", `Urgency: ${input.urgency}`, "Callback Requested"]
      };

      let leadId: string | null = null;
      try {
        const lead = await hcpPost("/leads", leadPayload, correlationId) as any;
        leadId = lead?.id;
      } catch (err: any) {
        // Some HCP plans may not have leads API - fall back to adding a note
        log.warn({ correlationId, error: err.message }, "create_lead: leads API unavailable, adding customer note instead");
        
        // Add as a customer note instead
        try {
          await hcpPost(`/customers/${customerId}/notes`, { content: noteParts }, correlationId);
        } catch (noteErr: any) {
          log.warn({ correlationId, error: noteErr.message }, "create_lead: customer notes also unavailable");
        }
      }

      const result = {
        success: true,
        lead_id: leadId,
        customer_id: customerId,
        message: `Thank you, ${input.first_name}! We've received your request and our office will call you back ${input.preferred_callback_time || "as soon as possible"}.`,
        urgency: input.urgency,
        next_steps: input.urgency === "emergency" 
          ? "For emergencies, you can also reach us immediately at (617) 479-9911."
          : "Our team typically responds within 1-2 business hours.",
        correlation_id: correlationId
      };

      log.info({ correlationId, lead_id: leadId, customer_id: customerId }, "create_lead: success");

      return {
        content: [
          { type: "text", text: JSON.stringify(result, null, 2) }
        ]
      };

    } catch (err: any) {
      log.error({ error: err.message, correlationId }, "create_lead: error");

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: "Unable to create the lead. Please call us directly at (617) 479-9911.",
            correlation_id: correlationId
          }, null, 2)
        }]
      };
    }
  }
);

// Get Service History Tool
const GetServiceHistoryInput = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone: z.string().min(7),
  limit: z.number().int().min(1).max(20).default(5)
});

registerToolWithDiagnostics(
  "get_service_history",
  {
    title: "Get Service History",
    description: `Retrieve a customer's past service history. Shows previous jobs, dates, work performed, and service details.

WHEN TO USE: When a customer:
- Asks "Have you been to my house before?"
- Wants to see their past work history
- Needs information about a previous repair
- Is a returning customer and wants context on past services

REQUIRES VERIFICATION: Customer must provide first name, last name, and phone number to access their history.

RETURNS: List of past jobs with dates, descriptions, and status. Most recent jobs are shown first.`,
    inputSchema: {
      type: "object",
      properties: {
        first_name: { 
          type: "string", 
          description: "Customer's first name for verification (required). Example: 'John'" 
        },
        last_name: { 
          type: "string", 
          description: "Customer's last name for verification (required). Example: 'Smith'" 
        },
        phone: { 
          type: "string", 
          description: "Customer's phone number for verification (required). Example: '6175551234'" 
        },
        limit: { 
          type: "number", 
          description: "Maximum number of past jobs to return (optional). Default: 5, Maximum: 20" 
        }
      },
      required: ["first_name", "last_name", "phone"]
    },
    annotations: {
      title: "View Service History",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  } as any,
  async (raw) => {
    const correlationId = randomUUID();

    try {
      const input = GetServiceHistoryInput.parse(raw || {});
      log.info({ input: redactCustomerLookupInput(input), correlationId }, "get_service_history: start");

      const lookup = await lookupCustomerStrict(input, correlationId);
      if (!lookup.selected) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: "Unable to verify customer with the provided details.",
              correlation_id: correlationId
            }, null, 2)
          }]
        };
      }

      const customerId = lookup.selected.id;

      // Fetch jobs for this customer
      const jobsResponse = await hcpGet("/jobs", { 
        customer_id: customerId, 
        page_size: input.limit 
      }, correlationId) as any;

      const jobs = extractJobsResponse(jobsResponse);
      
      if (!jobs.length) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              customer_verified: true,
              service_history: [],
              message: "No previous service records found for this customer.",
              correlation_id: correlationId
            }, null, 2)
          }]
        };
      }

      // Format job history
      const serviceHistory = jobs.map((job: any) => {
        const scheduledStart = job?.schedule?.scheduled_start || job?.scheduled_start;
        const workStatus = job?.work_status || job?.status || "unknown";
        
        return {
          job_id: job.id,
          date: scheduledStart ? toYmd(scheduledStart) : "Unknown",
          status: workStatus,
          description: job.notes || job.description || "Service call",
          total: job.total_amount || job.invoice_total || null
        };
      });

      const result = {
        success: true,
        customer_verified: true,
        customer_name: `${lookup.selected.first_name} ${lookup.selected.last_name}`,
        total_jobs_shown: serviceHistory.length,
        service_history: serviceHistory,
        message: `Found ${serviceHistory.length} service record(s) for ${lookup.selected.first_name}.`,
        correlation_id: correlationId
      };

      log.info({ correlationId, customer_id: customerId, job_count: serviceHistory.length }, "get_service_history: success");

      return {
        content: [
          { type: "text", text: JSON.stringify(result, null, 2) }
        ]
      };

    } catch (err: any) {
      log.error({ error: err.message, correlationId }, "get_service_history: error");

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: "Unable to retrieve service history at this time.",
            correlation_id: correlationId
          }, null, 2)
        }]
      };
    }
  }
);

// Search FAQ Tool
const SearchFaqInput = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  return_all: z.boolean().default(false)
});

// Static FAQs (will be replaced with database lookup)
const STATIC_FAQS = [
  {
    id: "pricing-service-fee",
    question: "What is the service call fee?",
    answer: "Our service call fee is $99. This diagnostic fee is waived if you proceed with the repair work.",
    category: "pricing",
    keywords: ["fee", "cost", "price", "service call", "diagnostic"]
  },
  {
    id: "hours-operation",
    question: "What are your hours of operation?",
    answer: "We're available Monday-Friday 7am-6pm for regular service. Emergency plumbing service is available 24/7.",
    category: "hours",
    keywords: ["hours", "open", "available", "schedule", "when"]
  },
  {
    id: "service-area",
    question: "What areas do you service?",
    answer: "We serve the South Shore of Massachusetts including Norfolk, Suffolk, and Plymouth counties. This includes Quincy, Braintree, Weymouth, Abington, Rockland, and surrounding towns.",
    category: "service_area",
    keywords: ["area", "location", "service", "towns", "cities", "where"]
  },
  {
    id: "emergency-service",
    question: "Do you offer emergency plumbing service?",
    answer: "Yes! We offer 24/7 emergency plumbing service for burst pipes, major leaks, sewage backups, and no-water situations. Call (617) 479-9911 for emergencies.",
    category: "services",
    keywords: ["emergency", "urgent", "24/7", "after hours", "weekend"]
  },
  {
    id: "payment-methods",
    question: "What payment methods do you accept?",
    answer: "We accept cash, checks, and all major credit cards (Visa, Mastercard, American Express, Discover). Payment is due upon completion of service.",
    category: "policies",
    keywords: ["payment", "pay", "credit card", "cash", "check"]
  },
  {
    id: "family-discount",
    question: "What is The Family Discount program?",
    answer: "The Family Discount is our $99/year membership program. Members get priority scheduling, waived service call fees, 10% off all jobs, and 1 referral gift per year. It's our way of treating loyal customers like family.",
    category: "pricing",
    keywords: ["family discount", "membership", "member", "discount", "loyalty"]
  },
  {
    id: "licensed-insured",
    question: "Are you licensed and insured?",
    answer: "Yes, Johnson Bros. Plumbing is fully licensed and insured in Massachusetts. We carry comprehensive liability insurance and workers' compensation for your protection.",
    category: "policies",
    keywords: ["license", "insured", "insurance", "certified", "bonded"]
  },
  {
    id: "warranty",
    question: "Do you offer warranties on your work?",
    answer: "Yes, we stand behind our work. Parts and labor come with manufacturer warranties plus our satisfaction guarantee. Specific warranty terms vary by service type.",
    category: "policies",
    keywords: ["warranty", "guarantee", "guarantee", "covered"]
  }
];

registerToolWithDiagnostics(
  "search_faq",
  {
    title: "Search Business FAQs",
    description: `Search frequently asked questions about Johnson Bros. Plumbing. Returns answers to common questions about pricing, hours, service area, and policies.

WHEN TO USE: For general questions about the business that don't require customer verification:
- "What are your hours?"
- "Do you serve my area?"
- "How much is the service fee?"
- "Are you licensed?"
- "What payment methods do you accept?"
- "What is the Family Discount program?"

FAQ CATEGORIES:
- pricing: Service fees, estimates, payment, Family Discount
- hours: Hours of operation, availability
- service_area: Towns and areas we serve
- services: Types of services offered, emergency availability
- policies: Licensing, insurance, warranties

USE return_all=true to load all FAQs for context at the start of a conversation.`,
    inputSchema: {
      type: "object",
      properties: {
        query: { 
          type: "string", 
          description: "Search query or question to find relevant FAQs (optional). Example: 'service fee', 'hours', 'payment'" 
        },
        category: { 
          type: "string", 
          description: "Filter FAQs by category (optional). Options: 'pricing', 'hours', 'service_area', 'services', 'policies'" 
        },
        return_all: { 
          type: "boolean", 
          description: "Set to true to return all FAQs without filtering (optional). Useful for loading full context at conversation start." 
        }
      }
    },
    annotations: {
      title: "Search FAQs",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  } as any,
  async (raw) => {
    const correlationId = randomUUID();

    try {
      const input = SearchFaqInput.parse(raw || {});
      log.info({ input, correlationId }, "search_faq: start");

      let faqs = [...STATIC_FAQS];

      // Return all if requested
      if (input.return_all) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              total_faqs: faqs.length,
              faqs: faqs,
              categories: ["pricing", "hours", "service_area", "services", "policies"],
              correlation_id: correlationId
            }, null, 2)
          }]
        };
      }

      // Filter by category
      if (input.category) {
        const categoryFilter = input.category.toLowerCase();
        faqs = faqs.filter(faq => faq.category === categoryFilter);
      }

      // Search by query
      if (input.query) {
        const searchTerms = input.query.toLowerCase().split(/\s+/);
        faqs = faqs.filter(faq => {
          const searchableText = `${faq.question} ${faq.answer} ${faq.keywords.join(" ")}`.toLowerCase();
          return searchTerms.some(term => searchableText.includes(term));
        });

        // Sort by relevance (keyword matches)
        faqs.sort((a, b) => {
          const aMatches = searchTerms.filter(term => a.keywords.some(kw => kw.includes(term))).length;
          const bMatches = searchTerms.filter(term => b.keywords.some(kw => kw.includes(term))).length;
          return bMatches - aMatches;
        });
      }

      if (!faqs.length) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              matches: 0,
              message: "No FAQs found matching your query. Please call (617) 479-9911 for specific questions.",
              correlation_id: correlationId
            }, null, 2)
          }]
        };
      }

      const result = {
        success: true,
        matches: faqs.length,
        faqs: faqs.slice(0, 5).map(faq => ({
          question: faq.question,
          answer: faq.answer,
          category: faq.category
        })),
        correlation_id: correlationId
      };

      log.info({ correlationId, matches: faqs.length }, "search_faq: success");

      return {
        content: [
          { type: "text", text: JSON.stringify(result, null, 2) }
        ]
      };

    } catch (err: any) {
      log.error({ error: err.message, correlationId }, "search_faq: error");

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: "Unable to search FAQs.",
            correlation_id: correlationId
          }, null, 2)
        }]
      };
    }
  }
);

// Static promotions data - loaded from database in production
const STATIC_PROMOTIONS = [
  {
    id: 1,
    name: "The Family Discount",
    type: "bundle",
    code: "FAMILY99",
    description: "Annual membership program for $99/year. Members receive priority scheduling, waived service call fees on every visit, 10% discount on all repair work, and one referral gift per year.",
    short_description: "$99/year membership with priority service & 10% off all work",
    discount_type: "waived_fee",
    discount_value: 99,
    applicable_services: ["service_call", "drain_cleaning", "emergency_repair", "water_heater_service", "pipe_repair"],
    terms: "Membership valid for one year from purchase date. Service fee waiver applies to standard service calls only.",
    restrictions: "One membership per household. Must be renewed annually.",
    is_stackable: false,
    is_featured: true,
    benefits: [
      "Priority scheduling",
      "Waived $99 service call fee",
      "10% discount on all labor and parts",
      "One referral gift per year"
    ]
  },
  {
    id: 2,
    name: "Winter Freeze Prevention Special",
    type: "seasonal",
    code: "WINTER25",
    description: "Protect your pipes this winter! Get 15% off pipe insulation and freeze prevention services.",
    short_description: "15% off pipe insulation & freeze prevention",
    discount_type: "percentage",
    discount_value: 15,
    applicable_services: ["pipe_repair", "general_plumbing"],
    terms: "Valid for pipe insulation and freeze prevention services only.",
    restrictions: "Offer valid November through March.",
    is_stackable: false,
    is_featured: true,
    valid_period: "November - March"
  },
  {
    id: 3,
    name: "First-Time Customer Discount",
    type: "coupon",
    code: "WELCOME50",
    description: "New customers receive $50 off their first service call. Minimum $150 service required.",
    short_description: "$50 off your first service",
    discount_type: "fixed_amount",
    discount_value: 50,
    minimum_purchase: 150,
    applicable_services: ["service_call", "drain_cleaning", "emergency_repair", "water_heater_service", "pipe_repair"],
    terms: "Valid for first-time customers only. Minimum service of $150 required.",
    restrictions: "One use per household. Cannot be combined with other offers.",
    is_stackable: false,
    is_featured: true
  },
  {
    id: 4,
    name: "Water Heater Replacement Rebate",
    type: "rebate",
    code: null,
    description: "Replace your old water heater and receive a $100 rebate! Includes free old unit removal.",
    short_description: "$100 rebate on new water heater installation",
    discount_type: "fixed_amount",
    discount_value: 100,
    minimum_purchase: 800,
    applicable_services: ["water_heater_service"],
    terms: "Rebate applied after installation. Valid for tank or tankless water heater replacements.",
    restrictions: "Must be a full replacement, not repair.",
    is_stackable: true,
    is_featured: false
  },
  {
    id: 5,
    name: "Senior Citizen Discount",
    type: "deal",
    code: "SENIOR10",
    description: "Customers 65 and older receive 10% off all services.",
    short_description: "10% off for customers 65+",
    discount_type: "percentage",
    discount_value: 10,
    applicable_services: ["service_call", "drain_cleaning", "emergency_repair", "water_heater_service", "pipe_repair"],
    terms: "Valid for customers 65 years and older. Must provide valid ID.",
    restrictions: "Cannot be combined with The Family Discount.",
    is_stackable: false,
    is_featured: false
  },
  {
    id: 6,
    name: "Military & First Responder Discount",
    type: "deal",
    code: "HERO15",
    description: "Active military, veterans, police, firefighters, and EMTs receive 15% off all services.",
    short_description: "15% off for military & first responders",
    discount_type: "percentage",
    discount_value: 15,
    applicable_services: ["service_call", "drain_cleaning", "emergency_repair", "water_heater_service", "pipe_repair"],
    terms: "Valid for active military, veterans, police, firefighters, and EMTs. Valid ID required.",
    restrictions: "Cannot be combined with other percentage discounts.",
    is_stackable: false,
    is_featured: false
  },
  {
    id: 7,
    name: "Drain Cleaning Bundle",
    type: "bundle",
    code: "DRAIN2FOR1",
    description: "Book multiple drain cleanings - get the second drain cleaned at 50% off!",
    short_description: "50% off second drain cleaning",
    discount_type: "percentage",
    discount_value: 50,
    applicable_services: ["drain_cleaning"],
    terms: "Second drain must be cleaned during the same service visit.",
    restrictions: "Cannot be combined with other drain cleaning offers.",
    is_stackable: false,
    is_featured: false
  },
  {
    id: 8,
    name: "Referral Reward",
    type: "deal",
    code: "REFER50",
    description: "Refer a friend - they get $50 off, you get $50 credit toward your next service!",
    short_description: "Give $50, Get $50 referral program",
    discount_type: "fixed_amount",
    discount_value: 50,
    applicable_services: ["service_call", "drain_cleaning", "emergency_repair", "water_heater_service", "pipe_repair"],
    terms: "Referral must complete a paid service of $100 or more.",
    restrictions: "Referral must be a new customer. Unlimited referrals allowed.",
    is_stackable: true,
    is_featured: false
  }
];

const GetPromotionsInput = z.object({
  type: z.enum(["all", "coupon", "rebate", "seasonal", "sale", "deal", "bundle"]).optional().default("all"),
  service: z.string().optional(),
  featured_only: z.boolean().optional().default(false),
  code: z.string().optional()
});

registerToolWithDiagnostics(
  "get_promotions",
  {
    title: "Get Current Promotions & Deals",
    description: "Retrieve available promotions, coupons, rebates, seasonal specials, and deals from Johnson Bros. Plumbing. Returns machine-readable JSON with all promotion details including codes, discounts, terms, and restrictions.",
    inputSchema: {
      type: "object",
      properties: {
        type: { 
          type: "string", 
          enum: ["all", "coupon", "rebate", "seasonal", "sale", "deal", "bundle"],
          description: "Filter by promotion type. Use 'all' to get all promotions."
        },
        service: { 
          type: "string", 
          description: "Filter promotions applicable to a specific service (e.g., 'drain_cleaning', 'water_heater_service')"
        },
        featured_only: { 
          type: "boolean", 
          description: "If true, only return featured/highlighted promotions"
        },
        code: { 
          type: "string", 
          description: "Look up a specific promotion by promo code"
        }
      }
    }
  } as any,
  async (raw) => {
    const correlationId = randomUUID();

    try {
      const input = GetPromotionsInput.parse(raw || {});
      log.info({ input, correlationId }, "get_promotions: start");

      let promotions = [...STATIC_PROMOTIONS];

      // Filter by code if provided
      if (input.code) {
        const code = input.code.toUpperCase().trim();
        promotions = promotions.filter(p => p.code?.toUpperCase() === code);
        
        if (promotions.length === 0) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: true,
                found: false,
                message: `Promo code '${input.code}' not found or has expired. Contact (617) 479-9911 for current promotions.`,
                available_codes: STATIC_PROMOTIONS.filter(p => p.code).map(p => p.code),
                correlation_id: correlationId
              }, null, 2)
            }]
          };
        }
      }

      // Filter by type
      if (input.type && input.type !== "all") {
        promotions = promotions.filter(p => p.type === input.type);
      }

      // Filter by applicable service
      if (input.service) {
        const service = input.service.toLowerCase().trim();
        promotions = promotions.filter(p => 
          p.applicable_services.some(s => s.toLowerCase().includes(service) || service.includes(s.toLowerCase()))
        );
      }

      // Filter by featured
      if (input.featured_only) {
        promotions = promotions.filter(p => p.is_featured);
      }

      const result = {
        success: true,
        total_promotions: promotions.length,
        query: {
          type: input.type,
          service: input.service,
          featured_only: input.featured_only,
          code: input.code
        },
        promotions: promotions.map(p => ({
          id: p.id,
          name: p.name,
          type: p.type,
          code: p.code,
          description: p.description,
          short_description: p.short_description,
          discount: {
            type: p.discount_type,
            value: p.discount_value,
            minimum_purchase: (p as any).minimum_purchase || null
          },
          applicable_services: p.applicable_services,
          terms: p.terms,
          restrictions: p.restrictions,
          is_stackable: p.is_stackable,
          is_featured: p.is_featured,
          additional_info: {
            benefits: (p as any).benefits || null,
            valid_period: (p as any).valid_period || null
          }
        })),
        business_info: {
          phone: "(617) 479-9911",
          note: "Mention promotion when booking. Some restrictions apply."
        },
        correlation_id: correlationId
      };

      log.info({ correlationId, count: promotions.length }, "get_promotions: success");

      return {
        content: [
          { type: "text", text: JSON.stringify(result, null, 2) }
        ]
      };

    } catch (err: any) {
      log.error({ error: err.message, correlationId }, "get_promotions: error");

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: "Unable to retrieve promotions.",
            correlation_id: correlationId
          }, null, 2)
        }]
      };
    }
  }
);

// Request Review Tool (OFFLINE - documented for future use)
const RequestReviewInput = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone: z.string().min(7),
  job_id: z.string().optional()
});

registerToolWithDiagnostics(
  "request_review",
  {
    title: "Request Google Review [OFFLINE]",
    description: "[CURRENTLY OFFLINE] This tool will send a Google review request link to satisfied customers. Feature is documented for future activation.",
    inputSchema: {
      type: "object",
      properties: {
        first_name: { type: "string", description: "Customer's first name" },
        last_name: { type: "string", description: "Customer's last name" },
        phone: { type: "string", description: "Customer's phone number" },
        job_id: { type: "string", description: "Job ID to associate with review request" }
      },
      required: ["first_name", "last_name", "phone"]
    }
  } as any,
  async (raw) => {
    const correlationId = randomUUID();

    try {
      const input = RequestReviewInput.parse(raw || {});
      log.info({ input: redactCustomerLookupInput(input), correlationId }, "request_review: start (OFFLINE)");

      // This tool is intentionally offline
      const result = {
        success: false,
        status: "OFFLINE",
        message: "The review request feature is currently offline. This feature will be activated in a future update.",
        documentation: {
          purpose: "Sends a Google review request link via SMS to satisfied customers after service completion",
          trigger: "Can be called manually or automatically after job completion",
          expected_behavior: "When online, will verify customer, check job completion status, and send review link"
        },
        alternative: "In the meantime, you can ask satisfied customers to search 'Johnson Bros Plumbing' on Google and leave a review.",
        correlation_id: correlationId
      };

      log.info({ correlationId }, "request_review: returned offline status");

      return {
        content: [
          { type: "text", text: JSON.stringify(result, null, 2) }
        ]
      };

    } catch (err: any) {
      log.error({ error: err.message, correlationId }, "request_review: error");

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            status: "OFFLINE",
            error: "Review request feature is currently offline.",
            correlation_id: correlationId
          }, null, 2)
        }]
      };
    }
  }
);

export function getToolMetricsSnapshot() {
  const byTool: Record<string, {
    total_calls: number;
    success_rate: number;
    avg_latency_ms: number;
    failure_calls: number;
    last_error?: string;
    last_failure_at?: string;
  }> = {};

  let totalCalls = 0;
  let successCalls = 0;
  let totalLatencyMs = 0;

  for (const [toolName, metric] of toolMetrics.entries()) {
    totalCalls += metric.totalCalls;
    successCalls += metric.successCalls;
    totalLatencyMs += metric.totalLatencyMs;

    byTool[toolName] = {
      total_calls: metric.totalCalls,
      success_rate: metric.totalCalls > 0 ? (metric.successCalls / metric.totalCalls) * 100 : 0,
      avg_latency_ms: metric.totalCalls > 0 ? metric.totalLatencyMs / metric.totalCalls : 0,
      failure_calls: metric.failureCalls,
      last_error: metric.lastError,
      last_failure_at: metric.lastFailureAt
    };
  }

  const failureHotspots = Object.entries(byTool)
    .map(([toolName, data]) => ({
      tool: toolName,
      failure_rate: data.total_calls > 0 ? (data.failure_calls / data.total_calls) * 100 : 0,
      failure_calls: data.failure_calls,
      total_calls: data.total_calls
    }))
    .filter(entry => entry.failure_calls > 0)
    .sort((a, b) => b.failure_rate - a.failure_rate)
    .slice(0, 5);

  return {
    total_calls: totalCalls,
    success_rate: totalCalls > 0 ? (successCalls / totalCalls) * 100 : 0,
    avg_latency_ms: totalCalls > 0 ? totalLatencyMs / totalCalls : 0,
    by_tool: byTool,
    failure_hotspots: failureHotspots
  };
}

// Export the server for use in different transports
export { server };
