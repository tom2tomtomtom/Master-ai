import { NextRequest, NextResponse } from 'next/server';
import { requireUserResourceAccess, handleAuthError } from '@/lib/auth-middleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/certifications/user/[userId] - Get user's certifications
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const resolvedParams = await params;
    const targetUserId = resolvedParams.userId;

    // Verify user can access these certifications (own certifications or admin)
    await requireUserResourceAccess(targetUserId);

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const includeRevoked = searchParams.get('includeRevoked') === 'true';

    const whereClause: any = { userId: targetUserId };
    if (!includeRevoked) {
      whereClause.isRevoked = false;
    }

    const userCertifications = await prisma.userCertification.findMany({
      where: {
        ...whereClause,
        ...(category && {
          certification: {
            category,
          },
        }),
      },
      include: {
        certification: true,
      },
      orderBy: { earnedAt: 'desc' },
    });

    // Filter out certifications that don't match category filter
    const filteredCertifications = userCertifications.filter(
      uc => uc.certification
    );

    const result = filteredCertifications.map(uc => ({
      id: uc.id,
      certificationId: uc.certificationId,
      name: uc.certification.name,
      description: uc.certification.description,
      type: uc.certification.type,
      category: uc.certification.category,
      badgeImageUrl: uc.certification.badgeImageUrl,
      earnedAt: uc.earnedAt,
      expiresAt: uc.expiresAt,
      verificationCode: uc.verificationCode,
      certificateUrl: uc.certificateUrl,
      isRevoked: uc.isRevoked,
      revokedAt: uc.revokedAt,
      revokedReason: uc.revokedReason,
      metadata: uc.metadata,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching user certifications:', error);
    
    // Handle authorization errors with proper responses
    const authResponse = handleAuthError(error);
    if (authResponse) {
      return authResponse;
    }

    return NextResponse.json(
      { error: 'Failed to fetch user certifications' },
      { status: 500 }
    );
  }
}