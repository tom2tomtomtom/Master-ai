'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Home,
  BookOpen,
  TrendingUp,
  Award,
  Settings,
  CreditCard,
  Bookmark,
  Search,
  Sparkles,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Discover', href: '/discover', icon: Search },
  { name: 'My Lessons', href: '/dashboard/lessons', icon: BookOpen },
  { name: 'Learning Paths', href: '/dashboard/paths', icon: TrendingUp },
  { name: 'Achievements', href: '/dashboard/achievements', icon: Award },
  { name: 'Bookmarks', href: '/dashboard/bookmarks', icon: Bookmark },
];

const bottomNav = [
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  { name: 'Settings', href: '/dashboard/profile', icon: Settings },
];

interface DashboardSidebarProps {
  children?: React.ReactNode;
}

export function DashboardSidebar({ children }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const NavItem = ({ item, index = 0 }: { item: any; index?: number }) => {
    const isActive = pathname === item.href;
    
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
      >
        <Link
          href={item.href}
          className={cn(
            "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
            isActive ?
              "bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30" :
              "hover:bg-gray-100 border border-transparent hover:border-gray-200"
          )}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <item.icon className={cn(
            "w-5 h-5 transition-colors",
            isActive ? "text-purple-500" : "text-gray-400 group-hover:text-purple-500"
          )} />
          <span className={cn(
            "font-medium transition-colors",
            isActive ? "text-gray-900" : "text-gray-600 group-hover:text-gray-900"
          )}>
            {item.name}
          </span>
          {isActive && (
            <motion.div
              className="ml-auto w-1.5 h-1.5 bg-purple-400 rounded-full"
              layoutId="activeIndicator"
            />
          )}
        </Link>
      </motion.div>
    );
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="mb-8">
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur-lg group-hover:blur-xl transition-all opacity-50" />
            <div className="relative w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Master-AI
          </h2>
        </Link>
      </div>

      {/* User Profile */}
      {session?.user && (
        <div className="mb-6 p-4 bg-white/50 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="relative">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {session.user.name?.[0] || 'U'}
                  </span>
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {session.user.name || 'User'}
              </p>
              <p className="text-xs text-gray-500">
                Pro Member
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="space-y-1 mb-6">
        {navigation.map((item, index) => (
          <NavItem key={item.name} item={item} index={index} />
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="mt-auto pt-6 border-t border-gray-200 space-y-1">
        {bottomNav.map((item, index) => (
          <NavItem key={item.name} item={item} index={navigation.length + index} />
        ))}

        {/* Logout Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: (navigation.length + bottomNav.length) * 0.05 }}
          onClick={() => signOut()}
          className="w-full group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all duration-200"
        >
          <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" />
          <span className="font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
            Sign Out
          </span>
        </motion.button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white border border-gray-200 rounded-lg shadow-sm"
      >
        {isMobileMenuOpen ? (
          <X className="w-5 h-5 text-gray-900" />
        ) : (
          <Menu className="w-5 h-5 text-gray-900" />
        )}
      </button>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-white/80 backdrop-blur-xl border-r border-gray-200">
        <div className="flex flex-col w-full p-6">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: isMobileMenuOpen ? 0 : -280 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="lg:hidden fixed left-0 top-0 h-full w-72 bg-white/95 backdrop-blur-xl border-r border-gray-200 z-40"
      >
        <div className="flex flex-col w-full p-6 pt-16">
          <SidebarContent />
        </div>
      </motion.aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
        />
      )}

      {/* Main Content */}
      <div className="lg:pl-64 min-h-screen">
        {children}
      </div>
    </>
  );
}

// Export with the name expected by other components
export { DashboardSidebar as Sidebar };