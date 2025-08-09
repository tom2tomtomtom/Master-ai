import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { certificationEngine } from '@/lib/certification-engine';
import { requireAuth, requireAdmin, logAdminAction, handleAuthError } from '@/lib/supabase-auth-middleware';

const prisma = new PrismaClient();

// GET /api/certifications - Get available certifications and user progress
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
    const includeProgress = searchParams.get('includeProgress') === 'true';

    // Get available certifications
    const whereClause: any = { isActive: true };
    if (category) {
      whereClause.category = category;
    }

    const certifications = await prisma.certification.findMany({
      where: whereClause,
      orderBy: [
        { category: 'asc' },
        { displayOrder: 'asc' },
        { name: 'asc' },
      ],
    });

    // Get user's earned certifications
    const userCertifications = await prisma.userCertification.findMany({
      where: { 
        userId: session.user.id,
        isRevoked: false,
      },
      select: {
        certificationId: true,
        earnedAt: true,
        expiresAt: true,
        verificationCode: true,
        certificateUrl: true,
      },
    });

    const userCertMap = new Map(
      userCertifications.map(uc => [uc.certificationId, uc])
    );

    // Combine certification data with user progress
    const result = await Promise.all(
      certifications.map(async (cert) => {
        const userCert = userCertMap.get(cert.id);
        const isEarned = !!userCert;

        let eligibility = null;
        if (!isEarned && includeProgress) {
          try {
            eligibility = await certificationEngine.checkEligibility(
              session.user.id,
              cert.id
            );
          } catch (error) {
            console.error(`Error checking eligibility for cert ${cert.id}:`, error);
          }
        }

        return {
          id: cert.id,
          name: cert.name,
          description: cert.description,
          type: cert.type,
          category: cert.category,
          badgeImageUrl: cert.badgeImageUrl,
          isEarned,
          earnedAt: userCert?.earnedAt,
          expiresAt: userCert?.expiresAt,
          verificationCode: userCert?.verificationCode,
          certificateUrl: userCert?.certificateUrl,
          eligibility,
        };
      })
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching certifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch certifications' },
      { status: 500 }
    );
  }
}

// POST /api/certifications - Award a certification (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { certificationId, userId, skipEligibilityCheck = false } = body;

    // If userId is provided, this is an admin operation
    if (userId) {
      const session = await requireAdmin();
      
      // Log admin action for audit purposes
      await logAdminAction(session, 'AWARD_CERTIFICATION', {
        certificationId,
        targetUserId: userId,
        skipEligibilityCheck
      });

      const award = await certificationEngine.awardCertification(
        userId,
        certificationId,
        skipEligibilityCheck
      );

      return NextResponse.json({
        success: true,
        ...award,
      });
    }

    // Self-awarding for eligible certifications
    const session = await requireAuth();
    
    // Award the certification for the current user
    const award = await certificationEngine.awardCertification(
      session.user.id,
      certificationId,
      false // Never skip eligibility check for self-awards
    );

    return NextResponse.json({
      success: true,
      ...award,
    });
  } catch (error) {
    console.error('Error awarding certification:', error);
    
    // Handle authorization errors
    const authResponse = handleAuthError(error);
    if (authResponse) {
      return authResponse;
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to award certification' },
      { status: 500 }
    );
  }
}