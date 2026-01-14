import type { CardIntent } from './cardProtocol';
import { callOpenAITool } from './toolActionHandlers';

export interface ActionResult {
  ok: boolean;
  action: string;
  correlationId: string;
  result?: {
    message: string;
    externalId?: string;
    card?: CardIntent;
    data?: Record<string, unknown>;
  };
  error?: {
    code: string;
    details?: string;
    missingFields?: string[];
  };
}

export interface ActionContext {
  threadId: string;
  sessionId?: string;
}

export async function dispatchCardAction(
  action: string,
  payload: Record<string, unknown>,
  context: ActionContext
): Promise<ActionResult> {
  try {
    if (action === 'book_service_call' || action === 'get_quote') {
      const result = await callOpenAITool({ name: action, input: payload });

      const toolResult = result as Record<string, unknown>;
      const message = resolveToolMessage(toolResult, action);

      return {
        ok: true,
        action,
        correlationId: (toolResult?.correlation_id as string) || '',
        result: {
          message,
          data: toolResult,
        },
      };
    }

    const response = await fetch('/api/actions/dispatch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        action,
        payload,
        context,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        ok: false,
        action,
        correlationId: '',
        error: {
          code: 'HTTP_ERROR',
          details: `Request failed with status ${response.status}: ${errorText}`,
        },
      };
    }

    const result: ActionResult = await response.json();
    return result;
  } catch (error) {
    return {
      ok: false,
      action,
      correlationId: '',
      error: {
        code: 'NETWORK_ERROR',
        details: error instanceof Error ? error.message : 'Network request failed',
      },
    };
  }
}

export function createFallbackCard(action: string, error: ActionResult['error']): CardIntent {
  return {
    id: crypto.randomUUID(),
    type: 'lead_card',
    title: "Let's Book You By Phone",
    priority: 'high',
    message: "We're having trouble completing your request online. Call us and we'll get you scheduled in 60 seconds.",
    prefill: {},
  };
}

function resolveToolMessage(toolResult: Record<string, unknown>, action: string): string {
  if (typeof toolResult?.summary === 'string') return toolResult.summary;
  if (typeof toolResult?.next_steps === 'string') return toolResult.next_steps;
  if (typeof toolResult?.message === 'string') return toolResult.message;
  if (typeof toolResult?.error === 'string') return toolResult.error;

  return `Completed ${action.replace(/_/g, ' ')}.`;
}

export const ACTION_TYPES = {
  SUBMIT_LEAD: 'SUBMIT_LEAD',
  SUBMIT_CUSTOMER_INFO: 'SUBMIT_CUSTOMER_INFO',
  SEARCH_CUSTOMER: 'SEARCH_CUSTOMER',
  SELECT_CUSTOMER: 'SELECT_CUSTOMER',
  NEW_CUSTOMER: 'NEW_CUSTOMER',
  SELECT_DATE: 'SELECT_DATE',
  SELECT_TIME: 'SELECT_TIME',
  HOUSECALL_PRO_BOOKING: 'HOUSECALL_PRO_BOOKING',
  HOUSECALL_PRO_ESTIMATE_REQUEST: 'HOUSECALL_PRO_ESTIMATE_REQUEST',
  HOUSECALL_PRO_AVAILABILITY_LOOKUP: 'HOUSECALL_PRO_AVAILABILITY_LOOKUP',
  INTERNAL_BOOKING_FLOW: 'INTERNAL_BOOKING_FLOW',
} as const;

export type ActionType = typeof ACTION_TYPES[keyof typeof ACTION_TYPES];
