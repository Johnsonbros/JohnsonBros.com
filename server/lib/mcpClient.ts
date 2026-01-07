import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Logger } from '../src/logger';

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3001/mcp';

let mcpClient: Client | null = null;
let cachedTools: any[] | null = null;

async function connectMcpClient(): Promise<Client> {
  if (mcpClient) {
    return mcpClient;
  }

  const transport = new StreamableHTTPClientTransport(new URL(MCP_SERVER_URL));
  mcpClient = new Client(
    { name: 'jb-app-mcp-client', version: '1.0.0' },
    { capabilities: {} }
  );

  await mcpClient.connect(transport);
  Logger.info(`[MCP] Connected to MCP server at ${MCP_SERVER_URL}`);
  return mcpClient;
}

export async function listMcpTools(): Promise<any[]> {
  if (cachedTools) {
    return cachedTools;
  }

  const client = await connectMcpClient();
  const { tools } = await client.listTools();
  cachedTools = tools || [];
  Logger.info(`[MCP] Loaded ${cachedTools.length} tools`);
  return cachedTools;
}

export async function callMcpTool<T = unknown>(name: string, args: Record<string, unknown>): Promise<{
  raw: string;
  parsed?: T;
}> {
  const client = await connectMcpClient();

  Logger.info(`[MCP] Executing tool: ${name}`, { args });
  const result = await client.callTool({ name, arguments: args });

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
}
