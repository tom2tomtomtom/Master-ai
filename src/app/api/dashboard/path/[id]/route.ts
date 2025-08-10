import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase-auth-middleware';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();

    const userId = user.id;
    const resolvedParams = await params;
    const pathId = resolvedParams.id;

    // Get learning path with lessons and user progress
    const learningPath = await prisma.learningPath.findUnique({
      where: { 
        id: pathId,
        isActive: true 
      },
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
                progress: {
                  where: { userId },
                  select: {
                    id: true,
                    status: true,
                    progressPercentage: true,
                    timeSpentMinutes: true,
                    lastAccessed: true,
                    completedAt: true,
                  }
                }
              }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!learningPath) {
      return NextResponse.json({ error: 'Learning path not found' }, { status: 404 });
    }

    // Calculate progress statistics
    const lessons = learningPath.lessons.map(pl => pl.lesson).filter(lesson => lesson.isPublished);
    
    const completedLessons = lessons.filter(lesson => 
      lesson.progress[0]?.status === 'completed'
    ).length;
    
    const inProgressLessons = lessons.filter(lesson => 
      lesson.progress[0]?.status === 'in_progress'
    ).length;

    const totalTimeSpent = lessons.reduce((sum, lesson) => 
      sum + (lesson.progress[0]?.timeSpentMinutes || 0), 0
    );

    const totalEstimatedTime = lessons.reduce((sum, lesson) => 
      sum + (lesson.estimatedTime || 0), 0
    );

    const completionPercentage = lessons.length > 0 
      ? Math.round((completedLessons / lessons.length) * 100) 
      : 0;

    // Find next lesson to continue or start
    let nextLessonId = null;
    
    // Look for first in-progress lesson
    const inProgressLesson = lessons.find(lesson => 
      lesson.progress[0]?.status === 'in_progress'
    );
    
    if (inProgressLesson) {
      nextLessonId = inProgressLesson.id;
    } else {
      // Look for first not-started lesson
      const notStartedLesson = lessons.find(lesson => 
        !lesson.progress[0] || lesson.progress[0].status === 'not_started'
      );
      if (notStartedLesson) {
        nextLessonId = notStartedLesson.id;
      }
    }

    const pathWithProgress = {
      ...learningPath,
      progress: {
        totalLessons: lessons.length,
        completedLessons,
        inProgressLessons,
        completionPercentage,
        totalTimeSpent,
        estimatedTimeRemaining: Math.max(0, totalEstimatedTime - totalTimeSpent),
        nextLessonId,
      }
    };

    return NextResponse.json(pathWithProgress);
  } catch (error) {
    console.error('Error fetching learning path:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learning path' },
      { status: 500 }
    );
  }
}