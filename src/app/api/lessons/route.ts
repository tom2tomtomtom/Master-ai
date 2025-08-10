import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// GET /api/lessons - Get all lessons with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const difficulty = searchParams.get('difficulty');
    const tool = searchParams.get('tool');
    const search = searchParams.get('search');
    const learningPathId = searchParams.get('learningPathId');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
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
      where.learningPaths = {
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
    console.error('Error fetching lessons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lessons' },
      { status: 500 }
    );
  }
}

// POST /api/lessons - Create a new lesson
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const lesson = await prisma.lesson.create({
      data: {
        lessonNumber: body.lessonNumber,
        title: body.title,
        description: body.description,
        content: body.content,
        videoUrl: body.videoUrl,
        videoDuration: body.videoDuration,
        estimatedTime: body.estimatedTime,
        difficultyLevel: body.difficultyLevel,
        tools: body.tools || [],
        isPublished: body.isPublished ?? false,
        isFree: body.isFree ?? false,
      },
    });

    return NextResponse.json(lesson, { status: 201 });
  } catch (error) {
    console.error('Error creating lesson:', error);
    return NextResponse.json(
      { error: 'Failed to create lesson' },
      { status: 500 }
    );
  }
}