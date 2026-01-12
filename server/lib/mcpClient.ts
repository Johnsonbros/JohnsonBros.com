import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Logger } from '../src/logger';

const DEFAULT_MCP_BASE_URL = 'http://localhost:3001';
const MCP_SERVER_URL = (() => {
  const configured = process.env.MCP_SERVER_URL || DEFAULT_MCP_BASE_URL;
  return configured.endsWith('/mcp') ? configured : `${configured.replace(/\/$/, '')}/mcp`;
})();
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const CONNECTION_TIMEOUT_MS = 10000; // 10 seconds
const TOOL_CALL_TIMEOUT_MS = 30000; // 30 seconds

let mcpClient: Client | null = null;
let cachedTools: any[] | null = null;
let isConnecting = false;
let connectionPromise: Promise<Client> | null = null;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${operation} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    })
  ]);
}

async function connectMcpClient(): Promise<Client> {
  // Return existing client if connected
  if (mcpClient) {
    return mcpClient;
  }

  // If already connecting, wait for that connection
  if (isConnecting && connectionPromise) {
    return connectionPromise;
  }

  isConnecting = true;
  connectionPromise = (async () => {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const transport = new StreamableHTTPClientTransport(new URL(MCP_SERVER_URL));
        const client = new Client(
          { name: 'jb-app-mcp-client', version: '1.0.0' },
          { capabilities: {} }
        );

        await withTimeout(
          client.connect(transport),
          CONNECTION_TIMEOUT_MS,
          'MCP connection'
        );
        mcpClient = client;
        cachedTools = null; // Clear cached tools on reconnect
        Logger.info(`[MCP] Connected to MCP server at ${MCP_SERVER_URL} (attempt ${attempt})`);
        return client;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        Logger.warn(`[MCP] Connection attempt ${attempt}/${MAX_RETRIES} failed: ${lastError.message}`);

        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * Math.pow(2, attempt - 1)); // Exponential backoff
        }
      }
    }

    throw lastError || new Error('Failed to connect to MCP server after retries');
  })().finally(() => {
    isConnecting = false;
    connectionPromise = null;
  });

  return connectionPromise;
}

// Reset the client connection (call this on errors to force reconnection)
export function resetMcpClient(): void {
  if (mcpClient) {
    try {
      mcpClient.close();
    } catch (e) {
      // Ignore close errors
    }
    mcpClient = null;
    cachedTools = null;
    Logger.info('[MCP] Client connection reset');
  }
}

export async function listMcpTools(): Promise<any[]> {
  if (cachedTools) {
    return cachedTools;
  }

  try {
    const client = await connectMcpClient();
    const { tools } = await withTimeout(
      client.listTools(),
      TOOL_CALL_TIMEOUT_MS,
      'MCP listTools'
    );
    cachedTools = tools || [];
    Logger.info(`[MCP] Loaded ${cachedTools.length} tools`);
    return cachedTools;
  } catch (error) {
    Logger.error('[MCP] Failed to list tools, resetting connection', { error: error instanceof Error ? error.message : String(error) });
    resetMcpClient();
    throw error;
  }
}

export async function callMcpTool<T = unknown>(name: string, args: Record<string, unknown>): Promise<{
  raw: string;
  parsed?: T;
}> {
  try {
    const client = await connectMcpClient();

    Logger.info(`[MCP] Executing tool: ${name}`, { args });
    const result = await withTimeout(
      client.callTool({ name, arguments: args }),
      TOOL_CALL_TIMEOUT_MS,
      `MCP tool call: ${name}`
    );

    const content = Array.isArray(result.content)
      ? result.content.map((c: any) => c.text || JSON.stringify(c)).join('\n')
      : typeof result.content === 'string'
        ? result.content
        : JSON.stringify(result.content);

    let parsed: T | undefined;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = undefined;
    }

    return { raw: content, parsed };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check for connection-related errors and reset client
    const connectionErrors = [
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT',
      'ECONNRESET',
      'EPIPE',
      'EAI_AGAIN',
      'socket hang up',
      'session',
      'disconnected'
    ];

    if (connectionErrors.some(signature => errorMessage.includes(signature))) {
      Logger.warn(`[MCP] Connection error calling tool ${name}, resetting client: ${errorMessage}`);
      resetMcpClient();
    }

    Logger.error(`[MCP] Failed to execute tool: ${name}`, { error: errorMessage, args });
    throw error;
  }
}
