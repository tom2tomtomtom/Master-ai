'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Search } from 'lucide-react';
import { LessonCard } from './lesson-card';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import type { LessonWithMetadata } from '@/types/discovery';

interface LessonGridProps {
  lessons: LessonWithMetadata[];
  viewMode: 'grid' | 'list';
  isLoading?: boolean;
  onStart?: (lessonId: string) => void;
  onBookmark?: (lessonId: string, isBookmarked: boolean) => void;
  emptyStateText?: string;
  emptyStateAction?: React.ReactNode;
  className?: string;
}

export function LessonGrid({
  lessons,
  viewMode,
  isLoading = false,
  onStart,
  onBookmark,
  emptyStateText = 'No lessons found',
  emptyStateAction,
  className = '',
}: LessonGridProps) {
  // Loading skeleton
  if (isLoading) {
    const skeletonCount = viewMode === 'grid' ? 8 : 6;
    return (
      <div className={`${
        viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6'
          : 'space-y-4'
      } ${className}`}>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <SkeletonCard 
            key={index} 
            variant={viewMode === 'grid' ? 'card' : 'list'}
            animate
          />
        ))}
      </div>
    );
  }

  // Empty state
  if (lessons.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 px-4 text-center"
      >
        <div className="w-24 h-24 bg-gradient-to-br from-ai-blue-100 to-ai-purple-100 rounded-full flex items-center justify-center mb-6">
          <Search className="w-12 h-12 text-ai-blue-500" />
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {emptyStateText}
        </h3>
        
        <p className="text-gray-600 mb-6 max-w-md">
          Try adjusting your search terms or filters to find the lessons you're looking for.
        </p>
        
        {emptyStateAction && (
          <div className="flex justify-center">
            {emptyStateAction}
          </div>
        )}
      </motion.div>
    );
  }

  // Grid layout animations
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className={`space-y-4 ${className}`}
      >
        <AnimatePresence mode="popLayout">
          {lessons.map((lesson) => (
            <motion.div
              key={lesson.id}
              variants={itemVariants}
              layout
              exit={{ opacity: 0, x: -100 }}
            >
              <LessonCard
                lesson={lesson}
                viewMode="list"
                onStart={onStart}
                onBookmark={onBookmark}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    );
  }

  // Grid view - responsive grid that works well on mobile
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 ${className}`}
    >
      <AnimatePresence mode="popLayout">
        {lessons.map((lesson) => (
          <motion.div
            key={lesson.id}
            variants={itemVariants}
            layout
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <LessonCard
              lesson={lesson}
              viewMode="grid"
              onStart={onStart}
              onBookmark={onBookmark}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

// Lesson section component for recommendation sections
interface LessonSectionProps {
  title: string;
  lessons: LessonWithMetadata[];
  viewMode: 'grid' | 'list';
  onStart?: (lessonId: string) => void;
  onBookmark?: (lessonId: string, isBookmarked: boolean) => void;
  onViewAll?: () => void;
  className?: string;
}

export function LessonSection({
  title,
  lessons,
  viewMode,
  onStart,
  onBookmark,
  onViewAll,
  className = '',
}: LessonSectionProps) {
  if (lessons.length === 0) return null;

  return (
    <section className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-ai-blue-500" />
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        </div>
        {onViewAll && (
          <motion.button
            onClick={onViewAll}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-ai-blue-600 hover:text-ai-blue-700 font-medium text-sm transition-colors"
          >
            View All
          </motion.button>
        )}
      </div>

      <LessonGrid
        lessons={lessons}
        viewMode={viewMode}
        onStart={onStart}
        onBookmark={onBookmark}
      />
    </section>
  );
}