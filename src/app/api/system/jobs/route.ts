import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminAction, handleAuthError } from '@/lib/auth-middleware';
import { backgroundJobSystem } from '@/lib/background-jobs';

// POST /api/system/jobs - Trigger background jobs (admin only)
export async function POST(request: NextRequest) {
  try {
    // Require admin access for triggering background jobs
    const session = await requireAdmin();

    const body = await request.json();
    const { jobType = 'daily' } = body;

    // Log admin action for audit purposes
    await logAdminAction(session, 'TRIGGER_BACKGROUND_JOBS', {
      jobType,
      timestamp: new Date().toISOString()
    });

    let result;

    switch (jobType) {
      case 'daily':
        result = await backgroundJobSystem.runDailyJobs();
        break;
      case 'stats':
        result = await backgroundJobSystem.updateUserStatistics();
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid job type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      jobType,
      triggeredBy: {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role
      },
      ...result,
    });

  } catch (error) {
    console.error('Error running background jobs:', error);
    
    // Handle authorization errors
    const authResponse = handleAuthError(error);
    if (authResponse) {
      return authResponse;
    }

    return NextResponse.json(
      { error: 'Failed to run background jobs' },
      { status: 500 }
    );
  }
}

// GET /api/system/jobs - Check job status (admin only)
export async function GET(_request: NextRequest) {
  try {
    // Require admin access for checking job status
    await requireAdmin();

    const isRunning = backgroundJobSystem.isJobsRunning();

    return NextResponse.json({
      isRunning,
      lastCheck: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error checking job status:', error);
    
    // Handle authorization errors
    const authResponse = handleAuthError(error);
    if (authResponse) {
      return authResponse;
    }

    return NextResponse.json(
      { error: 'Failed to check job status' },
      { status: 500 }
    );
  }
}