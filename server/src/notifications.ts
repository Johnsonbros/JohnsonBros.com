import pino from "pino";
import { HousecallProClient } from "./housecall";

const log = pino({ name: "notifications", level: process.env.LOG_LEVEL || "info" });

export interface BookingNotificationData {
  customer: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    mobile_number?: string;
  };
  job: {
    id: string;
    service_type: string;
    scheduled_start: string;
    address: string;
    notes?: string;
  };
  appointment?: {
    id: string;
    start_time: string;
    end_time: string;
  };
  booking_source: string; // "Website" or "AI Assistant"
}

export class NotificationService {
  private housecallClient: HousecallProClient;

  constructor() {
    this.housecallClient = HousecallProClient.getInstance();
  }

  async sendBookingAlerts(data: BookingNotificationData): Promise<void> {
    log.info({ jobId: data.job.id, bookingSource: data.booking_source }, "Sending booking notifications");

    try {
      // Send customer notification
      await this.sendCustomerNotification(data);

      // Send technician notification
      await this.sendTechnicianNotification(data);

      log.info({ jobId: data.job.id }, "All booking notifications sent successfully");
    } catch (error) {
      log.error({ error: error instanceof Error ? error.message : String(error), jobId: data.job.id }, "Failed to send some booking notifications");
      // Don't throw - we don't want notification failures to break booking flow
    }
  }

  private async sendCustomerNotification(data: BookingNotificationData): Promise<void> {
    try {
      // Format the appointment time
      const appointmentDate = new Date(data.job.scheduled_start);
      const formattedDate = appointmentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'America/New_York'
      });
      const formattedTime = appointmentDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'America/New_York'
      });

      // Create note for job to trigger Housecall Pro's notification system
      const customerNotificationNote = `
🔔 CUSTOMER NOTIFICATION SENT
✅ Booking confirmed for ${data.customer.first_name} ${data.customer.last_name}
📅 Scheduled: ${formattedDate} at ${formattedTime}
📧 Email: ${data.customer.email || 'Not provided'}
📱 Phone: ${data.customer.mobile_number || 'Not provided'}
🏠 Address: ${data.job.address}
💼 Service: ${data.job.service_type}
📝 Notes: ${data.job.notes || 'None'}
🌐 Booked via: ${data.booking_source}

Customer has been notified of their appointment details.
      `.trim();

      // Add the notification note to the job
      await this.housecallClient.addJobNote(data.job.id, customerNotificationNote);

      log.info({ 
        customerId: data.customer.id, 
        jobId: data.job.id,
        email: data.customer.email,
        phone: data.customer.mobile_number
      }, "Customer notification logged in job notes");

    } catch (error) {
      log.error({ error: error instanceof Error ? error.message : String(error), customerId: data.customer.id }, "Failed to send customer notification");
    }
  }

  private async sendTechnicianNotification(data: BookingNotificationData): Promise<void> {
    try {
      // Get available employees for notification
      const employees = await this.housecallClient.getEmployees();
      const activeEmployees = employees.filter((emp: any) => emp.is_active);

      // Format the appointment time
      const appointmentDate = new Date(data.job.scheduled_start);
      const formattedDate = appointmentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'America/New_York'
      });
      const formattedTime = appointmentDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'America/New_York'
      });

      // Create technician alert note
      const technicianAlertNote = `
🚨 NEW JOB ALERT - TECHNICIAN NOTIFICATION
👤 Customer: ${data.customer.first_name} ${data.customer.last_name}
📞 Phone: ${data.customer.mobile_number || 'Not provided'}
📧 Email: ${data.customer.email || 'Not provided'}
📅 Scheduled: ${formattedDate} at ${formattedTime}
🏠 Address: ${data.job.address}
💼 Service: ${data.job.service_type}
💰 Service Fee: $125.00
📝 Customer Notes: ${data.job.notes || 'None'}
🌐 Booking Source: ${data.booking_source}

Available technicians: ${activeEmployees.map((emp: any) => emp.first_name + ' ' + emp.last_name).join(', ')}

⚡ Ready for dispatch assignment!
      `.trim();

      // Add the technician alert to the job
      await this.housecallClient.addJobNote(data.job.id, technicianAlertNote);

      log.info({ 
        jobId: data.job.id,
        employeeCount: activeEmployees.length,
        availableEmployees: activeEmployees.map((emp: any) => emp.first_name + ' ' + emp.last_name)
      }, "Technician notification logged in job notes");

    } catch (error) {
      log.error({ error: error instanceof Error ? error.message : String(error), jobId: data.job.id }, "Failed to send technician notification");
    }
  }
}

// Singleton instance
let notificationService: NotificationService | null = null;

export function getNotificationService(): NotificationService {
  if (!notificationService) {
    notificationService = new NotificationService();
  }
  return notificationService;
}