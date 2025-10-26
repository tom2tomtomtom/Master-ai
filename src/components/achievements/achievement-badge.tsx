'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrophyIcon,
  FireIcon,
  BookOpenIcon,
  ClockIcon,
  PencilIcon,
  BookmarkIcon,
  StarIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { TrophyIcon as TrophyIconSolid } from '@heroicons/react/24/solid';

interface AchievementBadgeProps {
  achievement: {
    achievementId: string;
    name: string;
    description: string;
    category: string;
    progress: number;
    threshold: number;
    isCompleted: boolean;
    completedAt?: Date;
    icon?: string;
    color?: string;
    pointsAwarded?: number;
    nextMilestone?: {
      name: string;
      threshold: number;
      remaining: number;
    };
  };
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export default function AchievementBadge({
  achievement,
  showProgress = true,
  size = 'md',
  onClick,
}: AchievementBadgeProps) {
  const getCategoryIcon = (category: string, iconName?: string) => {
    const iconClass = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6';
    
    // Use custom icon if provided
    if (iconName) {
      switch (iconName) {
        case 'trophy':
          return <TrophyIcon className={iconClass} />;
        case 'fire':
          return <FireIcon className={iconClass} />;
        case 'book':
          return <BookOpenIcon className={iconClass} />;
        case 'clock':
          return <ClockIcon className={iconClass} />;
        case 'pencil':
          return <PencilIcon className={iconClass} />;
        case 'bookmark':
          return <BookmarkIcon className={iconClass} />;
        case 'star':
          return <StarIcon className={iconClass} />;
        case 'sparkles':
          return <SparklesIcon className={iconClass} />;
        default:
          break;
      }
    }

    // Fallback to category-based icons
    switch (category) {
      case 'milestone':
        return <TrophyIcon className={iconClass} />;
      case 'streak':
        return <FireIcon className={iconClass} />;
      case 'engagement':
        return <StarIcon className={iconClass} />;
      case 'speed':
        return <SparklesIcon className={iconClass} />;
      case 'special':
        return <StarIcon className={iconClass} />;
      default:
        return <TrophyIcon className={iconClass} />;
    }
  };

  const getCategoryColor = (category: string, customColor?: string) => {
    if (customColor) return customColor;
    
    switch (category) {
      case 'milestone':
        return 'text-yellow-600';
      case 'streak':
        return 'text-orange-600';
      case 'engagement':
        return 'text-blue-600';
      case 'speed':
        return 'text-purple-600';
      case 'special':
        return 'text-pink-600';
      default:
        return 'text-gray-600';
    }
  };

  const getBadgeColor = (category: string) => {
    switch (category) {
      case 'milestone':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'streak':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'engagement':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'speed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'special':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const progressPercentage = Math.min((achievement.progress / achievement.threshold) * 100, 100);
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const cardClass = `
    ${size === 'sm' ? 'p-3' : size === 'lg' ? 'p-6' : 'p-4'}
    transition-all duration-200 hover:shadow-md cursor-pointer
    ${achievement.isCompleted 
      ? 'border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50' 
      : 'hover:border-blue-200'
    }
  `;

  return (
    <Card className={cardClass} onClick={onClick}>
      <CardContent className={size === 'sm' ? 'p-0' : 'p-0'}>
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className={`
                ${size === 'sm' ? 'h-10 w-10' : size === 'lg' ? 'h-16 w-16' : 'h-12 w-12'}
                rounded-full flex items-center justify-center
                ${achievement.isCompleted 
                  ? 'bg-yellow-100 border-2 border-yellow-300' 
                  : 'bg-gray-100 border-2 border-gray-200'
                }
              `}>
                {achievement.isCompleted ? (
                  <TrophyIconSolid className={`${size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6'} text-yellow-600`} />
                ) : (
                  <div className={getCategoryColor(achievement.category, achievement.color)}>
                    {getCategoryIcon(achievement.category, achievement.icon)}
                  </div>
                )}
              </div>
              
              <div className={`flex-1 min-w-0 ${size === 'sm' ? 'space-y-1' : 'space-y-2'}`}>
                <div className="flex items-start justify-between">
                  <h4 className={`font-semibold line-clamp-2 ${
                    size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'
                  }`}>
                    {achievement.name}
                  </h4>
                  {achievement.isCompleted && achievement.pointsAwarded && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      +{achievement.pointsAwarded} pts
                    </Badge>
                  )}
                </div>
                
                <p className={`text-gray-600 line-clamp-2 ${
                  size === 'sm' ? 'text-xs' : 'text-sm'
                }`}>
                  {achievement.description}
                </p>

                <div className="flex items-center space-x-2">
                  <Badge className={getBadgeColor(achievement.category)}>
                    {achievement.category.toUpperCase()}
                  </Badge>
                  {achievement.completedAt && (
                    <span className="text-xs text-gray-500">
                      Earned {formatDate(achievement.completedAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Progress */}
          {showProgress && !achievement.isCompleted && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Progress
                </span>
                <span className="text-sm text-gray-500">
                  {achievement.progress} / {achievement.threshold}
                </span>
              </div>
              
              <Progress value={progressPercentage} className="h-2" />
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  {Math.round(progressPercentage)}% complete
                </span>
                {achievement.nextMilestone && (
                  <span className="text-xs text-blue-600 font-medium">
                    {achievement.nextMilestone.remaining} to go
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Completed State */}
          {achievement.isCompleted && (
            <div className="flex items-center space-x-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
              <TrophyIconSolid className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                Achievement Unlocked!
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}