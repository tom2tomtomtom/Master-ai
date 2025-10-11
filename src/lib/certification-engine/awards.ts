/**
 * Certification Awards Service
 *
 * Handles awarding certifications to users
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { CertificationAward } from './types';
import { CertificationEligibilityService } from './eligibility';
import { appLogger } from '@/lib/logger';

export class CertificationAwardsService {
  private eligibilityService: CertificationEligibilityService;

  constructor(private prisma: PrismaClient) {
    this.eligibilityService = new CertificationEligibilityService(prisma);
  }

  /**
   * Award a certification to a user
   */
  async awardCertification(
    userId: string, 
    certificationId: string,
    skipEligibilityCheck = false
  ): Promise<CertificationAward> {
    try {
      // Check eligibility unless explicitly skipped (for admin overrides)
      if (!skipEligibilityCheck) {
        const eligibility = await this.eligibilityService.checkEligibility(userId, certificationId);
        if (!eligibility.isEligible) {
          throw new Error(`User not eligible: ${eligibility.missingRequirements.join(', ')}`);
        }
      }

      const certification = await this.prisma.certification.findUnique({
        where: { id: certificationId },
      });

      if (!certification) {
        throw new Error('Certification not found');
      }

      // Generate verification code and hash
      const verificationCode = this.generateVerificationCode();
      const verificationHash = this.generateVerificationHash(userId, certificationId, verificationCode);

      // Calculate expiration date if validity period is set
      let expiresAt: Date | undefined;
      if (certification.validityPeriod) {
        expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + certification.validityPeriod);
      }

      // Collect metadata about the user's progress when earning
      const userStats = await this.ensureUserStats(userId);
      const metadata = {
        earnedAt: new Date().toISOString(),
        totalLessonsCompleted: userStats.totalLessonsCompleted,
        totalTimeSpent: userStats.totalTimeSpentMinutes,
        currentStreak: userStats.currentStreak,
        eligibilitySnapshot: await this.eligibilityService.checkEligibility(userId, certificationId),
      };

      // Create the user certification record
      const userCertification = await this.prisma.userCertification.create({
        data: {
          userId,
          certificationId,
          verificationCode,
          verificationHash,
          expiresAt,
          metadata: metadata as any,
        },
      });

      return {
        certificateId: userCertification.id,
        verificationCode,
        verificationHash,
        metadata,
        expiresAt,
      };

    } catch (error) {
      appLogger.error('Error awarding certification', { error, userId, certificationId });
      throw new Error(`Failed to award certification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Auto-award eligible certifications for a user
   */
  async autoAwardEligibleCertifications(userId: string): Promise<string[]> {
    try {
      const { eligible } = await this.eligibilityService.checkAllEligibilities(userId);
      const awarded: string[] = [];

      for (const certificationId of eligible) {
        try {
          await this.awardCertification(userId, certificationId);
          awarded.push(certificationId);
        } catch (error) {
          appLogger.error(`Failed to auto-award certification ${certificationId}`, { error, userId, certificationId });
          // Continue with other certifications
        }
      }

      return awarded;
    } catch (error) {
      appLogger.error('Error in auto-award process', { error, userId });
      return [];
    }
  }

  /**
   * Generate verification code
   */
  private generateVerificationCode(): string {
    // Generate a human-readable verification code
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `MAI-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Generate verification hash
   */
  private generateVerificationHash(
    userId: string,
    certificationId: string,
    verificationCode: string
  ): string {
    if (!process.env.NEXTAUTH_SECRET) {
      throw new Error('NEXTAUTH_SECRET is required for certificate verification');
    }
    const data = `${userId}:${certificationId}:${verificationCode}:${process.env.NEXTAUTH_SECRET}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Ensure user stats exist
   */
  private async ensureUserStats(userId: string) {
    let userStats = await this.prisma.userStats.findUnique({
      where: { userId },
    });

    if (!userStats) {
      userStats = await this.prisma.userStats.create({
        data: { userId },
      });
    }

    return userStats;
  }
}