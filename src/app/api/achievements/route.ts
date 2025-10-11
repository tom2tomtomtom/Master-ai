import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth-helpers';
import { achievementSystem } from '@/lib/achievement-system';
import { appLogger } from '@/lib/logger';

// GET /api/achievements - Get available achievements and user progress

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const userId = user.userId;

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const earnedOnly = searchParams.get('earnedOnly') === 'true';

    if (earnedOnly) {
      // Get only earned achievements
      const userAchievements = await achievementSystem.getUserAchievements(
        userId,
        category || undefined
      );

      return NextResponse.json(userAchievements);
    } else {
      // Get all achievements with progress
      const achievementProgress = await achievementSystem.getUserAchievementProgress(
        userId
      );

      // Filter by category if specified
      const filteredProgress = category
        ? achievementProgress.filter(ap => ap.category === category)
        : achievementProgress;

      return NextResponse.json(filteredProgress);
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    appLogger.error('Error fetching achievements', { error });
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
}

// POST /api/achievements - Process user activity for achievements
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const userId = user.userId;

    const body = await request.json();
    const {
      lessonCompleted,
      noteCreated,
      bookmarkCreated,
      timeSpent,
      date = new Date()
    } = body;

    // Process the user activity
    const newAchievements = await achievementSystem.processUserActivity(
      userId,
      {
        lessonCompleted,
        noteCreated,
        bookmarkCreated,
        timeSpent,
        date: new Date(date),
      }
    );

    // Return the newly earned achievements
    if (newAchievements.length > 0) {
      const achievementDetails = await achievementSystem.getUserAchievements(
        userId
      );

      const newAchievementDetails = achievementDetails.filter(
        achievement => newAchievements.includes(achievement.achievementId)
      );

      return NextResponse.json({
        success: true,
        newAchievements: newAchievementDetails,
        count: newAchievements.length,
      });
    }

    return NextResponse.json({
      success: true,
      newAchievements: [],
      count: 0,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    appLogger.error('Error processing user activity', { error });
    return NextResponse.json(
      { error: 'Failed to process user activity' },
      { status: 500 }
    );
  }
}