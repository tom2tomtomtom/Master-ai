import { Card } from '@/components/ui/card';
import { LessonNavigation } from './lesson-navigation';

interface UserProgress {
  id: string;
  progressPercentage: number;
  timeSpentMinutes: number;
  status: 'not_started' | 'in_progress' | 'completed';
  lastAccessed: string | null;
  completedAt: string | null;
}

interface LessonSidebarProps {
  lessonId: string;
  pathId?: string;
  progress: UserProgress | null;
  readingProgress: number;
  timeSpent: number;
}

export function LessonSidebar({ 
  lessonId, 
  pathId, 
  progress, 
  readingProgress, 
  timeSpent 
}: LessonSidebarProps) {
  return (
    <div className="space-y-6">
      <LessonNavigation lessonId={lessonId} pathId={pathId} />
      
      {/* Quick Stats */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4 text-card-foreground">Your Progress</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-card-foreground/70">Status</span>
            <span className="font-medium text-card-foreground">
              {progress?.status === 'completed' ? 'Completed' :
               progress?.status === 'in_progress' ? 'In Progress' : 'Not Started'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-card-foreground/70">Time Spent</span>
            <span className="font-medium text-card-foreground">
              {Math.floor((progress?.timeSpentMinutes || 0) + timeSpent)} min
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-card-foreground/70">Progress</span>
            <span className="font-medium text-card-foreground">{Math.round(readingProgress)}%</span>
          </div>
        </div>
      </Card>
    </div>
  );
}