'use client';

import { SessionProvider } from 'next-auth/react';
import { SafeAuthProvider } from '@/components/providers/safe-auth-provider';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <SafeAuthProvider>
        {children}
      </SafeAuthProvider>
    </SessionProvider>
  );
}