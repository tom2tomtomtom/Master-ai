'use client';

import { SessionProvider } from 'next-auth/react';
import { SafeAuthProvider } from '@/components/providers/safe-auth-provider';
import SupabaseAuthProvider from '@/components/providers/supabase-auth-provider';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SupabaseAuthProvider>
      <SessionProvider>
        <SafeAuthProvider>
          {children}
        </SafeAuthProvider>
      </SessionProvider>
    </SupabaseAuthProvider>
  );
}