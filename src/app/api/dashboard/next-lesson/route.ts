import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's progress
    const userProgress = await prisma.userProgress.findMany({
      where: { userId },
      select: {
        lessonId: true,
        status: true,
        lastAccessed: true,
      }
    });

    // Create maps for quick lookup
    const progressMap = new Map(
      userProgress.map(p => [p.lessonId, p])
    );

    // Find next lesson to continue or start
    // Priority:
    // 1. Most recently accessed in-progress lesson
    // 2. First not-started lesson in order

    // Get all published lessons in order
    const allLessons = await prisma.lesson.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        lessonNumber: true,
        title: true,
        description: true,
        estimatedTime: true,
        difficultyLevel: true,
        tools: true,
        learningPaths: {
          include: {
            learningPath: {
              select: {
                id: true,
                name: true,
                color: true,
              }
            }
          }
        }
      },
      orderBy: { lessonNumber: 'asc' }
    });

    // Find the most recently accessed in-progress lesson
    const inProgressLessons = userProgress
      .filter(p => p.status === 'in_progress' && p.lastAccessed)
      .sort((a, b) => new Date(b.lastAccessed!).getTime() - new Date(a.lastAccessed!).getTime());

    let nextLesson = null;

    if (inProgressLessons.length > 0) {
      // Continue most recent in-progress lesson
      const recentProgressLessonId = inProgressLessons[0].lessonId;
      const lessonData = allLessons.find(l => l.id === recentProgressLessonId);
      
      if (lessonData) {
        nextLesson = {
          ...lessonData,
          recommendationType: 'continue' as const,
        };
      }
    }

    if (!nextLesson) {
      // Find first not-started lesson
      const notStartedLesson = allLessons.find(lesson => 
        !progressMap.has(lesson.id) || 
        progressMap.get(lesson.id)?.status === 'not_started'
      );

      if (notStartedLesson) {
        nextLesson = {
          ...notStartedLesson,
          recommendationType: 'start' as const,
        };
      }
    }

    if (!nextLesson) {
      // All lessons completed, suggest reviewing or additional content
      return NextResponse.json({
        message: 'Congratulations! You have completed all available lessons.',
        allCompleted: true
      });
    }

    // Get progress data for the recommended lesson
    const progress = progressMap.get(nextLesson.id);
    
    const response = {
      ...nextLesson,
      progress: progress ? {
        status: progress.status,
        lastAccessed: progress.lastAccessed,
      } : null,
      learningPath: nextLesson.learningPaths[0]?.learningPath || null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching next lesson:', error);
    return NextResponse.json(
      { error: 'Failed to fetch next lesson recommendation' },
      { status: 500 }
    );
  }
}