import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Logger } from "../src/logger";

/**
 * Admin MCP Gateway (Aggregator)
 * Implements the Hybrid Agent-as-Tools pattern for ZEKE
 */
export class AdminMcpGateway {
  private servers: Map<string, McpServer> = new Map();
  private toolRegistry: Map<string, { serverName: string, tool: any }> = new Map();

  constructor() {
    Logger.info("Initializing Admin MCP Gateway");
  }

  async registerSubServer(name: string, server: McpServer) {
    this.servers.set(name, server);
    // @ts-ignore - access internal tools for aggregation
    const tools = server.listTools();
    for (const tool of tools) {
      const namespacedName = `${name}.${tool.name}`;
      this.toolRegistry.set(namespacedName, { serverName: name, tool });
      Logger.debug(`Registered tool: ${namespacedName}`);
    }
  }

  async callTool(namespacedName: string, args: any) {
    const entry = this.toolRegistry.get(namespacedName);
    if (!entry) {
      throw new Error(`Tool ${namespacedName} not found in gateway`);
    }

    const server = this.servers.get(entry.serverName);
    if (!server) {
      throw new Error(`Server ${entry.serverName} not found for tool ${namespacedName}`);
    }

    Logger.info(`Gateway routing call to ${entry.serverName}: ${entry.tool.name}`);
    return await server.callTool(entry.tool.name, args);
  }

  listNamespacedTools() {
    return Array.from(this.toolRegistry.keys()).map(name => {
      const entry = this.toolRegistry.get(name)!;
      return {
        name,
        description: `[${entry.serverName}] ${entry.tool.description}`,
        inputSchema: entry.tool.inputSchema
      };
    });
  }
}

export const adminGateway = new AdminMcpGateway();
