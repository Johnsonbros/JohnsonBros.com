import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fetch } from "undici";

export const jobsServer = new McpServer({
  name: "jobs",
  version: "1.0.0"
});

const API_BASE = "https://api.housecallpro.com";
const getHeaders = () => ({
  "Authorization": `Bearer ${process.env.HOUSECALL_API_KEY}`,
  "Content-Type": "application/json",
  "Accept": "application/json"
});

jobsServer.tool(
  "list",
  "Get a list of jobs with filters",
  {
    page: z.number().optional().default(1),
    page_size: z.number().optional().default(10),
    status: z.string().optional().describe("Filter by job status")
  },
  async ({ page, page_size, status }) => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("page_size", page_size.toString());
    if (status) params.append("status", status);

    const res = await fetch(`${API_BASE}/jobs?${params.toString()}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error(`HCP API Error: ${res.statusText}`);
    const data = await res.json();
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  }
);

jobsServer.tool(
  "get",
  "Get a specific job details by ID",
  { id: z.string().describe("Job ID") },
  async ({ id }) => {
    const res = await fetch(`${API_BASE}/jobs/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error(`HCP API Error: ${res.statusText}`);
    const data = await res.json();
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  }
);
