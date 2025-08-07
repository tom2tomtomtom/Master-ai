/**
 * AchievementSystem - Core service for managing user achievements and progress milestones
 * 
 * This service handles:
 * - Tracking user progress milestones
 * - Awarding achievement badges automatically
 * - Calculating learning streaks and engagement metrics
 * - Managing achievement criteria and validation
 * - Providing achievement progress insights
 */

import { PrismaClient } from '@prisma/client';
// import { cacheService, CacheKeys, CacheTTL, CacheInvalidation } from './cache';
// import { monitoredQuery, dbMonitor } from './db-monitor';

export interface AchievementCriteria {
  type: 'lessons_completed' | 'streak_days' | 'notes_taken' | 'bookmarks_created' | 
        'time_spent' | 'consecutive_days' | 'speed_completion' | 'engagement_score';
  threshold: number;
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time';
  operator?: 'gte' | 'lte' | 'eq';
  metadata?: Record<string, any>;
}

export interface AchievementProgress {
  achievementId: string;
  name: string;
  description: string;
  category: string;
  progress: number;
  threshold: number;
  isCompleted: boolean;
  completedAt?: Date;
  nextMilestone?: {
    name: string;
    threshold: number;
    remaining: number;
  };
}

export interface UserActivity {
  lessonCompleted?: boolean;
  noteCreated?: boolean;
  bookmarkCreated?: boolean;
  timeSpent?: number;
  date: Date;
}

export class AchievementSystem {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  /**
   * Process user activity and check for new achievements
   */
  async processUserActivity(userId: string, activity: UserActivity): Promise<string[]> {
    try {
      // Update user stats first
      await this.updateUserStats(userId, activity);

      // Check for new achievements
      const newAchievements = await this.checkAndAwardAchievements(userId);

      return newAchievements;
    } catch (error) {
      console.error('Error processing user activity:', error);
      throw new Error('Failed to process user activity');
    }
  }

  /**
   * Check all achievements for a user and award eligible ones
   * OPTIMIZED: Reduced N+1 queries, added caching, batch operations
   */
  async checkAndAwardAchievements(userId: string): Promise<string[]> {
    // return monitoredQuery('checkAndAwardAchievements', async () => {
      // Check cache first
      // const cacheKey = `achievements:check:${userId}`;
      // const cached = await cacheService.get<string[]>(cacheKey, { ttl: CacheTTL.userAchievements });
      // if (cached) {
      //   return cached;
      // }

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
          this.checkAchievementEligibilityOptimized(userId, achievement, userStats)
            .then(isEligible => ({ id: achievement.id, isEligible }))
        );
      }

      const eligibilityResults = await Promise.all(eligibilityPromises);
      
      // Batch award achievements
      const toAward = eligibilityResults.filter(result => result.isEligible);
      if (toAward.length > 0) {
        await this.batchAwardAchievements(userId, toAward.map(r => r.id));
        newAchievements.push(...toAward.map(r => r.id));
        
        // Invalidate related caches
        // await CacheInvalidation.achievementEarned(userId);
      }

      // Cache the result for a short time to prevent repeated calls
      // if (newAchievements.length === 0) {
      //   await cacheService.set(cacheKey, newAchievements, { ttl: 60 }); // 1 minute cache for no new achievements
      // }

      return newAchievements;
    // }, { userId, table: 'achievements' });
  }

  /**
   * Get user's achievement progress
   * OPTIMIZED: Added caching, eliminated sequential processing
   */
  async getUserAchievementProgress(userId: string): Promise<AchievementProgress[]> {
    // return monitoredQuery('getUserAchievementProgress', async () => {
      // return cacheService.getOrSet(
      //   CacheKeys.userAchievements(userId),
      //   async () => {
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
            
            const currentProgress = this.calculateAchievementProgressSync(
              achievement, 
              userStats
            );

            const criteria = achievement.criteria as unknown as AchievementCriteria;
            
            return {
              achievementId: achievement.id,
              name: achievement.name,
              description: achievement.description,
              category: achievement.category,
              progress: currentProgress,
              threshold: criteria.threshold,
              isCompleted,
              completedAt: userAchievement?.earnedAt,
              nextMilestone: this.getNextMilestone(achievement, currentProgress),
            };
          });

          return Promise.all(progressPromises);
        // },
        // { ttl: CacheTTL.userAchievements }
      // );
    // }, { userId, table: 'achievements' });
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
   * Calculate learning streak for a user
   */
  async calculateLearningStreak(userId: string): Promise<{
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: Date | null;
  }> {
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
   * Get achievement leaderboard
   * OPTIMIZED: Added caching, optimized queries, batch data fetching
   */
  async getAchievementLeaderboard(
    category?: string, 
    limit = 50
  ): Promise<Array<{
    userId: string;
    userName: string | null;
    achievementCount: number;
    totalPoints: number;
    recentAchievements: any[];
  }>> {
    // return monitoredQuery('getAchievementLeaderboard', async () => {
      // return cacheService.getOrSet(
      //   CacheKeys.achievementLeaderboard(category),
      //   async () => {
          const whereClause = category ? { achievement: { category } } : {};

          // Single optimized query to get leaderboard data
          const leaderboardData = await this.prisma.userAchievement.groupBy({
            by: ['userId'],
            where: whereClause,
            _count: { achievementId: true },
            orderBy: {
              _count: {
                achievementId: 'desc'
              }
            },
            take: limit * 2, // Get more than needed for better caching
          });

          const userIds = leaderboardData.map(entry => entry.userId);
          
          if (userIds.length === 0) {
            return [];
          }

          // Batch fetch all related data
          const [users, userStats, recentAchievements] = await Promise.all([
            this.prisma.user.findMany({
              where: { id: { in: userIds } },
              select: { id: true, name: true },
            }),
            this.prisma.userStats.findMany({
              where: { userId: { in: userIds } },
              select: { userId: true, totalPointsEarned: true },
            }),
            this.prisma.userAchievement.findMany({
              where: {
                userId: { in: userIds },
                ...whereClause,
              },
              include: {
                achievement: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    badgeImageUrl: true,
                    icon: true,
                    color: true,
                  }
                }
              },
              orderBy: { earnedAt: 'desc' },
              take: userIds.length * 3, // 3 per user max
            })
          ]);

          // Create lookup maps for O(1) access
          const userMap = new Map(users.map(u => [u.id, u]));
          const statsMap = new Map(userStats.map(s => [s.userId, s]));
          const achievementsMap = new Map<string, any[]>();

          // Group recent achievements by user
          recentAchievements.forEach(achievement => {
            if (!achievementsMap.has(achievement.userId)) {
              achievementsMap.set(achievement.userId, []);
            }
            achievementsMap.get(achievement.userId)!.push(achievement);
          });

          // Build final result
          const result = leaderboardData
            .map(entry => {
              const user = userMap.get(entry.userId);
              const stats = statsMap.get(entry.userId);
              const userAchievements = achievementsMap.get(entry.userId) || [];

              return {
                userId: entry.userId,
                userName: user?.name || null,
                achievementCount: entry._count.achievementId,
                totalPoints: stats?.totalPointsEarned || 0,
                recentAchievements: userAchievements.slice(0, 3),
              };
            })
            .sort((a, b) => {
              // Primary sort by achievement count, secondary by points
              if (a.achievementCount !== b.achievementCount) {
                return b.achievementCount - a.achievementCount;
              }
              return b.totalPoints - a.totalPoints;
            })
            .slice(0, limit);

          return result;
        // },
        // { ttl: CacheTTL.achievementLeaderboard }
      // );
    // }, { table: 'achievements' });
  }

  // Private helper methods

  private async updateUserStats(userId: string, activity: UserActivity): Promise<void> {
    const _stats = await this.ensureUserStats(userId);
    const streakInfo = await this.calculateLearningStreak(userId);

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

  private async checkAchievementEligibility(userId: string, achievement: any): Promise<boolean> {
    const criteria = achievement.criteria as AchievementCriteria;
    const userStats = await this.ensureUserStats(userId);

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
        return this.checkSpeedCompletion(userId, criteria);

      case 'engagement_score':
        return this.checkEngagementScore(userId, criteria);

      default:
        return false;
    }
  }

  private calculateAchievementProgressSync(
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

  private async calculateAchievementProgress(
    userId: string,
    achievement: any,
    userStats: any
  ): Promise<number> {
    return this.calculateAchievementProgressSync(achievement, userStats);
  }

  private getNextMilestone(achievement: any, currentProgress: number): {
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

  private async awardAchievement(userId: string, achievementId: string): Promise<void> {
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

  private async checkSpeedCompletion(userId: string, criteria: AchievementCriteria): Promise<boolean> {
    // Check if user completed lessons within specified timeframe
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

  private async checkEngagementScore(userId: string, criteria: AchievementCriteria): Promise<boolean> {
    // Calculate engagement score based on multiple factors
    const userStats = await this.ensureUserStats(userId);
    
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
   * Optimized version of checkAchievementEligibility that reuses userStats
   */
  private async checkAchievementEligibilityOptimized(
    userId: string, 
    achievement: any, 
    userStats: any
  ): Promise<boolean> {
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
        return this.checkSpeedCompletion(userId, criteria);

      case 'engagement_score':
        return this.checkEngagementScoreOptimized(criteria, userStats);

      default:
        return false;
    }
  }

  /**
   * Optimized engagement score check that reuses userStats
   */
  private checkEngagementScoreOptimized(criteria: AchievementCriteria, userStats: any): boolean {
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
   * Batch award achievements to reduce database calls
   */
  private async batchAwardAchievements(userId: string, achievementIds: string[]): Promise<void> {
    if (achievementIds.length === 0) return;

    // return monitoredQuery('batchAwardAchievements', async () => {
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
        const achievement = achievementMap.get(achievementId);
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
    // }, { userId, table: 'achievements' });
  }
}

// Singleton instance
export const achievementSystem = new AchievementSystem();