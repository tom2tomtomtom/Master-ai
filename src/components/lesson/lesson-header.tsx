import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  StickyNote, 
  Bookmark, 
  BookmarkCheck, 
  Search, 
  Settings 
} from 'lucide-react';

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

interface LessonNote {
  id: string;
  content: string;
  timestamp: number | null;
  createdAt: string;
  updatedAt: string;
}

interface LessonBookmark {
  id: string;
  title: string | null;
  timestamp: number | null;
  createdAt: string;
}

interface LessonHeaderProps {
  lesson: Lesson;
  notes: LessonNote[];
  bookmark: LessonBookmark | null;
  readingProgress: number;
  isCompleted: boolean;
  showSearch: boolean;
  searchTerm: string;
  onToggleNotes: () => void;
  onToggleBookmark: () => void;
  onToggleSearch: () => void;
  onToggleSettings: () => void;
  onSearchTermChange: (term: string) => void;
}

export function LessonHeader({
  lesson,
  notes,
  bookmark,
  readingProgress,
  isCompleted,
  showSearch,
  searchTerm,
  onToggleNotes,
  onToggleBookmark,
  onToggleSearch,
  onToggleSettings,
  onSearchTermChange
}: LessonHeaderProps) {
  return (
    <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate max-w-md">
              Lesson {lesson.lessonNumber}: {lesson.title}
            </h1>
            {isCompleted && (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleNotes}
              className="hidden md:flex"
            >
              <StickyNote className="h-4 w-4 mr-2" />
              Notes ({notes.length})
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleBookmark}
              className="hidden md:flex"
            >
              {bookmark ? (
                <BookmarkCheck className="h-4 w-4 mr-2 text-blue-600" />
              ) : (
                <Bookmark className="h-4 w-4 mr-2" />
              )}
              {bookmark ? 'Bookmarked' : 'Bookmark'}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSearch}
              className="hidden md:flex"
            >
              <Search className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSettings}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="pb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Reading Progress</span>
            <span>{Math.round(readingProgress)}% Complete</span>
          </div>
          <Progress value={readingProgress} className="h-2" />
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search within this lesson... (This will use browser's built-in search)"
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    // Use browser's native find functionality
                    document.execCommand('find', false, searchTerm);
                  }
                }}
              />
              <div className="absolute right-3 top-3 text-xs text-gray-400">
                Press Enter to search
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}