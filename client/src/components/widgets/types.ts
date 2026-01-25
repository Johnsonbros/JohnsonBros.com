export type BookingConfirmationData = {
  customer_name?: string;
  scheduled_time?: string;
  address?: string;
  service_description?: string;
  job_id?: string;
  confirmation_number?: string;
};

export type AvailabilitySlot = {
  start_time: string;
  end_time?: string;
  available?: boolean;
  formatted_time?: string;
};

export type AvailabilityData = {
  available_slots?: AvailabilitySlot[];
  windows?: AvailabilitySlot[];
  service_type?: string;
  date?: string;
};

export type AvailabilityRequest = {
  date: string;
  serviceType: string;
  time_preference?: "any" | "morning" | "afternoon" | "evening";
  show_for_days?: number;
};

export type ServiceItem = {
  name?: string;
  title?: string;
  description?: string;
  priceRange?: { min?: number; max?: number };
  price_min?: number;
  price_max?: number;
  estimatedDuration?: string;
  duration?: string;
  isEmergency?: boolean;
  is_emergency?: boolean;
};

export type ServicesData = {
  services?: ServiceItem[];
  business?: { name?: string };
};

export type ServicesRequest = {
  category?: string;
  search?: string;
};

export type QuoteData = {
  service_type?: string;
  service?: string;
  price_range?: { min?: number; max?: number };
  estimate_min?: number;
  estimate_max?: number;
  estimated_duration?: string;
  duration?: string;
  urgency?: "routine" | "soon" | "urgent" | "emergency" | string;
};

export type QuoteRequest = {
  service_type: string;
  issue_description: string;
  property_type?: "residential" | "commercial";
  urgency?: "routine" | "soon" | "urgent" | "emergency";
};

export type EmergencyData = {
  title?: string;
  urgency?: string;
  immediateSteps?: string[];
  steps?: string[];
  doNotDo?: string[];
};

export type EmergencyRequest = {
  emergency_type: string;
  context?: string;
};
