import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { appLogger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase-auth-middleware';
import { z } from 'zod';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

// GET /api/lessons - Get all lessons with optional filtering
export async function GET(request: NextRequest) {
  try {
    // Validate query parameters
    const querySchema = z.object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(20),
      difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
      tool: z.string().optional(),
      search: z.string().optional(),
      learningPathId: z.string().uuid().optional()
    });
    
    const { searchParams } = new URL(request.url);
    const { page, limit, difficulty, tool, search, learningPathId } = querySchema.parse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      difficulty: searchParams.get('difficulty') || undefined,
      tool: searchParams.get('tool') || undefined,
      search: searchParams.get('search') || undefined,
      learningPathId: searchParams.get('learningPathId') || undefined
    });

    const skip = (page - 1) * limit;

    // Build where clause
    const where: {
      isPublished: boolean;
      difficultyLevel?: string;
      tools?: { hasEvery: string[] };
      OR?: Array<{
        title?: { contains: string; mode: 'insensitive' };
        description?: { contains: string; mode: 'insensitive' };
        content?: { contains: string; mode: 'insensitive' };
      }>;
      lessonLearningPaths?: { some: { learningPathId: string } };
    } = {
      isPublished: true,
    };

    if (difficulty) {
      where.difficultyLevel = difficulty;
    }

    if (tool) {
      where.tools = {
        has: tool,
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (learningPathId) {
      where.lessonLearningPaths = {
        some: {
          learningPathId: learningPathId,
        },
      };
    }

    const [lessons, total] = await Promise.all([
      prisma.lesson.findMany({
        where,
        include: {
          learningPaths: {
            include: {
              learningPath: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                  icon: true,
                },
              },
            },
          },
          _count: {
            select: {
              progress: true,
              exercises: true,
            },
          },
        },
        orderBy: { lessonNumber: 'asc' },
        skip,
        take: limit,
      }),
      prisma.lesson.count({ where }),
    ]);

    return NextResponse.json({
      lessons,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    appLogger.errors.apiError('lessons', error as Error, {
      context: 'fetch_lessons',
      searchParams: request ? Object.fromEntries(new URL(request.url).searchParams) : {}
    });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch lessons', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/lessons - Create a new lesson
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(); // Only admin can create lessons
    
    const createLessonSchema = z.object({
      lessonNumber: z.number().min(1),
      title: z.string().min(1),
      description: z.string().min(1),
      content: z.string().min(1),
      videoUrl: z.string().url().optional(),
      videoDuration: z.number().optional(),
      estimatedTime: z.number().min(1).optional(),
      difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']),
      tools: z.array(z.string()).default([]),
      isPublished: z.boolean().default(false),
      isFree: z.boolean().default(false)
    });
    
    const body = await request.json();
    const validatedData = createLessonSchema.parse(body);
    
    const lesson = await prisma.lesson.create({
      data: validatedData,
    });

    return NextResponse.json(lesson, { status: 201 });
  } catch (error) {
    appLogger.errors.apiError('lessons', error as Error, {
      context: 'create_lesson'
    });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid lesson data', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create lesson' },
      { status: 500 }
    );
  }
}