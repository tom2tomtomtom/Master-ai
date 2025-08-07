'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ProgressCircle } from '@/components/dashboard/progress-circle';
import { LessonListItem } from '@/components/dashboard/lesson-list-item';
import { 
  BookOpen, 
  Clock, 
  Target, 
  Play, 
  TrendingUp,
  ChevronLeft,
  Users,
  Award
} from 'lucide-react';
import Link from 'next/link';
import { LearningPathWithProgress } from '@/types/dashboard';

export default function LearningPathPage() {
  const params = useParams();
  const pathId = params.id as string;
  
  const [learningPath, setLearningPath] = useState<LearningPathWithProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLearningPath = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/dashboard/path/${pathId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch learning path');
        }
        
        const data = await response.json();
        setLearningPath(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (pathId) {
      fetchLearningPath();
    }
  }, [pathId]);

  if (loading) {
    return (
      <DashboardLayout title="Loading...">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
            <div className="space-y-4">
              <div className="h-48 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !learningPath) {
    return (
      <DashboardLayout title="Error">
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <BookOpen className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Learning Path Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            {error || 'The learning path you are looking for does not exist.'}
          </p>
          <Button asChild>
            <Link href="/dashboard">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const progress = learningPath.progress;
  const lessons = learningPath.lessons.map(pl => pl.lesson).filter(lesson => lesson.isPublished);
  const completionPercentage = progress?.completionPercentage || 0;
  const isCompleted = completionPercentage === 100;

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getStatusColor = () => {
    if (isCompleted) return 'green';
    if ((progress?.completedLessons || 0) > 0 || (progress?.inProgressLessons || 0) > 0) return 'blue';
    return 'purple';
  };

  const difficultyColors = {
    beginner: 'success',
    intermediate: 'warning',
    advanced: 'destructive',
    expert: 'destructive',
  } as const;

  return (
    <DashboardLayout 
      title={learningPath.name}
      subtitle={learningPath.description || ''}
      headerActions={
        <Button asChild variant="outline">
          <Link href="/dashboard">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Path Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-3">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: learningPath.color || '#3B82F6' }}
                    />
                    <CardTitle className="text-xl">{learningPath.name}</CardTitle>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {learningPath.difficultyLevel && (
                      <Badge 
                        variant={difficultyColors[learningPath.difficultyLevel as keyof typeof difficultyColors] || 'secondary'}
                      >
                        {learningPath.difficultyLevel}
                      </Badge>
                    )}
                    {learningPath.targetAudience && (
                      <Badge variant="outline" className="gap-1">
                        <Users className="h-3 w-3" />
                        {learningPath.targetAudience}
                      </Badge>
                    )}
                    {learningPath.estimatedHours && (
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        {learningPath.estimatedHours}h estimated
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {progress?.totalLessons || lessons.length}
                  </div>
                  <div className="text-sm text-gray-600">Total Lessons</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {progress?.completedLessons || 0}
                  </div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {progress?.inProgressLessons || 0}
                  </div>
                  <div className="text-sm text-gray-600">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {progress?.totalTimeSpent ? formatTime(progress.totalTimeSpent) : '0m'}
                  </div>
                  <div className="text-sm text-gray-600">Time Spent</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Overall Progress</span>
                  <span>{progress?.completedLessons || 0}/{progress?.totalLessons || lessons.length} lessons</span>
                </div>
                <Progress value={completionPercentage} className="h-3" />
                <div className="text-center">
                  <span className="text-lg font-semibold text-gray-900">
                    {completionPercentage}% Complete
                  </span>
                </div>
              </div>

              {progress?.nextLessonId && (
                <div className="mt-6 pt-6 border-t">
                  <Button asChild size="lg" className="w-full">
                    <Link href={`/dashboard/lesson/${progress.nextLessonId}`}>
                      <Play className="mr-2 h-5 w-5" />
                      {(progress?.completedLessons || 0) > 0 ? 'Continue Learning' : 'Start Learning'}
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress Circle */}
          <Card>
            <CardContent className="p-6 text-center">
              <ProgressCircle 
                value={completionPercentage}
                size="lg"
                color={getStatusColor()}
                className="mx-auto mb-4"
              />
              <h3 className="font-semibold text-gray-900 mb-2">
                {isCompleted ? 'Path Completed!' : 'Your Progress'}
              </h3>
              <p className="text-sm text-gray-600">
                {isCompleted 
                  ? 'Congratulations on completing this learning path!' 
                  : `${(progress?.totalLessons || lessons.length) - (progress?.completedLessons || 0)} lessons remaining`
                }
              </p>
              {isCompleted && (
                <div className="mt-4">
                  <Badge variant="success" className="gap-1">
                    <Award className="h-3 w-3" />
                    Completed
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lessons List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Lessons ({lessons.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {lessons.map((lesson, index) => {
                const isNext = lesson.id === progress?.nextLessonId;
                // Simple access control: can access if it's the first lesson, if previous lesson is completed, or if already started
                const previousLesson = index > 0 ? lessons[index - 1] : null;
                const canAccess = index === 0 || 
                  (previousLesson?.progress?.[0]?.status === 'completed') ||
                  (lesson.progress?.[0]?.status && lesson.progress[0].status !== 'not_started');
                
                return (
                  <div key={lesson.id} className="p-4">
                    <LessonListItem 
                      lesson={lesson}
                      isLocked={!canAccess}
                      isNext={isNext}
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}