import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { appLogger } from '@/lib/logger';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const interactionSchema = z.object({
  lessonId: z.string().cuid(),
  interactionType: z.enum(['view', 'start', 'complete', 'bookmark', 'search', 'preview', 'filter']),
  metadata: z.object({
    searchQuery: z.string().optional(),
    filterValues: z.record(z.any()).optional(),
    sessionId: z.string().optional(),
    source: z.string().optional(),
    duration: z.number().optional(), // For tracking time spent
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { lessonId, interactionType, metadata } = interactionSchema.parse(body);

    // Create the interaction record
    const interaction = await prisma.lessonInteraction.create({
      data: {
        userId: session.user.id,
        lessonId,
        interactionType,
        metadata: metadata || {},
        sessionId: metadata?.sessionId || null,
      },
    });

    // Update user progress if this is a meaningful interaction
    if (interactionType === 'start' || interactionType === 'complete') {
      await updateUserProgress(session.user.id, lessonId, interactionType, metadata?.duration);
    }

    // Handle bookmarking
    if (interactionType === 'bookmark') {
      await handleBookmarkInteraction(session.user.id, lessonId);
    }

    return NextResponse.json({ success: true, interactionId: interaction.id });

  } catch (error) {
    appLogger.errors.apiError('lesson-interaction', error as Error, {
      context: 'track_interaction',
    });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid interaction data', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to track interaction' },
      { status: 500 }
    );
  }
}

async function updateUserProgress(
  userId: string, 
  lessonId: string, 
  interactionType: string,
  duration?: number
) {
  try {
    const existingProgress = await prisma.userProgress.findUnique({
      where: {
        userId_lessonId: { userId, lessonId }
      }
    });

    if (interactionType === 'start') {
      if (!existingProgress) {
        await prisma.userProgress.create({
          data: {
            userId,
            lessonId,
            status: 'in_progress',
            progressPercentage: 1,
            timeSpentMinutes: Math.floor((duration || 0) / 60),
            lastAccessed: new Date(),
          },
        });
      } else if (existingProgress.status === 'not_started') {
        await prisma.userProgress.update({
          where: { id: existingProgress.id },
          data: {
            status: 'in_progress',
            progressPercentage: Math.max(existingProgress.progressPercentage, 1),
            lastAccessed: new Date(),
            timeSpentMinutes: existingProgress.timeSpentMinutes + Math.floor((duration || 0) / 60),
          },
        });
      }
    }

    if (interactionType === 'complete') {
      await prisma.userProgress.upsert({
        where: {
          userId_lessonId: { userId, lessonId }
        },
        create: {
          userId,
          lessonId,
          status: 'completed',
          progressPercentage: 100,
          timeSpentMinutes: Math.floor((duration || 0) / 60),
          completedAt: new Date(),
          lastAccessed: new Date(),
        },
        update: {
          status: 'completed',
          progressPercentage: 100,
          completedAt: new Date(),
          lastAccessed: new Date(),
          timeSpentMinutes: existingProgress ? 
            existingProgress.timeSpentMinutes + Math.floor((duration || 0) / 60) :
            Math.floor((duration || 0) / 60),
        },
      });

      // Update user stats
      await updateUserStats(userId);
    }
  } catch (error) {
    appLogger.errors.apiError('user-progress-update', error as Error, {
      context: 'update_progress',
      userId,
      lessonId,
      interactionType,
    });
  }
}

async function handleBookmarkInteraction(userId: string, lessonId: string) {
  try {
    const existingBookmark = await prisma.lessonBookmark.findUnique({
      where: {
        userId_lessonId: { userId, lessonId }
      }
    });

    if (existingBookmark) {
      // Remove bookmark
      await prisma.lessonBookmark.delete({
        where: { id: existingBookmark.id }
      });
    } else {
      // Add bookmark
      await prisma.lessonBookmark.create({
        data: {
          userId,
          lessonId,
          title: null, // Will be populated from lesson title
        },
      });
    }
  } catch (error) {
    appLogger.errors.apiError('bookmark-interaction', error as Error, {
      context: 'handle_bookmark',
      userId,
      lessonId,
    });
  }
}

async function updateUserStats(userId: string) {
  try {
    const stats = await prisma.userProgress.aggregate({
      where: {
        userId,
        status: 'completed',
      },
      _count: { id: true },
      _sum: { timeSpentMinutes: true },
    });

    await prisma.userStats.upsert({
      where: { userId },
      create: {
        userId,
        totalLessonsCompleted: stats._count.id,
        totalTimeSpentMinutes: stats._sum.timeSpentMinutes || 0,
        lastActivityDate: new Date(),
      },
      update: {
        totalLessonsCompleted: stats._count.id,
        totalTimeSpentMinutes: stats._sum.timeSpentMinutes || 0,
        lastActivityDate: new Date(),
      },
    });
  } catch (error) {
    appLogger.errors.apiError('user-stats-update', error as Error, {
      context: 'update_stats',
      userId,
    });
  }
}