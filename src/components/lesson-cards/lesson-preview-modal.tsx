'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Clock, Users, Star, BookOpen, Bookmark } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ProgressRing } from '@/components/ui/progress-ring';
import type { LessonWithMetadata } from '@/types/discovery';

interface LessonPreviewModalProps {
  lesson: LessonWithMetadata;
  isOpen: boolean;
  onClose: () => void;
  onStart: () => void;
}

export function LessonPreviewModal({ lesson, isOpen, onClose, onStart }: LessonPreviewModalProps) {
  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'Unknown duration';
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  const progressPercentage = lesson.progress?.progressPercentage || 0;
  
  const handleStart = () => {
    onStart();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="relative">
          {/* Header with gradient background */}
          <div className="bg-gradient-to-br from-ai-blue-500 to-ai-purple-500 -m-6 mb-6 p-8 text-white relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-20 translate-x-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-16 -translate-x-16"></div>
            </div>

            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-xl font-bold">
                    {lesson.lessonNumber}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{lesson.title}</h2>
                    <div className="flex items-center gap-2">
                      {lesson.isFree && (
                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                          Free
                        </Badge>
                      )}
                      {lesson.difficultyLevel && (
                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                          {lesson.difficultyLevel}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress ring */}
                {progressPercentage > 0 && (
                  <div className="flex flex-col items-center gap-2">
                    <ProgressRing
                      value={progressPercentage}
                      size="md"
                      className="text-white"
                      strokeWidth={3}
                    />
                    <span className="text-xs text-white/80">
                      {progressPercentage}% complete
                    </span>
                  </div>
                )}
              </div>

              {/* Quick stats */}
              <div className="flex items-center gap-6 text-white/90">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{formatDuration(lesson.estimatedTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">{lesson.popularity} students</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  <span className="text-sm">{lesson.completionRate}% completion rate</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold mb-3">About this lesson</h3>
              <p className="text-gray-600 leading-relaxed">
                {lesson.description || 'No description available for this lesson.'}
              </p>
            </div>

            {/* Preview content */}
            {lesson.previewContent && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Preview</h3>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed">
                  {lesson.previewContent}
                </div>
              </div>
            )}

            <Separator />

            {/* Categories */}
            {lesson.categories.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {lesson.categories.map((category) => (
                    <Badge 
                      key={category.id} 
                      variant="outline"
                      style={{ borderColor: category.color }}
                      className="flex items-center gap-2"
                    >
                      {category.icon && <span>{category.icon}</span>}
                      {category.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Tools covered */}
            {lesson.tools.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">AI Tools Covered</h3>
                <div className="flex flex-wrap gap-2">
                  {lesson.tools.map((tool) => (
                    <Badge key={tool} variant="secondary" className="flex items-center gap-2">
                      <BookOpen className="w-3 h-3" />
                      {tool}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Learning objectives (placeholder for future enhancement) */}
            <div>
              <h3 className="text-lg font-semibold mb-3">What you'll learn</h3>
              <div className="text-gray-600 space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-ai-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Master the fundamentals and advanced features of {lesson.tools.join(', ') || 'AI tools'}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-ai-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Apply practical techniques to real-world scenarios</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-ai-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Build confidence in using AI tools effectively</p>
                </div>
              </div>
            </div>

            {/* Progress status */}
            {lesson.progress && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-3">Your Progress</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm text-gray-600">{progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div 
                        className="bg-gradient-to-r from-ai-blue-500 to-ai-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Status: <span className="font-medium capitalize">{lesson.progress.status.replace('_', ' ')}</span></span>
                      {lesson.progress.completedAt && (
                        <span>Completed: {new Date(lesson.progress.completedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 mt-8 pt-6 border-t">
            <Button onClick={handleStart} className="flex-1">
              <Play className="w-4 h-4 mr-2" />
              {lesson.progress?.status === 'in_progress' ? 'Continue Learning' : 'Start Lesson'}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close Preview
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}