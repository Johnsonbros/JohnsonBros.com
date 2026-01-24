/**
 * OpenAI-Compliant MCP Response Formatter
 *
 * Formats tool responses according to OpenAI's three-part structure:
 * - structuredContent: Data for widget + model context (keep small)
 * - content: Narrative text for model's response
 * - _meta: Private/large data for widget only (never reaches model)
 *
 * @see https://developers.openai.com/apps-sdk/build/mcp-server/
 */

export interface WidgetMapping {
  widget: string;
  accessible?: boolean;
}

// Map tool names to their widget templates
export const WIDGET_MAPPINGS: Record<string, WidgetMapping> = {
  book_service_call: { widget: "booking-confirmation", accessible: true },
  search_availability: { widget: "availability", accessible: true },
  get_quote: { widget: "quote", accessible: true },
  emergency_help: { widget: "emergency", accessible: true },
  get_services: { widget: "services", accessible: true },
  create_lead: { widget: "lead-capture", accessible: true },
  get_capacity: { widget: "date-picker", accessible: true },
};

export interface MCPResponseInput {
  /** Tool name for widget mapping */
  toolName: string;

  /** Data visible to both model and widget - keep concise */
  structuredContent: Record<string, any>;

  /** Narrative message for the model's response */
  content: string;

  /** Private data for widget only - never reaches model */
  meta?: Record<string, any>;

  /** Correlation ID for tracing */
  correlationId: string;

  /** Whether the operation succeeded */
  success?: boolean;
}

export interface MCPErrorInput {
  /** Tool name */
  toolName: string;

  /** Error code */
  errorCode: string;

  /** User-friendly error message */
  userMessage: string;

  /** Correlation ID */
  correlationId: string;

  /** Additional error details */
  details?: Record<string, any>;
}

/**
 * Format a successful tool response with OpenAI's three-part structure
 */
export function formatMCPResponse(input: MCPResponseInput) {
  const { toolName, structuredContent, content, meta, correlationId, success = true } = input;
  const widgetMapping = WIDGET_MAPPINGS[toolName];

  // Build the response payload
  const payload = {
    structuredContent: {
      ...structuredContent,
      success,
      correlation_id: correlationId,
    },
    content,
    _meta: meta ? {
      ...meta,
      correlation_id: correlationId,
    } : undefined,
  };

  // Build the MCP response with widget metadata
  const response: any = {
    content: [{
      type: "text",
      text: JSON.stringify(payload, null, 2),
    }],
  };

  // Add widget template reference if available
  if (widgetMapping) {
    response._meta = {
      "openai/outputTemplate": `ui://widget/v2/${widgetMapping.widget}.html`,
      "openai/widgetAccessible": widgetMapping.accessible ?? true,
    };
  }

  return response;
}

/**
 * Format an error response with OpenAI's structure
 */
export function formatMCPError(input: MCPErrorInput) {
  const { toolName, errorCode, userMessage, correlationId, details } = input;
  const widgetMapping = WIDGET_MAPPINGS[toolName];

  const payload = {
    structuredContent: {
      success: false,
      error_code: errorCode,
      message: userMessage,
      correlation_id: correlationId,
    },
    content: userMessage,
    _meta: details ? {
      error_details: details,
      correlation_id: correlationId,
    } : undefined,
  };

  const response: any = {
    content: [{
      type: "text",
      text: JSON.stringify(payload, null, 2),
    }],
  };

  // Still include widget template for error states
  if (widgetMapping) {
    response._meta = {
      "openai/outputTemplate": `ui://widget/v2/${widgetMapping.widget}.html`,
      "openai/widgetAccessible": widgetMapping.accessible ?? true,
    };
  }

  return response;
}

/**
 * Helper to format booking confirmation response
 */
export function formatBookingConfirmation(data: {
  jobId: string;
  scheduledStart: string;
  scheduledEnd: string;
  arrivalWindowMinutes: number;
  customerId: string;
  customerName?: string;
  address?: string;
  serviceDescription?: string;
  phone?: string;
  correlationId: string;
  matchedPreference?: boolean;
}) {
  const scheduledTime = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/New_York",
  }).format(new Date(data.scheduledStart));

  return formatMCPResponse({
    toolName: "book_service_call",
    structuredContent: {
      job_id: data.jobId,
      scheduled_time: scheduledTime,
      arrival_window_minutes: data.arrivalWindowMinutes,
      matched_preference: data.matchedPreference,
    },
    content: `Great news! Your plumbing appointment is confirmed for ${scheduledTime}. Your confirmation number is ${data.jobId}. A licensed Johnson Bros. technician will arrive within the ${data.arrivalWindowMinutes}-minute arrival window.`,
    meta: {
      customer_id: data.customerId,
      customer_name: data.customerName,
      address: data.address,
      service_description: data.serviceDescription,
      phone: data.phone,
      scheduled_start: data.scheduledStart,
      scheduled_end: data.scheduledEnd,
    },
    correlationId: data.correlationId,
    success: true,
  });
}

/**
 * Helper to format availability search response
 */
export function formatAvailabilityResponse(data: {
  availableSlots: Array<{
    date: string;
    start_time: string;
    end_time: string;
    formatted_time: string;
    slots_available?: number;
    capacity_state?: string;
  }>;
  serviceType: string;
  date: string;
  timePreference?: string;
  correlationId: string;
}) {
  const slotCount = data.availableSlots.length;

  // Transform to widget-expected format
  const availableDates = data.availableSlots.map(slot => ({
    date: slot.date || data.date,
    slotsAvailable: slot.slots_available || 1,
    capacityState: slot.capacity_state || "SAME_DAY_FEE_WAIVED",
  }));

  return formatMCPResponse({
    toolName: "search_availability",
    structuredContent: {
      available_dates: availableDates.slice(0, 7), // Keep model context small
      total_slots: slotCount,
      service_type: data.serviceType,
      date: data.date,
    },
    content: slotCount > 0
      ? `Found ${slotCount} available appointment slots for ${data.serviceType} starting ${data.date}. The customer can select their preferred time.`
      : `No available slots for ${data.date}. Please try a different date or contact us at (617) 479-9911.`,
    meta: {
      all_slots: data.availableSlots, // Full slot details for widget
      time_preference: data.timePreference,
      title: "Select a Date",
      message: "Choose your preferred appointment date",
    },
    correlationId: data.correlationId,
    success: slotCount > 0,
  });
}

/**
 * Helper to format quote response
 */
export function formatQuoteResponse(data: {
  serviceName: string;
  serviceId: string;
  priceRange: { min: number; max: number };
  estimatedDuration: string;
  urgencyMultiplier: number;
  propertyMultiplier: number;
  finalRange: { min: number; max: number };
  diagnosticFee: number;
  category: string;
  issueDescription: string;
  correlationId: string;
}) {
  return formatMCPResponse({
    toolName: "get_quote",
    structuredContent: {
      service_name: data.serviceName,
      price_min: data.finalRange.min,
      price_max: data.finalRange.max,
      currency: "USD",
      estimated_duration: data.estimatedDuration,
    },
    content: `For ${data.serviceName}, the estimated cost is $${data.finalRange.min} - $${data.finalRange.max}. This typically takes ${data.estimatedDuration}. A $${data.diagnosticFee} diagnostic fee applies and is waived if you proceed with the repair.`,
    meta: {
      title: "Service Estimate",
      summary: `Estimated cost for ${data.serviceName}`,
      range: {
        min: data.finalRange.min,
        max: data.finalRange.max,
        currency: "USD",
      },
      service_id: data.serviceId,
      base_range: data.priceRange,
      urgency_multiplier: data.urgencyMultiplier,
      property_multiplier: data.propertyMultiplier,
      diagnostic_fee: data.diagnosticFee,
      category: data.category,
      issue_description: data.issueDescription,
      cta: {
        label: "Book Now",
        action: "BOOK_NOW",
      },
    },
    correlationId: data.correlationId,
    success: true,
  });
}

/**
 * Helper to format emergency response
 */
export function formatEmergencyResponse(data: {
  emergencyType: string;
  title: string;
  immediateSteps: string[];
  doNotDo: string[];
  urgency: string;
  callToAction: string;
  correlationId: string;
}) {
  return formatMCPResponse({
    toolName: "emergency_help",
    structuredContent: {
      emergency_type: data.emergencyType,
      urgency: data.urgency,
      immediate_steps_count: data.immediateSteps.length,
    },
    content: `${data.title}: ${data.callToAction} For immediate help, call (617) 479-9911.`,
    meta: {
      title: data.title,
      message: data.callToAction,
      severity: data.urgency,
      instructions: data.immediateSteps,
      warnings: data.doNotDo,
      contactLabel: "Emergency Plumbing Line",
      contactPhone: "(617) 479-9911",
      cta: {
        label: "Call Now",
        action: "CALL_EMERGENCY",
      },
    },
    correlationId: data.correlationId,
    success: true,
  });
}

/**
 * Helper to format services list response
 */
export function formatServicesResponse(data: {
  services: Array<{
    id: string;
    name: string;
    description: string;
    priceRange: { min: number; max: number };
    estimatedDuration: string;
    category: string;
    isEmergency?: boolean;
  }>;
  category?: string;
  correlationId: string;
}) {
  const servicesSummary = data.services.map(s => ({
    id: s.id,
    name: s.name,
    price_range: `$${s.priceRange.min}-$${s.priceRange.max}`,
    category: s.category,
  }));

  return formatMCPResponse({
    toolName: "get_services",
    structuredContent: {
      services: servicesSummary.slice(0, 5), // Keep model context small
      total_count: data.services.length,
      category: data.category || "all",
    },
    content: `Johnson Bros. offers ${data.services.length} plumbing services${data.category ? ` in the ${data.category} category` : ""}. Services range from basic repairs to emergency plumbing.`,
    meta: {
      title: "Our Services",
      message: "Johnson Bros. Plumbing & Drain Cleaning",
      services: data.services, // Full service details for widget
      phone: "(617) 479-9911",
    },
    correlationId: data.correlationId,
    success: true,
  });
}

/**
 * Helper to format lead creation response
 */
export function formatLeadResponse(data: {
  leadId?: string;
  customerId?: string;
  customerName: string;
  phone: string;
  issueDescription: string;
  callbackRequested: boolean;
  correlationId: string;
}) {
  return formatMCPResponse({
    toolName: "create_lead",
    structuredContent: {
      lead_created: true,
      callback_requested: data.callbackRequested,
      customer_name: data.customerName,
    },
    content: `Thank you, ${data.customerName}! We've received your request and our team will call you back shortly at the number provided. For immediate assistance, call (617) 479-9911.`,
    meta: {
      lead_id: data.leadId,
      customer_id: data.customerId,
      phone: data.phone,
      issue_description: data.issueDescription,
      title: "Request Received",
      message: "We'll call you back shortly",
    },
    correlationId: data.correlationId,
    success: true,
  });
}

/**
 * Helper to format out-of-service-area response
 */
export function formatOutOfServiceAreaResponse(data: {
  zipCode: string;
  leadCreated: boolean;
  correlationId: string;
}) {
  return formatMCPResponse({
    toolName: "book_service_call",
    structuredContent: {
      out_of_service_area: true,
      zip_provided: data.zipCode,
      lead_created: data.leadCreated,
    },
    content: `We're sorry, but ZIP code ${data.zipCode} is outside our service area. Johnson Bros. serves Norfolk, Suffolk, and Plymouth Counties in Massachusetts. We've noted your request and our office will contact you to discuss options.`,
    meta: {
      service_area_info: {
        counties: ["Norfolk", "Suffolk", "Plymouth"],
        state: "Massachusetts",
        example_cities: ["Quincy", "Braintree", "Weymouth", "Abington", "Rockland", "Plymouth", "Hingham"],
      },
      phone: "(617) 479-9911",
      next_steps: "Our office will contact you to discuss options.",
    },
    correlationId: data.correlationId,
    success: false,
  });
}
