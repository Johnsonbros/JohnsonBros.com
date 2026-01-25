import { Logger } from '../src/logger';
import { sendSMS } from './twilio';
import { db } from '../db';
import os from 'os';
import { ZEKE_IDENTITY } from '../../config/zeke';
import { dbStorage } from '../dbStorage';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const ADMIN_PHONE = process.env.ADMIN_PHONE_NUMBER;

export function isAdminPhone(phone: string): boolean {
  if (!ADMIN_PHONE) {
    Logger.debug('[Admin SMS] No ADMIN_PHONE_NUMBER configured');
    return false;
  }
  const normalizedIncoming = phone.replace(/\D/g, '');
  const normalizedAdmin = ADMIN_PHONE.replace(/\D/g, '');
  const isMatch = normalizedIncoming === normalizedAdmin || 
         normalizedIncoming.endsWith(normalizedAdmin) ||
         normalizedAdmin.endsWith(normalizedIncoming);
  
  if (isMatch) {
    Logger.info(`[ZEKE] Admin phone recognized for ${ZEKE_IDENTITY.name}`);
  }
  
  return isMatch;
}

interface AdminCommandResult {
  message: string;
  success: boolean;
}

const ADMIN_COMMANDS: Record<string, {
  description: string;
  handler: (args: string[]) => Promise<AdminCommandResult>;
}> = {
  'help': {
    description: 'Show available commands',
    handler: async () => {
      const commandList = Object.entries(ADMIN_COMMANDS)
        .map(([cmd, { description }]) => `${cmd} - ${description}`)
        .join('\n');
      return {
        message: `ADMIN COMMANDS:\n${commandList}`,
        success: true
      };
    }
  },
  'status': {
    description: 'Get system status',
    handler: async () => {
      const uptime = process.uptime();
      const hours = Math.floor(uptime / 3600);
      const mins = Math.floor((uptime % 3600) / 60);
      const memUsage = process.memoryUsage();
      const memMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      const memTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
      
      let dbStatus = 'Unknown';
      try {
        await db.execute('SELECT 1');
        dbStatus = 'Connected';
      } catch {
        dbStatus = 'Disconnected';
      }
      
      return {
        message: `SYSTEM STATUS\nUptime: ${hours}h ${mins}m\nMemory: ${memMB}/${memTotalMB} MB\nDB: ${dbStatus}\nNode: ${process.version}\nCPUs: ${os.cpus().length}`,
        success: true
      };
    }
  },
  'health': {
    description: 'Check service health',
    handler: async () => {
      const checks: string[] = [];
      
      try {
        await db.execute('SELECT 1');
        checks.push('DB: OK');
      } catch {
        checks.push('DB: FAIL');
      }
      
      checks.push(`Twilio: ${process.env.TWILIO_ACCOUNT_SID ? 'Configured' : 'Missing'}`);
      checks.push(`HCP API: ${process.env.HOUSECALL_PRO_API_KEY ? 'Configured' : 'Missing'}`);
      checks.push(`OpenAI: ${process.env.OPENAI_API_KEY ? 'Configured' : 'Missing'}`);
      
      return {
        message: `HEALTH CHECK\n${checks.join('\n')}`,
        success: true
      };
    }
  },
  'errors': {
    description: 'Get recent errors',
    handler: async () => {
      const recentErrors = errorLog.slice(-5);
      if (recentErrors.length === 0) {
        return { message: 'No recent errors logged.', success: true };
      }
      const formatted = recentErrors.map((e, i) => 
        `${i + 1}. ${e.timestamp}: ${e.message.substring(0, 80)}`
      ).join('\n');
      return { message: `RECENT ERRORS:\n${formatted}`, success: true };
    }
  },
  'clear': {
    description: 'Clear error log',
    handler: async () => {
      errorLog.length = 0;
      return { message: 'Error log cleared.', success: true };
    }
  },
  'ping': {
    description: 'Test connectivity',
    handler: async () => {
      return { message: 'PONG! System is responsive.', success: true };
    }
  },
  'env': {
    description: 'Show environment info',
    handler: async () => {
      const env = process.env.NODE_ENV || 'development';
      const site = process.env.SITE_URL || 'Not set';
      return {
        message: `ENVIRONMENT\nMode: ${env}\nSite: ${site}\nPort: ${process.env.PORT || 5000}`,
        success: true
      };
    }
  },
  'db': {
    description: 'Database stats',
    handler: async () => {
      try {
        const tables = await db.execute(`
          SELECT table_name, 
                 pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          ORDER BY pg_total_relation_size(quote_ident(table_name)) DESC
          LIMIT 5
        `);
        const tableList = tables.rows.map((t: any) => 
          `${t.table_name}: ${t.size}`
        ).join('\n');
        return { message: `TOP TABLES:\n${tableList}`, success: true };
      } catch (error: any) {
        return { message: `DB Error: ${error.message}`, success: false };
      }
    }
  },
  'blog': {
    description: 'Manage blog drafts (Jessica Agent)',
    handler: async (args: string[]) => {
      if (args.length === 0) {
        const drafts = await dbStorage.getAllBlogPosts('draft', 10, 0);
        if (drafts.length === 0) return { message: 'No active blog drafts.', success: true };
        const list = drafts.slice(0, 5).map((d: { title: string }) => `• ${d.title}`).join('\n');
        return { message: `CURRENT DRAFTS:\n${list}\n\nReply with "blog [title] feedback" to refine.`, success: true };
      }
      return { message: 'Blog command usage: blog [topic] [feedback]', success: true };
    }
  }
};

const errorLog: { timestamp: string; message: string; context?: any }[] = [];
const MAX_ERROR_LOG = 50;

export function logAdminError(message: string, context?: any): void {
  const entry = {
    timestamp: new Date().toISOString().split('T')[1].split('.')[0],
    message,
    context
  };
  errorLog.push(entry);
  if (errorLog.length > MAX_ERROR_LOG) {
    errorLog.shift();
  }
}

export async function processAdminMessage(body: string): Promise<string> {
  const normalizedBody = body.trim();
  const parts = normalizedBody.toLowerCase().split(/\s+/);
  const command = parts[0];
  const args = parts.slice(1);
  
  Logger.info('[Admin SMS] Processing command', { command, args });
  
  // Blog Feedback Loop (Jessica Agent)
  if (normalizedBody.toLowerCase().includes('feedback') || command === 'blog') {
    const drafts = await dbStorage.getAllBlogPosts('draft', 10, 0);
    // Simple heuristic: find the draft mentioned or the most recent
    const targetDraft = drafts.find((d: { title: string }) => normalizedBody.toLowerCase().includes(d.title.toLowerCase().substring(0, 10))) || drafts[0];
    
    if (targetDraft) {
      Logger.info(`[Jessica] Processing feedback for draft: ${targetDraft.title}`);
      
      const prompt = `You are Jessica, the PR/Social Media Agent for Johnson Bros. Plumbing. 
      You are refining a blog post draft based on Co-Founder feedback.
      
      Original Title: ${targetDraft.title}
      Feedback: "${normalizedBody}"
      
      Current Content: ${targetDraft.content.substring(0, 500)}...
      
      Provide an updated HTML content and Title based on the feedback. 
      Format: JSON with 'title' and 'content'.`;

      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "system", content: prompt }],
        response_format: { type: "json_object" }
      });

      const updated = JSON.parse(aiResponse.choices[0].message.content || '{}');
      await dbStorage.updateBlogPost(targetDraft.id, {
        title: updated.title,
        content: updated.content
      });

      return `✨ Jessica here! I've updated the draft "${updated.title}" based on your feedback. Check it out at the dashboard link. Anything else?`;
    }
  }

  const handler = ADMIN_COMMANDS[command];
  if (handler) {
    try {
      const result = await handler.handler(args);
      return result.message;
    } catch (error: any) {
      Logger.error('[Admin SMS] Command error', { command, error: error.message });
      return `Command failed: ${error.message}`;
    }
  }
  
  return `Unknown command: ${command}\nText "help" for available commands.`;
}

export async function sendAdminNotification(
  message: string, 
  priority: 'low' | 'normal' | 'high' = 'normal'
): Promise<boolean> {
  if (!ADMIN_PHONE) {
    Logger.warn('[Admin] No admin phone configured for notifications');
    return false;
  }
  
  try {
    const prefix = priority === 'high' ? '🚨 ALERT: ' : 
                   priority === 'low' ? 'ℹ️ ' : '';
    await sendSMS(ADMIN_PHONE, `${prefix}${message}`);
    Logger.info('[Admin] Notification sent', { priority, message: message.substring(0, 50) });
    return true;
  } catch (error: any) {
    Logger.error('[Admin] Failed to send notification', { error: error.message });
    return false;
  }
}

export async function notifyAdminOnError(error: Error, context?: string): Promise<void> {
  logAdminError(error.message, context);
  
  if (errorLog.length % 5 === 0) {
    await sendAdminNotification(
      `System has logged ${errorLog.length} errors. Latest: ${error.message.substring(0, 100)}`,
      'high'
    );
  }
}

export { ADMIN_COMMANDS };
