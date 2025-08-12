'use client';

import { useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { appLogger } from '@/lib/logger';
import type { InteractionData } from '@/types/discovery';

export function useInteractionTracking() {
  const sessionData = useSession();
  const session = sessionData?.data;

  const trackInteraction = useCallback(async (data: InteractionData) => {
    // Only track interactions for authenticated users
    if (!session?.user?.id) {
      return;
    }

    try {
      const response = await fetch('/api/lessons/interact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          metadata: {
            ...data.metadata,
            sessionId: session.user.id, // Use user ID as session identifier
            timestamp: Date.now(),
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to track interaction');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      // Log error but don't throw - interaction tracking shouldn't break the user experience
      appLogger.errors.clientError('interaction-tracking', error as Error, {
        context: 'track_interaction',
        interactionType: data.interactionType,
        lessonId: data.lessonId,
        userId: session.user.id,
      });
      
      console.warn('Failed to track interaction:', error);
    }
  }, [session]);

  const trackSearch = useCallback(async (
    searchQuery: string, 
    filters: Record<string, any>, 
    resultsCount: number
  ) => {
    if (!session?.user?.id) return;

    return trackInteraction({
      lessonId: '', // Search interactions don't need a specific lesson ID
      interactionType: 'search',
      metadata: {
        searchQuery,
        filterValues: filters,
        resultsCount,
        source: 'search_interface',
      },
    });
  }, [session, trackInteraction]);

  const trackFilter = useCallback(async (
    filterType: string,
    filterValue: any,
    resultsCount: number
  ) => {
    if (!session?.user?.id) return;

    return trackInteraction({
      lessonId: '', // Filter interactions don't need a specific lesson ID
      interactionType: 'filter',
      metadata: {
        filterType,
        filterValue,
        resultsCount,
        source: 'filter_interface',
      },
    });
  }, [session, trackInteraction]);

  const trackView = useCallback(async (lessonId: string, source?: string) => {
    return trackInteraction({
      lessonId,
      interactionType: 'view',
      metadata: { source },
    });
  }, [trackInteraction]);

  const trackStart = useCallback(async (lessonId: string, source?: string) => {
    return trackInteraction({
      lessonId,
      interactionType: 'start',
      metadata: { source },
    });
  }, [trackInteraction]);

  const trackComplete = useCallback(async (
    lessonId: string, 
    duration?: number,
    source?: string
  ) => {
    return trackInteraction({
      lessonId,
      interactionType: 'complete',
      metadata: { duration, source },
    });
  }, [trackInteraction]);

  const trackBookmark = useCallback(async (
    lessonId: string, 
    isBookmarked: boolean,
    source?: string
  ) => {
    return trackInteraction({
      lessonId,
      interactionType: 'bookmark',
      metadata: { bookmarked: isBookmarked, source },
    });
  }, [trackInteraction]);

  const trackPreview = useCallback(async (lessonId: string, source?: string) => {
    return trackInteraction({
      lessonId,
      interactionType: 'preview',
      metadata: { source },
    });
  }, [trackInteraction]);

  return {
    trackInteraction,
    trackSearch,
    trackFilter,
    trackView,
    trackStart,
    trackComplete,
    trackBookmark,
    trackPreview,
    isAuthenticated: !!session?.user?.id,
  };
}