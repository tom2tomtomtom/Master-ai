'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Eye, 
  Play, 
  Bookmark, 
  Filter, 
  TrendingUp, 
  Users, 
  Clock,
  BarChart3,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AnimatedCounter } from '@/components/ui/animated-counter';

interface DiscoveryMetrics {
  totalSearches: number;
  uniqueUsers: number;
  avgSearchDuration: number;
  popularSearchTerms: { term: string; count: number }[];
  topLessonsViewed: { lessonId: string; title: string; views: number }[];
  interactionCounts: {
    searches: number;
    previews: number;
    starts: number;
    bookmarks: number;
    filters: number;
  };
  conversionRates: {
    searchToView: number;
    viewToStart: number;
    previewToStart: number;
    bookmarkRetention: number;
  };
  timeDistribution: {
    hour: number;
    searches: number;
  }[];
}

interface DiscoveryAnalyticsProps {
  className?: string;
}

export function DiscoveryAnalytics({ className = '' }: DiscoveryAnalyticsProps) {
  const [metrics, setMetrics] = useState<DiscoveryMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  useEffect(() => {
    fetchMetrics();
  }, [timeRange]);

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/analytics/discovery?timeRange=${timeRange}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const data = await response.json();
      
      // Merge API data with defaults for missing fields
      const completeMetrics: DiscoveryMetrics = {
        totalSearches: data.totalSearches || 0,
        uniqueUsers: data.uniqueUsers || 0,
        avgSearchDuration: data.avgSearchDuration || 0,
        popularSearchTerms: data.popularSearchTerms || [],
        topLessonsViewed: data.topLessonsViewed || [],
        interactionCounts: {
          searches: data.interactionCounts?.searches || 0,
          previews: data.interactionCounts?.previews || 0,
          starts: data.interactionCounts?.starts || 0,
          bookmarks: data.interactionCounts?.bookmarks || 0,
          filters: data.interactionCounts?.filters || 0,
        },
        conversionRates: {
          searchToView: data.conversionRates?.searchToView || 0,
          viewToStart: data.conversionRates?.viewToStart || 0,
          previewToStart: data.conversionRates?.previewToStart || 0,
          bookmarkRetention: data.conversionRates?.bookmarkRetention || 0,
        },
        timeDistribution: data.timeDistribution || [],
      };
      
      setMetrics(completeMetrics);
    } catch (error) {
      console.error('Failed to fetch discovery metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Failed to load analytics data</p>
        <Button variant="outline" onClick={fetchMetrics} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-ai-blue-600" />
          Discovery Analytics
        </h2>
        <div className="flex bg-white rounded-lg border border-gray-200 p-1">
          {(['24h', '7d', '30d'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange(range)}
              className="text-sm"
            >
              {range === '24h' ? '24 Hours' : range === '7d' ? '7 Days' : '30 Days'}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-ai-blue-50 to-ai-blue-100 border-ai-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-ai-blue-600 rounded-lg">
                  <Search className="w-4 h-4 text-white" />
                </div>
                <Badge variant="secondary" className="bg-ai-blue-200 text-ai-blue-800">
                  +12.5%
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-ai-blue-800">Total Searches</p>
                <p className="text-2xl font-bold text-ai-blue-900">
                  <AnimatedCounter value={metrics.totalSearches} />
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-green-600 rounded-lg">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <Badge variant="secondary" className="bg-green-200 text-green-800">
                  +8.2%
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-green-800">Unique Users</p>
                <p className="text-2xl font-bold text-green-900">
                  <AnimatedCounter value={metrics.uniqueUsers} />
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-orange-600 rounded-lg">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <Badge variant="secondary" className="bg-orange-200 text-orange-800">
                  -5.1%
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-orange-800">Avg Search Duration</p>
                <p className="text-2xl font-bold text-orange-900">
                  <AnimatedCounter value={metrics.avgSearchDuration} />s
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-purple-600 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <Badge variant="secondary" className="bg-purple-200 text-purple-800">
                  +15.3%
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-purple-800">Conversion Rate</p>
                <p className="text-2xl font-bold text-purple-900">
                  <AnimatedCounter value={metrics.conversionRates.searchToView} />%
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Interaction Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-ai-blue-600" />
              Interaction Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(metrics.interactionCounts).map(([type, count]) => {
              const icons = {
                searches: Search,
                previews: Eye,
                starts: Play,
                bookmarks: Bookmark,
                filters: Filter,
              };
              const Icon = icons[type as keyof typeof icons];
              const colors = {
                searches: 'text-ai-blue-600 bg-ai-blue-50',
                previews: 'text-green-600 bg-green-50',
                starts: 'text-purple-600 bg-purple-50',
                bookmarks: 'text-yellow-600 bg-yellow-50',
                filters: 'text-orange-600 bg-orange-50',
              };
              const color = colors[type as keyof typeof colors];

              return (
                <div key={type} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-medium capitalize">{type}</span>
                  </div>
                  <Badge variant="outline">
                    <AnimatedCounter value={count} />
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-ai-blue-600" />
              Conversion Funnel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(metrics.conversionRates).map(([type, rate]) => {
              const labels = {
                searchToView: 'Search → View',
                viewToStart: 'View → Start',
                previewToStart: 'Preview → Start',
                bookmarkRetention: 'Bookmark Retention',
              };
              const label = labels[type as keyof typeof labels];

              return (
                <div key={type} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-sm text-gray-600">
                      <AnimatedCounter value={rate} />%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${rate}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="bg-gradient-to-r from-ai-blue-500 to-ai-purple-500 h-2 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Popular Search Terms & Top Lessons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-ai-blue-600" />
              Popular Search Terms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.popularSearchTerms.map((term, index) => (
                <div key={term.term} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <span className="font-medium">{term.term}</span>
                  </div>
                  <Badge variant="secondary">
                    <AnimatedCounter value={term.count} />
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-ai-blue-600" />
              Most Viewed Lessons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.topLessonsViewed.map((lesson, index) => (
                <div key={lesson.lessonId} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <span className="font-medium text-sm">{lesson.title}</span>
                  </div>
                  <Badge variant="secondary">
                    <AnimatedCounter value={lesson.views} />
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}