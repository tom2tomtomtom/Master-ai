'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { monitoring } from '@/lib/monitoring';
import { LearningPathCard } from '@/components/dashboard/learning-path-card';
import { StatsCard } from '@/components/dashboard/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Search, 
  Filter,
  Target,
  Clock,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import { LearningPathWithProgress } from '@/types/dashboard';

export default function LearningPathsPage() {
  const [learningPaths, setLearningPaths] = useState<LearningPathWithProgress[]>([]);
  const [filteredPaths, setFilteredPaths] = useState<LearningPathWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    const fetchLearningPaths = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/progress');
        
        if (response.ok) {
          const data = await response.json();
          setLearningPaths(data);
          setFilteredPaths(data);
        }
      } catch (error) {
        monitoring.logError('learning_paths_fetch_error', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLearningPaths();
  }, []);

  useEffect(() => {
    let filtered = learningPaths;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(path =>
        path.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        path.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        path.targetAudience?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by difficulty
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(path => path.difficultyLevel === selectedDifficulty);
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(path => {
        const completionPercentage = path.progress?.completionPercentage || 0;
        switch (selectedStatus) {
          case 'not_started':
            return completionPercentage === 0;
          case 'in_progress':
            return completionPercentage > 0 && completionPercentage < 100;
          case 'completed':
            return completionPercentage === 100;
          default:
            return true;
        }
      });
    }

    setFilteredPaths(filtered);
  }, [learningPaths, searchQuery, selectedDifficulty, selectedStatus]);

  // Calculate overview stats
  const totalPaths = learningPaths.length;
  const completedPaths = learningPaths.filter(path => (path.progress?.completionPercentage || 0) === 100).length;
  const inProgressPaths = learningPaths.filter(path => {
    const completion = path.progress?.completionPercentage || 0;
    return completion > 0 && completion < 100;
  }).length;
  const averageProgress = learningPaths.length > 0 
    ? Math.round(learningPaths.reduce((sum, path) => sum + (path.progress?.completionPercentage || 0), 0) / learningPaths.length)
    : 0;

  const difficulties = ['all', 'beginner', 'intermediate', 'advanced', 'expert'];
  const statuses = [
    { value: 'all', label: 'All Paths' },
    { value: 'not_started', label: 'Not Started' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' }
  ];

  if (loading) {
    return (
      <DashboardLayout title="Learning Paths">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Learning Paths"
      subtitle={`${totalPaths} comprehensive learning paths to master AI tools`}
    >
      <div className="space-y-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Paths"
            value={totalPaths}
            subtitle="available to explore"
            icon={BookOpen}
            color="blue"
          />
          
          <StatsCard
            title="Completed"
            value={completedPaths}
            subtitle="paths finished"
            icon={CheckCircle}
            color="green"
          />
          
          <StatsCard
            title="In Progress"
            value={inProgressPaths}
            subtitle="paths started"
            icon={TrendingUp}
            color="orange"
          />
          
          <StatsCard
            title="Average Progress"
            value={`${averageProgress}%`}
            subtitle="across all paths"
            icon={Target}
            color="purple"
          />
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search learning paths..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-4">
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-medium text-gray-700">Difficulty:</span>
                  {difficulties.map((difficulty) => (
                    <Button
                      key={difficulty}
                      variant={selectedDifficulty === difficulty ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedDifficulty(difficulty)}
                      className="capitalize"
                    >
                      {difficulty}
                    </Button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                  {statuses.map((status) => (
                    <Button
                      key={status.value}
                      variant={selectedStatus === status.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedStatus(status.value)}
                    >
                      {status.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Active Filters Display */}
              {(searchQuery || selectedDifficulty !== 'all' || selectedStatus !== 'all') && (
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <span className="text-sm text-gray-600">Active filters:</span>
                  {searchQuery && (
                    <Badge variant="secondary">
                      Search: "{searchQuery}"
                    </Badge>
                  )}
                  {selectedDifficulty !== 'all' && (
                    <Badge variant="secondary">
                      Difficulty: {selectedDifficulty}
                    </Badge>
                  )}
                  {selectedStatus !== 'all' && (
                    <Badge variant="secondary">
                      Status: {statuses.find(s => s.value === selectedStatus)?.label}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedDifficulty('all');
                      setSelectedStatus('all');
                    }}
                    className="h-6 px-2 text-xs"
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Learning Paths Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {filteredPaths.length === learningPaths.length 
                ? 'All Learning Paths' 
                : `${filteredPaths.length} of ${learningPaths.length} paths`
              }
            </h2>
          </div>

          {filteredPaths.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No learning paths found
                </h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search terms or filters to find learning paths.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedDifficulty('all');
                    setSelectedStatus('all');
                  }}
                >
                  Clear filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPaths.map((path) => (
                <LearningPathCard key={path.id} path={path} />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}