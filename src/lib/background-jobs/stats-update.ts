/**
 * Statistics Update Service
 * 
 * Handles updating user statistics for all active users
 */

import { PrismaClient } from '@prisma/client';
import { achievementSystem } from '../achievement-system';
import { JobResult } from './types';
import { createBatches, processConcurrentBatches } from './utils';

export class StatsUpdateService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Update user statistics for all active users
   * OPTIMIZED: Batch processing, parallel execution, efficient data loading
   */
  async updateUserStatistics(): Promise<JobResult> {
    const startTime = Date.now();

    try {
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
      const CONCURRENT_BATCHES = 3; // Limit concurrent batches

      const results = await processConcurrentBatches(
        users,
        BATCH_SIZE,
        CONCURRENT_BATCHES,
        async (batch) => {
          return this.processBatch(batch);
        }
      );

      const totalProcessed = results.reduce((sum, r) => sum + r.processed, 0);
      const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);

      const duration = Date.now() - startTime;

      return {
        success: true,
        processed: totalProcessed,
        errors: totalErrors,
        duration,
        message: `Updated statistics for ${totalProcessed} users in ${results.length} batches`,
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
   * Process a batch of users for statistics updates
   */
  private async processBatch(users: Array<{ id: string }>): Promise<{ processed: number; errors: number }> {
    // Process batch in parallel
    const results = await Promise.allSettled(
      users.map(user => this.updateSingleUserStatsOptimized(user.id))
    );
    
    const processed = results.filter(r => r.status === 'fulfilled').length;
    const errors = results.filter(r => r.status === 'rejected').length;
    
    return { processed, errors };
  }

  /**
   * Update statistics for a single user
   * OPTIMIZED: Batch queries, parallel processing
   */
  private async updateSingleUserStats(userId: string): Promise<void> {
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
  }

  /**
   * Optimized version of updateSingleUserStats with better data fetching
   */
  private async updateSingleUserStatsOptimized(userId: string): Promise<void> {
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
  }
}