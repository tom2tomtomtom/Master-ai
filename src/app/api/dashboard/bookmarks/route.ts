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

    const userId = user.id;

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