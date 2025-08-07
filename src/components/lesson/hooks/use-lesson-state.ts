import { useState, useEffect, useRef } from 'react';
import { processMarkdown } from '@/lib/markdown';
import { monitoring } from '@/lib/monitoring';

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

export function useLessonState(lesson: Lesson) {
  const [processedContent, setProcessedContent] = useState<string>('');
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [bookmark, setBookmark] = useState<LessonBookmark | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI State
  const [showNotes, setShowNotes] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Settings
  const [fontSize, setFontSize] = useState(16);
  const [darkMode, setDarkMode] = useState(false);

  // Initialize lesson content and data
  useEffect(() => {
    const initializeLesson = async () => {
      try {
        setIsLoading(true);
        
        // Process markdown content
        const processed = await processMarkdown(lesson.content);
        setProcessedContent(processed);
        
        // Load notes and bookmark
        await Promise.all([
          loadNotes(),
          loadBookmark()
        ]);
        
      } catch (error) {
        monitoring.logError('lesson_viewer_init_error', error, {
          lessonId: lesson.id
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeLesson();
  }, [lesson.id, lesson.content]);

  const loadNotes = async () => {
    try {
      const response = await fetch(`/api/lessons/${lesson.id}/notes`);
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const loadBookmark = async () => {
    try {
      const response = await fetch(`/api/lessons/${lesson.id}/bookmark`);
      if (response.ok) {
        const data = await response.json();
        setBookmark(data);
      }
    } catch (error) {
      console.error('Error loading bookmark:', error);
    }
  };

  const toggleBookmark = async () => {
    try {
      if (bookmark) {
        // Remove bookmark
        await fetch(`/api/lessons/${lesson.id}/bookmark`, {
          method: 'DELETE',
        });
        setBookmark(null);
      } else {
        // Add bookmark
        const response = await fetch(`/api/lessons/${lesson.id}/bookmark`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: lesson.title,
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          setBookmark(data);
        }
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  // Panel controls
  const closePanels = () => {
    setShowSearch(false);
    setShowNotes(false);
    setShowBookmarks(false);
    setShowSettings(false);
  };

  return {
    // Content state
    processedContent,
    notes,
    setNotes,
    bookmark,
    setBookmark,
    isLoading,
    
    // UI state
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
    
    // Settings
    fontSize,
    setFontSize,
    darkMode,
    setDarkMode,
    
    // Actions
    toggleBookmark,
    closePanels,
    loadNotes
  };
}