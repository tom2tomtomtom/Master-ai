'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Users, Star, BookOpen, Play, Bookmark, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { ProgressRing } from '@/components/ui/progress-ring';
import type { LessonWithMetadata } from '@/types/discovery';
import { LessonPreviewModal } from './lesson-preview-modal';
import { useInteractionTracking } from '@/hooks/use-interaction-tracking';

interface LessonCardProps {
  lesson: LessonWithMetadata;
  viewMode: 'grid' | 'list';
  onStart?: (lessonId: string) => void;
  onBookmark?: (lessonId: string, isBookmarked: boolean) => void;
  className?: string;
}

export function LessonCard({ lesson, viewMode, onStart, onBookmark, className = '' }: LessonCardProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(lesson.isBookmarked);
  const { trackInteraction } = useInteractionTracking();

  const handlePreview = async () => {
    setIsPreviewOpen(true);
    await trackInteraction({
      lessonId: lesson.id,
      interactionType: 'preview',
      metadata: { source: 'lesson_card' }
    });
  };

  const handleStart = async () => {
    await trackInteraction({
      lessonId: lesson.id,
      interactionType: 'start',
      metadata: { source: 'lesson_card' }
    });
    onStart?.(lesson.id);
  };

  const handleBookmark = async () => {
    const newBookmarkState = !isBookmarked;
    setIsBookmarked(newBookmarkState);
    
    await trackInteraction({
      lessonId: lesson.id,
      interactionType: 'bookmark',
      metadata: { source: 'lesson_card', bookmarked: newBookmarkState }
    });
    
    onBookmark?.(lesson.id, newBookmarkState);
  };

  const handleView = async () => {
    await trackInteraction({
      lessonId: lesson.id,
      interactionType: 'view',
      metadata: { source: 'lesson_card' }
    });
  };

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'in_progress': return 'text-blue-600';
      default: return 'text-gray-400';
    }
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'Unknown';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const progressPercentage = lesson.progress?.progressPercentage || 0;

  if (viewMode === 'list') {
    return (
      <>
        <motion.div
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          whileHover={{ y: -2 }}
          className={`group relative bg-white rounded-xl border border-gray-200 hover:border-ai-blue-300 hover:shadow-lg transition-all duration-300 overflow-hidden ${className}`}
        >
          {/* Progress bar overlay */}
          {progressPercentage > 0 && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100">
              <div 
                className="h-full bg-gradient-to-r from-ai-blue-500 to-ai-purple-500 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          )}

          <div className="p-6 flex items-center gap-6">
            {/* Lesson number and status indicator */}
            <div className="flex-shrink-0 relative">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-ai-blue-500 to-ai-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                {lesson.lessonNumber}
              </div>
              {lesson.progress && (
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(lesson.progress.status)}`}>
                  {lesson.progress.status === 'completed' ? (
                    <div className="w-full h-full bg-green-500 rounded-full"></div>
                  ) : lesson.progress.status === 'in_progress' ? (
                    <div className="w-full h-full bg-blue-500 rounded-full"></div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-xl font-semibold text-gray-900 group-hover:text-ai-blue-600 transition-colors line-clamp-1">
                  {lesson.title}
                </h3>
                <div className="flex items-center gap-2 ml-4">
                  {lesson.isFree && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                      Free
                    </Badge>
                  )}
                  {lesson.difficultyLevel && (
                    <Badge variant="outline" className={getDifficultyColor(lesson.difficultyLevel)}>
                      {lesson.difficultyLevel}
                    </Badge>
                  )}
                </div>
              </div>

              <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                {lesson.description}
              </p>

              {/* Categories and tools */}
              <div className="flex items-center gap-4 mb-3">
                {lesson.categories.length > 0 && (
                  <div className="flex items-center gap-2">
                    {lesson.categories.slice(0, 2).map((category) => (
                      <Badge 
                        key={category.id} 
                        variant="outline"
                        className="text-xs"
                        style={{ borderColor: category.color }}
                      >
                        {category.name}
                      </Badge>
                    ))}
                    {lesson.categories.length > 2 && (
                      <Badge variant="outline" className="text-xs text-gray-500">
                        +{lesson.categories.length - 2} more
                      </Badge>
                    )}
                  </div>
                )}

                {lesson.tools.length > 0 && (
                  <div className="flex items-center gap-2">
                    {lesson.tools.slice(0, 3).map((tool) => (
                      <Badge key={tool} variant="secondary" className="text-xs">
                        {tool}
                      </Badge>
                    ))}
                    {lesson.tools.length > 3 && (
                      <Badge variant="secondary" className="text-xs text-gray-500">
                        +{lesson.tools.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDuration(lesson.estimatedTime)}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {lesson.popularity} students
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  {lesson.completionRate}% completion
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreview}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBookmark}
                className={`transition-colors ${isBookmarked ? 'text-yellow-600 hover:text-yellow-700' : 'text-gray-400 hover:text-yellow-600'}`}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </Button>
              <Button onClick={handleStart} size="sm">
                <Play className="w-4 h-4 mr-2" />
                {lesson.progress?.status === 'in_progress' ? 'Continue' : 'Start'}
              </Button>
            </div>
          </div>
        </motion.div>

        <LessonPreviewModal
          lesson={lesson}
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          onStart={handleStart}
        />
      </>
    );
  }

  // Grid view
  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ y: -8, scale: 1.02 }}
        className={`group relative ${className}`}
      >
        <Card className="h-full bg-white/80 backdrop-blur-sm border border-gray-200 hover:border-ai-blue-300 hover:shadow-xl transition-all duration-300 overflow-hidden">
          {/* Header with lesson number and bookmark */}
          <CardHeader className="relative p-0">
            <div className="bg-gradient-to-br from-ai-blue-500 to-ai-purple-500 p-6 text-white relative overflow-hidden">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
              </div>

              <div className="relative flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-lg font-bold">
                    {lesson.lessonNumber}
                  </div>
                  {lesson.isFree && (
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      Free
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBookmark}
                  className={`text-white hover:bg-white/20 ${isBookmarked ? 'text-yellow-300' : ''}`}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                </Button>
              </div>

              <h3 className="text-lg font-semibold line-clamp-2 mb-2">
                {lesson.title}
              </h3>

              {/* Progress ring */}
              {progressPercentage > 0 && (
                <div className="absolute top-4 right-4">
                  <ProgressRing
                    value={progressPercentage}
                    size="sm"
                    className="text-white"
                    strokeWidth={3}
                  />
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-6 flex-1">
            <p className="text-gray-600 text-sm line-clamp-3 mb-4">
              {lesson.description}
            </p>

            {/* Categories */}
            {lesson.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {lesson.categories.slice(0, 2).map((category) => (
                  <Badge 
                    key={category.id} 
                    variant="outline"
                    className="text-xs"
                    style={{ borderColor: category.color }}
                  >
                    {category.name}
                  </Badge>
                ))}
                {lesson.categories.length > 2 && (
                  <Badge variant="outline" className="text-xs text-gray-500">
                    +{lesson.categories.length - 2}
                  </Badge>
                )}
              </div>
            )}

            {/* Tools */}
            {lesson.tools.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {lesson.tools.slice(0, 3).map((tool) => (
                  <Badge key={tool} variant="secondary" className="text-xs">
                    {tool}
                  </Badge>
                ))}
                {lesson.tools.length > 3 && (
                  <Badge variant="secondary" className="text-xs text-gray-500">
                    +{lesson.tools.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Metadata */}
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDuration(lesson.estimatedTime)}
                </div>
                {lesson.difficultyLevel && (
                  <Badge variant="outline" className={getDifficultyColor(lesson.difficultyLevel)}>
                    {lesson.difficultyLevel}
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {lesson.popularity}
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  {lesson.completionRate}%
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-6 pt-0 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
              className="flex-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button onClick={handleStart} size="sm" className="flex-1">
              <Play className="w-4 h-4 mr-2" />
              {lesson.progress?.status === 'in_progress' ? 'Continue' : 'Start'}
            </Button>
          </CardFooter>

          {/* Status indicator */}
          {lesson.progress && (
            <div className={`absolute top-2 left-2 w-3 h-3 rounded-full border-2 border-white ${
              lesson.progress.status === 'completed' ? 'bg-green-500' :
              lesson.progress.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400'
            }`} />
          )}
        </Card>
      </motion.div>

      <LessonPreviewModal
        lesson={lesson}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onStart={handleStart}
      />
    </>
  );
}