/**
 * Main Certification Engine Service
 * 
 * Orchestrates all certification engine functionality
 */

import { PrismaClient } from '@prisma/client';
import { 
  CertificationEligibility, 
  CertificationAward, 
  CertificationVerificationResult,
  EligibilityCheckResults
} from './types';
import { CertificationEligibilityService } from './eligibility';
import { CertificationAwardsService } from './awards';
import { CertificationVerificationService } from './verification';

export class CertificationEngineService {
  private eligibilityService: CertificationEligibilityService;
  private awardsService: CertificationAwardsService;
  private verificationService: CertificationVerificationService;

  constructor(private prisma: PrismaClient) {
    this.eligibilityService = new CertificationEligibilityService(prisma);
    this.awardsService = new CertificationAwardsService(prisma);
    this.verificationService = new CertificationVerificationService(prisma);
  }

  /**
   * Check if a user is eligible for a specific certification
   */
  async checkEligibility(
    userId: string, 
    certificationId: string
  ): Promise<CertificationEligibility> {
    return this.eligibilityService.checkEligibility(userId, certificationId);
  }

  /**
   * Check all certifications for a user and return eligible ones
   */
  async checkAllEligibilities(userId: string): Promise<EligibilityCheckResults> {
    return this.eligibilityService.checkAllEligibilities(userId);
  }

  /**
   * Award a certification to a user
   */
  async awardCertification(
    userId: string, 
    certificationId: string,
    skipEligibilityCheck = false
  ): Promise<CertificationAward> {
    return this.awardsService.awardCertification(userId, certificationId, skipEligibilityCheck);
  }

  /**
   * Auto-award eligible certifications for a user
   */
  async autoAwardEligibleCertifications(userId: string): Promise<string[]> {
    return this.awardsService.autoAwardEligibleCertifications(userId);
  }

  /**
   * Verify a certification by verification code
   */
  async verifyCertification(verificationCode: string): Promise<CertificationVerificationResult> {
    return this.verificationService.verifyCertification(verificationCode);
  }
}