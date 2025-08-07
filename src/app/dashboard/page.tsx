'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/dashboard/layout';
import { StatsCard } from '@/components/dashboard/stats-card';
import { LearningPathCard } from '@/components/dashboard/learning-path-card';
import { NextLessonCard } from '@/components/dashboard/next-lesson-card';
import { RecentActivityList } from '@/components/dashboard/recent-activity';
import { ProgressCircle } from '@/components/dashboard/progress-circle';
import { SubscriptionWidget } from '@/components/subscription/subscription-widget';

import { 
  BookOpen, 
  Clock, 
  Award, 
  TrendingUp, 
  Flame,
  Target,
  Calendar,
  ArrowRight
} from 'lucide-react';

import type { DashboardStats, LearningPathWithProgress, RecentActivity } from '@/types/dashboard';

export default function DashboardPage(): JSX.Element {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [learningPaths, setLearningPaths] = useState<LearningPathWithProgress[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [nextLesson, setNextLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch all dashboard data in parallel
        const [statsRes, progressRes, activityRes, nextLessonRes] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/dashboard/progress'),
          fetch('/api/dashboard/recent-activity'),
          fetch('/api/dashboard/next-lesson'),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (progressRes.ok) {
          const progressData = await progressRes.json();
          setLearningPaths(progressData);
        }

        if (activityRes.ok) {
          const activityData = await activityRes.json();
          setRecentActivity(activityData);
        }

        if (nextLessonRes.ok) {
          const nextLessonData = await nextLessonRes.json();
          setNextLesson(nextLessonData);
        }
      } catch (error) {
        // Error is handled by the UI showing loading/error states
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchDashboardData();
    }
  }, [session]);

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getMotivationalMessage = (): string => {
    if (!stats) return '';
    
    if (stats.overallCompletionPercentage === 0) {
      return 'Ready to start your AI mastery journey?';
    }
    if (stats.overallCompletionPercentage < 25) {
      return 'Great start! Keep building momentum.';
    }
    if (stats.overallCompletionPercentage < 50) {
      return "You're making excellent progress!";
    }
    if (stats.overallCompletionPercentage < 75) {
      return "You're more than halfway there!";
    }
    if (stats.overallCompletionPercentage < 100) {
      return "Almost there! The finish line is in sight.";
    }
    return 'Congratulations on completing your journey!';
  };

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title={`${getGreeting()}, ${session?.user?.name || 'Student'}!`}
      subtitle={getMotivationalMessage()}
    >
      <div className="space-y-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Overall Progress"
            value={`${stats?.overallCompletionPercentage || 0}%`}
            subtitle={`${stats?.completedLessons || 0} of ${stats?.totalLessons || 0} lessons`}
            icon={Target}
            color="blue"
            trend={stats?.lessonsCompletedThisWeek ? {
              value: stats.lessonsCompletedThisWeek,
              direction: 'up'
            } : undefined}
          />
          
          <StatsCard
            title="Learning Streak"
            value={`${stats?.learningStreak || 0}`}
            subtitle="consecutive days"
            icon={Flame}
            color="orange"
          />
          
          <StatsCard
            title="Time Invested"
            value={`${Math.floor((stats?.totalTimeSpent || 0) / 60)}h`}
            subtitle={`${(stats?.totalTimeSpent || 0) % 60}m total`}
            icon={Clock}
            color="green"
          />
          
          <StatsCard
            title="This Week"
            value={stats?.lessonsCompletedThisWeek || 0}
            subtitle="lessons completed"
            icon={Calendar}
            color="purple"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Continue Learning & Progress */}
          <div className="lg:col-span-2 space-y-6">
            {/* Continue Learning */}
            <NextLessonCard 
              lesson={nextLesson?.allCompleted ? undefined : nextLesson}
              allCompleted={nextLesson?.allCompleted}
              message={nextLesson?.message}
            />

            {/* Overall Progress */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Learning Progress</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/progress">
                      View Details <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center mb-6">
                  <ProgressCircle 
                    value={stats?.overallCompletionPercentage || 0}
                    size="lg"
                    color="blue"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {stats?.completedLessons || 0}
                    </div>
                    <div className="text-xs text-gray-600">Completed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {stats?.inProgressLessons || 0}
                    </div>
                    <div className="text-xs text-gray-600">In Progress</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-400">
                      {(stats?.totalLessons || 0) - (stats?.completedLessons || 0) - (stats?.inProgressLessons || 0)}
                    </div>
                    <div className="text-xs text-gray-600">Not Started</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Learning Paths Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Learning Paths</h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/paths">
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {learningPaths.slice(0, 4).map((path) => (
                  <LearningPathCard key={path.id} path={path} />
                ))}
              </div>
              {learningPaths.length > 4 && (
                <div className="mt-4 text-center">
                  <Button variant="outline" asChild>
                    <Link href="/dashboard/paths">
                      View {learningPaths.length - 4} More Learning Paths
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Subscription Widget */}
            <SubscriptionWidget />

            {/* Recent Activity */}
            <RecentActivityList activities={recentActivity} />

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-gray-600">Bookmarks</span>
                  </div>
                  <span className="font-semibold">{stats?.bookmarkedLessons || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-gray-600">Certificates</span>
                  </div>
                  <span className="font-semibold">{stats?.certificationsEarned || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-600">Avg. Session</span>
                  </div>
                  <span className="font-semibold">{stats?.averageSessionTime || 0}m</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/dashboard/bookmarks">
                    <BookOpen className="mr-2 h-4 w-4" />
                    View Bookmarks
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/dashboard/search">
                    <Target className="mr-2 h-4 w-4" />
                    Search Lessons
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/dashboard/achievements">
                    <Award className="mr-2 h-4 w-4" />
                    Achievements
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}