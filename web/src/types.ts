export type CardSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface CardAction {
  label: string;
  action: string;
  payload?: Record<string, unknown>;
}

export interface DatePickerAvailability {
  date: string;
  label?: string;
  slotsAvailable?: number;
  capacityState?: 'SAME_DAY_FEE_WAIVED' | 'LIMITED_SAME_DAY' | 'NEXT_DAY' | 'AVAILABLE';
}

export interface DatePickerToolOutput {
  type: 'date_picker';
  title: string;
  message?: string;
  availableDates?: DatePickerAvailability[];
  selectedDate?: string;
  serviceType?: string;
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

export interface TimePickerToolOutput {
  type: 'time_picker';
  title: string;
  message?: string;
  selectedDate: string;
  slots?: TimeSlot[];
  selectedSlot?: string;
}

export interface BookingDetails {
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

export interface BookingConfirmationToolOutput {
  type: 'booking_confirmation';
  title: string;
  message?: string;
  booking: BookingDetails;
  cta?: CardAction;
}

export interface LeadCaptureToolOutput {
  type: 'lead_capture';
  title: string;
  message?: string;
  prefill?: {
    name?: string;
    phone?: string;
    issueDescription?: string;
  };
}

export interface EmergencyHelpToolOutput {
  type: 'emergency_help';
  title: string;
  message?: string;
  severity?: CardSeverity;
  instructions: string[];
  contactLabel?: string;
  contactPhone?: string;
  cta?: CardAction;
}

export interface QuoteToolOutput {
  type: 'quote';
  title: string;
  summary: string;
  range: {
    min: number;
    max: number;
    currency?: string;
  };
  disclaimer?: string;
  cta?: CardAction;
}

export interface ServiceFeeToolOutput {
  type: 'service_fee';
  title: string;
  message?: string;
  amount: number;
  waived?: boolean;
}

export type ToolOutput =
  | DatePickerToolOutput
  | TimePickerToolOutput
  | BookingConfirmationToolOutput
  | LeadCaptureToolOutput
  | EmergencyHelpToolOutput
  | QuoteToolOutput
  | ServiceFeeToolOutput;
