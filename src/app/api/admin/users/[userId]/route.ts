import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminAction, handleAuthError } from '@/lib/supabase-auth-middleware';
import { prisma } from '@/lib/prisma';
import { appLogger } from '@/lib/logger';
import { z } from 'zod';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

// GET /api/admin/users/[userId] - Get detailed user information (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdmin();
    const resolvedParams = await params;
    
    // Validate userId parameter
    const userIdSchema = z.string().uuid();
    const targetUserId = userIdSchema.parse(resolvedParams.userId);

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        trialEndsAt: true,
        // Include detailed statistics
        stats: {
          select: {
            totalLessonsCompleted: true,
            totalTimeSpentMinutes: true,
            currentStreak: true,
            longestStreak: true,
            lastActivityDate: true,
            totalNotesCreated: true,
            totalBookmarksCreated: true,
            averageScorePercent: true,
            totalPointsEarned: true
          }
        },
        // Count relationships
        _count: {
          select: {
            progress: true,
            certifications: { where: { isRevoked: false } },
            achievements: true,
            submissions: true,
            notes: true,
            bookmarks: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get recent activity
    const recentProgress = await prisma.userProgress.findMany({
      where: { userId: targetUserId },
      include: {
        lesson: {
          select: { title: true, lessonNumber: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
    });

    const recentCertifications = await prisma.userCertification.findMany({
      where: { userId: targetUserId, isRevoked: false },
      include: {
        certification: {
          select: { name: true, type: true, category: true }
        }
      },
      orderBy: { earnedAt: 'desc' },
      take: 5
    });

    return NextResponse.json({
      user,
      activity: {
        recentProgress,
        recentCertifications
      }
    });

  } catch (error) {
    appLogger.errors.apiError('admin-user-details', error as Error, {
      endpoint: '/api/admin/users/[userId]',
      method: 'GET'
    });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid user ID format', details: error.issues },
        { status: 400 }
      );
    }
    
    const authResponse = handleAuthError(error);
    if (authResponse) {
      return authResponse;
    }

    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[userId] - Soft delete user (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const adminUser = await requireAdmin();
    const resolvedParams = await params;
    
    // Validate userId parameter
    const userIdSchema = z.string().uuid();
    const targetUserId = userIdSchema.parse(resolvedParams.userId);

    // Cannot delete own account
    if (targetUserId === adminUser.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 403 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, email: true, role: true }
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // For now, we'll implement this as deactivation rather than deletion
    // In a real system, you might want to anonymize or archive the data
    const deleteSchema = z.object({
      reason: z.string().optional()
    });
    
    const body = await request.json();
    const { reason } = deleteSchema.parse(body);

    // Log admin action
    await logAdminAction(adminUser, 'DEACTIVATE_USER', {
      targetUserId,
      targetUserEmail: targetUser.email,
      targetUserRole: targetUser.role,
      reason: reason || 'No reason provided'
    });

    // Note: This is a placeholder - implement your actual deactivation logic
    // You might want to:
    // 1. Cancel subscriptions
    // 2. Revoke certifications
    // 3. Mark user as inactive
    // 4. Clear sensitive data
    
    return NextResponse.json({
      success: true,
      message: 'User deactivation logged. Implement actual deactivation logic.',
      warning: 'This is a placeholder - no actual deactivation was performed'
    });

  } catch (error) {
    appLogger.errors.apiError('admin-user-delete', error as Error, {
      endpoint: '/api/admin/users/[userId]',
      method: 'DELETE'
    });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.issues },
        { status: 400 }
      );
    }
    
    const authResponse = handleAuthError(error);
    if (authResponse) {
      return authResponse;
    }

    return NextResponse.json(
      { error: 'Failed to deactivate user' },
      { status: 500 }
    );
  }
}