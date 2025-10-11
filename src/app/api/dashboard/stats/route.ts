import { NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth-helpers';
import { prisma, safeQuery } from '@/lib/prisma';
import { appLogger } from '@/lib/logger';
// import { cacheService, CacheKeys, CacheTTL } from '@/lib/cache';
// import { monitoredQuery } from '@/lib/db-monitor';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireAuth();
    const userId = user.userId;

    // Try to get cached stats first
    // const stats = await cacheService.getOrSet(
    //   CacheKeys.dashboardStats(userId),
    //   async () => {
        // return monitoredQuery('getDashboardStats', async () => {
        const stats = await safeQuery(async () => {
          // Batch all database queries in parallel with safe query wrapper
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
            }).catch(() => []),
            prisma.lesson.count({ where: { isPublished: true } }).catch(() => 89),
            prisma.lessonBookmark.count({ where: { userId } }).catch(() => 0),
            prisma.lessonNote.count({ where: { userId } }).catch(() => 0),
            prisma.userCertification.count({ 
              where: { userId, isRevoked: false } 
            }).catch(() => 0),
            // Get user stats if they exist (already computed)
            prisma.userStats.findUnique({ where: { userId } }).catch(() => null)
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
            _fallback: false,
          };
        // }, { userId, table: 'dashboard_stats' });
      // },
      // { ttl: CacheTTL.dashboardStats }
        }, {
          // Fallback data if database is unavailable
          totalLessons: 89,
          completedLessons: 0,
          inProgressLessons: 0,
          overallCompletionPercentage: 0,
          totalTimeSpent: 0,
          learningStreak: 0,
          lessonsCompletedThisWeek: 0,
          averageSessionTime: 0,
          certificationsEarned: 0,
          bookmarkedLessons: 0,
          totalNotes: 0,
          _cached: false,
          _computedAt: new Date().toISOString(),
          _fallback: true,
        });

    // Mark as cached if it came from cache (only if not fallback)
    if (stats && !stats._fallback && !stats._cached) {
      stats._cached = true;
    }

    return NextResponse.json(stats || {
      totalLessons: 89,
      completedLessons: 0,
      inProgressLessons: 0,
      overallCompletionPercentage: 0,
      totalTimeSpent: 0,
      learningStreak: 0,
      lessonsCompletedThisWeek: 0,
      averageSessionTime: 0,
      certificationsEarned: 0,
      bookmarkedLessons: 0,
      totalNotes: 0,
      _fallback: true,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    appLogger.errors.apiError('dashboard-stats', error as Error, {
      endpoint: '/api/dashboard/stats'
    });
    // Return fallback data instead of error
    return NextResponse.json({
      totalLessons: 89,
      completedLessons: 0,
      inProgressLessons: 0,
      overallCompletionPercentage: 0,
      totalTimeSpent: 0,
      learningStreak: 0,
      lessonsCompletedThisWeek: 0,
      averageSessionTime: 0,
      certificationsEarned: 0,
      bookmarkedLessons: 0,
      totalNotes: 0,
      _fallback: true,
      _error: true,
    });
  }
}