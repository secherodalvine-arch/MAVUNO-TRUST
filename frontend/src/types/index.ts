// Shared TypeScript types for MavunoTrust
// This file grows as features are added in later steps.

export type UserRole = 'farmer' | 'dealer' | 'admin';

// Generic API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    stack?: string;
  };
}
