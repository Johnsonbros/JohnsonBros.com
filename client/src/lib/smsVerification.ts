import { apiRequest } from "./queryClient";

export async function startSmsVerification(phone: string) {
  const response = await apiRequest("POST", "/api/v1/sms-verification/start", { phone });
  return response.json();
}

export async function confirmSmsVerification(phone: string, code: string) {
  const response = await apiRequest("POST", "/api/v1/sms-verification/confirm", { phone, code });
  return response.json();
}
