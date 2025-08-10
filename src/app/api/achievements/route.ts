import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-auth-middleware';
import { achievementSystem } from '@/lib/achievement-system';

// GET /api/achievements - Get available achievements and user progress

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const earnedOnly = searchParams.get('earnedOnly') === 'true';

    if (earnedOnly) {
      // Get only earned achievements
      const userAchievements = await achievementSystem.getUserAchievements(
        user.id,
        category || undefined
      );

      return NextResponse.json(userAchievements);
    } else {
      // Get all achievements with progress
      const achievementProgress = await achievementSystem.getUserAchievementProgress(
        user.id
      );

      // Filter by category if specified
      const filteredProgress = category
        ? achievementProgress.filter(ap => ap.category === category)
        : achievementProgress;

      return NextResponse.json(filteredProgress);
    }
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
}

// POST /api/achievements - Process user activity for achievements
export async function POST(request: NextRequest) {
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
      lessonCompleted, 
      noteCreated, 
      bookmarkCreated, 
      timeSpent,
      date = new Date()
    } = body;

    // Process the user activity
    const newAchievements = await achievementSystem.processUserActivity(
      user.id,
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
        user.id
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
    console.error('Error processing user activity:', error);
    return NextResponse.json(
      { error: 'Failed to process user activity' },
      { status: 500 }
    );
  }
}