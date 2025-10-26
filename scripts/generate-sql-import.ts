#!/usr/bin/env tsx

import * as fs from 'fs';

/**
 * Generate SQL INSERT statements for direct Supabase import
 * Creates SQL that can be copy/pasted into Supabase SQL Editor
 */

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

async function generateSQLImport() {
  try {
    console.log('🔄 Generating SQL import script...');
    
    // Load the lessons JSON data
    const jsonFilename = `lessons-data-compressed-${new Date().toISOString().split('T')[0]}.json`;
    
    if (!fs.existsSync(jsonFilename)) {
      console.error(`❌ JSON file not found: ${jsonFilename}`);
      console.log('Please run: npx tsx scripts/create-lesson-data-json.ts first');
      return;
    }
    
    const lessonsData = JSON.parse(fs.readFileSync(jsonFilename, 'utf8'));
    const lessons: LessonData[] = lessonsData.lessons || [];
    
    console.log(`📚 Processing ${lessons.length} lessons for SQL generation`);
    
    let sqlContent = `-- Master AI Lessons Import SQL Script
-- Generated: ${new Date().toISOString()}
-- Total Lessons: ${lessons.length}

-- First, let's check if there are existing lessons
-- SELECT COUNT(*) as existing_lessons FROM lessons;

-- Clear existing lessons if needed (UNCOMMENT ONLY IF YOU WANT TO START FRESH)
-- DELETE FROM lessons WHERE "lessonNumber" >= 0;

-- Insert all lessons with published status
`;

    let insertStatements: string[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (const lesson of lessons) {
      try {
        // Escape single quotes in content
        const title = lesson.title.replace(/'/g, "''");
        const description = (lesson.description || '').replace(/'/g, "''");
        const content = lesson.content.replace(/'/g, "''");
        const htmlContent = (lesson.htmlContent || '').replace(/'/g, "''");
        
        // Format tools array for PostgreSQL
        const toolsArray = lesson.tools.map(tool => `"${tool}"`).join(',');
        
        // Generate unique ID (using lesson number for predictability)
        const id = `lesson_${lesson.lessonNumber.toString().padStart(3, '0')}`;
        
        const insertStatement = `
-- Lesson ${lesson.lessonNumber}: ${lesson.title}
INSERT INTO lessons (
  id,
  "lessonNumber", 
  title, 
  description, 
  content, 
  "videoUrl", 
  "videoDuration", 
  "estimatedTime", 
  "difficultyLevel", 
  tools, 
  "isPublished", 
  "isFree",
  "createdAt",
  "updatedAt"
) VALUES (
  '${id}',
  ${lesson.lessonNumber},
  '${title}',
  '${description}',
  '${content}',
  ${lesson.videoUrl ? `'${lesson.videoUrl}'` : 'NULL'},
  ${lesson.videoDuration || 'NULL'},
  ${lesson.estimatedTime || 'NULL'},
  '${lesson.difficultyLevel}',
  ARRAY[${toolsArray}],
  true,
  ${lesson.isFree},
  NOW(),
  NOW()
) ON CONFLICT ("lessonNumber") DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  "videoUrl" = EXCLUDED."videoUrl",
  "videoDuration" = EXCLUDED."videoDuration",
  "estimatedTime" = EXCLUDED."estimatedTime",
  "difficultyLevel" = EXCLUDED."difficultyLevel",
  tools = EXCLUDED.tools,
  "isPublished" = true,
  "isFree" = EXCLUDED."isFree",
  "updatedAt" = NOW();`;

        insertStatements.push(insertStatement);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Error processing lesson ${lesson.lessonNumber}:`, error);
        errorCount++;
      }
    }

    // Add final verification queries
    sqlContent += insertStatements.join('\n\n');
    sqlContent += `

-- Verification queries (run these after import to check results)
SELECT 
  COUNT(*) as total_lessons,
  COUNT(CASE WHEN "isPublished" = true THEN 1 END) as published_lessons,
  COUNT(CASE WHEN "isPublished" = false THEN 1 END) as unpublished_lessons
FROM lessons;

-- Show first 5 lessons to verify data
SELECT "lessonNumber", title, "difficultyLevel", array_length(tools, 1) as tool_count, "isPublished"
FROM lessons 
ORDER BY "lessonNumber" 
LIMIT 5;

-- Show lessons by difficulty
SELECT "difficultyLevel", COUNT(*) as count
FROM lessons
GROUP BY "difficultyLevel"
ORDER BY count DESC;

-- Show total by publication status
SELECT "isPublished", COUNT(*) as count
FROM lessons
GROUP BY "isPublished";
`;

    // Write SQL file
    const sqlFilename = `import-lessons-supabase-${new Date().toISOString().split('T')[0]}.sql`;
    fs.writeFileSync(sqlFilename, sqlContent);

    console.log(`\n✅ SQL import script generated!`);
    console.log(`📝 File: ${sqlFilename}`);
    console.log(`📊 Statistics:`);
    console.log(`  ✅ Successfully processed: ${successCount} lessons`);
    console.log(`  ❌ Errors: ${errorCount} lessons`);
    console.log(`  📚 Total SQL size: ${Math.round(sqlContent.length / 1024)}KB`);

    console.log(`\n🎯 Next Steps:`);
    console.log(`1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/fsohtauqtcftdjcjfdpq/sql`);
    console.log(`2. Copy and paste the contents of: ${sqlFilename}`);
    console.log(`3. Execute the SQL script`);
    console.log(`4. Run verification queries to confirm import`);
    console.log(`5. Test the production website to see lessons`);

    // Also create a smaller test script for validation
    const testSqlContent = `-- Test query to check current lesson status
SELECT 
  COUNT(*) as total_lessons,
  COUNT(CASE WHEN "isPublished" = true THEN 1 END) as published_lessons,
  COUNT(CASE WHEN "isPublished" = false THEN 1 END) as unpublished_lessons,
  MIN("lessonNumber") as first_lesson,
  MAX("lessonNumber") as last_lesson
FROM lessons;

-- If you want to publish all existing lessons without importing new ones:
-- UPDATE lessons SET "isPublished" = true WHERE "isPublished" = false;
`;

    const testFilename = `test-lessons-status-${new Date().toISOString().split('T')[0]}.sql`;
    fs.writeFileSync(testFilename, testSqlContent);
    
    console.log(`\n📋 Also created test file: ${testFilename}`);
    console.log(`   Use this to check current database status first`);

  } catch (error) {
    console.error('❌ Failed to generate SQL:', error);
  }
}

generateSQLImport().catch(console.error);