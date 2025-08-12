import { forwardRef } from 'react';
import DOMPurify from 'dompurify';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  PlayCircle, 
  CheckCircle2, 
  Printer, 
  Share2 
} from 'lucide-react';
import { estimateReadingTime } from '@/lib/markdown';

interface Lesson {
  id: string;
  lessonNumber: number;
  title: string;
  description: string | null;
  content: string;
  videoUrl: string | null;
  videoDuration: number | null;
  estimatedTime: number | null;
  difficultyLevel: string | null;
  tools: string[];
  isPublished: boolean;
  isFree: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LessonContentProps {
  lesson: Lesson;
  processedContent: string;
  fontSize: number;
  isCompleted: boolean;
  onMarkCompleted: () => void;
  onScroll: () => void;
}

export const LessonContent = forwardRef<HTMLDivElement, LessonContentProps>(
  ({ lesson, processedContent, fontSize, isCompleted, onMarkCompleted, onScroll }, ref) => {
    const estimatedReadingTime = estimateReadingTime(lesson.content);

    return (
      <Card className="p-8">
        {/* Lesson Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge variant="secondary">
              Lesson {lesson.lessonNumber}
            </Badge>
            {lesson.difficultyLevel && (
              <Badge variant="outline">
                {lesson.difficultyLevel}
              </Badge>
            )}
            <Badge variant="outline">
              <Clock className="h-3 w-3 mr-1" />
              {lesson.estimatedTime || estimatedReadingTime} min
            </Badge>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {lesson.title}
          </h1>
          
          {lesson.description && (
            <p className="text-lg text-gray-800 mb-6">
              {lesson.description}
            </p>
          )}

          {lesson.tools.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {lesson.tools.map((tool) => (
                <Badge key={tool} variant="default">
                  {tool}
                </Badge>
              ))}
            </div>
          )}

          <Separator className="mb-8" />
        </div>

        {/* Video Player */}
        {lesson.videoUrl && (
          <div className="mb-8">
            <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <PlayCircle className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-700">
                  Video content will be integrated here
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Lesson Content */}
        <div
          ref={ref}
          className="overflow-y-auto"
          style={{ 
            fontSize: `${fontSize}px`, 
            lineHeight: 1.7
          }}
          onScroll={onScroll}
        >
          <div 
            className="lesson-text-content"
            style={{
              color: '#1f2937',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
            dangerouslySetInnerHTML={{ 
              __html: DOMPurify.sanitize(processedContent).replace(
                /style="[^"]*color[^"]*"/g, 
                'style="color: #1f2937 !important"'
              )
            }}
          />
        </div>

        {/* Lesson Actions */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            {!isCompleted ? (
              <Button onClick={onMarkCompleted} className="w-full sm:w-auto">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark as Completed
              </Button>
            ) : (
              <div className="flex items-center text-green-600">
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Lesson Completed
              </div>
            )}
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Keyboard Shortcuts Help */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="font-medium text-sm mb-3">Keyboard Shortcuts</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Toggle Notes</span>
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Shift + N</kbd>
              </div>
              <div className="flex justify-between">
                <span>Toggle Bookmark</span>
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Shift + B</kbd>
              </div>
              <div className="flex justify-between">
                <span>Settings</span>
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Shift + S</kbd>
              </div>
              <div className="flex justify-between">
                <span>Mark Complete</span>
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Shift + C</kbd>
              </div>
              <div className="flex justify-between">
                <span>Search in Lesson</span>
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl/Cmd + F</kbd>
              </div>
              <div className="flex justify-between">
                <span>Close Panels</span>
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Esc</kbd>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }
);

LessonContent.displayName = 'LessonContent';