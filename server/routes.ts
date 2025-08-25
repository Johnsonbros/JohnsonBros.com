import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCustomerSchema, insertAppointmentSchema, type BookingFormData } from "@shared/schema";
import { z } from "zod";

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

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all services
  app.get("/api/services", async (_req, res) => {
    try {
      const services = await storage.getAllServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch services" });
    }
  });

  // Get available time slots for a specific date
  app.get("/api/timeslots/:date", async (req, res) => {
    try {
      const { date } = req.params;
      
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
      }

      const timeSlots = await storage.getAvailableTimeSlots(date);
      res.json(timeSlots);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch time slots" });
    }
  });

  // Create a new booking
  app.post("/api/bookings", async (req, res) => {
    try {
      const bookingData: BookingFormData = req.body;
      
      // Validate service exists
      const service = await storage.getService(bookingData.service);
      if (!service) {
        return res.status(400).json({ error: "Invalid service selected" });
      }

      // Check if customer exists or create new one
      let customer = await storage.getCustomerByEmail(bookingData.customer.email);
      if (!customer) {
        const customerData = insertCustomerSchema.parse(bookingData.customer);
        customer = await storage.createCustomer(customerData);
      }

      // Create scheduled date from selected date and time
      const scheduledDate = new Date(`${bookingData.selectedDate}T${bookingData.selectedTime}:00`);

      // Create appointment
      const appointment = await storage.createAppointment({
        customerId: customer.id,
        serviceId: service.id,
        scheduledDate,
        status: "scheduled",
        problemDescription: bookingData.problemDescription || null,
        estimatedPrice: service.basePrice,
        actualPrice: null,
      });

      // TODO: Integrate with Housecall Pro API to create actual job
      // This would include:
      // 1. Creating customer in Housecall Pro if not exists
      // 2. Creating job with selected service and time
      // 3. Assigning technician based on availability
      // 4. Sending confirmation email/SMS

      res.json({
        success: true,
        appointmentId: appointment.id,
        message: "Booking confirmed successfully",
        appointment: {
          id: appointment.id,
          service: service.name,
          scheduledDate: appointment.scheduledDate,
          estimatedPrice: service.basePrice,
          customer: {
            name: `${customer.firstName} ${customer.lastName}`,
            email: customer.email,
            phone: customer.phone,
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

  // Get customer reviews
  app.get("/api/reviews", async (_req, res) => {
    try {
      const reviews = await storage.getAllReviews();
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  // Google Business Reviews endpoint
  app.get("/api/google-reviews", async (_req, res) => {
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
  app.get("/api/appointments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const appointment = await storage.getAppointment(id);
      
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }

      const customer = await storage.getCustomer(appointment.customerId);
      const service = await storage.getService(appointment.serviceId);

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
  app.post("/api/check-service-area", async (req, res) => {
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
  app.get("/api/social-proof/recent-jobs", async (_req, res) => {
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
  app.get("/api/social-proof/stats", async (_req, res) => {
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
  app.get("/api/social-proof/live-activity", async (_req, res) => {
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
  app.get("/api/social-proof/testimonials", async (_req, res) => {
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

  // Get service area heat map data for Massachusetts
  app.get("/api/social-proof/service-heat-map", async (_req, res) => {
    try {
      // Get jobs for heat map
      const data = await callHousecallAPI('/jobs', {
        page_size: 100,
        sort_direction: 'desc'
      });

      // Group jobs by city and count them
      const cityData: Record<string, { count: number; lat?: number; lng?: number }> = {};
      
      data.jobs?.forEach((job: any) => {
        if (job.address?.city && job.address?.state === 'MA') {
          const city = job.address.city;
          if (!cityData[city]) {
            cityData[city] = { count: 0 };
          }
          cityData[city].count++;
        }
      });

      // Add approximate coordinates for major MA cities (for heat map visualization)
      const cityCoordinates: Record<string, { lat: number; lng: number }> = {
        'Boston': { lat: 42.3601, lng: -71.0589 },
        'Quincy': { lat: 42.2529, lng: -71.0023 },
        'Braintree': { lat: 42.2057, lng: -71.0995 },
        'Milton': { lat: 42.2496, lng: -71.0662 },
        'Weymouth': { lat: 42.2180, lng: -70.9395 },
        'Hingham': { lat: 42.2417, lng: -70.8893 },
        'Hull': { lat: 42.3084, lng: -70.8967 },
        'Randolph': { lat: 42.1618, lng: -71.0412 },
        'Cambridge': { lat: 42.3736, lng: -71.1097 },
        'Somerville': { lat: 42.3876, lng: -71.0995 },
        'Brookline': { lat: 42.3318, lng: -71.1211 },
        'Newton': { lat: 42.3370, lng: -71.2092 },
        'Watertown': { lat: 42.3668, lng: -71.1834 },
        'Belmont': { lat: 42.3959, lng: -71.1786 },
        'Arlington': { lat: 42.4153, lng: -71.1564 },
        'Medford': { lat: 42.4184, lng: -71.1061 },
        'Malden': { lat: 42.4251, lng: -71.0662 },
        'Revere': { lat: 42.4085, lng: -71.0120 },
        'Chelsea': { lat: 42.3918, lng: -71.0328 },
        'Everett': { lat: 42.4084, lng: -71.0537 },
        'Winthrop': { lat: 42.3751, lng: -70.9828 },
        'Rockland': { lat: 42.1307, lng: -70.9162 }
      };

      // Merge coordinates with job counts
      Object.keys(cityData).forEach(city => {
        if (cityCoordinates[city]) {
          cityData[city].lat = cityCoordinates[city].lat;
          cityData[city].lng = cityCoordinates[city].lng;
        }
      });

      // Convert to array format for frontend
      const heatMapData = Object.entries(cityData)
        .filter(([_, data]) => data.lat && data.lng)
        .map(([city, data]) => ({
          city,
          count: data.count,
          lat: data.lat!,
          lng: data.lng!,
          intensity: Math.min(data.count / 10, 1) // Normalize intensity 0-1
        }))
        .sort((a, b) => b.count - a.count);

      res.json(heatMapData);
    } catch (error) {
      console.error("Error fetching heat map data:", error);
      res.status(500).json({ error: "Failed to fetch heat map data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
