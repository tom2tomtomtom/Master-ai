'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Bookmark, 
  BookOpen, 
  Clock, 
  Play,
  Search,
  Calendar,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface BookmarkData {
  id: string;
  title: string | null;
  timestamp: number | null;
  createdAt: string;
  lesson: {
    id: string;
    lessonNumber: number;
    title: string;
    description: string | null;
    estimatedTime: number | null;
    difficultyLevel: string | null;
    tools: string[];
    learningPath: {
      id: string;
      name: string;
      color: string | null;
    } | null;
    progress: {
      status: string;
      progressPercentage: number;
      completedAt: string | null;
    } | null;
  };
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>([]);
  const [filteredBookmarks, setFilteredBookmarks] = useState<BookmarkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/bookmarks');
        
        if (response.ok) {
          const data = await response.json();
          setBookmarks(data);
          setFilteredBookmarks(data);
        }
      } catch (error) {
        // Log error with context using structured logging
        if (typeof window !== 'undefined') {
          // Client-side error logging
          const { clientLogger } = await import('@/lib/client-logger');
          clientLogger.logError('Failed to fetch bookmarks', error, {
            component: 'BookmarksPage',
            action: 'fetchBookmarks'
          });
        }
        console.error('Error fetching bookmarks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = bookmarks.filter(bookmark =>
        bookmark.lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.lesson.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.lesson.learningPath?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.lesson.tools.some(tool => tool.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredBookmarks(filtered);
    } else {
      setFilteredBookmarks(bookmarks);
    }
  }, [bookmarks, searchQuery]);

  const formatTimestamp = (timestamp: number | null) => {
    if (!timestamp) return null;
    const hours = Math.floor(timestamp / 3600);
    const minutes = Math.floor((timestamp % 3600) / 60);
    const seconds = timestamp % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (progress: BookmarkData['lesson']['progress']) => {
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

  if (loading) {
    return (
      <DashboardLayout title="Bookmarks">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-full mb-4"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded mb-4"></div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Bookmarks"
      subtitle={`${bookmarks.length} saved lessons for quick access`}
    >
      <div className="space-y-6">
        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search bookmarks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Bookmarks List */}
        <div className="space-y-4">
          {filteredBookmarks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bookmark className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {bookmarks.length === 0 ? 'No bookmarks yet' : 'No bookmarks found'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {bookmarks.length === 0 
                    ? 'Bookmark lessons to save them for quick access later.'
                    : 'Try adjusting your search terms to find bookmarks.'
                  }
                </p>
                {bookmarks.length === 0 && (
                  <Button asChild>
                    <Link href="/dashboard">
                      Explore Lessons
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredBookmarks.map((bookmark) => (
              <Card key={bookmark.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                          Lesson {bookmark.lesson.lessonNumber}
                        </span>
                        {bookmark.lesson.learningPath && (
                          <div className="flex items-center gap-1">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: bookmark.lesson.learningPath.color || '#3B82F6' }}
                            />
                            <span className="text-xs text-gray-600">
                              {bookmark.lesson.learningPath.name}
                            </span>
                          </div>
                        )}
                        {getStatusBadge(bookmark.lesson.progress)}
                      </div>
                      
                      <h3 className="font-semibold text-lg text-gray-900 mb-2">
                        {bookmark.lesson.title}
                      </h3>
                      
                      {bookmark.lesson.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {bookmark.lesson.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2 mb-3">
                        {bookmark.lesson.estimatedTime && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {bookmark.lesson.estimatedTime} min
                          </Badge>
                        )}
                        {bookmark.lesson.difficultyLevel && (
                          <Badge 
                            variant={difficultyColors[bookmark.lesson.difficultyLevel as keyof typeof difficultyColors] || 'secondary'}
                            className="text-xs"
                          >
                            {bookmark.lesson.difficultyLevel}
                          </Badge>
                        )}
                        {(bookmark.lesson.tools || []).slice(0, 2).map((tool) => (
                          <Badge key={tool} variant="secondary" className="text-xs">
                            {tool}
                          </Badge>
                        ))}
                        {bookmark.lesson.tools.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{bookmark.lesson.tools.length - 2} more
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Bookmarked {formatDistanceToNow(new Date(bookmark.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        {bookmark.timestamp && (
                          <div className="flex items-center gap-1">
                            <Play className="h-3 w-3" />
                            <span>at {formatTimestamp(bookmark.timestamp)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="ml-4 flex flex-col gap-2">
                      <Button asChild size="sm">
                        <Link href={`/dashboard/lesson/${bookmark.lesson.id}`}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Lesson
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}