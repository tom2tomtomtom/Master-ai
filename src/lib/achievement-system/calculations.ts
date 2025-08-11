/**
 * Achievement Calculations
 * 
 * Core calculation logic for achievements and progress tracking
 */

import { PrismaClient } from '@prisma/client';
import { AchievementCriteria, LearningStreak, EligibilityCheckResult } from './types';

export class AchievementCalculations {
  constructor(private prisma: PrismaClient) {}

  /**
   * Calculate learning streak for a user
   */
  async calculateLearningStreak(userId: string): Promise<LearningStreak> {
    try {
      // Get user's lesson completion history
      const completions = await this.prisma.userProgress.findMany({
        where: {
          userId,
          status: 'completed',
          completedAt: { not: null },
        },
        select: { completedAt: true },
        orderBy: { completedAt: 'desc' },
      });

      if (completions.length === 0) {
        return { currentStreak: 0, longestStreak: 0, lastActivityDate: null };
      }

      // Group completions by date
      const completionDates = new Set<string>();
      for (const completion of completions) {
        if (completion.completedAt) {
          const dateStr = completion.completedAt.toISOString().split('T')[0];
          completionDates.add(dateStr);
        }
      }

      const sortedDates = Array.from(completionDates).sort().reverse();
      
      // Calculate current streak
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      // Start checking from today or yesterday
      const checkDate = sortedDates[0] === today ? today : 
                     sortedDates[0] === yesterday ? yesterday : null;
      
      if (checkDate) {
        let dateIndex = 0;
        const currentDate = new Date(checkDate);
        
        while (dateIndex < sortedDates.length) {
          const dateStr = currentDate.toISOString().split('T')[0];
          
          if (sortedDates[dateIndex] === dateStr) {
            tempStreak++;
            if (currentStreak === 0) currentStreak = tempStreak;
            dateIndex++;
          } else {
            // Break in streak for current calculation
            if (currentStreak > 0) break;
            tempStreak = 0;
          }
          
          longestStreak = Math.max(longestStreak, tempStreak);
          currentDate.setDate(currentDate.getDate() - 1);
        }
      }

      // If current streak calculation failed, reset it
      if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
        currentStreak = 0;
      }

      return {
        currentStreak,
        longestStreak: Math.max(longestStreak, currentStreak),
        lastActivityDate: completions[0]?.completedAt || null,
      };
    } catch (error) {
      console.error('Error calculating learning streak:', error);
      return { currentStreak: 0, longestStreak: 0, lastActivityDate: null };
    }
  }

  /**
   * Calculate achievement progress synchronously with pre-fetched data
   */
  calculateProgressSync(
    achievement: any,
    userStats: any
  ): number {
    const criteria = achievement.criteria as AchievementCriteria;

    switch (criteria.type) {
      case 'lessons_completed':
        return userStats.totalLessonsCompleted;

      case 'streak_days':
        return userStats.currentStreak;

      case 'notes_taken':
        return userStats.totalNotesCreated;

      case 'bookmarks_created':
        return userStats.totalBookmarksCreated;

      case 'time_spent':
        return userStats.totalTimeSpentMinutes;

      case 'consecutive_days':
        return userStats.longestStreak;

      default:
        return 0;
    }
  }

  /**
   * Get next milestone for achievement
   */
  getNextMilestone(achievement: any, currentProgress: number): {
    name: string;
    threshold: number;
    remaining: number;
  } | undefined {
    const criteria = achievement.criteria as AchievementCriteria;
    
    if (currentProgress >= criteria.threshold) {
      return undefined; // Already completed
    }

    return {
      name: achievement.name,
      threshold: criteria.threshold,
      remaining: criteria.threshold - currentProgress,
    };
  }

  /**
   * Check achievement eligibility with pre-fetched data
   */
  checkEligibilityOptimized(
    achievement: any, 
    userStats: any
  ): boolean {
    const criteria = achievement.criteria as AchievementCriteria;

    switch (criteria.type) {
      case 'lessons_completed':
        return userStats.totalLessonsCompleted >= criteria.threshold;

      case 'streak_days':
        return userStats.currentStreak >= criteria.threshold;

      case 'notes_taken':
        return userStats.totalNotesCreated >= criteria.threshold;

      case 'bookmarks_created':
        return userStats.totalBookmarksCreated >= criteria.threshold;

      case 'time_spent':
        return userStats.totalTimeSpentMinutes >= criteria.threshold;

      case 'consecutive_days':
        return userStats.longestStreak >= criteria.threshold;

      case 'speed_completion':
        // This requires async database call, handled separately
        return false;

      case 'engagement_score':
        return this.checkEngagementScoreSync(criteria, userStats);

      default:
        return false;
    }
  }

  /**
   * Check engagement score with pre-fetched data
   */
  private checkEngagementScoreSync(criteria: AchievementCriteria, userStats: any): boolean {
    const weights = criteria.metadata?.weights || {
      lessons: 1,
      notes: 2,
      bookmarks: 1,
      streak: 3,
    };

    const engagementScore =
      (userStats.totalLessonsCompleted * weights.lessons) +
      (userStats.totalNotesCreated * weights.notes) +
      (userStats.totalBookmarksCreated * weights.bookmarks) +
      (userStats.currentStreak * weights.streak);

    return engagementScore >= criteria.threshold;
  }

  /**
   * Check speed completion requirement (requires async database call)
   */
  async checkSpeedCompletion(userId: string, criteria: AchievementCriteria): Promise<boolean> {
    const metadata = criteria.metadata || {};
    const daysAllowed = metadata.daysAllowed || 7;
    const lessonsRequired = metadata.lessonsRequired || 5;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAllowed);

    const recentCompletions = await this.prisma.userProgress.count({
      where: {
        userId,
        status: 'completed',
        completedAt: { gte: cutoffDate },
      },
    });

    return recentCompletions >= lessonsRequired;
  }

  /**
   * Check engagement score requirement (requires async database call for fresh data)
   */
  async checkEngagementScore(userId: string, criteria: AchievementCriteria): Promise<boolean> {
    const userStats = await this.ensureUserStats(userId);
    return this.checkEngagementScoreSync(criteria, userStats);
  }

  /**
   * Ensure user stats exist
   */
  private async ensureUserStats(userId: string) {
    let userStats = await this.prisma.userStats.findUnique({
      where: { userId },
    });

    if (!userStats) {
      userStats = await this.prisma.userStats.create({
        data: { userId },
      });
    }

    return userStats;
  }
}