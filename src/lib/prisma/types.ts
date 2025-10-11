/**
 * Prisma Logging Types
 *
 * Type definitions and interfaces for the Prisma logging system.
 * This module provides shared types used across all logging components.
 */

/**
 * Metadata for a database query including timing and result information
 */
export interface QueryMetadata {
  /** The Prisma model being queried (e.g., 'User', 'Lesson') */
  model?: string;
  /** The operation being performed (e.g., 'findMany', 'create', 'update') */
  operation: string;
  /** Query execution duration in milliseconds */
  duration: number;
  /** Query arguments passed to Prisma */
  args?: any;
  /** Query result data */
  result?: any;
  /** Error if query failed */
  error?: Error;
}
