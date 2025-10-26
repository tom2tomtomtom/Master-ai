/**
 * Activity Tracker Service
 * 
 * Handles user activity tracking and stats updates
 */

import { PrismaClient } from '@prisma/client';
import { UserActivity } from './types';
import { AchievementCalculations } from './calculations';

export class ActivityTrackerService {
  private calculations: AchievementCalculations;

  constructor(private prisma: PrismaClient) {
    this.calculations = new AchievementCalculations(prisma);
  }

  /**
   * Update user statistics based on activity
   */
  async updateUserStats(userId: string, activity: UserActivity): Promise<void> {
    const _stats = await this.ensureUserStats(userId);
    const streakInfo = await this.calculations.calculateLearningStreak(userId);

    const updateData: any = {
      lastActivityDate: activity.date,
      currentStreak: streakInfo.currentStreak,
      longestStreak: streakInfo.longestStreak,
    };

    if (activity.lessonCompleted) {
      updateData.totalLessonsCompleted = { increment: 1 };
    }

    if (activity.noteCreated) {
      updateData.totalNotesCreated = { increment: 1 };
    }

    if (activity.bookmarkCreated) {
      updateData.totalBookmarksCreated = { increment: 1 };
    }

    if (activity.timeSpent) {
      updateData.totalTimeSpentMinutes = { increment: activity.timeSpent };
    }

    await this.prisma.userStats.update({
      where: { userId },
      data: updateData,
    });
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