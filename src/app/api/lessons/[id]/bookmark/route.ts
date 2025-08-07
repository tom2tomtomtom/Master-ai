import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { achievementSystem } from '@/lib/achievement-system';

const prisma = new PrismaClient();

// GET /api/lessons/[id]/bookmark - Get bookmark for a lesson
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const bookmark = await prisma.lessonBookmark.findUnique({
      where: {
        userId_lessonId: {
          userId: session.user.id,
          lessonId: resolvedParams.id,
        },
      },
      include: {
        lesson: {
          select: {
            title: true,
            lessonNumber: true,
          },
        },
      },
    });

    return NextResponse.json(bookmark);
  } catch (error) {
    console.error('Error fetching lesson bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lesson bookmark' },
      { status: 500 }
    );
  }
}

// POST /api/lessons/[id]/bookmark - Create or update a bookmark
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, timestamp } = body;

    const resolvedParams = await params;
    
    // Check if this is a new bookmark creation
    const existingBookmark = await prisma.lessonBookmark.findUnique({
      where: {
        userId_lessonId: {
          userId: session.user.id,
          lessonId: resolvedParams.id,
        },
      },
    });

    const isNewBookmark = !existingBookmark;

    const bookmark = await prisma.lessonBookmark.upsert({
      where: {
        userId_lessonId: {
          userId: session.user.id,
          lessonId: resolvedParams.id,
        },
      },
      update: {
        title: title || null,
        timestamp: timestamp || null,
      },
      create: {
        userId: session.user.id,
        lessonId: resolvedParams.id,
        title: title || null,
        timestamp: timestamp || null,
      },
      include: {
        lesson: {
          select: {
            title: true,
            lessonNumber: true,
          },
        },
      },
    });

    // Trigger achievement checking for new bookmark creation
    let newAchievements: string[] = [];
    if (isNewBookmark) {
      try {
        newAchievements = await achievementSystem.processUserActivity(
          session.user.id,
          {
            bookmarkCreated: true,
            date: new Date(),
          }
        );
      } catch (error) {
        console.error('Error processing bookmark achievement:', error);
      }
    }

    return NextResponse.json({
      ...bookmark,
      newAchievements,
    });
  } catch (error) {
    console.error('Error creating/updating lesson bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to create/update lesson bookmark' },
      { status: 500 }
    );
  }
}

// DELETE /api/lessons/[id]/bookmark - Delete a bookmark
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const bookmark = await prisma.lessonBookmark.findUnique({
      where: {
        userId_lessonId: {
          userId: session.user.id,
          lessonId: resolvedParams.id,
        },
      },
    });

    if (!bookmark) {
      return NextResponse.json(
        { error: 'Bookmark not found' },
        { status: 404 }
      );
    }

    await prisma.lessonBookmark.delete({
      where: {
        userId_lessonId: {
          userId: session.user.id,
          lessonId: resolvedParams.id,
        },
      },
    });

    return NextResponse.json({ message: 'Bookmark deleted successfully' });
  } catch (error) {
    console.error('Error deleting lesson bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to delete lesson bookmark' },
      { status: 500 }
    );
  }
}