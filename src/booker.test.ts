/**
 * Tests for MCP Booker Tool Logic
 *
 * Tests the core business logic functions used by MCP booking tools:
 * - Phone normalization and validation
 * - Service area validation
 * - Time window selection
 * - Input validation schemas
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";

// ============================================================================
// Phone Normalization Tests (extracted logic)
// ============================================================================

function normPhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (!digits) return "";
  const normalized = digits.length > 10 ? digits.slice(-10) : digits;
  return normalized.length === 10 ? normalized : "";
}

function isValidPhone(input: string): boolean {
  return normPhone(input).length === 10;
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

describe("Phone Utilities", () => {
  describe("normPhone", () => {
    it("should normalize a standard 10-digit phone number", () => {
      expect(normPhone("6175551234")).toBe("6175551234");
    });

    it("should strip non-digit characters", () => {
      expect(normPhone("(617) 555-1234")).toBe("6175551234");
      expect(normPhone("617.555.1234")).toBe("6175551234");
      expect(normPhone("617-555-1234")).toBe("6175551234");
    });

    it("should handle 11-digit numbers with country code", () => {
      expect(normPhone("16175551234")).toBe("6175551234");
      expect(normPhone("+1 617 555 1234")).toBe("6175551234");
    });

    it("should return empty string for invalid numbers", () => {
      expect(normPhone("")).toBe("");
      expect(normPhone("12345")).toBe(""); // Too short
      expect(normPhone("abc")).toBe("");
    });

    it("should handle numbers with extra digits (takes last 10)", () => {
      expect(normPhone("00016175551234")).toBe("6175551234");
    });
  });

  describe("isValidPhone", () => {
    it("should return true for valid 10-digit numbers", () => {
      expect(isValidPhone("6175551234")).toBe(true);
      expect(isValidPhone("(617) 555-1234")).toBe(true);
      expect(isValidPhone("+1-617-555-1234")).toBe(true);
    });

    it("should return false for invalid numbers", () => {
      expect(isValidPhone("")).toBe(false);
      expect(isValidPhone("12345")).toBe(false);
      expect(isValidPhone("not-a-number")).toBe(false);
    });
  });

  describe("phoneLast4", () => {
    it("should return last 4 digits", () => {
      expect(phoneLast4("6175551234")).toBe("1234");
      expect(phoneLast4("(617) 555-9999")).toBe("9999");
    });

    it("should return undefined for invalid input", () => {
      expect(phoneLast4(undefined)).toBeUndefined();
      expect(phoneLast4("")).toBeUndefined();
      expect(phoneLast4("abc")).toBeUndefined();
    });
  });

  describe("maskPhone", () => {
    it("should mask phone number showing only last 4", () => {
      expect(maskPhone("6175551234")).toBe("***-***-1234");
      expect(maskPhone("(617) 555-5678")).toBe("***-***-5678");
    });

    it("should return undefined for invalid input", () => {
      expect(maskPhone(undefined)).toBeUndefined();
      expect(maskPhone("")).toBeUndefined();
    });
  });
});

// ============================================================================
// Name Normalization Tests
// ============================================================================

function normName(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

describe("Name Normalization", () => {
  describe("normName", () => {
    it("should lowercase names", () => {
      expect(normName("John")).toBe("john");
      expect(normName("SMITH")).toBe("smith");
    });

    it("should handle accented characters", () => {
      expect(normName("José")).toBe("jose");
      expect(normName("Müller")).toBe("muller");
      expect(normName("François")).toBe("francois");
    });

    it("should remove special characters", () => {
      expect(normName("O'Brien")).toBe("obrien");
      expect(normName("Smith-Jones")).toBe("smithjones");
    });

    it("should normalize whitespace", () => {
      expect(normName("  John   Doe  ")).toBe("john doe");
      expect(normName("Mary  Jane")).toBe("mary jane");
    });

    it("should handle empty strings", () => {
      expect(normName("")).toBe("");
      expect(normName("   ")).toBe("");
    });
  });
});

// ============================================================================
// Service Area Validation Tests
// ============================================================================

// Mock service area ZIP codes (subset of actual config)
const SERVICE_AREA_ZIPS = new Set([
  // Norfolk County
  "02169", "02170", "02171", // Quincy
  "02184", "02185", // Braintree
  "02188", "02189", "02190", "02191", // Weymouth
  "02186", // Milton
  // Plymouth County
  "02351", // Abington
  "02370", // Rockland
  "02043", // Hingham
]);

function isInServiceArea(zipCode: string): boolean {
  const normalizedZip = zipCode.trim().substring(0, 5);
  return SERVICE_AREA_ZIPS.has(normalizedZip);
}

describe("Service Area Validation", () => {
  describe("isInServiceArea", () => {
    it("should return true for Quincy ZIP codes", () => {
      expect(isInServiceArea("02169")).toBe(true);
      expect(isInServiceArea("02170")).toBe(true);
      expect(isInServiceArea("02171")).toBe(true);
    });

    it("should return true for other service area towns", () => {
      expect(isInServiceArea("02184")).toBe(true); // Braintree
      expect(isInServiceArea("02351")).toBe(true); // Abington
      expect(isInServiceArea("02370")).toBe(true); // Rockland
      expect(isInServiceArea("02043")).toBe(true); // Hingham
    });

    it("should return false for out-of-area ZIP codes", () => {
      expect(isInServiceArea("90210")).toBe(false); // Beverly Hills
      expect(isInServiceArea("02134")).toBe(false); // Allston
      expect(isInServiceArea("10001")).toBe(false); // NYC
    });

    it("should handle ZIP+4 format", () => {
      expect(isInServiceArea("02169-1234")).toBe(true);
      expect(isInServiceArea("90210-5678")).toBe(false);
    });

    it("should handle whitespace", () => {
      expect(isInServiceArea(" 02169 ")).toBe(true);
      expect(isInServiceArea("  02169")).toBe(true);
    });
  });
});

// ============================================================================
// Time Window Selection Tests
// ============================================================================

const COMPANY_TZ = "America/New_York";

function chooseWindow(
  windows: Array<{ start_time: string; end_time: string; available: boolean }>,
  pref: "any" | "morning" | "afternoon" | "evening"
): {
  window: { start_time: string; end_time: string; available: boolean };
  matchedPreference: boolean;
} | undefined {
  const fmt = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hour12: false,
    timeZone: COMPANY_TZ,
  });

  function hourLocal(iso: string) {
    const d = new Date(iso);
    const parts = fmt.formatToParts(d);
    const hh = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
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

  const candidates = windows.filter((w) => w.available && inPref(w.start_time));
  if (candidates.length) {
    return { window: candidates[0], matchedPreference: true };
  }
  const fallback = windows.find((w) => w.available);
  return fallback ? { window: fallback, matchedPreference: false } : undefined;
}

describe("Time Window Selection", () => {
  // Create windows using explicit Eastern Time (ET) hours
  // In winter, ET is UTC-5, so 9am ET = 14:00 UTC
  const createWindowET = (hourET: number, available = true) => {
    // Convert ET hour to UTC (add 5 hours for EST)
    const hourUTC = hourET + 5;
    const start = `2025-01-20T${hourUTC.toString().padStart(2, "0")}:00:00.000Z`;
    const endHourUTC = hourET + 2 + 5;
    const end = `2025-01-20T${endHourUTC.toString().padStart(2, "0")}:00:00.000Z`;
    return { start_time: start, end_time: end, available };
  };

  // Alias for backward compatibility in tests
  const createWindow = createWindowET;

  describe("chooseWindow", () => {
    it("should select first available window for 'any' preference", () => {
      const windows = [
        createWindow(8),
        createWindow(10),
        createWindow(14),
      ];
      const result = chooseWindow(windows, "any");
      expect(result?.matchedPreference).toBe(true);
      expect(result?.window).toBe(windows[0]);
    });

    it("should select morning window when preference is morning", () => {
      const windows = [
        createWindow(14), // 2pm
        createWindow(9),  // 9am - should be selected
        createWindow(18), // 6pm
      ];
      const result = chooseWindow(windows, "morning");
      expect(result?.matchedPreference).toBe(true);
      expect(new Date(result?.window.start_time!).getUTCHours()).toBeLessThan(17); // Before noon UTC (which is morning ET)
    });

    it("should select afternoon window when preference is afternoon", () => {
      const windows = [
        createWindow(9),  // 9am
        createWindow(14), // 2pm - should be selected
        createWindow(18), // 6pm
      ];
      const result = chooseWindow(windows, "afternoon");
      expect(result?.matchedPreference).toBe(true);
    });

    it("should select evening window when preference is evening", () => {
      const windows = [
        createWindow(9),  // 9am
        createWindow(14), // 2pm
        createWindow(18), // 6pm - should be selected
      ];
      const result = chooseWindow(windows, "evening");
      expect(result?.matchedPreference).toBe(true);
    });

    it("should fall back to any available window if preference not available", () => {
      const windows = [
        createWindow(14), // Only afternoon available
      ];
      const result = chooseWindow(windows, "morning");
      expect(result?.matchedPreference).toBe(false);
      expect(result?.window).toBeDefined();
    });

    it("should skip unavailable windows", () => {
      const windows = [
        createWindow(9, false), // Not available
        createWindow(10, true), // Available - should be selected
      ];
      const result = chooseWindow(windows, "morning");
      expect(result?.window).toBe(windows[1]);
    });

    it("should return undefined if no windows available", () => {
      const windows = [
        createWindow(9, false),
        createWindow(14, false),
      ];
      const result = chooseWindow(windows, "any");
      expect(result).toBeUndefined();
    });

    it("should return undefined for empty windows array", () => {
      const result = chooseWindow([], "any");
      expect(result).toBeUndefined();
    });
  });
});

// ============================================================================
// Input Validation Schema Tests
// ============================================================================

const BookInput = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone: z.string().min(7),
  phone_verification_code: z.string().length(6).optional(),
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
  earliest_date: z.string().optional(),
  latest_date: z.string().optional(),
  show_for_days: z.number().int().min(1).max(30).default(7),
  tags: z.array(z.string()).default(["AI booking"]),
});

describe("Input Validation Schemas", () => {
  describe("BookInput", () => {
    it("should validate valid booking input", () => {
      const valid = {
        first_name: "John",
        last_name: "Smith",
        phone: "6175551234",
        street: "123 Main St",
        city: "Quincy",
        state: "MA",
        zip: "02169",
        description: "Kitchen sink clog",
      };
      const result = BookInput.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should apply default values", () => {
      const minimal = {
        first_name: "John",
        last_name: "Smith",
        phone: "6175551234",
        street: "123 Main St",
        city: "Quincy",
        state: "MA",
        zip: "02169",
        description: "Kitchen sink clog",
      };
      const result = BookInput.parse(minimal);
      expect(result.country).toBe("USA");
      expect(result.lead_source).toBe("AI Assistant");
      expect(result.time_preference).toBe("any");
      expect(result.show_for_days).toBe(7);
      expect(result.tags).toEqual(["AI booking"]);
    });

    it("should reject missing required fields", () => {
      const invalid = {
        first_name: "John",
        // missing last_name, phone, etc.
      };
      const result = BookInput.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject empty first_name", () => {
      const invalid = {
        first_name: "",
        last_name: "Smith",
        phone: "6175551234",
        street: "123 Main St",
        city: "Quincy",
        state: "MA",
        zip: "02169",
        description: "Test",
      };
      const result = BookInput.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should validate email format when provided", () => {
      const invalidEmail = {
        first_name: "John",
        last_name: "Smith",
        phone: "6175551234",
        email: "not-an-email",
        street: "123 Main St",
        city: "Quincy",
        state: "MA",
        zip: "02169",
        description: "Test",
      };
      const result = BookInput.safeParse(invalidEmail);
      expect(result.success).toBe(false);

      const validEmail = { ...invalidEmail, email: "john@example.com" };
      const result2 = BookInput.safeParse(validEmail);
      expect(result2.success).toBe(true);
    });

    it("should validate time_preference enum", () => {
      const valid = {
        first_name: "John",
        last_name: "Smith",
        phone: "6175551234",
        street: "123 Main St",
        city: "Quincy",
        state: "MA",
        zip: "02169",
        description: "Test",
        time_preference: "morning",
      };
      const result = BookInput.safeParse(valid);
      expect(result.success).toBe(true);

      const invalid = { ...valid, time_preference: "midnight" };
      const result2 = BookInput.safeParse(invalid);
      expect(result2.success).toBe(false);
    });

    it("should validate show_for_days range", () => {
      const base = {
        first_name: "John",
        last_name: "Smith",
        phone: "6175551234",
        street: "123 Main St",
        city: "Quincy",
        state: "MA",
        zip: "02169",
        description: "Test",
      };

      // Valid range
      expect(BookInput.safeParse({ ...base, show_for_days: 1 }).success).toBe(true);
      expect(BookInput.safeParse({ ...base, show_for_days: 30 }).success).toBe(true);

      // Invalid range
      expect(BookInput.safeParse({ ...base, show_for_days: 0 }).success).toBe(false);
      expect(BookInput.safeParse({ ...base, show_for_days: 31 }).success).toBe(false);
    });

    it("should validate phone_verification_code length", () => {
      const base = {
        first_name: "John",
        last_name: "Smith",
        phone: "6175551234",
        street: "123 Main St",
        city: "Quincy",
        state: "MA",
        zip: "02169",
        description: "Test",
      };

      // Valid 6-digit code
      expect(BookInput.safeParse({ ...base, phone_verification_code: "123456" }).success).toBe(true);

      // Invalid lengths
      expect(BookInput.safeParse({ ...base, phone_verification_code: "12345" }).success).toBe(false);
      expect(BookInput.safeParse({ ...base, phone_verification_code: "1234567" }).success).toBe(false);
    });
  });

  describe("SearchAvailabilityInput", () => {
    const SearchAvailabilityInput = z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
      serviceType: z.string().min(1),
      time_preference: z.enum(["any", "morning", "afternoon", "evening"]).default("any"),
      show_for_days: z.number().int().min(1).max(30).default(7),
    });

    it("should validate valid search input", () => {
      const valid = {
        date: "2025-01-20",
        serviceType: "drain_cleaning",
      };
      const result = SearchAvailabilityInput.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject invalid date format", () => {
      const invalid = {
        date: "01/20/2025",
        serviceType: "drain_cleaning",
      };
      const result = SearchAvailabilityInput.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject empty serviceType", () => {
      const invalid = {
        date: "2025-01-20",
        serviceType: "",
      };
      const result = SearchAvailabilityInput.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("GetCapacityInput", () => {
    const GetCapacityInput = z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
      zip: z.string().optional(),
      service_area: z.string().optional(),
    });

    it("should accept optional fields", () => {
      expect(GetCapacityInput.safeParse({}).success).toBe(true);
      expect(GetCapacityInput.safeParse({ date: "2025-01-20" }).success).toBe(true);
      expect(GetCapacityInput.safeParse({ zip: "02169" }).success).toBe(true);
    });

    it("should validate date format when provided", () => {
      expect(GetCapacityInput.safeParse({ date: "2025-01-20" }).success).toBe(true);
      expect(GetCapacityInput.safeParse({ date: "invalid" }).success).toBe(false);
    });
  });
});

// ============================================================================
// Address Formatting Tests
// ============================================================================

function buildFullAddress(address: any) {
  if (!address) return undefined;
  return [address.street, address.street_line_2, address.city, address.state, address.zip]
    .filter(Boolean)
    .join(", ");
}

describe("Address Utilities", () => {
  describe("buildFullAddress", () => {
    it("should build full address from all parts", () => {
      const address = {
        street: "123 Main St",
        street_line_2: "Apt 2B",
        city: "Quincy",
        state: "MA",
        zip: "02169",
      };
      expect(buildFullAddress(address)).toBe("123 Main St, Apt 2B, Quincy, MA, 02169");
    });

    it("should skip missing parts", () => {
      const address = {
        street: "123 Main St",
        city: "Quincy",
        state: "MA",
        zip: "02169",
      };
      expect(buildFullAddress(address)).toBe("123 Main St, Quincy, MA, 02169");
    });

    it("should return undefined for null/undefined", () => {
      expect(buildFullAddress(null)).toBeUndefined();
      expect(buildFullAddress(undefined)).toBeUndefined();
    });
  });
});

// ============================================================================
// Job Status Tests
// ============================================================================

function getWorkStatus(job: any): string {
  const rawStatus = job?.work_status || job?.status || "unknown";
  return String(rawStatus).toLowerCase();
}

function isFinalizedStatus(status: string): boolean {
  return ["completed", "cancelled", "canceled", "closed"].includes(status);
}

describe("Job Status Utilities", () => {
  describe("getWorkStatus", () => {
    it("should return work_status if present", () => {
      expect(getWorkStatus({ work_status: "In Progress" })).toBe("in progress");
    });

    it("should fall back to status field", () => {
      expect(getWorkStatus({ status: "Completed" })).toBe("completed");
    });

    it("should return 'unknown' for missing status", () => {
      expect(getWorkStatus({})).toBe("unknown");
      expect(getWorkStatus(null)).toBe("unknown");
    });
  });

  describe("isFinalizedStatus", () => {
    it("should return true for finalized statuses", () => {
      expect(isFinalizedStatus("completed")).toBe(true);
      expect(isFinalizedStatus("cancelled")).toBe(true);
      expect(isFinalizedStatus("canceled")).toBe(true); // American spelling
      expect(isFinalizedStatus("closed")).toBe(true);
    });

    it("should return false for in-progress statuses", () => {
      expect(isFinalizedStatus("scheduled")).toBe(false);
      expect(isFinalizedStatus("in progress")).toBe(false);
      expect(isFinalizedStatus("pending")).toBe(false);
    });
  });
});

// ============================================================================
// Date Parsing Tests
// ============================================================================

function parseDate(value?: string) {
  if (!value) return undefined;
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? undefined : parsed;
}

describe("Date Utilities", () => {
  describe("parseDate", () => {
    it("should parse valid ISO date strings", () => {
      const result = parseDate("2025-01-20T10:00:00-05:00");
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2025);
    });

    it("should parse simple date strings", () => {
      const result = parseDate("2025-01-20");
      expect(result).toBeInstanceOf(Date);
    });

    it("should return undefined for invalid dates", () => {
      expect(parseDate("not-a-date")).toBeUndefined();
      expect(parseDate("invalid")).toBeUndefined();
    });

    it("should return undefined for empty/null input", () => {
      expect(parseDate(undefined)).toBeUndefined();
      expect(parseDate("")).toBeUndefined();
    });
  });
});
