'use client';

import React, { useState, useEffect, useCallback } from 'react';

export const dynamic = 'force-dynamic';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Zap } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LessonGrid, LessonSection } from '@/components/lesson-cards';
import { SearchHeader } from '@/components/discovery/search-header';
import { FilterSidebar } from '@/components/discovery/filter-sidebar';
import { appLogger } from '@/lib/logger';
import type { 
  LessonWithMetadata, 
  SearchParams, 
  SearchResponse, 
  RecommendationSection,
  LessonFilters
} from '@/types/discovery';

export default function DiscoverPage() {
  const session = useSession()?.data;

  // State management
  const [searchParams, setSearchParams] = useState<SearchParams>({
    filters: {
      difficulty: [],
      tools: [],
      categories: [],
      duration: { min: 0, max: 120 },
      searchQuery: '',
    },
    sortBy: 'relevance',
    viewMode: 'grid',
    page: 1,
    limit: 20,
  });

  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationSection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  // Default to 'search' tab for unauthenticated users to show all lessons immediately
  const [activeTab, setActiveTab] = useState<'search' | 'recommendations'>(
    session?.user?.id ? 'recommendations' : 'search'
  );

  // Fetch search results
  const fetchSearchResults = useCallback(async (params: SearchParams) => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: params.page.toString(),
        limit: params.limit.toString(),
        sortBy: params.sortBy,
        includeMetadata: 'true',
      });

      // Add filter params
      if (params.filters.searchQuery) queryParams.set('search', params.filters.searchQuery);
      if (params.filters.difficulty.length > 0) queryParams.set('difficulty', params.filters.difficulty.join(','));
      if (params.filters.tools.length > 0) queryParams.set('tools', params.filters.tools.join(','));
      if (params.filters.categories.length > 0) queryParams.set('categories', params.filters.categories.join(','));
      if (params.filters.duration.min > 0) queryParams.set('minDuration', params.filters.duration.min.toString());
      if (params.filters.duration.max < 120) queryParams.set('maxDuration', params.filters.duration.max.toString());
      if (params.filters.completed !== undefined) queryParams.set('completed', params.filters.completed.toString());
      if (params.filters.bookmarked !== undefined) queryParams.set('bookmarked', params.filters.bookmarked.toString());

      const response = await fetch(`/api/lessons/search?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch search results');
      }

      const data: SearchResponse = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Failed to fetch search results:', error);
      // Set empty results on error for graceful UI handling
      setSearchResults({
        lessons: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
        filters: {
          availableDifficulties: [],
          availableTools: [],
          availableCategories: []
        }
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch recommendations
  const fetchRecommendations = useCallback(async () => {
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch('/api/lessons/recommendations?limit=8');
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data: RecommendationSection[] = await response.json();
      setRecommendations(data);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      // Set empty recommendations on error for graceful UI handling
      setRecommendations([]);
    }
  }, [session?.user?.id]);

  // Switch to appropriate tab when session changes
  useEffect(() => {
    if (session?.user?.id && activeTab === 'search' && !hasActiveFilters) {
      // User just logged in, switch to recommendations if no active filters
      setActiveTab('recommendations');
    } else if (!session?.user?.id && activeTab === 'recommendations') {
      // User logged out, switch to search
      setActiveTab('search');
    }
  }, [session?.user?.id]);

  // Initial data loading
  useEffect(() => {
    if (activeTab === 'search') {
      fetchSearchResults(searchParams);
    } else if (activeTab === 'recommendations' && session?.user?.id) {
      fetchRecommendations();
    }
  }, [activeTab, session?.user?.id, fetchSearchResults, fetchRecommendations, searchParams]);

  // Handle search parameter changes
  const handleSearchParamsChange = (newParams: SearchParams) => {
    setSearchParams(newParams);
    if (activeTab === 'search') {
      fetchSearchResults(newParams);
    }
  };

  // Handle lesson interactions
  const handleLessonStart = async (lessonId: string) => {
    // Navigate to lesson (implement based on your routing)
    window.location.href = `/lessons/${lessonId}`;
  };

  const handleLessonBookmark = async (lessonId: string, isBookmarked: boolean) => {
    // The interaction tracking is already handled in the LessonCard component
    // You might want to update local state here if needed
    appLogger.info(`Lesson ${isBookmarked ? 'bookmarked' : 'unbookmarked'}`, { lessonId, component: 'DiscoverPage' });
  };

  // Auto-switch to search when user searches or filters
  useEffect(() => {
    const hasActiveSearch = 
      searchParams.filters.searchQuery ||
      searchParams.filters.difficulty.length > 0 ||
      searchParams.filters.tools.length > 0 ||
      searchParams.filters.categories.length > 0 ||
      searchParams.filters.completed !== undefined ||
      searchParams.filters.bookmarked !== undefined;

    if (hasActiveSearch && activeTab === 'recommendations') {
      setActiveTab('search');
    }
  }, [searchParams.filters, activeTab]);

  const hasActiveFilters = 
    searchParams.filters.searchQuery ||
    searchParams.filters.difficulty.length > 0 ||
    searchParams.filters.tools.length > 0 ||
    searchParams.filters.categories.length > 0 ||
    searchParams.filters.completed !== undefined ||
    searchParams.filters.bookmarked !== undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-ai-blue-50/30">
      {/* Search Header */}
      <SearchHeader
        searchParams={searchParams}
        onSearchParamsChange={handleSearchParamsChange}
        totalResults={searchResults?.pagination.total}
        isLoading={isLoading}
        onToggleFilters={() => setIsFiltersOpen(!isFiltersOpen)}
        filtersOpen={isFiltersOpen}
      />

      {/* Filter Sidebar */}
      <FilterSidebar
        filters={searchParams.filters}
        onFiltersChange={(filters) => handleSearchParamsChange({ ...searchParams, filters, page: 1 })}
        metadata={searchResults?.filters}
        isLoading={isLoading}
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${isFiltersOpen ? 'md:ml-80' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
          {/* Tab Navigation */}
          <div className="flex items-center gap-4 mb-6 md:mb-8">
            <div className="flex bg-white rounded-lg border border-gray-200 p-1">
              <Button
                variant={activeTab === 'recommendations' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('recommendations')}
                className="relative rounded-md"
                disabled={!session?.user?.id}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                For You
                {activeTab === 'recommendations' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-ai-blue-600 rounded-md -z-10"
                  />
                )}
              </Button>
              <Button
                variant={activeTab === 'search' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('search')}
                className="relative rounded-md"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                All Lessons
                {activeTab === 'search' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-ai-blue-600 rounded-md -z-10"
                  />
                )}
              </Button>
            </div>

            {activeTab === 'recommendations' && !session?.user?.id && (
              <div className="text-sm text-gray-500">
                Sign in to see personalized recommendations
              </div>
            )}
          </div>

          {/* Content */}
          <AnimatedContent key={activeTab}>
            {activeTab === 'recommendations' ? (
              <>
                {/* Welcome Section */}
                {session?.user?.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-ai-blue-600 to-ai-purple-600 rounded-2xl p-6 md:p-8 mb-6 md:mb-8 text-white relative overflow-hidden"
                  >
                    {/* Background pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32"></div>
                      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24"></div>
                    </div>

                    <div className="relative">
                      <div className="flex items-center gap-3 mb-4">
                        <Zap className="w-8 h-8" />
                        <h1 className="text-2xl md:text-3xl font-bold">
                          Welcome back, {session.user.name?.split(' ')[0]}!
                        </h1>
                      </div>
                      <p className="text-lg md:text-xl opacity-90 mb-4 md:mb-6">
                        Continue your AI learning journey with personalized lesson recommendations.
                      </p>
                      <div className="flex flex-wrap items-center gap-3 md:gap-4 text-white/80 text-sm md:text-base">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                          <span className="text-sm">Personalized for you</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                          <span className="text-sm">Updated daily</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                          <span className="text-sm">Track your progress</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Recommendation Sections */}
                {recommendations.length > 0 ? (
                  <div className="space-y-12">
                    {recommendations.map((section) => (
                      <LessonSection
                        key={section.type}
                        title={section.title}
                        lessons={section.lessons}
                        viewMode={searchParams.viewMode}
                        onStart={handleLessonStart}
                        onBookmark={handleLessonBookmark}
                        onViewAll={() => {
                          // Switch to search with relevant filters
                          setActiveTab('search');
                        }}
                      />
                    ))}
                  </div>
                ) : session?.user?.id ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16"
                  >
                    <Sparkles className="w-16 h-16 text-ai-blue-500 mx-auto mb-6" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Building your recommendations...
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Complete a few lessons to see personalized recommendations here.
                    </p>
                    <Button onClick={() => setActiveTab('search')}>
                      Explore All Lessons
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16"
                  >
                    <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Sign in for personalized recommendations
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Get lesson suggestions tailored to your learning style and progress.
                    </p>
                    <Button onClick={() => setActiveTab('search')}>
                      Browse All Lessons
                    </Button>
                  </motion.div>
                )}
              </>
            ) : (
              <>
                {/* Search Results */}
                {searchResults ? (
                  <LessonGrid
                    lessons={searchResults.lessons}
                    viewMode={searchParams.viewMode}
                    isLoading={isLoading}
                    onStart={handleLessonStart}
                    onBookmark={handleLessonBookmark}
                    emptyStateText={
                      hasActiveFilters 
                        ? "No lessons match your current filters"
                        : "No lessons found"
                    }
                    emptyStateAction={
                      hasActiveFilters ? (
                        <Button
                          variant="outline"
                          onClick={() => {
                            const clearedFilters: LessonFilters = {
                              difficulty: [],
                              tools: [],
                              categories: [],
                              duration: { min: 0, max: 120 },
                              searchQuery: '',
                            };
                            handleSearchParamsChange({ 
                              ...searchParams, 
                              filters: clearedFilters,
                              page: 1 
                            });
                          }}
                        >
                          Clear all filters
                        </Button>
                      ) : undefined
                    }
                  />
                ) : (
                  <LessonGrid
                    lessons={[]}
                    viewMode={searchParams.viewMode}
                    isLoading={true}
                  />
                )}

                {/* Pagination */}
                {searchResults && searchResults.pagination.pages > 1 && (
                  <div className="flex justify-center mt-12">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        disabled={searchResults.pagination.page <= 1}
                        onClick={() => handleSearchParamsChange({
                          ...searchParams,
                          page: searchResults.pagination.page - 1
                        })}
                      >
                        Previous
                      </Button>
                      
                      <div className="flex items-center gap-2 px-4">
                        <span className="text-sm text-gray-600">
                          Page {searchResults.pagination.page} of {searchResults.pagination.pages}
                        </span>
                      </div>
                      
                      <Button
                        variant="outline"
                        disabled={searchResults.pagination.page >= searchResults.pagination.pages}
                        onClick={() => handleSearchParamsChange({
                          ...searchParams,
                          page: searchResults.pagination.page + 1
                        })}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </AnimatedContent>
        </div>
      </div>
    </div>
  );
}

// Animated content wrapper
function AnimatedContent({ children, ...props }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}