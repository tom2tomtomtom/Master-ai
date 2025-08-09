import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-auth-middleware';
import { prisma } from '@/lib/prisma';
// import { cacheService, CacheKeys, CacheTTL } from '@/lib/cache';
// import { monitoredQuery } from '@/lib/db-monitor';

export async function GET(_request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const limit = 10; // Number of recent activities to fetch

    // Get cached activities if available
    // const activities = await cacheService.getOrSet(
    //   CacheKeys.dashboardActivity(userId),
    //   async () => {
        // return monitoredQuery('getRecentActivity', async () => {
        const activities = await (async () => {
          // Batch fetch all activity data in parallel
          const [
            recentProgress,
            recentNotes,
            recentBookmarks,
            recentCertifications
          ] = await Promise.all([
            // Get recent lesson progress (optimized query)
            prisma.userProgress.findMany({
              where: { 
                userId,
                OR: [
                  { status: 'completed', completedAt: { not: null } },
                  { status: 'in_progress', lastAccessed: { not: null } }
                ]
              },
              select: {
                id: true,
                status: true,
                completedAt: true,
                lastAccessed: true,
                lessonId: true,
                lesson: {
                  select: {
                    id: true,
                    lessonNumber: true,
                    title: true,
                  }
                }
              },
              orderBy: [
                { completedAt: 'desc' },
                { lastAccessed: 'desc' }
              ],
              take: limit * 2 // Get more to filter and sort properly
            }),
            // Get recent notes
            prisma.lessonNote.findMany({
              where: { userId },
              select: {
                id: true,
                createdAt: true,
                lessonId: true,
                lesson: {
                  select: {
                    id: true,
                    lessonNumber: true,
                    title: true,
                  }
                }
              },
              orderBy: { createdAt: 'desc' },
              take: limit
            }),
            // Get recent bookmarks
            prisma.lessonBookmark.findMany({
              where: { userId },
              select: {
                id: true,
                createdAt: true,
                lessonId: true,
                lesson: {
                  select: {
                    id: true,
                    lessonNumber: true,
                    title: true,
                  }
                }
              },
              orderBy: { createdAt: 'desc' },
              take: limit
            }),
            // Get recent certifications
            prisma.userCertification.findMany({
              where: { userId, isRevoked: false },
              select: {
                id: true,
                earnedAt: true,
                certification: {
                  select: {
                    id: true,
                    name: true,
                  }
                }
              },
              orderBy: { earnedAt: 'desc' },
              take: limit
            })
          ]);

          // Process activities efficiently
          const allActivities: any[] = [];

          // Add lesson completions
          recentProgress
            .filter(p => p.status === 'completed' && p.completedAt)
            .forEach(p => {
              allActivities.push({
                id: `completion-${p.id}`,
                type: 'lesson_completed' as const,
                lessonId: p.lesson.id,
                lessonTitle: p.lesson.title,
                timestamp: p.completedAt!,
                details: `Completed Lesson ${p.lesson.lessonNumber}`,
                sortKey: p.completedAt!.getTime()
              });
            });
          
          // Add lesson starts (only if not already completed)
          const completedLessonIds = new Set(
            recentProgress
              .filter(p => p.status === 'completed')
              .map(p => p.lessonId)
          );
          
          recentProgress
            .filter(p => p.status === 'in_progress' && p.lastAccessed)
            .filter(p => !completedLessonIds.has(p.lessonId))
            .forEach(p => {
              allActivities.push({
                id: `start-${p.id}`,
                type: 'lesson_started' as const,
                lessonId: p.lesson.id,
                lessonTitle: p.lesson.title,
                timestamp: p.lastAccessed!,
                details: `Started Lesson ${p.lesson.lessonNumber}`,
                sortKey: p.lastAccessed!.getTime()
              });
            });

          // Add notes
          recentNotes.forEach(note => {
            allActivities.push({
              id: `note-${note.id}`,
              type: 'note_added' as const,
              lessonId: note.lesson.id,
              lessonTitle: note.lesson.title,
              timestamp: note.createdAt,
              details: `Added note to Lesson ${note.lesson.lessonNumber}`,
              sortKey: note.createdAt.getTime()
            });
          });

          // Add bookmarks
          recentBookmarks.forEach(bookmark => {
            allActivities.push({
              id: `bookmark-${bookmark.id}`,
              type: 'bookmark_added' as const,
              lessonId: bookmark.lesson.id,
              lessonTitle: bookmark.lesson.title,
              timestamp: bookmark.createdAt,
              details: `Bookmarked Lesson ${bookmark.lesson.lessonNumber}`,
              sortKey: bookmark.createdAt.getTime()
            });
          });

          // Add certifications
          recentCertifications.forEach(cert => {
            allActivities.push({
              id: `cert-${cert.id}`,
              type: 'certification_earned' as const,
              timestamp: cert.earnedAt,
              details: `Earned ${cert.certification.name} certification`,
              sortKey: cert.earnedAt.getTime()
            });
          });

          // Sort by timestamp and take the most recent (using pre-calculated sortKey for performance)
          return allActivities
            .sort((a, b) => b.sortKey - a.sortKey)
            .slice(0, limit)
            .map(({ sortKey: _, ...activity }) => activity); // Remove sortKey from final result
        // }, { userId, table: 'dashboard_activity' });
      // },
      // { ttl: CacheTTL.dashboardActivity }
    })();

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent activity' },
      { status: 500 }
    );
  }
}