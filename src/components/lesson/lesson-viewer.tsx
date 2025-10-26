'use client';

import { useRef, useEffect } from 'react';
import { LessonHeader } from './lesson-header';
import { LessonContent } from './lesson-content';
import { LessonSidebar } from './lesson-sidebar';
import { NoteTakingPanel } from './note-taking-panel';
import { BookmarkPanel } from './bookmark-panel';
import { LessonSettings } from './lesson-settings';
import { CompletionModal } from './completion-modal';
import { useLessonState } from './hooks/use-lesson-state';
import { useLessonProgress } from './hooks/use-lesson-progress';
import { useKeyboardShortcuts } from './hooks/use-keyboard-shortcuts';

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

interface LessonViewerProps {
  lesson: Lesson;
  pathId?: string;
}

export function LessonViewer({ lesson, pathId }: LessonViewerProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Custom hooks for state management
  const {
    processedContent,
    notes,
    setNotes,
    bookmark,
    setBookmark,
    isLoading,
    showNotes,
    setShowNotes,
    showBookmarks,
    setShowBookmarks,
    showSettings,
    setShowSettings,
    showCompletion,
    setShowCompletion,
    showSearch,
    setShowSearch,
    searchTerm,
    setSearchTerm,
    fontSize,
    setFontSize,
    darkMode,
    setDarkMode,
    toggleBookmark,
    closePanels
  } = useLessonState(lesson);

  const {
    progress,
    readingProgress,
    timeSpent,
    isCompleted,
    markAsCompleted,
    handleScroll
  } = useLessonProgress({
    lessonId: lesson.id,
    onCompletionModalShow: () => setShowCompletion(true)
  });

  // Setup keyboard shortcuts
  useKeyboardShortcuts({
    showNotes,
    showBookmarks,
    showSettings,
    showSearch,
    progressStatus: progress?.status,
    onToggleNotes: () => setShowNotes(!showNotes),
    onToggleBookmark: toggleBookmark,
    onToggleSettings: () => setShowSettings(!showSettings),
    onToggleSearch: () => setShowSearch(!showSearch),
    onMarkCompleted: markAsCompleted,
    onClosePanels: closePanels
  });

  // Attach scroll listener
  useEffect(() => {
    const contentElement = contentRef.current;
    if (contentElement) {
      const scrollHandler = () => handleScroll(contentRef);
      contentElement.addEventListener('scroll', scrollHandler);
      return () => contentElement.removeEventListener('scroll', scrollHandler);
    }
  }, [handleScroll]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <LessonHeader
        lesson={lesson}
        notes={notes}
        bookmark={bookmark}
        readingProgress={readingProgress}
        isCompleted={isCompleted}
        showSearch={showSearch}
        searchTerm={searchTerm}
        onToggleNotes={() => setShowNotes(!showNotes)}
        onToggleBookmark={toggleBookmark}
        onToggleSearch={() => setShowSearch(!showSearch)}
        onToggleSettings={() => setShowSettings(!showSettings)}
        onSearchTermChange={setSearchTerm}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <LessonContent
              ref={contentRef}
              lesson={lesson}
              processedContent={processedContent}
              fontSize={fontSize}
              isCompleted={isCompleted}
              onMarkCompleted={markAsCompleted}
              onScroll={() => handleScroll(contentRef)}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <LessonSidebar
              lessonId={lesson.id}
              pathId={pathId}
              progress={progress}
              readingProgress={readingProgress}
              timeSpent={timeSpent}
            />
          </div>
        </div>
      </div>

      {/* Side Panels */}
      {showNotes && (
        <NoteTakingPanel
          lessonId={lesson.id}
          notes={notes}
          onNotesChange={setNotes}
          onClose={() => setShowNotes(false)}
        />
      )}

      {showBookmarks && (
        <BookmarkPanel
          lessonId={lesson.id}
          bookmark={bookmark}
          onBookmarkChange={setBookmark}
          onClose={() => setShowBookmarks(false)}
        />
      )}

      {showSettings && (
        <LessonSettings
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          darkMode={darkMode}
          onDarkModeChange={setDarkMode}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Completion Modal */}
      {showCompletion && (
        <CompletionModal
          lesson={lesson}
          pathId={pathId}
          onClose={() => setShowCompletion(false)}
        />
      )}
    </div>
  );
}