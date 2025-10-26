import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth-helpers';
import { PrismaClient } from '@prisma/client';
import { achievementSystem } from '@/lib/achievement-system';
import { appLogger } from '@/lib/logger';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// GET /api/lessons/[id]/bookmark - Get bookmark for a lesson
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const resolvedParams = await params;

    const bookmark = await prisma.lessonBookmark.findUnique({
      where: {
        userId_lessonId: {
          userId: user.userId,
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
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    appLogger.error('Error fetching lesson bookmark', { error });
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
    const user = await requireAuth();
    const body = await request.json();
    const { title, timestamp } = body;
    const resolvedParams = await params;

    // Check if this is a new bookmark creation
    const existingBookmark = await prisma.lessonBookmark.findUnique({
      where: {
        userId_lessonId: {
          userId: user.userId,
          lessonId: resolvedParams.id,
        },
      },
    });

    const isNewBookmark = !existingBookmark;

    const bookmark = await prisma.lessonBookmark.upsert({
      where: {
        userId_lessonId: {
          userId: user.userId,
          lessonId: resolvedParams.id,
        },
      },
      update: {
        title: title || null,
        timestamp: timestamp || null,
      },
      create: {
        userId: user.userId,
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
          user.userId,
          {
            bookmarkCreated: true,
            date: new Date(),
          }
        );
      } catch (error) {
        appLogger.error('Error processing bookmark achievement', { error });
      }
    }

    return NextResponse.json({
      ...bookmark,
      newAchievements,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    appLogger.error('Error creating/updating lesson bookmark', { error });
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
    const user = await requireAuth();
    const resolvedParams = await params;

    const bookmark = await prisma.lessonBookmark.findUnique({
      where: {
        userId_lessonId: {
          userId: user.userId,
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
          userId: user.userId,
          lessonId: resolvedParams.id,
        },
      },
    });

    return NextResponse.json({ message: 'Bookmark deleted successfully' });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    appLogger.error('Error deleting lesson bookmark', { error });
    return NextResponse.json(
      { error: 'Failed to delete lesson bookmark' },
      { status: 500 }
    );
  }
}