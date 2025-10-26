/**
 * Background Jobs - Modular Architecture
 * 
 * Main entry point for the background job system with clean exports
 */

import { PrismaClient } from '@prisma/client';
import { BackgroundJobSystemService } from './service';

// Export types
export * from './types';

// Export services for advanced usage
export { BackgroundJobSystemService } from './service';
export { DailyJobsService } from './daily-jobs';
export { StatsUpdateService } from './stats-update';
export { NotificationService } from './notifications';

// Export utilities
export * from './utils';

// Create and export main service class (maintains backward compatibility)
export class BackgroundJobSystem extends BackgroundJobSystemService {
  constructor(prisma?: PrismaClient) {
    super(prisma || new PrismaClient());
  }
}

// Singleton instance for backward compatibility
export const backgroundJobSystem = new BackgroundJobSystem();

// Export function to run jobs manually (for API endpoints or testing)
export async function runBackgroundJobs(): Promise<import('./types').JobResult> {
  return backgroundJobSystem.runDailyJobs();
}

export async function updateAllUserStats(): Promise<import('./types').JobResult> {
  return backgroundJobSystem.updateUserStatistics();
}