'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  X, 
  Bookmark, 
  BookmarkCheck, 
  Edit3, 
  Save,
  Calendar
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface LessonBookmark {
  id: string;
  title: string | null;
  timestamp: number | null;
  createdAt: string;
}

interface BookmarkPanelProps {
  lessonId: string;
  bookmark: LessonBookmark | null;
  onBookmarkChange: (bookmark: LessonBookmark | null) => void;
  onClose: () => void;
}

export function BookmarkPanel({ 
  lessonId, 
  bookmark, 
  onBookmarkChange, 
  onClose 
}: BookmarkPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(bookmark?.title || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createBookmark = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/lessons/${lessonId}/bookmark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editTitle.trim() || null,
        }),
      });

      if (response.ok) {
        const createdBookmark = await response.json();
        onBookmarkChange(createdBookmark);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error creating bookmark:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateBookmark = async () => {
    if (!bookmark || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/lessons/${lessonId}/bookmark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editTitle.trim() || null,
        }),
      });

      if (response.ok) {
        const updatedBookmark = await response.json();
        onBookmarkChange(updatedBookmark);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating bookmark:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteBookmark = async () => {
    if (!bookmark || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/lessons/${lessonId}/bookmark`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onBookmarkChange(null);
      }
    } catch (error) {
      console.error('Error deleting bookmark:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = () => {
    setIsEditing(true);
    setEditTitle(bookmark?.title || '');
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditTitle(bookmark?.title || '');
  };

  const handleSubmit = () => {
    if (bookmark) {
      updateBookmark();
    } else {
      createBookmark();
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white dark:bg-gray-800 shadow-xl border-l border-gray-200 dark:border-gray-700 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          {bookmark ? (
            <BookmarkCheck className="h-5 w-5 text-blue-600" />
          ) : (
            <Bookmark className="h-5 w-5 text-gray-400" />
          )}
          <h2 className="font-semibold">Bookmark</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        {bookmark ? (
          <Card className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Bookmarked {formatDistanceToNow(new Date(bookmark.createdAt), { addSuffix: true })}
                  </span>
                </div>
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={startEditing}
                    disabled={isSubmitting}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Bookmark Title (Optional)
                    </label>
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Add a custom title for this bookmark..."
                      className="w-full"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={cancelEditing}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                    >
                      <Save className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  {bookmark.title ? (
                    <div>
                      <h3 className="font-medium text-sm mb-2">Custom Title</h3>
                      <p className="text-gray-700 dark:text-gray-300">
                        {bookmark.title}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-sm italic">
                      No custom title set
                    </p>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={deleteBookmark}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  Remove Bookmark
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="text-center py-8">
              <Bookmark className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                Bookmark This Lesson
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Save this lesson to easily find it later in your bookmarks
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Bookmark Title (Optional)
                </label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Add a custom title for this bookmark..."
                  className="w-full"
                />
              </div>
              
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full"
              >
                <Bookmark className="h-4 w-4 mr-2" />
                Add Bookmark
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Bookmarks help you quickly return to important lessons
        </p>
      </div>
    </div>
  );
}