'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  BookOpen, 
  Bookmark, 
  StickyNote, 
  Trophy, 
  User, 
  Search,
  Menu,
  X,
  Brain,
  BarChart3,
  CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SubscriptionIndicator } from '@/components/subscription/subscription-indicator';

const sidebarItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: 'Learning Paths',
    href: '/dashboard/paths',
    icon: BookOpen,
  },
  {
    title: 'Progress',
    href: '/dashboard/progress',
    icon: BarChart3,
  },
  {
    title: 'Bookmarks',
    href: '/dashboard/bookmarks',
    icon: Bookmark,
  },
  {
    title: 'Notes',
    href: '/dashboard/notes',
    icon: StickyNote,
  },
  {
    title: 'Achievements',
    href: '/dashboard/achievements',
    icon: Trophy,
  },
  {
    title: 'Search',
    href: '/dashboard/search',
    icon: Search,
  },
  {
    title: 'Profile',
    href: '/dashboard/profile',
    icon: User,
  },
  {
    title: 'Billing',
    href: '/dashboard/billing',
    icon: CreditCard,
  },
];

interface SidebarProps {
  children: React.ReactNode;
}

export function Sidebar({ children }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between p-4 bg-white border-b">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-blue-600" />
            <span className="font-bold text-xl text-gray-900">Master-AI</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      <div className="lg:flex">
        {/* Sidebar */}
        <div
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
            isOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {/* Desktop Logo */}
          <div className="hidden lg:flex items-center px-6 py-4 border-b">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-blue-600" />
              <span className="font-bold text-xl text-gray-900">Master-AI</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.title}
                </Link>
              );
            })}
          </nav>

          {/* Subscription Indicator */}
          <div className="p-4 border-t">
            <SubscriptionIndicator />
          </div>
        </div>

        {/* Mobile overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}

        {/* Main content */}
        <div className="flex-1 lg:ml-0">
          {children}
        </div>
      </div>
    </div>
  );
}