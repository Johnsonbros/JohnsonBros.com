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
              availableDates: generateAvailableDates(),
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
              availableDates: generateAvailableDates(),
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
              slots: [
                { id: 'morning', label: 'Morning', timeWindow: 'MORNING', available: true, technicianCount: 2 },
                { id: 'midday', label: 'Midday', timeWindow: 'MIDDAY', available: true, technicianCount: 1 },
                { id: 'afternoon', label: 'Afternoon', timeWindow: 'AFTERNOON', available: true, technicianCount: 3 },
                { id: 'evening', label: 'Evening', timeWindow: 'EVENING', available: false, technicianCount: 0 },
              ],
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
    logger.error('Action dispatch error', error);
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

function generateAvailableDates(): Array<{ date: string; slotsAvailable: number; capacityState: string }> {
  const dates = [];
  const today = new Date();

  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    dates.push({
      date: dateStr,
      slotsAvailable: isWeekend ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * 4) + 1,
      capacityState: i === 0 ? 'SAME_DAY_FEE_WAIVED' : i < 3 ? 'LIMITED_SAME_DAY' : 'AVAILABLE',
    });
  }

  return dates;
}

export default router;
