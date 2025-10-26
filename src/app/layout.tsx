export const dynamic = 'force-dynamic';

import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import ErrorBoundary from "@/components/error-boundary";
import DebugLogger from "@/components/debug-logger";

export const metadata: Metadata = {
  title: "Master-AI - AI Education Platform",
  description: "Master all AI tools with our comprehensive educational platform featuring 88 lessons across 8 learning paths",
};

// Build timestamp: 2025-01-11T01:20:00.000Z - Force cache invalidation
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ErrorBoundary>
          <DebugLogger />
          <Providers>
            {children}
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
