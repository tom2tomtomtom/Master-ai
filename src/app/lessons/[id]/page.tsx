import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Lock, ArrowRight, Clock, BarChart } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

type LessonWithPaths = Prisma.LessonGetPayload<{
  include: {
    learningPaths: {
      include: {
        learningPath: {
          select: {
            id: true;
            name: true;
            description: true;
            color: true;
            icon: true;
          };
        };
      };
    };
  };
}>;

async function getLesson(id: string): Promise<LessonWithPaths | null> {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        learningPaths: {
          include: {
            learningPath: {
              select: {
                id: true,
                name: true,
                description: true,
                color: true,
                icon: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!lesson || !lesson.isPublished) {
      return null;
    }

    return lesson;
  } catch (error) {
    return null;
  }
}

function LessonPreview({ lesson }: { lesson: LessonWithPaths }) {
  // Show first 500 characters as preview
  const preview = lesson.content.substring(0, 500);
  const hasMore = lesson.content.length > 500;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link href="/discover" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              ← Back to Discover
            </Link>
            <Link href="/auth/signup">
              <Button size="sm">
                Sign Up to Continue
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Lesson Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Lesson Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Lesson {lesson.lessonNumber}
            </span>
            {lesson.isFree && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Free Preview
              </span>
            )}
            {!lesson.isFree && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                <Lock className="w-3 h-3 mr-1" />
                Premium
              </span>
            )}
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {lesson.title}
          </h1>

          {lesson.description && (
            <p className="text-lg text-gray-600 mb-6">
              {lesson.description}
            </p>
          )}

          {/* Lesson Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            {lesson.estimatedTime && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{lesson.estimatedTime} min</span>
              </div>
            )}
            {lesson.difficultyLevel && (
              <div className="flex items-center gap-1">
                <BarChart className="w-4 h-4" />
                <span className="capitalize">{lesson.difficultyLevel}</span>
              </div>
            )}
            {lesson.tools && lesson.tools.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {lesson.tools.map((tool) => (
                  <span
                    key={tool}
                    className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Video Player (if available) */}
        {lesson.videoUrl && lesson.isFree && (
          <div className="mb-8 rounded-lg overflow-hidden bg-black aspect-video">
            <video
              src={lesson.videoUrl}
              controls
              className="w-full h-full"
              poster={lesson.videoUrl.replace('.mp4', '-poster.jpg')}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )}

        {/* Content Preview */}
        <div className="prose prose-lg max-w-none mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-8 relative">
            {lesson.isFree ? (
              // Show full content for free lessons
              <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
            ) : (
              // Show preview with blur for premium lessons
              <>
                <div className="relative">
                  <div className="whitespace-pre-wrap">{preview}</div>
                  {hasMore && (
                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
                  )}
                </div>
                {hasMore && (
                  <div className="mt-8 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-50 text-purple-700 mb-4">
                      <Lock className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Sign up to continue reading
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* CTA Section */}
        {!lesson.isFree && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-2">
              Unlock Full Access to This Lesson
            </h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Get unlimited access to all {lesson.lessonNumber + 1}+ lessons, exercises, and AI tool mastery content.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-blue-50">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button size="lg" variant="ghost" className="text-white border-white/30 hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Free Lesson CTA */}
        {lesson.isFree && (
          <div className="bg-gray-50 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Enjoying This Free Lesson?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Sign up to track your progress, save notes, and unlock {lesson.lessonNumber}+ more premium lessons.
            </p>
            <Link href="/auth/signup">
              <Button size="lg">
                Create Free Account
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default async function LessonPage({ params }: PageProps) {
  const resolvedParams = await params;
  const lesson = await getLesson(resolvedParams.id);

  if (!lesson) {
    notFound();
  }

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading lesson...</div>}>
      <LessonPreview lesson={lesson} />
    </Suspense>
  );
}
