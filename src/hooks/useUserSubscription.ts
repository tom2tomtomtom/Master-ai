'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/safe-auth-provider';
import { appLogger } from '@/lib/logger';

interface UserSubscriptionData {
  subscriptionTier: 'free' | 'pro' | 'team' | 'enterprise';
  subscriptionStatus: 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'UNPAID' | 'INCOMPLETE';
  role: string;
  loading: boolean;
  error: string | null;
}

export function useUserSubscription(): UserSubscriptionData {
  const { user, loading: authLoading } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState<UserSubscriptionData>({
    subscriptionTier: 'free',
    subscriptionStatus: 'ACTIVE',
    role: 'USER',
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchUserSubscription() {
      if (authLoading) return;
      
      if (!user) {
        setSubscriptionData(prev => ({
          ...prev,
          loading: false,
          subscriptionTier: 'free',
          subscriptionStatus: 'ACTIVE',
          role: 'USER',
        }));
        return;
      }

      try {
        const response = await fetch('/api/user/subscription', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user subscription data');
        }

        const data = await response.json();
        
        setSubscriptionData({
          subscriptionTier: data.subscriptionTier || 'free',
          subscriptionStatus: data.subscriptionStatus || 'ACTIVE',
          role: data.role || 'USER',
          loading: false,
          error: null,
        });
      } catch (error) {
        appLogger.error('Error fetching user subscription', { error, component: 'useUserSubscription' });
        setSubscriptionData(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          // Fallback to free tier on error
          subscriptionTier: 'free',
          subscriptionStatus: 'ACTIVE',
          role: 'USER',
        }));
      }
    }

    fetchUserSubscription();
  }, [user, authLoading]);

  return subscriptionData;
}