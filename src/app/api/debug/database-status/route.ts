import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Simple database status check endpoint
 */
export async function GET() {
  try {
    // Check database connection and lesson count
    const lessonCount = await prisma.lesson.count();
    const publishedCount = await prisma.lesson.count({ 
      where: { isPublished: true } 
    });
    
    // Get sample lessons
    const sampleLessons = await prisma.lesson.findMany({
      select: {
        lessonNumber: true,
        title: true,
        isPublished: true
      },
      orderBy: { lessonNumber: 'asc' },
      take: 3
    });
    
    return NextResponse.json({
      success: true,
      database: 'connected',
      stats: {
        totalLessons: lessonCount,
        publishedLessons: publishedCount,
        sampleLessons: sampleLessons
      },
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Database status check failed:', error);
    
    return NextResponse.json({
      success: false,
      database: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}