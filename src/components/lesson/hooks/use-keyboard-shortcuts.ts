import { useEffect } from 'react';

interface UseKeyboardShortcutsProps {
  showNotes: boolean;
  showBookmarks: boolean;
  showSettings: boolean;
  showSearch: boolean;
  progressStatus?: string;
  onToggleNotes: () => void;
  onToggleBookmark: () => void;
  onToggleSettings: () => void;
  onToggleSearch: () => void;
  onMarkCompleted: () => void;
  onClosePanels: () => void;
}

export function useKeyboardShortcuts({
  showNotes,
  showBookmarks,
  showSettings,
  showSearch,
  progressStatus,
  onToggleNotes,
  onToggleBookmark,
  onToggleSettings,
  onToggleSearch,
  onMarkCompleted,
  onClosePanels
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'n':
          if (e.shiftKey) {
            onToggleNotes();
          }
          break;
        case 'b':
          if (e.shiftKey) {
            onToggleBookmark();
          }
          break;
        case 's':
          if (e.shiftKey) {
            onToggleSettings();
          }
          break;
        case 'c':
          if (e.shiftKey && progressStatus !== 'completed') {
            onMarkCompleted();
          }
          break;
        case 'ArrowLeft':
          if (e.metaKey || e.ctrlKey) {
            // Navigate to previous lesson (will be handled by LessonNavigation)
            e.preventDefault();
          }
          break;
        case 'ArrowRight':
          if (e.metaKey || e.ctrlKey) {
            // Navigate to next lesson (will be handled by LessonNavigation)
            e.preventDefault();
          }
          break;
        case 'f':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            onToggleSearch();
          }
          break;
        case 'Escape':
          // Close any open panels
          if (showSearch || showNotes || showBookmarks || showSettings) {
            onClosePanels();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    showNotes,
    showBookmarks,
    showSettings,
    showSearch,
    progressStatus,
    onToggleNotes,
    onToggleBookmark,
    onToggleSettings,
    onToggleSearch,
    onMarkCompleted,
    onClosePanels
  ]);
}