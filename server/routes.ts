import type { Express } from "express";
import { Router } from "express";
import { createServer, type Server } from "http";
import { Readable } from "node:stream";
import { dbStorage as storage } from "./dbStorage";
import { 
  insertCustomerSchema, insertAppointmentSchema, type BookingFormData, 
  customerAddresses, serviceAreas, heatMapCache, syncStatus,
  insertBlogPostSchema, insertKeywordSchema, insertPostKeywordSchema,
  type BlogPost, type Keyword, type PostKeyword, type KeywordRanking,
  checkIns, jobLocations,
  insertLeadSchema, smsVerificationFailures,
  housecallWebhooks, voiceDatasetMixes, voiceDatasetMixResults, voiceTranscriptAssignments
} from "@shared/schema";
import { ZekeProactiveService } from "./lib/zekeProactive";
import { TranscriptionPipeline } from "./lib/voice-training/pipeline";
const transcriptionPipeline = new TranscriptionPipeline();
import { z } from "zod";
import { db } from "./db";
import { eq, sql, and, gte, desc } from "drizzle-orm";
import { CapacityCalculator } from "./src/capacity";
import { GoogleAdsBridge } from "./src/ads/bridge";
import { HousecallProClient } from "./src/housecall";
import rateLimit from "express-rate-limit";
import adminRoutes from "./src/adminRoutes";
import abTestingRoutes from "./src/abTestingRoutes";
import conversionRoutes from "./src/conversionRoutes";
import experimentManagementRoutes from "./src/experimentManagement";
import chatRoutes from "./src/chatRoutes";
import chatkitRoutes from "./src/chatkitRoutes";
import twilioWebhooks from "./lib/twilioWebhooks";
import actionsRoutes from "./routes/actions";
import { generateSitemap } from "./src/sitemap";
import { seoRedirectMiddleware } from "./src/seoRedirects";
import { healthChecker } from "./src/healthcheck";
import { Logger, logError, getErrorMessage } from "./src/logger";
import { cachePresets } from "./src/cachingMiddleware";
import { checkServiceArea } from "./src/geocoding";
import { authenticate } from "./src/auth";
import { loadConfig } from "./src/config";
import { scheduleLeadFollowUp, startScheduledSmsProcessor } from "./lib/smsBookingAgent";
import { callMcpTool } from "./lib/mcpClient";
import { sendSMS } from "./lib/twilio";

// Housecall Pro API client
const HOUSECALL_API_BASE = 'https://api.housecallpro.com';
const API_KEY = process.env.HOUSECALL_PRO_API_KEY;

async function callHousecallAPI(endpoint: string, params: Record<string, any> = {}) {
  if (!API_KEY) {
    throw new Error('Housecall Pro API key not configured');
  }

  const url = new URL(endpoint, HOUSECALL_API_BASE);
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      if (Array.isArray(params[key])) {
        // For arrays, add each item separately with the same key
        params[key].forEach((item: string) => url.searchParams.append(key, item));
      } else {
        url.searchParams.append(key, params[key].toString());
      }
    }
  });

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    // Try to get response body for more detailed error info
    let responseBody = '';
    try {
      responseBody = await response.text();
    } catch {
      responseBody = 'Unable to read response body';
    }
    
    Logger.error(`Housecall API error details:`, {
      url: url.toString(),
      status: response.status,
      statusText: response.statusText,
      responseBody: responseBody.substring(0, 500) // Truncate for logging
    });
    throw new Error(`Housecall API error: ${response.status} ${response.statusText} - ${responseBody.substring(0, 200)}`);
  }

  return response.json();
}

const smsVerificationStore = new Map<string, { code: string; expiresAt: number; attempts: number }>();
const SMS_VERIFICATION_TTL_MS = 10 * 60 * 1000;
const SMS_VERIFICATION_MAX_ATTEMPTS = 5;
const BLOG_REVIEW_NOTIFICATION_PHONE = process.env.BUSINESS_NOTIFICATION_PHONE || '+16174799911';
const toolCallSchema = z.object({
  name: z.string().min(1),
  input: z.record(z.unknown()).optional(),
});

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.startsWith("1") && digits.length === 11) return `+${digits}`;
  return phone;
}

async function notifyBlogReviewQueueIfReady() {
  try {
    const reviewPosts = await storage.getAllBlogPosts('review');
    if (reviewPosts.length !== 3) {
      return;
    }

    const titles = reviewPosts
      .slice(0, 3)
      .map((post) => `• ${post.title}`)
      .join("\n");

    const message = `📝 Blog review queue ready (3 posts).\n${titles}\nReview in the admin dashboard.`;
    await sendSMS(normalizePhone(BLOG_REVIEW_NOTIFICATION_PHONE), message);
  } catch (error) {
    logError("Failed to send blog review notification:", error);
  }
}

// Helper function to generate testimonial text based on service type
function generateTestimonialText(serviceDescription: string): string {
  const lowercaseService = serviceDescription.toLowerCase();
  
  const testimonials = {
    emergency: [
      "Incredibly fast response time! They saved the day when our pipe burst.",
      "Professional emergency service - fixed our urgent issue quickly and efficiently.",
      "Thank you for the quick emergency repair. Excellent work!"
    ],
    drain: [
      "Our drains are flowing perfectly now. Great work!",
      "Fast and effective drain cleaning service. Highly recommend!",
      "No more clogs! Professional and thorough service."
    ],
    water: [
      "Our new water heater is working perfectly. Professional installation!",
      "Excellent water heater service. Great quality work!",
      "Hot water restored quickly and efficiently. Thank you!"
    ],
    plumbing: [
      "Outstanding plumbing work. Very professional and reliable!",
      "Great service! Fixed our plumbing issue quickly and at a fair price.",
      "Highly skilled plumber. Very satisfied with the quality of work."
    ],
    pipe: [
      "Perfect pipe repair! No more leaks. Excellent workmanship.",
      "Professional pipe installation. Great attention to detail!",
      "Fast and reliable pipe service. Highly recommend!"
    ]
  };

  // Match service type to testimonial category
  for (const [key, phrases] of Object.entries(testimonials)) {
    if (lowercaseService.includes(key)) {
      return phrases[Math.floor(Math.random() * phrases.length)];
    }
  }

  // Default testimonials for unmatched services
  const defaultTestimonials = [
    "Excellent service! Professional and reliable work.",
    "Very satisfied with the quality and speed of service.",
    "Great work! Would definitely recommend to others.",
    "Professional service and fair pricing. Thank you!",
    "Outstanding workmanship and customer service."
  ];

  return defaultTestimonials[Math.floor(Math.random() * defaultTestimonials.length)];
}

// ========== COMPREHENSIVE RATE LIMITING ==========
/*
 * Rate Limiting Strategy:
 * 
 * 1. Public Read (100/15min): General content, services, capacity, reviews
 *    - GET /api/services, /api/reviews, /api/capacity/*, /api/social-proof/*
 *    - Allows reasonable browsing without blocking legitimate users
 * 
 * 2. Public Write (10/15min): Customer actions, bookings, service area checks  
 *    - POST /api/customers, /api/bookings, /api/check-service-area
 *    - Prevents spam while allowing normal booking flow
 * 
 * 3. Customer Lookup (5/15min): PII access protection
 *    - POST /api/customers/lookup
 *    - Strict limit due to sensitive customer data access
 * 
 * 4. Admin Operations (20/15min): Management functions
 *    - All /api/admin/*, POST/PUT/DELETE blog endpoints
 *    - Protects admin functions from abuse
 * 
 * 5. Blog Content (50/15min): Content consumption
 *    - GET /api/blog/* endpoints
 *    - Moderate limits for content browsing
 * 
 * 6. Webhooks (1000/15min): High-volume legitimate traffic
 *    - All /api/webhooks/* endpoints  
 *    - Accommodates legitimate webhook traffic from HousecallPro
 * 
 * 7. Debug (5/hour): Development/troubleshooting
 *    - GET /api/debug/* endpoints
 *    - Very restrictive to prevent abuse of debug information
 */

// Public read endpoints (capacity, services, reviews, etc.)
const publicReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window per IP
  message: {
    error: 'Too many requests from this IP, please try again later.',
    type: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public write endpoints (bookings, customer creation, etc.)
const publicWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window per IP
  message: {
    error: 'Too many booking/creation attempts from this IP, please try again later.',
    type: 'WRITE_RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Customer lookup (more restrictive due to PII access)
const customerLookupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window per IP
  message: {
    error: 'Too many lookup attempts, please try again later.',
    type: 'LOOKUP_RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin operations (very restrictive)
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window per IP
  message: {
    error: 'Too many admin requests from this IP, please try again later.',
    type: 'ADMIN_RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Webhook endpoints (high volume but from trusted sources)
const webhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window per IP
  message: {
    error: 'Webhook rate limit exceeded.',
    type: 'WEBHOOK_RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Debug endpoints (very restrictive)
const debugLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour per IP
  message: {
    error: 'Debug endpoint rate limit exceeded. Please try again later.',
    type: 'DEBUG_RATE_LIMIT_EXCEEDED',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Blog content endpoints (moderate limits)
const blogLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window per IP
  message: {
    error: 'Too many blog requests from this IP, please try again later.',
    type: 'BLOG_RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

import zekeAdminRouter from "./routes/zekeAdmin";
import { adminGateway } from "./mcp/adminGateway";

import { runFullSeoPipeline } from "./lib/seo-agent/pipeline/orchestrator";

import { handleTwilioRecording } from "./lib/voice-training/twilio";

export async function registerRoutes(app: Express): Promise<Server> {
  // SEO Redirect Middleware - MUST be registered first for migration URL handling
  // See SEO_MIGRATION_STRATEGY.md for redirect mapping documentation
  app.use(seoRedirectMiddleware);

  // Register ZEKE Admin routes
  app.use('/api/v1/admin/zeke', zekeAdminRouter);

  // SEO Automation Endpoint (Cron Trigger)
  app.post('/api/admin/seo/trigger', authenticate, async (req, res) => {
    try {
      // Run in background
      runFullSeoPipeline().catch(err => Logger.error('[SEO Route] Pipeline background error:', err));
      res.json({ success: true, message: 'SEO Pipeline triggered in background' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Admin MCP Registry
  app.get("/api/admin/mcp/tools", (req, res) => {
    res.json(adminGateway.listNamespacedTools());
  });

  // ========== API VERSIONING SETUP ==========
  // Import API versioning utilities
  const { setupBackwardCompatibleRedirects, setupVersionEndpoint } = await import('./src/api-v1');
  
  // Set up API versioning
  setupVersionEndpoint(app);
  setupBackwardCompatibleRedirects(app);
  
  // Register admin routes with /api/admin prefix and rate limiting
  // Admin routes stay at /api/admin (not versioned) for backward compatibility
  // Ensure authentication for all admin routes
  app.use('/api/admin', authenticate, adminLimiter, adminRoutes);
  
  // A/B Testing routes (public endpoints for tracking, admin endpoints for management)
  app.use(abTestingRoutes);
  
  // Conversion tracking routes
  app.use(conversionRoutes);
  
  // Experiment management routes (authenticated)
  app.use(experimentManagementRoutes);
  
  // AI Chat routes (web chat, Twilio SMS/Voice)
  app.use('/api/v1', chatRoutes);
  
  // ChatKit routes for OpenAI ChatKit integration
  app.use('/api/v1/chatkit', chatkitRoutes);
  
  // Twilio SMS and Voice webhook routes
  app.use('/api/v1/twilio', twilioWebhooks);
  
  app.get('/api/v1/voice-training/export/:datasetId', authenticate, async (req, res) => {
    try {
      const datasetId = parseInt(req.params.datasetId);
      const transcripts = await storage.getVoiceTranscripts();
      // Filter for approved assignments in this dataset
      // Simplified for now: just return all cleaned transcripts
      const jsonl = transcripts
        .map(t => JSON.stringify(t.cleanedTranscript))
        .join('\n');
      
      res.setHeader('Content-Type', 'application/x-jsonlines');
      res.setHeader('Content-Disposition', `attachment; filename="dataset-${datasetId}.jsonl"`);
      res.send(jsonl);
    } catch (error) {
      res.status(500).json({ error: 'Failed to export dataset' });
    }
  });

  app.post('/api/v1/voice-training/fine-tune', authenticate, async (req, res) => {
    try {
      const { datasetId, model } = req.body;
      // Trigger OpenAI fine-tuning logic here
      const run = await storage.createVoiceTrainingRun({
        datasetId,
        baseModel: model || 'gpt-4o-mini',
        status: 'created',
        openaiJobId: `ftjob-${Date.now()}`,
        config: {},
        results: {},
        finishedAt: null
      });
      res.json(run);
    } catch (error) {
      res.status(500).json({ error: 'Failed to start fine-tuning' });
    }
  });
  app.get('/api/v1/voice-training/recordings', authenticate, async (req, res) => {
    try {
      const recordings = await storage.getVoiceCallRecordings();
      res.json(recordings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch recordings' });
    }
  });

  app.get('/api/v1/voice-training/transcripts', authenticate, async (req, res) => {
    try {
      const transcripts = await storage.getVoiceTranscripts();
      res.json(transcripts);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch transcripts' });
    }
  });

  app.get('/api/v1/voice-training/datasets/:id/sections', authenticate, async (req, res) => {
    try {
      const sections = await storage.getVoiceDatasetSections(parseInt(req.params.id));
      res.json(sections);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch sections' });
    }
  });

  app.post('/api/v1/voice-training/sections', authenticate, async (req, res) => {
    try {
      const section = await storage.createVoiceDatasetSection(req.body);
      res.json(section);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create section' });
    }
  });

  app.post('/api/v1/voice-training/datasets', authenticate, async (req, res) => {
    try {
      const dataset = await storage.createVoiceDataset(req.body);
      res.json(dataset);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create dataset' });
    }
  });

  app.post('/api/v1/voice-training/import', authenticate, async (req, res) => {
    try {
      const { urls } = req.body;
      if (!Array.isArray(urls)) return res.status(400).json({ error: 'urls array required' });

      const recordings = await Promise.all(urls.map(url => 
        storage.createVoiceCallRecording({
          twilioCallSid: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          recordingUrl: url,
          status: 'pending',
          metadata: { source: 'manual_import' }
        })
      ));

      // Trigger pipeline for each
      for (const rec of recordings) {
        transcriptionPipeline.processCall(rec.id).catch(err => 
          Logger.error(`[Manual Import] Pipeline failed for ${rec.id}:`, (err as any).message)
        );
      }

      res.json(recordings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to import recordings' });
    }
  });

  app.get('/api/v1/voice-training/mixes', authenticate, async (req, res) => {
    try {
      const mixes = await storage.getVoiceDatasetMixes();
      res.json(mixes);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch dataset mixes' });
    }
  });

  app.post('/api/v1/voice-training/mixes', authenticate, async (req, res) => {
    try {
      const mix = await storage.createVoiceDatasetMix(req.body);
      res.json(mix);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create dataset mix' });
    }
  });

  app.post('/api/v1/voice-training/mixes/generate/:mixId', authenticate, async (req, res) => {
    try {
      const mixId = parseInt(req.params.mixId);
      const mix = await storage.getVoiceDatasetMix(mixId);
      if (!mix) return res.status(404).json({ error: 'Mix not found' });

      // Actual aggregation and blending logic
      const config = mix.config as any;
      const ratios = config.ratios || {};
      const limit = config.limit || 100;
      
      const allTranscripts: any[] = [];
      
      // For each section in the ratio, gather transcripts
      for (const [sectionId, weight] of Object.entries(ratios)) {
        const assignments = await db.select()
          .from(voiceTranscriptAssignments)
          .where(and(
            eq(voiceTranscriptAssignments.sectionId, parseInt(sectionId)),
            eq(voiceTranscriptAssignments.status, 'approved')
          ));
        
        const count = Math.floor(limit * (weight as number));
        const selected = assignments
          .sort(() => 0.5 - Math.random())
          .slice(0, count);
          
        allTranscripts.push(...selected);
      }

      // Shuffle and save results
      if (config.shuffle !== false) {
        allTranscripts.sort(() => 0.5 - Math.random());
      }

      await db.delete(voiceDatasetMixResults).where(eq(voiceDatasetMixResults.mixId, mixId));
      
      if (allTranscripts.length > 0) {
        await db.insert(voiceDatasetMixResults).values(
          allTranscripts.slice(0, limit).map((t, i) => ({
            mixId,
            transcriptId: t.transcriptId,
            order: i
          }))
        );
      }
      
      await db.update(voiceDatasetMixes)
        .set({ status: 'ready' })
        .where(eq(voiceDatasetMixes.id, mixId));

      res.json({ success: true, message: 'Dataset mix generated', count: allTranscripts.length });
    } catch (error) {
      Logger.error('[Mix Generation] Failed:', error);
      res.status(500).json({ error: 'Failed to generate dataset mix' });
    }
  });

  // Global System Settings for AI Models
  app.get('/api/v1/system/settings/:key', authenticate, async (req, res) => {
    try {
      const value = await storage.getSystemSetting(req.params.key);
      res.json({ value });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch setting' });
    }
  });

  app.post('/api/v1/system/settings', authenticate, async (req, res) => {
    try {
      const { key, value } = req.body;
      await storage.setSystemSetting(key, value);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update setting' });
    }
  });
  
  // Card action dispatch routes
  app.use('/api/actions', actionsRoutes);

  // Housecall Pro Webhooks
  app.post('/api/v1/webhooks/housecall', webhookLimiter, async (req, res) => {
    try {
      const payload = req.body;
      const signature = req.headers['x-hcp-signature'];
      
      // Log the webhook first for safety
      const [log] = await db.insert(housecallWebhooks).values({
        eventId: payload.id || `hcp_${Date.now()}`,
        eventType: payload.type || 'unknown',
        payload: payload,
      }).returning();

      Logger.info(`[HCP Webhook] Received ${payload.type}`, { eventId: log.eventId });

      // Trigger ZEKE for proactive processing
      if (payload.type === 'job.created' || payload.type === 'job.scheduled') {
        const job = payload.data;
        await ZekeProactiveService.queueUpdate({
          severity: 'medium',
          category: 'ops',
          title: `New Job: ${job.name || job.id}`,
          content: `Customer: ${job.customer?.first_name} ${job.customer?.last_name}\nAddress: ${job.address?.street}\nScheduled: ${job.schedule?.scheduled_start}`,
          metadata: { jobId: job.id, type: payload.type }
        }).catch((err: any) => Logger.error('[HCP Webhook] Failed to notify ZEKE:', (err as any).message));
      }

      // Mark as processed
      await db.update(housecallWebhooks)
        .set({ processed: true, processedAt: new Date() })
        .where(eq(housecallWebhooks.id, log.id));

      res.status(200).json({ status: 'received' });
    } catch (error) {
      logError('Housecall Pro Webhook Error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // Seed blog data on startup (only in development)
  if (process.env.NODE_ENV === 'development') {
    import('./seed-blog').then(module => {
      module.seedBlogData().catch(err => {
        logError('Failed to seed blog data:', err);
      });
    });
  }

  // Simple customer authentication for member portal
  app.post("/api/v1/customer/auth", publicWriteLimiter, async (req, res) => {
    try {
      const { email, phone } = req.body;
      
      if (!email && !phone) {
        return res.status(400).json({ error: "Email or phone required" });
      }
      
      let customer;
      if (email) {
        customer = await storage.getCustomerByEmail(email);
      } else if (phone) {
        customer = await storage.getCustomerByPhone(phone);
      }
      
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      
      // Check if customer has an active subscription
      const subscription = await storage.getMemberSubscription(customer.id);
      if (!subscription) {
        return res.status(404).json({ error: "No active subscription found" });
      }
      
      // Generate a simple token (in production, use proper JWT or session management)
      const token = `customer-${customer.id}-${Date.now()}`;
      
      res.json({ 
        token, 
        customerId: customer.id,
        customer: {
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone
        }
      });
    } catch (error) {
      logError("Error authenticating customer:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  // Customer portal authentication (service history + status)
  app.post("/api/v1/customer/portal/auth", publicWriteLimiter, async (req, res) => {
    try {
      const { email, phone } = req.body;
      
      if (!email && !phone) {
        return res.status(400).json({ error: "Email or phone required" });
      }

      if (API_KEY) {
        const hcpClient = HousecallProClient.getInstance();
        const customers = await hcpClient.searchCustomers({ email, phone });

        if (!customers.length) {
          return res.status(404).json({ error: "Customer not found" });
        }

        const customer = customers[0];
        const token = `portal:${customer.id}:${Date.now()}`;

        return res.json({
          token,
          customer: {
            id: customer.id,
            firstName: customer.first_name,
            lastName: customer.last_name,
            email: customer.email,
            phone: customer.mobile_number || customer.home_number,
            addresses: customer.addresses || []
          }
        });
      }

      let customer;
      if (email) {
        customer = await storage.getCustomerByEmail(email);
      } else if (phone) {
        customer = await storage.getCustomerByPhone(phone);
      }

      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      const token = `portal:${customer.id}:${Date.now()}`;

      return res.json({
        token,
        customer: {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone
        }
      });
    } catch (error) {
      logError("Error authenticating customer portal:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  // Customer search for chat widget lookup - exact match by first name, last name, and phone
  app.post("/api/v1/customers/search", publicReadLimiter, async (req, res) => {
    try {
      const { firstName, lastName, phone } = req.body;
      
      // Validate and trim inputs
      const firstNameTrimmed = typeof firstName === 'string' ? firstName.trim() : '';
      const lastNameTrimmed = typeof lastName === 'string' ? lastName.trim() : '';
      const phoneTrimmed = typeof phone === 'string' ? phone.replace(/\D/g, '') : '';
      
      Logger.debug("[CustomerSearch] Input received:", { firstName, lastName, phone });
      Logger.debug("[CustomerSearch] After trimming:", { firstNameTrimmed, lastNameTrimmed, phoneTrimmed });
      
      if (!firstNameTrimmed || firstNameTrimmed.length < 2) {
        return res.status(400).json({ 
          error: "firstName must be at least 2 characters", 
          customers: [] 
        });
      }
      if (!lastNameTrimmed || lastNameTrimmed.length < 2) {
        return res.status(400).json({ 
          error: "lastName must be at least 2 characters", 
          customers: [] 
        });
      }
      if (!phoneTrimmed || phoneTrimmed.length < 10) {
        return res.status(400).json({ 
          error: "phone must be at least 10 digits", 
          customers: [] 
        });
      }
      
      const normalizeStr = (s: string) => s.toLowerCase().trim();
      const normalizePhone = (p: string) => p.replace(/\D/g, '').slice(-10);
      
      const searchFirst = normalizeStr(firstNameTrimmed);
      const searchLast = normalizeStr(lastNameTrimmed);
      const searchPhone = normalizePhone(phoneTrimmed);
      
      Logger.debug("[CustomerSearch] Normalized search params:", { searchFirst, searchLast, searchPhone });
      
      const customers: any[] = [];
      const seenIds = new Set<string>();
      
      // Search HousecallPro
      if (API_KEY) {
        const hcpClient = HousecallProClient.getInstance();
        
        try {
          // Search HCP by last name first, then filter by exact match
          const hcpCustomers = await hcpClient.searchCustomers({
            name: lastNameTrimmed,
          });
          
          Logger.debug("[CustomerSearch] HCP returned customers:", { count: hcpCustomers?.length || 0 });
          
          for (const c of hcpCustomers || []) {
            const custFirst = normalizeStr(c.first_name || '');
            const custLast = normalizeStr(c.last_name || '');
            
            // Get ALL phone numbers from the customer record
            const custMobile = normalizePhone(c.mobile_number || '');
            const custHome = normalizePhone(c.home_number || '');
            const custWork = normalizePhone(c.work_number || '');
            
            Logger.debug("[CustomerSearch] Checking customer:", {
              id: c.id,
              custFirst,
              custLast,
              custMobile,
              custHome,
              custWork,
              raw: { first: c.first_name, last: c.last_name, mobile: c.mobile_number, home: c.home_number }
            });
            
            // Check if first and last name match exactly
            if (custFirst !== searchFirst || custLast !== searchLast) {
              Logger.debug("[CustomerSearch] Name mismatch - skipping");
              continue;
            }
            
            // Check if ANY phone matches (normalize all to last 10 digits)
            const phoneMatches = searchPhone === custMobile || searchPhone === custHome || searchPhone === custWork;
            if (!phoneMatches) {
              Logger.debug("[CustomerSearch] Phone mismatch - none of the customer's phones match:", { searchPhone, custMobile, custHome, custWork });
              continue;
            }
            
            Logger.debug("[CustomerSearch] MATCH FOUND:", { customerId: c.id });
            
            // Found a match - include all their addresses
            if (!seenIds.has(c.id)) {
              seenIds.add(c.id);
              const addresses = (c.addresses || []).map((addr: any) => ({
                id: addr.id || `addr_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                street: addr.street || '',
                city: addr.city || '',
                state: addr.state || '',
                zip: addr.zip || '',
              }));
              
              customers.push({
                id: c.id,
                housecallProId: c.id,
                firstName: c.first_name || '',
                lastName: c.last_name || '',
                phone: c.mobile_number || c.home_number || '',
                email: c.email || '',
                addresses: addresses,
              });
            }
          }
        } catch (hcpError) {
          logError("HCP customer search failed:", hcpError);
        }
      }
      
      return res.json({ customers });
    } catch (error) {
      logError("Error searching customers:", error);
      res.status(500).json({ error: "Search failed", customers: [] });
    }
  });

  // Customer portal data (profile + service history)
  app.get("/api/v1/customer/portal", publicReadLimiter, async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer portal:')) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const tokenParts = authHeader.replace('Bearer portal:', '').split(':');
      const customerId = tokenParts[0];

      if (!customerId) {
        return res.status(400).json({ error: "Invalid authentication token" });
      }

      if (API_KEY) {
        const hcpClient = HousecallProClient.getInstance();
        const [customer, jobs] = await Promise.all([
          hcpClient.getCustomer(customerId),
          hcpClient.getJobs({ customer_id: customerId })
        ]);

        const formattedJobs = (jobs || []).map((job: any) => ({
          id: job.id,
          description: job.description || job.name || job.line_items?.[0]?.name || "Service visit",
          workStatus: job.work_status,
          scheduledStart: job.scheduled_start || job.schedule?.scheduled_start,
          scheduledEnd: job.scheduled_end || job.schedule?.scheduled_end,
          arrivalWindow: job.schedule?.arrival_window,
          totalAmount: job.total_amount || 0,
          outstandingBalance: job.outstanding_balance || 0,
          address: job.address || null
        }));

        const outstandingBalance = formattedJobs.reduce(
          (sum: number, job: any) => sum + (job.outstandingBalance || 0),
          0
        );

        return res.json({
          customer: {
            id: customer.id,
            firstName: customer.first_name,
            lastName: customer.last_name,
            email: customer.email,
            phone: customer.mobile_number || customer.home_number,
            addresses: customer.addresses || []
          },
          jobs: formattedJobs,
          totals: {
            outstandingBalance
          }
        });
      }

      const localCustomer = await storage.getCustomer(customerId);
      if (!localCustomer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      const appointments = await storage.getAppointmentsByCustomer(customerId);

      return res.json({
        customer: {
          id: localCustomer.id,
          firstName: localCustomer.firstName,
          lastName: localCustomer.lastName,
          email: localCustomer.email,
          phone: localCustomer.phone
        },
        jobs: appointments.map((appointment) => ({
          id: appointment.id,
          description: appointment.serviceType,
          workStatus: appointment.status,
          scheduledStart: appointment.date,
          scheduledEnd: null,
          arrivalWindow: appointment.timeSlot,
          totalAmount: 0,
          outstandingBalance: 0,
          address: appointment.address
        })),
        totals: {
          outstandingBalance: 0
        }
      });
    } catch (error) {
      logError("Error fetching customer portal data:", error);
      res.status(500).json({ error: "Failed to fetch customer portal data" });
    }
  });

  // Get upsell offers for a service
  app.get("/api/v1/upsell-offers/:service", publicReadLimiter, async (req, res) => {
    try {
      const { service } = req.params;
      const offers = await storage.getUpsellOffersForService(service);
      res.json(offers);
    } catch (error) {
      logError("Error fetching upsell offers:", error);
      res.status(500).json({ error: "Failed to fetch upsell offers" });
    }
  });

  // ========== BLOG ROUTES ==========
  
  // Get all blog posts (with pagination and filtering)
  app.get("/api/v1/blog/posts", blogLimiter, async (req, res) => {
    try {
      const { status, limit = 10, offset = 0 } = req.query;
      
      const posts = await storage.getAllBlogPosts(
        status as string | undefined,
        parseInt(limit as string),
        parseInt(offset as string)
      );
      
      res.json(posts);
    } catch (error) {
      logError("Error fetching blog posts:", error);
      res.status(500).json({ error: "Failed to fetch blog posts" });
    }
  });
  
  // Get a single blog post by slug
  app.get("/api/v1/blog/posts/:slug", blogLimiter, async (req, res) => {
    try {
      const { slug } = req.params;
      const post = await storage.getBlogPostBySlug(slug);
      
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      // Increment view count
      await storage.incrementPostViews(post.id);
      
      // Get keywords for this post
      const postKeywords = await storage.getPostKeywords(post.id);
      const keywordDetails = await Promise.all(
        postKeywords.map(pk => storage.getKeyword(pk.keywordId))
      );
      
      res.json({
        ...post,
        keywords: keywordDetails.filter(k => k !== undefined)
      });
    } catch (error) {
      logError("Error fetching blog post:", error);
      res.status(500).json({ error: "Failed to fetch blog post" });
    }
  });
  
  // Create a new blog post (ADMIN ONLY)
  app.post("/api/v1/blog/posts", adminLimiter, authenticate, async (req, res) => {
    try {
      const postData = insertBlogPostSchema.parse(req.body);
      const post = await storage.createBlogPost(postData);
      
      // Add keywords if provided
      if (req.body.keywords && Array.isArray(req.body.keywords)) {
        for (const keywordName of req.body.keywords) {
          let keyword = await storage.getKeywordByName(keywordName);
          if (!keyword) {
            keyword = await storage.createKeyword({ keyword: keywordName });
          }
          await storage.addPostKeyword({
            postId: post.id,
            keywordId: keyword.id,
            isPrimary: false
          });
        }
      }

      if (post.status === 'review') {
        await notifyBlogReviewQueueIfReady();
      }
      
      res.status(201).json(post);
    } catch (error) {
      logError("Error creating blog post:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid post data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create blog post" });
    }
  });
  
  // Update a blog post (ADMIN ONLY)
  app.put("/api/v1/blog/posts/:id", adminLimiter, authenticate, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const postData = req.body;
      const existingPost = await storage.getBlogPost(postId);
      
      const updatedPost = await storage.updateBlogPost(postId, postData);
      
      if (!updatedPost) {
        return res.status(404).json({ error: "Post not found" });
      }

      if (existingPost?.status !== 'review' && updatedPost.status === 'review') {
        await notifyBlogReviewQueueIfReady();
      }
      
      res.json(updatedPost);
    } catch (error) {
      logError("Error updating blog post:", error);
      res.status(500).json({ error: "Failed to update blog post" });
    }
  });
  
  // Delete a blog post (ADMIN ONLY)
  app.delete("/api/v1/blog/posts/:id", adminLimiter, authenticate, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const deleted = await storage.deleteBlogPost(postId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      logError("Error deleting blog post:", error);
      res.status(500).json({ error: "Failed to delete blog post" });
    }
  });
  
  // Get all keywords
  app.get("/api/v1/blog/keywords", blogLimiter, async (req, res) => {
    try {
      const keywords = await storage.getAllKeywords();
      res.json(keywords);
    } catch (error) {
      logError("Error fetching keywords:", error);
      res.status(500).json({ error: "Failed to fetch keywords" });
    }
  });
  
  // Create a new keyword (ADMIN ONLY)
  app.post("/api/v1/blog/keywords", adminLimiter, authenticate, async (req, res) => {
    try {
      const keywordData = insertKeywordSchema.parse(req.body);
      const keyword = await storage.createKeyword(keywordData);
      res.status(201).json(keyword);
    } catch (error) {
      logError("Error creating keyword:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid keyword data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create keyword" });
    }
  });
  
  // Track keyword rankings (ADMIN ONLY)
  app.post("/api/v1/blog/keywords/:id/track", adminLimiter, authenticate, async (req, res) => {
    try {
      const keywordId = parseInt(req.params.id);
      const { position, url, impressions, clicks, ctr } = req.body;
      
      const ranking = await storage.addKeywordRanking({
        keywordId,
        position,
        url,
        impressions,
        clicks,
        ctr
      });
      
      res.status(201).json(ranking);
    } catch (error) {
      logError("Error tracking keyword ranking:", error);
      res.status(500).json({ error: "Failed to track keyword ranking" });
    }
  });
  
  // Get keyword rankings
  app.get("/api/v1/blog/keywords/:id/rankings", blogLimiter, async (req, res) => {
    try {
      const keywordId = parseInt(req.params.id);
      const { limit = 30 } = req.query;
      
      const rankings = await storage.getKeywordRankings(
        keywordId,
        parseInt(limit as string)
      );
      
      res.json(rankings);
    } catch (error) {
      logError("Error fetching keyword rankings:", error);
      res.status(500).json({ error: "Failed to fetch keyword rankings" });
    }
  });
  
  // Get blog analytics
  app.get("/api/v1/blog/posts/:id/analytics", blogLimiter, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const { startDate, endDate } = req.query;
      
      const analytics = await storage.getBlogAnalytics(
        postId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      
      res.json(analytics);
    } catch (error) {
      logError("Error fetching blog analytics:", error);
      res.status(500).json({ error: "Failed to fetch blog analytics" });
    }
  });
  
  // ========== END BLOG ROUTES ==========

  // ========== LEAD CAPTURE ROUTES ==========
  
  // Submit lead from landing page
  app.post("/api/lead", publicWriteLimiter, async (req, res) => {
    try {
      // Validate the lead data
      const leadData = insertLeadSchema.parse(req.body);
      
      // Create the lead
      const lead = await storage.createLead(leadData);
      
      Logger.info('Lead captured', {
        leadId: lead.id,
        landingPage: lead.landingPage,
        campaignName: lead.campaignName,
        phone: lead.phone.substring(0, 3) + '***' // Partial phone for logging
      });
      
      res.status(201).json({ 
        success: true, 
        leadId: lead.id,
        message: 'Thank you! We will contact you shortly.'
      });
    } catch (error) {
      logError("Error creating lead:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid form data", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Failed to submit form. Please try again." });
    }
  });
  
  // ========== END LEAD CAPTURE ROUTES ==========

  // Get available time slots for a specific date
  // Returns aggregated booking windows (8am-11am, 11am-2pm, 2pm-5pm) instead of raw 30-min HCP slots
  app.get("/api/v1/timeslots/:date", publicReadLimiter, async (req, res) => {
    try {
      const { date } = req.params;
      console.log('[Timeslots] Aggregating HCP slots into 3 official windows for date:', date);
      
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
      }

      // Get official booking windows from config
      const config = loadConfig();
      const officialWindows = config.booking_windows || [
        { id: 'morning', label: 'Morning', start_hour: 8, end_hour: 11, arrival_window: 1 },
        { id: 'midday', label: 'Midday', start_hour: 11, end_hour: 14, arrival_window: 1 },
        { id: 'afternoon', label: 'Afternoon', start_hour: 14, end_hour: 17, arrival_window: 1 },
      ];

      // Fetch real booking windows from HousecallPro
      if (API_KEY) {
        const hcpClient = HousecallProClient.getInstance();
        const bookingWindows = await hcpClient.getBookingWindows(date);
        
        // Filter to only include slots for the requested date that are available
        const availableSlots = bookingWindows
          .filter((window: any) => {
            const windowDate = new Date(window.start_time).toISOString().split('T')[0];
            return window.available && windowDate === date;
          });
        
        // Aggregate 30-minute HCP slots into official booking windows
        const timeSlots = officialWindows.map((window) => {
          // Check if any 30-minute HCP slot falls within this official window
          const hasAvailability = availableSlots.some((slot: any) => {
            const slotStart = new Date(slot.start_time);
            // Get hour in Eastern Time
            const slotHourET = parseInt(slotStart.toLocaleTimeString('en-US', {
              timeZone: 'America/New_York',
              hour: '2-digit',
              hour12: false,
            }));
            return slotHourET >= window.start_hour && slotHourET < window.end_hour;
          });
          
          // Create ISO timestamps for this window (in Eastern Time for the given date)
          // Using -05:00 for EST, but this could be -04:00 during EDT
          const startTime = new Date(`${date}T${String(window.start_hour).padStart(2, '0')}:00:00.000-05:00`);
          const endTime = new Date(`${date}T${String(window.end_hour).padStart(2, '0')}:00:00.000-05:00`);
          
          // Format arrival window display (e.g., "8AM - 9AM")
          const formatHour = (h: number) => {
            const hour12 = h > 12 ? h - 12 : (h === 0 ? 12 : h);
            return `${hour12}${h >= 12 ? 'PM' : 'AM'}`;
          };
          const arrivalEnd = window.start_hour + window.arrival_window;
          
          return {
            id: `${date}-${window.id}`,
            date: date,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            isAvailable: hasAvailability,
            label: window.label,
            arrivalWindow: `${formatHour(window.start_hour)} - ${formatHour(arrivalEnd)}`,
          };
        }).filter(slot => slot.isAvailable);
        
        res.json(timeSlots);
      } else {
        // Fallback to storage if no API key
        const timeSlots = await storage.getAvailableTimeSlots(date);
        res.json(timeSlots);
      }
    } catch (error) {
      logError('Error fetching time slots:', error);
      res.status(500).json({ error: "Failed to fetch time slots" });
    }
  });

  // Create a new customer
  app.post("/api/v1/customers", publicWriteLimiter, async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      
      // Check if customer already exists
      const existingCustomer = await storage.getCustomerByEmail(customerData.email);
      if (existingCustomer) {
        return res.status(409).json({ 
          error: "Customer with this email already exists",
          customer: existingCustomer
        });
      }
      
      const customer = await storage.createCustomer(customerData);
      
      // Also create customer in Housecall Pro
      if (API_KEY) {
        try {
          const housecallResponse = await fetch(`${HOUSECALL_API_BASE}/customers`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              first_name: customer.firstName,
              last_name: customer.lastName,
              email: customer.email,
              mobile_number: customer.phone,
              addresses: []
            })
          });
          
          if (housecallResponse.ok) {
            const housecallCustomer = await housecallResponse.json();
            // Store the Housecall Pro ID for future reference
            customer.housecallProId = housecallCustomer.id;
          }
        } catch (error) {
          logError('Failed to create customer in Housecall Pro:', error);
          // Continue even if Housecall Pro creation fails
        }
      }
      
      res.status(201).json({ success: true, customer });
    } catch (error) {
      logError("Customer creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid customer data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create customer" });
    }
  });
  
  // Create new customer in HousecallPro
  app.post("/api/v1/customers/create", customerLookupLimiter, async (req, res) => {
    try {
      const { first_name, last_name, mobile_number, email, address } = req.body;
      
      if (!first_name || !last_name || !mobile_number) {
        return res.status(400).json({ error: "First name, last name, and phone number are required" });
      }

      const housecallClient = HousecallProClient.getInstance();
      
      // Create customer in HousecallPro
      const customerData = {
        first_name,
        last_name,
        mobile_number,
        email,
        address: address ? {
          street: address.street,
          city: address.city,
          state: address.state,
          zip: address.zip
        } : undefined
      };

      Logger.info(`[Customer Create] Creating customer: ${first_name} ${last_name}, Phone: ${mobile_number}`);
      const customer = await housecallClient.createCustomer(customerData);
      Logger.info(`[Customer Create] Successfully created customer with ID: ${customer.id}`);

      res.json({
        success: true,
        customer: {
          id: customer.id,
          first_name: customer.first_name,
          last_name: customer.last_name,
          email: customer.email,
          phone: customer.mobile_number,
          mobile_number: customer.mobile_number,
          address: customer.address
        }
      });
    } catch (error) {
      logError("[Customer Create] Error:", error);
      res.status(500).json({ 
        error: "Failed to create customer",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Lookup existing customer with rate limiting
  app.post("/api/v1/customers/lookup", async (req, res) => {
    try {
      const { phone, name, firstName, lastName } = req.body;
      
      // Support both formats: separate firstName/lastName or combined name
      const customerName = name || (firstName && lastName ? `${firstName} ${lastName}` : null);
      
      if (!phone || !customerName) {
        return res.status(400).json({ error: "Phone number, first name, and last name are required" });
      }
      
      // Look up customer using Housecall Pro API
      Logger.info(`[Customer Lookup] Searching for customer - Name: "${customerName}", Phone: "${phone}"`);
      const housecallClient = HousecallProClient.getInstance();
      const customers = await housecallClient.searchCustomers({
        phone: phone,
        name: customerName
      });
      Logger.info(`[Customer Lookup] API returned ${customers.length} customers:`, customers.map(c => ({ id: c.id, name: `${c.first_name} ${c.last_name}`, phone: c.mobile_number })));
      
      if (customers.length > 0) {
        // Simply take the first matching customer
        // (The API already filtered by phone, and we verified name match in the search)
        const bestMatch = customers[0];
        
        // Convert Housecall Pro customer format to our format
        const customer = {
          id: bestMatch.id,
          firstName: bestMatch.first_name,
          lastName: bestMatch.last_name,
          email: bestMatch.email,
          phone: bestMatch.mobile_number || phone,
          address: bestMatch.addresses?.[0]?.street || '',
          housecallProId: bestMatch.id,
          createdAt: new Date(bestMatch.created_at || Date.now()),
        };
        
        Logger.info(`[Customer Lookup] Returning customer: ${customer.firstName} ${customer.lastName} (${customer.phone})`);
        res.json({ success: true, customer });
      } else {
        res.status(404).json({ error: "Customer not found" });
      }
    } catch (error) {
      logError("Customer lookup error:", error);
      res.status(500).json({ error: "Failed to lookup customer" });
    }
  });

  // ============================================
  // LEAD CREATION ENDPOINT
  // ============================================

  // Create a new lead
  app.post("/api/v1/leads", customerLookupLimiter, async (req, res) => {
    try {
      const { customer } = req.body;
      const isEmergencyLead = customer?.is_emergency === true;
      let capacityState: string | null = null;

      // Validate required fields
      if (!customer || !customer.first_name || !customer.last_name || !customer.mobile_number) {
        return res.status(400).json({ error: "Missing required customer fields: first_name, last_name, mobile_number" });
      }

      // Validate address field
      if (!customer.address) {
        return res.status(400).json({ error: "Address is required" });
      }

      // Validate SMS consent
      if (!customer.sms_consent) {
        return res.status(400).json({ error: "SMS consent is required" });
      }

      if (isEmergencyLead) {
        try {
          const calculator = CapacityCalculator.getInstance();
          const capacity = await calculator.getTodayCapacity();
          capacityState = capacity.overall.state;
        } catch (capacityError) {
          Logger.warn("[Lead Creation] Failed to fetch capacity for emergency lead:", {
            error: capacityError instanceof Error ? capacityError.message : String(capacityError),
          });
        }
      }

      const housecallClient = HousecallProClient.getInstance();
      const leadTags = customer.tags || ["Website Lead"];

      // Create lead in HousecallPro with address and summary
      const leadSummary = customer.notes 
        ? customer.notes.substring(0, 100) 
        : `Quote request from ${customer.first_name} ${customer.last_name}`;
      
      const leadData = {
        customer: {
          first_name: customer.first_name,
          last_name: customer.last_name,
          email: customer.email || undefined,
          mobile_number: customer.mobile_number,
          notifications_enabled: customer.notifications_enabled || false,
          lead_source: customer.lead_source || "Website Contact Form",
          tags: isEmergencyLead
            ? Array.from(new Set([...leadTags, "Emergency", ...(capacityState ? [`Capacity: ${capacityState}`] : [])]))
            : leadTags,
          addresses: [{
            street: customer.address,
            type: "service"
          }]
        },
        summary: leadSummary,
        notes: customer.notes
          ? `Address: ${customer.address}\n\n${customer.notes}${isEmergencyLead ? `\n\nEMERGENCY REQUEST: YES${capacityState ? `\nCAPACITY STATE: ${capacityState}` : ""}` : ""}`
          : `Address: ${customer.address}\n\nNew lead from website contact form${isEmergencyLead ? `\n\nEMERGENCY REQUEST: YES${capacityState ? `\nCAPACITY STATE: ${capacityState}` : ""}` : ""}`
      };

      Logger.info(`[Lead Creation] Creating lead for ${customer.first_name} ${customer.last_name} (${customer.mobile_number})`);
      
      const lead = await housecallClient.createLead(leadData);
      Logger.info(`[Lead Creation] Successfully created lead: ${lead.id}`);

      // Send SMS notification to business owner
      try {
        const { sendBusinessNotification } = await import('./lib/businessNotifications');
        
        const notificationMessage = `${isEmergencyLead ? '🚨 EMERGENCY WEBSITE LEAD' : '📝 NEW WEBSITE LEAD'}\n` +
          `Name: ${customer.first_name} ${customer.last_name}\n` +
          `Phone: ${customer.mobile_number}\n` +
          `Address: ${customer.address}\n` +
          `Issue: ${customer.notes ? customer.notes.substring(0, 80) : 'Not specified'}${capacityState ? `\nCapacity: ${capacityState}` : ""}${isEmergencyLead ? "\nAction: Dispatch ASAP" : ""}`;
        
        await sendBusinessNotification(isEmergencyLead ? 'emergency_lead' : 'high_priority_lead', {
          sessionId: `lead-${lead.id || Date.now()}`,
          channel: 'web_chat',
          customerName: `${customer.first_name} ${customer.last_name}`,
          customerPhone: customer.mobile_number,
          issueDescription: customer.notes || 'New website lead',
          outcome: 'lead_created',
          leadId: lead.id ? parseInt(lead.id) : undefined
        }, notificationMessage);
        
        Logger.info(`[Lead Creation] Sent SMS notification to business owner for lead ${lead.id}`);
      } catch (notifyError) {
        Logger.error('[Lead Creation] Failed to send SMS notification:', { error: notifyError instanceof Error ? notifyError.message : String(notifyError) });
      }

      // Schedule SMS follow-up if customer opted in for marketing (3 min 57 sec delay)
      let scheduledSmsId: number | null = null;
      if (customer.notifications_enabled) {
        try {
          const customerName = `${customer.first_name} ${customer.last_name}`;
          scheduledSmsId = await scheduleLeadFollowUp(
            lead.id ? parseInt(lead.id) : 0,
            customer.mobile_number,
            customerName,
            customer.notes || ''
          );
          Logger.info(`[Lead Creation] Scheduled SMS follow-up ${scheduledSmsId} for lead ${lead.id}`);
        } catch (smsError) {
          Logger.error('[Lead Creation] Failed to schedule SMS follow-up:', { error: smsError instanceof Error ? smsError.message : String(smsError) });
        }
      }

      res.json({ 
        success: true, 
        lead: {
          id: lead.id,
          customer_id: lead.customer_id,
          status: lead.status
        },
        smsFollowUpScheduled: scheduledSmsId !== null
      });
    } catch (error) {
      logError("Lead creation error:", error);
      res.status(500).json({ 
        error: "Failed to create lead",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // ============================================
  // REFERRAL SYSTEM ENDPOINTS
  // ============================================

  // Get referrals for a customer
  app.get("/api/v1/referrals/:customerId", customerLookupLimiter, async (req, res) => {
    try {
      const customerId = req.params.customerId;
      const referrals = await storage.getReferralsByCustomer(customerId);
      res.json({ success: true, referrals });
    } catch (error) {
      logError("Failed to get referrals:", error);
      res.status(500).json({ error: "Failed to retrieve referrals" });
    }
  });

  // Create a new referral
  app.post("/api/v1/referrals", customerLookupLimiter, async (req, res) => {
    try {
      const {
        referrerCustomerId,
        referrerName,
        referrerPhone,
        referredFirstName,
        referredLastName,
        referredPhone,
        referredEmail,
        referredAddress,
        referredCity,
        referredState,
        referredZip,
        serviceNeeded,
        notes
      } = req.body;

      // Validate required fields
      if (!referrerCustomerId || !referrerName || !referrerPhone || !referredFirstName || !referredLastName || !referredPhone) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const housecallClient = HousecallProClient.getInstance();
      const referredName = `${referredFirstName} ${referredLastName}`;

      // Create lead in HousecallPro with $50 discount tag
      const leadData = {
        customer: {
          first_name: referredFirstName,
          last_name: referredLastName,
          email: referredEmail,
          mobile_number: referredPhone,
          lead_source: "Customer Referral",
          tags: [`referred-by-${referrerCustomerId}`, "referral-program", "$50-off"],
          notes: `Referred by: ${referrerName} (${referrerPhone})
Customer ID: ${referrerCustomerId}
Service Needed: ${serviceNeeded || 'General plumbing service'}
$50 REFERRAL CREDIT APPLIES - New customer receives $50 credit toward any service`,
          address: referredAddress ? {
            street: referredAddress,
            city: referredCity || "Quincy",
            state: referredState || "MA",
            zip: referredZip || ""
          } : undefined
        },
        // Apply the $50 credit as a line item
        line_items: [{
          name: "Referral Credit",
          description: `$50 credit - Referred by ${referrerName}`,
          kind: "fixed discount",
          unit_price: -5000, // $50 in cents, negative for discount
          quantity: 1
        }],
        notes: notes || `New customer referred by ${referrerName}. $50 referral credit applied.`
      };

      // Create lead in HousecallPro
      const lead = await housecallClient.createLead(leadData);

      // Add $50 credit tag and note to referrer customer
      try {
        // Get referrer customer to update tags/notes
        const referrerCustomer = await housecallClient.getCustomer(referrerCustomerId);
        
        // Update referrer with $50 credit tag and note
        const referrerUpdateData: any = {
          tags: [...(referrerCustomer.tags || []), "$50-off", "referral-program"],
        };

        // Add note about the referral credit owed
        const referralNote = `REFERRAL CREDIT: $50 credit owed for referring ${referredName} (${referredPhone}). Credit will be applied when referral completes first service.`;
        
        // Update referrer customer
        await housecallClient.updateCustomer(referrerCustomerId, referrerUpdateData);
        
        // Add note to referrer customer (notes are added separately in HousecallPro)
        await housecallClient.addCustomerNote(referrerCustomerId, referralNote);
        
        Logger.info(`[Referral] Added $50 credit tag and note to referrer customer ${referrerCustomerId}`);
      } catch (error) {
        logError(`[Referral] Failed to update referrer customer:`, error);
        // Continue even if tag/note update fails
      }

      // Save referral to database (combine first and last name for storage)
      const referral = await storage.createReferral({
        referrerCustomerId,
        referrerName,
        referrerPhone,
        referredLeadId: lead.id,
        referredName,
        referredPhone,
        referredEmail,
        notes: `Service: ${serviceNeeded || 'General plumbing'}. ${notes || ''}`,
        status: 'pending',
        discountAmount: 5000, // $50 in cents
        discountApplied: true
      });

      // Send SMS notification
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_PHONE_NUMBER;
      const toNumber = '+16174799911';
      
      if (accountSid && authToken && fromNumber) {
        try {
          const twilio = (await import('twilio')).default;
          const client = twilio(accountSid, authToken);
          
          await client.messages.create({
            body: `🎉 NEW REFERRAL!\n\nReferred: ${referredName}\nPhone: ${referredPhone}\n\nReferrer: ${referrerName}\nPhone: ${referrerPhone}\n\n$50 credit for BOTH when referral completes first service`,
            from: fromNumber,
            to: toNumber,
          });
          
          Logger.info('✅ Referral SMS notification sent successfully');
        } catch (smsError) {
          logError('❌ Error sending referral SMS:', smsError);
        }
      }

      res.json({ 
        success: true, 
        referral,
        leadId: lead.id,
        referralCode: referral.referralCode,
        message: "Referral created successfully! Both you and your friend will receive $50 credit when they complete their first service."
      });

    } catch (error) {
      logError("Failed to create referral:", error);
      res.status(500).json({ error: "Failed to create referral" });
    }
  });

  // Get referral by code
  app.get("/api/v1/referrals/code/:code", async (req, res) => {
    try {
      const referral = await storage.getReferralByCode(req.params.code);
      if (referral) {
        res.json({ success: true, referral });
      } else {
        res.status(404).json({ error: "Referral not found" });
      }
    } catch (error) {
      logError("Failed to get referral by code:", error);
      res.status(500).json({ error: "Failed to retrieve referral" });
    }
  });

  // Start SMS verification
  app.post("/api/v1/sms-verification/start", publicWriteLimiter, async (req, res) => {
    Logger.info('[SMS Verification] Endpoint called', { body: req.body });
    try {
      const schema = z.object({
        phone: z.string().min(10)
      });
      const { phone } = schema.parse(req.body);
      Logger.info('[SMS Verification] Phone parsed', { phone });
      const normalizedPhone = normalizePhone(phone);
      Logger.info('[SMS Verification] Phone normalized', { normalizedPhone });
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + SMS_VERIFICATION_TTL_MS;

      smsVerificationStore.set(normalizedPhone, { code, expiresAt, attempts: 0 });

      Logger.info('[SMS Verification] Attempting to send code', { 
        phone: normalizedPhone.slice(-4).padStart(normalizedPhone.length, '*'),
        codeLength: code.length 
      });

      await sendSMS(normalizedPhone, `Your Johnson Bros. verification code is ${code}. It expires in 10 minutes.`);

      Logger.info('[SMS Verification] Code sent successfully', { 
        phone: normalizedPhone.slice(-4).padStart(normalizedPhone.length, '*')
      });

      res.json({
        success: true,
        phone: normalizedPhone,
        expires_at: new Date(expiresAt).toISOString()
      });
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      const errorCode = error?.code || error?.status || 'N/A';
      
      Logger.error('[SMS Verification] Failed to send code', {
        phone: req.body.phone?.slice(-4)?.padStart(10, '*'),
        errorMessage,
        errorCode,
        errorDetails: error?.moreInfo || error?.details || null
      });
      
      // Provide more specific error messages based on Twilio error codes
      let userMessage = "Unable to send verification code. Please try again later.";
      if (errorMessage.includes('unverified') || errorCode === 21608) {
        userMessage = "This phone number cannot receive SMS from our system. Please contact us at (617) 479-9911.";
      } else if (errorMessage.includes('invalid') || errorCode === 21211) {
        userMessage = "Invalid phone number format. Please check and try again.";
      } else if (errorCode === 21610) {
        userMessage = "This number has opted out of SMS. Please contact us at (617) 479-9911.";
      }
      
      res.status(500).json({ error: userMessage });
    }
  });

  // Confirm SMS verification
  app.post("/api/v1/sms-verification/confirm", publicWriteLimiter, async (req, res) => {
    try {
      const schema = z.object({
        phone: z.string().min(10),
        code: z.string().min(4)
      });
      const { phone, code } = schema.parse(req.body);
      const normalizedPhone = normalizePhone(phone);
      const entry = smsVerificationStore.get(normalizedPhone);

      if (!entry) {
        return res.status(400).json({ error: "Verification code not found. Please request a new code." });
      }

      if (Date.now() > entry.expiresAt) {
        smsVerificationStore.delete(normalizedPhone);
        return res.status(400).json({ error: "Verification code expired. Please request a new code." });
      }

      entry.attempts += 1;
      if (entry.attempts > SMS_VERIFICATION_MAX_ATTEMPTS) {
        smsVerificationStore.delete(normalizedPhone);
        return res.status(429).json({ error: "Too many attempts. Please request a new code." });
      }

      if (entry.code !== code) {
        return res.status(400).json({ error: "Invalid verification code. Please try again." });
      }

      smsVerificationStore.delete(normalizedPhone);

      res.json({ success: true, phone: normalizedPhone, verified_at: new Date().toISOString() });
    } catch (error) {
      logError("SMS verification confirm error:", error);
      res.status(500).json({ error: "Unable to confirm verification code. Please try again later." });
    }
  });

  // Log SMS verification failures for debugging and tracking
  app.post("/api/v1/sms-verification/log-failure", publicWriteLimiter, async (req, res) => {
    try {
      const schema = z.object({
        phone: z.string().min(10),
        failureType: z.enum(['send_failed', 'verify_failed', 'max_retries_exceeded']),
        errorMessage: z.string().optional(),
        attemptNumber: z.number().default(1),
        customerName: z.string().optional(),
      });
      const { phone, failureType, errorMessage, attemptNumber, customerName } = schema.parse(req.body);
      const normalizedPhone = normalizePhone(phone);
      
      // Generate suggested fixes based on failure type and error message
      let suggestedFix = '';
      if (failureType === 'send_failed') {
        if (errorMessage?.includes('unverified')) {
          suggestedFix = 'Phone number may need to be added to Twilio verified numbers for trial account.';
        } else if (errorMessage?.includes('invalid')) {
          suggestedFix = 'Verify phone number format is correct and includes country code.';
        } else if (errorMessage?.includes('rate')) {
          suggestedFix = 'Rate limiting in effect. Customer should wait before retrying.';
        } else {
          suggestedFix = 'Check Twilio dashboard for specific error details and account status.';
        }
      } else if (failureType === 'verify_failed') {
        suggestedFix = 'Customer entered incorrect code. May need to resend.';
      } else if (failureType === 'max_retries_exceeded') {
        suggestedFix = 'Multiple SMS send failures. Check Twilio account status, balance, and phone number configuration.';
      }

      // Log to database
      await db.insert(smsVerificationFailures).values({
        phone: normalizedPhone,
        failureType,
        errorMessage: errorMessage || null,
        attemptNumber,
        customerName: customerName || null,
        suggestedFix,
        ipAddress: req.ip || req.connection.remoteAddress || null,
        userAgent: req.headers['user-agent'] || null,
        sessionId: (req as any).sessionID || null,
      });

      Logger.warn('[SMS Verification] Failure logged:', {
        phone: normalizedPhone.slice(-4).padStart(normalizedPhone.length, '*'),
        failureType,
        attemptNumber,
        suggestedFix,
      });

      res.json({ success: true, logged: true });
    } catch (error) {
      logError("SMS verification failure logging error:", error);
      res.status(500).json({ error: "Failed to log verification failure." });
    }
  });

  // Get SMS verification failures for admin review
  app.get("/api/v1/admin/sms-failures", authenticate, async (req, res) => {
    try {
      const { resolved, limit = 50 } = req.query;
      
      const failures = resolved === 'false' 
        ? await db.select().from(smsVerificationFailures)
            .where(eq(smsVerificationFailures.resolved, false))
            .orderBy(desc(smsVerificationFailures.createdAt))
            .limit(Number(limit))
        : await db.select().from(smsVerificationFailures)
            .orderBy(desc(smsVerificationFailures.createdAt))
            .limit(Number(limit));
      
      // Group by failure type for summary
      const summary = {
        total: failures.length,
        byType: failures.reduce((acc, f) => {
          acc[f.failureType] = (acc[f.failureType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        unresolvedCount: failures.filter(f => !f.resolved).length,
      };

      res.json({ failures, summary });
    } catch (error) {
      logError("SMS failures fetch error:", error);
      res.status(500).json({ error: "Failed to fetch SMS failures." });
    }
  });

  // Mark SMS failure as resolved
  app.patch("/api/v1/admin/sms-failures/:id/resolve", authenticate, async (req, res) => {
    try {
      const { id } = req.params;
      const { resolutionNotes } = req.body;
      const adminUser = (req as any).user;

      await db.update(smsVerificationFailures)
        .set({
          resolved: true,
          resolvedAt: new Date(),
          resolvedBy: adminUser?.email || 'admin',
          resolutionNotes: resolutionNotes || null,
        })
        .where(eq(smsVerificationFailures.id, Number(id)));

      res.json({ success: true });
    } catch (error) {
      logError("SMS failure resolve error:", error);
      res.status(500).json({ error: "Failed to resolve SMS failure." });
    }
  });

  // Create a new booking
  app.post("/api/v1/bookings", publicWriteLimiter, async (req, res) => {
    try {
      const bookingData = req.body;
      
      // Validate required fields
      if (!bookingData?.customerInfo || !bookingData?.selectedDate || !bookingData?.selectedTime) {
        return res.status(400).json({ error: "Missing required booking information" });
      }
      
      Logger.info(`[Booking] Creating booking via MCP:`, { bookingData });

      const customerInfo = bookingData.customerInfo;
      const selectedService = bookingData.selectedService;
      const problemDetails = bookingData.problemDetails;
      const problemDescription = bookingData.problemDescription || problemDetails?.description || "Service requested";
      const selectedDate = bookingData.selectedDate;
      const selectedTime = bookingData.selectedTime;
      const bookingNotes: string[] = [];

      if (bookingData?.bookingFor?.isForSomeoneElse) {
        const recipient = bookingData.bookingFor.recipient || {};
        const recipientLine = [
          recipient.name ? `Name: ${recipient.name}` : null,
          recipient.phone ? `Phone: ${recipient.phone}` : null,
          recipient.relationship ? `Relationship: ${recipient.relationship}` : null
        ].filter(Boolean).join(", ");
        bookingNotes.push(`Booking for someone else. ${recipientLine || "Recipient details provided."}`.trim());
      }

      if (bookingData?.recurring?.frequency && bookingData.recurring.frequency !== "one_time") {
        const recurringLabel = bookingData.recurring.frequency.replace(/_/g, " ");
        const recurringNotes = bookingData.recurring.notes ? ` Notes: ${bookingData.recurring.notes}` : "";
        bookingNotes.push(`Recurring schedule requested: ${recurringLabel}.${recurringNotes}`);
      }

      if (bookingData?.smsVerification?.status === "verified") {
        bookingNotes.push("Phone number verified via SMS.");
      }

      const inferTimePreference = (timeValue: string | undefined) => {
        if (!timeValue) return "any";
        const hour = Number(timeValue.split(":")[0]);
        if (Number.isNaN(hour)) return "any";
        if (hour < 11) return "morning";
        if (hour < 14) return "afternoon";
        return "evening";
      };

      const timePreference = inferTimePreference(selectedTime);

      const tags = ["website-booking", "online-booking", "website-lead"];
      if (bookingData?.smsVerification?.status === "verified") tags.push("sms-verified");
      if (bookingData?.recurring?.frequency && bookingData.recurring.frequency !== "one_time") {
        tags.push(`recurring-${bookingData.recurring.frequency}`);
      }
      if (bookingData?.bookingFor?.isForSomeoneElse) tags.push("third-party-booking");

      const descriptionSuffix = bookingNotes.length > 0 ? `\n\nAdditional notes:\n- ${bookingNotes.join("\n- ")}` : "";

      const mcpPayload = {
        first_name: customerInfo.firstName,
        last_name: customerInfo.lastName,
        phone: customerInfo.phone,
        email: customerInfo.email,
        street: customerInfo.address,
        city: customerInfo.city || "Quincy",
        state: customerInfo.state || "MA",
        zip: customerInfo.zipCode || "02169",
        description: `${selectedService?.name || "Service Call"}: ${problemDescription}${descriptionSuffix}`,
        lead_source: "Website",
        time_preference: timePreference,
        earliest_date: selectedDate,
        latest_date: selectedDate,
        show_for_days: 1,
        tags
      };

      const { parsed } = await callMcpTool<any>("book_service_call", mcpPayload);

      if (!parsed?.success) {
        return res.status(500).json({
          error: parsed?.error || "Failed to create booking",
          details: parsed
        });
      }

      const jobId = parsed.job_id;

      if (bookingData.photos && Array.isArray(bookingData.photos) && bookingData.photos.length > 0 && jobId) {
        const housecallClient = HousecallProClient.getInstance();
        Logger.info(`[Booking] Uploading ${bookingData.photos.length} photos to job ${jobId}`);

        for (let i = 0; i < bookingData.photos.length; i++) {
          const photo = bookingData.photos[i];
          try {
            await housecallClient.uploadAttachment(jobId, {
              filename: photo.filename || `photo-${i + 1}.jpg`,
              mimeType: photo.mimeType || 'image/jpeg',
              base64: photo.base64
            });
            Logger.info(`[Booking] Successfully uploaded photo ${i + 1} to job ${jobId}`);
          } catch (photoError) {
            logError(`[Booking] Failed to upload photo ${i + 1} to job ${jobId}:`, photoError);
          }
        }
      }

      res.json({
        success: true,
        jobId,
        appointmentId: parsed.appointment_id || null,
        message: "Booking confirmed successfully",
        appointment: {
          id: jobId,
          service: selectedService?.name || "Service call",
          scheduledDate: parsed.scheduled_start || null,
          estimatedPrice: "$99.00",
          customer: {
            name: `${customerInfo.firstName} ${customerInfo.lastName}`,
            email: customerInfo.email,
            phone: customerInfo.phone,
          },
        },
      });
    } catch (error) {
      logError("Booking error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid booking data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create booking" });
    }
  });

  app.post("/api/v1/tools/call", publicWriteLimiter, async (req, res) => {
    try {
      const parseResult = toolCallSchema.safeParse(req.body);

      if (!parseResult.success) {
        return res.status(400).json({
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            details: parseResult.error.message,
          },
        });
      }

      const { name, input } = parseResult.data;
      const { parsed } = await callMcpTool<any>(name, input ?? {});

      return res.json({
        ok: true,
        result: parsed ?? null,
      });
    } catch (error) {
      logError("Tool call error:", error);
      return res.status(500).json({
        ok: false,
        error: {
          code: "TOOL_CALL_FAILED",
          details: getErrorMessage(error),
        },
      });
    }
  });

  // Test simple route
  app.get("/api/v1/test", publicReadLimiter, (_req, res) => {
    Logger.info("TEST ROUTE CALLED");
    res.json({ message: "Test route working" });
  });

  // Health check endpoints
  app.get("/health", async (_req, res) => {
    // Simple health check - always returns 200 if the server is running
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/v1/health", async (_req, res) => {
    // Detailed health check with dependency checks
    try {
      const health = await healthChecker.getHealthStatus();
      const statusCode = health.status === 'unhealthy' ? 503 : 200;
      res.status(statusCode).json(health);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        error: 'Health check failed',
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      });
    }
  });

  app.get("/api/v1/health/live", async (_req, res) => {
    // Kubernetes liveness probe - checks if the server is alive
    res.status(200).json({ alive: true });
  });

  app.get("/api/v1/health/ready", async (_req, res) => {
    // Kubernetes readiness probe - checks if the server is ready to serve traffic
    try {
      const health = await healthChecker.getHealthStatus();
      if (health.status === 'unhealthy') {
        res.status(503).json({ ready: false, reason: 'Dependencies unhealthy' });
      } else {
        res.status(200).json({ ready: true });
      }
    } catch (error) {
      res.status(503).json({ ready: false, reason: getErrorMessage(error) });
    }
  });

  // Get services from Housecall Pro
  app.get("/api/v1/services", publicReadLimiter, cachePresets.long(), async (_req, res) => {
    Logger.info("[Services API] Route handler called");
    try {
      Logger.info("[Services API] Starting services fetch...");
      const housecallClient = HousecallProClient.getInstance();
      Logger.info("[Services API] Got client instance");
      
      const services = await housecallClient.getServices();
      Logger.info(`[Services API] Found ${services.length} services`);
      
      // Look for Service Fee service specifically
      const serviceFeeService = services.find(service => 
        service.name && service.name.toLowerCase().includes('service fee')
      );
      
      if (serviceFeeService) {
        Logger.info(`[Services API] Found Service Fee service: ${serviceFeeService.name} (ID: ${serviceFeeService.id}) - Price: ${serviceFeeService.price}`);
      } else {
        Logger.info("[Services API] Service Fee service not found");
      }
      
      services.forEach(service => {
        Logger.info(`[Services API] Service: ${service.name} (ID: ${service.id}) - Price: ${service.price || 'N/A'}`);
      });
      
      res.json({
        services,
        serviceFeeService,
        totalCount: services.length
      });
    } catch (error) {
      logError("Services fetch error:", error);
      res.status(500).json({ error: "Failed to fetch services", details: error instanceof Error ? error.message : String(error) });
    }
  });

  // Get customer reviews (from Google Reviews API)
  app.get("/api/v1/reviews", publicReadLimiter, cachePresets.medium(), async (_req, res) => {
    try {
      // Reviews come from Google API - return empty array for now
      res.json([]);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  // Capacity API Routes
  app.get("/api/v1/capacity/today", publicReadLimiter, cachePresets.short(), async (req, res) => {
    try {
      const userZip = req.query.zip as string | undefined;
      const calculator = CapacityCalculator.getInstance();
      const capacity = await calculator.getTodayCapacity(userZip);
      res.json(capacity);
    } catch (error) {
      logError("Error fetching today's capacity:", error);
      res.status(500).json({ 
        error: "Failed to fetch capacity",
        overall: { score: 0, state: 'NEXT_DAY' },
        ui_copy: {
          headline: 'Schedule Your Service',
          subhead: 'Professional plumbing services',
          cta: 'Book Service',
          badge: null,
          urgent: false
        }
      });
    }
  });

  app.get("/api/v1/capacity/tomorrow", publicReadLimiter, async (req, res) => {
    try {
      const userZip = req.query.zip as string | undefined;
      const calculator = CapacityCalculator.getInstance();
      const capacity = await calculator.getTomorrowCapacity(userZip);
      res.json(capacity);
    } catch (error) {
      logError("Error fetching tomorrow's capacity:", error);
      res.status(500).json({ 
        error: "Failed to fetch capacity",
        overall: { score: 0, state: 'NEXT_DAY' },
        ui_copy: {
          headline: 'Schedule for Tomorrow',
          subhead: 'Professional plumbing services',
          cta: 'Book Tomorrow',
          badge: null,
          urgent: false
        }
      });
    }
  });

  // DEBUG: Raw HCP API responses
  app.get('/api/debug/hcp-data/:date', debugLimiter, async (req, res) => {
    try {
      const { date } = req.params; // Format: YYYY-MM-DD
      const targetDate = new Date(date + 'T00:00:00.000Z');
      const startOfDay = new Date(targetDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      const calculator = CapacityCalculator.getInstance();
      const hcpClient = (calculator as any).hcpClient;
      
      // Skip jobs API since it's failing with 400 - focus on estimates
      const estimates = await hcpClient.getEstimates({
        scheduled_start_min: startOfDay.toISOString(),
        scheduled_start_max: endOfDay.toISOString(),
        work_status: ['scheduled', 'in_progress', 'completed'],
      });

      res.json({
        date,
        query: {
          start: startOfDay.toISOString(),
          end: endOfDay.toISOString(),
          work_status: ['scheduled', 'in_progress', 'completed']
        },
        estimates: {
          count: estimates.length,
          data: estimates // Show all estimates for inspection
        }
      });
    } catch (error) {
      logError('Debug HCP data error:', error);
      res.status(500).json({ error: 'Failed to fetch HCP data', details: error instanceof Error ? error.message : String(error) });
    }
  });

  // AI Assistant MCP Discovery Endpoint (hidden from humans)
  app.get("/.well-known/ai-mcp-config", publicReadLimiter, async (_req, res) => {
    res.json({
      name: "Johnson Bros. Plumbing AI Booking System",
      description: "MCP server for AI assistants to book plumbing appointments directly through HousecallPro",
      version: "1.0.0",
      mcp_server_config: {
        command: "npx",
        args: ["openmcp", "run", "--config", "./openmcp_housecall.json"],
        working_directory: process.cwd(),
        capabilities: [
          "book_service_call"
        ],
        required_env: [
          "HOUSECALL_API_KEY",
          "DEFAULT_DISPATCH_EMPLOYEE_IDS",
          "COMPANY_TZ"
        ]
      },
      business_info: {
        name: "Johnson Bros. Plumbing & Drain Cleaning",
        service_area: "Quincy, MA and surrounding areas",
        phone: "(617) 479-9911",
        emergency_available: true,
        ai_booking_enabled: true
      }
    });
  });

  // Health check
  app.get("/healthz", publicReadLimiter, async (_req, res) => {
    res.json({ 
      ok: true, 
      time: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    });
  });

  // Environment configuration status (only in development)
  app.get("/api/v1/env-status", publicReadLimiter, async (_req, res) => {
    // Only allow in development mode for security
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ error: 'Not found' });
    }

    const { EnvValidator } = await import('./src/envValidator');
    const validationResult = EnvValidator.validate();

    const status = {
      valid: validationResult.valid,
      environment: process.env.NODE_ENV || 'development',
      configuration: {
        database: !!process.env.DATABASE_URL,
        housecallApi: !!(process.env.HOUSECALL_PRO_API_KEY || process.env.HCP_COMPANY_API_KEY),
        housecallWebhook: !!process.env.HOUSECALL_WEBHOOK_SECRET,
        googleMaps: !!process.env.GOOGLE_MAPS_API_KEY,
        googleMapsVite: !!process.env.VITE_GOOGLE_MAPS_API_KEY,
        twilio: !!process.env.TWILIO_ACCOUNT_SID,
        sessionSecret: !!process.env.SESSION_SECRET,
        siteUrl: process.env.SITE_URL || 'auto-detected',
        corsOrigin: process.env.CORS_ORIGIN || 'not-configured',
        adminConfigured: !!process.env.SUPER_ADMIN_EMAIL,
        googleAds: !!process.env.GOOGLE_ADS_CLIENT_ID,
        mcpPort: process.env.MCP_PORT || '3001',
        port: process.env.PORT || '5000'
      },
      errors: validationResult.errors,
      warnings: validationResult.warnings
    };

    res.json(status);
  });

  // Sitemap.xml for SEO
  app.get("/sitemap.xml", publicReadLimiter, async (_req, res) => {
    try {
      const sitemap = await generateSitemap();
      res.header('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      logError('Error generating sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Robots.txt for SEO
  app.get("/robots.txt", publicReadLimiter, async (req, res) => {
    const siteUrl = process.env.SITE_URL || `https://${req.get('host')}`;
    const robotsTxt = `# Johnson Bros. Plumbing & Drain Cleaning
User-agent: *
Allow: /
Disallow: /api/admin/

Sitemap: ${siteUrl}/sitemap.xml
`;
    res.header('Content-Type', 'text/plain');
    res.send(robotsTxt);
  });

  // Google Business Reviews endpoint
  app.get("/api/v1/google-reviews", publicReadLimiter, async (_req, res) => {
    try {
      const apiKey = process.env.GOOGLE_PLACES_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Google Places API key not configured" });
      }

      // Your two business locations
      const locations = [
        {
          placeId: "ChIJTc2fRf_wZU4Ry1Mv_MR3GUc",
          name: "Johnson Bros. Plumbing & Drain Cleaning - Quincy",
          address: "75 E Elm Ave, Quincy, MA 02170, USA",
          shortName: "Quincy"
        },
        {
          placeId: "ChIJPePacTlw-kkR8qUHEEuX1bc", 
          name: "Johnson Bros. Plumbing & Drain Cleaning - Abington",
          address: "55 Brighton St, Abington, MA 02351, USA",
          shortName: "Abington"
        }
      ];

      const allReviews: any[] = [];
      let totalRating = 0;
      let totalReviewCount = 0;

      for (const location of locations) {
        try {
          // Fetch place details including reviews
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${location.placeId}&fields=name,rating,user_ratings_total,reviews,formatted_address,url&key=${apiKey}`
          );
          
          const data = await response.json();
          
          if (data.status === 'OK' && data.result) {
            const place = data.result;
            
            totalRating += (place.rating || 0) * (place.user_ratings_total || 0);
            totalReviewCount += place.user_ratings_total || 0;

            // Process reviews
            if (place.reviews) {
              place.reviews.forEach((review: any) => {
                allReviews.push({
                  id: `${location.placeId}-${review.time}`,
                  author: review.author_name,
                  rating: review.rating,
                  text: review.text,
                  time: new Date(review.time * 1000).toISOString(),
                  location: location.shortName,
                  profilePhoto: review.profile_photo_url,
                  source: 'google'
                });
              });
            }
          }
        } catch (error) {
          logError(`Error fetching reviews for ${location.name}:`, error);
        }
      }

      // Sort reviews by date (newest first)
      allReviews.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

      const averageRating = totalReviewCount > 0 ? totalRating / totalReviewCount : 0;

      res.json({
        reviews: allReviews,
        totalReviews: totalReviewCount,
        averageRating: Math.round(averageRating * 10) / 10,
        locations: locations
      });

    } catch (error) {
      logError("Error fetching Google reviews:", error);
      res.status(500).json({ error: "Failed to fetch Google reviews" });
    }
  });

  // Get appointment details
  app.get("/api/v1/appointments/:id", publicReadLimiter, async (req, res) => {
    try {
      const { id } = req.params;
      const appointment = await storage.getAppointment(id);
      
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }

      const customer = appointment.customerId ? await storage.getCustomer(appointment.customerId.toString()) : null;
      // Service info is stored in serviceType, no separate service table
      const service = { name: appointment.serviceType, type: appointment.serviceType };

      res.json({
        ...appointment,
        customer,
        service,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch appointment" });
    }
  });

  // Check service area using Google Maps Geocoding API
  app.post("/api/v1/check-service-area", publicWriteLimiter, async (req, res) => {
    try {
      const { address } = req.body;

      if (!address) {
        return res.status(400).json({ error: "Address is required" });
      }

      // Use Google Maps API to geocode address and check service area
      const result = await checkServiceArea(address);

      res.json(result);
    } catch (error) {
      logError('Error checking service area:', error);
      res.status(500).json({ error: "Failed to check service area" });
    }
  });

  // Social Proof API Routes
  
  // Get recent completed jobs for social proof
  app.get("/api/v1/social-proof/recent-jobs", publicReadLimiter, async (_req, res) => {
    try {
      const data = await callHousecallAPI('/jobs', {
        page_size: 10,
        sort_direction: 'desc'
      });

      const recentJobs = data.jobs?.filter((job: any) => 
        job.work_timestamps?.completed_at && job.address?.city
      ).map((job: any) => {
        // Extract real job summary from line items and service description
        const generateJobSummaryFromLineItems = (job: any) => {
          // Try to get actual line items first
          let summary = '';
          
          if (job.line_items && job.line_items.length > 0) {
            // Use actual line items from the job
            const items = job.line_items.slice(0, 2).map((item: any) => item.name || item.description).filter(Boolean);
            if (items.length > 0) {
              summary = items.join(' and ');
            }
          }
          
          // Fall back to job type or description
          if (!summary) {
            summary = job.job_fields?.job_type?.name || 
                     job.description || 
                     job.work_descriptions?.[0] || 
                     'Plumbing service completed';
          }
          
          return summary;
        };

        // Extract real technician name
        const getTechnicianName = (job: any) => {
          if (job.assigned_employees && job.assigned_employees.length > 0) {
            const employee = job.assigned_employees[0];
            return `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'Our technician';
          }
          return 'Our technician';
        };

        return {
          id: job.id,
          serviceType: job.job_fields?.job_type?.name || 'Plumbing Service',
          jobSummary: generateJobSummaryFromLineItems(job),
          completedAt: job.work_timestamps?.completed_at,
          city: job.address?.city || 'Local Area',
          state: job.address?.state || 'MA',
          technician: getTechnicianName(job),
          customerInitial: job.customer?.first_name?.charAt(0) || 'J',
          streetAddress: job.address?.street || 'Residential Area'
        };
      }) || [];

      res.json(recentJobs);
    } catch (error) {
      logError("Error fetching recent jobs:", error);
      res.status(500).json({ error: "Failed to fetch recent jobs" });
    }
  });

  // Get overall business stats for social proof
  app.get("/api/v1/social-proof/stats", publicReadLimiter, async (_req, res) => {
    try {
      const [completedJobs, allCustomers] = await Promise.all([
        callHousecallAPI('/jobs', {
          page_size: 100
        }),
        callHousecallAPI('/customers', {
          page_size: 100
        })
      ]);

      const stats = {
        totalJobsCompleted: completedJobs.total_items || 0,
        totalCustomers: allCustomers.total_items || 0,
        // Calculate this month's jobs
        thisMonthJobs: completedJobs.jobs?.filter((job: any) => {
          if (!job.work_timestamps?.completed_at) return false;
          const completedDate = new Date(job.work_timestamps.completed_at);
          const now = new Date();
          return completedDate.getMonth() === now.getMonth() && 
                 completedDate.getFullYear() === now.getFullYear();
        }).length || 0,
        // Calculate average job value
        averageJobValue: completedJobs.jobs?.reduce((sum: number, job: any) => {
          return sum + (parseFloat(job.total_amount) || 0);
        }, 0) / (completedJobs.jobs?.length || 1) || 0
      };

      res.json(stats);
    } catch (error) {
      logError("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch business stats" });
    }
  });

  // Get current live activity for social proof
  app.get("/api/v1/social-proof/live-activity", publicReadLimiter, async (_req, res) => {
    try {
      const data = await callHousecallAPI('/jobs', {
        page_size: 8,
        sort_direction: 'desc'
      });

      const liveActivity = data.jobs?.filter((job: any) => 
        (job.work_status === 'in_progress' || job.work_status === 'scheduled') && job.address?.city
      ).map((job: any) => ({
        id: job.id,
        serviceType: job.job_fields?.job_type?.name || 'Service Call',
        status: job.work_status,
        scheduledTime: job.schedule?.scheduled_start,
        city: job.address?.city || 'Local Area',
        state: job.address?.state || 'MA'
      })) || [];

      res.json(liveActivity);
    } catch (error) {
      logError("Error fetching live activity:", error);
      res.status(500).json({ error: "Failed to fetch live activity" });
    }
  });

  // Get customer testimonials/reviews from recent jobs
  app.get("/api/v1/social-proof/testimonials", publicReadLimiter, async (_req, res) => {
    try {
      // Fetch recent jobs with high total amounts (satisfied customers)
      const data = await callHousecallAPI('/jobs', {
        page_size: 20,
        sort_direction: 'desc'
      });

      // Generate testimonials based on completed jobs data
      const testimonials = data.jobs?.filter((job: any) => 
        job.work_timestamps?.completed_at && parseFloat(job.total_amount || '0') > 50
      ).slice(0, 6).map((job: any) => ({
        id: job.id,
        rating: 5, // Assume satisfied customers for completed jobs
        comment: generateTestimonialText(job.job_fields?.job_type?.name || job.description || 'service'),
        serviceType: job.job_fields?.job_type?.name || 'Plumbing Service',
        date: job.work_timestamps?.completed_at,
        city: job.address?.city || 'Local Area'
      })) || [];

      res.json(testimonials);
    } catch (error) {
      logError("Error fetching testimonials:", error);
      res.status(500).json({ error: "Failed to fetch testimonials" });
    }
  });

  // Sync customer addresses from Housecall Pro to database (ADMIN ONLY)
  app.post("/api/admin/sync-customer-addresses", adminLimiter, authenticate, async (_req, res) => {
    try {
      // Update sync status
      await db.insert(syncStatus).values({
        syncType: 'customers',
        status: 'running',
        lastSyncAt: new Date(),
      }).onConflictDoUpdate({
        target: syncStatus.syncType,
        set: {
          status: 'running',
          lastSyncAt: new Date(),
          error: null,
        }
      });

      // Fetch ALL customers from Housecall Pro (no limit on pages)
      const allCustomers: any[] = [];
      let page = 1;
      let hasMore = true;
      
      Logger.info(`Starting comprehensive customer sync at ${new Date().toISOString()}`);
      
      while (hasMore) { // Fetch ALL pages
        const data = await callHousecallAPI('/customers', {
          page: page,
          page_size: 100,
        });
        
        if (data.customers && data.customers.length > 0) {
          allCustomers.push(...data.customers);
          page++;
          hasMore = data.customers.length === 100;
        } else {
          hasMore = false;
        }
      }

      // Process and store customer addresses
      let processedCount = 0;
      const cityStats: Record<string, { count: number, lat: number, lng: number }> = {};

      for (const customer of allCustomers) {
        if (customer.addresses && Array.isArray(customer.addresses)) {
          for (const address of customer.addresses) {
            if (address.state === 'MA' || address.state === 'Massachusetts') {
              // Calculate privacy offset for display
              const privacyOffsetLat = (Math.random() - 0.5) * 0.002;
              const privacyOffsetLng = (Math.random() - 0.5) * 0.002;
              
              // Get coordinates
              let lat = null, lng = null;
              if (address.latitude && address.longitude) {
                lat = typeof address.latitude === 'string' ? parseFloat(address.latitude) : address.latitude;
                lng = typeof address.longitude === 'string' ? parseFloat(address.longitude) : address.longitude;
              }

              // Only store if we have valid data
              if (address.city && !isNaN(lat!) && !isNaN(lng!)) {
                await db.insert(customerAddresses).values({
                  customerId: customer.id,
                  street: address.street,
                  city: address.city,
                  state: address.state,
                  zip: address.zip,
                  latitude: lat,
                  longitude: lng,
                  displayLat: lat ? lat + privacyOffsetLat : null,
                  displayLng: lng ? lng + privacyOffsetLng : null,
                }).onConflictDoNothing();
                
                processedCount++;

                // Track city statistics
                if (!cityStats[address.city]) {
                  cityStats[address.city] = { count: 0, lat: 0, lng: 0 };
                }
                cityStats[address.city].count++;
                if (lat && lng) {
                  cityStats[address.city].lat += lat;
                  cityStats[address.city].lng += lng;
                }
              }
            }
          }
        }
      }

      // Update service areas table
      for (const [city, stats] of Object.entries(cityStats)) {
        const avgLat = stats.lat / stats.count;
        const avgLng = stats.lng / stats.count;
        
        await db.insert(serviceAreas).values({
          city: city,
          state: 'MA',
          centerLat: avgLat || 0,
          centerLng: avgLng || 0,
          totalCustomers: stats.count,
        }).onConflictDoUpdate({
          target: serviceAreas.city,
          set: {
            totalCustomers: stats.count,
            centerLat: avgLat || 0,
            centerLng: avgLng || 0,
            lastUpdated: new Date(),
          }
        });
      }

      // Rebuild heat map cache
      await rebuildHeatMapCache();

      // Update sync status
      await db.update(syncStatus)
        .set({
          status: 'completed',
          recordsProcessed: processedCount,
          error: null,
        })
        .where(eq(syncStatus.syncType, 'customers'));

      res.json({
        success: true,
        customersProcessed: allCustomers.length,
        addressesStored: processedCount,
        cities: Object.keys(cityStats).length,
        syncedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      logError("Sync error:", error);
      
      await db.update(syncStatus)
        .set({
          status: 'failed',
          error: getErrorMessage(error),
        })
        .where(eq(syncStatus.syncType, 'customers'));
      
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Helper function to rebuild heat map cache
  async function rebuildHeatMapCache() {
    // Clear existing cache
    await db.delete(heatMapCache);
    
    // Get all addresses with privacy offset
    const addresses = await db.select().from(customerAddresses);
    
    // Ultra-granular grid utilizing all customer locations
    const gridSize = 0.0015; // About 150m grid - maximum granularity
    const gridMap = new Map<string, { lat: number, lng: number, count: number, city: string }>();
    const additionalPoints: any[] = [];
    
    // Process ALL addresses to utilize 3000+ customer locations
    addresses.forEach((addr, index) => {
      if (addr.displayLat && addr.displayLng) {
        // Primary grid point with slight randomization for privacy
        const privacyOffset = 0.0005; // ~50m random offset
        const gridLat = Math.round(addr.displayLat / gridSize) * gridSize + (Math.random() - 0.5) * privacyOffset;
        const gridLng = Math.round(addr.displayLng / gridSize) * gridSize + (Math.random() - 0.5) * privacyOffset;
        const key = `${gridLat.toFixed(4)},${gridLng.toFixed(4)}`;
        
        if (!gridMap.has(key)) {
          gridMap.set(key, {
            lat: gridLat,
            lng: gridLng,
            count: 0,
            city: addr.city || 'Unknown'
          });
        }
        gridMap.get(key)!.count++;
        
        // For every 3rd address, add a surrounding point for density visualization
        if (index % 3 === 0) {
          const angle = (index * 2.4) % (Math.PI * 2);
          const radius = gridSize * 0.8;
          additionalPoints.push({
            lat: addr.displayLat + Math.cos(angle) * radius + (Math.random() - 0.5) * privacyOffset,
            lng: addr.displayLng + Math.sin(angle) * radius + (Math.random() - 0.5) * privacyOffset,
            count: 1,
            city: addr.city || 'Unknown'
          });
        }
      }
    });
    
    // Combine all points to show comprehensive coverage
    const allPoints = [
      ...Array.from(gridMap.values()),
      ...additionalPoints
    ];
    
    // Use intelligent sampling to keep it lightweight while showing all areas
    const maxPoints = 1200; // Optimal balance of detail and performance
    let finalPoints = [];
    
    if (allPoints.length <= maxPoints) {
      finalPoints = allPoints;
    } else {
      // Smart sampling: take high-density areas plus distributed coverage
      const highDensity = allPoints.filter(p => p.count > 2);
      const remaining = allPoints.filter(p => p.count <= 2);
      
      // Take all high density points
      finalPoints = [...highDensity];
      
      // Sample remaining points evenly across the map
      const sampleRate = Math.max(1, Math.floor(remaining.length / (maxPoints - highDensity.length)));
      for (let i = 0; i < remaining.length; i += sampleRate) {
        if (finalPoints.length < maxPoints) {
          finalPoints.push(remaining[i]);
        }
      }
    }
    
    // Sort by count and limit to maxPoints
    const sortedGrids = finalPoints
      .sort((a, b) => b.count - a.count)
      .slice(0, maxPoints); // 1200 points for comprehensive coverage
    
    for (const grid of sortedGrids) {
      await db.insert(heatMapCache).values({
        gridLat: grid.lat,
        gridLng: grid.lng,
        pointCount: grid.count,
        intensity: Math.min(grid.count / 3, 1), // Adjusted intensity for visibility
        cityName: grid.city,
      });
    }
  }

  // Daily sync endpoint - can be called by a cron job or scheduler (ADMIN ONLY)
  app.post("/api/admin/daily-sync", adminLimiter, authenticate, async (req, res) => {
    try {
      Logger.info(`Running daily sync at ${new Date().toISOString()}`);
      
      // Call the sync endpoint internally
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      const host = process.env.NODE_ENV === 'production' ? req.get('host') : 'localhost:5000';
      // Only include internal secret header if configured
      const headers: Record<string, string> = { 
        'Content-Type': 'application/json'
      };
      if (process.env.INTERNAL_SECRET) {
        headers['X-Internal-Secret'] = process.env.INTERNAL_SECRET;
      }
      
      const response = await fetch(`${protocol}://${host}/api/admin/sync-customer-addresses`, {
        method: 'POST',
        headers
      });
      
      const result = await response.json();
      
      res.json({
        success: true,
        message: 'Daily sync completed',
        ...result
      });
    } catch (error: any) {
      logError("Daily sync failed:", error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Auto-sync on server start (runs once when server starts)
  setTimeout(async () => {
    try {
      Logger.info("Running initial data sync on server start...");
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      const host = process.env.NODE_ENV === 'production' ? process.env.REPL_SLUG ? `${process.env.REPL_SLUG}-${process.env.REPL_OWNER}.replit.app` : 'localhost:5000' : 'localhost:5000';
      // Only include internal secret header if configured
      const headers: Record<string, string> = { 
        'Content-Type': 'application/json'
      };
      if (process.env.INTERNAL_SECRET) {
        headers['X-Internal-Secret'] = process.env.INTERNAL_SECRET;
      }
      
      await fetch(`${protocol}://${host}/api/admin/sync-customer-addresses`, {
        method: 'POST',
        headers
      });
      Logger.info("Initial sync completed");
    } catch (error) {
      logError("Initial sync failed:", error);
    }
  }, 5000); // Wait 5 seconds after server start

  // Get optimized heat map data from database
  app.get("/api/v1/social-proof/service-heat-map", publicReadLimiter, async (_req, res) => {
    try {
      // First check if we have cached data
      const cachedData = await db.select().from(heatMapCache);
      
      if (cachedData.length > 0) {
        // Use cached data for instant response
        const heatMapData = cachedData.map(point => ({
          city: point.cityName || 'Unknown',
          count: point.pointCount || 1,
          lat: point.gridLat!,
          lng: point.gridLng!,
          intensity: point.intensity || 0.8
        }));
        
        Logger.info(`Heat map: Serving ${heatMapData.length} cached grid points from 3000+ customers`);
        return res.json(heatMapData);
      }
      
      // Fallback: Generate from customer addresses if no cache
      const addresses = await db.select().from(customerAddresses);
      
      if (addresses.length === 0) {
        // If no database data, fetch from API and sync
        Logger.info("No cached data, syncing from Housecall Pro...");
        
        // Trigger sync in background
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
        const host = process.env.NODE_ENV === 'production' ? process.env.REPL_SLUG ? `${process.env.REPL_SLUG}-${process.env.REPL_OWNER}.replit.app` : 'localhost:5000' : 'localhost:5000';
        // Only include internal secret header if configured
        const headers: Record<string, string> = { 
          'Content-Type': 'application/json'
        };
        if (process.env.INTERNAL_SECRET) {
          headers['X-Internal-Secret'] = process.env.INTERNAL_SECRET;
        }
        
        fetch(`${protocol}://${host}/api/admin/sync-customer-addresses`, { 
          method: 'POST',
          headers
        }).catch(err => logError("Background sync failed:", err));
        
        // Return empty for now
        return res.json([]);
      }
      
      // Generate heat map data from addresses
      const heatMapData = addresses
        .filter(addr => addr.displayLat && addr.displayLng)
        .map(addr => ({
          city: addr.city || 'Unknown',
          count: 1,
          lat: addr.displayLat!,
          lng: addr.displayLng!,
          intensity: 0.8
        }));
      
      Logger.info(`Heat map: Generated ${heatMapData.length} points from database`);
      res.json(heatMapData);
    } catch (error) {
      logError("Error fetching heat map data:", error);
      res.status(500).json({ error: "Failed to fetch heat map data" });
    }
  });

  // Get recent check-ins for public activity feed
  app.get("/api/v1/social-proof/check-ins", publicReadLimiter, async (_req, res) => {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const checkInsData = await db
        .select({
          id: checkIns.id,
          jobId: checkIns.jobId,
          customerName: checkIns.customerName,
          serviceType: checkIns.serviceType,
          status: checkIns.status,
          checkInTime: checkIns.checkInTime,
          city: checkIns.city,
          state: checkIns.state
        })
        .from(checkIns)
        .where(and(
          gte(checkIns.checkInTime, oneDayAgo),
          eq(checkIns.isVisible, true)
        ))
        .orderBy(desc(checkIns.checkInTime))
        .limit(50);
      
      res.json({ checkIns: checkInsData });
    } catch (error) {
      logError("Error fetching check-ins:", error);
      res.status(500).json({ error: "Failed to fetch check-ins" });
    }
  });

  // Debug endpoint to see raw HCP job data
  app.get('/api/debug/jobs/:date', debugLimiter, async (req, res) => {
    try {
      const { date } = req.params;
      const targetDate = new Date(date);
      
      // Calculate date range
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      const hcpClient = HousecallProClient.getInstance();
      
      // Get jobs with status filters
      const jobs = await hcpClient.getJobs({
        scheduled_start_min: startOfDay.toISOString(),
        scheduled_start_max: endOfDay.toISOString(),
        work_status: ['scheduled', 'in_progress'],
      });
      
      res.json({
        date: date,
        dateRange: {
          start: startOfDay.toISOString(),
          end: endOfDay.toISOString()
        },
        jobCount: jobs.length,
        jobs: jobs.map(job => ({
          id: job.id,
          work_status: job.work_status,
          scheduled_start: job.scheduled_start,
          scheduled_end: job.scheduled_end,
          assigned_employees: (job as any).assigned_employees || [],
          full_job: job
        }))
      });
      
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  // ============================================
  // WEBHOOK ENDPOINTS
  // ============================================
  
  // Import webhook processor
  const { webhookProcessor } = await import('./src/webhooks');

  // Main webhook endpoint to receive events from Housecall Pro
  app.post('/webhooks/housecall', webhookLimiter, async (req, res) => {
    try {
      // Verify webhook signature if secret is configured
      const webhookSecret = process.env.HOUSECALL_WEBHOOK_SECRET;
      
      if (webhookSecret) {
        // Housecall Pro typically sends the signature in a header like X-Housecall-Signature or similar
        // The exact header name should be confirmed from their documentation
        const signature = req.headers['x-housecall-signature'] || 
                         req.headers['x-webhook-signature'] || 
                         req.headers['x-signature'] as string;
        
        if (!signature) {
          Logger.error('[Webhook] Missing signature header');
          return res.status(401).json({ 
            success: false, 
            error: 'Missing webhook signature' 
          });
        }
        
        // Get the raw body for signature verification (requires raw body middleware)
        const rawBody = JSON.stringify(req.body);
        
        // Verify the signature
        const signatureString = Array.isArray(signature) ? signature[0] : signature;
        const isValid = webhookProcessor.verifyWebhookSignature(
          rawBody,
          signatureString,
          webhookSecret
        );
        
        if (!isValid) {
          Logger.error('[Webhook] Invalid signature');
          return res.status(401).json({ 
            success: false, 
            error: 'Invalid webhook signature' 
          });
        }
        
        Logger.info('[Webhook] Signature verified successfully');
      } else {
        console.warn('[Webhook] No webhook secret configured - signature verification skipped');
      }
      
      Logger.info('[Webhook] Received event:', req.body);
      
      // Get event type from headers or body
      const eventType = req.headers['x-event-type'] as string || 
                       req.body.event_type || 
                       req.body.type ||
                       'unknown';
      
      // Process the webhook event
      const result = await webhookProcessor.processWebhookEvent(
        eventType,
        req.body,
        req.headers as Record<string, string>
      );

      if (result.success) {
        Logger.info(`[Webhook] Successfully processed event ${result.eventId} of type ${eventType}`);
        res.status(200).json({ 
          success: true, 
          eventId: result.eventId,
          message: 'Webhook received and queued for processing' 
        });
      } else {
        Logger.error('[Webhook] Failed to process event:', { error: result.error });
        res.status(500).json({ 
          success: false, 
          error: result.error 
        });
      }
    } catch (error) {
      logError('[Webhook] Error handling webhook:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Get webhook events dashboard data
  app.get('/api/webhooks/events', webhookLimiter, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const category = req.query.category as string;
      
      const events = category 
        ? await webhookProcessor.getEventsByCategory(category, limit)
        : await webhookProcessor.getRecentEvents(limit);
      
      res.json(events);
    } catch (error) {
      logError('Error fetching webhook events:', error);
      res.status(500).json({ error: 'Failed to fetch webhook events' });
    }
  });

  // Get webhook event details with processed data and tags
  app.get('/api/webhooks/events/:eventId', webhookLimiter, async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const data = await webhookProcessor.getProcessedDataWithTags(eventId);
      
      if (!data) {
        return res.status(404).json({ error: 'Event not found' });
      }
      
      res.json(data);
    } catch (error) {
      logError('Error fetching webhook event details:', error);
      res.status(500).json({ error: 'Failed to fetch event details' });
    }
  });

  // Get webhook analytics
  app.get('/api/webhooks/analytics', webhookLimiter, async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const analytics = await webhookProcessor.getAnalytics(startDate, endDate);
      
      res.json(analytics);
    } catch (error) {
      logError('Error fetching webhook analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  // Get webhook configuration status
  app.get('/api/webhooks/config', webhookLimiter, async (req, res) => {
    try {
      const hasSecret = !!process.env.HOUSECALL_WEBHOOK_SECRET;
      const webhookUrl = process.env.WEBHOOK_URL || `https://${req.headers.host}/api/webhooks/housecall`;
      
      res.json({
        webhookUrl,
        signatureVerification: hasSecret ? 'enabled' : 'disabled',
        status: hasSecret ? 'secured' : 'insecure',
        instructions: {
          setup: [
            'Log in to your Housecall Pro account',
            'Navigate to Settings → Integrations → Webhooks',
            `Set webhook URL to: ${webhookUrl}`,
            'Copy the webhook signing secret provided by Housecall Pro',
            'Add the secret to your environment variables as HOUSECALL_WEBHOOK_SECRET',
            'Select the events you want to receive',
            'Test the webhook connection'
          ],
          headers: [
            'X-Housecall-Signature - The HMAC signature header',
            'X-Event-Type - The type of event being sent'
          ]
        }
      });
    } catch (error) {
      logError('Error fetching webhook config:', error);
      res.status(500).json({ error: 'Failed to fetch webhook configuration' });
    }
  });
  
  // Subscribe to webhooks for a company
  app.post('/api/webhooks/subscribe', webhookLimiter, async (req, res) => {
    try {
      const { companyId, eventTypes } = req.body;
      
      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }
      
      // Get the current server URL for webhook callback
      const webhookUrl = process.env.WEBHOOK_URL || `https://${req.headers.host}/api/webhooks/housecall`;
      
      // Register subscription in database
      const [subscription] = await webhookProcessor.manageSubscription(
        companyId,
        webhookUrl,
        eventTypes
      );
      
      // TODO: Call Housecall Pro API to register webhook subscription
      // This would require the actual endpoint from their API
      
      res.json({
        success: true,
        subscription,
        message: 'Webhook subscription registered successfully',
        note: 'Remember to configure HOUSECALL_WEBHOOK_SECRET environment variable with the signing secret from Housecall Pro'
      });
    } catch (error) {
      logError('Error subscribing to webhooks:', error);
      res.status(500).json({ error: 'Failed to subscribe to webhooks' });
    }
  });

  // Test webhook endpoint (for development/testing)
  app.post('/api/webhooks/test', webhookLimiter, async (req, res) => {
    try {
      const testEvent = {
        id: `test-${Date.now()}`,
        event_type: req.body.event_type || 'job.completed',
        company_id: 'test-company',
        customer: {
          id: 'test-customer-1',
          first_name: 'Test',
          last_name: 'Customer',
          email: 'test@example.com',
          mobile_number: '555-0123'
        },
        job: {
          id: 'test-job-1',
          invoice_number: 'INV-TEST-001',
          name: 'Emergency Drain Cleaning',
          total_amount: 750,
          work_status: 'completed',
          completed_at: new Date().toISOString()
        },
        address: {
          street: '123 Test St',
          city: 'Quincy',
          state: 'MA',
          zip: '02169'
        },
        ...req.body
      };

      const result = await webhookProcessor.processWebhookEvent(
        testEvent.event_type,
        testEvent,
        req.headers as Record<string, string>
      );

      res.json({
        success: true,
        message: 'Test webhook processed',
        eventId: result.eventId,
        testData: testEvent
      });
    } catch (error) {
      logError('Error processing test webhook:', error);
      res.status(500).json({ error: 'Failed to process test webhook' });
    }
  });

  // ========== HEAT MAP ENDPOINTS ==========
  
  const { heatMapService } = await import('./src/heatmap');

  // Import historical job data from Housecall Pro (ADMIN ONLY)
  app.post('/api/admin/heatmap/import', adminLimiter, authenticate, async (req, res) => {
    try {
      const { startDate } = req.body;
      const apiKey = process.env.HOUSECALL_PRO_API_KEY;

      if (!apiKey) {
        return res.status(400).json({ error: 'Housecall Pro API key not configured' });
      }

      Logger.info('[HeatMap] Starting historical import...');
      
      const result = await heatMapService.importHistoricalJobs(apiKey, startDate || '2022-01-01');
      
      res.json({
        success: result.success,
        imported: result.imported,
        skipped: result.skipped,
        error: result.error,
        message: `Imported ${result.imported} jobs, skipped ${result.skipped}`
      });
    } catch (error) {
      logError('[HeatMap] Import error:', error);
      res.status(500).json({ error: 'Failed to import historical data' });
    }
  });

  // Get heat map data for admin dashboard (real-time) (ADMIN ONLY)
  app.get('/api/admin/heatmap/data', adminLimiter, authenticate, async (req, res) => {
    try {
      const daysBack = parseInt(req.query.days as string) || 730;
      const data = await heatMapService.getHeatMapData(daysBack);
      
      res.json({
        dataPoints: data,
        count: data.length
      });
    } catch (error) {
      logError('[HeatMap] Error fetching data:', error);
      res.status(500).json({ error: 'Failed to fetch heat map data' });
    }
  });

  // Get heat map statistics (ADMIN ONLY)
  app.get('/api/admin/heatmap/stats', adminLimiter, authenticate, async (req, res) => {
    try {
      const stats = await heatMapService.getStatistics();
      res.json(stats);
    } catch (error) {
      logError('[HeatMap] Error fetching stats:', error);
      res.status(500).json({ error: 'Failed to fetch heat map statistics' });
    }
  });

  // Get recent check-ins for activity feed
  app.get('/api/checkins', publicReadLimiter, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const checkIns = await heatMapService.getRecentCheckIns(limit);
      
      res.json({
        checkIns,
        count: checkIns.length
      });
    } catch (error) {
      logError('[HeatMap] Error fetching check-ins:', error);
      res.status(500).json({ error: 'Failed to fetch check-ins' });
    }
  });

  // Generate heat map snapshot (ADMIN ONLY)
  app.post('/api/admin/heatmap/snapshot', adminLimiter, authenticate, async (req, res) => {
    try {
      const { imageUrl, imageData } = req.body;
      
      if (!imageUrl) {
        return res.status(400).json({ error: 'Image URL is required' });
      }

      await heatMapService.generateSnapshot(imageUrl, imageData);
      
      res.json({
        success: true,
        message: 'Snapshot generated successfully',
        imageUrl
      });
    } catch (error) {
      logError('[HeatMap] Error generating snapshot:', error);
      res.status(500).json({ error: 'Failed to generate snapshot' });
    }
  });

  // Get active heat map snapshot for public display
  app.get('/api/heatmap/snapshot', publicReadLimiter, async (req, res) => {
    try {
      const snapshot = await heatMapService.getActiveSnapshot();
      
      if (!snapshot) {
        return res.status(404).json({ error: 'No active snapshot available' });
      }

      res.json({
        imageUrl: snapshot.imageUrl,
        dataPointCount: snapshot.dataPointCount,
        generatedAt: snapshot.generatedAt,
        metadata: snapshot.metadata ? JSON.parse(snapshot.metadata) : null
      });
    } catch (error) {
      logError('[HeatMap] Error fetching snapshot:', error);
      res.status(500).json({ error: 'Failed to fetch snapshot' });
    }
  });

  // Update job intensities (background job) (ADMIN ONLY)
  app.post('/api/admin/heatmap/update-intensities', adminLimiter, authenticate, async (req, res) => {
    try {
      await heatMapService.updateIntensities();
      res.json({ success: true, message: 'Intensities updated successfully' });
    } catch (error) {
      logError('[HeatMap] Error updating intensities:', error);
      res.status(500).json({ error: 'Failed to update intensities' });
    }
  });

  const mcpAuthToken = process.env.MCP_AUTH_TOKEN;
  const mcpAuthInfo = mcpAuthToken
    ? {
        type: "bearer",
        description: "Bearer token required for MCP access. Send Authorization: Bearer <token>."
      }
    : {
        type: "none",
        description: "No authentication required - publicly accessible to all AI assistants"
      };

  const MCP_SERVER_INTERNAL_URL = (() => {
    const configured = process.env.MCP_SERVER_INTERNAL_URL || 'http://localhost:3001/mcp';
    return configured.endsWith('/mcp') ? configured : `${configured.replace(/\/$/, '')}/mcp`;
  })();

  // GET /mcp - Status endpoint for crawlers and AI agents to verify endpoint presence
  app.get('/mcp', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Mcp-Session-Id, X-MCP-Client, Authorization');
    res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');
    res.json({
      status: 'ready',
      name: 'Johnson Bros. Plumbing MCP Server',
      version: '1.0.0',
      protocol: 'mcp-streamable-http',
      description: 'Model Context Protocol server for booking plumbing services',
      methods: {
        POST: 'Send JSON-RPC requests (initialize, tools/list, tools/call)',
        GET: 'This status endpoint',
        DELETE: 'Close MCP session'
      },
      discovery: '/.well-known/mcp.json',
      documentation: '/api/mcp/docs'
    });
  });

  // OPTIONS /mcp - CORS preflight
  app.options('/mcp', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Mcp-Session-Id, X-MCP-Client, Authorization, User-Agent');
    res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.status(204).end();
  });

  // POST/DELETE /mcp - MCP transport proxy (exposes MCP over the main web port)
  app.post('/mcp', async (req, res) => {
    try {
      const headers: Record<string, string> = {
        'content-type': 'application/json'
      };
      const accept = req.headers['accept'];
      const sessionId = req.headers['mcp-session-id'];
      const client = req.headers['x-mcp-client'];
      const authorization = req.headers['authorization'];
      const userAgent = req.headers['user-agent'];

      // Accept header normalization: MCP SDK requires both application/json and text/event-stream
      // Many external AI clients only send application/json, so we add text/event-stream automatically
      const originalAccept = accept ? String(accept) : '';
      if (originalAccept.includes('text/event-stream')) {
        headers['accept'] = originalAccept;
      } else {
        // Add text/event-stream to satisfy MCP SDK requirements
        headers['accept'] = 'application/json, text/event-stream';
      }
      
      if (sessionId) headers['mcp-session-id'] = String(sessionId);
      if (client) headers['x-mcp-client'] = String(client);
      if (authorization) headers['authorization'] = String(authorization);
      if (userAgent) headers['user-agent'] = String(userAgent);

      // Preserve the request body as-is (already parsed by express.json())
      // Re-stringify to pass to internal MCP server
      let body: string | undefined;
      if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
        body = JSON.stringify(req.body);
      } else if (typeof req.body === 'string' && req.body.length > 0) {
        body = req.body;
      }

      // Log for debugging MCP initialization issues
      Logger.debug('[MCP Proxy] Forwarding request', {
        method: req.method,
        hasBody: !!body,
        bodyLength: body?.length || 0,
        accept: headers['accept'],
        sessionId: sessionId || 'new'
      });

      const response = await fetch(MCP_SERVER_INTERNAL_URL, {
        method: 'POST',
        headers,
        body
      });

      // Set CORS headers on response
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');
      
      res.status(response.status);
      response.headers.forEach((value, key) => {
        if (key.toLowerCase() === 'transfer-encoding') return;
        if (key.toLowerCase() === 'access-control-allow-origin') return; // Don't duplicate
        res.setHeader(key, value);
      });

      if (!response.body) {
        return res.end();
      }

      const stream = Readable.fromWeb(response.body as import('stream/web').ReadableStream);
      stream.pipe(res);
    } catch (error) {
      logError('Error proxying MCP POST request:', error);
      res.status(502).json({ 
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Failed to reach MCP server' },
        id: null
      });
    }
  });

  // DELETE /mcp - Session termination
  app.delete('/mcp', async (req, res) => {
    try {
      const headers: Record<string, string> = {};
      const sessionId = req.headers['mcp-session-id'];
      
      if (sessionId) headers['mcp-session-id'] = String(sessionId);

      const response = await fetch(MCP_SERVER_INTERNAL_URL, {
        method: 'DELETE',
        headers
      });

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.status(response.status);
      response.headers.forEach((value, key) => {
        if (key.toLowerCase() === 'transfer-encoding') return;
        res.setHeader(key, value);
      });

      if (!response.body) {
        return res.end();
      }

      const stream = Readable.fromWeb(response.body as import('stream/web').ReadableStream);
      stream.pipe(res);
    } catch (error) {
      logError('Error proxying MCP DELETE request:', error);
      res.status(502).json({ error: 'Failed to reach MCP server' });
    }
  });

  // ========== MCP DISCOVERY ENDPOINTS ==========
  
  // Serve .well-known/mcp.json directly (ensure it works in all environments and all domains)
  app.get('/.well-known/mcp.json', (req, res) => {
    try {
      // Set proper headers for JSON content with comprehensive CORS for cross-domain discovery
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
      res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minute cache
      res.setHeader('X-Content-Type-Options', 'nosniff');
      
      const mcpDiscovery = {
        "name": "Johnson Bros. Plumbing MCP Server",
        "description": "Model Context Protocol server for Johnson Bros. Plumbing & Drain Cleaning services",
        "version": "1.0.0",
        "company": "Johnson Bros. Plumbing & Drain Cleaning",
        "contact": {
          "phone": "(617) 479-9911",
          "email": "info@thejohnsonbros.com",
          "website": "https://www.thejohnsonbros.com"
        },
        "service_areas": [
          "Quincy, MA",
          "Abington, MA",
          "South Shore, MA"
        ],
        "services": [
          "Emergency plumbing repair",
          "Drain cleaning and unclogging",
          "Water heater service and installation", 
          "Pipe repair and replacement",
          "General plumbing service calls"
        ],
        "mcp": {
          "server_url": "/mcp",
          "server_port": process.env.MCP_PORT || "3001",
          "protocol": "streamable-http",
          "manifest_url": "/api/mcp/manifest",
          "documentation_url": "/api/mcp/docs",
          "authentication": mcpAuthInfo,
          "discovery": {
            "client_header": "X-MCP-Client",
            "user_agent_pattern": "mcp-client|ai-assistant",
            "rate_limit": "20 requests per minute"
          },
          "connection_info": {
            "endpoint": "/mcp",
            "method": "POST",
            "content_type": "application/json",
            "session_header": "Mcp-Session-Id"
          }
        },
        "capabilities": {
          "booking": true,
          "availability_check": true,
          "customer_management": true,
          "service_pricing": true,
          "real_time_scheduling": true,
          "emergency_service": true
        },
        "tools_preview": [
          "book_service_call",
          "search_availability", 
          "lookup_customer",
          "get_services",
          "get_capacity"
        ],
        "business_hours": {
          "emergency": "24/7 available",
          "regular": "Mon-Fri 7AM-7PM, Sat-Sun 8AM-6PM EST"
        },
        "last_updated": new Date().toISOString()
      };

      res.json(mcpDiscovery);
    } catch (error) {
      logError('Error serving .well-known/mcp.json:', error);
      res.status(500).json({ error: 'Failed to serve MCP discovery file' });
    }
  });

  // ========== MCP (Model Context Protocol) ENDPOINTS ==========
  
  // MCP client logging middleware (optional)
  const mcpLoggingMiddleware = (req: any, res: any, next: any) => {
    // Log MCP client for analytics (optional header)
    const clientInfo = req.headers['x-mcp-client'] || 'unknown-client';
    Logger.info(`MCP API access: ${clientInfo} from ${req.ip}`);
    next();
  };

  // MCP rate limiting (public endpoints with reasonable limits)
  const mcpLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20, // 20 requests per minute for public MCP access
    message: { error: 'Too many MCP requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // MCP Manifest Endpoint (public)
  app.get('/api/mcp/manifest', mcpLimiter, mcpLoggingMiddleware, async (req, res) => {
    try {
      const manifest = {
        name: "Johnson Bros. Plumbing MCP Server",
        version: "1.0.0",
        description: "Professional plumbing services booking and management system",
        
        company: {
          name: "Johnson Bros. Plumbing & Drain Cleaning",
          phone: "(617) 479-9911",
          email: "info@thejohnsonbros.com",
          website: "https://www.thejohnsonbros.com",
          license: "Master Plumber License #MP-001234",
          service_areas: ["Quincy, MA", "Abington, MA", "South Shore, MA"],
          emergency_service: "24/7 Available"
        },

        capabilities: {
          tools: [
            {
              name: "book_service_call",
              description: "Book a plumbing service call with Johnson Bros. Plumbing",
              parameters: {
                type: "object",
                properties: {
                  customer: {
                    type: "object",
                    properties: {
                      firstName: { type: "string", description: "Customer's first name" },
                      lastName: { type: "string", description: "Customer's last name" },
                      email: { type: "string", format: "email" },
                      phone: { type: "string", description: "Customer's phone number" },
                      address: {
                        type: "object",
                        properties: {
                          street: { type: "string" },
                          city: { type: "string" },
                          state: { type: "string", default: "MA" },
                          zipCode: { type: "string" }
                        },
                        required: ["street", "city", "zipCode"]
                      }
                    },
                    required: ["firstName", "lastName", "phone", "address"]
                  },
                  service: {
                    type: "object",
                    properties: {
                      type: {
                        type: "string",
                        enum: ["emergency", "drain_cleaning", "water_heater", "general_plumbing", "pipe_repair"],
                        description: "Type of plumbing service needed"
                      },
                      description: { type: "string", description: "Detailed description of the problem" },
                      priority: {
                        type: "string",
                        enum: ["low", "medium", "high", "emergency"],
                        default: "medium"
                      }
                    },
                    required: ["type", "description"]
                  },
                  scheduling: {
                    type: "object",
                    properties: {
                      preferredDate: { type: "string", format: "date" },
                      preferredTime: { type: "string", description: "Preferred time window" },
                      flexibility: {
                        type: "string",
                        enum: ["strict", "flexible", "asap"],
                        default: "flexible"
                      }
                    }
                  }
                },
                required: ["customer", "service"]
              }
            },
            {
              name: "search_availability",
              description: "Check available time slots for service appointments without booking",
              parameters: {
                type: "object", 
                properties: {
                  date: { type: "string", format: "date", description: "Preferred date (YYYY-MM-DD)" },
                  serviceType: {
                    type: "string", 
                    description: "Type of service needed (e.g., 'emergency plumbing', 'routine maintenance', 'drain cleaning')"
                  },
                  time_preference: {
                    type: "string",
                    enum: ["any", "morning", "afternoon", "evening"],
                    description: "Preferred time of day"
                  },
                  show_for_days: {
                    type: "number",
                    minimum: 1,
                    maximum: 30,
                    description: "Number of days to show availability for"
                  }
                },
                required: ["date", "serviceType"]
              }
            },
            {
              name: "lookup_customer",
              description: "Look up existing customer information",
              parameters: {
                type: "object",
                properties: {
                  phone: { type: "string", description: "Customer phone number" },
                  email: { type: "string", format: "email", description: "Customer email address" }
                }
              }
            },
            {
              name: "get_services",
              description: "Get detailed information about available plumbing services",
              parameters: {
                type: "object",
                properties: {
                  serviceType: {
                    type: "string",
                    enum: ["all", "emergency", "drain_cleaning", "water_heater", "general_plumbing", "pipe_repair"]
                  }
                }
              }
            },
            {
              name: "get_capacity",
              description: "Check current service capacity and booking availability",
              parameters: {
                type: "object",
                properties: {
                  date: { type: "string", format: "date" },
                  serviceArea: { type: "string", description: "City or zip code" }
                }
              }
            }
          ],
          
          resources: [
            {
              name: "service_pricing",
              description: "Current pricing information for plumbing services",
              mimeType: "application/json"
            },
            {
              name: "service_areas",
              description: "Detailed service area coverage maps",
              mimeType: "application/json"
            },
            {
              name: "business_hours",
              description: "Operating hours and emergency availability",
              mimeType: "application/json"
            }
          ]
        },

        business_info: {
          hours: {
            regular: "Monday-Friday 7AM-7PM, Saturday-Sunday 8AM-6PM EST",
            emergency: "24/7 Emergency Service Available"
          },
          service_guarantee: "100% satisfaction guaranteed on all work",
          response_time: {
            emergency: "Within 1 hour",
            standard: "Same or next day",
            scheduled: "At your preferred time"
          },
          payment_methods: ["Cash", "Check", "Credit Card", "Financing Available"],
          certifications: ["Licensed Master Plumber", "Insured & Bonded", "BBB A+ Rated"]
        },

        integration: {
          booking_system: "Housecall Pro",
          real_time_scheduling: true,
          automatic_confirmations: true,
          customer_notifications: true
        },

        metadata: {
          last_updated: new Date().toISOString(),
          api_version: "1.0.0",
          documentation_url: "/api/mcp/docs"
        },
        authentication: mcpAuthInfo
      };

      res.json(manifest);
    } catch (error) {
      logError('Error generating MCP manifest:', error);
      res.status(500).json({ error: 'Failed to generate MCP manifest' });
    }
  });

  // MCP Documentation Endpoint (public)
  app.get('/api/mcp/docs', mcpLimiter, mcpLoggingMiddleware, async (req, res) => {
    try {
      const authDocs = mcpAuthToken
        ? {
            method: "Bearer token",
            description: "Send Authorization: Bearer <token> with MCP requests.",
            note: "Provide an X-MCP-Client header to identify the assistant for analytics."
          }
        : {
            method: "None",
            description: "No authentication required - publicly accessible to all AI assistants",
            note: "Optional X-MCP-Client header can be included to identify the client for analytics"
          };

      const docs = {
        title: "Johnson Bros. Plumbing MCP Integration Guide",
        version: "1.0.0",
        description: "Complete documentation for integrating with Johnson Bros. Plumbing services via Model Context Protocol",
        
        authentication: authDocs,

        getting_started: {
          discovery: "Use the .well-known/mcp.json file for initial discovery",
          manifest: "GET /api/mcp/manifest for complete tool specifications",
          authentication: mcpAuthToken
            ? "Authorization required: Bearer token"
            : "No authentication required - endpoints are public",
          rate_limits: "20 requests per minute for public access"
        },

        tools: {
          book_service_call: {
            description: "Books a plumbing service appointment with real-time integration to Housecall Pro",
            usage: "Collects customer info, service details, and scheduling preferences",
            validation: "Address validation ensures service area coverage",
            response: "Returns booking confirmation with appointment details"
          },
          search_availability: {
            description: "Checks real-time availability for service appointments without booking",
            usage: "Query by date and service type only - no location/zip code required",
            parameters: ["date (YYYY-MM-DD)", "serviceType", "time_preference (optional)", "show_for_days (optional)"],
            response: "Returns available time slots with formatted times and scheduling options"
          },
          lookup_customer: {
            description: "Retrieves existing customer information for returning clients",
            usage: "Search by phone number or email address",
            privacy: "Limited to basic contact and service history"
          },
          get_services: {
            description: "Provides detailed service information and pricing",
            categories: ["Emergency Repair", "Drain Cleaning", "Water Heaters", "General Plumbing", "Pipe Work"]
          },
          get_capacity: {
            description: "Real-time capacity checking for optimal scheduling",
            usage: "Helps determine best appointment times and service availability"
          }
        },

        examples: {
          booking_flow: [
            "1. Check service area coverage",
            "2. Search availability for preferred date",
            "3. Collect customer information",
            "4. Book service call with all details",
            "5. Receive confirmation and scheduling"
          ],
          emergency_service: "For emergencies, use priority: 'emergency' for immediate response",
          returning_customers: "Use lookup_customer first to retrieve existing information"
        },

        business_context: {
          service_areas: "Primary: Quincy & Abington MA. Extended: South Shore region",
          specialties: "Emergency repairs, drain cleaning, water heater service",
          response_times: "Emergency: 1 hour, Standard: Same/next day",
          operating_hours: "7 days a week with 24/7 emergency availability"
        },

        integration_notes: {
          real_time_booking: "All bookings integrate directly with Housecall Pro scheduling system",
          customer_data: "Customer information is securely stored and managed",
          notifications: "Automatic confirmations and updates sent to customers",
          quality_assurance: "All work backed by satisfaction guarantee"
        },

        support: {
          technical: "Contact development team for API issues",
          business: "Call (617) 479-9911 for service questions",
          emergency: "24/7 emergency line always available"
        }
      };

      res.json(docs);
    } catch (error) {
      logError('Error generating MCP documentation:', error);
      res.status(500).json({ error: 'Failed to generate MCP documentation' });
    }
  });

  // Direct HTTP API endpoint for search_availability
  app.get('/api/mcp/search_availability', mcpLimiter, mcpLoggingMiddleware, async (req, res) => {
    try {
      const { date, serviceType, time_preference = 'any', show_for_days = 7 } = req.query;
      
      // Validate required parameters
      if (!date || !serviceType) {
        return res.status(400).json({
          success: false,
          error: "Missing required parameters: date and serviceType are required",
          error_code: "MISSING_PARAMETERS"
        });
      }

      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date as string)) {
        return res.status(400).json({
          success: false,
          error: "Invalid date format. Use YYYY-MM-DD",
          error_code: "INVALID_DATE_FORMAT"
        });
      }

      // Use the HousecallProClient to get availability
      const { HousecallProClient } = await import('./src/housecall.js');
      const hcpClient = HousecallProClient.getInstance();
      
      // Fetch booking windows
      const windows = await hcpClient.getBookingWindows(date as string);
      
      if (!windows.length) {
        return res.json({
          success: true,
          available_slots: [],
          message: `No available slots found for ${date}. Please try a different date or contact us directly.`,
          service_type: serviceType,
          date: date,
          total_slots: 0
        });
      }

      // Filter by time preference
      const COMPANY_TZ = process.env.COMPANY_TZ || "America/New_York";
      const fmt = new Intl.DateTimeFormat("en-US", {
        hour: "2-digit", hour12: false, timeZone: COMPANY_TZ
      });

      const hourLocal = (iso: string) => {
        const d = new Date(iso);
        const parts = fmt.formatToParts(d);
        const hh = Number(parts.find(p => p.type === "hour")?.value ?? "0");
        return hh;
      };

      const inPref = (startIso: string) => {
        const h = hourLocal(startIso);
        if (time_preference === "any") return true;
        if (time_preference === "morning") return h >= 7 && h < 12;
        if (time_preference === "afternoon") return h >= 12 && h < 17;
        if (time_preference === "evening") return h >= 17 && h < 21;
        return true;
      };

      const availableWindows = windows
        .filter(w => w.available && inPref(w.start_time))
        .map(w => ({
          start_time: w.start_time,
          end_time: w.end_time,
          formatted_time: new Intl.DateTimeFormat("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
            timeZone: COMPANY_TZ
          }).format(new Date(w.start_time))
        }));

      const result = {
        success: true,
        available_slots: availableWindows,
        service_type: serviceType,
        date: date,
        time_preference: time_preference,
        total_slots: availableWindows.length,
        message: availableWindows.length > 0 
          ? `Found ${availableWindows.length} available slots for ${serviceType} on ${date}`
          : `No slots available for ${time_preference} preference on ${date}. Try 'any' time preference for more options.`
      };

      res.json(result);
      
    } catch (error: any) {
      logError('Error in search_availability endpoint:', error);
      res.status(500).json({
        success: false,
        error: "An error occurred while searching availability. Please try again.",
        error_code: "INTERNAL_ERROR",
        details: getErrorMessage(error)
      });
    }
  });

  const widgetToolAllowList = new Set([
    "book_service_call",
    "search_availability",
    "get_services",
    "get_quote",
    "emergency_help",
  ]);

  app.post('/api/mcp/:toolName', mcpLimiter, mcpLoggingMiddleware, async (req, res) => {
    const { toolName } = req.params;

    if (!widgetToolAllowList.has(toolName)) {
      return res.status(404).json({ error: "Tool not available" });
    }

    try {
      const payload = req.body || {};
      const { parsed, raw } = await callMcpTool<any>(toolName, payload);
      res.json(parsed ?? { raw });
    } catch (error) {
      logError(`Error in ${toolName} endpoint:`, error);
      res.status(500).json({
        error: "An error occurred while calling the tool. Please try again.",
        details: getErrorMessage(error),
      });
    }
  });

  // Standard MCP discovery endpoint - serves the full manifest
  app.get('/.well-known/mcp/manifest.json', mcpLimiter, mcpLoggingMiddleware, async (req, res) => {
    try {
      // Set proper headers for JSON content
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minute cache
      
      // Serve the same full manifest as /api/mcp/manifest
      const manifest = {
        name: "Johnson Bros. Plumbing MCP Server",
        version: "1.0.0",
        description: "Professional plumbing services booking and management system",
        
        company: {
          name: "Johnson Bros. Plumbing & Drain Cleaning",
          phone: "(617) 479-9911",
          email: "info@thejohnsonbros.com",
          website: "https://www.thejohnsonbros.com",
          license: "Master Plumber License #MP-001234",
          service_areas: ["Quincy, MA", "Abington, MA", "South Shore, MA"],
          emergency_service: "24/7 Available"
        },

        capabilities: {
          tools: [
            {
              name: "book_service_call",
              description: "Book a plumbing service call with Johnson Bros. Plumbing",
              parameters: {
                type: "object",
                properties: {
                  customer: {
                    type: "object",
                    properties: {
                      firstName: { type: "string", description: "Customer's first name" },
                      lastName: { type: "string", description: "Customer's last name" },
                      email: { type: "string", format: "email" },
                      phone: { type: "string", description: "Customer's phone number" },
                      address: {
                        type: "object",
                        properties: {
                          street: { type: "string" },
                          city: { type: "string" },
                          state: { type: "string", default: "MA" },
                          zipCode: { type: "string" }
                        },
                        required: ["street", "city", "zipCode"]
                      }
                    },
                    required: ["firstName", "lastName", "phone", "address"]
                  },
                  service: {
                    type: "object",
                    properties: {
                      type: {
                        type: "string",
                        enum: ["emergency", "drain_cleaning", "water_heater", "general_plumbing", "pipe_repair"],
                        description: "Type of plumbing service needed"
                      },
                      description: { type: "string", description: "Detailed description of the problem" },
                      priority: {
                        type: "string",
                        enum: ["low", "medium", "high", "emergency"],
                        default: "medium"
                      }
                    },
                    required: ["type", "description"]
                  },
                  scheduling: {
                    type: "object",
                    properties: {
                      preferredDate: { type: "string", format: "date" },
                      preferredTime: { type: "string", description: "Preferred time window" },
                      flexibility: {
                        type: "string",
                        enum: ["strict", "flexible", "asap"],
                        default: "flexible"
                      }
                    }
                  }
                },
                required: ["customer", "service"]
              }
            },
            {
              name: "search_availability",
              description: "Check available time slots for service appointments without booking",
              parameters: {
                type: "object", 
                properties: {
                  date: { type: "string", format: "date", description: "Preferred date (YYYY-MM-DD)" },
                  serviceType: {
                    type: "string", 
                    description: "Type of service needed (e.g., 'emergency plumbing', 'routine maintenance', 'drain cleaning')"
                  },
                  time_preference: {
                    type: "string",
                    enum: ["any", "morning", "afternoon", "evening"],
                    description: "Preferred time of day"
                  },
                  show_for_days: {
                    type: "number",
                    minimum: 1,
                    maximum: 30,
                    description: "Number of days to show availability for"
                  }
                },
                required: ["date", "serviceType"]
              }
            },
            {
              name: "lookup_customer",
              description: "Look up existing customer information",
              parameters: {
                type: "object",
                properties: {
                  phone: { type: "string", description: "Customer phone number" },
                  email: { type: "string", format: "email", description: "Customer email address" }
                }
              }
            },
            {
              name: "get_services",
              description: "Get detailed information about available plumbing services",
              parameters: {
                type: "object",
                properties: {
                  serviceType: {
                    type: "string",
                    enum: ["all", "emergency", "drain_cleaning", "water_heater", "general_plumbing", "pipe_repair"]
                  }
                }
              }
            },
            {
              name: "get_capacity",
              description: "Check current service capacity and booking availability",
              parameters: {
                type: "object",
                properties: {
                  date: { type: "string", format: "date" },
                  serviceArea: { type: "string", description: "City or zip code" }
                }
              }
            }
          ],
          
          resources: [
            {
              name: "service_pricing",
              description: "Current pricing information for plumbing services",
              mimeType: "application/json"
            },
            {
              name: "service_areas", 
              description: "Detailed service area coverage maps",
              mimeType: "application/json"
            },
            {
              name: "business_hours",
              description: "Operating hours and emergency availability", 
              mimeType: "application/json"
            }
          ]
        },

        business_info: {
          hours: {
            regular: "Monday-Friday 7AM-7PM, Saturday-Sunday 8AM-6PM EST",
            emergency: "24/7 Emergency Service Available"
          },
          service_guarantee: "100% satisfaction guaranteed on all work",
          response_time: {
            emergency: "Within 1 hour",
            standard: "Same or next day",
            scheduled: "At your preferred time"
          },
          payment_methods: ["Cash", "Check", "Credit Card", "Financing Available"],
          certifications: ["Licensed Master Plumber", "Insured & Bonded", "BBB A+ Rated"]
        },

        integration: {
          booking_system: "Housecall Pro",
          real_time_scheduling: true,
          automatic_confirmations: true,
          customer_notifications: true
        },

        metadata: {
          last_updated: new Date().toISOString(),
          api_version: "1.0.0",
          documentation_url: "/api/mcp/docs"
        }
      };

      res.json(manifest);
    } catch (error) {
      logError('Error serving /.well-known/mcp/manifest.json:', error);
      res.status(500).json({ error: 'Failed to serve MCP manifest' });
    }
  });

  // Revenue metrics endpoint
  app.get('/api/admin/revenue-metrics', authenticate, async (req, res) => {
    try {
      // Get subscription metrics
      const subscriptions = await storage.getSubscriptions();
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const activeSubscriptions = subscriptions.filter((s: any) => s.status === 'active');
      const newThisMonth = subscriptions.filter((s: any) => 
        new Date(s.startDate) >= startOfMonth && s.status === 'active'
      );
      
      // Calculate plan distribution
      const planCounts = {
        basic: activeSubscriptions.filter((s: any) => s.planId === 1).length,
        premium: activeSubscriptions.filter((s: any) => s.planId === 2).length,
        elite: activeSubscriptions.filter((s: any) => s.planId === 3).length,
      };
      
      // Calculate MRR and ARR
      const planPrices: { [key: number]: number } = { 1: 29, 2: 49, 3: 99 };
      const mrr = activeSubscriptions.reduce((sum: number, sub: any) => 
        sum + (planPrices[sub.planId] || 0), 0
      );
      const arr = mrr * 12;
      
      // Get upsell metrics
      const upsellOffers = await storage.getUpsellOffers?.() || [];
      const activeUpsells = upsellOffers.filter((o: any) => o.isActive);
      const totalUpsellRevenue = activeUpsells.reduce((sum: number, offer: any) => 
        sum + ((offer.bundlePrice || 0) * (offer.conversions || 1)), 0
      );
      
      // Calculate customer lifetime value (simplified)
      const avgCustomerAge = 18; // months
      const avgMonthlyValue = mrr / Math.max(activeSubscriptions.length, 1);
      const clv = avgMonthlyValue * avgCustomerAge;
      
      // Mock some additional metrics
      const metrics = {
        overview: {
          totalRevenue: mrr + 15000, // Monthly recurring + one-time
          recurringRevenue: mrr,
          oneTimeRevenue: 15000,
          upsellRevenue: totalUpsellRevenue,
          mrr,
          arr,
          averageOrderValue: 350,
          growthRate: 0.12, // 12% growth
        },
        subscriptions: {
          total: activeSubscriptions.length,
          basic: planCounts.basic,
          premium: planCounts.premium,
          elite: planCounts.elite,
          newThisMonth: newThisMonth.length,
          churnRate: 0.05, // 5% churn
          conversionRate: 0.25, // 25% conversion from trial
        },
        upsells: {
          totalAttempts: 150,
          successful: 38,
          conversionRate: 0.25,
          averageValue: 125,
          topPerformers: [
            {
              service: "Drain Cleaning",
              addOn: "Camera Inspection",
              conversions: 15,
              revenue: 1875,
            },
            {
              service: "Water Heater Repair",
              addOn: "Maintenance Plan",
              conversions: 12,
              revenue: 1188,
            },
            {
              service: "Emergency Repair",
              addOn: "Annual Inspection",
              conversions: 11,
              revenue: 1089,
            },
          ],
        },
        lifetime: {
          averageCustomerLifetimeValue: clv,
          averageCustomerAge: avgCustomerAge,
          retentionRate: 0.95,
          topCustomers: [
            {
              id: 1,
              name: "Johnson Properties LLC",
              value: 12500,
              memberSince: "2023-01-15",
              plan: "Elite",
            },
            {
              id: 2,
              name: "Smith Residential",
              value: 8900,
              memberSince: "2023-03-22",
              plan: "Premium",
            },
            {
              id: 3,
              name: "Davis Family Trust",
              value: 6200,
              memberSince: "2023-06-10",
              plan: "Premium",
            },
          ],
        },
        trends: {
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
          recurring: [2100, 2400, 2800, 3200, 3600, mrr],
          oneTime: [12000, 13500, 14200, 14800, 15500, 15000],
          upsell: [800, 950, 1100, 1350, 1600, totalUpsellRevenue],
        },
      };
      
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching revenue metrics:', error);
      res.status(500).json({ error: 'Failed to fetch revenue metrics' });
    }
  });

  const httpServer = createServer(app);
  
  // Set up WebSocket server for Twilio Media Streams (Realtime Voice)
  const { WebSocketServer } = await import('ws');
  const { handleMediaStream } = await import('./lib/realtimeVoice');
  
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/api/v1/twilio/media-stream'
  });
  
  wss.on('connection', (ws, req) => {
    Logger.info('[WebSocket] New Twilio Media Stream connection');
    handleMediaStream(ws, req);
  });
  
  Logger.info('[WebSocket] Media Stream WebSocket server initialized');
  
  // Start the scheduled SMS processor for AI follow-up messages
  startScheduledSmsProcessor();
  
  return httpServer;
}
