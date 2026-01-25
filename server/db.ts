import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

// Graceful shutdown function for database pool
export async function shutdownDatabase(): Promise<void> {
  try {
    await pool.end();
    console.log('[Database] Connection pool closed gracefully');
  } catch (error) {
    console.error('[Database] Error closing connection pool:', error);
  }
}