import { z } from 'zod';

export const CustomerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(10),
  email: z.string().email().optional(),
});

export const AddressSchema = z.object({
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().length(2),
  zip: z.string().length(5),
});

export const PreferredScheduleSchema = z.object({
  date1: z.string().optional(),
  date2: z.string().optional(),
  timeWindow: z.enum(['MORNING', 'MIDDAY', 'AFTERNOON', 'EVENING']).optional(),
});

export const MarketingSchema = z.object({
  source: z.string().optional(),
  campaign: z.string().optional(),
});

export const HousecallProBookingPayloadSchema = z.object({
  threadId: z.string(),
  serviceId: z.string(),
  customer: CustomerSchema,
  address: AddressSchema,
  preferred: PreferredScheduleSchema.optional(),
  notes: z.string().optional(),
  marketing: MarketingSchema.optional(),
});

export const HousecallProEstimateRequestPayloadSchema = z.object({
  threadId: z.string(),
  serviceId: z.string(),
  customer: CustomerSchema,
  address: AddressSchema,
  problemSummary: z.string(),
  photos: z.array(z.object({ assetId: z.string() })).optional(),
});

export const HousecallProAvailabilityPayloadSchema = z.object({
  threadId: z.string(),
  serviceId: z.string().optional(),
  zip: z.string().length(5),
  preferredDates: z.array(z.string()).optional(),
});

export const SubmitLeadPayloadSchema = z.object({
  cardId: z.string(),
  name: z.string().min(1),
  phone: z.string().min(10),
  issueDescription: z.string(),
});

export const SubmitCustomerInfoPayloadSchema = z.object({
  cardId: z.string(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(10),
  email: z.string().email().optional(),
  address: AddressSchema,
});

export const SearchCustomerPayloadSchema = z.object({
  cardId: z.string(),
  query: z.string().min(1),
});

export const SelectCustomerPayloadSchema = z.object({
  cardId: z.string(),
  customer: z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    phone: z.string(),
    email: z.string().optional(),
    address: z.string().optional(),
  }),
});

export const SelectDatePayloadSchema = z.object({
  cardId: z.string(),
  date: z.string(),
  serviceId: z.string().optional(),
});

export const SelectTimePayloadSchema = z.object({
  cardId: z.string(),
  slotId: z.string(),
  timeWindow: z.enum(['MORNING', 'MIDDAY', 'AFTERNOON', 'EVENING']),
  date: z.string(),
});

export const ActionTypeEnum = z.enum([
  'SUBMIT_LEAD',
  'SUBMIT_CUSTOMER_INFO',
  'SEARCH_CUSTOMER',
  'SELECT_CUSTOMER',
  'NEW_CUSTOMER',
  'SELECT_DATE',
  'SELECT_TIME',
  'HOUSECALL_PRO_BOOKING',
  'HOUSECALL_PRO_ESTIMATE_REQUEST',
  'HOUSECALL_PRO_AVAILABILITY_LOOKUP',
  'INTERNAL_BOOKING_FLOW',
]);

export const ActionContextSchema = z.object({
  threadId: z.string(),
  sessionId: z.string().optional(),
});

export const ActionDispatchRequestSchema = z.object({
  action: ActionTypeEnum,
  payload: z.record(z.unknown()),
  context: ActionContextSchema,
});

export type HousecallProBookingPayload = z.infer<typeof HousecallProBookingPayloadSchema>;
export type HousecallProEstimateRequestPayload = z.infer<typeof HousecallProEstimateRequestPayloadSchema>;
export type HousecallProAvailabilityPayload = z.infer<typeof HousecallProAvailabilityPayloadSchema>;
export type ActionDispatchRequest = z.infer<typeof ActionDispatchRequestSchema>;
export type ActionType = z.infer<typeof ActionTypeEnum>;
