'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Crown, Users, Building2 } from 'lucide-react';
import Link from 'next/link';

interface SubscriptionGateProps {
  children: ReactNode;
  requiredTier: 'free' | 'pro' | 'team' | 'enterprise';
  fallback?: ReactNode;
  redirectTo?: string;
}

const tierHierarchy = {
  free: 0,
  pro: 1,
  team: 2,
  enterprise: 3
};

const tierConfig = {
  free: {
    name: 'Free',
    icon: null,
    color: 'bg-gray-100 text-gray-800',
    description: 'Basic access to foundation lessons'
  },
  pro: {
    name: 'Pro',
    icon: Crown,
    color: 'bg-blue-100 text-blue-800',
    description: 'Full access to all lessons and features'
  },
  team: {
    name: 'Team',
    icon: Users,
    color: 'bg-purple-100 text-purple-800',
    description: 'Team collaboration and management features'
  },
  enterprise: {
    name: 'Enterprise',
    icon: Building2,
    color: 'bg-yellow-100 text-yellow-800',
    description: 'Advanced features and dedicated support'
  }
};

export function SubscriptionGate({ 
  children, 
  requiredTier, 
  fallback,
  redirectTo = '/pricing'
}: SubscriptionGateProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-center">
          <div className="w-8 h-8 bg-gray-200 rounded-full mx-auto mb-4"></div>
          <div className="w-24 h-4 bg-gray-200 rounded mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/auth/signin');
    return null;
  }

  const userTier = 'free'; // TODO: Get from user subscription data
  const userTierLevel = tierHierarchy[userTier as keyof typeof tierHierarchy];
  const requiredTierLevel = tierHierarchy[requiredTier];

  // Check if user has sufficient tier access
  const hasAccess = userTierLevel >= requiredTierLevel;

  if (hasAccess) {
    return <>{children}</>;
  }

  // Show fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default upgrade prompt
  const RequiredIcon = tierConfig[requiredTier].icon;
  
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-xl">Upgrade Required</CardTitle>
          <CardDescription>
            This content requires a {tierConfig[requiredTier].name} subscription or higher
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Current vs Required Tier */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Your Plan:</span>
              <Badge className={tierConfig[userTier as keyof typeof tierConfig].color}>
                {tierConfig[userTier as keyof typeof tierConfig].name}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium">Required:</span>
              <Badge className={tierConfig[requiredTier].color}>
                {RequiredIcon && <RequiredIcon className="w-3 h-3 mr-1" />}
                {tierConfig[requiredTier].name}
              </Badge>
            </div>
          </div>

          {/* Benefits */}
          <div className="text-left">
            <h4 className="font-medium mb-2">What you'll get:</h4>
            <p className="text-sm text-gray-600 mb-4">
              {tierConfig[requiredTier].description}
            </p>
            
            {requiredTier === 'pro' && (
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Access to all 81 lessons</li>
                <li>• Interactive exercises</li>
                <li>• Professional certificates</li>
                <li>• Priority support</li>
              </ul>
            )}
            
            {requiredTier === 'team' && (
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Everything in Pro</li>
                <li>• Team dashboard</li>
                <li>• Progress analytics</li>
                <li>• Custom learning paths</li>
              </ul>
            )}
            
            {requiredTier === 'enterprise' && (
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Everything in Team</li>
                <li>• Custom training</li>
                <li>• Dedicated support</li>
                <li>• API integrations</li>
              </ul>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href={redirectTo}>
                Upgrade to {tierConfig[requiredTier].name}
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              className="w-full"
            >
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper hook for checking subscription access
export function useSubscriptionAccess(requiredTier: keyof typeof tierHierarchy) {
  const { user } = useAuth();
  
  if (!user) return false;
  
  const userTier = 'free'; // TODO: Get from user subscription data
  const userTierLevel = tierHierarchy[userTier as keyof typeof tierHierarchy];
  const requiredTierLevel = tierHierarchy[requiredTier];
  
  return userTierLevel >= requiredTierLevel;
}