import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import {
  ActionDispatchRequestSchema,
  SubmitLeadPayloadSchema,
  SubmitCustomerInfoPayloadSchema,
  SearchCustomerPayloadSchema,
  SelectCustomerPayloadSchema,
  SelectDatePayloadSchema,
  SelectTimePayloadSchema,
  HousecallProBookingPayloadSchema,
  HousecallProAvailabilityPayloadSchema,
} from '../actionSchemas';
import { getServiceById, mapToHcpServiceId } from '../serviceMapping';
import { callMcpTool } from '../lib/mcpClient';
import { CapacityCalculator } from '../src/capacity';
import pino from 'pino';

const mcpClient = {
  async invokeTool(name: string, args: Record<string, unknown>): Promise<{ ok: boolean; data: any }> {
    const result = await callMcpTool(name, args);
    return { ok: true, data: result.parsed || {} };
  }
};

const logger = pino({ name: 'actions' });
const router = Router();

interface ActionResult {
  ok: boolean;
  action: string;
  correlationId: string;
  result?: {
    message: string;
    externalId?: string;
    card?: any;
    data?: Record<string, unknown>;
  };
  error?: {
    code: string;
    details?: string;
    missingFields?: string[];
  };
}

function redactPII(data: any): any {
  if (!data) return data;
  const redacted = { ...data };
  if (redacted.phone) redacted.phone = redacted.phone.slice(-4).padStart(10, '*');
  if (redacted.email) redacted.email = '***@***';
  if (redacted.customer) redacted.customer = redactPII(redacted.customer);
  return redacted;
}

async function logAction(
  correlationId: string,
  threadId: string,
  action: string,
  payload: any,
  status: 'pending' | 'success' | 'failed',
  mcpTool?: string,
  externalId?: string,
  errorDetails?: string
) {
  try {
    logger.info({
      correlationId,
      threadId,
      action,
      payload: redactPII(payload),
      status,
      mcpTool,
      externalId,
      errorDetails,
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    logger.error('Failed to log action', e);
  }
}

router.post('/dispatch', async (req: Request, res: Response) => {
  const correlationId = randomUUID();

  try {
    const parseResult = ActionDispatchRequestSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        ok: false,
        action: req.body?.action || 'UNKNOWN',
        correlationId,
        error: {
          code: 'VALIDATION_ERROR',
          details: parseResult.error.message,
        },
      } as ActionResult);
    }

    const { action, payload, context } = parseResult.data;

    await logAction(correlationId, context.threadId, action, payload, 'pending');

    let result: ActionResult;

    switch (action) {
      case 'SUBMIT_LEAD': {
        const leadResult = SubmitLeadPayloadSchema.safeParse(payload);
        if (!leadResult.success) {
          result = {
            ok: false,
            action,
            correlationId,
            error: { code: 'VALIDATION_ERROR', missingFields: leadResult.error.issues.map(i => i.path.join('.')) },
          };
          break;
        }

        try {
          const mcpResult = await mcpClient.invokeTool('create_lead', {
            name: leadResult.data.name,
            phone: leadResult.data.phone,
            message: leadResult.data.issueDescription,
            source: 'chat_card',
          });

          result = {
            ok: true,
            action,
            correlationId,
            result: {
              message: 'Lead captured successfully. Let\'s get your information to book a technician.',
              card: {
                id: randomUUID(),
                type: 'returning_customer_lookup',
                title: 'Are you an existing customer?',
                message: 'Enter your phone number to check if we have your info on file.',
                searchValue: leadResult.data.phone,
                priority: 'high',
              },
            },
          };
        } catch (e) {
          result = {
            ok: false,
            action,
            correlationId,
            error: { code: 'MCP_ERROR', details: e instanceof Error ? e.message : 'MCP call failed' },
          };
        }
        break;
      }

      case 'SEARCH_CUSTOMER': {
        const searchResult = SearchCustomerPayloadSchema.safeParse(payload);
        if (!searchResult.success) {
          result = {
            ok: false,
            action,
            correlationId,
            error: { code: 'VALIDATION_ERROR', missingFields: ['query'] },
          };
          break;
        }

        try {
          const mcpResult = await mcpClient.invokeTool('lookup_customer', {
            searchTerm: searchResult.data.query,
          });

          const customers = mcpResult?.data?.customers || [];

          result = {
            ok: true,
            action,
            correlationId,
            result: {
              message: customers.length > 0 ? `Found ${customers.length} customer(s)` : 'No customers found',
              card: {
                id: searchResult.data.cardId,
                type: 'returning_customer_lookup',
                title: 'Customer Search Results',
                results: customers.map((c: any) => ({
                  id: c.id,
                  firstName: c.first_name || c.firstName,
                  lastName: c.last_name || c.lastName,
                  phone: c.phone,
                  email: c.email,
                  address: c.address?.formatted || c.address,
                })),
                priority: 'high',
              },
            },
          };
        } catch (e) {
          result = {
            ok: true,
            action,
            correlationId,
            result: {
              message: 'Could not search at this time. Please enter your information.',
              card: {
                id: randomUUID(),
                type: 'new_customer_info',
                title: 'Your Information',
                message: 'Please provide your contact details.',
                priority: 'high',
              },
            },
          };
        }
        break;
      }

      case 'NEW_CUSTOMER': {
        result = {
          ok: true,
          action,
          correlationId,
          result: {
            message: 'Please provide your information.',
            card: {
              id: randomUUID(),
              type: 'new_customer_info',
              title: 'Your Information',
              message: 'We\'ll use this to book your appointment.',
              priority: 'high',
            },
          },
        };
        break;
      }

      case 'SELECT_CUSTOMER': {
        const selectResult = SelectCustomerPayloadSchema.safeParse(payload);
        if (!selectResult.success) {
          result = {
            ok: false,
            action,
            correlationId,
            error: { code: 'VALIDATION_ERROR', missingFields: ['customer'] },
          };
          break;
        }

        // Get customer's ZIP if available for capacity calculation
        const customerZip = selectResult.data.customer.address?.includes(',')
          ? selectResult.data.customer.address.split(',').pop()?.trim().match(/\d{5}/)?.[0]
          : undefined;

        result = {
          ok: true,
          action,
          correlationId,
          result: {
            message: `Great, ${selectResult.data.customer.firstName}! When would you like us to come out?`,
            data: { customerId: selectResult.data.customer.id },
            card: {
              id: randomUUID(),
              type: 'date_picker',
              title: 'Choose a Date',
              message: 'Select an available date for your appointment.',
              availableDates: await generateAvailableDates(customerZip),
              priority: 'high',
            },
          },
        };
        break;
      }

      case 'SUBMIT_CUSTOMER_INFO': {
        const infoResult = SubmitCustomerInfoPayloadSchema.safeParse(payload);
        if (!infoResult.success) {
          result = {
            ok: false,
            action,
            correlationId,
            error: {
              code: 'MISSING_FIELDS',
              missingFields: infoResult.error.issues.map(i => i.path.join('.')),
            },
          };
          break;
        }

        result = {
          ok: true,
          action,
          correlationId,
          result: {
            message: `Thanks ${infoResult.data.firstName}! When would you like us to come out?`,
            data: { customer: infoResult.data },
            card: {
              id: randomUUID(),
              type: 'date_picker',
              title: 'Choose a Date',
              message: 'Select an available date for your appointment.',
              availableDates: await generateAvailableDates(infoResult.data.address?.zip),
              priority: 'high',
            },
          },
        };
        break;
      }

      case 'SELECT_DATE': {
        const dateResult = SelectDatePayloadSchema.safeParse(payload);
        if (!dateResult.success) {
          result = {
            ok: false,
            action,
            correlationId,
            error: { code: 'VALIDATION_ERROR', missingFields: ['date'] },
          };
          break;
        }

        // Extract user ZIP from payload if available
        const userZip = typeof payload.zip === 'string' ? payload.zip : undefined;

        result = {
          ok: true,
          action,
          correlationId,
          result: {
            message: 'Great choice! What time works best for you?',
            data: { selectedDate: dateResult.data.date },
            card: {
              id: randomUUID(),
              type: 'time_picker',
              title: 'Choose a Time',
              selectedDate: dateResult.data.date,
              slots: await getTimeSlotsForDate(dateResult.data.date, userZip),
              priority: 'high',
            },
          },
        };
        break;
      }

      case 'SELECT_TIME': {
        const timeResult = SelectTimePayloadSchema.safeParse(payload);
        if (!timeResult.success) {
          result = {
            ok: false,
            action,
            correlationId,
            error: { code: 'VALIDATION_ERROR', missingFields: ['slotId', 'timeWindow'] },
          };
          break;
        }

        result = {
          ok: true,
          action,
          correlationId,
          result: {
            message: 'Perfect! I\'m ready to book your appointment.',
            data: {
              selectedDate: timeResult.data.date,
              selectedTime: timeResult.data.timeWindow,
              slotId: timeResult.data.slotId,
            },
          },
        };
        break;
      }

      case 'HOUSECALL_PRO_BOOKING': {
        const bookingPayload = HousecallProBookingPayloadSchema.safeParse(payload);
        if (!bookingPayload.success) {
          result = {
            ok: false,
            action,
            correlationId,
            error: {
              code: 'MISSING_FIELDS',
              missingFields: bookingPayload.error.issues.map(i => i.path.join('.')),
            },
          };
          break;
        }

        try {
          const hcpServiceId = mapToHcpServiceId(bookingPayload.data.serviceId);
          const service = getServiceById(bookingPayload.data.serviceId);

          const mcpResult = await mcpClient.invokeTool('book_service_call', {
            firstName: bookingPayload.data.customer.firstName,
            lastName: bookingPayload.data.customer.lastName,
            phone: bookingPayload.data.customer.phone,
            email: bookingPayload.data.customer.email,
            streetAddress: bookingPayload.data.address.line1,
            unit: bookingPayload.data.address.line2,
            city: bookingPayload.data.address.city,
            state: bookingPayload.data.address.state,
            zipCode: bookingPayload.data.address.zip,
            preferredDate: bookingPayload.data.preferred?.date1,
            preferredTime: bookingPayload.data.preferred?.timeWindow,
            serviceType: service?.name || 'General Plumbing',
            description: bookingPayload.data.notes || '',
          });

          const jobId = mcpResult?.data?.jobId || mcpResult?.data?.id;

          await logAction(correlationId, context.threadId, action, payload, 'success', 'book_service_call', jobId);

          result = {
            ok: true,
            action,
            correlationId,
            result: {
              message: 'Your appointment has been booked!',
              externalId: jobId,
              card: {
                id: randomUUID(),
                type: 'booking_confirmation',
                title: 'Booking Confirmed',
                message: 'We\'ve sent a confirmation to your phone.',
                booking: {
                  jobId,
                  customerName: `${bookingPayload.data.customer.firstName} ${bookingPayload.data.customer.lastName}`,
                  phone: bookingPayload.data.customer.phone,
                  address: `${bookingPayload.data.address.line1}, ${bookingPayload.data.address.city}, ${bookingPayload.data.address.state} ${bookingPayload.data.address.zip}`,
                  serviceType: service?.name || 'General Plumbing',
                  scheduledDate: bookingPayload.data.preferred?.date1 || 'To be confirmed',
                  scheduledTime: bookingPayload.data.preferred?.timeWindow || 'To be confirmed',
                  confirmationNumber: jobId?.slice(-8).toUpperCase(),
                },
                priority: 'high',
              },
            },
          };
        } catch (e) {
          await logAction(correlationId, context.threadId, action, payload, 'failed', 'book_service_call', undefined, e instanceof Error ? e.message : 'Unknown error');

          result = {
            ok: false,
            action,
            correlationId,
            error: {
              code: 'INTEGRATION_DOWN',
              details: 'Unable to complete booking at this time. Please call us directly.',
            },
          };
        }
        break;
      }

      default:
        result = {
          ok: false,
          action,
          correlationId,
          error: { code: 'UNKNOWN_ACTION', details: `Action "${action}" is not supported` },
        };
    }

    await logAction(
      correlationId,
      context.threadId,
      action,
      payload,
      result.ok ? 'success' : 'failed',
      undefined,
      result.result?.externalId,
      result.error?.details
    );

    return res.json(result);
  } catch (error) {
    logger.error({ err: error }, 'Action dispatch error');
    return res.status(500).json({
      ok: false,
      action: req.body?.action || 'UNKNOWN',
      correlationId,
      error: {
        code: 'INTERNAL_ERROR',
        details: 'An unexpected error occurred',
      },
    } as ActionResult);
  }
});

async function generateAvailableDates(userZip?: string): Promise<Array<{ date: string; slotsAvailable: number; capacityState: string }>> {
  const dates = [];
  const calculator = CapacityCalculator.getInstance();
  const today = new Date();

  // Calculate availability for the next 14 days
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    try {
      // Get real capacity data for this date
      const capacity = await calculator.calculateCapacity(date, userZip);

      // Count available time windows
      const availableWindows = capacity.unique_express_windows?.length || 0;

      dates.push({
        date: dateStr,
        slotsAvailable: availableWindows,
        capacityState: capacity.overall.state,
      });
    } catch (error) {
      logger.error({ error, date: dateStr }, 'Failed to calculate capacity for date');
      // Fallback to showing as unavailable if capacity calculation fails
      dates.push({
        date: dateStr,
        slotsAvailable: 0,
        capacityState: 'NEXT_DAY',
      });
    }
  }

  return dates;
}

async function getTimeSlotsForDate(date: string, userZip?: string): Promise<Array<{
  id: string;
  label: string;
  timeWindow: 'MORNING' | 'MIDDAY' | 'AFTERNOON' | 'EVENING';
  startTime?: string;
  endTime?: string;
  available: boolean;
  technicianCount?: number;
}>> {
  try {
    const calculator = CapacityCalculator.getInstance();
    const targetDate = new Date(date);
    const capacity = await calculator.calculateCapacity(targetDate, userZip);

    // Map express windows to time slots
    const slots = capacity.unique_express_windows?.map(window => {
      // Determine the time window based on the time slot
      let timeWindow: 'MORNING' | 'MIDDAY' | 'AFTERNOON' | 'EVENING' = 'MORNING';
      if (window.time_slot.includes('11:00')) {
        timeWindow = 'MIDDAY';
      } else if (window.time_slot.includes('14:00') || window.time_slot.includes('2:00 PM')) {
        timeWindow = 'AFTERNOON';
      } else if (window.time_slot.includes('17:00') || window.time_slot.includes('5:00 PM')) {
        timeWindow = 'EVENING';
      }

      const [startTime, endTime] = window.time_slot.split(' - ');

      return {
        id: `slot-${window.start_time}`,
        label: timeWindow.charAt(0) + timeWindow.slice(1).toLowerCase(),
        timeWindow,
        startTime,
        endTime,
        available: window.available_techs.length > 0,
        technicianCount: window.available_techs.length,
      };
    }) || [];

    // If no slots available, return standard slots marked as unavailable
    if (slots.length === 0) {
      return [
        { id: 'morning', label: 'Morning', timeWindow: 'MORNING', available: false, technicianCount: 0 },
        { id: 'midday', label: 'Midday', timeWindow: 'MIDDAY', available: false, technicianCount: 0 },
        { id: 'afternoon', label: 'Afternoon', timeWindow: 'AFTERNOON', available: false, technicianCount: 0 },
        { id: 'evening', label: 'Evening', timeWindow: 'EVENING', available: false, technicianCount: 0 },
      ];
    }

    return slots;
  } catch (error) {
    logger.error({ error, date }, 'Failed to get time slots for date');
    // Return all slots as unavailable on error
    return [
      { id: 'morning', label: 'Morning', timeWindow: 'MORNING', available: false, technicianCount: 0 },
      { id: 'midday', label: 'Midday', timeWindow: 'MIDDAY', available: false, technicianCount: 0 },
      { id: 'afternoon', label: 'Afternoon', timeWindow: 'AFTERNOON', available: false, technicianCount: 0 },
      { id: 'evening', label: 'Evening', timeWindow: 'EVENING', available: false, technicianCount: 0 },
    ];
  }
}

export default router;
