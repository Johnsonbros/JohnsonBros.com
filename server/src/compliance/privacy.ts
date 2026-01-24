/**
 * Privacy Compliance Utilities
 *
 * Implements GDPR/CCPA compliance features:
 * - Data export (right to access)
 * - Data deletion (right to be forgotten)
 * - Data summary
 */

import type { Request, Response, NextFunction, Router as ExpressRouter } from 'express';
import { Router } from 'express';
import { db } from '../../db';
import {
  customers,
  appointments,
  leads,
  sharedThreadCustomers,
  sharedThreadIdentities,
  sharedThreadMessages,
  sharedThreadThreads,
  cookieConsents,
  dataDeletionRequests,
  conversionEvents,
  microConversions,
  attributionData,
  auditLogs,
} from '@shared/schema';
import { eq, and, or } from 'drizzle-orm';
import { logPrivacyEvent } from '../security/auditLog';

// Data retention period in days
const DATA_RETENTION_DAYS = parseInt(process.env.DATA_RETENTION_DAYS || '365', 10);
const DELETION_GRACE_PERIOD_DAYS = 30;

// User data export structure
export interface UserDataExport {
  exportedAt: string;
  userId: string;
  profile: {
    customer?: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
      createdAt: string;
    } | null;
  };
  bookings: Array<{
    id: number;
    serviceType: string;
    date: string;
    status: string | null;
    createdAt: string;
  }>;
  leads: Array<{
    id: number;
    name: string;
    phone: string;
    email: string | null;
    serviceType: string | null;
    createdAt: string;
  }>;
  messages: Array<{
    channel: string;
    direction: string;
    text: string;
    createdAt: string;
  }>;
  consents: Array<{
    analytics: boolean;
    marketing: boolean;
    consentedAt: string;
    version: string;
  }>;
  dataCategories: string[];
}

// Deletion result structure
export interface DeletionResult {
  success: boolean;
  requestId: string;
  scheduledDeletionDate: string;
  message: string;
}

/**
 * Get user ID from request (authenticated user)
 */
function getUserIdFromRequest(req: Request): string | null {
  const user = (req as Request & { user?: { id: string | number; email?: string } }).user;
  if (user?.id) return String(user.id);
  return null;
}

/**
 * Get user email from request
 */
function getUserEmailFromRequest(req: Request): string | null {
  const user = (req as Request & { user?: { id: string | number; email?: string } }).user;
  return user?.email || null;
}

/**
 * Find all customer records associated with a user
 */
async function findCustomerRecords(userId: string, email: string | null) {
  // Find by customer ID
  const customerById = await db.query.customers.findFirst({
    where: eq(customers.id, parseInt(userId, 10) || 0),
  });

  // Also search by email if available
  let customerByEmail = null;
  if (email) {
    customerByEmail = await db.query.customers.findFirst({
      where: eq(customers.email, email),
    });
  }

  // Return unique customer(s)
  const found = [];
  if (customerById) found.push(customerById);
  if (customerByEmail && customerByEmail.id !== customerById?.id) {
    found.push(customerByEmail);
  }

  return found;
}

/**
 * Export all user data (GDPR Article 20 - Right to Data Portability)
 */
export async function exportUserData(
  userId: string,
  email: string | null
): Promise<UserDataExport> {
  // Find customer records
  const customerRecords = await findCustomerRecords(userId, email);
  const customerIds = customerRecords.map(c => c.id);

  // Get appointments
  const bookings = customerIds.length > 0
    ? await db.query.appointments.findMany({
        where: or(...customerIds.map(id => eq(appointments.customerId, id))),
      })
    : [];

  // Get leads by email
  const leadRecords = email
    ? await db.query.leads.findMany({
        where: eq(leads.email, email),
      })
    : [];

  // Get shared thread data
  let messages: Array<{ channel: string; direction: string; text: string; createdAt: Date }> = [];

  // Find shared thread customer by various identities
  const sharedCustomer = await db.query.sharedThreadIdentities.findFirst({
    where: or(
      email ? eq(sharedThreadIdentities.value, email) : undefined,
      ...customerRecords.map(c => c.phone ? eq(sharedThreadIdentities.value, c.phone) : undefined).filter(Boolean) as any[]
    ),
  });

  if (sharedCustomer) {
    const threads = await db.query.sharedThreadThreads.findMany({
      where: eq(sharedThreadThreads.customerId, sharedCustomer.customerId),
    });

    for (const thread of threads) {
      const threadMessages = await db.query.sharedThreadMessages.findMany({
        where: eq(sharedThreadMessages.threadId, thread.id),
      });
      messages = messages.concat(threadMessages);
    }
  }

  // Get cookie consent records
  const consentRecords = await db.query.cookieConsents.findMany({
    where: or(
      eq(cookieConsents.userId, userId),
    ),
  });

  // Build export
  const dataCategories = [];
  if (customerRecords.length > 0) dataCategories.push('Customer Profile');
  if (bookings.length > 0) dataCategories.push('Booking History');
  if (leadRecords.length > 0) dataCategories.push('Lead Information');
  if (messages.length > 0) dataCategories.push('Communication History');
  if (consentRecords.length > 0) dataCategories.push('Consent Records');

  return {
    exportedAt: new Date().toISOString(),
    userId,
    profile: {
      customer: customerRecords[0] ? {
        id: customerRecords[0].id,
        firstName: customerRecords[0].firstName,
        lastName: customerRecords[0].lastName,
        email: customerRecords[0].email,
        phone: customerRecords[0].phone,
        createdAt: customerRecords[0].createdAt.toISOString(),
      } : null,
    },
    bookings: bookings.map(b => ({
      id: b.id,
      serviceType: b.serviceType,
      date: b.date.toISOString(),
      status: b.status,
      createdAt: b.createdAt.toISOString(),
    })),
    leads: leadRecords.map(l => ({
      id: l.id,
      name: l.name,
      phone: l.phone,
      email: l.email,
      serviceType: l.serviceType,
      createdAt: l.createdAt.toISOString(),
    })),
    messages: messages.map(m => ({
      channel: m.channel,
      direction: m.direction,
      text: m.text,
      createdAt: m.createdAt.toISOString(),
    })),
    consents: consentRecords.map(c => ({
      analytics: c.analytics,
      marketing: c.marketing,
      consentedAt: c.consentedAt.toISOString(),
      version: c.version,
    })),
    dataCategories,
  };
}

/**
 * Request data deletion (GDPR Article 17 - Right to Erasure)
 *
 * Note: This is a soft delete that schedules the actual deletion for 30 days later,
 * allowing the user to cancel the request if needed.
 */
export async function deleteUserData(
  userId: string,
  email: string,
  req: Request
): Promise<DeletionResult> {
  const scheduledDate = new Date();
  scheduledDate.setDate(scheduledDate.getDate() + DELETION_GRACE_PERIOD_DAYS);

  const ip = req.ip || req.socket?.remoteAddress || null;
  const userAgent = req.get('user-agent')?.substring(0, 500) || null;

  // Check if there's already a pending deletion request
  const existingRequest = await db.query.dataDeletionRequests.findFirst({
    where: and(
      eq(dataDeletionRequests.userId, userId),
      eq(dataDeletionRequests.status, 'pending')
    ),
  });

  if (existingRequest) {
    return {
      success: true,
      requestId: existingRequest.id,
      scheduledDeletionDate: existingRequest.scheduledDeletionAt.toISOString(),
      message: 'A deletion request is already pending for your account.',
    };
  }

  // Create deletion request
  const [request] = await db.insert(dataDeletionRequests).values({
    userId,
    email,
    status: 'pending',
    scheduledDeletionAt: scheduledDate,
    ip,
    userAgent,
    metadata: {
      requestedFrom: req.path,
      dataCategoriesToDelete: [
        'Customer Profile',
        'Booking History',
        'Lead Information',
        'Communication History',
        'Consent Records',
        'Analytics Data',
      ],
    },
  }).returning();

  return {
    success: true,
    requestId: request.id,
    scheduledDeletionDate: scheduledDate.toISOString(),
    message: `Your data deletion request has been received. Your data will be permanently deleted on ${scheduledDate.toLocaleDateString()}. You can cancel this request within ${DELETION_GRACE_PERIOD_DAYS} days.`,
  };
}

/**
 * Get data summary (what data we have and why)
 */
export async function getDataSummary(
  userId: string,
  email: string | null
): Promise<{
  categories: Array<{
    name: string;
    description: string;
    recordCount: number;
    purpose: string;
    retention: string;
  }>;
  pendingDeletion: boolean;
  scheduledDeletionDate: string | null;
}> {
  // Find customer records
  const customerRecords = await findCustomerRecords(userId, email);
  const customerIds = customerRecords.map(c => c.id);

  // Count records in each category
  const bookingCount = customerIds.length > 0
    ? (await db.query.appointments.findMany({
        where: or(...customerIds.map(id => eq(appointments.customerId, id))),
      })).length
    : 0;

  const leadCount = email
    ? (await db.query.leads.findMany({ where: eq(leads.email, email) })).length
    : 0;

  // Check for pending deletion
  const pendingDeletion = await db.query.dataDeletionRequests.findFirst({
    where: and(
      eq(dataDeletionRequests.userId, userId),
      eq(dataDeletionRequests.status, 'pending')
    ),
  });

  const categories = [];

  if (customerRecords.length > 0) {
    categories.push({
      name: 'Customer Profile',
      description: 'Your name, email, and phone number',
      recordCount: customerRecords.length,
      purpose: 'To provide plumbing services and communicate with you',
      retention: `${DATA_RETENTION_DAYS} days after last service`,
    });
  }

  if (bookingCount > 0) {
    categories.push({
      name: 'Booking History',
      description: 'Service appointments and scheduling information',
      recordCount: bookingCount,
      purpose: 'To fulfill service requests and maintain service history',
      retention: `${DATA_RETENTION_DAYS} days`,
    });
  }

  if (leadCount > 0) {
    categories.push({
      name: 'Lead Information',
      description: 'Contact form submissions and service inquiries',
      recordCount: leadCount,
      purpose: 'To respond to your inquiries and provide quotes',
      retention: '90 days if not converted to customer',
    });
  }

  categories.push({
    name: 'Communication History',
    description: 'Chat messages, SMS, and voice call records',
    recordCount: 0, // Would need to count from shared thread
    purpose: 'To provide customer support and maintain conversation context',
    retention: `${DATA_RETENTION_DAYS} days`,
  });

  categories.push({
    name: 'Consent Records',
    description: 'Your cookie and privacy preferences',
    recordCount: 1,
    purpose: 'Legal compliance and honoring your privacy choices',
    retention: 'Duration of service relationship',
  });

  return {
    categories,
    pendingDeletion: !!pendingDeletion,
    scheduledDeletionDate: pendingDeletion?.scheduledDeletionAt.toISOString() || null,
  };
}

/**
 * Cancel a pending deletion request
 */
export async function cancelDeletionRequest(
  userId: string
): Promise<{ success: boolean; message: string }> {
  const request = await db.query.dataDeletionRequests.findFirst({
    where: and(
      eq(dataDeletionRequests.userId, userId),
      eq(dataDeletionRequests.status, 'pending')
    ),
  });

  if (!request) {
    return {
      success: false,
      message: 'No pending deletion request found.',
    };
  }

  await db.update(dataDeletionRequests)
    .set({ status: 'cancelled' })
    .where(eq(dataDeletionRequests.id, request.id));

  return {
    success: true,
    message: 'Your data deletion request has been cancelled.',
  };
}

/**
 * Privacy API router
 */
export const privacyRouter: ExpressRouter = Router();

// All privacy routes require authentication
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Authentication required to access privacy features',
        code: 'AUTHENTICATION_REQUIRED',
      },
    });
  }
  next();
};

privacyRouter.use(requireAuth);

// GET /privacy/summary - Get summary of stored data
privacyRouter.get('/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserIdFromRequest(req)!;
    const email = getUserEmailFromRequest(req);

    const summary = await getDataSummary(userId, email);

    logPrivacyEvent('customer_view', req, { type: 'data_summary' });

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
});

// POST /privacy/export - Request full data export
privacyRouter.post('/export', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserIdFromRequest(req)!;
    const email = getUserEmailFromRequest(req);

    const exportData = await exportUserData(userId, email);

    logPrivacyEvent('data_export', req, {
      dataCategories: exportData.dataCategories,
    });

    // Return as JSON (could also be sent as downloadable file)
    res.json({
      success: true,
      data: exportData,
    });
  } catch (error) {
    next(error);
  }
});

// POST /privacy/delete - Request data deletion
privacyRouter.post('/delete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserIdFromRequest(req)!;
    const email = getUserEmailFromRequest(req);

    if (!email) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Email is required to process deletion request',
          code: 'EMAIL_REQUIRED',
        },
      });
    }

    const result = await deleteUserData(userId, email, req);

    logPrivacyEvent('data_deletion_request', req, {
      requestId: result.requestId,
      scheduledDate: result.scheduledDeletionDate,
    });

    res.json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /privacy/delete - Cancel deletion request
privacyRouter.delete('/delete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserIdFromRequest(req)!;

    const result = await cancelDeletionRequest(userId);

    if (result.success) {
      logPrivacyEvent('consent_update', req, { action: 'deletion_cancelled' });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});
