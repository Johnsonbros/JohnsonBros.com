import type { Request, Response, NextFunction } from 'express';

// Admin user type (from schema) - matching database schema exactly
export interface AdminUser {
  id: number;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Permission string type
export type Permission = string;

// Extended Express Request with proper user typing
export interface AuthenticatedRequest extends Request {
  user: AdminUser;
  permissions: Permission[];
}

// Type guard to check if request is authenticated
export function isAuthenticatedRequest(req: Request): req is AuthenticatedRequest {
  return !!(req as any).user && !!(req as any).permissions;
}

// API Response wrapper types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: any;
  code?: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

// Rate limit error type
export interface RateLimitError {
  error: string;
  type: 'RATE_LIMIT_EXCEEDED' | 'WRITE_RATE_LIMIT_EXCEEDED' | 'LOOKUP_RATE_LIMIT_EXCEEDED' | 'ADMIN_RATE_LIMIT_EXCEEDED' | 'WEBHOOK_RATE_LIMIT_EXCEEDED' | 'DEBUG_RATE_LIMIT_EXCEEDED' | 'BLOG_RATE_LIMIT_EXCEEDED';
  retryAfter: string;
}

// Express handler types with proper typing
export type ExpressHandler<TReq = Request, TRes = any> = (
  req: TReq,
  res: Response<TRes>,
  next: NextFunction
) => Promise<void> | void;

export type AuthenticatedHandler<TRes = any> = ExpressHandler<AuthenticatedRequest, TRes>;