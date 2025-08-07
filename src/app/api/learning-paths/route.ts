import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/learning-paths - Get all learning paths
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('includeStats') === 'true';

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
    const enrichedPaths = learningPaths.map((path) => {
      const lessons = path.lessons.map((pl) => pl.lesson);
      const totalEstimatedTime = lessons.reduce((sum, lesson) => sum + (lesson.estimatedTime || 0), 0);
      const publishedLessons = lessons.filter((lesson) => lesson.isPublished);
      const freeLessons = lessons.filter((lesson) => lesson.isFree);

      return {
        ...path,
        stats: includeStats
          ? {
              totalLessons: lessons.length,
              publishedLessons: publishedLessons.length,
              freeLessons: freeLessons.length,
              totalEstimatedTime,
              completionRate: 0, // TODO: Calculate based on user progress
            }
          : undefined,
      };
    });

    return NextResponse.json(enrichedPaths);
  } catch (error) {
    console.error('Error fetching learning paths:', error);
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
    console.error('Error creating learning path:', error);
    return NextResponse.json(
      { error: 'Failed to create learning path' },
      { status: 500 }
    );
  }
}