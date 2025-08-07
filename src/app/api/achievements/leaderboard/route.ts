import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { achievementSystem } from '@/lib/achievement-system';

// GET /api/achievements/leaderboard - Get achievement leaderboard
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const leaderboard = await achievementSystem.getAchievementLeaderboard(
      category || undefined,
      Math.min(limit, 100) // Cap at 100 to prevent abuse
    );

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('Error fetching achievement leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch achievement leaderboard' },
      { status: 500 }
    );
  }
}