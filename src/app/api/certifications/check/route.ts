import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth-helpers';
import { certificationEngine } from '@/lib/certification-engine';
import { appLogger } from '@/lib/logger';

// GET /api/certifications/check - Check user eligibility for certifications

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const userId = user.userId;

    const { searchParams } = new URL(request.url);
    const certificationId = searchParams.get('certificationId');

    if (certificationId) {
      // Check specific certification
      const eligibility = await certificationEngine.checkEligibility(
        userId,
        certificationId
      );

      return NextResponse.json({
        certificationId,
        ...eligibility,
      });
    } else {
      // Check all certifications
      const eligibilities = await certificationEngine.checkAllEligibilities(
        userId
      );

      return NextResponse.json(eligibilities);
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    appLogger.error('Error checking certification eligibility', { error });
    return NextResponse.json(
      { error: 'Failed to check certification eligibility' },
      { status: 500 }
    );
  }
}

// POST /api/certifications/check - Trigger automatic certification awarding
export async function POST() {
  try {
    const user = await requireAuth();
    const userId = user.userId;

    // Auto-award eligible certifications
    const awardedCertifications = await certificationEngine.autoAwardEligibleCertifications(
      userId
    );

    return NextResponse.json({
      success: true,
      awarded: awardedCertifications,
      count: awardedCertifications.length,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    appLogger.error('Error in auto-award process', { error });
    return NextResponse.json(
      { error: 'Failed to process certification awards' },
      { status: 500 }
    );
  }
}