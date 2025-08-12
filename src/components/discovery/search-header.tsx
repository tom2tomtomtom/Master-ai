'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  SlidersHorizontal, 
  Grid3X3, 
  List, 
  ArrowUpDown, 
  TrendingUp,
  Clock,
  Star,
  BookOpen,
  X,
  ChevronDown,
  Filter
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import type { LessonFilters, SearchParams } from '@/types/discovery';
import { useInteractionTracking } from '@/hooks/use-interaction-tracking';

interface SearchHeaderProps {
  searchParams: SearchParams;
  onSearchParamsChange: (params: SearchParams) => void;
  totalResults?: number;
  isLoading?: boolean;
  onToggleFilters: () => void;
  filtersOpen: boolean;
  className?: string;
}

interface SortOption {
  value: SearchParams['sortBy'];
  label: string;
  icon: React.ReactNode;
}

interface SearchSuggestion {
  type: 'query' | 'tool' | 'category';
  value: string;
  label: string;
}

export function SearchHeader({
  searchParams,
  onSearchParamsChange,
  totalResults,
  isLoading = false,
  onToggleFilters,
  filtersOpen,
  className = '',
}: SearchHeaderProps) {
  const [searchQuery, setSearchQuery] = useState(searchParams.filters.searchQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  
  const { trackSearch, isAuthenticated } = useInteractionTracking();

  const sortOptions: SortOption[] = [
    { value: 'relevance', label: 'Relevance', icon: <Search className="w-4 h-4" /> },
    { value: 'popularity', label: 'Popularity', icon: <TrendingUp className="w-4 h-4" /> },
    { value: 'recent', label: 'Recently Added', icon: <Clock className="w-4 h-4" /> },
    { value: 'difficulty', label: 'Difficulty', icon: <Star className="w-4 h-4" /> },
    { value: 'duration', label: 'Duration', icon: <Clock className="w-4 h-4" /> },
    { value: 'title', label: 'Title A-Z', icon: <BookOpen className="w-4 h-4" /> },
  ];

  // Mock suggestions - in a real app, these would come from an API
  const mockSuggestions: SearchSuggestion[] = [
    { type: 'query', value: 'ChatGPT prompting', label: 'ChatGPT prompting' },
    { type: 'query', value: 'Claude AI writing', label: 'Claude AI writing' },
    { type: 'query', value: 'Gemini features', label: 'Gemini features' },
    { type: 'tool', value: 'ChatGPT', label: 'ChatGPT' },
    { type: 'tool', value: 'Claude', label: 'Claude' },
    { type: 'tool', value: 'Gemini', label: 'Gemini' },
    { type: 'tool', value: 'Midjourney', label: 'Midjourney' },
    { type: 'category', value: 'Content Creation', label: 'Content Creation' },
    { type: 'category', value: 'Data Analysis', label: 'Data Analysis' },
  ];

  // Update search query when props change
  useEffect(() => {
    setSearchQuery(searchParams.filters.searchQuery);
  }, [searchParams.filters.searchQuery]);

  // Generate suggestions based on input
  useEffect(() => {
    if (searchQuery.length > 0) {
      const filtered = mockSuggestions.filter(suggestion =>
        suggestion.label.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 8);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery]);

  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value);
    setShowSuggestions(true);
    
    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(value);
    }, 500);
  };

  const handleSearch = async (query: string) => {
    const newFilters = { ...searchParams.filters, searchQuery: query };
    onSearchParamsChange({
      ...searchParams,
      filters: newFilters,
      page: 1, // Reset to first page on search
    });

    if (isAuthenticated && query) {
      await trackSearch(query, searchParams.filters, totalResults || 0);
    }
    
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'query') {
      setSearchQuery(suggestion.value);
      handleSearch(suggestion.value);
    } else if (suggestion.type === 'tool') {
      const newTools = [...searchParams.filters.tools];
      if (!newTools.includes(suggestion.value)) {
        newTools.push(suggestion.value);
      }
      onSearchParamsChange({
        ...searchParams,
        filters: { ...searchParams.filters, tools: newTools },
        page: 1,
      });
    } else if (suggestion.type === 'category') {
      // For categories, we'd need the category ID, but this is just for demo
      setSearchQuery(suggestion.value);
      handleSearch(suggestion.value);
    }
    setShowSuggestions(false);
  };

  const handleSortChange = (sortBy: SearchParams['sortBy']) => {
    onSearchParamsChange({
      ...searchParams,
      sortBy,
      page: 1,
    });
    setShowSortMenu(false);
  };

  const handleViewModeChange = (viewMode: 'grid' | 'list') => {
    onSearchParamsChange({
      ...searchParams,
      viewMode,
    });
  };

  const clearSearch = () => {
    setSearchQuery('');
    handleSearch('');
  };

  const getActiveFilterCount = () => {
    const filters = searchParams.filters;
    return (
      filters.difficulty.length +
      filters.tools.length +
      filters.categories.length +
      (filters.completed !== undefined ? 1 : 0) +
      (filters.bookmarked !== undefined ? 1 : 0)
    );
  };

  const currentSortOption = sortOptions.find(option => option.value === searchParams.sortBy) || sortOptions[0];

  return (
    <div className={`bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-30 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Mobile-first layout with responsive design */}
        <div className="space-y-4">
          {/* Top row - Search input */}
          <div className="flex items-center gap-3">
            {/* Search input with autocomplete */}
            <div className="flex-1 min-w-0 relative">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search lessons, tools, or topics..."
                value={searchQuery}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                onFocus={() => setShowSuggestions(suggestions.length > 0)}
                onBlur={() => {
                  // Delay hiding suggestions to allow clicks
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                className="pl-10 pr-10 py-3 text-base border-gray-300 rounded-lg focus:ring-ai-blue-500 focus:border-ai-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            {/* Search suggestions dropdown */}
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-1 z-50"
                >
                  <Card className="shadow-lg">
                    <CardContent className="p-2">
                      {suggestions.map((suggestion, index) => (
                        <motion.button
                          key={`${suggestion.type}-${suggestion.value}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 rounded flex items-center gap-3 transition-colors"
                        >
                          <div className="flex-shrink-0">
                            {suggestion.type === 'query' && <Search className="w-4 h-4 text-gray-400" />}
                            {suggestion.type === 'tool' && <BookOpen className="w-4 h-4 text-ai-blue-500" />}
                            {suggestion.type === 'category' && <Star className="w-4 h-4 text-ai-purple-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-gray-900 truncate">{suggestion.label}</div>
                            <div className="text-xs text-gray-500 capitalize">{suggestion.type}</div>
                          </div>
                        </motion.button>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Filters toggle */}
          <Button
            variant={filtersOpen ? "default" : "outline"}
            onClick={onToggleFilters}
            className="relative shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters
            {getActiveFilterCount() > 0 && (
              <Badge 
                variant="secondary" 
                className="ml-2 bg-red-100 text-red-800 min-w-[1.5rem] h-6 rounded-full flex items-center justify-center"
              >
                {getActiveFilterCount()}
              </Badge>
            )}
          </Button>

          {/* Sort dropdown */}
          <div className="relative shrink-0">
            <Button
              variant="outline"
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="min-w-0"
            >
              <ArrowUpDown className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{currentSortOption.label}</span>
              <span className="sm:hidden">Sort</span>
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>

            <AnimatePresence>
              {showSortMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full right-0 mt-1 z-50"
                >
                  <Card className="shadow-lg min-w-[200px]">
                    <CardContent className="p-2">
                      {sortOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleSortChange(option.value)}
                          className={`w-full px-3 py-2 text-left hover:bg-gray-50 rounded flex items-center gap-3 transition-colors ${
                            searchParams.sortBy === option.value ? 'bg-ai-blue-50 text-ai-blue-600' : ''
                          }`}
                        >
                          {option.icon}
                          {option.label}
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* View mode toggle */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden shrink-0">
            <Button
              variant={searchParams.viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('grid')}
              className="rounded-none border-0"
            >
              <Grid3X3 className="w-4 h-4" />
              <span className="sr-only">Grid view</span>
            </Button>
            <Button
              variant={searchParams.viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('list')}
              className="rounded-none border-0 border-l border-gray-300"
            >
              <List className="w-4 h-4" />
              <span className="sr-only">List view</span>
            </Button>
          </div>
        </div>

        {/* Results summary */}
        {totalResults !== undefined && (
          <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-ai-blue-500 border-t-transparent rounded-full animate-spin" />
                  Searching...
                </div>
              ) : (
                <span>
                  {totalResults.toLocaleString()} {totalResults === 1 ? 'lesson' : 'lessons'} found
                  {searchQuery && ` for "${searchQuery}"`}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span>Sorted by {currentSortOption.label.toLowerCase()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Click outside handler for dropdowns */}
      {(showSortMenu || showSuggestions) && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => {
            setShowSortMenu(false);
            setShowSuggestions(false);
          }}
        />
      )}
    </div>
  );
}