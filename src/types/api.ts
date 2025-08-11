/**
 * Shared TypeScript types for API routes
 * 
 * This file contains common interfaces and types used across multiple API endpoints
 * to ensure type safety and consistency throughout the application.
 */

import { User, UserProgress, Lesson, LearningPath, Exercise, Certification, UserCertification } from '@prisma/client';

// =============================================================================
// Common Response Types
// =============================================================================

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// =============================================================================
// Route Parameter Types
// =============================================================================

export interface IdRouteParams {
  id: string;
}

export interface LessonRouteParams {
  id: string;
}

export interface LearningPathRouteParams {
  id: string;
}

// =============================================================================
// Extended Prisma Types with Relations
// =============================================================================

export type UserProgressWithLesson = UserProgress & {
  lesson: {
    id: string;
    title: string;
    lessonNumber: number;
    estimatedTime: number | null;
  };
};

export type LessonWithProgress = Lesson & {
  progress?: UserProgress[];
  exercises: Exercise[];
  _count: {
    progress: number;
  };
};

export type LearningPathWithLessons = LearningPath & {
  lessons: Array<{
    id: string;
    order: number;
    isRequired: boolean;
    lesson: LessonWithProgress;
  }>;
};

export type EnrichedLearningPath = LearningPathWithLessons & {
  stats: {
    totalLessons: number;
    totalEstimatedTime: number;
    totalExercises: number;
    averageDifficulty: string;
  };
};

export type CertificationWithUser = UserCertification & {
  certification: {
    id: string;
    name: string;
  };
};

// =============================================================================
// Request Body Types
// =============================================================================

export interface UpdateLearningPathRequest {
  name?: string;
  description?: string;
  targetAudience?: string;
  estimatedHours?: number;
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  color?: string;
  icon?: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateProgressRequest {
  progressPercentage?: number;
  timeSpentMinutes?: number;
  status?: 'not_started' | 'in_progress' | 'completed';
  completedAt?: string | null;
}

export interface PerformanceMetricRequest {
  name: string;
  value: number;
  unit?: string;
  tags?: Record<string, string>;
  timestamp?: string | number;
}

// =============================================================================
// Dashboard and Activity Types
// =============================================================================

export type ActivityType = 
  | 'lesson_completed'
  | 'lesson_started'
  | 'note_added'
  | 'bookmark_added'
  | 'certification_earned';

export interface DashboardActivity {
  id: string;
  type: ActivityType;
  lessonId?: string;
  lessonTitle?: string;
  timestamp: Date;
  details: string;
}

// =============================================================================
// Progress and Statistics Types
// =============================================================================

export interface LearningStats {
  totalLessons: number;
  completedLessons: number;
  inProgressLessons: number;
  totalTimeSpent: number;
  averageProgress: number;
  streakDays: number;
}

export interface ProgressUpdateData {
  lastAccessed: Date;
  progressPercentage?: number;
  timeSpentMinutes?: number;
  status?: string;
  completedAt?: Date | null;
}

export interface ProgressResponse extends UserProgressWithLesson {
  newAchievements?: string[];
  newCertifications?: string[];
}

// =============================================================================
// Performance Monitoring Types
// =============================================================================

export interface PerformanceMetricData {
  name: string;
  value: number;
  unit?: string;
  tags?: Record<string, string>;
  timestamp?: string | number;
}

export interface PerformanceThresholds {
  LCP: number;        // Largest Contentful Paint
  FID: number;        // First Input Delay
  CLS: number;        // Cumulative Layout Shift
  page_load_time: number;
  slow_resource_load: number;
}

// =============================================================================
// Utility Types
// =============================================================================

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

export type SubscriptionTier = 'free' | 'pro' | 'team' | 'enterprise';

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing';

// =============================================================================
// Type Guards
// =============================================================================

export function isApiErrorResponse(response: ApiResponse): response is ApiErrorResponse {
  return response.success === false;
}

export function isApiSuccessResponse<T>(response: ApiResponse<T>): response is ApiSuccessResponse<T> {
  return response.success === true;
}

export function isDifficultyLevel(value: string): value is DifficultyLevel {
  return ['beginner', 'intermediate', 'advanced', 'expert'].includes(value);
}

export function isProgressStatus(value: string): value is ProgressStatus {
  return ['not_started', 'in_progress', 'completed'].includes(value);
}

export function isActivityType(value: string): value is ActivityType {
  return [
    'lesson_completed',
    'lesson_started',
    'note_added',
    'bookmark_added',
    'certification_earned'
  ].includes(value);
}