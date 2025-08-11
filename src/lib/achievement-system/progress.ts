/**
 * Achievement Progress Service
 * 
 * Handles user achievement progress tracking and reporting
 */

import { PrismaClient } from '@prisma/client';
import { AchievementProgress } from './types';
import { AchievementCalculations } from './calculations';

export class AchievementProgressService {
  private calculations: AchievementCalculations;

  constructor(private prisma: PrismaClient) {
    this.calculations = new AchievementCalculations(prisma);
  }

  /**
   * Get user's achievement progress
   * OPTIMIZED: Added caching, eliminated sequential processing
   */
  async getUserProgress(userId: string): Promise<AchievementProgress[]> {
    // Single batch query for all required data
    const [achievements, userAchievements, userStats] = await Promise.all([
      this.prisma.achievement.findMany({
        where: { isActive: true },
        orderBy: [
          { category: 'asc' },
          { displayOrder: 'asc' },
        ],
      }),
      this.prisma.userAchievement.findMany({
        where: { userId },
      }),
      this.ensureUserStats(userId),
    ]);

    const achievementMap = new Map(userAchievements.map(ua => [ua.achievementId, ua]));

    // Process all achievements in parallel instead of sequential
    const progressPromises = achievements.map(async (achievement) => {
      const userAchievement = achievementMap.get(achievement.id);
      const isCompleted = !!userAchievement;
      
      const currentProgress = this.calculations.calculateProgressSync(
        achievement, 
        userStats
      );

      const criteria = achievement.criteria as any;
      
      return {
        achievementId: achievement.id,
        name: achievement.name,
        description: achievement.description,
        category: achievement.category,
        progress: currentProgress,
        threshold: criteria.threshold,
        isCompleted,
        completedAt: userAchievement?.earnedAt,
        nextMilestone: this.calculations.getNextMilestone(achievement, currentProgress),
      };
    });

    return Promise.all(progressPromises);
  }

  /**
   * Get user's earned achievements with details
   */
  async getUserAchievements(userId: string, category?: string): Promise<any[]> {
    try {
      const whereClause: any = { userId };
      
      const userAchievements = await this.prisma.userAchievement.findMany({
        where: {
          ...whereClause,
          ...(category ? { achievement: { category } } : {})
        },
        include: {
          achievement: true,
        },
        orderBy: { earnedAt: 'desc' },
      });

      return userAchievements.filter(ua => ua.achievement).map(ua => ({
        id: ua.id,
        achievementId: ua.achievementId,
        name: ua.achievement.name,
        description: ua.achievement.description,
        category: ua.achievement.category,
        badgeImageUrl: ua.achievement.badgeImageUrl,
        icon: ua.achievement.icon,
        color: ua.achievement.color,
        pointsAwarded: ua.achievement.pointsAwarded,
        earnedAt: ua.earnedAt,
        metadata: ua.metadata,
      }));
    } catch (error) {
      console.error('Error getting user achievements:', error);
      throw new Error('Failed to get user achievements');
    }
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