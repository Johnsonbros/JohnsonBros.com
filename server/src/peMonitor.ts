/**
 * PE Acquisition Monitor
 *
 * Monitors for private equity acquisitions in the Massachusetts plumbing/HVAC market.
 * Creates alerts when new activity is detected.
 */

import { db } from '../db';
import {
  competitorAlerts,
  peActivityLog,
  competitors,
  type InsertCompetitorAlert,
  type InsertPeActivityLog,
} from '@shared/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import pino from 'pino';

const logger = pino({ name: 'pe-monitor' });

// Known PE companies to monitor
const PE_COMPANIES_TO_WATCH = [
  'Goldman Sachs',
  'Sila',
  'Sila Services',
  'New Mountain Capital',
  'HomeX',
  'GEM Plumbing',
  'Wrench Group',
  'Apex Service Partners',
  'Redwood Services',
  'Heritage Holding',
  'Investcorp',
  'Morgan Stanley',
  'Alpine Investors',
  'Leonard Green',
  'Roark Capital',
];

// Massachusetts/New England locations to watch
const LOCATIONS_TO_WATCH = [
  'Massachusetts',
  'Boston',
  'Quincy',
  'Abington',
  'Weymouth',
  'Braintree',
  'South Shore',
  'Plymouth',
  'Norfolk County',
  'Plymouth County',
  'New England',
  'Rhode Island', // GEM is RI-based
];

// Keywords that indicate acquisitions
const ACQUISITION_KEYWORDS = [
  'acquires',
  'acquisition',
  'acquired',
  'buys',
  'purchases',
  'merges',
  'merger',
  'partners with',
  'investment in',
  'portfolio company',
  'platform acquisition',
  'add-on acquisition',
  'tuck-in',
];

/**
 * Search terms for monitoring PE activity
 */
export function getSearchQueries(): string[] {
  const queries: string[] = [];

  // PE company + Massachusetts
  for (const pe of PE_COMPANIES_TO_WATCH.slice(0, 5)) {
    queries.push(`"${pe}" plumbing Massachusetts acquisition 2025 2026`);
  }

  // Generic PE + location queries
  queries.push('private equity plumbing HVAC Massachusetts acquisition 2025 2026');
  queries.push('private equity home services Boston acquisition');
  queries.push('plumbing company acquired Massachusetts');
  queries.push('HVAC acquisition South Shore Massachusetts');

  return queries;
}

/**
 * Create an alert for PE activity
 */
export async function createPeAlert(data: {
  title: string;
  summary: string;
  peCompany?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  sourceUrl?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const alert: InsertCompetitorAlert = {
      alertType: 'pe_acquisition',
      severity: data.severity,
      title: data.title,
      summary: data.summary,
      peCompany: data.peCompany,
      sourceUrl: data.sourceUrl,
      metadata: data.metadata,
    };

    await db.insert(competitorAlerts).values(alert);
    logger.info({ title: data.title, severity: data.severity }, 'Created PE alert');

    // If critical, also log to PE activity
    if (data.severity === 'critical' || data.severity === 'high') {
      const peLog: InsertPeActivityLog = {
        peCompany: data.peCompany || 'Unknown PE',
        activityType: 'acquisition',
        summary: data.summary,
        sourceUrl: data.sourceUrl,
        threatLevel: data.severity,
        metadata: data.metadata,
      };
      await db.insert(peActivityLog).values(peLog);
    }
  } catch (error) {
    logger.error({ error, data }, 'Failed to create PE alert');
  }
}

/**
 * Analyze text for PE acquisition signals
 */
export function analyzeForPeActivity(text: string): {
  isPeRelated: boolean;
  peCompany: string | null;
  location: string | null;
  isAcquisition: boolean;
  confidence: number;
} {
  const lowerText = text.toLowerCase();

  // Check for PE company mentions
  let peCompany: string | null = null;
  for (const pe of PE_COMPANIES_TO_WATCH) {
    if (lowerText.includes(pe.toLowerCase())) {
      peCompany = pe;
      break;
    }
  }

  // Check for location mentions
  let location: string | null = null;
  for (const loc of LOCATIONS_TO_WATCH) {
    if (lowerText.includes(loc.toLowerCase())) {
      location = loc;
      break;
    }
  }

  // Check for acquisition keywords
  let isAcquisition = false;
  for (const keyword of ACQUISITION_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      isAcquisition = true;
      break;
    }
  }

  // Check for plumbing/HVAC industry
  const isIndustryRelated =
    lowerText.includes('plumbing') ||
    lowerText.includes('hvac') ||
    lowerText.includes('heating') ||
    lowerText.includes('cooling') ||
    lowerText.includes('drain') ||
    lowerText.includes('home services');

  const isPeRelated = (peCompany !== null || lowerText.includes('private equity')) && isIndustryRelated;

  // Calculate confidence
  let confidence = 0;
  if (peCompany) confidence += 30;
  if (location) confidence += 25;
  if (isAcquisition) confidence += 25;
  if (isIndustryRelated) confidence += 20;

  return {
    isPeRelated,
    peCompany,
    location,
    isAcquisition,
    confidence,
  };
}

/**
 * Determine severity based on analysis
 */
export function determineSeverity(analysis: ReturnType<typeof analyzeForPeActivity>): 'low' | 'medium' | 'high' | 'critical' {
  const { location, confidence } = analysis;

  // Critical: Direct South Shore threat
  const criticalLocations = ['Quincy', 'Abington', 'Weymouth', 'Braintree', 'South Shore'];
  if (criticalLocations.some(loc => location?.toLowerCase().includes(loc.toLowerCase()))) {
    return 'critical';
  }

  // High: Massachusetts/Boston area
  if (location?.toLowerCase().includes('massachusetts') || location?.toLowerCase().includes('boston')) {
    return 'high';
  }

  // Medium: New England
  if (location?.toLowerCase().includes('new england') || location?.toLowerCase().includes('rhode island')) {
    return 'medium';
  }

  // Based on confidence
  if (confidence >= 80) return 'high';
  if (confidence >= 50) return 'medium';
  return 'low';
}

/**
 * Get unread alerts
 */
export async function getUnreadAlerts() {
  return db.select()
    .from(competitorAlerts)
    .where(eq(competitorAlerts.isRead, false))
    .orderBy(desc(competitorAlerts.createdAt));
}

/**
 * Get critical alerts from last N days
 */
export async function getCriticalAlerts(days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  return db.select()
    .from(competitorAlerts)
    .where(and(
      eq(competitorAlerts.severity, 'critical'),
      gte(competitorAlerts.createdAt, since)
    ))
    .orderBy(desc(competitorAlerts.createdAt));
}

/**
 * Mark alert as read
 */
export async function markAlertRead(alertId: number) {
  await db.update(competitorAlerts)
    .set({ isRead: true })
    .where(eq(competitorAlerts.id, alertId));
}

/**
 * Acknowledge alert
 */
export async function acknowledgeAlert(alertId: number, acknowledgedBy: string) {
  await db.update(competitorAlerts)
    .set({
      isAcknowledged: true,
      acknowledgedBy,
      acknowledgedAt: new Date(),
    })
    .where(eq(competitorAlerts.id, alertId));
}

/**
 * Get alert statistics
 */
export async function getAlertStats() {
  const [unread, critical, allAlerts] = await Promise.all([
    getUnreadAlerts(),
    getCriticalAlerts(30),
    db.select().from(competitorAlerts).orderBy(desc(competitorAlerts.createdAt)).limit(100),
  ]);

  return {
    unreadCount: unread.length,
    criticalCount: critical.length,
    recentAlerts: allAlerts.slice(0, 10),
    bySeverity: {
      critical: allAlerts.filter(a => a.severity === 'critical').length,
      high: allAlerts.filter(a => a.severity === 'high').length,
      medium: allAlerts.filter(a => a.severity === 'medium').length,
      low: allAlerts.filter(a => a.severity === 'low').length,
    },
  };
}

/**
 * Manual check for PE activity (can be called via API or cron)
 * This would typically integrate with a news API or web scraping service
 */
export async function runPeMonitorCheck(): Promise<{
  checked: number;
  alertsCreated: number;
  queries: string[];
}> {
  const queries = getSearchQueries();

  logger.info({ queryCount: queries.length }, 'Starting PE monitor check');

  // In a production system, this would:
  // 1. Call a news API (Google News, Bing News, PR Newswire)
  // 2. Scrape PE industry sites (PEHub, Pitchbook)
  // 3. Check specific PE company press releases

  // For now, we'll return the queries that should be monitored
  // The actual monitoring can be done via:
  // - A scheduled job that calls external APIs
  // - Manual checks through the admin dashboard
  // - Integration with a news monitoring service

  return {
    checked: queries.length,
    alertsCreated: 0,
    queries,
  };
}

/**
 * Process a news item and create alert if relevant
 */
export async function processNewsItem(item: {
  title: string;
  description: string;
  url: string;
  publishedAt?: Date;
}): Promise<boolean> {
  const fullText = `${item.title} ${item.description}`;
  const analysis = analyzeForPeActivity(fullText);

  if (analysis.isPeRelated && analysis.isAcquisition && analysis.confidence >= 50) {
    const severity = determineSeverity(analysis);

    await createPeAlert({
      title: item.title,
      summary: item.description,
      peCompany: analysis.peCompany || undefined,
      severity,
      sourceUrl: item.url,
      metadata: {
        analysis,
        publishedAt: item.publishedAt,
      },
    });

    logger.info({
      title: item.title,
      severity,
      confidence: analysis.confidence,
    }, 'Created alert from news item');

    return true;
  }

  return false;
}

/**
 * Create test alerts for demonstration
 */
export async function createTestAlerts(): Promise<number> {
  const testAlerts: InsertCompetitorAlert[] = [
    {
      alertType: 'pe_acquisition',
      severity: 'critical',
      title: 'GEM Plumbing Opens New Quincy Location',
      summary: 'GEM Plumbing & Heating (HomeX/New Mountain Capital) has announced plans to open a new service center in Quincy, MA, directly competing with local plumbers.',
      peCompany: 'New Mountain Capital',
      isRead: false,
    },
    {
      alertType: 'pe_acquisition',
      severity: 'high',
      title: 'Sila Services Acquires South Shore HVAC Company',
      summary: 'Goldman Sachs-backed Sila Services has acquired another HVAC company in the South Shore region, expanding their footprint in Norfolk County.',
      peCompany: 'Goldman Sachs',
      isRead: false,
    },
    {
      alertType: 'expansion',
      severity: 'medium',
      title: 'Wrench Group Exploring Boston Market Entry',
      summary: 'Sources indicate Wrench Group, operating 25 brands nationwide, is actively looking at acquisition targets in the Greater Boston area.',
      peCompany: 'Wrench Group',
      isRead: false,
    },
  ];

  for (const alert of testAlerts) {
    await db.insert(competitorAlerts).values(alert);
  }

  logger.info({ count: testAlerts.length }, 'Created test alerts');
  return testAlerts.length;
}
