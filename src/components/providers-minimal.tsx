'use client';

interface ProvidersProps {
  children: React.ReactNode;
}

export function MinimalProviders({ children }: ProvidersProps) {
  return <>{children}</>;
}