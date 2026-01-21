import { Logger } from "../src/logger";
import { adminGateway } from "./adminGateway";
import { customersServer } from "./sub-servers/customers";
import { jobsServer } from "./sub-servers/jobs";
import { schedulingServer } from "./sub-servers/scheduling";
import { leadsServer } from "./sub-servers/leads";

export { adminGateway } from "./adminGateway";
export { customersServer } from "./sub-servers/customers";
export { jobsServer } from "./sub-servers/jobs";
export { schedulingServer } from "./sub-servers/scheduling";
export { leadsServer } from "./sub-servers/leads";

/**
 * Initialize all specialized MCP sub-servers and register them with the gateway
 */
export async function initAdminMcp() {
  try {
    Logger.info("Starting specialized MCP sub-servers...");
    
    // In a real environment, these might be separate processes, 
    // but here we register them directly for the Hybrid Agent-as-Tools pattern
    await adminGateway.registerSubServer("customers", customersServer as any);
    await adminGateway.registerSubServer("jobs", jobsServer as any);
    await adminGateway.registerSubServer("scheduling", schedulingServer as any);
    await adminGateway.registerSubServer("leads", leadsServer as any);
    
    Logger.info("Admin MCP Gateway initialization complete");
    return adminGateway;
  } catch (error: any) {
    Logger.error("Failed to initialize Admin MCP:", { error: error.message });
    throw error;
  }
}
