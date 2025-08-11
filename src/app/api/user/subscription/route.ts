import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, handleAuthError } from '@/lib/supabase-auth-middleware';
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
    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    
    if (!authResult.success) {
      appLogger.security.unauthorizedAccess('/api/user/subscription', null, requestMeta);
      return handleAuthError(authResult.error);
    }

    const { user: supabaseUser } = authResult;

    // Get user subscription data from database
    const user = await prisma.user.findUnique({
      where: { 
        email: supabaseUser.email 
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
        supabaseUserId: supabaseUser.id,
        email: supabaseUser.email,
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
    appLogger.errors.apiError('/api/user/subscription', error as Error, requestMeta);
    
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}