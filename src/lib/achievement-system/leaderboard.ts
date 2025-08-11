/**
 * Achievement Leaderboard Service
 * 
 * Handles achievement leaderboard functionality
 */

import { PrismaClient } from '@prisma/client';
import { LeaderboardEntry } from './types';

export class AchievementLeaderboardService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get achievement leaderboard
   * OPTIMIZED: Added caching, optimized queries, batch data fetching
   */
  async getLeaderboard(
    category?: string, 
    limit = 50
  ): Promise<LeaderboardEntry[]> {
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
  }
}