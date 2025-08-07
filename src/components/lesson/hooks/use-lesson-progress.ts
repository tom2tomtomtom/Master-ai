import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { calculateReadingProgress } from '@/lib/markdown';

interface UserProgress {
  id: string;
  progressPercentage: number;
  timeSpentMinutes: number;
  status: 'not_started' | 'in_progress' | 'completed';
  lastAccessed: string | null;
  completedAt: string | null;
}

interface UseLessonProgressProps {
  lessonId: string;
  onCompletionModalShow: () => void;
}

export function useLessonProgress({ lessonId, onCompletionModalShow }: UseLessonProgressProps) {
  const { data: session } = useSession();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);

  const progressUpdateTimeoutRef = useRef<NodeJS.Timeout>();
  const timeTrackingIntervalRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<number>(Date.now());

  // Initialize progress tracking
  useEffect(() => {
    loadProgress();
    
    // Start time tracking
    startTimeRef.current = Date.now();
    timeTrackingIntervalRef.current = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 60000); // Update every minute

    return () => {
      if (progressUpdateTimeoutRef.current) {
        clearTimeout(progressUpdateTimeoutRef.current);
      }
      if (timeTrackingIntervalRef.current) {
        clearInterval(timeTrackingIntervalRef.current);
      }
      // Save final progress on unmount
      saveProgressUpdate();
    };
  }, [lessonId]);

  const loadProgress = async () => {
    try {
      const response = await fetch(`/api/lessons/${lessonId}/progress`);
      if (response.ok) {
        const data = await response.json();
        setProgress(data);
        setReadingProgress(data.progressPercentage);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const updateProgress = async (progressPercentage: number) => {
    if (!session?.user?.id) return;

    try {
      const currentTimeSpent = Math.floor((Date.now() - startTimeRef.current) / 60000);
      
      await fetch(`/api/lessons/${lessonId}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          progressPercentage,
          timeSpentMinutes: (progress?.timeSpentMinutes || 0) + currentTimeSpent,
        }),
      });
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const saveProgressUpdate = () => {
    if (readingProgress > 0) {
      updateProgress(readingProgress);
    }
  };

  const markAsCompleted = async () => {
    try {
      const response = await fetch(`/api/lessons/${lessonId}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          progressPercentage: 100,
          status: 'completed',
          completedAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        await loadProgress();
        onCompletionModalShow();
      }
    } catch (error) {
      console.error('Error marking lesson as completed:', error);
    }
  };

  // Handle scroll for progress tracking
  const handleScroll = useCallback((contentRef: React.RefObject<HTMLDivElement>) => {
    if (!contentRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    const newProgress = calculateReadingProgress(scrollTop, scrollHeight, clientHeight);
    
    setReadingProgress(newProgress);

    // Debounce progress updates
    if (progressUpdateTimeoutRef.current) {
      clearTimeout(progressUpdateTimeoutRef.current);
    }
    
    progressUpdateTimeoutRef.current = setTimeout(() => {
      updateProgress(newProgress);
    }, 2000);
  }, []);

  const isCompleted = progress?.status === 'completed';

  return {
    progress,
    readingProgress,
    timeSpent,
    isCompleted,
    markAsCompleted,
    handleScroll,
    saveProgressUpdate
  };
}