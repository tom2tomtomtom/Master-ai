import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, BookOpen, Star } from 'lucide-react';

// Force this page to be dynamically rendered instead of statically generated
// Removed force-dynamic to prevent hydration issues
// export const dynamic = 'force-dynamic';

async function getLessons() {
  try {
    console.log('Fetching lessons from database...');
    const lessons = await prisma.lesson.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        lessonNumber: true,
        title: true,
        description: true,
        estimatedTime: true,
        difficultyLevel: true,
        isFree: true,
        tools: true,
      },
      orderBy: { lessonNumber: 'asc' },
      take: 50, // Show first 50 lessons
    });

    console.log(`Successfully fetched ${lessons.length} lessons from database`);
    return lessons;
  } catch (error) {
    console.error('Error fetching lessons:', error);
    
    // Minimal fallback for error cases - use real lesson IDs
    const fallbackLessons = [
      {
        id: 'cmdxqcooo0000wc4pbelww7oo',
        lessonNumber: 0,
        title: 'AI Tool Selection Guide - Choose Your Perfect AI Toolkit',
        description: 'Master the fundamentals of AI tool selection to maximize your productivity.',
        estimatedTime: 15,
        difficultyLevel: 'Beginner',
        isFree: true,
        tools: ['ChatGPT', 'Claude', 'Gemini'],
      },
      {
        id: 'cmdxqcoot0001wc4pco0ht9fx',
        lessonNumber: 1,
        title: 'ChatGPT Email Mastery - Transform Your Inbox',
        description: 'Learn professional email communication with ChatGPT.',
        estimatedTime: 25,
        difficultyLevel: 'Beginner',
        isFree: true,
        tools: ['ChatGPT'],
      },
    ];
    
    return fallbackLessons;
  }
}

function getDifficultyColor(level: string): string {
  switch (level?.toLowerCase()) {
    case 'beginner':
      return 'bg-green-100 text-green-800';
    case 'intermediate':
      return 'bg-yellow-100 text-yellow-800';
    case 'advanced':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export default async function LessonsPage() {
  const lessons = await getLessons();

  return (
    <DashboardLayout 
      title="All Lessons" 
      subtitle="Browse and start learning from our comprehensive AI curriculum"
    >
      <div className="space-y-6">
        {lessons.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Lessons Available</h3>
                <p className="text-gray-500">Lessons are being prepared. Check back soon!</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.map((lesson) => (
              <Link key={lesson.id} href={`/dashboard/lesson/${lesson.id}`} className="block">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          Lesson {lesson.lessonNumber}
                        </Badge>
                        {lesson.isFree && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            FREE
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg line-clamp-2 mb-2">
                        {lesson.title}
                      </CardTitle>
                    </div>
                  </div>
                  
                  {lesson.description && (
                    <p className="text-sm text-gray-800 line-clamp-2">
                      {lesson.description}
                    </p>
                  )}
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm text-gray-700 mb-4">
                    <div className="flex items-center gap-4">
                      {lesson.estimatedTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{lesson.estimatedTime}m</span>
                        </div>
                      )}
                      
                      {lesson.difficultyLevel && (
                        <Badge 
                          className={`text-xs ${getDifficultyColor(lesson.difficultyLevel)}`}
                          variant="secondary"
                        >
                          {lesson.difficultyLevel}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {lesson.tools && Array.isArray(lesson.tools) && lesson.tools.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {lesson.tools.slice(0, 3).map((tool: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tool}
                        </Badge>
                      ))}
                      {lesson.tools.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{lesson.tools.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="mt-4 text-center">
                    <span className="inline-flex items-center justify-center w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                      Start Lesson
                    </span>
                  </div>
                </CardContent>
              </Card>
              </Link>
            ))}
          </div>
        )}

        {lessons.length >= 20 && (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <p className="text-gray-600 mb-4">Showing first 20 lessons</p>
                <Button variant="outline">
                  Load More Lessons
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}