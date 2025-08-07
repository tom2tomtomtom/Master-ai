'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { monitoring } from '@/lib/monitoring';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Trophy, 
  ChevronRight, 
  Home,
  Sparkles,
  Clock,
  BookOpen
} from 'lucide-react';

interface CompletionModalProps {
  lesson: {
    id: string;
    lessonNumber: number;
    title: string;
    estimatedTime: number | null;
  };
  pathId?: string;
  onClose: () => void;
}

interface NextLessonData {
  nextLesson: {
    id: string;
    title: string;
    lessonNumber: number;
    description: string | null;
    estimatedTime: number | null;
    difficultyLevel: string | null;
  } | null;
  learningPath: {
    id: string;
    name: string;
  } | null;
  currentPosition: number;
  totalLessons: number;
}

export function CompletionModal({ lesson, pathId, onClose }: CompletionModalProps) {
  const [nextLessonData, setNextLessonData] = useState<NextLessonData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadNextLesson = async () => {
      try {
        const url = pathId 
          ? `/api/lessons/${lesson.id}/navigation?pathId=${pathId}`
          : `/api/lessons/${lesson.id}/navigation`;
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setNextLessonData(data);
        }
      } catch (error) {
        monitoring.logError('completion_modal_next_lesson_error', error, {
          lessonId: lesson.id,
          pathId
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadNextLesson();
  }, [lesson.id, pathId]);

  const handleNextLesson = () => {
    if (nextLessonData?.nextLesson) {
      const url = pathId 
        ? `/dashboard/lesson/${nextLessonData.nextLesson.id}?pathId=${pathId}`
        : `/dashboard/lesson/${nextLessonData.nextLesson.id}`;
      router.push(url);
    }
  };

  const handleBackToDashboard = () => {
    if (pathId) {
      router.push(`/dashboard/path/${pathId}`);
    } else {
      router.push('/dashboard');
    }
  };

  const completionPercentage = nextLessonData 
    ? Math.round((nextLessonData.currentPosition / nextLessonData.totalLessons) * 100)
    : 0;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <DialogTitle className="text-xl">
            Lesson Completed! 🎉
          </DialogTitle>
          <DialogDescription>
            Great job finishing Lesson {lesson.lessonNumber}: {lesson.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Achievement Stats */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Trophy className="h-4 w-4 text-yellow-500 mr-1" />
                <span className="text-lg font-semibold">+100</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">XP Earned</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Clock className="h-4 w-4 text-blue-500 mr-1" />
                <span className="text-lg font-semibold">
                  {lesson.estimatedTime || 15}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Minutes</p>
            </div>
          </div>

          {/* Learning Path Progress */}
          {nextLessonData?.learningPath && (
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-sm">
                    {nextLessonData.learningPath.name}
                  </span>
                </div>
                <Badge variant="secondary">
                  {completionPercentage}% Complete
                </Badge>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {nextLessonData.currentPosition} of {nextLessonData.totalLessons} lessons completed
              </p>
            </div>
          )}

          {/* Next Lesson */}
          {nextLessonData?.nextLesson ? (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start space-x-3">
                <Sparkles className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Up Next
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                    Lesson {nextLessonData.nextLesson.lessonNumber}: {nextLessonData.nextLesson.title}
                  </p>
                  {nextLessonData.nextLesson.description && (
                    <p className="text-xs text-blue-700 dark:text-blue-300 line-clamp-2">
                      {nextLessonData.nextLesson.description}
                    </p>
                  )}
                  <div className="flex items-center space-x-2 mt-2">
                    {nextLessonData.nextLesson.estimatedTime && (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {nextLessonData.nextLesson.estimatedTime} min
                      </Badge>
                    )}
                    {nextLessonData.nextLesson.difficultyLevel && (
                      <Badge variant="outline" className="text-xs">
                        {nextLessonData.nextLesson.difficultyLevel}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <Trophy className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-1">
                Path Completed!
              </h4>
              <p className="text-sm text-green-800 dark:text-green-200">
                You've finished all lessons in this learning path. Great work!
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {nextLessonData?.nextLesson ? (
            <>
              <Button
                variant="outline"
                onClick={handleBackToDashboard}
              >
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Button
                onClick={handleNextLesson}
                className="flex-1"
              >
                Continue Learning
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </>
          ) : (
            <Button
              onClick={handleBackToDashboard}
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}