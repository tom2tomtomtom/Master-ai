import { NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth-helpers';
import { achievementSystem } from '@/lib/achievement-system';
import { appLogger } from '@/lib/logger';
import { PrismaClient } from '@prisma/client';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// GET /api/achievements/stats - Get user achievement statistics
export async function GET() {
  try {
    const user = await requireAuth();
    const userId = user.userId;

    // Get user stats
    const userStats = await prisma.userStats.findUnique({
      where: { userId },
    });

    // Get learning streak info
    const streakInfo = await achievementSystem.calculateLearningStreak(userId);

    // Get achievement counts by category - unused for now but may be needed for future features
    // const achievementCounts = await prisma.userAchievement.groupBy({
    //   by: ['achievementId'],
    //   where: { userId },
    //   _count: { achievementId: true },
    // });

    // Get total achievements available
    const totalAchievements = await prisma.achievement.count({
      where: { isActive: true },
    });

    // Get earned achievements count
    const earnedAchievements = await prisma.userAchievement.count({
      where: { userId },
    });

    // Get recent achievements
    const recentAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: {
          select: {
            name: true,
            description: true,
            category: true,
            badgeImageUrl: true,
            pointsAwarded: true,
          },
        },
      },
      orderBy: { earnedAt: 'desc' },
      take: 5,
    });

    // Calculate completion percentage
    const completionPercentage = totalAchievements > 0 
      ? Math.round((earnedAchievements / totalAchievements) * 100)
      : 0;

    return NextResponse.json({
      userStats: userStats || {
        totalLessonsCompleted: 0,
        totalTimeSpentMinutes: 0,
        totalNotesCreated: 0,
        totalBookmarksCreated: 0,
        totalPointsEarned: 0,
      },
      streakInfo,
      achievements: {
        earned: earnedAchievements,
        total: totalAchievements,
        completionPercentage,
      },
      recentAchievements: recentAchievements.map(ua => ({
        id: ua.id,
        name: ua.achievement.name,
        description: ua.achievement.description,
        category: ua.achievement.category,
        badgeImageUrl: ua.achievement.badgeImageUrl,
        pointsAwarded: ua.achievement.pointsAwarded,
        earnedAt: ua.earnedAt,
      })),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    appLogger.error('Error fetching achievement stats', { error });
    return NextResponse.json(
      { error: 'Failed to fetch achievement statistics' },
      { status: 500 }
    );
  }
}