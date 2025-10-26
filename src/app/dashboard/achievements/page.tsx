'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AchievementBadge from '@/components/achievements/achievement-badge';
import CertificateCard from '@/components/certifications/certificate-card';
import ProgressStats from '@/components/achievements/progress-stats';
import AchievementNotification from '@/components/achievements/achievement-notification';
import {
  TrophyIcon,
  AcademicCapIcon,
  ShareIcon,
  EyeIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { monitoring } from '@/lib/monitoring';
import { appLogger } from '@/lib/logger';

interface PageAchievement {
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
}

interface PageCertificate {
  id: string;
  name: string;
  description?: string;
  type: string;
  category: string;
  badgeImageUrl?: string;
  isEarned: boolean;
  earnedAt?: Date;
  expiresAt?: Date | null;
  verificationCode?: string;
  certificateUrl?: string;
  eligibility?: {
    isEligible: boolean;
    missingRequirements: string[];
    progress: Record<string, any>;
    nextActions: string[];
  };
}

interface Stats {
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
  recentAchievements: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    pointsAwarded: number;
    earnedAt: Date;
  }>;
}

export default function AchievementsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [achievements, setAchievements] = useState<PageAchievement[]>([]);
  const [certificates, setCertificates] = useState<PageCertificate[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{
    achievements?: PageAchievement[];
    certificates?: PageCertificate[];
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load achievements, certifications, and stats in parallel
      const [achievementsRes, certificatesRes, statsRes] = await Promise.all([
        fetch('/api/achievements'),
        fetch('/api/certifications?includeProgress=true'),
        fetch('/api/achievements/stats'),
      ]);

      if (achievementsRes.ok) {
        const achievementsData = await achievementsRes.json();
        setAchievements(achievementsData);
      }

      if (certificatesRes.ok) {
        const certificatesData = await certificatesRes.json();
        setCertificates(certificatesData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      monitoring.logError('achievements_load_error', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateCertificate = async (certificateId: string) => {
    try {
      const response = await fetch(`/api/certifications/generate/${certificateId}`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update the certificate in state
        setCertificates(prev =>
          prev.map(cert =>
            cert.id === certificateId
              ? { ...cert, certificateUrl: data.certificateUrl }
              : cert
          )
        );

        // Show success notification
        appLogger.info('Certificate generated successfully', { certificateId, component: 'AchievementsPage' });
      } else {
        const error = await response.json();
        appLogger.error('Certificate generation error', { error: error.error, certificateId, component: 'AchievementsPage' });
      }
    } catch (error) {
      monitoring.logError('certificate_generation_error', error, {
        certificationId: certificateId
      });
      appLogger.error('Failed to generate certificate', { error, certificateId, component: 'AchievementsPage' });
    }
  };

  const handleViewCertificate = (certificateUrl: string) => {
    window.open(certificateUrl, '_blank');
  };

  const handleShareCertificate = (certificate: PageCertificate) => {
    if (navigator.share) {
      navigator.share({
        title: `${certificate.name} Certificate`,
        text: `I earned a ${certificate.name} certificate from Master-AI!`,
        url: certificate.verificationCode 
          ? `${window.location.origin}/verify/${certificate.verificationCode}`
          : window.location.href,
      });
    } else {
      // Fallback to copying link
      const url = certificate.verificationCode
        ? `${window.location.origin}/verify/${certificate.verificationCode}`
        : window.location.href;
      navigator.clipboard.writeText(url);
      appLogger.info('Certificate link copied to clipboard', { certificateId: certificate.id, component: 'AchievementsPage' });
    }
  };

  const filterAchievements = (category?: string, completed?: boolean) => {
    return achievements.filter(achievement => {
      if (category && achievement.category !== category) return false;
      if (completed !== undefined && achievement.isCompleted !== completed) return false;
      return true;
    });
  };

  const filterCertificates = (category?: string, earned?: boolean) => {
    return certificates.filter(certificate => {
      if (category && certificate.category !== category) return false;
      if (earned !== undefined && certificate.isEarned !== earned) return false;
      return true;
    });
  };

  const achievementCategories = [
    { key: 'milestone', label: 'Milestones', icon: TrophyIcon },
    { key: 'streak', label: 'Streaks', icon: ChartBarIcon },
    { key: 'engagement', label: 'Engagement', icon: EyeIcon },
    { key: 'speed', label: 'Speed', icon: ShareIcon },
    { key: 'special', label: 'Special', icon: AcademicCapIcon },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your achievements...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Achievements & Certifications
            </h1>
            <p className="text-gray-600 mt-1">
              Track your learning progress and showcase your accomplishments
            </p>
          </div>
          
          {stats && (
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {stats.achievements.earned}
                </p>
                <p className="text-sm text-gray-500">Achievements</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {filterCertificates(undefined, true).length}
                </p>
                <p className="text-sm text-gray-500">Certificates</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.userStats.totalPointsEarned}
                </p>
                <p className="text-sm text-gray-500">Points</p>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Recent Achievements */}
            {stats?.recentAchievements && stats.recentAchievements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrophyIcon className="h-5 w-5 text-yellow-600" />
                    <span>Recent Achievements</span>
                  </CardTitle>
                  <CardDescription>Your latest accomplishments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(stats.recentAchievements || []).slice(0, 6).map((achievement) => (
                      <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                          <TrophyIcon className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {achievement.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            +{achievement.pointsAwarded} points
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Earned Certificates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AcademicCapIcon className="h-5 w-5 text-blue-600" />
                  <span>Your Certificates</span>
                </CardTitle>
                <CardDescription>Professional credentials you've earned</CardDescription>
              </CardHeader>
              <CardContent>
                {filterCertificates(undefined, true).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filterCertificates(undefined, true).slice(0, 6).map((certificate) => (
                      <CertificateCard
                        key={certificate.id}
                        certificate={certificate}
                        onGenerateCertificate={handleGenerateCertificate}
                        onViewCertificate={handleViewCertificate}
                        onShareCertificate={handleShareCertificate}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No certificates earned yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Complete lessons to earn your first certificate!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Progress Towards Next Achievements */}
            <Card>
              <CardHeader>
                <CardTitle>Progress Towards Next Achievements</CardTitle>
                <CardDescription>See what you're close to unlocking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filterAchievements(undefined, false)
                    .filter(a => a.progress > 0)
                    .sort((a, b) => (b.progress / b.threshold) - (a.progress / a.threshold))
                    .slice(0, 4)
                    .map((achievement) => (
                      <AchievementBadge
                        key={achievement.achievementId}
                        achievement={achievement}
                        size="sm"
                      />
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {/* Filter all */}}
                >
                  All ({achievements.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {/* Filter completed */}}
                >
                  Completed ({filterAchievements(undefined, true).length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {/* Filter in progress */}}
                >
                  In Progress ({filterAchievements(undefined, false).filter(a => a.progress > 0).length})
                </Button>
              </div>
            </div>

            {achievementCategories.map((category) => {
              const categoryAchievements = filterAchievements(category.key);
              if (categoryAchievements.length === 0) return null;

              return (
                <Card key={category.key}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <category.icon className="h-5 w-5" />
                      <span>{category.label}</span>
                      <Badge variant="secondary">
                        {filterAchievements(category.key, true).length} / {categoryAchievements.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryAchievements.map((achievement) => (
                        <AchievementBadge
                          key={achievement.achievementId}
                          achievement={achievement}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* Certificates Tab */}
          <TabsContent value="certificates" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificates.map((certificate) => (
                <CertificateCard
                  key={certificate.id}
                  certificate={certificate}
                  onGenerateCertificate={handleGenerateCertificate}
                  onViewCertificate={handleViewCertificate}
                  onShareCertificate={handleShareCertificate}
                />
              ))}
            </div>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats" className="space-y-6">
            {stats && <ProgressStats stats={stats} />}
          </TabsContent>
        </Tabs>

        {/* Achievement Notification */}
        {notification && (
          <AchievementNotification
            achievements={notification.achievements as any}
            certificates={notification.certificates as any}
            onDismiss={() => setNotification(null)}
            onViewAchievement={(id) => {
              setActiveTab('achievements');
              setNotification(null);
            }}
            onViewCertificate={(id) => {
              setActiveTab('certificates');
              setNotification(null);
            }}
            onShare={(item, type) => {
              if (type === 'certificate') {
                handleShareCertificate(item as PageCertificate);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}