import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { appLogger } from '@/lib/logger';

const prisma = new PrismaClient();

interface LessonData {
  lessonNumber: number;
  title: string;
  description: string;
  content: string;
  htmlContent: string;
  tools: string[];
  estimatedTime: number;
  difficultyLevel: string;
  videoUrl?: string;
  videoDuration?: number;
  isFree: boolean;
}

/**
 * Admin API endpoint to import content into production database
 * Accepts JSON data with lessons to import
 */
export async function POST(request: NextRequest) {
  try {
    // Check if this is running in production environment
    const isDev = process.env.NODE_ENV === 'development';
    
    // For security, require a special header in production
    const importKey = request.headers.get('X-Import-Key');
    if (!isDev && importKey !== process.env.CONTENT_IMPORT_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid import key' },
        { status: 401 }
      );
    }

    appLogger.info('Starting content import via API', {
      environment: process.env.NODE_ENV,
      databaseUrlAvailable: !!process.env.DATABASE_URL
    });

    // Get JSON data from request body
    const body = await request.json();
    const lessons: LessonData[] = body.lessons || [];

    if (lessons.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No lessons data provided'
      }, { status: 400 });
    }

    appLogger.info('Starting lessons import', { totalLessons: lessons.length });

    // Import lessons
    let successCount = 0;
    let errorCount = 0;

    for (const lesson of lessons) {
      try {
        // Check if lesson already exists
        const existingLesson = await prisma.lesson.findUnique({
          where: { lessonNumber: lesson.lessonNumber }
        });

        if (existingLesson) {
          // Update existing lesson
          await prisma.lesson.update({
            where: { lessonNumber: lesson.lessonNumber },
            data: {
              title: lesson.title,
              description: lesson.description,
              content: lesson.content,
              videoUrl: lesson.videoUrl,
              videoDuration: lesson.videoDuration,
              estimatedTime: lesson.estimatedTime,
              difficultyLevel: lesson.difficultyLevel,
              tools: lesson.tools,
              isPublished: true,
              isFree: lesson.isFree,
            }
          });
          appLogger.info('Updated lesson', {
            lessonNumber: lesson.lessonNumber,
            title: lesson.title,
            action: 'update'
          });
        } else {
          // Create new lesson
          await prisma.lesson.create({
            data: {
              lessonNumber: lesson.lessonNumber,
              title: lesson.title,
              description: lesson.description,
              content: lesson.content,
              videoUrl: lesson.videoUrl,
              videoDuration: lesson.videoDuration,
              estimatedTime: lesson.estimatedTime,
              difficultyLevel: lesson.difficultyLevel,
              tools: lesson.tools,
              isPublished: true,
              isFree: lesson.isFree,
            }
          });
          appLogger.info('Created lesson', {
            lessonNumber: lesson.lessonNumber,
            title: lesson.title,
            action: 'create'
          });
        }

        successCount++;
      } catch (error) {
        appLogger.errors.apiError('content-import', error as Error, {
          context: 'lesson_import',
          lessonNumber: lesson.lessonNumber,
          lessonTitle: lesson.title
        });
        errorCount++;
      }
    }

    // Create learning paths
    await createLearningPaths();

    // Get final statistics
    const stats = await getImportStats();

    appLogger.info('Content import completed via API', {
      successful: successCount,
      failed: errorCount,
      total: lessons.length
    });

    return NextResponse.json({
      success: true,
      message: 'Content import completed successfully',
      importResults: {
        successful: successCount,
        failed: errorCount,
        total: lessons.length
      },
      stats: {
        totalLessons: stats.totalLessons,
        totalLearningPaths: stats.totalLearningPaths,
        lessonsByDifficulty: stats.lessonsByDifficulty,
        lessonsByTool: stats.lessonsByTool,
      }
    });

  } catch (error) {
    appLogger.errors.apiError('content-import', error as Error, {
      context: 'import_operation_failed'
    });
    
    return NextResponse.json({
      success: false,
      error: 'Content import failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500 
    });
  }
}

/**
 * Create learning paths
 */
async function createLearningPaths() {
  const learningPathConfigs = [
    {
      name: 'Text & Research AI Mastery',
      description: 'Master ChatGPT, Claude, Gemini, and Perplexity for advanced text generation and research tasks',
      targetAudience: 'Professionals, Researchers, Content Creators',
      estimatedHours: 25,
      difficultyLevel: 'beginner',
      color: '#3B82F6',
      icon: '💬',
      order: 1,
    },
    {
      name: 'Visual AI Creation',
      description: 'Create stunning visuals with DALL-E, Midjourney, and Stable Diffusion',
      targetAudience: 'Designers, Marketers, Creative Professionals',
      estimatedHours: 15,
      difficultyLevel: 'intermediate',
      color: '#8B5CF6',
      icon: '🎨',
      order: 2,
    },
    {
      name: 'Video & Audio AI',
      description: 'Generate professional videos and audio content with cutting-edge AI tools',
      targetAudience: 'Content Creators, Marketers, Media Professionals',
      estimatedHours: 12,
      difficultyLevel: 'intermediate',
      color: '#EF4444',
      icon: '🎬',
      order: 3,
    },
    {
      name: 'AI-Powered Productivity',
      description: 'Supercharge your workflow with AI-enhanced productivity tools',
      targetAudience: 'Business Professionals, Teams, Managers',
      estimatedHours: 18,
      difficultyLevel: 'beginner',
      color: '#10B981',
      icon: '⚡',
      order: 4,
    },
    {
      name: 'AI Automation & Integration',
      description: 'Build powerful automated workflows that connect your favorite tools',
      targetAudience: 'Operations Teams, Power Users, Entrepreneurs',
      estimatedHours: 20,
      difficultyLevel: 'advanced',
      color: '#F59E0B',
      icon: '🔗',
      order: 5,
    },
    {
      name: 'AI-Assisted Development',
      description: 'Accelerate your development process with AI coding assistants',
      targetAudience: 'Developers, Engineers, Technical Teams',
      estimatedHours: 10,
      difficultyLevel: 'intermediate',
      color: '#06B6D4',
      icon: '💻',
      order: 6,
    },
    {
      name: 'AI Business Strategy',
      description: 'Implement AI strategically across your organization for maximum ROI',
      targetAudience: 'Executives, Business Leaders, Consultants',
      estimatedHours: 22,
      difficultyLevel: 'advanced',
      color: '#DC2626',
      icon: '📊',
      order: 7,
    },
    {
      name: 'Advanced AI Implementation',
      description: 'Master complex AI implementations and become an AI transformation leader',
      targetAudience: 'AI Specialists, Senior Professionals, Innovation Leaders',
      estimatedHours: 30,
      difficultyLevel: 'expert',
      color: '#7C3AED',
      icon: '🚀',
      order: 8,
    },
  ];

  appLogger.info('Creating learning paths', { totalPaths: learningPathConfigs.length });

  for (const config of learningPathConfigs) {
    try {
      // Check if learning path already exists
      const existingPath = await prisma.learningPath.findFirst({
        where: { name: config.name }
      });

      if (existingPath) {
        // Update existing path
        await prisma.learningPath.update({
          where: { id: existingPath.id },
          data: {
            description: config.description,
            targetAudience: config.targetAudience,
            estimatedHours: config.estimatedHours,
            difficultyLevel: config.difficultyLevel,
            color: config.color,
            icon: config.icon,
            order: config.order,
          }
        });
        appLogger.info('Updated learning path', {
          name: config.name,
          action: 'update'
        });
      } else {
        // Create new path
        await prisma.learningPath.create({
          data: config
        });
        appLogger.info('Created learning path', {
          name: config.name,
          action: 'create'
        });
      }
    } catch (error) {
      appLogger.errors.apiError('content-import', error as Error, {
        context: 'learning_path_creation',
        pathName: config.name
      });
    }
  }
}

/**
 * Get import statistics
 */
async function getImportStats() {
  const totalLessons = await prisma.lesson.count();
  const totalLearningPaths = await prisma.learningPath.count();
  
  const lessons = await prisma.lesson.findMany({
    select: { difficultyLevel: true, tools: true }
  });

  const lessonsByDifficulty: Record<string, number> = {};
  const lessonsByTool: Record<string, number> = {};

  for (const lesson of lessons) {
    // Count by difficulty
    const difficulty = lesson.difficultyLevel || 'unknown';
    lessonsByDifficulty[difficulty] = (lessonsByDifficulty[difficulty] || 0) + 1;

    // Count by tools
    for (const tool of lesson.tools) {
      lessonsByTool[tool] = (lessonsByTool[tool] || 0) + 1;
    }
  }

  return {
    totalLessons,
    totalLearningPaths,
    lessonsByDifficulty,
    lessonsByTool,
  };
}

/**
 * GET endpoint to check import status and statistics
 */
export async function GET() {
  try {
    const stats = await getImportStats();
    
    return NextResponse.json({
      success: true,
      stats: {
        totalLessons: stats.totalLessons,
        totalLearningPaths: stats.totalLearningPaths,
        lessonsByDifficulty: stats.lessonsByDifficulty,
        lessonsByTool: stats.lessonsByTool,
      }
    });
  } catch (error) {
    appLogger.errors.apiError('content-import', error as Error, {
      context: 'get_import_stats'
    });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500 
    });
  }
}