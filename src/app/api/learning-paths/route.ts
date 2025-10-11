import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getOptionalAuth } from '@/lib/auth-helpers';
import { appLogger } from '@/lib/logger';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// GET /api/learning-paths - Get all learning paths
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('includeStats') === 'true';

    // Get authenticated user for completion rate calculation
    const authenticatedUser = includeStats ? await getOptionalAuth() : null;

    const learningPaths = await prisma.learningPath.findMany({
      where: { isActive: true },
      include: {
        lessons: {
          include: {
            lesson: {
              select: {
                id: true,
                lessonNumber: true,
                title: true,
                description: true,
                estimatedTime: true,
                difficultyLevel: true,
                tools: true,
                isFree: true,
                isPublished: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
        ...(includeStats && {
          _count: {
            select: {
              lessons: true,
            },
          },
        }),
      },
      orderBy: { order: 'asc' },
    });

    // Calculate additional stats if requested
    const enrichedPaths = await Promise.all(learningPaths.map(async (path) => {
      const lessons = path.lessons.map((pl) => pl.lesson);
      const totalEstimatedTime = lessons.reduce((sum, lesson) => sum + (lesson.estimatedTime || 0), 0);
      const publishedLessons = lessons.filter((lesson) => lesson.isPublished);
      const freeLessons = lessons.filter((lesson) => lesson.isFree);

      // Calculate completion rate for authenticated users
      let completionRate = 0;
      if (includeStats && authenticatedUser && publishedLessons.length > 0) {
        try {
          const userProgress = await prisma.userProgress.findMany({
            where: {
              userId: authenticatedUser.userId,
              lessonId: { in: publishedLessons.map(lesson => lesson.id) },
              status: 'completed'
            }
          });
          completionRate = Math.round((userProgress.length / publishedLessons.length) * 100);
        } catch (error) {
          appLogger.error(`Error calculating completion rate for path ${path.id}`, { error });
          // Keep completion rate as 0 on error
        }
      }

      return {
        ...path,
        stats: includeStats
          ? {
              totalLessons: lessons.length,
              publishedLessons: publishedLessons.length,
              freeLessons: freeLessons.length,
              totalEstimatedTime,
              completionRate,
            }
          : undefined,
      };
    }));

    return NextResponse.json(enrichedPaths);
  } catch (error) {
    appLogger.error('Error fetching learning paths', { error });
    return NextResponse.json(
      { error: 'Failed to fetch learning paths' },
      { status: 500 }
    );
  }
}

// POST /api/learning-paths - Create a new learning path
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const learningPath = await prisma.learningPath.create({
      data: {
        name: body.name,
        description: body.description,
        targetAudience: body.targetAudience,
        estimatedHours: body.estimatedHours,
        difficultyLevel: body.difficultyLevel,
        color: body.color || '#3B82F6',
        icon: body.icon || '📚',
        order: body.order || 0,
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json(learningPath, { status: 201 });
  } catch (error) {
    appLogger.error('Error creating learning path', { error });
    return NextResponse.json(
      { error: 'Failed to create learning path' },
      { status: 500 }
    );
  }
}