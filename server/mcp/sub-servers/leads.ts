import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fetch } from "undici";

export const leadsServer = new McpServer({
  name: "leads",
  version: "1.0.0"
});

const API_BASE = "https://api.housecallpro.com";
const getHeaders = () => ({
  "Authorization": `Bearer ${process.env.HOUSECALL_API_KEY}`,
  "Content-Type": "application/json",
  "Accept": "application/json"
});

leadsServer.tool(
  "create",
  "Create a new lead",
  {
    first_name: z.string(),
    last_name: z.string(),
    email: z.string().email().optional(),
    mobile_number: z.string().optional(),
    message: z.string().optional()
  },
  async (payload) => {
    const res = await fetch(`${API_BASE}/leads`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HCP API Error: ${res.statusText}`);
    const data = await res.json();
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  }
);
