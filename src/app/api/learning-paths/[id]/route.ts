import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// GET /api/learning-paths/[id] - Get a specific learning path
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const learningPath = await prisma.learningPath.findUnique({
      where: { id: resolvedParams.id },
      include: {
        lessons: {
          include: {
            lesson: {
              include: {
                exercises: {
                  select: {
                    id: true,
                    type: true,
                    title: true,
                    pointsPossible: true,
                    isRequired: true,
                  },
                },
                _count: {
                  select: {
                    progress: true,
                  },
                },
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!learningPath) {
      return NextResponse.json(
        { error: 'Learning path not found' },
        { status: 404 }
      );
    }

    // Calculate additional metrics
    const lessons = learningPath.lessons.map((pl) => pl.lesson);
    const totalEstimatedTime = lessons.reduce((sum, lesson) => sum + (lesson.estimatedTime || 0), 0);
    const totalExercises = lessons.reduce((sum, lesson) => sum + lesson.exercises.length, 0);

    const enrichedPath = {
      ...learningPath,
      stats: {
        totalLessons: lessons.length,
        totalEstimatedTime,
        totalExercises,
        averageDifficulty: calculateAverageDifficulty(lessons),
      },
    };

    return NextResponse.json(enrichedPath);
  } catch (error) {
    console.error('Error fetching learning path:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learning path' },
      { status: 500 }
    );
  }
}

// PUT /api/learning-paths/[id] - Update a specific learning path
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    
    const resolvedParams = await params;
    const learningPath = await prisma.learningPath.update({
      where: { id: resolvedParams.id },
      data: {
        name: body.name,
        description: body.description,
        targetAudience: body.targetAudience,
        estimatedHours: body.estimatedHours,
        difficultyLevel: body.difficultyLevel,
        color: body.color,
        icon: body.icon,
        order: body.order,
        isActive: body.isActive,
      },
    });

    return NextResponse.json(learningPath);
  } catch (error) {
    console.error('Error updating learning path:', error);
    return NextResponse.json(
      { error: 'Failed to update learning path' },
      { status: 500 }
    );
  }
}

// DELETE /api/learning-paths/[id] - Delete a specific learning path
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    await prisma.learningPath.delete({
      where: { id: resolvedParams.id },
    });

    return NextResponse.json({ message: 'Learning path deleted successfully' });
  } catch (error) {
    console.error('Error deleting learning path:', error);
    return NextResponse.json(
      { error: 'Failed to delete learning path' },
      { status: 500 }
    );
  }
}

// Helper function to calculate average difficulty
function calculateAverageDifficulty(lessons: any[]): string {
  const difficultyValues = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
  const reverseDifficulty = { 1: 'beginner', 2: 'intermediate', 3: 'advanced', 4: 'expert' };
  
  const totalDifficulty = lessons.reduce((sum, lesson) => {
    const difficulty = lesson.difficultyLevel || 'beginner';
    return sum + (difficultyValues[difficulty as keyof typeof difficultyValues] || 1);
  }, 0);
  
  const averageValue = Math.round(totalDifficulty / lessons.length);
  return reverseDifficulty[averageValue as keyof typeof reverseDifficulty] || 'beginner';
}