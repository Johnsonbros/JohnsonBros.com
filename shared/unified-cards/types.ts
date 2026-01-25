export type CardSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface CardAction {
  label: string;
  action: string;
  payload?: Record<string, unknown>;
}

export interface LeadCapturePrefill {
  name?: string;
  phone?: string;
  issueDescription?: string;
}

export interface LeadCaptureCardPayload {
  id?: string;
  title: string;
  message?: string;
  prefill?: LeadCapturePrefill;
}

export interface LeadCaptureSubmission {
  name: string;
  phone: string;
  issueDescription: string;
}

export interface DatePickerAvailability {
  date: string;
  label?: string;
  slotsAvailable?: number;
  capacityState?: 'SAME_DAY_FEE_WAIVED' | 'LIMITED_SAME_DAY' | 'NEXT_DAY' | 'AVAILABLE';
}

export interface DatePickerCardPayload {
  id?: string;
  title: string;
  message?: string;
  availableDates?: DatePickerAvailability[];
  selectedDate?: string;
}

export interface TimeSlot {
  id: string;
  label: string;
  timeWindow: 'MORNING' | 'MIDDAY' | 'AFTERNOON' | 'EVENING';
  startTime?: string;
  endTime?: string;
  available: boolean;
  technicianCount?: number;
}

export interface TimePickerCardPayload {
  id?: string;
  title: string;
  message?: string;
  selectedDate?: string;
  slots?: TimeSlot[];
  selectedSlot?: string;
}

export interface AppointmentBookingDetails {
  jobId?: string;
  externalId?: string;
  customerName: string;
  phone: string;
  address: string;
  serviceType: string;
  scheduledDate: string;
  scheduledTime: string;
  estimatedArrival?: string;
  confirmationNumber?: string;
}

export interface AppointmentConfirmationCardPayload {
  id?: string;
  title: string;
  message?: string;
  booking: AppointmentBookingDetails;
  cta?: CardAction;
}

export interface QuoteRange {
  min: number;
  max: number;
  currency?: string;
}

export interface QuoteCardPayload {
  id?: string;
  title: string;
  summary: string;
  range: QuoteRange;
  disclaimer?: string;
  cta?: CardAction;
}

export interface EmergencyInstructionsCardPayload {
  id?: string;
  title: string;
  message?: string;
  severity?: CardSeverity;
  instructions: string[];
  contactLabel?: string;
  contactPhone?: string;
  cta?: CardAction;
}
