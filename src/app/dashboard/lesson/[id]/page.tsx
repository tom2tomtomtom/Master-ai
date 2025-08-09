import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { LessonViewer } from '@/components/lesson/lesson-viewer';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pathId?: string }>;
}

async function getLesson(id: string): Promise<any> {
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

async function checkAccess(userId: string, lesson: any): Promise<boolean> {
  // Check if user has access to this lesson
  // For now, we'll allow access to all published lessons
  // In a real app, you might check subscription tiers, etc.
  
  if (lesson.isFree) {
    return true;
  }

  // Check user's subscription tier
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true, subscriptionStatus: true },
  });

  if (!user) {
    return false;
  }

  // Allow access if user has active subscription
  return user.subscriptionStatus === 'active' && user.subscriptionTier !== 'free';
}

function LessonViewerSkeleton(): JSX.Element {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-64"></div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-8"></div>
            </div>
          </div>
          <div className="pb-4">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full"></div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
              <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function LessonPage({ params, searchParams }: PageProps): Promise<JSX.Element> {
  const session = await getServerSession(authOptions);

  // For debugging and initial access, allow viewing lessons without auth
  // In production, you might want to redirect to signin instead
  const userId = session?.user?.id;

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const lesson = await getLesson(resolvedParams.id);

  if (!lesson) {
    notFound();
  }

  // Check access if user is authenticated, otherwise check if lesson is free
  let hasAccess = false;
  if (userId) {
    hasAccess = await checkAccess(userId, lesson);
  } else {
    // Allow access to free lessons for unauthenticated users
    hasAccess = lesson.isFree;
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Required
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This lesson requires a premium subscription to access.
          </p>
          <button
            onClick={() => window.history.back()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<LessonViewerSkeleton />}>
      <LessonViewer
        lesson={{
          id: lesson.id,
          lessonNumber: lesson.lessonNumber,
          title: lesson.title,
          description: lesson.description,
          content: lesson.content,
          videoUrl: lesson.videoUrl,
          videoDuration: lesson.videoDuration,
          estimatedTime: lesson.estimatedTime,
          difficultyLevel: lesson.difficultyLevel,
          tools: lesson.tools,
          isPublished: lesson.isPublished,
          isFree: lesson.isFree,
          createdAt: lesson.createdAt.toISOString(),
          updatedAt: lesson.updatedAt.toISOString(),
        }}
        pathId={resolvedSearchParams.pathId}
      />
    </Suspense>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<{ title: string; description?: string; openGraph?: { title: string; description: string; type: string; }; }> {
  const resolvedParams = await params;
  const lesson = await getLesson(resolvedParams.id);

  if (!lesson) {
    return {
      title: 'Lesson Not Found - Master AI',
    };
  }

  return {
    title: `Lesson ${lesson.lessonNumber}: ${lesson.title} - Master AI`,
    description: lesson.description || `Learn about ${lesson.title} in this comprehensive AI lesson.`,
    openGraph: {
      title: `Lesson ${lesson.lessonNumber}: ${lesson.title}`,
      description: lesson.description || `Learn about ${lesson.title} in this comprehensive AI lesson.`,
      type: 'article',
    },
  };
}