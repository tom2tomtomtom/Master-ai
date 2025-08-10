import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, handleAuthError } from '@/lib/supabase-auth-middleware';
import { PrismaClient } from '@prisma/client';
import { achievementSystem } from '@/lib/achievement-system';
import { certificationEngine } from '@/lib/certification-engine';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// GET /api/lessons/[id]/progress - Get lesson progress for current user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const progress = await prisma.userProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: user.id,
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
          userId: user.id,
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
    console.error('Error fetching lesson progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lesson progress' },
      { status: 500 }
    );
  }
}

// PUT /api/lessons/[id]/progress - Update lesson progress
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      progressPercentage, 
      timeSpentMinutes, 
      status,
      completedAt 
    } = body;

    const updateData: any = {
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

    const resolvedParams = await params;
    const progress = await prisma.userProgress.upsert({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId: resolvedParams.id,
        },
      },
      update: updateData,
      create: {
        userId: user.id,
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

    // Trigger achievement and certification checks if lesson was completed
    let newAchievements: string[] = [];
    let newCertifications: string[] = [];
    
    if (updateData.status === 'completed' || (updateData.progressPercentage >= 100)) {
      try {
        // Process achievement activity for lesson completion
        newAchievements = await achievementSystem.processUserActivity(
          user.id,
          {
            lessonCompleted: true,
            timeSpent: updateData.timeSpentMinutes || 0,
            date: new Date(),
          }
        );

        // Check for new certifications
        newCertifications = await certificationEngine.autoAwardEligibleCertifications(
          user.id
        );
      } catch (error) {
        console.error('Error processing achievements/certifications:', error);
        // Don't fail the progress update if achievement processing fails
      }
    }

    return NextResponse.json({
      ...progress,
      newAchievements,
      newCertifications,
    });
  } catch (error) {
    console.error('Error updating lesson progress:', error);
    return NextResponse.json(
      { error: 'Failed to update lesson progress' },
      { status: 500 }
    );
  }
}