/**
 * Main Achievement System Service
 * 
 * Orchestrates all achievement system functionality
 */

import { PrismaClient } from '@prisma/client';
import { UserActivity, AchievementProgress, LearningStreak, LeaderboardEntry } from './types';
import { AchievementProgressService } from './progress';
import { AchievementAwardsService } from './awards';
import { AchievementLeaderboardService } from './leaderboard';
import { ActivityTrackerService } from './activity-tracker';
import { AchievementCalculations } from './calculations';

export class AchievementSystemService {
  private progressService: AchievementProgressService;
  private awardsService: AchievementAwardsService;
  private leaderboardService: AchievementLeaderboardService;
  private activityTracker: ActivityTrackerService;
  private calculations: AchievementCalculations;

  constructor(private prisma: PrismaClient) {
    this.progressService = new AchievementProgressService(prisma);
    this.awardsService = new AchievementAwardsService(prisma);
    this.leaderboardService = new AchievementLeaderboardService(prisma);
    this.activityTracker = new ActivityTrackerService(prisma);
    this.calculations = new AchievementCalculations(prisma);
  }

  /**
   * Process user activity and check for new achievements
   */
  async processUserActivity(userId: string, activity: UserActivity): Promise<string[]> {
    try {
      // Update user stats first
      await this.activityTracker.updateUserStats(userId, activity);

      // Check for new achievements
      const newAchievements = await this.awardsService.checkAndAwardAchievements(userId);

      return newAchievements;
    } catch (error) {
      console.error('Error processing user activity:', error);
      throw new Error('Failed to process user activity');
    }
  }

  /**
   * Check all achievements for a user and award eligible ones
   */
  async checkAndAwardAchievements(userId: string): Promise<string[]> {
    return this.awardsService.checkAndAwardAchievements(userId);
  }

  /**
   * Get user's achievement progress
   */
  async getUserAchievementProgress(userId: string): Promise<AchievementProgress[]> {
    return this.progressService.getUserProgress(userId);
  }

  /**
   * Get user's earned achievements with details
   */
  async getUserAchievements(userId: string, category?: string): Promise<any[]> {
    return this.progressService.getUserAchievements(userId, category);
  }

  /**
   * Calculate learning streak for a user
   */
  async calculateLearningStreak(userId: string): Promise<LearningStreak> {
    return this.calculations.calculateLearningStreak(userId);
  }

  /**
   * Get achievement leaderboard
   */
  async getAchievementLeaderboard(category?: string, limit = 50): Promise<LeaderboardEntry[]> {
    return this.leaderboardService.getLeaderboard(category, limit);
  }
}