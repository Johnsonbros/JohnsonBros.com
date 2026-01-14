import { apiRequest } from "@/lib/queryClient";

export type ToolName =
  | "book_service_call"
  | "search_availability"
  | "get_services"
  | "get_quote"
  | "emergency_help";

export type ToolCallResult<T> = T & {
  success?: boolean;
  error?: string;
};

type ToolCallArgs = Record<string, unknown>;

type OpenAITooling = {
  toolOutput?: unknown;
  callTool?: (name: string, args?: ToolCallArgs) => Promise<unknown>;
};

function getOpenAIWindow(): OpenAITooling | null {
  if (typeof window === "undefined") return null;
  return (window as typeof window & { openai?: OpenAITooling }).openai ?? null;
}

export function getChatGptToolOutput<T>(): T | null {
  const openai = getOpenAIWindow();
  return openai?.toolOutput ? (openai.toolOutput as T) : null;
}

export async function invokeTool<T>(
  toolName: ToolName,
  args: ToolCallArgs = {}
): Promise<ToolCallResult<T>> {
  const openai = getOpenAIWindow();

  if (openai?.callTool) {
    const result = await openai.callTool(toolName, args);
    return result as ToolCallResult<T>;
  }

  const response = await apiRequest("POST", `/api/mcp/${toolName}`, args);
  return (await response.json()) as ToolCallResult<T>;
}
