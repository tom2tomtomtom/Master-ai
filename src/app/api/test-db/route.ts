import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const lessonCount = await prisma.lesson.count();
    console.log(`Found ${lessonCount} lessons in database`);
    
    // Test specific query that the lessons page uses
    const publishedLessons = await prisma.lesson.count({
      where: { isPublished: true }
    });
    console.log(`Found ${publishedLessons} published lessons`);
    
    // Get first lesson details
    const firstLesson = await prisma.lesson.findFirst({
      where: { isPublished: true },
      select: {
        id: true,
        lessonNumber: true,
        title: true,
        isPublished: true,
      },
      orderBy: { lessonNumber: 'asc' }
    });
    console.log('First lesson:', firstLesson);
    
    return NextResponse.json({
      success: true,
      totalLessons: lessonCount,
      publishedLessons: publishedLessons,
      firstLesson: firstLesson,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
      environment: process.env.NODE_ENV,
    }, { status: 500 });
  }
}