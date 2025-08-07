'use client';

import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ProgressCircle } from './progress-circle';
import { Clock, BookOpen, Play, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LearningPathWithProgress } from '@/types/dashboard';

interface LearningPathCardProps {
  path: LearningPathWithProgress;
}

const difficultyColors = {
  beginner: 'success',
  intermediate: 'warning', 
  advanced: 'destructive',
  expert: 'destructive',
} as const;

const difficultyLabels = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced', 
  expert: 'Expert',
};

export function LearningPathCard({ path }: LearningPathCardProps) {
  const progress = path.progress;
  const completionPercentage = progress?.completionPercentage || 0;
  const isCompleted = completionPercentage === 100;
  const hasStarted = (progress?.completedLessons || 0) > 0 || (progress?.inProgressLessons || 0) > 0;

  const getStatusColor = () => {
    if (isCompleted) return 'green';
    if (hasStarted) return 'blue';
    return 'purple';
  };

  return (
    <Card className="group hover:shadow-md transition-all duration-200 border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: path.color || '#3B82F6' }}
              />
              <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
                {path.name}
              </h3>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {path.description}
            </p>
            
            <div className="flex flex-wrap gap-2">
              {path.difficultyLevel && (
                <Badge 
                  variant={difficultyColors[path.difficultyLevel as keyof typeof difficultyColors] || 'secondary'}
                  className="text-xs"
                >
                  {difficultyLabels[path.difficultyLevel as keyof typeof difficultyLabels] || path.difficultyLevel}
                </Badge>
              )}
              {path.targetAudience && (
                <Badge variant="outline" className="text-xs">
                  {path.targetAudience}
                </Badge>
              )}
            </div>
          </div>
          
          <ProgressCircle 
            value={completionPercentage}
            size="md"
            color={getStatusColor()}
            className="ml-4"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                <span>{progress?.totalLessons || path.lessons.length} lessons</span>
              </div>
              {path.estimatedHours && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{path.estimatedHours}h</span>
                </div>
              )}
            </div>
            {isCompleted && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-xs font-medium">Completed</span>
              </div>
            )}
          </div>

          {progress && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Progress</span>
                <span>{progress.completedLessons}/{progress.totalLessons} completed</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="px-6 py-4 bg-gray-50/50 rounded-b-lg">
        <Button 
          asChild 
          className="w-full" 
          variant={isCompleted ? "outline" : "default"}
        >
          <Link href={`/dashboard/path/${path.id}`}>
            <Play className="mr-2 h-4 w-4" />
            {isCompleted ? 'Review' : hasStarted ? 'Continue' : 'Start Learning'}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}