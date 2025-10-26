/**
 * Achievement System - Modular Architecture
 * 
 * Main entry point for the achievement system with clean exports
 */

import { PrismaClient } from '@prisma/client';
import { AchievementSystemService } from './service';

// Export types
export * from './types';

// Export services for advanced usage
export { AchievementSystemService } from './service';
export { AchievementProgressService } from './progress';
export { AchievementAwardsService } from './awards';
export { AchievementLeaderboardService } from './leaderboard';
export { ActivityTrackerService } from './activity-tracker';
export { AchievementCalculations } from './calculations';

// Create and export main service class (maintains backward compatibility)
export class AchievementSystem extends AchievementSystemService {
  constructor(prisma?: PrismaClient) {
    super(prisma || new PrismaClient());
  }
}

// Singleton instance for backward compatibility
export const achievementSystem = new AchievementSystem();