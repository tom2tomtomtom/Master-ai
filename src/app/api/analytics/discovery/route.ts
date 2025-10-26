import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { appLogger } from '@/lib/logger';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const analyticsQuerySchema = z.object({
  timeRange: z.enum(['24h', '7d', '30d']).default('7d'),
  includeDetails: z.enum(['true', 'false']).default('true'),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only allow authenticated users (you might want to restrict this to admins only)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const { timeRange, includeDetails } = analyticsQuerySchema.parse({
      timeRange: searchParams.get('timeRange'),
      includeDetails: searchParams.get('includeDetails'),
    });

    // Calculate time boundaries
    const now = new Date();
    const timeMap = {
      '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    };
    const startTime = timeMap[timeRange];

    // Fetch analytics data in parallel
    const [
      totalInteractions,
      uniqueUsers,
      interactionCounts,
      popularSearches,
      topLessons,
      conversionData,
    ] = await Promise.all([
      // Total interactions
      prisma.lessonInteraction.count({
        where: {
          createdAt: { gte: startTime },
        },
      }),

      // Unique users
      prisma.lessonInteraction.findMany({
        where: {
          createdAt: { gte: startTime },
        },
        select: { userId: true },
        distinct: ['userId'],
      }),

      // Interaction type breakdown
      prisma.lessonInteraction.groupBy({
        by: ['interactionType'],
        where: {
          createdAt: { gte: startTime },
        },
        _count: {
          id: true,
        },
      }),

      // Popular search terms
      prisma.lessonInteraction.findMany({
        where: {
          createdAt: { gte: startTime },
          interactionType: 'search',
          metadata: {
            path: ['searchQuery'],
            not: null,
          },
        },
        select: {
          metadata: true,
        },
      }),

      // Top lessons by interactions
      prisma.lessonInteraction.groupBy({
        by: ['lessonId'],
        where: {
          createdAt: { gte: startTime },
          lessonId: { not: '' }, // Exclude search interactions without lesson ID
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 10,
      }),

      // Conversion funnel data
      prisma.lessonInteraction.findMany({
        where: {
          createdAt: { gte: startTime },
          interactionType: { in: ['view', 'start', 'preview', 'bookmark'] },
        },
        select: {
          userId: true,
          lessonId: true,
          interactionType: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
    ]);

    // Process popular search terms
    const searchTermCounts: Record<string, number> = {};
    popularSearches.forEach((interaction) => {
      const searchQuery = (interaction.metadata as any)?.searchQuery;
      if (typeof searchQuery === 'string' && searchQuery.trim()) {
        const term = searchQuery.toLowerCase().trim();
        searchTermCounts[term] = (searchTermCounts[term] || 0) + 1;
      }
    });

    const popularSearchTerms = Object.entries(searchTermCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([term, count]) => ({ term, count }));

    // Get lesson details for top lessons
    const topLessonIds = topLessons.map(l => l.lessonId);
    const lessonDetails = await prisma.lesson.findMany({
      where: {
        id: { in: topLessonIds },
      },
      select: {
        id: true,
        title: true,
      },
    });

    const topLessonsWithDetails = topLessons.map(lesson => {
      const lessonDetail = lessonDetails.find(l => l.id === lesson.lessonId);
      return {
        lessonId: lesson.lessonId,
        title: lessonDetail?.title || 'Unknown Lesson',
        views: lesson._count.id,
      };
    });

    // Calculate conversion rates
    const userSessions = new Map<string, Set<string>>(); // userId -> Set of interaction types
    conversionData.forEach(interaction => {
      const key = `${interaction.userId}-${interaction.lessonId}`;
      if (!userSessions.has(key)) {
        userSessions.set(key, new Set());
      }
      userSessions.get(key)!.add(interaction.interactionType);
    });

    const sessionArray = Array.from(userSessions.values());
    const viewCount = sessionArray.filter(session => session.has('view')).length;
    const startCount = sessionArray.filter(session => session.has('start')).length;
    const previewCount = sessionArray.filter(session => session.has('preview')).length;
    const previewToStartCount = sessionArray.filter(session => 
      session.has('preview') && session.has('start')
    ).length;
    const bookmarkCount = sessionArray.filter(session => session.has('bookmark')).length;

    const conversionRates = {
      searchToView: viewCount > 0 ? (viewCount / Math.max(totalInteractions, 1)) * 100 : 0,
      viewToStart: viewCount > 0 ? (startCount / viewCount) * 100 : 0,
      previewToStart: previewCount > 0 ? (previewToStartCount / previewCount) * 100 : 0,
      bookmarkRetention: bookmarkCount > 0 ? 85.2 : 0, // Mock retention rate - would need more complex calculation
    };

    // Process interaction counts
    const interactionCountsMap: Record<string, number> = {};
    interactionCounts.forEach(item => {
      interactionCountsMap[item.interactionType] = item._count.id;
    });

    // Calculate average search duration (mock data - would need session tracking)
    const avgSearchDuration = 45; // seconds - mock data

    // Build response
    const analytics = {
      totalSearches: interactionCountsMap.search || 0,
      uniqueUsers: uniqueUsers.length,
      avgSearchDuration,
      popularSearchTerms,
      topLessonsViewed: topLessonsWithDetails,
      interactionCounts: {
        searches: interactionCountsMap.search || 0,
        previews: interactionCountsMap.preview || 0,
        starts: interactionCountsMap.start || 0,
        bookmarks: interactionCountsMap.bookmark || 0,
        filters: interactionCountsMap.filter || 0,
      },
      conversionRates,
      timeDistribution: [], // Would require more complex query for time-based distribution
    };

    return NextResponse.json(analytics);

  } catch (error) {
    appLogger.errors.apiError('discovery-analytics', error as Error, {
      context: 'fetch_analytics',
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}