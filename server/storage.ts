import { type Customer, type InsertCustomer, type Service, type InsertService, type Appointment, type InsertAppointment, type AvailableTimeSlot, type Review } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Customer methods
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  
  // Service methods
  getAllServices(): Promise<Service[]>;
  getService(id: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  
  // Appointment methods
  getAppointment(id: string): Promise<Appointment | undefined>;
  getAppointmentsByCustomer(customerId: string): Promise<Appointment[]>;
  createAppointment(appointment: Omit<InsertAppointment, 'selectedDate' | 'selectedTime'> & { scheduledDate: Date }): Promise<Appointment>;
  updateAppointmentStatus(id: string, status: string): Promise<Appointment | undefined>;
  
  // Time slots methods
  getAvailableTimeSlots(date: string): Promise<AvailableTimeSlot[]>;
  
  // Reviews methods
  getAllReviews(): Promise<Review[]>;
  createReview(review: Omit<Review, 'id' | 'createdAt'>): Promise<Review>;
}

export class MemStorage implements IStorage {
  private customers: Map<string, Customer>;
  private services: Map<string, Service>;
  private appointments: Map<string, Appointment>;
  private timeSlots: Map<string, AvailableTimeSlot>;
  private reviews: Map<string, Review>;

  constructor() {
    this.customers = new Map();
    this.services = new Map();
    this.appointments = new Map();
    this.timeSlots = new Map();
    this.reviews = new Map();
    
    // Initialize with default services
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Default services
    const defaultServices: Service[] = [
      {
        id: "emergency-repair",
        name: "Emergency Repair",
        description: "24/7 emergency plumbing services for burst pipes, major leaks, and urgent repairs that can't wait.",
        basePrice: "150.00",
        category: "emergency",
        duration: "2-4 hours",
        housecallProServiceId: null,
        isEmergency: true,
      },
      {
        id: "drain-cleaning",
        name: "Drain Cleaning",
        description: "Professional drain cleaning services to clear clogs and restore proper water flow throughout your home.",
        basePrice: "99.00",
        category: "maintenance",
        duration: "1-2 hours",
        housecallProServiceId: null,
        isEmergency: false,
      },
      {
        id: "water-heater",
        name: "Water Heater Service",
        description: "Installation, repair, and maintenance of traditional and tankless water heaters for reliable hot water.",
        basePrice: "200.00",
        category: "installation",
        duration: "2-4 hours",
        housecallProServiceId: null,
        isEmergency: false,
      },
      {
        id: "fixtures",
        name: "Fixture Installation",
        description: "Professional installation of faucets, toilets, sinks, and other plumbing fixtures for your home.",
        basePrice: "120.00",
        category: "installation",
        duration: "1-3 hours",
        housecallProServiceId: null,
        isEmergency: false,
      },
      {
        id: "pipe-repair",
        name: "Pipe Repair",
        description: "Expert pipe repair and replacement services to fix leaks and restore your plumbing system.",
        basePrice: "180.00",
        category: "repair",
        duration: "2-6 hours",
        housecallProServiceId: null,
        isEmergency: false,
      },
      {
        id: "remodeling",
        name: "Bathroom Remodeling",
        description: "Complete bathroom renovation services including plumbing upgrades and modern fixture installation.",
        basePrice: "2500.00",
        category: "renovation",
        duration: "1-3 days",
        housecallProServiceId: null,
        isEmergency: false,
      },
    ];

    defaultServices.forEach(service => {
      this.services.set(service.id, service);
    });

    // Default time slots for next 30 days
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const timeSlots = [
        { startTime: "09:00", endTime: "11:00" },
        { startTime: "11:00", endTime: "13:00" },
        { startTime: "13:00", endTime: "15:00" },
        { startTime: "15:00", endTime: "17:00" },
      ];

      timeSlots.forEach((slot, index) => {
        const id = randomUUID();
        this.timeSlots.set(id, {
          id,
          date: dateStr,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isAvailable: true,
          technicianId: null,
        });
      });
    }

    // Default reviews
    const defaultReviews: Review[] = [
      {
        id: randomUUID(),
        customerId: null,
        appointmentId: null,
        rating: "5.0",
        comment: "Johnson Bros came out the same day I called for an emergency leak. The technician was professional, clean, and fixed the issue quickly. Highly recommend!",
        customerName: "Sarah M.",
        serviceName: "Emergency Repair",
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
      },
      {
        id: randomUUID(),
        customerId: null,
        appointmentId: null,
        rating: "5.0",
        comment: "Excellent service! They replaced my water heater and the whole process was smooth. Fair pricing and quality work. Will definitely call them again.",
        customerName: "Michael R.",
        serviceName: "Water Heater Service",
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 1 month ago
      },
      {
        id: randomUUID(),
        customerId: null,
        appointmentId: null,
        rating: "5.0",
        comment: "Fast response time and excellent customer service. The online booking system made it so easy to schedule. The plumber arrived exactly on time!",
        customerName: "Jennifer L.",
        serviceName: "Drain Cleaning",
        createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 3 weeks ago
      },
    ];

    defaultReviews.forEach(review => {
      this.reviews.set(review.id, review);
    });
  }

  // Customer methods
  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    return Array.from(this.customers.values()).find(
      (customer) => customer.email === email,
    );
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = randomUUID();
    const customer: Customer = {
      ...insertCustomer,
      id,
      housecallProId: null,
      createdAt: new Date(),
    };
    this.customers.set(id, customer);
    return customer;
  }

  // Service methods
  async getAllServices(): Promise<Service[]> {
    return Array.from(this.services.values());
  }

  async getService(id: string): Promise<Service | undefined> {
    return this.services.get(id);
  }

  async createService(insertService: InsertService): Promise<Service> {
    const id = randomUUID();
    const service: Service = {
      ...insertService,
      id,
      housecallProServiceId: null,
      isEmergency: insertService.isEmergency ?? false,
    };
    this.services.set(id, service);
    return service;
  }

  // Appointment methods
  async getAppointment(id: string): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }

  async getAppointmentsByCustomer(customerId: string): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(
      (appointment) => appointment.customerId === customerId,
    );
  }

  async createAppointment(appointment: Omit<InsertAppointment, 'selectedDate' | 'selectedTime'> & { scheduledDate: Date }): Promise<Appointment> {
    const id = randomUUID();
    const newAppointment: Appointment = {
      ...appointment,
      id,
      status: appointment.status ?? "scheduled",
      housecallProJobId: null,
      technicianId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.appointments.set(id, newAppointment);
    return newAppointment;
  }

  async updateAppointmentStatus(id: string, status: string): Promise<Appointment | undefined> {
    const appointment = this.appointments.get(id);
    if (appointment) {
      appointment.status = status;
      appointment.updatedAt = new Date();
      this.appointments.set(id, appointment);
    }
    return appointment;
  }

  // Time slots methods
  async getAvailableTimeSlots(date: string): Promise<AvailableTimeSlot[]> {
    return Array.from(this.timeSlots.values()).filter(
      (slot) => slot.date === date && slot.isAvailable,
    );
  }

  // Reviews methods
  async getAllReviews(): Promise<Review[]> {
    return Array.from(this.reviews.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  async createReview(reviewData: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
    const id = randomUUID();
    const review: Review = {
      ...reviewData,
      id,
      createdAt: new Date(),
    };
    this.reviews.set(id, review);
    return review;
  }
}

export const storage = new MemStorage();
