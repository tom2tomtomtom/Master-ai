/**
 * BackgroundJobs - System for running background tasks
 * 
 * This service handles:
 * - Daily achievement checking for all users
 * - Automatic certification eligibility monitoring
 * - User statistics updates
 * - Learning streak calculations
 * - Email notifications for achievements
 */

import { PrismaClient } from '@prisma/client';

import { achievementSystem } from './achievement-system';
import { certificationEngine } from './certification-engine';
import { cleanupExpiredResetTokens } from './password-reset';
// import { monitoredQuery } from './db-monitor';
// import { CacheInvalidation } from './cache';

export interface JobResult {
  success: boolean;
  processed: number;
  errors: number;
  duration: number;
  message?: string;
}

export class BackgroundJobSystem {
  private prisma: PrismaClient;
  private isRunning = false;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  /**
   * Run daily achievement and certification checks for all users
   * OPTIMIZED: Batch processing, parallel execution, reduced database calls
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

    const startTime = Date.now();
    this.isRunning = true;

    try {
      // return await monitoredQuery('runDailyJobs', async () => {
        // Get active users with optimized query (reduced data fetch)
        const activeUsers = await this.prisma.user.findMany({
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

        console.log(`Processing daily jobs for ${activeUsers.length} active users`);

        // Process users in batches to avoid memory issues and improve performance
        const BATCH_SIZE = 50;
        const batches = this.createBatches(activeUsers, BATCH_SIZE);
        
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
            const batchResults = await this.processBatchOptimized(batch);
            
            totalProcessed += batchResults.processed;
            totalErrors += batchResults.errors;
            allNotifications.push(...batchResults.notifications);
            
            // Small delay between batches to prevent database overload
            if (batchIndex < batches.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          } catch (error) {
            console.error(`Batch ${batchIndex + 1} failed:`, error);
            totalErrors += batch.length;
          }
        }

        // Send notifications in optimized batch
        let notificationsSent = 0;
        if (allNotifications.length > 0) {
          notificationsSent = await this.sendAchievementNotificationsBatch(allNotifications);
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
      // }, { table: 'background_jobs' });

    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        processed: 0,
        errors: 1,
        duration,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Update user statistics for all active users
   * OPTIMIZED: Batch processing, parallel execution, efficient data loading
   */
  async updateUserStatistics(): Promise<JobResult> {
    const startTime = Date.now();

    try {
      // return await monitoredQuery('updateUserStatistics', async () => {
        // Get all users with progress, ordered for consistent processing
        const users = await this.prisma.user.findMany({
          where: {
            progress: { some: {} },
          },
          select: { id: true },
          orderBy: { createdAt: 'asc' }, // Consistent ordering
          take: 2000, // Reasonable limit to prevent memory issues
        });

        console.log(`Updating statistics for ${users.length} users`);

        // Process users in parallel batches
        const BATCH_SIZE = 25; // Smaller batches for stats updates
        const batches = this.createBatches(users, BATCH_SIZE);
        
        let totalProcessed = 0;
        let totalErrors = 0;

        // Process batches with concurrency control
        const CONCURRENT_BATCHES = 3; // Limit concurrent batches
        for (let i = 0; i < batches.length; i += CONCURRENT_BATCHES) {
          const currentBatches = batches.slice(i, i + CONCURRENT_BATCHES);
          
          const batchPromises = currentBatches.map(async (batch, batchIndex) => {
            try {
              const actualBatchIndex = i + batchIndex;
              console.log(`Processing stats batch ${actualBatchIndex + 1}/${batches.length} (${batch.length} users)`);
              
              // Process batch in parallel
              const results = await Promise.allSettled(
                batch.map(user => this.updateSingleUserStatsOptimized(user.id))
              );
              
              const batchProcessed = results.filter(r => r.status === 'fulfilled').length;
              const batchErrors = results.filter(r => r.status === 'rejected').length;
              
              return { processed: batchProcessed, errors: batchErrors };
            } catch (error) {
              console.error(`Stats batch ${i + batchIndex + 1} failed:`, error);
              return { processed: 0, errors: batch.length };
            }
          });
          
          const batchResults = await Promise.all(batchPromises);
          
          for (const result of batchResults) {
            totalProcessed += result.processed;
            totalErrors += result.errors;
          }
          
          // Brief pause between concurrent batch groups
          if (i + CONCURRENT_BATCHES < batches.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }

        const duration = Date.now() - startTime;

        return {
          success: true,
          processed: totalProcessed,
          errors: totalErrors,
          duration,
          message: `Updated statistics for ${totalProcessed} users in ${batches.length} batches`,
        };
      // }, { table: 'user_statistics' });

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
   * Update statistics for a single user
   * OPTIMIZED: Batch queries, parallel processing
   */
  private async updateSingleUserStats(userId: string): Promise<void> {
    // return monitoredQuery('updateSingleUserStats', async () => {
      // Batch all required data in parallel
      const [progressData, notesCount, bookmarksCount, achievementPoints] = await Promise.all([
        this.prisma.userProgress.findMany({
          where: { userId },
          select: {
            status: true,
            timeSpentMinutes: true,
            completedAt: true,
          },
        }),
        this.prisma.lessonNote.count({ where: { userId } }),
        this.prisma.lessonBookmark.count({ where: { userId } }),
        this.prisma.userAchievement.findMany({
          where: { userId },
          include: { achievement: { select: { pointsAwarded: true } } },
        }),
      ]);

      // Calculate statistics
      const completedLessons = progressData.filter(p => p.status === 'completed').length;
      const totalTimeSpent = progressData.reduce((sum, p) => sum + p.timeSpentMinutes, 0);
      const totalPoints = achievementPoints.reduce(
        (sum, ua) => sum + ua.achievement.pointsAwarded,
        0
      );

      // Calculate learning streak (cached if possible)
      const streakInfo = await achievementSystem.calculateLearningStreak(userId);

      // Update or create user stats
      await this.prisma.userStats.upsert({
        where: { userId },
        update: {
          totalLessonsCompleted: completedLessons,
          totalTimeSpentMinutes: totalTimeSpent,
          currentStreak: streakInfo.currentStreak,
          longestStreak: streakInfo.longestStreak,
          lastActivityDate: streakInfo.lastActivityDate,
          totalNotesCreated: notesCount,
          totalBookmarksCreated: bookmarksCount,
          totalPointsEarned: totalPoints,
          updatedAt: new Date(),
        },
        create: {
          userId,
          totalLessonsCompleted: completedLessons,
          totalTimeSpentMinutes: totalTimeSpent,
          currentStreak: streakInfo.currentStreak,
          longestStreak: streakInfo.longestStreak,
          lastActivityDate: streakInfo.lastActivityDate,
          totalNotesCreated: notesCount,
          totalBookmarksCreated: bookmarksCount,
          totalPointsEarned: totalPoints,
        },
      });

      // Invalidate user caches
      // await CacheInvalidation.userDataUpdated(userId);
    // }, { userId, table: 'user_stats' });
  }

  /**
   * Send achievement notifications (DEPRECATED - use sendAchievementNotificationsBatch)
   */
  private async sendAchievementNotifications(
    notifications: Array<{
      userId: string;
      achievements: string[];
      certifications: string[];
    }>
  ): Promise<void> {
    // Delegate to optimized batch method
    await this.sendAchievementNotificationsBatch(notifications);
  }

  /**
   * Optimized batch notification sender
   * OPTIMIZED: Batch database queries, parallel processing
   */
  private async sendAchievementNotificationsBatch(
    notifications: Array<{
      userId: string;
      achievements: string[];
      certifications: string[];
    }>
  ): Promise<number> {
    if (notifications.length === 0) return 0;

    // return monitoredQuery('sendAchievementNotificationsBatch', async () => {
      try {
        // Collect all unique IDs for batch queries
        const userIds = [...new Set(notifications.map(n => n.userId))];
        const achievementIds = [...new Set(notifications.flatMap(n => n.achievements))];
        const certificationIds = [...new Set(notifications.flatMap(n => n.certifications))];

        // Batch fetch all required data
        const [users, achievements, certifications] = await Promise.all([
          this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, email: true, name: true },
          }),
          achievementIds.length > 0 ? this.prisma.achievement.findMany({
            where: { id: { in: achievementIds } },
            select: { id: true, name: true, description: true },
          }) : [],
          certificationIds.length > 0 ? this.prisma.certification.findMany({
            where: { id: { in: certificationIds } },
            select: { id: true, name: true, description: true },
          }) : [],
        ]);

        // Create lookup maps
        const userMap = new Map(users.map(u => [u.id, u]));
        const achievementMap = new Map(achievements.map(a => [a.id, a]));
        const certificationMap = new Map(certifications.map(c => [c.id, c]));

        let sentCount = 0;

        // Process notifications sequentially to avoid overwhelming email service
        for (const notification of notifications) {
          try {
            const user = userMap.get(notification.userId);
            if (!user?.email) continue;

            const _userAchievements = notification.achievements
              .map(id => achievementMap.get(id))
              .filter(Boolean);
            
            const _userCertifications = notification.certifications
              .map(id => certificationMap.get(id))
              .filter(Boolean);

            // Send achievement notification email if enabled
            try {
              if (process.env.NODE_ENV === 'production' && process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true') {
                const { sendAchievementNotification } = await import('@/lib/email');
                await sendAchievementNotification({
                  to: user.email,
                  name: user.name || 'User',
                  achievements: _userAchievements,
                  certifications: _userCertifications,
                });
              }
            } catch (emailError) {
              console.error('Failed to send achievement notification email:', emailError);
              // Continue processing - email failures shouldn't stop background jobs
            }

            sentCount++;
          } catch (error) {
            console.error(`Failed to send notification to user ${notification.userId}:`, error);
          }
        }

        return sentCount;
      } catch (error) {
        console.error('Error in batch notification sending:', error);
        return 0;
      }
    // }, { table: 'notifications' });
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

  // OPTIMIZED HELPER METHODS

  /**
   * Create batches from array for efficient processing
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Process a batch of users for achievements and certifications
   * OPTIMIZED: Parallel processing, batch data loading
   */
  private async processBatchOptimized(
    users: Array<{ id: string; email: string; name: string | null }>
  ): Promise<{
    processed: number;
    errors: number;
    notifications: Array<{
      userId: string;
      achievements: string[];
      certifications: string[];
    }>;
  }> {
    // return monitoredQuery('processBatchOptimized', async () => {
      let processed = 0;
      let errors = 0;
      const notifications: Array<{
        userId: string;
        achievements: string[];
        certifications: string[];
      }> = [];

      // Process users in parallel with concurrency limit
      const CONCURRENCY_LIMIT = 10;
      const semaphore = new Array(CONCURRENCY_LIMIT).fill(null);
      
      const userPromises = users.map(async (user) => {
        // Simple semaphore implementation
        await new Promise<void>((resolve) => {
          const checkAvailable = () => {
            if (semaphore.some(s => s === null)) {
              const index = semaphore.findIndex(s => s === null);
              semaphore[index] = user.id;
              resolve();
            } else {
              setTimeout(checkAvailable, 10);
            }
          };
          checkAvailable();
        });

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
          // Release semaphore
          const index = semaphore.findIndex(s => s === user.id);
          if (index !== -1) {
            semaphore[index] = null;
          }
        }
      });

      await Promise.all(userPromises);

      return { processed, errors, notifications };
    // }, { table: 'batch_processing' });
  }

  /**
   * Optimized version of updateSingleUserStats with better data fetching
   */
  private async updateSingleUserStatsOptimized(userId: string): Promise<void> {
    // return monitoredQuery('updateSingleUserStatsOptimized', async () => {
      // Check if user stats were updated recently (avoid unnecessary work)
      const existingStats = await this.prisma.userStats.findUnique({
        where: { userId },
        select: { updatedAt: true },
      });

      // Skip if updated within last hour (configurable)
      const ONE_HOUR = 60 * 60 * 1000;
      if (existingStats?.updatedAt && 
          (Date.now() - existingStats.updatedAt.getTime()) < ONE_HOUR) {
        return;
      }

      // Use the existing optimized method
      await this.updateSingleUserStats(userId);
    // }, { userId, table: 'user_stats_optimized' });
  }
}

// Create singleton instance
export const backgroundJobSystem = new BackgroundJobSystem();

// Export function to run jobs manually (for API endpoints or testing)
export async function runBackgroundJobs(): Promise<JobResult> {
  return backgroundJobSystem.runDailyJobs();
}

export async function updateAllUserStats(): Promise<JobResult> {
  return backgroundJobSystem.updateUserStatistics();
}