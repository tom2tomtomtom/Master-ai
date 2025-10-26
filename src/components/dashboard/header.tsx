'use client';

import { Bell, ChevronDown, User, CreditCard, Settings, LogOut, Crown } from 'lucide-react';
import { appLogger } from '@/lib/logger';
import { useAuth } from '@/components/providers/safe-auth-provider';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function DashboardHeader({ title, subtitle, children }: DashboardHeaderProps) {
  const { user, session, signOut } = useAuth();
  const router = useRouter();

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const subscriptionTier = (user?.user_metadata?.subscriptionTier || 'free') as string;
  const subscriptionConfig = {
    free: { name: 'Free', color: 'bg-gray-100 text-gray-800' },
    pro: { name: 'Pro', color: 'bg-blue-100 text-blue-800' },
    team: { name: 'Team', color: 'bg-purple-100 text-purple-800' },
    enterprise: { name: 'Enterprise', color: 'bg-yellow-100 text-yellow-800' }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      appLogger.error('Sign out error:', { error: error, component: 'header' });
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {children}
          
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
              3
            </span>
          </Button>

          {/* User Menu */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-100">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url || undefined} />
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-medium">
                    {getInitials(user?.user_metadata?.full_name || user?.user_metadata?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.user_metadata?.full_name || user?.user_metadata?.name || 'User'}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">
                      {user?.email}
                    </span>
                    <Badge 
                      className={cn(
                        "text-xs px-2 py-0.5",
                        subscriptionConfig[subscriptionTier as keyof typeof subscriptionConfig]?.color
                      )}
                    >
                      {subscriptionTier !== 'free' && <Crown className="w-2.5 h-2.5 mr-1" />}
                      {subscriptionConfig[subscriptionTier as keyof typeof subscriptionConfig]?.name}
                    </Badge>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </Button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="min-w-[220px] bg-white rounded-md border border-gray-200 shadow-lg z-50 p-1"
                sideOffset={5}
                align="end"
              >
                {/* User Info Header */}
                <div className="px-3 py-2 border-b border-gray-100">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.user_metadata?.full_name || user?.user_metadata?.name || 'User'}
                  </div>
                  <div className="text-xs text-gray-600 truncate">
                    {user?.email}
                  </div>
                  <Badge 
                    className={cn(
                      "text-xs px-2 py-0.5 mt-1",
                      subscriptionConfig[subscriptionTier as keyof typeof subscriptionConfig]?.color
                    )}
                  >
                    {subscriptionTier !== 'free' && <Crown className="w-2.5 h-2.5 mr-1" />}
                    {subscriptionConfig[subscriptionTier as keyof typeof subscriptionConfig]?.name} Plan
                  </Badge>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <DropdownMenu.Item
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer outline-none"
                    onClick={() => router.push('/dashboard/profile')}
                  >
                    <User className="w-4 h-4" />
                    Profile Settings
                  </DropdownMenu.Item>
                  
                  <DropdownMenu.Item
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer outline-none"
                    onClick={() => router.push('/dashboard/settings')}
                  >
                    <Settings className="w-4 h-4" />
                    Preferences
                  </DropdownMenu.Item>
                  
                  <DropdownMenu.Item
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer outline-none"
                    onClick={() => router.push('/pricing')}
                  >
                    <CreditCard className="w-4 h-4" />
                    Billing & Plans
                  </DropdownMenu.Item>
                </div>

                <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />
                
                <DropdownMenu.Item
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md cursor-pointer outline-none"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
    </header>
  );
}