/**
 * Background Jobs Types
 * 
 * Type definitions for the background job system
 */

export interface JobResult {
  success: boolean;
  processed: number;
  errors: number;
  duration: number;
  message?: string;
}

export interface BatchProcessingResult {
  processed: number;
  errors: number;
  notifications: Array<{
    userId: string;
    achievements: string[];
    certifications: string[];
  }>;
}

export interface UserBatchProcessingOptions {
  batchSize: number;
  concurrencyLimit: number;
  pauseBetweenBatches?: number;
}

export interface NotificationBatch {
  userId: string;
  achievements: string[];
  certifications: string[];
}

export interface ActiveUser {
  id: string;
  email: string;
  name: string | null;
}