import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { appLogger } from '@/lib/logger';
import { getOptionalAuth } from '@/lib/auth-helpers';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import type { SearchResponse, LessonWithMetadata } from '@/types/discovery';
import { calculateBulkCompletionRates } from '@/lib/analytics/completion-rate';

export const dynamic = 'force-dynamic';

// Enhanced search query schema
const searchQuerySchema = z.object({
  // Pagination
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  
  // Search & Filters
  search: z.string().optional(),
  difficulty: z.string().transform(val => val ? val.split(',') : []).optional(),
  tools: z.string().transform(val => val ? val.split(',') : []).optional(),
  categories: z.string().transform(val => val ? val.split(',') : []).optional(),
  minDuration: z.coerce.number().min(0).optional(),
  maxDuration: z.coerce.number().min(0).optional(),
  completed: z.enum(['true', 'false', 'all']).optional(),
  bookmarked: z.enum(['true', 'false']).optional(),
  
  // Sorting
  sortBy: z.enum(['relevance', 'difficulty', 'duration', 'popularity', 'recent', 'title']).default('relevance'),
  
  // View options
  includeMetadata: z.enum(['true', 'false']).default('true'),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getOptionalAuth();
    const userId = user?.userId;

    const { searchParams } = new URL(request.url);
    
    const {
      page,
      limit,
      search,
      difficulty,
      tools,
      categories,
      minDuration,
      maxDuration,
      completed,
      bookmarked,
      sortBy,
      includeMetadata
    } = searchQuerySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      difficulty: searchParams.get('difficulty'),
      tools: searchParams.get('tools'),
      categories: searchParams.get('categories'),
      minDuration: searchParams.get('minDuration'),
      maxDuration: searchParams.get('maxDuration'),
      completed: searchParams.get('completed'),
      bookmarked: searchParams.get('bookmarked'),
      sortBy: searchParams.get('sortBy'),
      includeMetadata: searchParams.get('includeMetadata'),
    });

    const skip = (page - 1) * limit;

    // Build complex where clause
    const whereClause: Prisma.LessonWhereInput = {
      isPublished: true,
    };

    // Text search across multiple fields
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tools: { hasSome: [search] } },
      ];
    }

    // Difficulty filter
    if (difficulty && difficulty.length > 0) {
      whereClause.difficultyLevel = { in: difficulty };
    }

    // Tools filter
    if (tools && tools.length > 0) {
      whereClause.tools = { hasSome: tools };
    }

    // Duration filter
    if (minDuration !== undefined || maxDuration !== undefined) {
      whereClause.estimatedTime = {};
      if (minDuration !== undefined) whereClause.estimatedTime.gte = minDuration;
      if (maxDuration !== undefined) whereClause.estimatedTime.lte = maxDuration;
    }

    // Categories filter
    if (categories && categories.length > 0) {
      whereClause.categories = {
        some: {
          categoryId: { in: categories }
        }
      };
    }

    // User-specific filters (only if user is logged in)
    if (userId) {
      if (completed === 'true') {
        whereClause.progress = {
          some: {
            userId: userId,
            status: 'completed'
          }
        };
      } else if (completed === 'false') {
        whereClause.progress = {
          none: {
            userId: userId,
            status: 'completed'
          }
        };
      }

      if (bookmarked === 'true') {
        whereClause.bookmarks = {
          some: {
            userId: userId
          }
        };
      }
    }

    // Build order clause
    let orderBy: Prisma.LessonOrderByWithRelationInput | Prisma.LessonOrderByWithRelationInput[] = {};
    switch (sortBy) {
      case 'title':
        orderBy = { title: 'asc' };
        break;
      case 'difficulty':
        orderBy = [
          { difficultyLevel: 'asc' },
          { lessonNumber: 'asc' }
        ];
        break;
      case 'duration':
        orderBy = { estimatedTime: 'asc' };
        break;
      case 'recent':
        orderBy = { createdAt: 'desc' };
        break;
      case 'popularity':
        // We'll calculate this based on interactions
        orderBy = { lessonNumber: 'asc' }; // Fallback for now
        break;
      default: // relevance
        orderBy = { lessonNumber: 'asc' };
    }

    // Execute main query
    const [lessons, totalCount] = await Promise.all([
      prisma.lesson.findMany({
        where: whereClause,
        include: {
          categories: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                  icon: true,
                }
              }
            }
          },
          progress: userId ? {
            where: { userId },
            select: {
              status: true,
              progressPercentage: true,
              completedAt: true,
            }
          } : false,
          bookmarks: userId ? {
            where: { userId },
            select: { id: true }
          } : false,
          _count: {
            select: {
              interactions: true, // For popularity calculation
            }
          }
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.lesson.count({ where: whereClause })
    ]);

    // Calculate completion rates for all lessons
    const lessonIds = lessons.map(l => l.id);
    const completionRates = await calculateBulkCompletionRates(prisma, lessonIds);

    // Transform lessons data
    const transformedLessons: LessonWithMetadata[] = lessons.map(lesson => {
      const userProgress = lesson.progress?.[0];
      const isBookmarked = lesson.bookmarks && lesson.bookmarks.length > 0;

      return {
        id: lesson.id,
        lessonNumber: lesson.lessonNumber,
        title: lesson.title,
        description: lesson.description,
        estimatedTime: lesson.estimatedTime,
        difficultyLevel: lesson.difficultyLevel,
        tools: lesson.tools,
        isFree: lesson.isFree,
        createdAt: lesson.createdAt,
        updatedAt: lesson.updatedAt,
        categories: lesson.categories.map(cat => ({
          id: cat.category.id,
          name: cat.category.name,
          color: cat.category.color,
          icon: cat.category.icon,
        })),
        progress: userProgress ? {
          status: userProgress.status,
          progressPercentage: userProgress.progressPercentage,
          completedAt: userProgress.completedAt,
        } : undefined,
        isBookmarked: isBookmarked || false,
        popularity: lesson._count.interactions,
        completionRate: completionRates.get(lesson.id) || 0,
        previewContent: lesson.description ?
          lesson.description.substring(0, 200) + (lesson.description.length > 200 ? '...' : '') : '',
      };
    });

    // Fetch metadata for filters (if requested)
    let filterMetadata: SearchResponse['filters'] = {
      availableDifficulties: [],
      availableTools: [],
      availableCategories: [],
      durationRange: { min: 0, max: 120 },
    };
    if (includeMetadata === 'true') {
      const [difficulties, toolsList, categoriesList, durationStats] = await Promise.all([
        // Get available difficulties
        prisma.lesson.findMany({
          where: { isPublished: true },
          select: { difficultyLevel: true },
          distinct: ['difficultyLevel'],
        }),
        
        // Get available tools
        prisma.lesson.findMany({
          where: { isPublished: true },
          select: { tools: true },
        }),
        
        // Get available categories
        prisma.lessonCategory.findMany({
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
          orderBy: { order: 'asc' },
        }),
        
        // Get duration range
        prisma.lesson.aggregate({
          where: { 
            isPublished: true,
            estimatedTime: { not: null }
          },
          _min: { estimatedTime: true },
          _max: { estimatedTime: true },
        }),
      ]);

      // Process tools list (flatten and deduplicate)
      const allTools = toolsList.flatMap(lesson => lesson.tools);
      const uniqueTools = [...new Set(allTools)].sort();

      filterMetadata = {
        availableDifficulties: difficulties
          .map(d => d.difficultyLevel)
          .filter((level): level is string => Boolean(level))
          .sort(),
        availableTools: uniqueTools,
        availableCategories: categoriesList,
        durationRange: {
          min: durationStats._min.estimatedTime || 0,
          max: durationStats._max.estimatedTime || 120,
        },
      };
    }

    // Track search interaction if user is logged in and search was performed
    if (userId && search) {
      try {
        await prisma.lessonInteraction.create({
          data: {
            userId,
            lessonId: transformedLessons[0]?.id || '', // Use first result or empty
            interactionType: 'search',
            metadata: {
              searchQuery: search,
              resultsCount: totalCount,
              filters: { difficulty, tools, categories, minDuration, maxDuration },
            },
          },
        });
      } catch (error) {
        // Don't fail the request if interaction tracking fails
        appLogger.errors.apiError('lessons-search', error as Error, {
          context: 'interaction_tracking',
          userId,
          search,
        });
      }
    }

    const response: SearchResponse = {
      lessons: transformedLessons,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
      filters: filterMetadata,
    };

    return NextResponse.json(response);

  } catch (error) {
    appLogger.errors.apiError('lessons-search', error as Error, {
      context: 'search_lessons',
      url: request.url,
    });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to search lessons', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}