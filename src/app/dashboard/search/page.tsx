'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { monitoring } from '@/lib/monitoring';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  BookOpen, 
  Clock, 
  Play,
  ExternalLink,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

interface SearchResult {
  type: 'lesson' | 'learning_path';
  id: string;
  title: string;
  description: string | null;
  lessonNumber?: number;
  estimatedTime?: number | null;
  difficultyLevel?: string | null;
  tools?: string[];
  learningPath?: {
    id: string;
    name: string;
    color: string | null;
  } | null;
  progress?: {
    status: string;
    progressPercentage: number;
    completedAt: string | null;
  } | null;
  color?: string | null;
  estimatedHours?: number | null;
  totalLessons?: number;
  completedLessons?: number;
  completionPercentage?: number;
}

// Custom hook for debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    const performSearch = async () => {
      if (debouncedSearchQuery.length < 2) {
        setResults([]);
        setHasSearched(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/dashboard/search?q=${encodeURIComponent(debouncedSearchQuery)}`);
        
        if (response.ok) {
          const data = await response.json();
          setResults(data);
          setHasSearched(true);
        }
      } catch (error) {
        monitoring.logError('dashboard_search_error', error, { query: debouncedSearchQuery });
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedSearchQuery]);

  const getStatusBadge = (progress: SearchResult['progress']) => {
    if (!progress) {
      return <Badge variant="outline">Not Started</Badge>;
    }
    
    switch (progress.status) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'in_progress':
        return <Badge variant="warning">In Progress</Badge>;
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

  const difficultyColors = {
    beginner: 'success',
    intermediate: 'warning',
    advanced: 'destructive',
    expert: 'destructive',
  } as const;

  const renderLessonResult = (result: SearchResult) => (
    <Card key={result.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-blue-600" />
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                Lesson {result.lessonNumber}
              </span>
              {result.learningPath && (
                <div className="flex items-center gap-1">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: result.learningPath.color || '#3B82F6' }}
                  />
                  <span className="text-xs text-gray-600">
                    {result.learningPath.name}
                  </span>
                </div>
              )}
              {result.progress && getStatusBadge(result.progress)}
            </div>
            
            <h3 className="font-semibold text-lg text-gray-900 mb-2">
              {result.title}
            </h3>
            
            {result.description && (
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {result.description}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {result.estimatedTime && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {result.estimatedTime} min
                </Badge>
              )}
              {result.difficultyLevel && (
                <Badge 
                  variant={difficultyColors[result.difficultyLevel as keyof typeof difficultyColors] || 'secondary'}
                  className="text-xs"
                >
                  {result.difficultyLevel}
                </Badge>
              )}
              {result.tools?.slice(0, 2).map((tool) => (
                <Badge key={tool} variant="secondary" className="text-xs">
                  {tool}
                </Badge>
              ))}
              {(result.tools?.length || 0) > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{(result.tools?.length || 0) - 2} more
                </Badge>
              )}
            </div>
          </div>

          <div className="ml-4">
            <Button asChild size="sm">
              <Link href={`/dashboard/lesson/${result.id}`}>
                <Play className="mr-2 h-4 w-4" />
                View Lesson
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderLearningPathResult = (result: SearchResult) => (
    <Card key={result.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: result.color || '#3B82F6' }}
              />
              <span className="text-sm font-medium text-gray-600">Learning Path</span>
              {result.difficultyLevel && (
                <Badge 
                  variant={difficultyColors[result.difficultyLevel as keyof typeof difficultyColors] || 'secondary'}
                  className="text-xs"
                >
                  {result.difficultyLevel}
                </Badge>
              )}
            </div>
            
            <h3 className="font-semibold text-lg text-gray-900 mb-2">
              {result.title}
            </h3>
            
            {result.description && (
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {result.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                <span>{result.totalLessons} lessons</span>
              </div>
              {result.estimatedHours && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{result.estimatedHours}h</span>
                </div>
              )}
              {(result.completionPercentage || 0) > 0 && (
                <div className="text-green-600">
                  {result.completionPercentage}% complete
                </div>
              )}
            </div>
          </div>

          <div className="ml-4">
            <Button asChild size="sm">
              <Link href={`/dashboard/path/${result.id}`}>
                <ExternalLink className="mr-2 h-4 w-4" />
                View Path
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout 
      title="Search"
      subtitle="Find lessons and learning paths"
    >
      <div className="space-y-6">
        {/* Search Input */}
        <Card>
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              {loading && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
              )}
              <Input
                placeholder="Search for lessons, learning paths, or AI tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 text-lg h-12"
                autoFocus
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Type at least 2 characters to search
            </p>
          </CardContent>
        </Card>

        {/* Search Results */}
        <div className="space-y-4">
          {loading && searchQuery.length >= 2 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Searching...</p>
              </CardContent>
            </Card>
          )}

          {!loading && hasSearched && results.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No results found
                </h3>
                <p className="text-gray-600">
                  Try searching with different keywords or check your spelling.
                </p>
              </CardContent>
            </Card>
          )}

          {!loading && !hasSearched && searchQuery.length < 2 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Start searching
                </h3>
                <p className="text-gray-600 mb-4">
                  Search for lessons by title, description, AI tools, or browse learning paths.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Badge variant="outline" className="cursor-pointer" onClick={() => setSearchQuery('ChatGPT')}>
                    ChatGPT
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer" onClick={() => setSearchQuery('Claude')}>
                    Claude
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer" onClick={() => setSearchQuery('beginner')}>
                    Beginner
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer" onClick={() => setSearchQuery('prompting')}>
                    Prompting
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {!loading && results.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Search Results ({results.length})
                </h2>
              </div>

              {results.map((result) => 
                result.type === 'lesson' 
                  ? renderLessonResult(result)
                  : renderLearningPathResult(result)
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}