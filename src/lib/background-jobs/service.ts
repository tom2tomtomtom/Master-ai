/**
 * Main Background Jobs Service
 * 
 * Orchestrates all background job functionality
 */

import { PrismaClient } from '@prisma/client';
import { JobResult } from './types';
import { DailyJobsService } from './daily-jobs';
import { StatsUpdateService } from './stats-update';

export class BackgroundJobSystemService {
  private dailyJobsService: DailyJobsService;
  private statsUpdateService: StatsUpdateService;
  private isRunning = false;

  constructor(private prisma: PrismaClient) {
    this.dailyJobsService = new DailyJobsService(prisma);
    this.statsUpdateService = new StatsUpdateService(prisma);
  }

  /**
   * Run daily achievement and certification checks for all users
   */
  async runDailyJobs(): Promise<JobResult> {
    if (this.isRunning) {
      return {
        success: false,
        processed: 0,
        errors: 0,
        duration: 0,
        message: 'Jobs already running',
      };
    }

    this.isRunning = true;
    try {
      return await this.dailyJobsService.runDailyJobs();
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Update user statistics for all active users
   */
  async updateUserStatistics(): Promise<JobResult> {
    return this.statsUpdateService.updateUserStatistics();
  }

  /**
   * Check if jobs are currently running
   */
  isJobsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Schedule daily jobs (this would be called by a cron job or scheduler)
   */
  async scheduleDailyJobs(): Promise<void> {
    // This could be integrated with a job scheduler like node-cron
    // Run immediately for testing
    await this.runDailyJobs();
  }
}