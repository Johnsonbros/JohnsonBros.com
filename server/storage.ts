import { type Customer, type InsertCustomer, type Appointment, type InsertAppointment } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Customer methods
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  getCustomerByPhone(phone: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  
  // Appointment methods
  getAppointment(id: string): Promise<Appointment | undefined>;
  getAppointmentsByCustomer(customerId: string): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointmentStatus(id: string, status: string): Promise<Appointment | undefined>;
}

export class MemStorage implements IStorage {
  private customers: Map<string, Customer>;
  private appointments: Map<string, Appointment>;

  constructor() {
    this.customers = new Map();
    this.appointments = new Map();
  }

  private initializeDefaultData() {
    // Default services - commented out since we're using Housecall Pro services
    /*
    const defaultServices = [
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

    // Services now come from Housecall Pro API
    */

    // DISABLED: Don't generate fake time slots - use real Housecall Pro API data
    // The system should only show real availability from the API
    // Commenting out fake data generation to prevent showing incorrect availability
    /*
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
    */

    // Reviews now come from Google Reviews API - no local storage needed
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

  async getCustomerByPhone(phone: string): Promise<Customer | undefined> {
    // Normalize phone number for comparison (remove non-digits)
    const normalizedPhone = phone.replace(/\D/g, '');
    return Array.from(this.customers.values()).find(
      (customer) => customer.phone.replace(/\D/g, '') === normalizedPhone,
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

  // Services now come from Housecall Pro API - no local storage needed

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

  // Reviews now come from Google Reviews API - no local storage needed
}

export const storage = new MemStorage();
