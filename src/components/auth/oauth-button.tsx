'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { monitoring } from '@/lib/monitoring';
import { appLogger } from '@/lib/logger';

interface OAuthButtonProps {
  provider: 'google';
  callbackUrl?: string;
  className?: string;
}

const providerConfig = {
  google: {
    name: 'Google',
    icon: (props: any) => (
      <svg viewBox="0 0 24 24" {...props}>
        <path
          fill="currentColor"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="currentColor"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="currentColor"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="currentColor"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    ),
    bgColor: 'bg-white hover:bg-gray-50',
    textColor: 'text-gray-900',
    borderColor: 'border-gray-300'
  }
};

export function OAuthButton({ provider, callbackUrl, className }: OAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const config = providerConfig[provider];
  const Icon = config.icon;

  // Check if this provider is available on the server
  useEffect(() => {
    async function checkProviderAvailability() {
      try {
        const response = await fetch('/api/auth/providers');
        const data = await response.json();
        
        if (data.success) {
          const providerExists = data.providers.some(
            (p: { id: string }) => p.id === provider
          );
          setIsAvailable(providerExists);
        }
      } catch (error) {
        appLogger.warn('Failed to check provider availability', { provider, error, component: 'OAuthButton' });
        setIsAvailable(false);
      }
    }

    checkProviderAvailability();
  }, [provider]);

  const handleSignIn = async () => {
    if (!isAvailable) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}${callbackUrl || '/dashboard'}`
        }
      });

      if (error) {
        appLogger.error('OAuth signin error', { provider, error, callbackUrl, component: 'OAuthButton' });
        monitoring.logError('oauth_signin_error', error, {
          provider,
          callbackUrl,
        });
        // Redirect to signin with error
        window.location.href = `/auth/signin?error=OAuthCallback&callbackUrl=${encodeURIComponent(callbackUrl || '/dashboard')}`;
      }
    } catch (error) {
      appLogger.error('OAuth signin error', { provider, error, callbackUrl, component: 'OAuthButton' });
      monitoring.logError('oauth_signin_error', error, {
        provider,
        callbackUrl,
      });
      // Redirect to signin with error
      window.location.href = `/auth/signin?error=OAuthCallback&callbackUrl=${encodeURIComponent(callbackUrl || '/dashboard')}`;
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render if provider is not available
  if (!isAvailable) {
    return null;
  }

  return (
    <Button
      variant="outline"
      type="button"
      disabled={isLoading}
      onClick={handleSignIn}
      className={cn(
        'w-full',
        config.bgColor,
        config.textColor,
        config.borderColor,
        className
      )}
    >
      {isLoading ? (
        <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <Icon className="w-4 h-4 mr-2" />
      )}
      Continue with {config.name}
    </Button>
  );
}