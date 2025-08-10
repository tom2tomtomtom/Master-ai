import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Master-AI - AI Education Platform",
  description: "Master all AI tools with our comprehensive educational platform featuring 88 lessons across 8 learning paths",
};

// Logging initialization will be handled by API routes to prevent client bundling

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
