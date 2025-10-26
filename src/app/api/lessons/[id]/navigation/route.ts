import { NextRequest, NextResponse } from 'next/server';
import { appLogger } from '@/lib/logger';
import { PrismaClient } from '@prisma/client';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// GET /api/lessons/[id]/navigation - Get previous and next lessons within learning paths
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const pathId = searchParams.get('pathId');

    const resolvedParams = await params;
    // Get current lesson with its learning path associations
    const currentLesson = await prisma.lesson.findUnique({
      where: { id: resolvedParams.id },
      include: {
        learningPaths: {
          include: {
            learningPath: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!currentLesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // If pathId is specified, use that path; otherwise use the first path
    const targetPathId = pathId || currentLesson.learningPaths[0]?.learningPathId;

    if (!targetPathId) {
      return NextResponse.json({
        currentLesson: {
          id: currentLesson.id,
          title: currentLesson.title,
          lessonNumber: currentLesson.lessonNumber,
        },
        previousLesson: null,
        nextLesson: null,
        learningPath: null,
      });
    }

    // Get current lesson's order within the specified learning path
    const currentPathLesson = currentLesson.learningPaths.find(
      (lp) => lp.learningPathId === targetPathId
    );

    if (!currentPathLesson) {
      return NextResponse.json(
        { error: 'Lesson not found in specified learning path' },
        { status: 404 }
      );
    }

    // Get all lessons in the learning path
    const pathLessons = await prisma.learningPathLesson.findMany({
      where: {
        learningPathId: targetPathId,
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            lessonNumber: true,
            description: true,
            estimatedTime: true,
            difficultyLevel: true,
            tools: true,
            isPublished: true,
            isFree: true,
          },
        },
        learningPath: {
          select: {
            id: true,
            name: true,
            description: true,
            color: true,
            icon: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    });

    const currentIndex = pathLessons.findIndex(
      (pl) => pl.lessonId === resolvedParams.id
    );

    const previousLesson = currentIndex > 0 
      ? pathLessons[currentIndex - 1].lesson 
      : null;

    const nextLesson = currentIndex < pathLessons.length - 1 
      ? pathLessons[currentIndex + 1].lesson 
      : null;

    const learningPath = pathLessons[0]?.learningPath || null;

    return NextResponse.json({
      currentLesson: {
        id: currentLesson.id,
        title: currentLesson.title,
        lessonNumber: currentLesson.lessonNumber,
        order: currentPathLesson.order,
      },
      previousLesson,
      nextLesson,
      learningPath,
      totalLessons: pathLessons.length,
      currentPosition: currentIndex + 1,
    });
  } catch (error) {
    appLogger.error('Error fetching lesson navigation', { error });
    return NextResponse.json(
      { error: 'Failed to fetch lesson navigation' },
      { status: 500 }
    );
  }
}