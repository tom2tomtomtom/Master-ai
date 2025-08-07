import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
// import { cacheService, CacheKeys, CacheTTL } from '@/lib/cache';
// import { monitoredQuery } from '@/lib/db-monitor';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Try to get cached stats first
    // const stats = await cacheService.getOrSet(
    //   CacheKeys.dashboardStats(userId),
    //   async () => {
        // return monitoredQuery('getDashboardStats', async () => {
        const stats = await (async () => {
          // Batch all database queries in parallel
          const [
            userProgress,
            totalLessons,
            bookmarksCount,
            notesCount,
            certificationsCount,
            userStats
          ] = await Promise.all([
            prisma.userProgress.findMany({
              where: { userId },
              select: {
                status: true,
                timeSpentMinutes: true,
                completedAt: true,
                lastAccessed: true,
              }
            }),
            prisma.lesson.count({ where: { isPublished: true } }),
            prisma.lessonBookmark.count({ where: { userId } }),
            prisma.lessonNote.count({ where: { userId } }),
            prisma.userCertification.count({ 
              where: { userId, isRevoked: false } 
            }),
            // Get user stats if they exist (already computed)
            prisma.userStats.findUnique({ where: { userId } })
          ]);

          // Calculate stats from user progress
          const completedLessons = userProgress.filter(p => p.status === 'completed').length;
          const inProgressLessons = userProgress.filter(p => p.status === 'in_progress').length;
          const totalTimeSpent = userProgress.reduce((sum, p) => sum + p.timeSpentMinutes, 0);

          // Calculate completion percentage
          const overallCompletionPercentage = totalLessons > 0 
            ? Math.round((completedLessons / totalLessons) * 100) 
            : 0;

          // Calculate this week's completed lessons
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          
          const lessonsCompletedThisWeek = userProgress.filter(p => 
            p.status === 'completed' && 
            p.completedAt && 
            new Date(p.completedAt) >= oneWeekAgo
          ).length;

          // Use cached streak from user stats if available, otherwise calculate
          let learningStreak = 0;
          if (userStats?.currentStreak !== undefined) {
            learningStreak = userStats.currentStreak;
          } else {
            // Fallback calculation - optimized version
            const activityByDate = new Map<string, boolean>();
            userProgress.forEach(activity => {
              if (activity.lastAccessed) {
                const dateKey = activity.lastAccessed.toISOString().split('T')[0];
                activityByDate.set(dateKey, true);
              }
            });

            const today = new Date();
            // eslint-disable-next-line prefer-const
            let currentDate = new Date(today);
            currentDate.setHours(0, 0, 0, 0);

            while (true) {
              const dateKey = currentDate.toISOString().split('T')[0];
              if (activityByDate.has(dateKey)) {
                learningStreak++;
                currentDate.setDate(currentDate.getDate() - 1);
              } else {
                break;
              }
            }
          }

          // Calculate average session time
          const sessionsWithTime = userProgress.filter(p => p.timeSpentMinutes > 0);
          const averageSessionTime = sessionsWithTime.length > 0 
            ? Math.round(sessionsWithTime.reduce((sum, p) => sum + p.timeSpentMinutes, 0) / sessionsWithTime.length)
            : 0;

          return {
            totalLessons,
            completedLessons,
            inProgressLessons,
            overallCompletionPercentage,
            totalTimeSpent,
            learningStreak,
            lessonsCompletedThisWeek,
            averageSessionTime,
            certificationsEarned: certificationsCount,
            bookmarkedLessons: bookmarksCount,
            totalNotes: notesCount,
            // Add cache metadata for debugging
            _cached: false,
            _computedAt: new Date().toISOString(),
          };
        // }, { userId, table: 'dashboard_stats' });
      // },
      // { ttl: CacheTTL.dashboardStats }
    })();

    // Mark as cached if it came from cache
    if (!stats._cached) {
      stats._cached = true;
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}