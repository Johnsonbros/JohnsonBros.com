import { apiRequest } from "./queryClient";
import type { Service, AvailableTimeSlot, Review, BookingFormData } from "@shared/schema";

export async function getServices(): Promise<Service[]> {
  const response = await apiRequest("GET", "/api/services");
  return response.json();
}

export async function getTimeSlots(date: string): Promise<AvailableTimeSlot[]> {
  const response = await apiRequest("GET", `/api/timeslots/${date}`);
  return response.json();
}

export async function createBooking(bookingData: BookingFormData) {
  const response = await apiRequest("POST", "/api/bookings", bookingData);
  return response.json();
}

export async function getReviews(): Promise<Review[]> {
  const response = await apiRequest("GET", "/api/reviews");
  return response.json();
}

export async function checkServiceArea(address: string): Promise<{ inServiceArea: boolean; message: string }> {
  const response = await apiRequest("POST", "/api/check-service-area", { address });
  return response.json();
}

export async function getAppointment(id: string) {
  const response = await apiRequest("GET", `/api/appointments/${id}`);
  return response.json();
}
