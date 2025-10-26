/**
 * Dashboard Simulators Module
 *
 * Simulates typical dashboard API calls for performance testing
 */

import type { PrismaClient } from '@prisma/client';

/**
 * Simulate dashboard stats API call
 *
 * Fetches aggregated user statistics that would be displayed on the dashboard
 *
 * @param prisma - PrismaClient instance
 * @param userId - The user ID to fetch stats for
 * @returns Promise with dashboard statistics
 */
export async function simulateDashboardStats(
  prisma: PrismaClient,
  userId: string
): Promise<{
  userProgress: any[];
  totalLessons: number;
  bookmarksCount: number;
  notesCount: number;
  certificationsCount: number;
}> {
  // Simulate the optimized dashboard stats query
  const [userProgress, totalLessons, bookmarksCount, notesCount, certificationsCount] = await Promise.all([
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
  ]);

  return { userProgress, totalLessons, bookmarksCount, notesCount, certificationsCount };
}

/**
 * Simulate recent activity API call
 *
 * Fetches recent user activity including progress, notes, bookmarks, and certifications
 *
 * @param prisma - PrismaClient instance
 * @param userId - The user ID to fetch activity for
 * @returns Promise with recent activity data
 */
export async function simulateRecentActivity(
  prisma: PrismaClient,
  userId: string
): Promise<{
  recentProgress: any[];
  recentNotes: any[];
  recentBookmarks: any[];
  recentCertifications: any[];
}> {
  const [recentProgress, recentNotes, recentBookmarks, recentCertifications] = await Promise.all([
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
        lesson: { select: { id: true, lessonNumber: true, title: true } }
      },
      orderBy: [{ completedAt: 'desc' }, { lastAccessed: 'desc' }],
      take: 20
    }),
    prisma.lessonNote.findMany({
      where: { userId },
      select: {
        id: true,
        createdAt: true,
        lessonId: true,
        lesson: { select: { id: true, lessonNumber: true, title: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    }),
    prisma.lessonBookmark.findMany({
      where: { userId },
      select: {
        id: true,
        createdAt: true,
        lessonId: true,
        lesson: { select: { id: true, lessonNumber: true, title: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    }),
    prisma.userCertification.findMany({
      where: { userId, isRevoked: false },
      select: {
        id: true,
        earnedAt: true,
        certification: { select: { id: true, name: true } }
      },
      orderBy: { earnedAt: 'desc' },
      take: 10
    })
  ]);

  return { recentProgress, recentNotes, recentBookmarks, recentCertifications };
}
