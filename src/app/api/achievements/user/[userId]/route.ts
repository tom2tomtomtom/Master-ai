import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleAuthError, requireUserResourceAccess } from '@/lib/supabase-auth-middleware';
import { achievementSystem } from '@/lib/achievement-system';

// GET /api/achievements/user/[userId] - Get user's achievements

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const resolvedParams = await params;
    const targetUserId = resolvedParams.userId;

    // Verify user can access these achievements (own achievements or admin)
    await requireUserResourceAccess(targetUserId);

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const userAchievements = await achievementSystem.getUserAchievements(
      targetUserId,
      category || undefined
    );

    return NextResponse.json(userAchievements);
  } catch (error) {
    console.error('Error fetching user achievements:', error);
    
    // Handle authorization errors with proper responses
    const authResponse = handleAuthError(error);
    if (authResponse) {
      return authResponse;
    }

    return NextResponse.json(
      { error: 'Failed to fetch user achievements' },
      { status: 500 }
    );
  }
}