/**
 * Certification Verification Service
 *
 * Handles verification of issued certifications
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { CertificationVerificationResult } from './types';
import { appLogger } from '@/lib/logger';

export class CertificationVerificationService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Verify a certification by verification code
   */
  async verifyCertification(verificationCode: string): Promise<CertificationVerificationResult> {
    try {
      const userCert = await this.prisma.userCertification.findUnique({
        where: { verificationCode },
        include: {
          certification: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      if (!userCert) {
        return { isValid: false };
      }

      if (userCert.isRevoked) {
        return { isValid: false };
      }

      const isExpired = userCert.expiresAt ? new Date() > userCert.expiresAt : false;

      // Verify hash integrity
      const expectedHash = this.generateVerificationHash(
        userCert.userId,
        userCert.certificationId,
        verificationCode
      );

      const isHashValid = userCert.verificationHash === expectedHash;

      return {
        isValid: isHashValid && !isExpired,
        certification: userCert.certification,
        user: userCert.user,
        earnedAt: userCert.earnedAt,
        expiresAt: userCert.expiresAt,
        isExpired,
      };

    } catch (error) {
      appLogger.error('Error verifying certification', { error, verificationCode });
      return { isValid: false };
    }
  }

  /**
   * Generate verification hash for validation
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
}