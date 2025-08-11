import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Testing Prisma database connection...');
    
    // Test basic Prisma connection
    const lessonCount = await prisma.lesson.count();
    console.log(`Found ${lessonCount} lessons`);
    
    // Test published lessons count
    const publishedCount = await prisma.lesson.count({
      where: { isPublished: true }
    });
    console.log(`Found ${publishedCount} published lessons`);
    
    // Get first lesson
    const firstLesson = await prisma.lesson.findFirst({
      select: {
        id: true,
        lessonNumber: true,
        title: true,
      },
      orderBy: { lessonNumber: 'asc' }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      totalLessons: lessonCount,
      publishedLessons: publishedCount,
      firstLesson: firstLesson,
      environment: process.env.NODE_ENV,
      hasDbUrl: !!process.env.DATABASE_URL,
      hasDirectDbUrl: !!process.env.DIRECT_DATABASE_URL,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      environment: process.env.NODE_ENV,
    }, { status: 500 });
  }
}