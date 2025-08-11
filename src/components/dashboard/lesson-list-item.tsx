'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  CheckCircle, 
  Clock, 
  Lock,
  Pause,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LessonListItemProps {
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
      status: string;
      progressPercentage: number;
      timeSpentMinutes: number;
      lastAccessed: Date | null;
      completedAt: Date | null;
    }[];
  };
  isLocked?: boolean;
  isNext?: boolean;
}

const statusConfig = {
  not_started: {
    icon: Play,
    label: 'Start',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    variant: 'default' as const,
  },
  in_progress: {
    icon: Pause,
    label: 'Continue',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    variant: 'default' as const,
  },
  completed: {
    icon: CheckCircle,
    label: 'Completed',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    variant: 'outline' as const,
  },
};

const difficultyColors = {
  beginner: 'success',
  intermediate: 'warning',
  advanced: 'destructive',
  expert: 'destructive',
} as const;

export function LessonListItem({ lesson, isLocked = false, isNext = false }: LessonListItemProps) {
  const progress = lesson.progress?.[0];
  const status = progress?.status || 'not_started';
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.not_started;
  const Icon = config.icon;

  const isCompleted = status === 'completed';
  const progressPercentage = progress?.progressPercentage || 0;
  
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (isLocked) {
    return (
      <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-lg mr-4">
          <Lock className="h-5 w-5 text-gray-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-400">
              Lesson {lesson.lessonNumber}
            </span>
            {!lesson.isFree && (
              <Badge variant="outline" className="text-xs">
                Pro
              </Badge>
            )}
          </div>
          <h3 className="font-medium text-gray-500 line-clamp-1">
            {lesson.title}
          </h3>
          <p className="text-sm text-gray-400">
            Unlock by completing previous lessons
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex items-center p-4 bg-white rounded-lg border transition-all duration-200',
      isNext 
        ? 'border-blue-200 bg-blue-50/30 shadow-sm ring-1 ring-blue-100' 
        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm',
      isCompleted && 'bg-green-50/30 border-green-200'
    )}>
      <div className={cn(
        'flex items-center justify-center w-10 h-10 rounded-lg mr-4',
        config.bgColor
      )}>
        <Icon className={cn('h-5 w-5', config.color)} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-600">
            Lesson {lesson.lessonNumber}
          </span>
          {isNext && (
            <Badge variant="default" className="text-xs">
              Next
            </Badge>
          )}
          {!lesson.isFree && (
            <Badge variant="outline" className="text-xs">
              Pro
            </Badge>
          )}
          {lesson.difficultyLevel && (
            <Badge 
              variant={difficultyColors[lesson.difficultyLevel as keyof typeof difficultyColors] || 'secondary'}
              className="text-xs"
            >
              {lesson.difficultyLevel}
            </Badge>
          )}
        </div>
        
        <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1">
          {lesson.title}
        </h3>
        
        {lesson.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
            {lesson.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-gray-500">
          {lesson.estimatedTime && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{lesson.estimatedTime} min</span>
            </div>
          )}
          {progress?.timeSpentMinutes && (
            <div className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              <span>{formatTime(progress.timeSpentMinutes)} spent</span>
            </div>
          )}
          {(lesson.tools || []).length > 0 && (
            <div>
              <span>{(lesson.tools || []).slice(0, 2).join(', ')}</span>
              {(lesson.tools || []).length > 2 && (
                <span> +{(lesson.tools || []).length - 2} more</span>
              )}
            </div>
          )}
        </div>

        {status === 'in_progress' && progressPercentage > 0 && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progress</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="ml-4">
        <Button 
          variant={config.variant}
          size="sm"
          asChild
        >
          <Link href={`/dashboard/lesson/${lesson.id}`}>
            {config.label}
          </Link>
        </Button>
      </div>
    </div>
  );
}