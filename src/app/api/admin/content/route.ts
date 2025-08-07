import { NextRequest, NextResponse } from 'next/server';
import { contentImporter } from '@/lib/content-importer';
import { contentParser } from '@/lib/content-parser';

// POST /api/admin/content - Trigger content import
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    switch (action) {
      case 'import':
        await contentImporter.importAllContent();
        const stats = await contentImporter.getImportStats();
        
        return NextResponse.json({
          message: 'Content imported successfully',
          stats,
        });

      case 'preview':
        const lessons = await contentParser.parseAllLessons();
        const categories = contentParser.getLearningPathCategories(lessons);
        
        return NextResponse.json({
          totalLessons: lessons.length,
          categories: Object.fromEntries(
            Array.from(categories.entries()).map(([name, lessons]) => [
              name,
              {
                count: lessons.length,
                lessons: lessons.slice(0, 5).map(l => ({
                  lessonNumber: l.lessonNumber,
                  title: l.title,
                  difficulty: l.difficultyLevel,
                  tools: l.tools,
                })),
              },
            ])
          ),
        });

      case 'validate':
        // Validate lesson files
        const validationResults = await validateLessonFiles();
        return NextResponse.json(validationResults);

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in content admin API:', error);
    return NextResponse.json(
      { error: 'Content operation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET /api/admin/content - Get content management statistics
export async function GET() {
  try {
    const stats = await contentImporter.getImportStats();
    const lessons = await contentParser.parseAllLessons();
    const categories = contentParser.getLearningPathCategories(lessons);

    return NextResponse.json({
      database: stats,
      files: {
        totalFiles: lessons.length,
        categories: Object.fromEntries(
          Array.from(categories.entries()).map(([name, lessons]) => [
            name,
            lessons.length,
          ])
        ),
      },
    });
  } catch (error) {
    console.error('Error getting content stats:', error);
    return NextResponse.json(
      { error: 'Failed to get content statistics' },
      { status: 500 }
    );
  }
}

async function validateLessonFiles() {
  try {
    const lessons = await contentParser.parseAllLessons();
    const issues: any[] = [];

    for (const lesson of lessons) {
      // Check for missing required fields
      if (!lesson.title || lesson.title === 'Untitled Lesson') {
        issues.push({
          lessonNumber: lesson.lessonNumber,
          type: 'warning',
          message: 'Missing or invalid title',
        });
      }

      if (!lesson.description || lesson.description.includes('No description available')) {
        issues.push({
          lessonNumber: lesson.lessonNumber,
          type: 'warning',
          message: 'Missing or auto-generated description',
        });
      }

      if (lesson.tools.length === 0) {
        issues.push({
          lessonNumber: lesson.lessonNumber,
          type: 'info',
          message: 'No AI tools detected',
        });
      }

      if (lesson.content.length < 500) {
        issues.push({
          lessonNumber: lesson.lessonNumber,
          type: 'warning',
          message: 'Content appears to be very short',
        });
      }

      // Check for duplicate lesson numbers
      const duplicates = lessons.filter(l => l.lessonNumber === lesson.lessonNumber);
      if (duplicates.length > 1) {
        issues.push({
          lessonNumber: lesson.lessonNumber,
          type: 'error',
          message: 'Duplicate lesson number detected',
        });
      }
    }

    return {
      totalLessons: lessons.length,
      issues,
      summary: {
        errors: issues.filter(i => i.type === 'error').length,
        warnings: issues.filter(i => i.type === 'warning').length,
        info: issues.filter(i => i.type === 'info').length,
      },
    };
  } catch (error) {
    throw new Error(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}