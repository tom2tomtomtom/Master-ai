import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-auth-middleware';
import { certificationEngine } from '@/lib/certification-engine';

// GET /api/certifications/check - Check user eligibility for certifications

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
    const certificationId = searchParams.get('certificationId');

    if (certificationId) {
      // Check specific certification
      const eligibility = await certificationEngine.checkEligibility(
        user.id,
        certificationId
      );

      return NextResponse.json({
        certificationId,
        ...eligibility,
      });
    } else {
      // Check all certifications
      const eligibilities = await certificationEngine.checkAllEligibilities(
        user.id
      );

      return NextResponse.json(eligibilities);
    }
  } catch (error) {
    console.error('Error checking certification eligibility:', error);
    return NextResponse.json(
      { error: 'Failed to check certification eligibility' },
      { status: 500 }
    );
  }
}

// POST /api/certifications/check - Trigger automatic certification awarding
export async function POST(_request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Auto-award eligible certifications
    const awardedCertifications = await certificationEngine.autoAwardEligibleCertifications(
      user.id
    );

    return NextResponse.json({
      success: true,
      awarded: awardedCertifications,
      count: awardedCertifications.length,
    });
  } catch (error) {
    console.error('Error in auto-award process:', error);
    return NextResponse.json(
      { error: 'Failed to process certification awards' },
      { status: 500 }
    );
  }
}