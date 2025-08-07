/**
 * CertificationEngine - Core service for managing certifications and achievements
 * 
 * This service handles:
 * - Checking user eligibility for certifications
 * - Automatically awarding certifications when criteria are met
 * - Generating verification codes and certificate metadata
 * - Validating certification requirements
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
// import { cacheService, CacheKeys, CacheTTL, CacheInvalidation } from './cache';
// import { monitoredQuery } from './db-monitor';

export interface CertificationRequirement {
  type: 'lessons' | 'paths' | 'time' | 'score' | 'streak' | 'prerequisites';
  value: any;
  operator?: 'gte' | 'lte' | 'eq' | 'in';
}

export interface CertificationEligibility {
  isEligible: boolean;
  missingRequirements: string[];
  progress: Record<string, any>;
  nextActions: string[];
}

export interface CertificationAward {
  certificateId: string;
  verificationCode: string;
  verificationHash: string;
  metadata: Record<string, any>;
  expiresAt?: Date;
}

export class CertificationEngine {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  /**
   * Check if a user is eligible for a specific certification
   * OPTIMIZED: Added caching, batch data fetching, reduced sequential queries
   */
  async checkEligibility(
    userId: string, 
    certificationId: string
  ): Promise<CertificationEligibility> {
    // return monitoredQuery('checkCertificationEligibility', async () => {
      // return cacheService.getOrSet(
      //   CacheKeys.certificationEligibility(userId, certificationId),
      //   async () => {
          // Single batch query to get all required data
          const [certification, existingCert, userStats, userProgress] = await Promise.all([
            this.prisma.certification.findUnique({
              where: { id: certificationId, isActive: true },
            }),
            this.prisma.userCertification.findUnique({
              where: {
                userId_certificationId: {
                  userId,
                  certificationId,
                },
              },
            }),
            this.ensureUserStats(userId),
            this.getUserProgress(userId),
          ]);

          if (!certification) {
            return {
              isEligible: false,
              missingRequirements: ['Certification not found or inactive'],
              progress: {},
              nextActions: ['Contact support'],
            };
          }

          if (existingCert && !existingCert.isRevoked) {
            return {
              isEligible: false,
              missingRequirements: ['Already earned'],
              progress: { status: 'completed' },
              nextActions: ['Certificate already earned'],
            };
          }

          // Get all required data in parallel
          const [completedLessons, completedPaths, userCertifications] = await Promise.all([
            certification.lessonsRequired.length > 0 
              ? this.getCompletedLessonsOptimized(userId, certification.lessonsRequired)
              : Promise.resolve([]),
            certification.pathsRequired.length > 0
              ? this.getCompletedPathsOptimized(userId, certification.pathsRequired)
              : Promise.resolve([]),
            certification.prerequisiteCerts.length > 0
              ? this.getUserCertifications(userId)
              : Promise.resolve([]),
          ]);

          const requirements = certification.requirements as unknown as CertificationRequirement[] || [];
          const missingRequirements: string[] = [];
          const progress: Record<string, any> = {};
          const nextActions: string[] = [];

          // Check each requirement (now synchronous with pre-fetched data)
          for (const requirement of requirements) {
            const checkResult = this.checkRequirementOptimized(
              requirement, 
              userStats, 
              userProgress
            );

            if (!checkResult.satisfied) {
              missingRequirements.push(checkResult.description);
              nextActions.push(checkResult.action);
            }
            
            progress[requirement.type] = checkResult.progress;
          }

          // Check lesson requirements
          if (certification.lessonsRequired.length > 0) {
            const completedLessonIds = new Set(completedLessons);
            const missingLessons = certification.lessonsRequired.filter(
              lessonId => !completedLessonIds.has(lessonId)
            );

            if (missingLessons.length > 0) {
              missingRequirements.push(`Complete ${missingLessons.length} required lessons`);
              nextActions.push('Continue with lesson plan');
            }

            progress.lessons = {
              required: certification.lessonsRequired.length,
              completed: certification.lessonsRequired.length - missingLessons.length,
              missing: missingLessons,
            };
          }

          // Check learning path requirements
          if (certification.pathsRequired.length > 0) {
            const completedPathIds = new Set(completedPaths);
            const missingPaths = certification.pathsRequired.filter(
              pathId => !completedPathIds.has(pathId)
            );

            if (missingPaths.length > 0) {
              missingRequirements.push(`Complete ${missingPaths.length} required learning paths`);
              nextActions.push('Complete remaining learning paths');
            }

            progress.paths = {
              required: certification.pathsRequired.length,
              completed: certification.pathsRequired.length - missingPaths.length,
              missing: missingPaths,
            };
          }

          // Check prerequisite certifications
          if (certification.prerequisiteCerts.length > 0) {
            const userCertIds = new Set(userCertifications);
            const missingPrereqs = certification.prerequisiteCerts.filter(
              certId => !userCertIds.has(certId)
            );

            if (missingPrereqs.length > 0) {
              missingRequirements.push(`Earn ${missingPrereqs.length} prerequisite certifications`);
              nextActions.push('Complete prerequisite certifications first');
            }

            progress.prerequisites = {
              required: certification.prerequisiteCerts.length,
              completed: certification.prerequisiteCerts.length - missingPrereqs.length,
              missing: missingPrereqs,
            };
          }

          return {
            isEligible: missingRequirements.length === 0,
            missingRequirements,
            progress,
            nextActions,
          };
        // },
        // { ttl: CacheTTL.certificationEligibility }
      // );
    // }, { userId, table: 'certifications' });
  }

  /**
   * Check all certifications for a user and return eligible ones
   * OPTIMIZED: Batch eligibility checks, parallel processing
   */
  async checkAllEligibilities(userId: string): Promise<{
    eligible: string[];
    pending: Array<{ id: string; requirements: string[] }>;
  }> {
    // return monitoredQuery('checkAllCertificationEligibilities', async () => {
      const activeCertifications = await this.prisma.certification.findMany({
        where: { isActive: true },
        select: { id: true },
      });

      // Process all eligibility checks in parallel instead of sequential
      const eligibilityPromises = activeCertifications.map(cert => 
        this.checkEligibility(userId, cert.id)
          .then(eligibility => ({ certId: cert.id, eligibility }))
          .catch(() => ({ certId: cert.id, eligibility: null }))
      );

      const results = await Promise.all(eligibilityPromises);
      
      const eligible: string[] = [];
      const pending: Array<{ id: string; requirements: string[] }> = [];

      results.forEach(({ certId, eligibility }) => {
        if (!eligibility) return;
        
        if (eligibility.isEligible) {
          eligible.push(certId);
        } else if (eligibility.missingRequirements.length > 0) {
          pending.push({
            id: certId,
            requirements: eligibility.missingRequirements,
          });
        }
      });

      return { eligible, pending };
    // }, { userId, table: 'certifications' });
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
        const eligibility = await this.checkEligibility(userId, certificationId);
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
        eligibilitySnapshot: await this.checkEligibility(userId, certificationId),
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
      console.error('Error awarding certification:', error);
      throw new Error(`Failed to award certification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Auto-award eligible certifications for a user
   */
  async autoAwardEligibleCertifications(userId: string): Promise<string[]> {
    try {
      const { eligible } = await this.checkAllEligibilities(userId);
      const awarded: string[] = [];

      for (const certificationId of eligible) {
        try {
          await this.awardCertification(userId, certificationId);
          awarded.push(certificationId);
        } catch (error) {
          console.error(`Failed to auto-award certification ${certificationId}:`, error);
          // Continue with other certifications
        }
      }

      return awarded;
    } catch (error) {
      console.error('Error in auto-award process:', error);
      return [];
    }
  }

  /**
   * Verify a certification by verification code
   */
  async verifyCertification(verificationCode: string): Promise<{
    isValid: boolean;
    certification?: any;
    user?: { name: string | null; email: string };
    earnedAt?: Date;
    expiresAt?: Date | null;
    isExpired?: boolean;
  }> {
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
      console.error('Error verifying certification:', error);
      return { isValid: false };
    }
  }

  // Private helper methods

  private async checkRequirement(
    userId: string,
    requirement: CertificationRequirement,
    userStats: any,
    _userProgress: any
  ): Promise<{ satisfied: boolean; description: string; action: string; progress: any }> {
    switch (requirement.type) {
      case 'time':
        const timeRequired = requirement.value as number;
        const timeSpent = userStats.totalTimeSpentMinutes;
        return {
          satisfied: timeSpent >= timeRequired,
          description: `Spend ${timeRequired} minutes learning (current: ${timeSpent})`,
          action: 'Continue learning to reach time requirement',
          progress: { required: timeRequired, current: timeSpent },
        };

      case 'streak':
        const streakRequired = requirement.value as number;
        const currentStreak = userStats.currentStreak;
        return {
          satisfied: currentStreak >= streakRequired,
          description: `Maintain ${streakRequired}-day learning streak (current: ${currentStreak})`,
          action: 'Keep learning daily to build streak',
          progress: { required: streakRequired, current: currentStreak },
        };

      default:
        return {
          satisfied: true,
          description: 'Unknown requirement',
          action: 'Contact support',
          progress: {},
        };
    }
  }

  private async ensureUserStats(userId: string) {
    let userStats = await this.prisma.userStats.findUnique({
      where: { userId },
    });

    if (!userStats) {
      // Create initial stats
      userStats = await this.prisma.userStats.create({
        data: { userId },
      });
    }

    return userStats;
  }

  private async getUserProgress(userId: string) {
    return this.prisma.userProgress.findMany({
      where: { userId },
      select: {
        lessonId: true,
        status: true,
        progressPercentage: true,
        timeSpentMinutes: true,
        completedAt: true,
      },
    });
  }

  private async getCompletedLessons(userId: string): Promise<string[]> {
    const progress = await this.prisma.userProgress.findMany({
      where: {
        userId,
        status: 'completed',
      },
      select: { lessonId: true },
    });

    return progress.map(p => p.lessonId);
  }

  private async getCompletedPaths(userId: string): Promise<string[]> {
    // Get all learning paths and check if all their lessons are completed
    const paths = await this.prisma.learningPath.findMany({
      include: {
        lessons: {
          select: { lessonId: true, isRequired: true },
        },
      },
    });

    const completedLessons = await this.getCompletedLessons(userId);
    const completedPaths: string[] = [];

    for (const path of paths) {
      const requiredLessons = path.lessons
        .filter(l => l.isRequired)
        .map(l => l.lessonId);

      const allRequiredCompleted = requiredLessons.every(lessonId =>
        completedLessons.includes(lessonId)
      );

      if (allRequiredCompleted && requiredLessons.length > 0) {
        completedPaths.push(path.id);
      }
    }

    return completedPaths;
  }

  private async getUserCertifications(userId: string): Promise<string[]> {
    const certs = await this.prisma.userCertification.findMany({
      where: {
        userId,
        isRevoked: false,
      },
      select: { certificationId: true },
    });

    return certs.map(c => c.certificationId);
  }

  private generateVerificationCode(): string {
    // Generate a human-readable verification code
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `MAI-${timestamp}-${random}`.toUpperCase();
  }

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
   * Optimized version of checkRequirement that works with pre-fetched data
   */
  private checkRequirementOptimized(
    requirement: CertificationRequirement,
    userStats: any,
    _userProgress: any
  ): { satisfied: boolean; description: string; action: string; progress: any } {
    switch (requirement.type) {
      case 'time':
        const timeRequired = requirement.value as number;
        const timeSpent = userStats.totalTimeSpentMinutes;
        return {
          satisfied: timeSpent >= timeRequired,
          description: `Spend ${timeRequired} minutes learning (current: ${timeSpent})`,
          action: 'Continue learning to reach time requirement',
          progress: { required: timeRequired, current: timeSpent },
        };

      case 'streak':
        const streakRequired = requirement.value as number;
        const currentStreak = userStats.currentStreak;
        return {
          satisfied: currentStreak >= streakRequired,
          description: `Maintain ${streakRequired}-day learning streak (current: ${currentStreak})`,
          action: 'Keep learning daily to build streak',
          progress: { required: streakRequired, current: currentStreak },
        };

      default:
        return {
          satisfied: true,
          description: 'Unknown requirement',
          action: 'Contact support',
          progress: {},
        };
    }
  }

  /**
   * Optimized method to check completed lessons for specific required lessons
   */
  private async getCompletedLessonsOptimized(userId: string, requiredLessons: string[]): Promise<string[]> {
    if (requiredLessons.length === 0) return [];
    
    // return monitoredQuery('getCompletedLessonsOptimized', async () => {
      const progress = await this.prisma.userProgress.findMany({
        where: {
          userId,
          lessonId: { in: requiredLessons },
          status: 'completed',
        },
        select: { lessonId: true },
      });

      return progress.map(p => p.lessonId);
    // }, { userId, table: 'user_progress' });
  }

  /**
   * Optimized method to check completed paths for specific required paths
   */
  private async getCompletedPathsOptimized(userId: string, requiredPaths: string[]): Promise<string[]> {
    if (requiredPaths.length === 0) return [];
    
    // return monitoredQuery('getCompletedPathsOptimized', async () => {
      // Get paths with their required lessons in single query
      const pathsWithLessons = await this.prisma.learningPath.findMany({
        where: { id: { in: requiredPaths } },
        include: {
          lessons: {
            select: { lessonId: true, isRequired: true },
          },
        },
      });

      if (pathsWithLessons.length === 0) return [];

      // Get all lesson IDs that are required across all paths
      const allRequiredLessonIds = new Set<string>();
      pathsWithLessons.forEach(path => {
        path.lessons.forEach(lesson => {
          if (lesson.isRequired) {
            allRequiredLessonIds.add(lesson.lessonId);
          }
        });
      });

      // Single query to check user's completion status for all required lessons
      const completedLessons = await this.prisma.userProgress.findMany({
        where: {
          userId,
          lessonId: { in: Array.from(allRequiredLessonIds) },
          status: 'completed',
        },
        select: { lessonId: true },
      });

      const completedLessonIds = new Set(completedLessons.map(p => p.lessonId));
      const completedPaths: string[] = [];

      // Check each path to see if all required lessons are completed
      for (const path of pathsWithLessons) {
        const requiredLessons = path.lessons
          .filter(l => l.isRequired)
          .map(l => l.lessonId);

        const allRequiredCompleted = requiredLessons.every(lessonId =>
          completedLessonIds.has(lessonId)
        );

        if (allRequiredCompleted && requiredLessons.length > 0) {
          completedPaths.push(path.id);
        }
      }

      return completedPaths;
    // }, { userId, table: 'learning_paths' });
  }
}

// Singleton instance
export const certificationEngine = new CertificationEngine();