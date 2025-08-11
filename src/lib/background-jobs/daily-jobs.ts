/**
 * Daily Jobs Service
 * 
 * Handles daily achievement and certification checks for all users
 */

import { PrismaClient } from '@prisma/client';
import { achievementSystem } from '../achievement-system';
import { certificationEngine } from '../certification-engine';
import { cleanupExpiredResetTokens } from '../password-reset';
import { JobResult, BatchProcessingResult, ActiveUser } from './types';
import { createBatches, Semaphore, sleep } from './utils';
import { NotificationService } from './notifications';

export class DailyJobsService {
  private notificationService: NotificationService;

  constructor(private prisma: PrismaClient) {
    this.notificationService = new NotificationService(prisma);
  }

  /**
   * Run daily achievement and certification checks for all users
   * OPTIMIZED: Batch processing, parallel execution, reduced database calls
   */
  async runDailyJobs(): Promise<JobResult> {
    const startTime = Date.now();

    try {
      // Get active users with optimized query (reduced data fetch)
      const activeUsers = await this.getActiveUsers();

      console.log(`Processing daily jobs for ${activeUsers.length} active users`);

      // Process users in batches to avoid memory issues and improve performance
      const BATCH_SIZE = 50;
      const batches = createBatches(activeUsers, BATCH_SIZE);
      
      let totalProcessed = 0;
      let totalErrors = 0;
      const allNotifications: Array<{
        userId: string;
        achievements: string[];
        certifications: string[];
      }> = [];

      // Process each batch in parallel with concurrency control
      for (const [batchIndex, batch] of batches.entries()) {
        console.log(`Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} users)`);
        
        try {
          const batchResults = await this.processBatch(batch);
          
          totalProcessed += batchResults.processed;
          totalErrors += batchResults.errors;
          allNotifications.push(...batchResults.notifications);
          
          // Small delay between batches to prevent database overload
          if (batchIndex < batches.length - 1) {
            await sleep(100);
          }
        } catch (error) {
          console.error(`Batch ${batchIndex + 1} failed:`, error);
          totalErrors += batch.length;
        }
      }

      // Send notifications in optimized batch
      let notificationsSent = 0;
      if (allNotifications.length > 0) {
        notificationsSent = await this.notificationService.sendBatch(allNotifications);
      }

      // Clean up expired tokens
      const expiredTokensCount = await cleanupExpiredResetTokens();

      const duration = Date.now() - startTime;

      return {
        success: true,
        processed: totalProcessed,
        errors: totalErrors,
        duration,
        message: `Processed ${totalProcessed} users in ${batches.length} batches, ${notificationsSent} notifications sent, cleaned ${expiredTokensCount} expired tokens`,
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        processed: 0,
        errors: 1,
        duration,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get active users for processing
   */
  private async getActiveUsers(): Promise<ActiveUser[]> {
    return this.prisma.user.findMany({
      where: {
        progress: {
          some: {
            lastAccessed: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Active in last 30 days
            },
          },
        },
      },
      select: { id: true, email: true, name: true },
      // Add limit to prevent overwhelming the system
      take: 1000,
    });
  }

  /**
   * Process a batch of users for achievements and certifications
   * OPTIMIZED: Parallel processing, batch data loading
   */
  private async processBatch(users: ActiveUser[]): Promise<BatchProcessingResult> {
    let processed = 0;
    let errors = 0;
    const notifications: Array<{
      userId: string;
      achievements: string[];
      certifications: string[];
    }> = [];

    // Process users in parallel with concurrency limit
    const CONCURRENCY_LIMIT = 10;
    const semaphore = new Semaphore(CONCURRENCY_LIMIT);
    
    const userPromises = users.map(async (user) => {
      await semaphore.acquire(user.id);

      try {
        // Process user achievements and certifications in parallel
        const [newAchievements, newCertifications] = await Promise.all([
          achievementSystem.checkAndAwardAchievements(user.id),
          certificationEngine.autoAwardEligibleCertifications(user.id),
        ]);

        // If user earned something new, prepare notification
        if (newAchievements.length > 0 || newCertifications.length > 0) {
          notifications.push({
            userId: user.id,
            achievements: newAchievements,
            certifications: newCertifications,
          });
        }

        processed++;
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
        errors++;
      } finally {
        semaphore.release(user.id);
      }
    });

    await Promise.all(userPromises);

    return { processed, errors, notifications };
  }
}