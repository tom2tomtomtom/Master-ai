/**
 * Achievement Awards Service
 * 
 * Handles awarding achievements to users and eligibility checking
 */

import { PrismaClient } from '@prisma/client';
import { AchievementCalculations } from './calculations';

export class AchievementAwardsService {
  private calculations: AchievementCalculations;

  constructor(private prisma: PrismaClient) {
    this.calculations = new AchievementCalculations(prisma);
  }

  /**
   * Check all achievements for a user and award eligible ones
   * OPTIMIZED: Reduced N+1 queries, added caching, batch operations
   */
  async checkAndAwardAchievements(userId: string): Promise<string[]> {
    // Single query to get all active achievements with user achievement data
    const [activeAchievements, userAchievements, userStats] = await Promise.all([
      this.prisma.achievement.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      }),
      this.prisma.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true },
      }),
      this.ensureUserStats(userId), // Get stats once for all eligibility checks
    ]);

    const earnedAchievementIds = new Set(userAchievements.map(ua => ua.achievementId));
    const newAchievements: string[] = [];
    const eligibilityPromises: Promise<{ id: string; isEligible: boolean }>[] = [];

    // Batch eligibility checks instead of sequential
    for (const achievement of activeAchievements) {
      if (earnedAchievementIds.has(achievement.id)) {
        continue;
      }

      eligibilityPromises.push(
        this.checkEligibilityOptimized(userId, achievement, userStats)
          .then(isEligible => ({ id: achievement.id, isEligible }))
      );
    }

    const eligibilityResults = await Promise.all(eligibilityPromises);
    
    // Batch award achievements
    const toAward = eligibilityResults.filter(result => result.isEligible);
    if (toAward.length > 0) {
      await this.batchAwardAchievements(userId, toAward.map(r => r.id));
      newAchievements.push(...toAward.map(r => r.id));
    }

    return newAchievements;
  }

  /**
   * Award a single achievement to a user
   */
  async awardAchievement(userId: string, achievementId: string): Promise<void> {
    const achievement = await this.prisma.achievement.findUnique({
      where: { id: achievementId },
    });

    if (!achievement) return;

    const userStats = await this.ensureUserStats(userId);

    // Create the achievement record
    await this.prisma.userAchievement.create({
      data: {
        userId,
        achievementId,
        metadata: {
          earnedAt: new Date().toISOString(),
          userStatsSnapshot: {
            totalLessonsCompleted: userStats.totalLessonsCompleted,
            currentStreak: userStats.currentStreak,
            totalTimeSpent: userStats.totalTimeSpentMinutes,
          },
        },
      },
    });

    // Update user's total points
    if (achievement.pointsAwarded > 0) {
      await this.prisma.userStats.update({
        where: { userId },
        data: {
          totalPointsEarned: { increment: achievement.pointsAwarded },
        },
      });
    }
  }

  /**
   * Batch award achievements to reduce database calls
   */
  async batchAwardAchievements(userId: string, achievementIds: string[]): Promise<void> {
    if (achievementIds.length === 0) return;

    // Get all achievements and user stats in single queries
    const [achievements, userStats] = await Promise.all([
      this.prisma.achievement.findMany({
        where: { id: { in: achievementIds } },
      }),
      this.ensureUserStats(userId),
    ]);

    const achievementMap = new Map(achievements.map(a => [a.id, a]));
    
    // Prepare batch data for userAchievements
    const userAchievementData = achievementIds.map(achievementId => {
      return {
        userId,
        achievementId,
        metadata: {
          earnedAt: new Date().toISOString(),
          userStatsSnapshot: {
            totalLessonsCompleted: userStats.totalLessonsCompleted,
            currentStreak: userStats.currentStreak,
            totalTimeSpent: userStats.totalTimeSpentMinutes,
          },
        },
      };
    });

    // Calculate total points to award
    const totalPoints = achievements.reduce((sum, achievement) => sum + achievement.pointsAwarded, 0);

    // Execute batch operations in transaction
    await this.prisma.$transaction([
      // Batch create user achievements
      this.prisma.userAchievement.createMany({
        data: userAchievementData,
        skipDuplicates: true,
      }),
      // Update user points in single operation
      ...(totalPoints > 0 ? [
        this.prisma.userStats.update({
          where: { userId },
          data: {
            totalPointsEarned: { increment: totalPoints },
          },
        })
      ] : []),
    ]);
  }

  /**
   * Check achievement eligibility with optimized data fetching
   */
  private async checkEligibilityOptimized(
    userId: string, 
    achievement: any, 
    userStats: any
  ): Promise<boolean> {
    // First check basic eligibility with pre-fetched stats
    const basicEligible = this.calculations.checkEligibilityOptimized(achievement, userStats);
    
    // Handle special cases that require async database calls
    const criteria = achievement.criteria as any;
    
    switch (criteria.type) {
      case 'speed_completion':
        return this.calculations.checkSpeedCompletion(userId, criteria);

      case 'engagement_score':
        // Use sync version with pre-fetched stats
        return basicEligible;

      default:
        return basicEligible;
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