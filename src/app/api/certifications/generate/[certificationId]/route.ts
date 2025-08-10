import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase-auth-middleware';
import { certificateGenerator } from '@/lib/certificate-generator';
import { PrismaClient } from '@prisma/client';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// POST /api/certifications/generate/[certificationId] - Generate PDF certificate
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ certificationId: string }> }
) {
  try {
    const user = await requireAuth();

    const resolvedParams = await params;
    const userCertificationId = resolvedParams.certificationId;

    // Find the user certification
    const userCertification = await prisma.userCertification.findUnique({
      where: { id: userCertificationId },
      include: {
        user: true,
        certification: true,
      },
    });

    if (!userCertification) {
      return NextResponse.json(
        { error: 'Certification not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (userCertification.userId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if certificate is revoked
    if (userCertification.isRevoked) {
      return NextResponse.json(
        { error: 'Certificate has been revoked' },
        { status: 400 }
      );
    }

    // Check if certificate is expired
    if (userCertification.expiresAt && new Date() > userCertification.expiresAt) {
      return NextResponse.json(
        { error: 'Certificate has expired' },
        { status: 400 }
      );
    }

    // Generate or retrieve certificate URL
    let certificateUrl = userCertification.certificateUrl;
    
    if (!certificateUrl) {
      certificateUrl = await certificateGenerator.generateUserCertificate(
        userCertificationId
      );
    }

    return NextResponse.json({
      success: true,
      certificateUrl,
      verificationCode: userCertification.verificationCode,
    });
  } catch (error) {
    console.error('Error generating certificate:', error);
    return NextResponse.json(
      { error: 'Failed to generate certificate' },
      { status: 500 }
    );
  }
}