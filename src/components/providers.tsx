'use client';

import { SafeAuthProvider } from '@/components/providers/safe-auth-provider';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SafeAuthProvider>
      {children}
    </SafeAuthProvider>
  );
}