export interface LessonFilters {
  difficulty: ('beginner' | 'intermediate' | 'advanced')[];
  tools: string[];
  duration: {
    min: number;
    max: number;
  };
  categories: string[];
  completed?: boolean;
  bookmarked?: boolean;
  searchQuery: string;
}

export interface SearchParams {
  filters: LessonFilters;
  sortBy: 'relevance' | 'difficulty' | 'duration' | 'popularity' | 'recent' | 'title';
  viewMode: 'grid' | 'list';
  page: number;
  limit: number;
}

export interface LessonWithMetadata {
  id: string;
  lessonNumber: number;
  title: string;
  description: string | null;
  estimatedTime: number | null;
  difficultyLevel: string | null;
  tools: string[];
  isFree: boolean;
  createdAt: Date;
  updatedAt: Date;
  categories: {
    id: string;
    name: string;
    color: string;
    icon: string | null;
  }[];
  progress?: {
    status: string;
    progressPercentage: number;
    completedAt: Date | null;
  };
  isBookmarked: boolean;
  popularity: number;
  completionRate: number;
  previewContent: string;
}

export interface SearchResponse {
  lessons: LessonWithMetadata[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: {
    availableDifficulties: string[];
    availableTools: string[];
    availableCategories: {
      id: string;
      name: string;
      color: string;
      icon: string | null;
    }[];
    durationRange: {
      min: number;
      max: number;
    };
  };
  suggestions?: string[];
}

export interface RecommendationSection {
  title: string;
  type: 'continue_learning' | 'recommended' | 'trending' | 'quick_wins' | 'tool_specific';
  lessons: LessonWithMetadata[];
}

export interface InteractionData {
  lessonId: string;
  interactionType: 'view' | 'start' | 'complete' | 'bookmark' | 'search' | 'preview' | 'filter';
  metadata?: {
    searchQuery?: string;
    filterValues?: Partial<LessonFilters>;
    sessionId?: string;
    source?: string;
  };
}