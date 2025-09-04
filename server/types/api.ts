// API Response Types for better type safety

// Standard API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: unknown;
  code?: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

// Capacity API types
export interface CapacityResponse {
  overall: {
    score: number;
    state: 'SAME_DAY_FEE_WAIVED' | 'LIMITED_SAME_DAY' | 'NEXT_DAY' | 'NEXT_DAY_PREMIUM' | 'BOOKED_SOLID';
  };
  technicians?: {
    [name: string]: {
      capacity: number;
      available_windows: number;
      utilization: number;
    };
  };
  express_windows?: Array<{
    time_slot: string;
    available_techs: string[];
    start_time: string;
    end_time: string;
  }>;
}

// Social proof API types
export interface SocialProofStats {
  totalJobsCompleted: number;
  totalCustomers: number;
  averageRating: number;
  totalReviews: number;
  responseTimeMinutes: number;
  emergencyJobsLast24h: number;
}

export interface RecentJob {
  id: string;
  customer_name: string;
  service_type: string;
  location: string;
  completed_at: string;
  testimonial?: string;
}

export interface ServiceHeatMapData {
  [zipCode: string]: {
    jobs_completed: number;
    avg_rating: number;
    popular_services: string[];
  };
}

// Customer lookup types
export interface CustomerLookupRequest {
  query: string;
  type: 'phone' | 'email' | 'name';
}

export interface CustomerLookupResponse {
  found: boolean;
  customer?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    last_service?: string;
  };
}

// Booking types
export interface BookingRequest {
  customer: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
  address: {
    street: string;
    street_line_2?: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
  };
  service: {
    description: string;
    priority: 'standard' | 'urgent' | 'emergency';
    preferredDate?: string;
    timePreference?: 'morning' | 'afternoon' | 'evening' | 'any';
  };
  source?: string;
}

export interface BookingResponse {
  success: boolean;
  booking?: {
    id: string;
    confirmationNumber: string;
    scheduledDate: string;
    timeWindow: string;
    estimatedArrival: string;
  };
  error?: string;
}

// Service area check types
export interface ServiceAreaRequest {
  zip?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
}

export interface ServiceAreaResponse {
  covered: boolean;
  zone?: 'primary' | 'secondary' | 'extended';
  estimatedTravelTime?: number;
  additionalFees?: {
    travel?: number;
    emergency?: number;
  };
  message?: string;
}

// Blog API types
export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  authorId?: number;
  tags?: string[];
  viewCount?: number;
  keywords?: Array<{
    id: number;
    keyword: string;
    isPrimary: boolean;
  }>;
}

// Admin dashboard types
export interface DashboardMetrics {
  jobs: {
    total: number;
    byStatus: {
      scheduled: number;
      in_progress: number;
      completed: number;
      cancelled: number;
    };
    revenue: number;
  };
  estimates: {
    total: number;
    value: number;
  };
  employees: {
    total: number;
    active: number;
  };
  availability: {
    totalWindows: number;
    availableWindows: number;
    utilizationRate: number;
  };
  timestamp: string;
}

// Type helpers for better error handling
export type ApiResult<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function createSuccessResponse<T>(data: T, message?: string): ApiSuccessResponse<T> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data
  };
  if (message) {
    response.message = message;
  }
  return response;
}

export function createErrorResponse(error: string, details?: unknown, code?: string): ApiErrorResponse {
  const response: ApiErrorResponse = {
    success: false,
    error
  };
  if (details) {
    response.details = details;
  }
  if (code) {
    response.code = code;
  }
  return response;
}