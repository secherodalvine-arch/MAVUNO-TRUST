// Shared backend types for MavunoTrust
// This file grows as features are added in later steps.

export type UserRole = 'farmer' | 'dealer' | 'admin';

export interface ApiSuccessResponse<T = undefined> {
  success: true;
  data?: T;
  message?: string;
  timestamp?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    stack?: string;
  };
}

export type ApiResponse<T = undefined> = ApiSuccessResponse<T> | ApiErrorResponse;
