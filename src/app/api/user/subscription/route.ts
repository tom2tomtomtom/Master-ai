import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { appLogger, extractRequestMetadata } from '@/lib/logger';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

/**
 * GET /api/user/subscription - Get current user's subscription information
 */
export async function GET(request: NextRequest) {
  const requestMeta = extractRequestMetadata(request);

  try {
    const authUser = await requireAuth();
    const userId = authUser.userId;

    // Get user subscription data from database
    const user = await prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        id: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        role: true,
        updatedAt: true,
      },
    });

    if (!user) {
      appLogger.logError('User not found in database', {
        userId: userId,
        ...requestMeta
      });

      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 });
    }

    appLogger.info('User subscription data retrieved', {
      userId: user.id,
      subscriptionTier: user.subscriptionTier,
      subscriptionStatus: user.subscriptionStatus,
      ...requestMeta
    });

    return NextResponse.json({
      subscriptionTier: user.subscriptionTier,
      subscriptionStatus: user.subscriptionStatus,
      role: user.role,
      lastUpdated: user.updatedAt,
    });

  } catch (error) {
    if (error instanceof AuthError) {
      appLogger.security.unauthorizedAccess('/api/user/subscription', null, requestMeta);
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    appLogger.errors.apiError('/api/user/subscription', error as Error, requestMeta);

    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}