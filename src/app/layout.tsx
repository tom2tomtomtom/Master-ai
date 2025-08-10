export const metadata = {
  title: "Master-AI - AI Education Platform",
  description: "Master all AI tools with our comprehensive educational platform featuring 88 lessons across 8 learning paths",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
