import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Users, 
  TrendingUp,
  ArrowRight,
  Sparkles,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LessonCardProps {
  lesson: {
    id: string;
    title: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    duration: number;
    category: string;
    tool: string;
    isPremium?: boolean;
  };
  progress?: number;
  isLocked?: boolean;
  index?: number;
}

export function LessonCard({ lesson, progress = 0, isLocked = false, index = 0 }: LessonCardProps) {
  const difficultyColors = {
    beginner: 'from-green-600 to-emerald-600',
    intermediate: 'from-yellow-600 to-orange-600',
    advanced: 'from-red-600 to-pink-600'
  };

  const toolGradients = {
    'ChatGPT': 'from-green-600 to-teal-600',
    'Claude': 'from-purple-600 to-indigo-600',
    'Midjourney': 'from-pink-600 to-purple-600',
    'DALL-E': 'from-blue-600 to-purple-600',
    'Stable Diffusion': 'from-orange-600 to-red-600',
    'Perplexity': 'from-cyan-600 to-blue-600',
    'Gemini': 'from-blue-600 to-indigo-600',
    'Other': 'from-gray-600 to-slate-600'
  };

  const gradient = toolGradients[lesson.tool as keyof typeof toolGradients] || toolGradients.Other;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative"
    >
      <Link href={isLocked ? '#' : `/dashboard/lesson/${lesson.id}`}>
        <div className={cn(
          "relative h-full bg-bg-tertiary/80 backdrop-blur-sm rounded-2xl p-6",
          "border border-border transition-all duration-300",
          "hover:bg-bg-elevated/80 hover:border-purple-500/30 hover:scale-[1.02]",
          "hover:shadow-2xl hover:shadow-purple-500/10",
          isLocked && "opacity-60 cursor-not-allowed"
        )}>
          {/* Gradient accent line */}
          <div className={cn(
            "absolute top-0 left-0 right-0 h-1 rounded-t-2xl",
            `bg-gradient-to-r ${gradient}`,
            "opacity-0 group-hover:opacity-100 transition-opacity"
          )} />

          {/* Premium badge */}
          {lesson.isPremium && (
            <div className="absolute top-4 right-4">
              <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-full">
                <Sparkles className="w-3 h-3 text-white" />
                <span className="text-xs font-semibold text-white">PRO</span>
              </div>
            </div>
          )}

          {/* Tool icon/badge */}
          <div className="flex items-start justify-between mb-4">
            <div className={cn(
              "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium",
              "bg-gradient-to-r text-white",
              gradient
            )}>
              {lesson.tool}
            </div>
          </div>

          {/* Content */}
          <h3 className="text-xl font-semibold text-text-primary mb-2 line-clamp-2 group-hover:text-purple-400 transition-colors">
            {lesson.title}
          </h3>
          
          <p className="text-text-secondary text-sm mb-4 line-clamp-2">
            {lesson.description}
          </p>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-text-tertiary mb-4">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{lesson.duration} min</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span className="capitalize">{lesson.difficulty}</span>
            </div>
          </div>

          {/* Progress bar */}
          {!isLocked && progress > 0 && (
            <div className="relative h-2 bg-bg-primary/50 rounded-full overflow-hidden mb-4">
              <motion.div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, delay: index * 0.1 + 0.3 }}
              />
            </div>
          )}

          {/* CTA */}
          <div className="flex items-center justify-between">
            {isLocked ? (
              <div className="flex items-center gap-2 text-text-tertiary">
                <Lock className="w-4 h-4" />
                <span className="text-sm">Unlock with Pro</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-purple-400 group-hover:text-purple-300 transition-colors">
                <span className="text-sm font-medium">
                  {progress > 0 ? 'Continue' : 'Start'} Lesson
                </span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            )}
          </div>

          {/* Hover effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 to-pink-600/0 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" />
        </div>
      </Link>
    </motion.div>
  );
}