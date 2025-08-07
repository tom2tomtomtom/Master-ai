'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, ArrowRight, CheckCircle } from 'lucide-react';

interface NextLessonCardProps {
  lesson?: {
    id: string;
    lessonNumber: number;
    title: string;
    description: string | null;
    estimatedTime: number | null;
    difficultyLevel: string | null;
    tools: string[];
    recommendationType: 'continue' | 'start';
    progress?: {
      status: string;
      lastAccessed: Date | null;
    } | null;
    learningPath?: {
      id: string;
      name: string;
      color: string | null;
    } | null;
  };
  allCompleted?: boolean;
  message?: string;
}

const difficultyColors = {
  beginner: 'success',
  intermediate: 'warning',
  advanced: 'destructive',
  expert: 'destructive',
} as const;

export function NextLessonCard({ lesson, allCompleted, message }: NextLessonCardProps) {
  if (allCompleted) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              All Lessons Completed!
            </h3>
            <p className="text-green-700 mb-4">
              {message || 'Congratulations! You have completed all available lessons.'}
            </p>
            <Button asChild variant="outline" className="border-green-300 text-green-700 hover:bg-green-100">
              <Link href="/dashboard/achievements">
                View Achievements <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!lesson) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Continue Learning</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-gray-500">Loading recommendation...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isResuming = lesson.recommendationType === 'continue';
  const actionText = isResuming ? 'Continue' : 'Start';

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Play className="h-5 w-5 text-blue-600" />
          {isResuming ? 'Continue Learning' : 'Next Lesson'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
              Lesson {lesson.lessonNumber}
            </span>
            {lesson.learningPath && (
              <div className="flex items-center gap-1">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: lesson.learningPath.color || '#3B82F6' }}
                />
                <span className="text-xs text-gray-600">
                  {lesson.learningPath.name}
                </span>
              </div>
            )}
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">
            {lesson.title}
          </h3>
          {lesson.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {lesson.description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {lesson.estimatedTime && (
            <Badge variant="outline" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              {lesson.estimatedTime} min
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
          {lesson.tools.slice(0, 2).map((tool) => (
            <Badge key={tool} variant="secondary" className="text-xs">
              {tool}
            </Badge>
          ))}
          {lesson.tools.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{lesson.tools.length - 2} more
            </Badge>
          )}
        </div>

        <div className="pt-2">
          <Button asChild className="w-full">
            <Link href={`/dashboard/lesson/${lesson.id}`}>
              {actionText} Lesson <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}