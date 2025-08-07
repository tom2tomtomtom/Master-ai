'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Play, StickyNote, Bookmark, Award } from 'lucide-react';
import { RecentActivity } from '@/types/dashboard';
import { formatDistanceToNow } from 'date-fns';

interface RecentActivityListProps {
  activities: RecentActivity[];
}

const activityConfig = {
  lesson_completed: {
    icon: CheckCircle,
    color: 'success',
    bgColor: 'bg-green-50',
    iconColor: 'text-green-600',
  },
  lesson_started: {
    icon: Play,
    color: 'default',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  note_added: {
    icon: StickyNote,
    color: 'secondary',
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-600',
  },
  bookmark_added: {
    icon: Bookmark,
    color: 'secondary',
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-600',
  },
  certification_earned: {
    icon: Award,
    color: 'success',
    bgColor: 'bg-yellow-50',
    iconColor: 'text-yellow-600',
  },
} as const;

export function RecentActivityList({ activities }: RecentActivityListProps) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Play className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">No recent activity</p>
            <p className="text-gray-400 text-xs mt-1">Start a lesson to see your progress here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100">
          {activities.map((activity) => {
            const config = activityConfig[activity.type];
            const Icon = config.icon;
            const timeAgo = formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true });

            return (
              <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${config.bgColor}`}>
                    <Icon className={`h-4 w-4 ${config.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.details}
                      </p>
                      <Badge variant={config.color} className="text-xs shrink-0">
                        {activity.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    {activity.lessonTitle && (
                      <p className="text-xs text-gray-600 truncate mb-1">
                        {activity.lessonTitle}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">{timeAgo}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}