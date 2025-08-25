import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCustomerSchema, insertAppointmentSchema, type BookingFormData } from "@shared/schema";
import { z } from "zod";

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

  const httpServer = createServer(app);
  return httpServer;
}
