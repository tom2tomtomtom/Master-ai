import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Master-AI - AI Education Platform",
  description: "Master all AI tools with our comprehensive educational platform featuring 88 lessons across 8 learning paths",
};

// Initialize logging system on server startup with dynamic import
if (typeof window === 'undefined') {
  import('@/lib/logging-config').then(({ initializeLogging, LogRotationManager }) => {
    initializeLogging({
      enableFileLogging: process.env.NODE_ENV === 'production',
      enablePerformanceLogging: true,
      logLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
    });

    // Start log rotation in production
    if (process.env.NODE_ENV === 'production') {
      LogRotationManager.startRotation(24); // Rotate every 24 hours
    }
  }).catch(error => {
    console.warn('Failed to initialize logging:', error);
  });
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
