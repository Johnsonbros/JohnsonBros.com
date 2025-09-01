import { apiRequest } from "@/lib/queryClient";

export interface CreateCustomerData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
}

export interface LookupCustomerData {
  phone: string;
  name: string;
}

export async function createCustomer(data: CreateCustomerData) {
  return apiRequest("/api/customers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function lookupCustomer(data: LookupCustomerData) {
  return apiRequest("/api/customers/lookup", {
    method: "POST",
    body: JSON.stringify(data),
  });
}