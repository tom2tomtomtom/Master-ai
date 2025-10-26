// Database query optimization utilities
import { Prisma, PrismaClient } from '@prisma/client';
import { cache, lessonCache, progressCache, userCache } from './caching-strategy';
import { appLogger } from './logger';

// Extended Prisma client with query logging
export function createOptimizedPrismaClient() {
  const prisma = new PrismaClient({
    log: [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'event',
        level: 'error',
      },
      {
        emit: 'event',
        level: 'warn',
      },
    ],
  });

  // Log slow queries
  prisma.$on('query', (e) => {
    if (e.duration > 1000) { // Log queries taking more than 1 second
      appLogger.warn('Slow query detected', {
        query: e.query,
        params: e.params,
        duration: e.duration,
        target: e.target,
      });
    }
  });

  return prisma;
}

// Query optimization helpers
export class OptimizedQueries {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get user with all related data (optimized with select)
   */
  async getUserWithProgress(userId: string) {
    const cacheKey = userCache.key(userId);
    
    // Check cache first
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        progress: {
          select: {
            id: true,
            lessonId: true,
            completed: true,
            completedAt: true,
            progressPercentage: true,
          },
          orderBy: { updatedAt: 'desc' },
          take: 50, // Limit to recent progress
        },
        achievements: {
          select: {
            id: true,
            achievementId: true,
            unlockedAt: true,
            achievement: {
              select: {
                name: true,
                description: true,
                icon: true,
              },
            },
          },
        },
        _count: {
          select: {
            progress: true,
            certifications: true,
            achievements: true,
          },
        },
      },
    });

    // Cache the result
    if (user) {
      await cache.set(cacheKey, user, userCache.ttl);
    }

    return user;
  }

  /**
   * Get lessons with pagination and filtering
   */
  async getLessonsOptimized(options: {
    take?: number;
    skip?: number;
    filter?: {
      tools?: string[];
      difficulty?: string;
      learningPathId?: string;
    };
    orderBy?: Prisma.LessonOrderByWithRelationInput;
  }) {
    const { take = 20, skip = 0, filter = {}, orderBy = { order: 'asc' } } = options;
    
    // Build cache key
    const cacheKey = `${lessonCache.listKey()}:${JSON.stringify(options)}`;
    
    // Check cache
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    // Build where clause
    const where: Prisma.LessonWhereInput = {};
    
    if (filter.tools?.length) {
      where.tools = {
        hasSome: filter.tools,
      };
    }
    
    if (filter.difficulty) {
      where.difficultyLevel = filter.difficulty;
    }
    
    if (filter.learningPathId) {
      where.learningPathId = filter.learningPathId;
    }

    // Execute optimized query
    const [lessons, total] = await this.prisma.$transaction([
      this.prisma.lesson.findMany({
        where,
        take,
        skip,
        orderBy,
        select: {
          id: true,
          lessonNumber: true,
          title: true,
          description: true,
          difficultyLevel: true,
          estimatedTime: true,
          tools: true,
          isFree: true,
          videoUrl: true,
          learningPath: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              userProgress: true,
            },
          },
        },
      }),
      this.prisma.lesson.count({ where }),
    ]);

    const result = {
      lessons,
      total,
      page: Math.floor(skip / take) + 1,
      totalPages: Math.ceil(total / take),
    };

    // Cache the result
    await cache.set(cacheKey, result, lessonCache.ttl);

    return result;
  }

  /**
   * Get user progress with lesson details (avoiding N+1)
   */
  async getUserProgressWithLessons(userId: string) {
    const progress = await this.prisma.userProgress.findMany({
      where: { userId },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            lessonNumber: true,
            difficultyLevel: true,
            tools: true,
            learningPath: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return progress;
  }

  /**
   * Batch update user progress
   */
  async batchUpdateProgress(updates: Array<{
    userId: string;
    lessonId: string;
    progressPercentage: number;
    completed?: boolean;
  }>) {
    // Use transaction for consistency
    const results = await this.prisma.$transaction(
      updates.map(update => 
        this.prisma.userProgress.upsert({
          where: {
            userId_lessonId: {
              userId: update.userId,
              lessonId: update.lessonId,
            },
          },
          update: {
            progressPercentage: update.progressPercentage,
            completed: update.completed || update.progressPercentage >= 100,
            completedAt: update.completed ? new Date() : undefined,
          },
          create: {
            userId: update.userId,
            lessonId: update.lessonId,
            progressPercentage: update.progressPercentage,
            completed: update.completed || update.progressPercentage >= 100,
            completedAt: update.completed ? new Date() : undefined,
          },
        })
      )
    );

    // Invalidate cache for affected users
    const userIds = new Set(updates.map(u => u.userId));
    for (const userId of userIds) {
      await cache.deletePattern(`${progressCache.userKey(userId)}`);
      await cache.delete(userCache.key(userId));
    }

    return results;
  }

  /**
   * Get learning path statistics
   */
  async getLearningPathStats(learningPathId: string) {
    const stats = await this.prisma.$queryRaw`
      SELECT 
        COUNT(DISTINCT up.user_id) as total_users,
        AVG(up.progress_percentage) as avg_progress,
        COUNT(CASE WHEN up.completed = true THEN 1 END) as completions,
        COUNT(DISTINCT l.id) as total_lessons
      FROM lessons l
      LEFT JOIN user_progress up ON l.id = up.lesson_id
      WHERE l.learning_path_id = ${learningPathId}
    `;

    return stats;
  }
}

// Database indexes to add
export const databaseIndexes = `
-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription ON users(subscription_tier, subscription_status);

-- Lesson indexes
CREATE INDEX idx_lessons_learning_path ON lessons(learning_path_id);
CREATE INDEX idx_lessons_tools ON lessons USING GIN(tools);
CREATE INDEX idx_lessons_difficulty ON lessons(difficulty_level);
CREATE INDEX idx_lessons_number ON lessons(lesson_number);

-- Progress indexes
CREATE INDEX idx_progress_user ON user_progress(user_id);
CREATE INDEX idx_progress_lesson ON user_progress(lesson_id);
CREATE INDEX idx_progress_completed ON user_progress(completed);
CREATE INDEX idx_progress_updated ON user_progress(updated_at);

-- Composite indexes
CREATE INDEX idx_progress_user_lesson ON user_progress(user_id, lesson_id);
CREATE INDEX idx_progress_user_completed ON user_progress(user_id, completed);

-- Achievement indexes
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_unlocked ON user_achievements(unlocked_at);
`;
