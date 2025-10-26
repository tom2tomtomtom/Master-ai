'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  TrophyIcon,
  FireIcon,
  ClockIcon,
  BookOpenIcon,
  PencilIcon,
  BookmarkIcon,
  StarIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface ProgressStatsProps {
  stats: {
    userStats: {
      totalLessonsCompleted: number;
      totalTimeSpentMinutes: number;
      totalNotesCreated: number;
      totalBookmarksCreated: number;
      totalPointsEarned: number;
    };
    streakInfo: {
      currentStreak: number;
      longestStreak: number;
      lastActivityDate: Date | null;
    };
    achievements: {
      earned: number;
      total: number;
      completionPercentage: number;
    };
  };
}

export default function ProgressStats({ stats }: ProgressStatsProps) {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours === 0) {
      return `${minutes}m`;
    } else if (remainingMinutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${remainingMinutes}m`;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const statCards = [
    {
      title: 'Lessons Completed',
      value: stats.userStats.totalLessonsCompleted,
      icon: BookOpenIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'Total lessons finished',
    },
    {
      title: 'Learning Streak',
      value: stats.streakInfo.currentStreak,
      icon: FireIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      description: `${stats.streakInfo.currentStreak} day${stats.streakInfo.currentStreak !== 1 ? 's' : ''} in a row`,
      subValue: `Best: ${stats.streakInfo.longestStreak} days`,
    },
    {
      title: 'Study Time',
      value: formatTime(stats.userStats.totalTimeSpentMinutes),
      icon: ClockIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'Total learning time',
    },
    {
      title: 'Notes Created',
      value: stats.userStats.totalNotesCreated,
      icon: PencilIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      description: 'Personal notes taken',
    },
    {
      title: 'Bookmarks',
      value: stats.userStats.totalBookmarksCreated,
      icon: BookmarkIcon,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      description: 'Lessons bookmarked',
    },
    {
      title: 'Points Earned',
      value: formatNumber(stats.userStats.totalPointsEarned),
      icon: StarIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      description: 'Achievement points',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Achievement Progress Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <TrophyIcon className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <CardTitle>Achievement Progress</CardTitle>
              <CardDescription>
                {stats.achievements.earned} of {stats.achievements.total} achievements unlocked
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm text-gray-500">
                {stats.achievements.completionPercentage}%
              </span>
            </div>
            
            <Progress value={stats.achievements.completionPercentage} className="h-3" />
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">
                {stats.achievements.total - stats.achievements.earned} achievements remaining
              </span>
              <div className="flex items-center space-x-2">
                <ChartBarIcon className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">
                  Rank: {stats.achievements.completionPercentage >= 80 ? 'Expert' :
                         stats.achievements.completionPercentage >= 60 ? 'Advanced' :
                         stats.achievements.completionPercentage >= 40 ? 'Intermediate' : 'Beginner'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className={`h-12 w-12 rounded-full ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500 truncate">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {stat.description}
                  </p>
                  {stat.subValue && (
                    <p className="text-xs text-gray-400 mt-1">
                      {stat.subValue}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Learning Insights</CardTitle>
          <CardDescription>Your learning patterns and progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Average Study Time */}
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                <ClockIcon className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.userStats.totalLessonsCompleted > 0 
                  ? Math.round(stats.userStats.totalTimeSpentMinutes / stats.userStats.totalLessonsCompleted)
                  : 0}m
              </p>
              <p className="text-sm text-gray-500">Avg. time per lesson</p>
            </div>

            {/* Engagement Score */}
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                <StarIcon className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.userStats.totalLessonsCompleted > 0
                  ? Math.round(((stats.userStats.totalNotesCreated + stats.userStats.totalBookmarksCreated) / stats.userStats.totalLessonsCompleted) * 100)
                  : 0}%
              </p>
              <p className="text-sm text-gray-500">Engagement rate</p>
            </div>

            {/* Consistency */}
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <FireIcon className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round((stats.streakInfo.currentStreak / Math.max(stats.streakInfo.longestStreak, 1)) * 100)}%
              </p>
              <p className="text-sm text-gray-500">Streak consistency</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}