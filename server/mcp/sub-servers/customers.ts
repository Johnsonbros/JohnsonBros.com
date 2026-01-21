import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fetch } from "undici";

export const customersServer = new McpServer({
  name: "customers",
  version: "1.0.0"
});

const API_BASE = "https://api.housecallpro.com";
const getHeaders = () => ({
  "Authorization": `Bearer ${process.env.HOUSECALL_API_KEY}`,
  "Content-Type": "application/json",
  "Accept": "application/json"
});

customersServer.tool(
  "list",
  "Get a list of customers with pagination and search",
  {
    q: z.string().optional().describe("Search query (name, email, phone)"),
    page: z.number().optional().default(1),
    page_size: z.number().optional().default(10)
  },
  async ({ q, page, page_size }) => {
    const params = new URLSearchParams();
    if (q) params.append("q", q);
    params.append("page", page.toString());
    params.append("page_size", page_size.toString());

    const res = await fetch(`${API_BASE}/customers?${params.toString()}`, {
      headers: getHeaders()
    });
    
    if (!res.ok) throw new Error(`HCP API Error: ${res.statusText}`);
    const data = await res.json();
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  }
);

customersServer.tool(
  "get",
  "Get a specific customer by ID",
  { id: z.string().describe("Customer ID") },
  async ({ id }) => {
    const res = await fetch(`${API_BASE}/customers/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error(`HCP API Error: ${res.statusText}`);
    const data = await res.json();
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  }
);

customersServer.tool(
  "create",
  "Create a new customer record",
  {
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    email: z.string().email().optional(),
    mobile_number: z.string().optional()
  },
  async (payload) => {
    const res = await fetch(`${API_BASE}/customers`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HCP API Error: ${res.statusText}`);
    const data = await res.json();
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  }
);
