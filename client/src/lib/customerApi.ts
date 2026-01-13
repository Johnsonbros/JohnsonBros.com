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
  firstName: string;
  lastName: string;
}

export async function createCustomer(data: CreateCustomerData) {
  const response = await apiRequest("POST", "/api/customers", data);
  return response.json();
}

export async function lookupCustomer(data: LookupCustomerData) {
  const response = await apiRequest("POST", "/api/customers/lookup", data);
  return response.json();
}