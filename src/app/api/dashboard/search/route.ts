import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-auth-middleware';
import { prisma } from '@/lib/prisma';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(_request.url);
    const query = searchParams.get('q');
    const userId = user.id;

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    // Search lessons
    const lessons = await prisma.lesson.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { tools: { hasSome: [query] } },
        ]
      },
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
          },
          take: 1
        },
        progress: {
          where: { userId },
          select: {
            status: true,
            progressPercentage: true,
            completedAt: true,
          }
        }
      },
      orderBy: { lessonNumber: 'asc' },
      take: 20
    });

    // Search learning paths
    const learningPaths = await prisma.learningPath.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { targetAudience: { contains: query, mode: 'insensitive' } },
        ]
      },
      select: {
        id: true,
        name: true,
        description: true,
        difficultyLevel: true,
        color: true,
        estimatedHours: true,
        lessons: {
          select: {
            lesson: {
              select: {
                progress: {
                  where: { userId },
                  select: {
                    status: true,
                  }
                }
              }
            }
          }
        }
      },
      take: 10
    });

    // Format results
    const lessonResults = lessons.map(lesson => ({
      type: 'lesson' as const,
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      lessonNumber: lesson.lessonNumber,
      estimatedTime: lesson.estimatedTime,
      difficultyLevel: lesson.difficultyLevel,
      tools: lesson.tools,
      learningPath: lesson.learningPaths[0]?.learningPath || null,
      progress: lesson.progress[0] || null,
    }));

    const pathResults = learningPaths.map(path => {
      const completedLessons = path.lessons.filter(pl => 
        pl.lesson.progress[0]?.status === 'completed'
      ).length;
      
      return {
        type: 'learning_path' as const,
        id: path.id,
        title: path.name,
        description: path.description,
        difficultyLevel: path.difficultyLevel,
        color: path.color,
        estimatedHours: path.estimatedHours,
        totalLessons: path.lessons.length,
        completedLessons,
        completionPercentage: path.lessons.length > 0 
          ? Math.round((completedLessons / path.lessons.length) * 100) 
          : 0,
      };
    });

    const results = [
      ...lessonResults,
      ...pathResults,
    ].sort((a, b) => {
      // Prioritize exact matches in title
      const aExact = a.title.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
      const bExact = b.title.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
      return bExact - aExact;
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching content:', error);
    return NextResponse.json(
      { error: 'Failed to search content' },
      { status: 500 }
    );
  }
}