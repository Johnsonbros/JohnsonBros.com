import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fetch } from "undici";

export const schedulingServer = new McpServer({
  name: "scheduling",
  version: "1.0.0"
});

const API_BASE = "https://api.housecallpro.com";
const getHeaders = () => ({
  "Authorization": `Bearer ${process.env.HOUSECALL_API_KEY}`,
  "Content-Type": "application/json",
  "Accept": "application/json"
});

schedulingServer.tool(
  "get_availability",
  "Get schedule availability for a date range",
  {
    start_date: z.string().describe("ISO date string"),
    end_date: z.string().describe("ISO date string")
  },
  async ({ start_date, end_date }) => {
    const res = await fetch(`${API_BASE}/company/schedule_availability?start_date=${start_date}&end_date=${end_date}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error(`HCP API Error: ${res.statusText}`);
    const data = await res.json();
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  }
);
