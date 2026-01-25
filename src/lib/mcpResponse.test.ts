/**
 * Tests for OpenAI-Compliant MCP Response Formatter
 *
 * These tests verify that all MCP tool responses follow OpenAI's three-part structure:
 * - structuredContent: Data for widget + model context
 * - content: Narrative text for model's response
 * - _meta: Private data for widget only
 */

import { describe, it, expect } from "vitest";
import {
  formatMCPResponse,
  formatMCPError,
  formatBookingConfirmation,
  formatAvailabilityResponse,
  formatQuoteResponse,
  formatEmergencyResponse,
  formatServicesResponse,
  formatLeadResponse,
  formatOutOfServiceAreaResponse,
  WIDGET_MAPPINGS,
} from "./mcpResponse";

describe("mcpResponse", () => {
  describe("WIDGET_MAPPINGS", () => {
    it("should have mappings for all core tools", () => {
      expect(WIDGET_MAPPINGS).toHaveProperty("book_service_call");
      expect(WIDGET_MAPPINGS).toHaveProperty("search_availability");
      expect(WIDGET_MAPPINGS).toHaveProperty("get_quote");
      expect(WIDGET_MAPPINGS).toHaveProperty("emergency_help");
      expect(WIDGET_MAPPINGS).toHaveProperty("get_services");
      expect(WIDGET_MAPPINGS).toHaveProperty("create_lead");
      expect(WIDGET_MAPPINGS).toHaveProperty("get_capacity");
    });

    it("should have widget names and accessible flags", () => {
      expect(WIDGET_MAPPINGS.book_service_call).toEqual({
        widget: "booking-confirmation",
        accessible: true,
      });
      expect(WIDGET_MAPPINGS.get_quote).toEqual({
        widget: "quote",
        accessible: true,
      });
    });
  });

  describe("formatMCPResponse", () => {
    it("should format response with OpenAI three-part structure", () => {
      const response = formatMCPResponse({
        toolName: "book_service_call",
        structuredContent: { job_id: "JB-123" },
        content: "Your appointment is confirmed.",
        correlationId: "corr-123",
        success: true,
      });

      expect(response.content).toHaveLength(1);
      expect(response.content[0].type).toBe("text");

      const payload = JSON.parse(response.content[0].text);
      expect(payload.structuredContent).toBeDefined();
      expect(payload.structuredContent.job_id).toBe("JB-123");
      expect(payload.structuredContent.success).toBe(true);
      expect(payload.structuredContent.correlation_id).toBe("corr-123");
      expect(payload.content).toBe("Your appointment is confirmed.");
    });

    it("should include widget metadata for mapped tools", () => {
      const response = formatMCPResponse({
        toolName: "book_service_call",
        structuredContent: { job_id: "JB-123" },
        content: "Confirmed.",
        correlationId: "corr-123",
      });

      expect(response._meta).toBeDefined();
      expect(response._meta["openai/outputTemplate"]).toBe(
        "ui://widget/v2/booking-confirmation.html"
      );
      expect(response._meta["openai/widgetAccessible"]).toBe(true);
    });

    it("should include _meta in payload when meta is provided", () => {
      const response = formatMCPResponse({
        toolName: "book_service_call",
        structuredContent: { job_id: "JB-123" },
        content: "Confirmed.",
        meta: { customer_id: "cust-456", phone: "617-555-1234" },
        correlationId: "corr-123",
      });

      const payload = JSON.parse(response.content[0].text);
      expect(payload._meta).toBeDefined();
      expect(payload._meta.customer_id).toBe("cust-456");
      expect(payload._meta.correlation_id).toBe("corr-123");
    });

    it("should not include _meta when no meta provided", () => {
      const response = formatMCPResponse({
        toolName: "book_service_call",
        structuredContent: { job_id: "JB-123" },
        content: "Confirmed.",
        correlationId: "corr-123",
      });

      const payload = JSON.parse(response.content[0].text);
      expect(payload._meta).toBeUndefined();
    });

    it("should handle unknown tool names without widget metadata", () => {
      const response = formatMCPResponse({
        toolName: "unknown_tool",
        structuredContent: { data: "test" },
        content: "Test response.",
        correlationId: "corr-123",
      });

      expect(response._meta).toBeUndefined();
    });
  });

  describe("formatMCPError", () => {
    it("should format error response with success: false", () => {
      const response = formatMCPError({
        toolName: "book_service_call",
        errorCode: "INVALID_ZIP",
        userMessage: "ZIP code is outside our service area.",
        correlationId: "corr-123",
      });

      const payload = JSON.parse(response.content[0].text);
      expect(payload.structuredContent.success).toBe(false);
      expect(payload.structuredContent.error_code).toBe("INVALID_ZIP");
      expect(payload.structuredContent.message).toBe(
        "ZIP code is outside our service area."
      );
      expect(payload.content).toBe("ZIP code is outside our service area.");
    });

    it("should include error details in _meta when provided", () => {
      const response = formatMCPError({
        toolName: "book_service_call",
        errorCode: "API_ERROR",
        userMessage: "Service unavailable.",
        correlationId: "corr-123",
        details: { status: 500, retryAfter: 60 },
      });

      const payload = JSON.parse(response.content[0].text);
      expect(payload._meta).toBeDefined();
      expect(payload._meta.error_details.status).toBe(500);
      expect(payload._meta.error_details.retryAfter).toBe(60);
    });

    it("should still include widget template for error states", () => {
      const response = formatMCPError({
        toolName: "book_service_call",
        errorCode: "ERROR",
        userMessage: "Failed.",
        correlationId: "corr-123",
      });

      expect(response._meta).toBeDefined();
      expect(response._meta["openai/outputTemplate"]).toBe(
        "ui://widget/v2/booking-confirmation.html"
      );
    });
  });

  describe("formatBookingConfirmation", () => {
    it("should format booking confirmation with all required fields", () => {
      const response = formatBookingConfirmation({
        jobId: "JB-100",
        scheduledStart: "2025-01-20T10:00:00-05:00",
        scheduledEnd: "2025-01-20T12:00:00-05:00",
        arrivalWindowMinutes: 120,
        customerId: "cust-123",
        customerName: "John Smith",
        address: "123 Main St, Quincy, MA 02169",
        serviceDescription: "Kitchen sink clog",
        phone: "617-555-1234",
        correlationId: "corr-123",
        matchedPreference: true,
      });

      const payload = JSON.parse(response.content[0].text);

      // Check structuredContent (small, for model)
      expect(payload.structuredContent.job_id).toBe("JB-100");
      expect(payload.structuredContent.arrival_window_minutes).toBe(120);
      expect(payload.structuredContent.matched_preference).toBe(true);
      expect(payload.structuredContent.success).toBe(true);

      // Check content (narrative for model)
      expect(payload.content).toContain("confirmed");
      expect(payload.content).toContain("JB-100");

      // Check _meta (private data for widget)
      expect(payload._meta.customer_id).toBe("cust-123");
      expect(payload._meta.customer_name).toBe("John Smith");
      expect(payload._meta.address).toBe("123 Main St, Quincy, MA 02169");
      expect(payload._meta.phone).toBe("617-555-1234");
    });

    it("should format date in human-readable format", () => {
      const response = formatBookingConfirmation({
        jobId: "JB-100",
        scheduledStart: "2025-01-20T10:00:00-05:00",
        scheduledEnd: "2025-01-20T12:00:00-05:00",
        arrivalWindowMinutes: 120,
        customerId: "cust-123",
        correlationId: "corr-123",
      });

      const payload = JSON.parse(response.content[0].text);
      // Should contain day of week and time
      expect(payload.structuredContent.scheduled_time).toMatch(/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/);
      expect(payload.structuredContent.scheduled_time).toMatch(/\d{1,2}:\d{2}/);
    });
  });

  describe("formatAvailabilityResponse", () => {
    it("should format availability with slots", () => {
      const response = formatAvailabilityResponse({
        availableSlots: [
          {
            date: "2025-01-20",
            start_time: "10:00",
            end_time: "12:00",
            formatted_time: "10:00 AM - 12:00 PM",
            slots_available: 2,
            capacity_state: "SAME_DAY_FEE_WAIVED",
          },
          {
            date: "2025-01-21",
            start_time: "14:00",
            end_time: "16:00",
            formatted_time: "2:00 PM - 4:00 PM",
            slots_available: 1,
          },
        ],
        serviceType: "drain_cleaning",
        date: "2025-01-20",
        timePreference: "morning",
        correlationId: "corr-123",
      });

      const payload = JSON.parse(response.content[0].text);

      // Check structuredContent
      expect(payload.structuredContent.total_slots).toBe(2);
      expect(payload.structuredContent.service_type).toBe("drain_cleaning");
      expect(payload.structuredContent.available_dates).toHaveLength(2);
      expect(payload.structuredContent.available_dates[0].slotsAvailable).toBe(2);
      expect(payload.structuredContent.available_dates[0].capacityState).toBe(
        "SAME_DAY_FEE_WAIVED"
      );

      // Check content
      expect(payload.content).toContain("2 available");
      expect(payload.content).toContain("drain_cleaning");

      // Check _meta
      expect(payload._meta.all_slots).toHaveLength(2);
      expect(payload._meta.time_preference).toBe("morning");
      expect(payload._meta.title).toBe("Select a Date");
    });

    it("should handle no available slots", () => {
      const response = formatAvailabilityResponse({
        availableSlots: [],
        serviceType: "emergency_plumbing",
        date: "2025-01-20",
        correlationId: "corr-123",
      });

      const payload = JSON.parse(response.content[0].text);

      expect(payload.structuredContent.total_slots).toBe(0);
      expect(payload.structuredContent.success).toBe(false);
      expect(payload.content).toContain("No available slots");
      expect(payload.content).toContain("(617) 479-9911");
    });

    it("should limit available_dates to 7 in structuredContent", () => {
      const slots = Array.from({ length: 10 }, (_, i) => ({
        date: `2025-01-${20 + i}`,
        start_time: "10:00",
        end_time: "12:00",
        formatted_time: "10:00 AM - 12:00 PM",
      }));

      const response = formatAvailabilityResponse({
        availableSlots: slots,
        serviceType: "drain_cleaning",
        date: "2025-01-20",
        correlationId: "corr-123",
      });

      const payload = JSON.parse(response.content[0].text);
      expect(payload.structuredContent.available_dates).toHaveLength(7);
      expect(payload._meta.all_slots).toHaveLength(10);
    });
  });

  describe("formatQuoteResponse", () => {
    it("should format quote with price range", () => {
      const response = formatQuoteResponse({
        serviceName: "Drain Cleaning",
        serviceId: "svc-drain",
        priceRange: { min: 150, max: 250 },
        estimatedDuration: "1-2 hours",
        urgencyMultiplier: 1.0,
        propertyMultiplier: 1.0,
        finalRange: { min: 150, max: 250 },
        diagnosticFee: 89,
        category: "drain",
        issueDescription: "Kitchen sink clog",
        correlationId: "corr-123",
      });

      const payload = JSON.parse(response.content[0].text);

      // Check structuredContent
      expect(payload.structuredContent.service_name).toBe("Drain Cleaning");
      expect(payload.structuredContent.price_min).toBe(150);
      expect(payload.structuredContent.price_max).toBe(250);
      expect(payload.structuredContent.currency).toBe("USD");
      expect(payload.structuredContent.estimated_duration).toBe("1-2 hours");

      // Check content
      expect(payload.content).toContain("$150 - $250");
      expect(payload.content).toContain("$89 diagnostic fee");

      // Check _meta
      expect(payload._meta.service_id).toBe("svc-drain");
      expect(payload._meta.diagnostic_fee).toBe(89);
      expect(payload._meta.cta.label).toBe("Book Now");
      expect(payload._meta.cta.action).toBe("BOOK_NOW");
    });
  });

  describe("formatEmergencyResponse", () => {
    it("should format emergency response with instructions", () => {
      const response = formatEmergencyResponse({
        emergencyType: "burst_pipe",
        title: "Burst Pipe Emergency",
        immediateSteps: [
          "Turn off main water valve",
          "Open faucets to drain",
          "Call us immediately",
        ],
        doNotDo: ["Do not use electrical", "Do not attempt repair"],
        urgency: "HIGH",
        callToAction: "Call now for immediate assistance!",
        correlationId: "corr-123",
      });

      const payload = JSON.parse(response.content[0].text);

      // Check structuredContent (minimal for model)
      expect(payload.structuredContent.emergency_type).toBe("burst_pipe");
      expect(payload.structuredContent.urgency).toBe("HIGH");
      expect(payload.structuredContent.immediate_steps_count).toBe(3);

      // Check content
      expect(payload.content).toContain("Burst Pipe Emergency");
      expect(payload.content).toContain("(617) 479-9911");

      // Check _meta (full instructions for widget)
      expect(payload._meta.instructions).toHaveLength(3);
      expect(payload._meta.warnings).toHaveLength(2);
      expect(payload._meta.contactPhone).toBe("(617) 479-9911");
      expect(payload._meta.cta.label).toBe("Call Now");
      expect(payload._meta.cta.action).toBe("CALL_EMERGENCY");
    });
  });

  describe("formatServicesResponse", () => {
    it("should format services list", () => {
      const services = [
        {
          id: "svc-1",
          name: "Drain Cleaning",
          description: "Clear clogged drains",
          priceRange: { min: 150, max: 300 },
          estimatedDuration: "1-2 hours",
          category: "drain",
        },
        {
          id: "svc-2",
          name: "Water Heater Repair",
          description: "Fix water heater issues",
          priceRange: { min: 200, max: 500 },
          estimatedDuration: "2-4 hours",
          category: "water_heater",
          isEmergency: false,
        },
      ];

      const response = formatServicesResponse({
        services,
        category: "all",
        correlationId: "corr-123",
      });

      const payload = JSON.parse(response.content[0].text);

      // Check structuredContent (limited to 5)
      expect(payload.structuredContent.services).toHaveLength(2);
      expect(payload.structuredContent.services[0].name).toBe("Drain Cleaning");
      expect(payload.structuredContent.services[0].price_range).toBe("$150-$300");
      expect(payload.structuredContent.total_count).toBe(2);

      // Check content
      expect(payload.content).toContain("2 plumbing services");

      // Check _meta (full service details)
      expect(payload._meta.services).toHaveLength(2);
      expect(payload._meta.phone).toBe("(617) 479-9911");
    });

    it("should limit structuredContent services to 5", () => {
      const services = Array.from({ length: 8 }, (_, i) => ({
        id: `svc-${i}`,
        name: `Service ${i}`,
        description: `Description ${i}`,
        priceRange: { min: 100, max: 200 },
        estimatedDuration: "1 hour",
        category: "general",
      }));

      const response = formatServicesResponse({
        services,
        correlationId: "corr-123",
      });

      const payload = JSON.parse(response.content[0].text);
      expect(payload.structuredContent.services).toHaveLength(5);
      expect(payload._meta.services).toHaveLength(8);
    });
  });

  describe("formatLeadResponse", () => {
    it("should format lead creation confirmation", () => {
      const response = formatLeadResponse({
        leadId: "lead-123",
        customerId: "cust-456",
        customerName: "Jane Doe",
        phone: "617-555-5678",
        issueDescription: "Water heater not heating",
        callbackRequested: true,
        correlationId: "corr-123",
      });

      const payload = JSON.parse(response.content[0].text);

      // Check structuredContent
      expect(payload.structuredContent.lead_created).toBe(true);
      expect(payload.structuredContent.callback_requested).toBe(true);
      expect(payload.structuredContent.customer_name).toBe("Jane Doe");

      // Check content
      expect(payload.content).toContain("Jane Doe");
      expect(payload.content).toContain("call you back shortly");
      expect(payload.content).toContain("(617) 479-9911");

      // Check _meta
      expect(payload._meta.lead_id).toBe("lead-123");
      expect(payload._meta.phone).toBe("617-555-5678");
      expect(payload._meta.title).toBe("Request Received");
    });
  });

  describe("formatOutOfServiceAreaResponse", () => {
    it("should format out of service area response", () => {
      const response = formatOutOfServiceAreaResponse({
        zipCode: "90210",
        leadCreated: true,
        correlationId: "corr-123",
      });

      const payload = JSON.parse(response.content[0].text);

      // Check structuredContent
      expect(payload.structuredContent.out_of_service_area).toBe(true);
      expect(payload.structuredContent.zip_provided).toBe("90210");
      expect(payload.structuredContent.lead_created).toBe(true);
      expect(payload.structuredContent.success).toBe(false);

      // Check content
      expect(payload.content).toContain("90210");
      expect(payload.content).toContain("outside our service area");
      expect(payload.content).toContain("Norfolk, Suffolk, and Plymouth Counties");

      // Check _meta
      expect(payload._meta.service_area_info.counties).toContain("Norfolk");
      expect(payload._meta.service_area_info.counties).toContain("Plymouth");
      expect(payload._meta.service_area_info.example_cities).toContain("Quincy");
      expect(payload._meta.phone).toBe("(617) 479-9911");
    });
  });
});
