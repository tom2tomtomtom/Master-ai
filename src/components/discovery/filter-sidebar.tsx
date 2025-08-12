'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SlidersHorizontal, 
  X, 
  ChevronDown, 
  ChevronRight, 
  Clock, 
  Star, 
  BookOpen, 
  CheckCircle,
  XCircle,
  Bookmark,
  RotateCcw,
  Search
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import type { LessonFilters, SearchResponse } from '@/types/discovery';
import { useInteractionTracking } from '@/hooks/use-interaction-tracking';

interface FilterSidebarProps {
  filters: LessonFilters;
  onFiltersChange: (filters: LessonFilters) => void;
  metadata?: SearchResponse['filters'];
  isLoading?: boolean;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

interface FilterSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
}

export function FilterSidebar({
  filters,
  onFiltersChange,
  metadata,
  isLoading = false,
  isOpen,
  onClose,
  className = '',
}: FilterSidebarProps) {
  const { trackFilter } = useInteractionTracking();
  
  const [filterSections, setFilterSections] = useState<FilterSection[]>([
    { id: 'search', title: 'Search', icon: <Search className="w-4 h-4" />, isOpen: true },
    { id: 'difficulty', title: 'Difficulty', icon: <Star className="w-4 h-4" />, isOpen: true },
    { id: 'tools', title: 'AI Tools', icon: <BookOpen className="w-4 h-4" />, isOpen: true },
    { id: 'categories', title: 'Categories', icon: <BookOpen className="w-4 h-4" />, isOpen: true },
    { id: 'duration', title: 'Duration', icon: <Clock className="w-4 h-4" />, isOpen: true },
    { id: 'progress', title: 'Progress', icon: <CheckCircle className="w-4 h-4" />, isOpen: false },
  ]);

  const [localFilters, setLocalFilters] = useState<LessonFilters>(filters);
  const [durationRange, setDurationRange] = useState({
    min: filters.duration.min,
    max: filters.duration.max,
  });

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
    setDurationRange({
      min: filters.duration.min,
      max: filters.duration.max,
    });
  }, [filters]);

  const toggleSection = (sectionId: string) => {
    setFilterSections(prev =>
      prev.map(section =>
        section.id === sectionId
          ? { ...section, isOpen: !section.isOpen }
          : section
      )
    );
  };

  const updateFilter = async (key: keyof LessonFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
    
    // Track filter interaction
    await trackFilter(key, value, 0); // Results count will be updated by parent
  };

  const toggleDifficulty = (difficulty: string) => {
    const newDifficulties = localFilters.difficulty.includes(difficulty as any)
      ? localFilters.difficulty.filter(d => d !== difficulty)
      : [...localFilters.difficulty, difficulty as 'beginner' | 'intermediate' | 'advanced'];
    
    updateFilter('difficulty', newDifficulties);
  };

  const toggleTool = (tool: string) => {
    const newTools = localFilters.tools.includes(tool)
      ? localFilters.tools.filter(t => t !== tool)
      : [...localFilters.tools, tool];
    
    updateFilter('tools', newTools);
  };

  const toggleCategory = (categoryId: string) => {
    const newCategories = localFilters.categories.includes(categoryId)
      ? localFilters.categories.filter(c => c !== categoryId)
      : [...localFilters.categories, categoryId];
    
    updateFilter('categories', newCategories);
  };

  const handleDurationChange = (type: 'min' | 'max', value: number) => {
    const newRange = { ...durationRange, [type]: value };
    setDurationRange(newRange);
    updateFilter('duration', newRange);
  };

  const clearAllFilters = () => {
    const clearedFilters: LessonFilters = {
      difficulty: [],
      tools: [],
      categories: [],
      duration: {
        min: metadata?.durationRange?.min || 0,
        max: metadata?.durationRange?.max || 120,
      },
      searchQuery: '',
      completed: undefined,
      bookmarked: undefined,
    };
    setLocalFilters(clearedFilters);
    setDurationRange(clearedFilters.duration);
    onFiltersChange(clearedFilters);
  };

  const getActiveFilterCount = () => {
    return (
      localFilters.difficulty.length +
      localFilters.tools.length +
      localFilters.categories.length +
      (localFilters.searchQuery ? 1 : 0) +
      (localFilters.completed !== undefined ? 1 : 0) +
      (localFilters.bookmarked !== undefined ? 1 : 0) +
      (localFilters.duration.min > (metadata?.durationRange?.min || 0) ||
       localFilters.duration.max < (metadata?.durationRange?.max || 120) ? 1 : 0)
    );
  };

  const difficultyOptions = [
    { value: 'beginner', label: 'Beginner', color: 'text-green-600' },
    { value: 'intermediate', label: 'Intermediate', color: 'text-yellow-600' },
    { value: 'advanced', label: 'Advanced', color: 'text-red-600' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Mobile overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed left-0 top-0 bottom-0 w-80 bg-white shadow-xl z-50 overflow-y-auto ${className}`}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <SlidersHorizontal className="w-5 h-5 text-ai-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                  {getActiveFilterCount() > 0 && (
                    <Badge variant="secondary" className="bg-ai-blue-100 text-ai-blue-800">
                      {getActiveFilterCount()}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {getActiveFilterCount() > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={onClose} className="md:hidden">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Filter sections */}
              <div className="space-y-4">
                {filterSections.map((section) => (
                  <Card key={section.id} className="overflow-hidden">
                    <div 
                      className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleSection(section.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {section.icon}
                          <span className="font-medium text-gray-900">{section.title}</span>
                        </div>
                        {section.isOpen ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                    
                    <AnimatePresence>
                      {section.isOpen && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <CardContent className="pt-0 pb-4">
                            {section.id === 'search' && (
                              <div className="space-y-3">
                                <Input
                                  placeholder="Search lessons..."
                                  value={localFilters.searchQuery}
                                  onChange={(e) => updateFilter('searchQuery', e.target.value)}
                                  className="w-full"
                                />
                              </div>
                            )}

                            {section.id === 'difficulty' && (
                              <div className="space-y-3">
                                {difficultyOptions.map((option) => (
                                  <div key={option.value} className="flex items-center space-x-3">
                                    <Checkbox
                                      id={`difficulty-${option.value}`}
                                      checked={localFilters.difficulty.includes(option.value as any)}
                                      onCheckedChange={() => toggleDifficulty(option.value)}
                                    />
                                    <Label 
                                      htmlFor={`difficulty-${option.value}`}
                                      className={`flex-1 cursor-pointer ${option.color}`}
                                    >
                                      {option.label}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            )}

                            {section.id === 'tools' && metadata?.availableTools && (
                              <div className="space-y-3 max-h-48 overflow-y-auto">
                                {metadata.availableTools.map((tool) => (
                                  <div key={tool} className="flex items-center space-x-3">
                                    <Checkbox
                                      id={`tool-${tool}`}
                                      checked={localFilters.tools.includes(tool)}
                                      onCheckedChange={() => toggleTool(tool)}
                                    />
                                    <Label 
                                      htmlFor={`tool-${tool}`}
                                      className="flex-1 cursor-pointer text-sm"
                                    >
                                      {tool}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            )}

                            {section.id === 'categories' && metadata?.availableCategories && (
                              <div className="space-y-3 max-h-48 overflow-y-auto">
                                {metadata.availableCategories.map((category) => (
                                  <div key={category.id} className="flex items-center space-x-3">
                                    <Checkbox
                                      id={`category-${category.id}`}
                                      checked={localFilters.categories.includes(category.id)}
                                      onCheckedChange={() => toggleCategory(category.id)}
                                    />
                                    <Label 
                                      htmlFor={`category-${category.id}`}
                                      className="flex-1 cursor-pointer text-sm flex items-center gap-2"
                                    >
                                      {category.icon && <span>{category.icon}</span>}
                                      {category.name}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            )}

                            {section.id === 'duration' && (
                              <div className="space-y-4">
                                <div>
                                  <Label className="text-sm text-gray-600">Minimum Duration (minutes)</Label>
                                  <Input
                                    type="number"
                                    min={metadata?.durationRange?.min || 0}
                                    max={metadata?.durationRange?.max || 120}
                                    value={durationRange.min}
                                    onChange={(e) => handleDurationChange('min', parseInt(e.target.value) || 0)}
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm text-gray-600">Maximum Duration (minutes)</Label>
                                  <Input
                                    type="number"
                                    min={metadata?.durationRange?.min || 0}
                                    max={metadata?.durationRange?.max || 120}
                                    value={durationRange.max}
                                    onChange={(e) => handleDurationChange('max', parseInt(e.target.value) || 120)}
                                    className="mt-1"
                                  />
                                </div>
                                <div className="text-xs text-gray-500">
                                  Range: {durationRange.min} - {durationRange.max} minutes
                                </div>
                              </div>
                            )}

                            {section.id === 'progress' && (
                              <div className="space-y-3">
                                <div className="flex items-center space-x-3">
                                  <Checkbox
                                    id="progress-completed"
                                    checked={localFilters.completed === true}
                                    onCheckedChange={(checked) => 
                                      updateFilter('completed', checked ? true : undefined)
                                    }
                                  />
                                  <Label htmlFor="progress-completed" className="flex items-center gap-2 cursor-pointer">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    Completed lessons only
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <Checkbox
                                    id="progress-incomplete"
                                    checked={localFilters.completed === false}
                                    onCheckedChange={(checked) => 
                                      updateFilter('completed', checked ? false : undefined)
                                    }
                                  />
                                  <Label htmlFor="progress-incomplete" className="flex items-center gap-2 cursor-pointer">
                                    <XCircle className="w-4 h-4 text-gray-500" />
                                    Incomplete lessons only
                                  </Label>
                                </div>
                                <Separator />
                                <div className="flex items-center space-x-3">
                                  <Checkbox
                                    id="bookmarked-only"
                                    checked={localFilters.bookmarked === true}
                                    onCheckedChange={(checked) => 
                                      updateFilter('bookmarked', checked ? true : undefined)
                                    }
                                  />
                                  <Label htmlFor="bookmarked-only" className="flex items-center gap-2 cursor-pointer">
                                    <Bookmark className="w-4 h-4 text-yellow-600" />
                                    Bookmarked lessons only
                                  </Label>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                ))}
              </div>

              {/* Active filters summary */}
              {getActiveFilterCount() > 0 && (
                <Card className="mt-6">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">Active Filters</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Clear All
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {localFilters.searchQuery && (
                        <Badge variant="outline" className="bg-ai-blue-50 text-ai-blue-700 border-ai-blue-200">
                          Search: "{localFilters.searchQuery}"
                        </Badge>
                      )}
                      {localFilters.difficulty.map((difficulty) => (
                        <Badge key={difficulty} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {difficulty}
                        </Badge>
                      ))}
                      {localFilters.tools.slice(0, 3).map((tool) => (
                        <Badge key={tool} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          {tool}
                        </Badge>
                      ))}
                      {localFilters.tools.length > 3 && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          +{localFilters.tools.length - 3} tools
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}