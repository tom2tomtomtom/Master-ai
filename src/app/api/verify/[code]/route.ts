import { NextRequest, NextResponse } from 'next/server';
import { certificationEngine } from '@/lib/certification-engine';
import { monitoring } from '@/lib/monitoring';

// GET /api/verify/[code] - Verify a certification by verification code (public endpoint)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const resolvedParams = await params;
  const verificationCode = resolvedParams.code;
  
  try {

    if (!verificationCode) {
      return NextResponse.json(
        { error: 'Verification code required' },
        { status: 400 }
      );
    }

    // Verify the certification
    const verificationResult = await certificationEngine.verifyCertification(
      verificationCode
    );

    if (!verificationResult.isValid) {
      return NextResponse.json(
        { 
          isValid: false,
          error: 'Invalid or expired certificate',
        },
        { status: 404 }
      );
    }

    // Return verification details (safe public information only)
    return NextResponse.json({
      isValid: true,
      certification: {
        name: verificationResult.certification?.name,
        description: verificationResult.certification?.description,
        type: verificationResult.certification?.type,
        category: verificationResult.certification?.category,
      },
      recipient: {
        name: verificationResult.user?.name,
        // Email is intentionally omitted for privacy
      },
      issuedAt: verificationResult.earnedAt,
      expiresAt: verificationResult.expiresAt,
      isExpired: verificationResult.isExpired,
      issuer: {
        name: 'Master-AI',
        website: 'https://master-ai.com',
      },
    });
  } catch (error) {
    monitoring.logError('api_certificate_verification_error', error, {
      verificationCode: verificationCode
    });
    return NextResponse.json(
      { error: 'Failed to verify certificate' },
      { status: 500 }
    );
  }
}