'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  XMarkIcon,
  TrophyIcon,
  AcademicCapIcon,
  ShareIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { TrophyIcon as TrophyIconSolid } from '@heroicons/react/24/solid';

interface Achievement {
  id: string;
  achievementId: string;
  name: string;
  description: string;
  category: string;
  badgeImageUrl?: string;
  pointsAwarded: number;
  earnedAt: Date;
}

interface Certificate {
  id: string;
  name: string;
  description?: string;
  type: string;
  verificationCode: string;
}

interface AchievementNotificationProps {
  achievements?: Achievement[];
  certificates?: Certificate[];
  onDismiss: () => void;
  onViewAchievement?: (achievementId: string) => void;
  onViewCertificate?: (certificateId: string) => void;
  onShare?: (item: Achievement | Certificate, type: 'achievement' | 'certificate') => void;
}

export default function AchievementNotification({
  achievements = [],
  certificates = [],
  onDismiss,
  onViewAchievement,
  onViewCertificate,
  onShare,
}: AchievementNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const totalItems = achievements.length + certificates.length;
  const allItems = [
    ...achievements.map(a => ({ ...a, type: 'achievement' as const })),
    ...certificates.map(c => ({ ...c, type: 'certificate' as const })),
  ];

  useEffect(() => {
    if (totalItems === 0) {
      onDismiss();
      return;
    }

    // Auto-advance through multiple items
    if (totalItems > 1) {
      const timer = setTimeout(() => {
        if (currentIndex < totalItems - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          // Auto-dismiss after showing all items
          setTimeout(() => {
            handleDismiss();
          }, 3000);
        }
      }, 4000);

      return () => clearTimeout(timer);
    } else {
      // Auto-dismiss single item after 5 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [currentIndex, totalItems, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  if (totalItems === 0 || !isVisible) return null;

  const currentItem = allItems[currentIndex];
  const isAchievement = currentItem.type === 'achievement';

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-right duration-300">
      <Card className={`border-2 shadow-2xl ${
        isAchievement 
          ? 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50' 
          : 'border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50'
      }`}>
        <CardContent className="p-6">
          {/* Close Button */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-2">
              {isAchievement ? (
                <TrophyIconSolid className="h-6 w-6 text-yellow-600" />
              ) : (
                <AcademicCapIcon className="h-6 w-6 text-blue-600" />
              )}
              <h3 className={`font-bold text-lg ${
                isAchievement ? 'text-yellow-800' : 'text-blue-800'
              }`}>
                {isAchievement ? 'Achievement Unlocked!' : 'Certificate Earned!'}
              </h3>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0 rounded-full hover:bg-gray-200"
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Achievement/Certificate Content */}
          <div className="space-y-4">
            {/* Icon/Badge */}
            <div className="flex items-center space-x-4">
              <div className={`h-16 w-16 rounded-full flex items-center justify-center border-2 ${
                isAchievement 
                  ? 'bg-yellow-100 border-yellow-300' 
                  : 'bg-blue-100 border-blue-300'
              }`}>
                {isAchievement ? (
                  <TrophyIconSolid className="h-8 w-8 text-yellow-600" />
                ) : (
                  <AcademicCapIcon className="h-8 w-8 text-blue-600" />
                )}
              </div>
              
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-lg">
                  {currentItem.name}
                </h4>
                <p className="text-gray-600 text-sm line-clamp-2">
                  {currentItem.description}
                </p>
                
                <div className="flex items-center space-x-2 mt-2">
                  {isAchievement && (currentItem as Achievement).pointsAwarded > 0 && (
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      +{(currentItem as Achievement).pointsAwarded} points
                    </Badge>
                  )}
                  
                  {!isAchievement && (
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      {(currentItem as Certificate).type.replace('_', ' ').toUpperCase()}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Verification Code for Certificates */}
            {!isAchievement && (currentItem as Certificate).verificationCode && (
              <div className="p-3 bg-white rounded-lg border border-blue-200">
                <p className="text-xs text-gray-500 mb-1">Verification Code</p>
                <code className="text-sm font-mono text-blue-600 font-medium">
                  {(currentItem as Certificate).verificationCode}
                </code>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  if (isAchievement) {
                    onViewAchievement?.(currentItem.id);
                  } else {
                    onViewCertificate?.(currentItem.id);
                  }
                }}
                className="flex-1"
              >
                <EyeIcon className="h-4 w-4 mr-2" />
                View {isAchievement ? 'Achievement' : 'Certificate'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onShare?.(currentItem as any, currentItem.type)}
              >
                <ShareIcon className="h-4 w-4" />
              </Button>
            </div>

            {/* Progress Indicator for Multiple Items */}
            {totalItems > 1 && (
              <div className="flex items-center space-x-2 pt-2">
                <span className="text-xs text-gray-500">
                  {currentIndex + 1} of {totalItems}
                </span>
                <div className="flex space-x-1">
                  {Array.from({ length: totalItems }).map((_, index) => (
                    <div
                      key={index}
                      className={`h-1.5 w-1.5 rounded-full transition-colors ${
                        index === currentIndex ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}