export interface DashboardUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  subscriptionTier: string;
  subscriptionStatus: string;
  createdAt: Date;
}

export interface LessonProgress {
  id: string;
  lessonId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progressPercentage: number;
  timeSpentMinutes: number;
  lastAccessed: Date | null;
  completedAt: Date | null;
  lesson: {
    id: string;
    lessonNumber: number;
    title: string;
    description: string | null;
    estimatedTime: number | null;
    difficultyLevel: string | null;
    tools: string[];
    isFree: boolean;
    isPublished: boolean;
  };
}

export interface LearningPathWithProgress {
  id: string;
  name: string;
  description: string | null;
  targetAudience: string | null;
  estimatedHours: number | null;
  difficultyLevel: string | null;
  color: string | null;
  icon: string | null;
  order: number;
  lessons: {
    id: string;
    order: number;
    isRequired: boolean;
    lesson: {
      id: string;
      lessonNumber: number;
      title: string;
      description: string | null;
      estimatedTime: number | null;
      difficultyLevel: string | null;
      tools: string[];
      isFree: boolean;
      isPublished: boolean;
      progress?: {
        id: string;
        status: 'not_started' | 'in_progress' | 'completed';
        progressPercentage: number;
        timeSpentMinutes: number;
        lastAccessed: Date | null;
        completedAt: Date | null;
      }[];
    };
  }[];
  progress?: {
    totalLessons: number;
    completedLessons: number;
    inProgressLessons: number;
    completionPercentage: number;
    totalTimeSpent: number;
    estimatedTimeRemaining: number;
    nextLessonId?: string | null;
  };
}

export interface DashboardStats {
  totalLessons: number;
  completedLessons: number;
  inProgressLessons: number;
  overallCompletionPercentage: number;
  totalTimeSpent: number;
  learningStreak: number;
  lessonsCompletedThisWeek: number;
  averageSessionTime: number;
  certificationsEarned: number;
  bookmarkedLessons: number;
  totalNotes: number;
}

export interface RecentActivity {
  id: string;
  type: 'lesson_completed' | 'lesson_started' | 'note_added' | 'bookmark_added' | 'certification_earned';
  lessonId?: string;
  lessonTitle?: string;
  timestamp: Date;
  details?: string;
}

export interface Achievement {
  id: string;
  type: 'streak' | 'completion' | 'time_spent' | 'certification';
  title: string;
  description: string;
  icon: string;
  earnedAt: Date;
  value?: number;
}

export interface LessonNote {
  id: string;
  content: string;
  timestamp: number | null;
  createdAt: Date;
  updatedAt: Date;
  lesson: {
    id: string;
    title: string;
    lessonNumber: number;
  };
}

export interface LessonBookmark {
  id: string;
  title: string | null;
  timestamp: number | null;
  createdAt: Date;
  lesson: {
    id: string;
    title: string;
    lessonNumber: number;
  };
}

export interface SearchResult {
  type: 'lesson' | 'learning_path';
  id: string;
  title: string;
  description: string | null;
  lessonNumber?: number;
  tools?: string[];
  difficultyLevel?: string | null;
  learningPath?: {
    id: string;
    name: string;
  };
}