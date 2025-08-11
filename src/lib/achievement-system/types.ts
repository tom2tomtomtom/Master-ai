/**
 * Achievement System Types and Interfaces
 * 
 * Centralized type definitions for the achievement system
 */

export interface AchievementCriteria {
  type: 'lessons_completed' | 'streak_days' | 'notes_taken' | 'bookmarks_created' | 
        'time_spent' | 'consecutive_days' | 'speed_completion' | 'engagement_score';
  threshold: number;
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time';
  operator?: 'gte' | 'lte' | 'eq';
  metadata?: Record<string, any>;
}

export interface AchievementProgress {
  achievementId: string;
  name: string;
  description: string;
  category: string;
  progress: number;
  threshold: number;
  isCompleted: boolean;
  completedAt?: Date;
  nextMilestone?: {
    name: string;
    threshold: number;
    remaining: number;
  };
}

export interface UserActivity {
  lessonCompleted?: boolean;
  noteCreated?: boolean;
  bookmarkCreated?: boolean;
  timeSpent?: number;
  date: Date;
}

export interface LearningStreak {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date | null;
}

export interface EligibilityCheckResult {
  satisfied: boolean;
  description: string;
  action: string;
  progress: any;
}

export interface AchievementAwardResult {
  achievementId: string;
  pointsAwarded: number;
  metadata: Record<string, any>;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string | null;
  achievementCount: number;
  totalPoints: number;
  recentAchievements: any[];
}