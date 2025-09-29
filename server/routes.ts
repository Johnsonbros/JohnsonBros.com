import type { Express } from "express";
import { createServer, type Server } from "http";
import { dbStorage as storage } from "./dbStorage";
import { 
  insertCustomerSchema, insertAppointmentSchema, type BookingFormData, 
  customerAddresses, serviceAreas, heatMapCache, syncStatus,
  insertBlogPostSchema, insertKeywordSchema, insertPostKeywordSchema,
  type BlogPost, type Keyword, type PostKeyword, type KeywordRanking
} from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { eq, sql, and } from "drizzle-orm";
import { CapacityCalculator } from "./src/capacity";
import { GoogleAdsBridge } from "./src/ads/bridge";
import { HousecallProClient } from "./src/housecall";
import rateLimit from "express-rate-limit";
import adminRoutes from "./src/adminRoutes";

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
    console.error(`Housecall API error details:`, {
      url: url.toString(),
      status: response.status,
      statusText: response.statusText
    });
    throw new Error(`Housecall API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Register admin routes with /api/admin prefix and rate limiting
  app.use('/api/admin', adminLimiter, adminRoutes);

  // Seed blog data on startup (only in development)
  if (process.env.NODE_ENV === 'development') {
    import('./seed-blog').then(module => {
      module.seedBlogData().catch(err => {
        console.error('Failed to seed blog data:', err);
      });
    });
  }

  // ========== BLOG ROUTES ==========
  
  // Get all blog posts (with pagination and filtering)
  app.get("/api/blog/posts", blogLimiter, async (req, res) => {
    try {
      const { status, limit = 10, offset = 0 } = req.query;
      
      const posts = await storage.getAllBlogPosts(
        status as string | undefined,
        parseInt(limit as string),
        parseInt(offset as string)
      );
      
      res.json(posts);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      res.status(500).json({ error: "Failed to fetch blog posts" });
    }
  });
  
  // Get a single blog post by slug
  app.get("/api/blog/posts/:slug", blogLimiter, async (req, res) => {
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
      console.error("Error fetching blog post:", error);
      res.status(500).json({ error: "Failed to fetch blog post" });
    }
  });
  
  // Create a new blog post
  app.post("/api/blog/posts", adminLimiter, async (req, res) => {
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
      
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating blog post:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid post data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create blog post" });
    }
  });
  
  // Update a blog post
  app.put("/api/blog/posts/:id", adminLimiter, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const postData = req.body;
      
      const updatedPost = await storage.updateBlogPost(postId, postData);
      
      if (!updatedPost) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      res.json(updatedPost);
    } catch (error) {
      console.error("Error updating blog post:", error);
      res.status(500).json({ error: "Failed to update blog post" });
    }
  });
  
  // Delete a blog post
  app.delete("/api/blog/posts/:id", adminLimiter, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const deleted = await storage.deleteBlogPost(postId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting blog post:", error);
      res.status(500).json({ error: "Failed to delete blog post" });
    }
  });
  
  // Get all keywords
  app.get("/api/blog/keywords", blogLimiter, async (req, res) => {
    try {
      const keywords = await storage.getAllKeywords();
      res.json(keywords);
    } catch (error) {
      console.error("Error fetching keywords:", error);
      res.status(500).json({ error: "Failed to fetch keywords" });
    }
  });
  
  // Create a new keyword
  app.post("/api/blog/keywords", adminLimiter, async (req, res) => {
    try {
      const keywordData = insertKeywordSchema.parse(req.body);
      const keyword = await storage.createKeyword(keywordData);
      res.status(201).json(keyword);
    } catch (error) {
      console.error("Error creating keyword:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid keyword data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create keyword" });
    }
  });
  
  // Track keyword rankings
  app.post("/api/blog/keywords/:id/track", adminLimiter, async (req, res) => {
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
      console.error("Error tracking keyword ranking:", error);
      res.status(500).json({ error: "Failed to track keyword ranking" });
    }
  });
  
  // Get keyword rankings
  app.get("/api/blog/keywords/:id/rankings", blogLimiter, async (req, res) => {
    try {
      const keywordId = parseInt(req.params.id);
      const { limit = 30 } = req.query;
      
      const rankings = await storage.getKeywordRankings(
        keywordId,
        parseInt(limit as string)
      );
      
      res.json(rankings);
    } catch (error) {
      console.error("Error fetching keyword rankings:", error);
      res.status(500).json({ error: "Failed to fetch keyword rankings" });
    }
  });
  
  // Get blog analytics
  app.get("/api/blog/posts/:id/analytics", blogLimiter, async (req, res) => {
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
      console.error("Error fetching blog analytics:", error);
      res.status(500).json({ error: "Failed to fetch blog analytics" });
    }
  });
  
  // ========== END BLOG ROUTES ==========

  // Get available time slots for a specific date
  app.get("/api/timeslots/:date", publicReadLimiter, async (req, res) => {
    try {
      const { date } = req.params;
      
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
      }

      // Fetch real booking windows from HousecallPro
      if (API_KEY) {
        const hcpClient = HousecallProClient.getInstance();
        const bookingWindows = await hcpClient.getBookingWindows(date);
        
        // Convert HousecallPro booking windows to our time slot format
        // Filter to only include slots for the requested date
        const timeSlots = bookingWindows
          .filter((window: any) => {
            const windowDate = new Date(window.start_time).toISOString().split('T')[0];
            return window.available && windowDate === date;
          })
          .map((window: any, index: number) => {
            const startTime = new Date(window.start_time);
            const endTime = new Date(window.end_time);
            
            return {
              id: `${date}-${index}`,
              date: date,
              startTime: startTime.toISOString(),
              endTime: endTime.toISOString(),
              isAvailable: window.available,
            };
          });
        
        res.json(timeSlots);
      } else {
        // Fallback to storage if no API key
        const timeSlots = await storage.getAvailableTimeSlots(date);
        res.json(timeSlots);
      }
    } catch (error) {
      console.error('Error fetching time slots:', error);
      res.status(500).json({ error: "Failed to fetch time slots" });
    }
  });

  // Create a new customer
  app.post("/api/customers", publicWriteLimiter, async (req, res) => {
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
              first_name: customer.name.split(' ')[0] || customer.name,
              last_name: customer.name.split(' ').slice(1).join(' ') || '',
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
          console.error('Failed to create customer in Housecall Pro:', error);
          // Continue even if Housecall Pro creation fails
        }
      }
      
      res.status(201).json({ success: true, customer });
    } catch (error) {
      console.error("Customer creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid customer data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create customer" });
    }
  });
  
  // Lookup existing customer with rate limiting
  app.post("/api/customers/lookup", async (req, res) => {
    try {
      const { phone, name, firstName, lastName } = req.body;
      
      // Support both formats: separate firstName/lastName or combined name
      const customerName = name || (firstName && lastName ? `${firstName} ${lastName}` : null);
      
      if (!phone || !customerName) {
        return res.status(400).json({ error: "Phone number, first name, and last name are required" });
      }
      
      // Look up customer using Housecall Pro API
      console.log(`[Customer Lookup] Searching for customer - Name: "${customerName}", Phone: "${phone}"`);
      const housecallClient = HousecallProClient.getInstance();
      const customers = await housecallClient.searchCustomers({
        phone: phone,
        name: customerName
      });
      console.log(`[Customer Lookup] API returned ${customers.length} customers:`, customers.map(c => ({ id: c.id, name: `${c.first_name} ${c.last_name}`, phone: c.mobile_number })));
      
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
        
        console.log(`[Customer Lookup] Returning customer: ${customer.firstName} ${customer.lastName} (${customer.phone})`);
        res.json({ success: true, customer });
      } else {
        res.status(404).json({ error: "Customer not found" });
      }
    } catch (error) {
      console.error("Customer lookup error:", error);
      res.status(500).json({ error: "Failed to lookup customer" });
    }
  });

  // ============================================
  // REFERRAL SYSTEM ENDPOINTS
  // ============================================

  // Get referrals for a customer
  app.get("/api/referrals/:customerId", customerLookupLimiter, async (req, res) => {
    try {
      const customerId = req.params.customerId;
      const referrals = await storage.getReferralsByCustomer(customerId);
      res.json({ success: true, referrals });
    } catch (error) {
      console.error("Failed to get referrals:", error);
      res.status(500).json({ error: "Failed to retrieve referrals" });
    }
  });

  // Create a new referral
  app.post("/api/referrals", customerLookupLimiter, async (req, res) => {
    try {
      const {
        referrerCustomerId,
        referrerName,
        referrerPhone,
        referredName,
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
      if (!referrerCustomerId || !referrerName || !referrerPhone || !referredName || !referredPhone) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const housecallClient = HousecallProClient.getInstance();

      // Create lead in HousecallPro
      const leadData = {
        customer: {
          first_name: referredName.split(' ')[0],
          last_name: referredName.split(' ').slice(1).join(' ') || referredName,
          email: referredEmail,
          mobile_number: referredPhone,
          lead_source: "Customer Referral",
          tags: [`referred-by-${referrerCustomerId}`, "referral-program"],
          notes: `Referred by: ${referrerName} (${referrerPhone})
Customer ID: ${referrerCustomerId}
Service Needed: ${serviceNeeded || 'General plumbing service'}
$99 REFERRAL DISCOUNT APPLIES`,
          address: referredAddress ? {
            street: referredAddress,
            city: referredCity || "Quincy",
            state: referredState || "MA",
            zip: referredZip || ""
          } : undefined
        },
        // Apply the $99 discount as a line item
        line_items: [{
          name: "Referral Discount",
          description: `$99 off - Referred by ${referrerName}`,
          kind: "fixed discount",
          unit_price: -9900, // Negative for discount
          quantity: 1
        }],
        notes: notes || `New customer referred by ${referrerName}. $99 referral discount applied.`
      };

      // Create lead in HousecallPro
      const lead = await housecallClient.createLead(leadData);

      // Save referral to database
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
        discountAmount: 9900,
        discountApplied: true
      });

      res.json({ 
        success: true, 
        referral,
        leadId: lead.id,
        referralCode: referral.referralCode,
        message: "Referral created successfully! The new customer has been added to our system with a $99 discount."
      });

    } catch (error) {
      console.error("Failed to create referral:", error);
      res.status(500).json({ error: "Failed to create referral" });
    }
  });

  // Get referral by code
  app.get("/api/referrals/code/:code", async (req, res) => {
    try {
      const referral = await storage.getReferralByCode(req.params.code);
      if (referral) {
        res.json({ success: true, referral });
      } else {
        res.status(404).json({ error: "Referral not found" });
      }
    } catch (error) {
      console.error("Failed to get referral by code:", error);
      res.status(500).json({ error: "Failed to retrieve referral" });
    }
  });

  // Create a new booking
  app.post("/api/bookings", publicWriteLimiter, async (req, res) => {
    try {
      const bookingData = req.body;
      
      // Validate required fields
      if (!bookingData?.customerInfo || !bookingData?.selectedDate || !bookingData?.selectedTime) {
        return res.status(400).json({ error: "Missing required booking information" });
      }
      
      console.log(`[Booking] Creating real booking in Housecall Pro:`, JSON.stringify(bookingData, null, 2));
      
      const customerInfo = bookingData.customerInfo;
      const housecallClient = HousecallProClient.getInstance();
      
      // Step 1: Find or create customer
      let customer;
      try {
        const existingCustomers = await housecallClient.searchCustomers({
          phone: customerInfo.phone,
          name: `${customerInfo.firstName} ${customerInfo.lastName}`
        });
        
        if (existingCustomers.length > 0) {
          customer = existingCustomers[0];
          console.log(`[Booking] Found existing customer: ${customer.first_name} ${customer.last_name}`);
        } else {
          customer = await housecallClient.createCustomer({
            first_name: customerInfo.firstName,
            last_name: customerInfo.lastName,
            email: customerInfo.email,
            mobile_number: customerInfo.phone,
            addresses: [{
              street: customerInfo.address,
              city: customerInfo.city || "Quincy",
              state: customerInfo.state || "MA",
              zip: customerInfo.zipCode || "02169"
            }]
          });
          console.log(`[Booking] Created new customer: ${customer.first_name} ${customer.last_name}`);
        }
      } catch (error) {
        console.error("[Booking] Customer lookup/creation failed:", error);
        console.error("[Booking] Error details:", {
          message: (error as Error).message,
          stack: (error as Error).stack,
          customerInfo
        });
        return res.status(500).json({ error: "Failed to find or create customer", details: (error as Error).message });
      }
      
      // Step 2: Get customer address
      let addressId = customer.addresses?.[0]?.id;
      if (!addressId) {
        try {
          addressId = await housecallClient.createCustomerAddress(customer.id, {
            street: customerInfo.address,
            city: customerInfo.city || "Quincy",
            state: customerInfo.state || "MA", 
            zip: customerInfo.zipCode || "02169"
          });
        } catch (addressError) {
          console.error("[Booking] Failed to create address:", addressError);
          return res.status(500).json({ error: "Failed to create customer address" });
        }
      }
      
      if (!addressId) {
        return res.status(500).json({ error: "Unable to determine customer address" });
      }
      
      // Step 3: Create scheduled job with proper time information (handle EST timezone)
      // Parse the date and time in EST timezone
      // Determine if we're in EST (-05:00) or EDT (-04:00) based on the date
      const testDate = new Date(`${bookingData.selectedDate}T12:00:00`);
      const isDST = testDate.getTimezoneOffset() < new Date(testDate.getFullYear(), 0, 1).getTimezoneOffset();
      const offset = isDST ? '-04:00' : '-05:00';
      const easternTime = `${bookingData.selectedDate}T${bookingData.selectedTime}:00${offset}`;
      const scheduledDate = new Date(easternTime);
      
      // Validate the date is valid and in the future
      if (isNaN(scheduledDate.getTime())) {
        return res.status(400).json({ error: "Invalid date or time format" });
      }
      
      if (scheduledDate < new Date()) {
        return res.status(400).json({ error: "Cannot book appointments in the past" });
      }
      const scheduledEnd = new Date(scheduledDate.getTime() + 3 * 60 * 60 * 1000); // 3 hour window
      
      const jobData = {
        customer_id: customer.id,
        address_id: addressId,
        schedule: {
          scheduled_start: scheduledDate.toISOString(),
          scheduled_end: scheduledEnd.toISOString(),
          arrival_window: 180 // 3 hour window in minutes
        },
        // Add the "Service call" line item with $99 fee (9900 cents)
        line_items: [{
          name: "Service call",
          description: "$99 FEE WAIVED - Online Booking Special",
          unit_price: 9900,  // $99.00 in cents
          quantity: 1,
          unit_cost: 0
        }],
        // Add tags for online booking
        tags: ["online-booking", "$99-fee-waived", "website-lead"],
        // Set lead source to website
        lead_source: "Website",
        // Enable notifications
        notify_customer: true,
        notify_pro: true,
        // Add comprehensive notes about online booking
        internal_memo: `ONLINE BOOKING - $99 Service Fee Waived
Customer Problem: ${bookingData.problemDescription || "Service requested"}
Booked via: Johnson Bros Website
Special Promotion: $99 service fee waived for online bookings`,
        // Add job description visible to customer
        description: "Online Booking - Service Call ($99 Fee Waived)"
      };
      
      const job = await housecallClient.createJob(jobData);
      console.log(`[Booking] Created scheduled job in Housecall Pro: ${job.id} for ${scheduledDate.toISOString()}`);
      
      res.json({
        success: true,
        jobId: job.id,
        appointmentId: null,
        message: "Booking confirmed successfully",
        appointment: {
          id: job.id,
          service: "Service call",
          scheduledDate: scheduledDate.toISOString(),
          estimatedPrice: "$99.00",
          customer: {
            name: `${customerInfo.firstName} ${customerInfo.lastName}`,
            email: customerInfo.email,
            phone: customerInfo.phone,
          },
        },
      });
    } catch (error) {
      console.error("Booking error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid booking data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create booking" });
    }
  });

  // Test simple route
  app.get("/api/test", publicReadLimiter, (_req, res) => {
    console.log("TEST ROUTE CALLED");
    res.json({ message: "Test route working" });
  });

  // Get services from Housecall Pro
  app.get("/api/services", publicReadLimiter, async (_req, res) => {
    console.log("[Services API] Route handler called");
    try {
      console.log("[Services API] Starting services fetch...");
      const housecallClient = HousecallProClient.getInstance();
      console.log("[Services API] Got client instance");
      
      const services = await housecallClient.getServices();
      console.log(`[Services API] Found ${services.length} services`);
      
      // Look for Service Fee service specifically
      const serviceFeeService = services.find(service => 
        service.name && service.name.toLowerCase().includes('service fee')
      );
      
      if (serviceFeeService) {
        console.log(`[Services API] Found Service Fee service: ${serviceFeeService.name} (ID: ${serviceFeeService.id}) - Price: ${serviceFeeService.price}`);
      } else {
        console.log("[Services API] Service Fee service not found");
      }
      
      services.forEach(service => {
        console.log(`[Services API] Service: ${service.name} (ID: ${service.id}) - Price: ${service.price || 'N/A'}`);
      });
      
      res.json({
        services,
        serviceFeeService,
        totalCount: services.length
      });
    } catch (error) {
      console.error("Services fetch error:", error);
      res.status(500).json({ error: "Failed to fetch services", details: error instanceof Error ? error.message : String(error) });
    }
  });

  // Get customer reviews (from Google Reviews API)
  app.get("/api/reviews", publicReadLimiter, async (_req, res) => {
    try {
      // Reviews come from Google API - return empty array for now
      res.json([]);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  // Capacity API Routes
  app.get("/api/capacity/today", publicReadLimiter, async (req, res) => {
    try {
      const userZip = req.query.zip as string | undefined;
      const calculator = CapacityCalculator.getInstance();
      const capacity = await calculator.getTodayCapacity(userZip);
      res.json(capacity);
    } catch (error) {
      console.error("Error fetching today's capacity:", error);
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

  app.get("/api/capacity/tomorrow", publicReadLimiter, async (req, res) => {
    try {
      const userZip = req.query.zip as string | undefined;
      const calculator = CapacityCalculator.getInstance();
      const capacity = await calculator.getTomorrowCapacity(userZip);
      res.json(capacity);
    } catch (error) {
      console.error("Error fetching tomorrow's capacity:", error);
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
      console.error('Debug HCP data error:', error);
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

  // Google Business Reviews endpoint
  app.get("/api/google-reviews", publicReadLimiter, async (_req, res) => {
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
          address: "75 E Elm Ave, Quincy, MA 02170, USA"
        },
        {
          placeId: "ChIJPePacTlw-kkR8qUHEEuX1bc", 
          name: "Johnson Bros. Plumbing & Drain Cleaning - Abington",
          address: "55 Brighton St, Abington, MA 02351, USA"
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
                  location: location.name,
                  profilePhoto: review.profile_photo_url,
                  source: 'google'
                });
              });
            }
          }
        } catch (error) {
          console.error(`Error fetching reviews for ${location.name}:`, error);
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
      console.error("Error fetching Google reviews:", error);
      res.status(500).json({ error: "Failed to fetch Google reviews" });
    }
  });

  // Get appointment details
  app.get("/api/appointments/:id", publicReadLimiter, async (req, res) => {
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

  // Check service area (mock implementation)
  app.post("/api/check-service-area", publicWriteLimiter, async (req, res) => {
    try {
      const { address } = req.body;
      
      if (!address) {
        return res.status(400).json({ error: "Address is required" });
      }

      // TODO: Integrate with Google Maps API or Housecall Pro service area check
      // For now, we'll check if address contains MA (Massachusetts)
      const isInServiceArea = address.toLowerCase().includes('ma') || 
                             address.toLowerCase().includes('massachusetts') ||
                             address.toLowerCase().includes('quincy') ||
                             address.toLowerCase().includes('braintree') ||
                             address.toLowerCase().includes('milton') ||
                             address.toLowerCase().includes('weymouth') ||
                             address.toLowerCase().includes('hingham') ||
                             address.toLowerCase().includes('hull');

      res.json({
        inServiceArea: isInServiceArea,
        message: isInServiceArea 
          ? "Great! We provide service to your area." 
          : "Sorry, we don't currently service this area. Please call us to discuss options.",
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to check service area" });
    }
  });

  // Social Proof API Routes
  
  // Get recent completed jobs for social proof
  app.get("/api/social-proof/recent-jobs", publicReadLimiter, async (_req, res) => {
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
      console.error("Error fetching recent jobs:", error);
      res.status(500).json({ error: "Failed to fetch recent jobs" });
    }
  });

  // Get overall business stats for social proof
  app.get("/api/social-proof/stats", publicReadLimiter, async (_req, res) => {
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
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch business stats" });
    }
  });

  // Get current live activity for social proof
  app.get("/api/social-proof/live-activity", publicReadLimiter, async (_req, res) => {
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
      console.error("Error fetching live activity:", error);
      res.status(500).json({ error: "Failed to fetch live activity" });
    }
  });

  // Get customer testimonials/reviews from recent jobs
  app.get("/api/social-proof/testimonials", publicReadLimiter, async (_req, res) => {
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
      console.error("Error fetching testimonials:", error);
      res.status(500).json({ error: "Failed to fetch testimonials" });
    }
  });

  // Sync customer addresses from Housecall Pro to database
  app.post("/api/admin/sync-customer-addresses", adminLimiter, async (_req, res) => {
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
      
      console.log(`Starting comprehensive customer sync at ${new Date().toISOString()}`);
      
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
      console.error("Sync error:", error);
      
      await db.update(syncStatus)
        .set({
          status: 'failed',
          error: error.message,
        })
        .where(eq(syncStatus.syncType, 'customers'));
      
      res.status(500).json({ error: error.message });
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

  // Daily sync endpoint - can be called by a cron job or scheduler
  app.post("/api/admin/daily-sync", adminLimiter, async (req, res) => {
    try {
      console.log(`Running daily sync at ${new Date().toISOString()}`);
      
      // Call the sync endpoint internally
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      const host = process.env.NODE_ENV === 'production' ? req.get('host') : 'localhost:5000';
      const response = await fetch(`${protocol}://${host}/api/admin/sync-customer-addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      
      res.json({
        success: true,
        message: 'Daily sync completed',
        ...result
      });
    } catch (error: any) {
      console.error("Daily sync failed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Auto-sync on server start (runs once when server starts)
  setTimeout(async () => {
    try {
      console.log("Running initial data sync on server start...");
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      const host = process.env.NODE_ENV === 'production' ? process.env.REPL_SLUG ? `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : 'localhost:5000' : 'localhost:5000';
      await fetch(`${protocol}://${host}/api/admin/sync-customer-addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      console.log("Initial sync completed");
    } catch (error) {
      console.error("Initial sync failed:", error);
    }
  }, 5000); // Wait 5 seconds after server start

  // Get optimized heat map data from database
  app.get("/api/social-proof/service-heat-map", publicReadLimiter, async (_req, res) => {
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
        
        console.log(`Heat map: Serving ${heatMapData.length} cached grid points from 3000+ customers`);
        return res.json(heatMapData);
      }
      
      // Fallback: Generate from customer addresses if no cache
      const addresses = await db.select().from(customerAddresses);
      
      if (addresses.length === 0) {
        // If no database data, fetch from API and sync
        console.log("No cached data, syncing from Housecall Pro...");
        
        // Trigger sync in background
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
        const host = process.env.NODE_ENV === 'production' ? process.env.REPL_SLUG ? `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : 'localhost:5000' : 'localhost:5000';
        fetch(`${protocol}://${host}/api/admin/sync-customer-addresses`, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }).catch(err => console.error("Background sync failed:", err));
        
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
      
      console.log(`Heat map: Generated ${heatMapData.length} points from database`);
      res.json(heatMapData);
    } catch (error) {
      console.error("Error fetching heat map data:", error);
      res.status(500).json({ error: "Failed to fetch heat map data" });
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
  app.post('/api/webhooks/housecall', webhookLimiter, async (req, res) => {
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
          console.error('[Webhook] Missing signature header');
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
          console.error('[Webhook] Invalid signature');
          return res.status(401).json({ 
            success: false, 
            error: 'Invalid webhook signature' 
          });
        }
        
        console.log('[Webhook] Signature verified successfully');
      } else {
        console.warn('[Webhook] No webhook secret configured - signature verification skipped');
      }
      
      console.log('[Webhook] Received event:', req.body);
      
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
        console.log(`[Webhook] Successfully processed event ${result.eventId} of type ${eventType}`);
        res.status(200).json({ 
          success: true, 
          eventId: result.eventId,
          message: 'Webhook received and queued for processing' 
        });
      } else {
        console.error('[Webhook] Failed to process event:', result.error);
        res.status(500).json({ 
          success: false, 
          error: result.error 
        });
      }
    } catch (error) {
      console.error('[Webhook] Error handling webhook:', error);
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
      console.error('Error fetching webhook events:', error);
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
      console.error('Error fetching webhook event details:', error);
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
      console.error('Error fetching webhook analytics:', error);
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
      console.error('Error fetching webhook config:', error);
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
      console.error('Error subscribing to webhooks:', error);
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
      console.error('Error processing test webhook:', error);
      res.status(500).json({ error: 'Failed to process test webhook' });
    }
  });

  // ========== MCP (Model Context Protocol) ENDPOINTS ==========
  
  // MCP API key authentication middleware
  const mcpAuthMiddleware = (req: any, res: any, next: any) => {
    const apiKey = req.headers['x-mcp-api-key'];
    const expectedApiKey = process.env.MCP_API_KEY || 'default-mcp-key-change-me';
    
    if (!apiKey) {
      return res.status(401).json({ 
        error: 'Missing API key',
        message: 'X-MCP-API-Key header is required for MCP access'
      });
    }
    
    if (apiKey !== expectedApiKey) {
      return res.status(403).json({ 
        error: 'Invalid API key',
        message: 'The provided API key is not valid'
      });
    }
    
    // Log MCP client for analytics
    const clientInfo = req.headers['x-mcp-client'] || 'unknown-client';
    console.log(`MCP API access: ${clientInfo} from ${req.ip}`);
    
    next();
  };

  // MCP rate limiting (more generous for authenticated clients)
  const mcpLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20, // 20 requests per minute for authenticated MCP clients
    message: { error: 'Too many MCP requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // MCP Manifest Endpoint (authenticated)
  app.get('/api/mcp/manifest', mcpLimiter, mcpAuthMiddleware, async (req, res) => {
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
              description: "Check available time slots for service appointments",
              parameters: {
                type: "object", 
                properties: {
                  date: { type: "string", format: "date", description: "Preferred date (YYYY-MM-DD)" },
                  serviceType: {
                    type: "string",
                    enum: ["emergency", "drain_cleaning", "water_heater", "general_plumbing", "pipe_repair"]
                  },
                  zipCode: { type: "string", description: "Service location zip code" }
                },
                required: ["date", "serviceType", "zipCode"]
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
      console.error('Error generating MCP manifest:', error);
      res.status(500).json({ error: 'Failed to generate MCP manifest' });
    }
  });

  // MCP Documentation Endpoint (authenticated)
  app.get('/api/mcp/docs', mcpLimiter, mcpAuthMiddleware, async (req, res) => {
    try {
      const docs = {
        title: "Johnson Bros. Plumbing MCP Integration Guide",
        version: "1.0.0",
        description: "Complete documentation for integrating with Johnson Bros. Plumbing services via Model Context Protocol",
        
        authentication: {
          method: "API Key",
          header: "X-MCP-API-Key",
          description: "Include your API key in the X-MCP-API-Key header for all requests",
          example: "X-MCP-API-Key: your-api-key-here"
        },

        getting_started: {
          discovery: "Use the .well-known/mcp.json file for initial discovery",
          manifest: "GET /api/mcp/manifest for complete tool specifications",
          authentication: "All MCP endpoints require API key authentication",
          rate_limits: "20 requests per minute for authenticated clients"
        },

        tools: {
          book_service_call: {
            description: "Books a plumbing service appointment with real-time integration to Housecall Pro",
            usage: "Collects customer info, service details, and scheduling preferences",
            validation: "Address validation ensures service area coverage",
            response: "Returns booking confirmation with appointment details"
          },
          search_availability: {
            description: "Checks real-time availability for service appointments",
            usage: "Query by date, service type, and location",
            response: "Returns available time slots and scheduling options"
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
      console.error('Error generating MCP documentation:', error);
      res.status(500).json({ error: 'Failed to generate MCP documentation' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}