import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { certificationEngine } from '@/lib/certification-engine';

// GET /api/certifications/check - Check user eligibility for certifications
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
    const certificationId = searchParams.get('certificationId');

    if (certificationId) {
      // Check specific certification
      const eligibility = await certificationEngine.checkEligibility(
        session.user.id,
        certificationId
      );

      return NextResponse.json({
        certificationId,
        ...eligibility,
      });
    } else {
      // Check all certifications
      const eligibilities = await certificationEngine.checkAllEligibilities(
        session.user.id
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
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Auto-award eligible certifications
    const awardedCertifications = await certificationEngine.autoAwardEligibleCertifications(
      session.user.id
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