import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { appLogger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase-auth-middleware';
import { z } from 'zod';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

// GET /api/lessons/[id] - Get a specific lesson
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;

    // Validate lesson ID (CUID format from Prisma)
    const lessonIdSchema = z.string().cuid();
    const lessonId = lessonIdSchema.parse(resolvedParams.id);
    
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        learningPaths: {
          include: {
            learningPath: {
              select: {
                id: true,
                name: true,
                description: true,
                color: true,
                icon: true,
                difficultyLevel: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
        exercises: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            progress: true,
            notes: true,
            bookmarks: true,
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(lesson);
  } catch (error) {
    appLogger.errors.apiError('lesson-fetch', error as Error, {
      endpoint: '/api/lessons/[id]'
    });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid lesson ID format', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch lesson' },
      { status: 500 }
    );
  }
}

// PUT /api/lessons/[id] - Update a specific lesson
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(); // Only admin can update lessons
    
    const resolvedParams = await params;

    // Validate lesson ID and update data
    const lessonIdSchema = z.string().cuid();
    const updateLessonSchema = z.object({
      title: z.string().min(1).optional(),
      description: z.string().min(1).optional(),
      content: z.string().min(1).optional(),
      videoUrl: z.string().url().optional(),
      videoDuration: z.number().optional(),
      estimatedTime: z.number().min(1).optional(),
      difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
      tools: z.array(z.string()).optional(),
      isPublished: z.boolean().optional(),
      isFree: z.boolean().optional()
    });
    
    const lessonId = lessonIdSchema.parse(resolvedParams.id);
    const body = await request.json();
    const validatedData = updateLessonSchema.parse(body);
    
    const lesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: validatedData,
    });

    return NextResponse.json(lesson);
  } catch (error) {
    appLogger.errors.apiError('lesson-update', error as Error, {
      endpoint: '/api/lessons/[id]'
    });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update lesson' },
      { status: 500 }
    );
  }
}

// DELETE /api/lessons/[id] - Delete a specific lesson
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(); // Only admin can delete lessons

    const resolvedParams = await params;

    // Validate lesson ID (CUID format from Prisma)
    const lessonIdSchema = z.string().cuid();
    const lessonId = lessonIdSchema.parse(resolvedParams.id);
    
    await prisma.lesson.delete({
      where: { id: lessonId },
    });

    return NextResponse.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    appLogger.errors.apiError('lesson-delete', error as Error, {
      endpoint: '/api/lessons/[id]'
    });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid lesson ID format', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete lesson' },
      { status: 500 }
    );
  }
}