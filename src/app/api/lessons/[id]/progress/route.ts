import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth-helpers';
import { PrismaClient } from '@prisma/client';
import { achievementSystem } from '@/lib/achievement-system';
import { certificationEngine } from '@/lib/certification-engine';
import { appLogger } from '@/lib/logger';
import { invalidateLessonCompletionCache, invalidateUserCompletionCache } from '@/lib/analytics/completion-rate';
import { 
  UserProgressWithLesson, 
  UpdateProgressRequest, 
  ProgressResponse, 
  ProgressUpdateData,
  ApiErrorResponse, 
  IdRouteParams 
} from '@/types/api';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// GET /api/lessons/[id]/progress - Get lesson progress for current user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<IdRouteParams> }
): Promise<NextResponse<UserProgressWithLesson | ApiErrorResponse>> {
  let resolvedParams: IdRouteParams | null = null;
  try {
    const user = await requireAuth();
    const userId = user.userId;
    resolvedParams = await params;

    const progress = await prisma.userProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: userId,
          lessonId: resolvedParams.id,
        },
      },
      include: {
        lesson: {
          select: {
            title: true,
            estimatedTime: true,
          },
        },
      },
    });

    if (!progress) {
      // Create initial progress record if it doesn't exist
      const newProgress = await prisma.userProgress.create({
        data: {
          userId: userId,
          lessonId: resolvedParams.id,
          status: 'not_started',
          progressPercentage: 0,
          timeSpentMinutes: 0,
        },
        include: {
          lesson: {
            select: {
              title: true,
              estimatedTime: true,
            },
          },
        },
      });
      
      return NextResponse.json(newProgress);
    }

    return NextResponse.json(progress);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    appLogger.errors.apiError('lessons/[id]/progress', error as Error, {
      context: 'fetch_lesson_progress',
      lessonId: resolvedParams?.id,
    });
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lesson progress' },
      { status: 500 }
    );
  }
}

// PUT /api/lessons/[id]/progress - Update lesson progress
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<IdRouteParams> }
): Promise<NextResponse<ProgressResponse | ApiErrorResponse>> {
  let resolvedParams: IdRouteParams | null = null;
  try {
    const user = await requireAuth();
    const userId = user.userId;
    resolvedParams = await params;

    const body = await request.json() as UpdateProgressRequest;
    const { 
      progressPercentage, 
      timeSpentMinutes, 
      status,
      completedAt 
    } = body;

    const updateData: ProgressUpdateData = {
      lastAccessed: new Date(),
    };

    if (progressPercentage !== undefined) {
      updateData.progressPercentage = Math.max(0, Math.min(100, progressPercentage));
    }

    if (timeSpentMinutes !== undefined) {
      updateData.timeSpentMinutes = timeSpentMinutes;
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    if (completedAt !== undefined) {
      updateData.completedAt = completedAt ? new Date(completedAt) : null;
    }

    // Auto-update status based on progress
    if (progressPercentage >= 100 && status !== 'completed') {
      updateData.status = 'completed';
      updateData.completedAt = new Date();
    } else if (progressPercentage > 0 && status === 'not_started') {
      updateData.status = 'in_progress';
    }

    const progress = await prisma.userProgress.upsert({
      where: {
        userId_lessonId: {
          userId: userId,
          lessonId: resolvedParams.id,
        },
      },
      update: updateData,
      create: {
        userId: userId,
        lessonId: resolvedParams.id,
        ...updateData,
        status: updateData.status || 'in_progress',
        progressPercentage: updateData.progressPercentage || 0,
        timeSpentMinutes: updateData.timeSpentMinutes || 0,
      },
      include: {
        lesson: {
          select: {
            title: true,
            estimatedTime: true,
          },
        },
      },
    });

    // Invalidate completion rate caches
    await invalidateLessonCompletionCache(resolvedParams.id);
    await invalidateUserCompletionCache(userId);

    // Trigger achievement and certification checks if lesson was completed
    let newAchievements: string[] = [];
    let newCertifications: string[] = [];

    if (updateData.status === 'completed' || (updateData.progressPercentage >= 100)) {
      try {
        // Process achievement activity for lesson completion
        newAchievements = await achievementSystem.processUserActivity(
          userId,
          {
            lessonCompleted: true,
            timeSpent: updateData.timeSpentMinutes || 0,
            date: new Date(),
          }
        );

        // Check for new certifications
        newCertifications = await certificationEngine.autoAwardEligibleCertifications(
          userId
        );
      } catch (error) {
        appLogger.errors.apiError('lessons/[id]/progress', error as Error, {
          context: 'process_achievements_certifications',
          lessonId: resolvedParams?.id,
          userId: userId
        });
        // Don't fail the progress update if achievement processing fails
      }
    }

    return NextResponse.json({
      ...progress,
      newAchievements,
      newCertifications,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    appLogger.errors.apiError('lessons/[id]/progress', error as Error, {
      context: 'update_lesson_progress',
      lessonId: resolvedParams?.id,
    });
    return NextResponse.json(
      { success: false, error: 'Failed to update lesson progress' },
      { status: 500 }
    );
  }
}