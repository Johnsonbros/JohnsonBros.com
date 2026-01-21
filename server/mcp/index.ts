import { customersServer } from "./sub-servers/customers";
import { jobsServer } from "./sub-servers/jobs";
import { schedulingServer } from "./sub-servers/scheduling";
import { leadsServer } from "./sub-servers/leads";
import { adminGateway } from "./adminGateway";
import { Logger } from "../src/logger";

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
    
    // Add more sub-servers as they are implemented...
    
    Logger.info("Admin MCP Gateway initialization complete");
    return adminGateway;
  } catch (error: any) {
    Logger.error("Failed to initialize Admin MCP:", { error: error.message });
    throw error;
  }
}
