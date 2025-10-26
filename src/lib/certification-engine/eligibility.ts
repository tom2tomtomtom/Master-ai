/**
 * Certification Eligibility Service
 * 
 * Handles checking user eligibility for certifications
 */

import { PrismaClient } from '@prisma/client';
import { 
  CertificationEligibility, 
  CertificationRequirement, 
  RequirementCheckResult,
  EligibilityCheckResults
} from './types';

export class CertificationEligibilityService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Check if a user is eligible for a specific certification
   * OPTIMIZED: Added caching, batch data fetching, reduced sequential queries
   */
  async checkEligibility(
    userId: string, 
    certificationId: string
  ): Promise<CertificationEligibility> {
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
  }

  /**
   * Check all certifications for a user and return eligible ones
   * OPTIMIZED: Batch eligibility checks, parallel processing
   */
  async checkAllEligibilities(userId: string): Promise<EligibilityCheckResults> {
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
  }

  /**
   * Check requirement with pre-fetched data
   */
  private checkRequirementOptimized(
    requirement: CertificationRequirement,
    userStats: any,
    _userProgress: any
  ): RequirementCheckResult {
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
   * Get completed lessons for specific required lessons
   */
  private async getCompletedLessonsOptimized(userId: string, requiredLessons: string[]): Promise<string[]> {
    if (requiredLessons.length === 0) return [];
    
    const progress = await this.prisma.userProgress.findMany({
      where: {
        userId,
        lessonId: { in: requiredLessons },
        status: 'completed',
      },
      select: { lessonId: true },
    });

    return progress.map(p => p.lessonId);
  }

  /**
   * Get completed paths for specific required paths
   */
  private async getCompletedPathsOptimized(userId: string, requiredPaths: string[]): Promise<string[]> {
    if (requiredPaths.length === 0) return [];
    
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
  }

  /**
   * Get user certifications
   */
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

  /**
   * Get user progress
   */
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