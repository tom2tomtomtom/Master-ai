import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-auth-middleware';
import { achievementSystem } from '@/lib/achievement-system';
import { PrismaClient } from '@prisma/client';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// GET /api/achievements/stats - Get user achievement statistics
export async function GET(_request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = user.id;

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
    console.error('Error fetching achievement stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch achievement statistics' },
      { status: 500 }
    );
  }
}