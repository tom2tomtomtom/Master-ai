import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { appLogger } from '@/lib/logger';
import { certificationEngine } from '@/lib/certification-engine';
import { requireAuth, requireAdmin, logAdminAction, handleAuthError } from '@/lib/supabase-auth-middleware';
import { z } from 'zod';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

// GET /api/certifications - Get available certifications and user progress
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    
    if (!user) {
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
        userId: user.id,
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
              user.id,
              cert.id
            );
          } catch (error) {
            appLogger.errors.apiError('certification-eligibility-check', error as Error, {
              endpoint: '/api/certifications',
              certificationId: cert.id,
              userId: user.id
            });
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
    appLogger.errors.apiError('certifications-get', error as Error, {
      endpoint: '/api/certifications'
    });
    return NextResponse.json(
      { error: 'Failed to fetch certifications' },
      { status: 500 }
    );
  }
}

// POST /api/certifications - Award a certification (admin only)
export async function POST(request: NextRequest) {
  try {
    const awardCertSchema = z.object({
      certificationId: z.string().uuid(),
      userId: z.string().uuid().optional(),
      skipEligibilityCheck: z.boolean().default(false)
    });
    
    const body = await request.json();
    const { certificationId, userId, skipEligibilityCheck } = awardCertSchema.parse(body);

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
    const user = await requireAuth();
    
    // Award the certification for the current user
    const award = await certificationEngine.awardCertification(
      user.id,
      certificationId,
      false // Never skip eligibility check for self-awards
    );

    return NextResponse.json({
      success: true,
      ...award,
    });
  } catch (error) {
    appLogger.errors.apiError('certifications-award', error as Error, {
      endpoint: '/api/certifications'
    });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.issues },
        { status: 400 }
      );
    }
    
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