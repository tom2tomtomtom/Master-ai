import { NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { appLogger } from '@/lib/logger';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireAuth();
    const userId = user.userId;

    const bookmarks = await prisma.lessonBookmark.findMany({
      where: { userId },
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
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedBookmarks = bookmarks.map(bookmark => ({
      id: bookmark.id,
      title: bookmark.title,
      timestamp: bookmark.timestamp,
      createdAt: bookmark.createdAt,
      lesson: {
        ...bookmark.lesson,
        learningPath: bookmark.lesson.learningPaths[0]?.learningPath || null,
        progress: bookmark.lesson.progress[0] || null,
      }
    }));

    return NextResponse.json(formattedBookmarks);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    appLogger.error('Error fetching bookmarks', { error });
    return NextResponse.json(
      { error: 'Failed to fetch bookmarks' },
      { status: 500 }
    );
  }
}