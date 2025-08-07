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
    console.error('Error fetching bookmarks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookmarks' },
      { status: 500 }
    );
  }
}