// Authentication utilities for admin dashboard

export interface AdminUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'super_admin' | 'admin' | 'tech' | 'staff';
}

export function getAuthToken(): string | null {
  return localStorage.getItem('adminToken');
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getAdminUser(): AdminUser | null {
  const userJson = localStorage.getItem('adminUser');
  return userJson ? JSON.parse(userJson) : null;
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

export function logout(): void {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
  window.location.href = '/admin/login';
}

export async function authenticatedFetch(url: string, options?: RequestInit) {
  const headers = {
    ...getAuthHeaders(),
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expired or invalid
    logout();
    throw new Error('Session expired. Please login again.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || error.error || 'Request failed');
  }

  return response.json();
}