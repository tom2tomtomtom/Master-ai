/**
 * Completion Rate Analytics
 *
 * Utilities for calculating lesson completion rates across the platform.
 * Completion rate = (Number of users who completed / Total users who started) * 100
 */

import { PrismaClient } from '@prisma/client';
import { cache } from '@/utils/cache/redisClient';
import { appLogger } from '@/lib/logger';

const CACHE_TTL = 3600; // 1 hour

/**
 * Calculate completion rate for a specific lesson
 *
 * @param prisma - Prisma client instance
 * @param lessonId - ID of the lesson to calculate rate for
 * @returns Completion rate as a percentage (0-100)
 */
export async function calculateLessonCompletionRate(
  prisma: PrismaClient,
  lessonId: string
): Promise<number> {
  try {
    // Check cache first
    const cacheKey = `completion_rate:${lessonId}`;
    const cached = await cache.get<number>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Get all users who have progress on this lesson
    const progressRecords = await prisma.userProgress.findMany({
      where: { lessonId },
      select: { status: true },
    });

    if (progressRecords.length === 0) {
      return 0;
    }

    const completedCount = progressRecords.filter(
      (p) => p.status === 'completed'
    ).length;
    const completionRate = Math.round(
      (completedCount / progressRecords.length) * 100
    );

    // Cache result
    await cache.set(cacheKey, completionRate, CACHE_TTL);

    return completionRate;
  } catch (error) {
    appLogger.error('Error calculating lesson completion rate', {
      error,
      lessonId,
      component: 'completion-rate',
    });
    return 0;
  }
}

/**
 * Calculate completion rates for multiple lessons efficiently
 *
 * Uses groupBy for optimal performance when calculating rates for many lessons.
 *
 * @param prisma - Prisma client instance
 * @param lessonIds - Array of lesson IDs to calculate rates for
 * @returns Map of lessonId -> completionRate
 */
export async function calculateBulkCompletionRates(
  prisma: PrismaClient,
  lessonIds: string[]
): Promise<Map<string, number>> {
  try {
    if (lessonIds.length === 0) {
      return new Map();
    }

    // Try to get cached values first
    const ratesMap = new Map<string, number>();
    const uncachedIds: string[] = [];

    for (const lessonId of lessonIds) {
      const cacheKey = `completion_rate:${lessonId}`;
      const cached = await cache.get<number>(cacheKey);
      if (cached !== null) {
        ratesMap.set(lessonId, cached);
      } else {
        uncachedIds.push(lessonId);
      }
    }

    // If all cached, return early
    if (uncachedIds.length === 0) {
      return ratesMap;
    }

    // Calculate uncached rates using efficient groupBy
    const results = await prisma.userProgress.groupBy({
      by: ['lessonId', 'status'],
      where: {
        lessonId: { in: uncachedIds },
      },
      _count: true,
    });

    const lessonStats = new Map<
      string,
      { total: number; completed: number }
    >();

    // Aggregate counts per lesson
    results.forEach((result) => {
      const stats = lessonStats.get(result.lessonId) || {
        total: 0,
        completed: 0,
      };
      stats.total += result._count;
      if (result.status === 'completed') {
        stats.completed += result._count;
      }
      lessonStats.set(result.lessonId, stats);
    });

    // Calculate rates and cache them
    for (const lessonId of uncachedIds) {
      const stats = lessonStats.get(lessonId);
      const rate =
        stats && stats.total > 0
          ? Math.round((stats.completed / stats.total) * 100)
          : 0;

      ratesMap.set(lessonId, rate);

      // Cache the result
      const cacheKey = `completion_rate:${lessonId}`;
      await cache.set(cacheKey, rate, CACHE_TTL);
    }

    return ratesMap;
  } catch (error) {
    appLogger.error('Error calculating bulk completion rates', {
      error,
      lessonCount: lessonIds.length,
      component: 'completion-rate',
    });

    // Return partial results or empty map on error
    return ratesMap;
  }
}

/**
 * Calculate average completion rate across all lessons
 *
 * @param prisma - Prisma client instance
 * @returns Overall completion rate as a percentage (0-100)
 */
export async function calculateOverallCompletionRate(
  prisma: PrismaClient
): Promise<number> {
  try {
    const cacheKey = 'completion_rate:overall';
    const cached = await cache.get<number>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const allProgress = await prisma.userProgress.count();
    const completedProgress = await prisma.userProgress.count({
      where: { status: 'completed' },
    });

    if (allProgress === 0) {
      return 0;
    }

    const rate = Math.round((completedProgress / allProgress) * 100);

    // Cache for 1 hour
    await cache.set(cacheKey, rate, CACHE_TTL);

    return rate;
  } catch (error) {
    appLogger.error('Error calculating overall completion rate', {
      error,
      component: 'completion-rate',
    });
    return 0;
  }
}

/**
 * Calculate user-specific completion rate
 *
 * Returns what percentage of published lessons this user has completed.
 *
 * @param prisma - Prisma client instance
 * @param userId - ID of the user to calculate rate for
 * @returns User's completion rate as a percentage (0-100)
 */
export async function calculateUserCompletionRate(
  prisma: PrismaClient,
  userId: string
): Promise<number> {
  try {
    const cacheKey = `completion_rate:user:${userId}`;
    const cached = await cache.get<number>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const [totalLessons, completedLessons] = await Promise.all([
      prisma.lesson.count({ where: { isPublished: true } }),
      prisma.userProgress.count({
        where: {
          userId,
          status: 'completed',
        },
      }),
    ]);

    if (totalLessons === 0) {
      return 0;
    }

    const rate = Math.round((completedLessons / totalLessons) * 100);

    // Cache for 1 hour
    await cache.set(cacheKey, rate, CACHE_TTL);

    return rate;
  } catch (error) {
    appLogger.error('Error calculating user completion rate', {
      error,
      userId,
      component: 'completion-rate',
    });
    return 0;
  }
}

/**
 * Invalidate completion rate cache for a specific lesson
 *
 * Call this after a user completes a lesson to ensure fresh data.
 *
 * @param lessonId - ID of the lesson to invalidate cache for
 */
export async function invalidateLessonCompletionCache(
  lessonId: string
): Promise<void> {
  try {
    await cache.del(`completion_rate:${lessonId}`);
    await cache.del('completion_rate:overall');

    appLogger.debug('Invalidated completion rate cache', {
      lessonId,
      component: 'completion-rate',
    });
  } catch (error) {
    appLogger.warn('Failed to invalidate completion rate cache', {
      error,
      lessonId,
      component: 'completion-rate',
    });
  }
}

/**
 * Invalidate user completion rate cache
 *
 * Call this after a user completes a lesson.
 *
 * @param userId - ID of the user to invalidate cache for
 */
export async function invalidateUserCompletionCache(
  userId: string
): Promise<void> {
  try {
    await cache.del(`completion_rate:user:${userId}`);

    appLogger.debug('Invalidated user completion rate cache', {
      userId,
      component: 'completion-rate',
    });
  } catch (error) {
    appLogger.warn('Failed to invalidate user completion rate cache', {
      error,
      userId,
      component: 'completion-rate',
    });
  }
}
