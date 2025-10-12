'use client';

import { useSupabaseAuth } from '@/components/providers/supabase-auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Sidebar } from './sidebar';
import { DashboardHeader } from './header';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
}

export function DashboardLayout({ children, title, subtitle, headerActions }: DashboardLayoutProps) {
  const { user, loading } = useSupabaseAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect after auth has loaded and we confirm no user
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  // Show content immediately to prevent hydration mismatch
  // Auth redirect will happen via useEffect
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Sidebar>
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader title={title} subtitle={subtitle}>
          {headerActions}
        </DashboardHeader>
        <main className="p-6">
          {children}
        </main>
      </div>
    </Sidebar>
  );
}