'use client';

import { useEffect, useState } from 'react';
import { appLogger } from '@/lib/logger';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Home, 
  BookOpen,
  Clock,
  Target
} from 'lucide-react';

interface NavigationData {
  currentLesson: {
    id: string;
    title: string;
    lessonNumber: number;
    order: number;
  };
  previousLesson: {
    id: string;
    title: string;
    lessonNumber: number;
    description: string | null;
    estimatedTime: number | null;
    difficultyLevel: string | null;
    tools: string[];
    isPublished: boolean;
    isFree: boolean;
  } | null;
  nextLesson: {
    id: string;
    title: string;
    lessonNumber: number;
    description: string | null;
    estimatedTime: number | null;
    difficultyLevel: string | null;
    tools: string[];
    isPublished: boolean;
    isFree: boolean;
  } | null;
  learningPath: {
    id: string;
    name: string;
    description: string | null;
    color: string | null;
    icon: string | null;
  } | null;
  totalLessons: number;
  currentPosition: number;
}

interface LessonNavigationProps {
  lessonId: string;
  pathId?: string;
}

export function LessonNavigation({ lessonId, pathId }: LessonNavigationProps) {
  const [navigationData, setNavigationData] = useState<NavigationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadNavigation = async () => {
      try {
        setIsLoading(true);
        const url = pathId 
          ? `/api/lessons/${lessonId}/navigation?pathId=${pathId}`
          : `/api/lessons/${lessonId}/navigation`;
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setNavigationData(data);
        }
      } catch (error) {
        appLogger.error('Error loading navigation:', { error: error, component: 'lesson-navigation' });
      } finally {
        setIsLoading(false);
      }
    };

    loadNavigation();
  }, [lessonId, pathId]);

  const navigateToLesson = (targetLessonId: string) => {
    const url = pathId 
      ? `/dashboard/lesson/${targetLessonId}?pathId=${pathId}`
      : `/dashboard/lesson/${targetLessonId}`;
    router.push(url);
  };

  const navigateToDashboard = () => {
    if (pathId) {
      router.push(`/dashboard/path/${pathId}`);
    } else {
      router.push('/dashboard');
    }
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  if (!navigationData) {
    return null;
  }

  const { 
    currentLesson, 
    previousLesson, 
    nextLesson, 
    learningPath, 
    totalLessons, 
    currentPosition 
  } = navigationData;

  return (
    <div className="space-y-4">
      {/* Learning Path Info */}
      {learningPath && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm">Learning Path</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={navigateToDashboard}
            >
              <Home className="h-4 w-4" />
            </Button>
          </div>
          
          <h3 className="font-semibold text-sm mb-2 line-clamp-2">
            {learningPath.name}
          </h3>
          
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>Progress: {currentPosition} of {totalLessons}</span>
            <span>{Math.round((currentPosition / totalLessons) * 100)}%</span>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentPosition / totalLessons) * 100}%` }}
            />
          </div>
        </Card>
      )}

      {/* Navigation Controls */}
      <Card className="p-4">
        <div className="space-y-3">
          {/* Previous Lesson */}
          {previousLesson ? (
            <Button
              variant="outline"
              className="w-full h-auto p-3 justify-start"
              onClick={() => navigateToLesson(previousLesson.id)}
            >
              <div className="flex items-start space-x-3 w-full">
                <ChevronLeft className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div className="text-left flex-1 min-w-0">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Previous Lesson
                  </div>
                  <div className="font-medium text-sm line-clamp-2">
                    {previousLesson.lessonNumber}. {previousLesson.title}
                  </div>
                  {previousLesson.estimatedTime && (
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      {previousLesson.estimatedTime} min
                    </div>
                  )}
                </div>
              </div>
            </Button>
          ) : (
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-3">
              This is the first lesson
            </div>
          )}

          {/* Next Lesson */}
          {nextLesson ? (
            <Button
              className="w-full h-auto p-3 justify-start"
              onClick={() => navigateToLesson(nextLesson.id)}
            >
              <div className="flex items-start space-x-3 w-full">
                <div className="text-left flex-1 min-w-0">
                  <div className="text-xs text-blue-100 mb-1">
                    Next Lesson
                  </div>
                  <div className="font-medium text-sm line-clamp-2 text-white">
                    {nextLesson.lessonNumber}. {nextLesson.title}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    {nextLesson.estimatedTime && (
                      <div className="flex items-center text-xs text-blue-100">
                        <Clock className="h-3 w-3 mr-1" />
                        {nextLesson.estimatedTime} min
                      </div>
                    )}
                    {nextLesson.difficultyLevel && (
                      <Badge variant="secondary" className="text-xs">
                        {nextLesson.difficultyLevel}
                      </Badge>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0 text-white" />
              </div>
            </Button>
          ) : (
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-3">
              This is the last lesson
            </div>
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-4">
        <h3 className="font-semibold text-sm mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={navigateToDashboard}
          >
            <Home className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          {learningPath && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => router.push(`/dashboard/path/${learningPath.id}`)}
            >
              <Target className="h-4 w-4 mr-2" />
              View Learning Path
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}