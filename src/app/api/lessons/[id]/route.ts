import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/lessons/[id] - Get a specific lesson
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const lesson = await prisma.lesson.findUnique({
      where: { id: resolvedParams.id },
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
    console.error('Error fetching lesson:', error);
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
    const body = await request.json();
    
    const resolvedParams = await params;
    
    const lesson = await prisma.lesson.update({
      where: { id: resolvedParams.id },
      data: {
        title: body.title,
        description: body.description,
        content: body.content,
        videoUrl: body.videoUrl,
        videoDuration: body.videoDuration,
        estimatedTime: body.estimatedTime,
        difficultyLevel: body.difficultyLevel,
        tools: body.tools,
        isPublished: body.isPublished,
        isFree: body.isFree,
      },
    });

    return NextResponse.json(lesson);
  } catch (error) {
    console.error('Error updating lesson:', error);
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
    const resolvedParams = await params;
    await prisma.lesson.delete({
      where: { id: resolvedParams.id },
    });

    return NextResponse.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return NextResponse.json(
      { error: 'Failed to delete lesson' },
      { status: 500 }
    );
  }
}