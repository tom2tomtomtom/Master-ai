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

    // Get learning paths with progress
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
                progress: {
                  where: { userId },
                  select: {
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
      },
      orderBy: { order: 'asc' }
    });

    // Calculate progress for each learning path
    const pathsWithProgress = learningPaths.map(path => {
      const lessons = path.lessons.map(pl => pl.lesson);
      const publishedLessons = lessons.filter(lesson => lesson.isPublished);
      
      const completedLessons = publishedLessons.filter(lesson => 
        lesson.progress[0]?.status === 'completed'
      ).length;
      
      const inProgressLessons = publishedLessons.filter(lesson => 
        lesson.progress[0]?.status === 'in_progress'
      ).length;

      const totalTimeSpent = publishedLessons.reduce((sum, lesson) => 
        sum + (lesson.progress[0]?.timeSpentMinutes || 0), 0
      );

      const totalEstimatedTime = publishedLessons.reduce((sum, lesson) => 
        sum + (lesson.estimatedTime || 0), 0
      );

      const completionPercentage = publishedLessons.length > 0 
        ? Math.round((completedLessons / publishedLessons.length) * 100) 
        : 0;

      const estimatedTimeRemaining = Math.max(0, totalEstimatedTime - totalTimeSpent);

      return {
        ...path,
        progress: {
          totalLessons: publishedLessons.length,
          completedLessons,
          inProgressLessons,
          completionPercentage,
          totalTimeSpent,
          estimatedTimeRemaining,
        }
      };
    });

    return NextResponse.json(pathsWithProgress);
  } catch (error) {
    console.error('Error fetching progress data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress data' },
      { status: 500 }
    );
  }
}