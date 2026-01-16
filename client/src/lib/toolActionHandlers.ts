export interface ToolCallPayload {
  name: string;
  input?: Record<string, unknown>;
}

export interface ToolCallClient {
  callTool: (payload: ToolCallPayload) => Promise<unknown>;
}

export interface BookAppointmentInput {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  street: string;
  street_line_2?: string;
  city: string;
  state: string;
  zip: string;
  description: string;
  lead_source?: string;
  time_preference?: 'any' | 'morning' | 'afternoon' | 'evening';
  earliest_date?: string;
  latest_date?: string;
}

export interface GetQuoteInput {
  service_type: string;
  issue_description: string;
  property_type?: 'residential' | 'commercial';
  urgency?: 'routine' | 'soon' | 'urgent' | 'emergency';
}

function getOpenAIToolClient(): ToolCallClient | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.openai?.callTool ? window.openai : undefined;
}

async function callServerTool<T = unknown>(payload: ToolCallPayload): Promise<T> {
  const response = await fetch('/api/v1/tools/call', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Tool request failed with status ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  if (!data?.ok) {
    throw new Error(data?.error?.details || 'Tool request failed');
  }

  return data.result as T;
}

export async function callOpenAITool<T = unknown>(payload: ToolCallPayload): Promise<T> {
  const client = getOpenAIToolClient();

  if (client) {
    return client.callTool(payload) as Promise<T>;
  }

  return callServerTool(payload);
}

export async function bookAppointment(input: BookAppointmentInput) {
  return callOpenAITool({
    name: 'book_service_call',
    input: input as unknown as Record<string, unknown>,
  });
}

export async function getQuote(input: GetQuoteInput) {
  return callOpenAITool({
    name: 'get_quote',
    input: input as unknown as Record<string, unknown>,
  });
}

export function hasOpenAIToolClient(): boolean {
  return Boolean(getOpenAIToolClient());
}

declare global {
  interface Window {
    openai?: ToolCallClient;
  }
}

export {};
