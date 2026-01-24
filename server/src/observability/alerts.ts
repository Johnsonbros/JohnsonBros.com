/**
 * Alerting System
 *
 * Provides:
 * - Multi-channel alert delivery (Console, Slack, Email)
 * - Alert deduplication and throttling
 * - Configurable thresholds
 * - Alert history tracking
 * - Automatic threshold monitoring
 */

import { Logger } from '../logger';
import { getMetrics } from './metrics';
import { getUptimeStats, createIncident } from './uptime';

// Types
export type AlertLevel = 'info' | 'warning' | 'error' | 'critical';

export interface Alert {
  id: string;
  level: AlertLevel;
  type: string;
  message: string;
  context?: Record<string, unknown>;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  channels: string[];
  dedupeKey: string;
}

export interface AlertThresholds {
  errorRatePercent: number;       // Error rate threshold (default: 10%)
  slowResponseTimeP95Ms: number;  // P95 response time (default: 2000ms)
  memoryUsagePercent: number;     // Memory usage (default: 85%)
  diskUsagePercent: number;       // Disk usage (default: 90%)
  externalApiFailureCount: number; // External API failures in window (default: 5)
  dbConnectionFailures: number;   // DB connection failures (default: 3)
}

export const defaultThresholds: AlertThresholds = {
  errorRatePercent: 10,
  slowResponseTimeP95Ms: 2000,
  memoryUsagePercent: 85,
  diskUsagePercent: 90,
  externalApiFailureCount: 5,
  dbConnectionFailures: 3,
};

// Internal state
const alerts: Alert[] = [];
const lastAlertTime: Map<string, number> = new Map();
const MAX_ALERTS = 500;
const throttleMinutes = parseInt(process.env.ALERT_THROTTLE_MINUTES || '5', 10);
const THROTTLE_MS = throttleMinutes * 60 * 1000;

// Alert channels
interface SlackAttachment {
  color: string;
  title: string;
  text: string;
  fields: { title: string; value: string; short: boolean }[];
  footer: string;
  ts: number;
}

const LEVEL_COLORS: Record<AlertLevel, string> = {
  info: '#36a64f',     // green
  warning: '#ffcc00',  // yellow
  error: '#ff6600',    // orange
  critical: '#ff0000', // red
};

const LEVEL_EMOJIS: Record<AlertLevel, string> = {
  info: 'information_source',
  warning: 'warning',
  error: 'x',
  critical: 'rotating_light',
};

/**
 * Generate a deduplication key for an alert
 */
function generateDedupeKey(level: AlertLevel, type: string, message: string): string {
  return `${level}:${type}:${message.substring(0, 100)}`;
}

/**
 * Check if an alert should be throttled
 */
function shouldThrottle(dedupeKey: string): boolean {
  const lastTime = lastAlertTime.get(dedupeKey);
  if (!lastTime) return false;

  return Date.now() - lastTime < THROTTLE_MS;
}

/**
 * Send alert to Slack
 */
async function sendSlackAlert(alert: Alert): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return false;

  const attachment: SlackAttachment = {
    color: LEVEL_COLORS[alert.level],
    title: `:${LEVEL_EMOJIS[alert.level]}: ${alert.type}`,
    text: alert.message,
    fields: [
      {
        title: 'Environment',
        value: process.env.NODE_ENV || 'development',
        short: true,
      },
      {
        title: 'Time',
        value: alert.timestamp.toISOString(),
        short: true,
      },
    ],
    footer: 'Johnson Bros Monitoring',
    ts: Math.floor(alert.timestamp.getTime() / 1000),
  };

  // Add context fields
  if (alert.context) {
    for (const [key, value] of Object.entries(alert.context)) {
      if (typeof value === 'string' || typeof value === 'number') {
        attachment.fields.push({
          title: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
          value: String(value),
          short: true,
        });
      }
    }
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attachments: [attachment] }),
    });

    if (!response.ok) {
      Logger.error('Failed to send Slack alert', {
        status: response.status,
        alertId: alert.id,
      });
      return false;
    }

    return true;
  } catch (error) {
    Logger.error('Slack alert error', {
      error: error instanceof Error ? error.message : String(error),
      alertId: alert.id,
    });
    return false;
  }
}

/**
 * Send alert via email using Twilio SendGrid
 */
async function sendEmailAlert(alert: Alert): Promise<boolean> {
  const emailTo = process.env.ALERT_EMAIL_TO;
  if (!emailTo) return false;

  // Only send email for critical alerts
  if (alert.level !== 'critical') return false;

  try {
    // Use Twilio SendGrid API through the Twilio SDK
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    if (!sendgridApiKey) {
      Logger.warn('SendGrid API key not configured for email alerts', { alertId: alert.id });
      return false;
    }

    // Build the email content
    const subject = `[CRITICAL] ${alert.type} - Johnson Bros Monitoring`;
    const htmlContent = formatEmailBody(alert);

    // Send email using SendGrid API directly
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: emailTo }],
            subject: subject,
          },
        ],
        from: {
          email: process.env.ALERT_EMAIL_FROM || 'alerts@johnsonbrosplumbing.com',
          name: 'Johnson Bros Monitoring',
        },
        content: [
          {
            type: 'text/html',
            value: htmlContent,
          },
          {
            type: 'text/plain',
            value: formatPlainTextBody(alert),
          },
        ],
        replyTo: {
          email: process.env.ALERT_REPLY_TO || 'admin@johnsonbrosplumbing.com',
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      Logger.error('Failed to send email alert via SendGrid', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        alertId: alert.id,
      });
      return false;
    }

    Logger.info('Email alert sent successfully', {
      to: emailTo,
      subject,
      alertId: alert.id,
    });

    return true;
  } catch (error) {
    Logger.error('Email alert error', {
      error: error instanceof Error ? error.message : String(error),
      alertId: alert.id,
    });
    return false;
  }
}

/**
 * Format alert data as HTML email body
 */
function formatEmailBody(alert: Alert): string {
  const levelColor = LEVEL_COLORS[alert.level];
  const timestamp = alert.timestamp.toISOString();

  let contextHtml = '';
  if (alert.context) {
    contextHtml = '<tr><td colspan="2"><strong>Context:</strong></td></tr>';
    for (const [key, value] of Object.entries(alert.context)) {
      if (typeof value === 'string' || typeof value === 'number') {
        const displayKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
        contextHtml += `
          <tr>
            <td style="padding: 5px; text-align: right;"><strong>${displayKey}:</strong></td>
            <td style="padding: 5px;">${String(value)}</td>
          </tr>
        `;
      }
    }
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
          .header { background-color: ${levelColor}; color: white; padding: 20px; border-radius: 4px; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 24px; }
          .header p { margin: 5px 0 0 0; opacity: 0.9; }
          .content { background: white; padding: 20px; border-radius: 4px; margin-bottom: 20px; }
          .content h2 { color: ${levelColor}; margin-top: 0; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          td { padding: 8px; border-bottom: 1px solid #eee; }
          .footer { text-align: center; color: #666; font-size: 12px; }
          .alert-level { display: inline-block; padding: 2px 8px; background-color: ${levelColor}; color: white; border-radius: 3px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Critical Alert: ${alert.type}</h1>
            <p>Johnson Bros Monitoring System</p>
          </div>

          <div class="content">
            <h2>Alert Details</h2>
            <table>
              <tr>
                <td style="text-align: right;"><strong>Level:</strong></td>
                <td><span class="alert-level">${alert.level.toUpperCase()}</span></td>
              </tr>
              <tr>
                <td style="text-align: right;"><strong>Time:</strong></td>
                <td>${timestamp}</td>
              </tr>
              <tr>
                <td style="text-align: right;"><strong>Environment:</strong></td>
                <td>${process.env.NODE_ENV || 'production'}</td>
              </tr>
              <tr>
                <td colspan="2"><strong>Message:</strong></td>
              </tr>
              <tr>
                <td colspan="2" style="background-color: #f9f9f9; padding: 10px;">${alert.message}</td>
              </tr>
              ${contextHtml}
            </table>

            <div style="margin-top: 20px; padding: 15px; background-color: #f0f0f0; border-left: 4px solid ${levelColor}; border-radius: 3px;">
              <p style="margin: 0; font-size: 13px;"><strong>Alert ID:</strong> ${alert.id}</p>
              <p style="margin: 5px 0 0 0; font-size: 13px;"><strong>Channels:</strong> ${alert.channels.join(', ')}</p>
            </div>
          </div>

          <div class="footer">
            <p>This is an automated alert from Johnson Bros Monitoring System.</p>
            <p>Please do not reply to this email. Contact admin@johnsonbrosplumbing.com for support.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Format alert data as plain text email body
 */
function formatPlainTextBody(alert: Alert): string {
  const timestamp = alert.timestamp.toISOString();
  const environment = process.env.NODE_ENV || 'production';

  let contextText = '';
  if (alert.context) {
    contextText = '\nContext:\n';
    for (const [key, value] of Object.entries(alert.context)) {
      if (typeof value === 'string' || typeof value === 'number') {
        const displayKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
        contextText += `  ${displayKey}: ${String(value)}\n`;
      }
    }
  }

  return `
CRITICAL ALERT FROM JOHNSON BROS MONITORING SYSTEM
====================================================

Alert Type: ${alert.type}
Level: ${alert.level.toUpperCase()}
Time: ${timestamp}
Environment: ${environment}

Message:
${alert.message}
${contextText}

Alert ID: ${alert.id}
Channels: ${alert.channels.join(', ')}

====================================================
This is an automated alert. Please do not reply to this email.
Contact admin@johnsonbrosplumbing.com for support.
  `.trim();
}

/**
 * Log alert to console
 */
function logAlert(alert: Alert): void {
  const logMethod = alert.level === 'error' || alert.level === 'critical' ? 'error' : 'warn';
  Logger[logMethod](`[ALERT] ${alert.type}: ${alert.message}`, {
    alertId: alert.id,
    level: alert.level,
    ...alert.context,
  });
}

/**
 * Send an alert through all configured channels
 */
export async function sendAlert(
  level: AlertLevel,
  type: string,
  message: string,
  context?: Record<string, unknown>
): Promise<void> {
  const dedupeKey = generateDedupeKey(level, type, message);

  // Check throttling
  if (shouldThrottle(dedupeKey)) {
    Logger.debug('Alert throttled', { dedupeKey, type, level });
    return;
  }

  // Create alert record
  const alert: Alert = {
    id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    level,
    type,
    message,
    context,
    timestamp: new Date(),
    acknowledged: false,
    channels: ['console'],
    dedupeKey,
  };

  // Always log to console
  logAlert(alert);

  // Send to Slack (warning and above)
  if (level !== 'info' && process.env.SLACK_WEBHOOK_URL) {
    const slackSent = await sendSlackAlert(alert);
    if (slackSent) alert.channels.push('slack');
  }

  // Send email for critical
  if (level === 'critical' && process.env.ALERT_EMAIL_TO) {
    const emailSent = await sendEmailAlert(alert);
    if (emailSent) alert.channels.push('email');
  }

  // Store alert
  alerts.unshift(alert);
  while (alerts.length > MAX_ALERTS) {
    alerts.pop();
  }

  // Update throttle timestamp
  lastAlertTime.set(dedupeKey, Date.now());

  // Create incident for critical alerts
  if (level === 'critical') {
    createIncident('error_spike', `${type}: ${message}`);
  }
}

/**
 * Acknowledge an alert
 */
export function acknowledgeAlert(alertId: string, acknowledgedBy?: string): boolean {
  const alert = alerts.find(a => a.id === alertId);
  if (!alert || alert.acknowledged) return false;

  alert.acknowledged = true;
  alert.acknowledgedAt = new Date();
  alert.acknowledgedBy = acknowledgedBy;

  Logger.info('Alert acknowledged', { alertId, acknowledgedBy });
  return true;
}

/**
 * Get alert history
 */
export function getAlertHistory(limit = 50): Alert[] {
  return alerts.slice(0, limit);
}

/**
 * Get unacknowledged alerts
 */
export function getUnacknowledgedAlerts(): Alert[] {
  return alerts.filter(a => !a.acknowledged);
}

// Threshold monitoring
let monitoringInterval: NodeJS.Timeout | null = null;
let currentThresholds: AlertThresholds = { ...defaultThresholds };

/**
 * Update alert thresholds
 */
export function updateThresholds(thresholds: Partial<AlertThresholds>): void {
  currentThresholds = { ...currentThresholds, ...thresholds };
  Logger.info('Alert thresholds updated', { thresholds: currentThresholds });
}

/**
 * Get current thresholds
 */
export function getThresholds(): AlertThresholds {
  return { ...currentThresholds };
}

/**
 * Check thresholds and send alerts
 */
async function checkThresholds(): Promise<void> {
  try {
    const metrics = getMetrics();
    const uptime = getUptimeStats();

    // Check error rate
    const errorRatePercent = metrics.requests.errorRate * 100;
    if (errorRatePercent > currentThresholds.errorRatePercent) {
      await sendAlert('error', 'High Error Rate Detected',
        `Error rate: ${errorRatePercent.toFixed(2)}% (threshold: ${currentThresholds.errorRatePercent}%)`,
        { errorRate: errorRatePercent, threshold: currentThresholds.errorRatePercent }
      );
    }

    // Check response time
    if (metrics.requests.p95DurationMs > currentThresholds.slowResponseTimeP95Ms) {
      await sendAlert('warning', 'Slow Response Times Detected',
        `P95 response time: ${metrics.requests.p95DurationMs.toFixed(0)}ms (threshold: ${currentThresholds.slowResponseTimeP95Ms}ms)`,
        { p95Ms: metrics.requests.p95DurationMs, threshold: currentThresholds.slowResponseTimeP95Ms }
      );
    }

    // Check memory usage
    const memoryUsagePercent = (metrics.memory.heapUsedMb / metrics.memory.heapTotalMb) * 100;
    if (memoryUsagePercent > currentThresholds.memoryUsagePercent) {
      const level: AlertLevel = memoryUsagePercent > 95 ? 'critical' : 'warning';
      await sendAlert(level, 'High Memory Usage',
        `Memory usage: ${memoryUsagePercent.toFixed(1)}% (threshold: ${currentThresholds.memoryUsagePercent}%)`,
        {
          usagePercent: memoryUsagePercent,
          heapUsedMb: metrics.memory.heapUsedMb.toFixed(2),
          heapTotalMb: metrics.memory.heapTotalMb.toFixed(2),
        }
      );
    }

    // Check uptime status
    if (uptime.currentStatus === 'unhealthy') {
      await sendAlert('critical', 'System Unhealthy',
        'Multiple health checks are failing',
        { status: uptime.currentStatus, incidentCount: uptime.incidentCount }
      );
    } else if (uptime.currentStatus === 'degraded') {
      await sendAlert('warning', 'System Degraded',
        'Some health checks are failing',
        { status: uptime.currentStatus }
      );
    }

    // Check disk usage (if available)
    try {
      const { execSync } = require('child_process');
      const output = execSync('df -h / | tail -1', { encoding: 'utf-8' });
      const parts = output.trim().split(/\s+/);
      const diskUsage = parseInt(parts[4].replace('%', ''), 10);

      if (diskUsage > currentThresholds.diskUsagePercent) {
        const level: AlertLevel = diskUsage > 95 ? 'critical' : 'error';
        await sendAlert(level, 'High Disk Usage',
          `Disk usage: ${diskUsage}% (threshold: ${currentThresholds.diskUsagePercent}%)`,
          { diskUsage, threshold: currentThresholds.diskUsagePercent }
        );
      }
    } catch {
      // Disk check not available on all platforms
    }

  } catch (error) {
    Logger.error('Threshold check error', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Start automatic threshold monitoring
 */
export function startAlertMonitor(intervalMs = 60000): void {
  if (monitoringInterval) return;

  // Run initial check
  checkThresholds();

  monitoringInterval = setInterval(checkThresholds, intervalMs);
  Logger.info('Alert monitoring started', { intervalMs });
}

/**
 * Stop threshold monitoring
 */
export function stopAlertMonitor(): void {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }
}

// Export thresholds for external configuration
export { defaultThresholds as AlertThresholds };
